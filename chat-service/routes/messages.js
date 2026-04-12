const express = require('express');
const router = express.Router({ mergeParams: true });
const logger = require('../logger');
const { checkMessage } = require('../flagging');
const { messagesTotal } = require('../metrics');

module.exports = function (pool, redis) {
  const translationService = require('../lib/translation.js')(redis);
  const translationEnabled = translationService.init();

  // Translate a message for the other participant's locale
  async function translateForRecipient(messageId, content, senderLocale, convId, senderId) {
    if (!translationEnabled || !senderLocale) return;
    try {
      // Get the other participant's ID
      const { rows: [conv] } = await pool.query(
        'SELECT participant1_id, participant2_id FROM conversations WHERE id = $1',
        [convId]
      );
      if (!conv) return;

      const recipientId = conv.participant1_id === senderId ? conv.participant2_id : conv.participant1_id;

      // Get recipient's preferred language
      const { rows: [pref] } = await pool.query(
        'SELECT preferred_language FROM user_language_preferences WHERE user_id = $1',
        [recipientId]
      );

      const recipientLocale = pref?.preferred_language;
      if (!recipientLocale || recipientLocale === senderLocale) return;

      const senderLang = translationService.LOCALE_TO_LANG?.[senderLocale] || senderLocale.split('-')[0];
      const targetLang = translationService.LOCALE_TO_LANG?.[recipientLocale] || recipientLocale.split('-')[0];
      if (targetLang === senderLang) return;

      const translated = await translationService.cachedTranslate(content, senderLang, targetLang);
      if (!translated || translated === content) return;

      const translations = { [recipientLocale]: translated };

      await pool.query(
        'UPDATE messages SET translations = $1 WHERE id = $2',
        [JSON.stringify(translations), messageId]
      );

      // Publish so WebSocket delivers the translation in real-time
      if (redis) {
        await redis.publish('chat:message_translated', JSON.stringify({
          messageId, conversationId: convId, translations,
        }));
      }

      logger.info('Chat message translated', { messageId, from: senderLocale, to: recipientLocale });
    } catch (err) {
      logger.error('translateForRecipient failed', { messageId, error: err.message });
    }
  }

  // GET /conversations/:id/messages - Paginated messages
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const convId = req.params.id;
      const cursor = req.query.cursor;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);

      // Verify participant
      const { rows: [conv] } = await pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)',
        [convId, userId]
      );
      if (!conv) {
        return res.status(403).json({ error: 'Not a participant in this conversation' });
      }

      let query;
      let params;

      if (cursor) {
        query = `
          SELECT id, conversation_id, sender_id, original_text, type, metadata, translations, original_language, created_at, read_at
          FROM messages
          WHERE conversation_id = $1 AND created_at < $2
          ORDER BY created_at DESC
          LIMIT $3
        `;
        params = [convId, cursor, limit + 1];
      } else {
        query = `
          SELECT id, conversation_id, sender_id, original_text, type, metadata, translations, original_language, created_at, read_at
          FROM messages
          WHERE conversation_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `;
        params = [convId, limit + 1];
      }

      const { rows } = await pool.query(query, params);

      const hasMore = rows.length > limit;
      const messages = rows.slice(0, limit).reverse();

      const result = messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.original_text,
        type: msg.type || 'text',
        metadata: msg.metadata,
        isEdited: false,
        translations: msg.translations || null,
        createdAt: msg.created_at,
        readAt: msg.read_at || null,
      }));

      res.json({
        messages: result,
        hasMore,
        nextCursor: hasMore ? messages[0].created_at : null,
      });
    } catch (err) {
      logger.error('Failed to fetch messages', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // POST /conversations/:id/messages - Send message
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const convId = req.params.id;
      const { content, type: msgType, sender_locale } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Verify participant
      const { rows: [conv] } = await pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)',
        [convId, userId]
      );
      if (!conv) {
        return res.status(403).json({ error: 'Not a participant in this conversation' });
      }

      const type = msgType || 'text';
      const flagResult = await checkMessage(content);

      // Update sender's language preference if provided
      if (sender_locale) {
        await pool.query(`
          INSERT INTO user_language_preferences (user_id, user_type, preferred_language, auto_translate)
          VALUES ($1, 'user', $2, true)
          ON CONFLICT (user_id, user_type) DO UPDATE SET preferred_language = $2, updated_at = NOW()
        `, [userId, sender_locale]);
      }

      // Insert message
      const { rows: [msg] } = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, type, metadata)
        VALUES ($1, $2, 'user', $3, $4, $5, $6)
        RETURNING id, conversation_id, sender_id, original_text, type, metadata, created_at
      `, [convId, userId, content.trim(), sender_locale || null, type, flagResult.flagged ? JSON.stringify({ flagged: true }) : null]);

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

      const message = {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.original_text,
        type: msg.type,
        metadata: msg.metadata,
        isEdited: false,
        createdAt: msg.created_at,
      };

      // Publish to WebSocket
      if (redis) {
        await redis.publish('chat:new_message', JSON.stringify({
          ...message,
          conversationId: convId,
        }));
      }

      messagesTotal.inc({ type });

      if (flagResult.flagged) {
        logger.warn('Message flagged', { messageId: msg.id, term: flagResult.term, userId });
      }

      res.status(201).json(message);

      // Fire-and-forget translation
      if (sender_locale && type === 'text') {
        translateForRecipient(msg.id, content.trim(), sender_locale, convId, userId).catch(() => {});
      }
    } catch (err) {
      logger.error('Failed to send message', { error: err.message });
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  return router;
};
