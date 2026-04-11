const express = require('express');
const router = express.Router();
const logger = require('../logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

async function fetchUser(userId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${USER_SERVICE_URL}/users/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.displayName || data.username,
      username: data.username,
      avatar: data.avatarUrl || null,
    };
  } catch {
    return null;
  }
}

module.exports = function (pool, redis) {
  // GET /conversations - List user's conversations
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.userId;

      const { rows: convos } = await pool.query(`
        SELECT id, participant1_id, participant2_id, product_id, created_at, updated_at
        FROM conversations
        WHERE participant1_id = $1 OR participant2_id = $1
        ORDER BY updated_at DESC
      `, [userId]);

      const result = await Promise.all(convos.map(async (conv) => {
        // Build participants
        const p1 = await fetchUser(conv.participant1_id);
        const p2 = await fetchUser(conv.participant2_id);
        const participants = [
          p1 || { id: conv.participant1_id, name: 'Unknown', username: 'unknown', avatar: null },
          p2 || { id: conv.participant2_id, name: 'Unknown', username: 'unknown', avatar: null },
        ];

        // Get last message
        const { rows: msgs } = await pool.query(
          'SELECT id, sender_id, original_text, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1',
          [conv.id]
        );
        const lastMessage = msgs[0]
          ? { content: msgs[0].original_text, senderId: msgs[0].sender_id, timestamp: msgs[0].created_at }
          : undefined;

        // Unread count via Redis or fallback
        let unreadCount = 0;
        if (redis) {
          try {
            const count = await redis.hget(`unread:${userId}`, conv.id);
            unreadCount = parseInt(count) || 0;
          } catch { /* ignore */ }
        }

        return {
          id: conv.id,
          type: 'direct',
          participants,
          product: conv.product_id ? { id: conv.product_id, name: '', image: '', price: 0 } : undefined,
          lastMessage,
          unreadCount,
          isMuted: false,
          updatedAt: conv.updated_at,
          // Legacy fields for frontend compatibility
          participant1_id: conv.participant1_id,
          participant2_id: conv.participant2_id,
        };
      }));

      res.json(result);
    } catch (err) {
      logger.error('Failed to list conversations', { error: err.message });
      res.status(500).json({ error: 'Failed to list conversations' });
    }
  });

  // POST /conversations - Create or find existing conversation
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const { sellerId, participantId, productId } = req.body;
      const otherId = sellerId || participantId;

      if (!otherId) {
        return res.status(400).json({ error: 'sellerId or participantId is required' });
      }

      // Check for existing conversation between these users
      const { rows: existing } = await pool.query(`
        SELECT id FROM conversations
        WHERE (participant1_id = $1 AND participant2_id = $2)
           OR (participant1_id = $2 AND participant2_id = $1)
        ORDER BY updated_at DESC LIMIT 1
      `, [userId, otherId]);

      if (existing.length > 0) {
        return res.json({ id: existing[0].id, existing: true });
      }

      // Create new conversation
      const { rows: [conv] } = await pool.query(`
        INSERT INTO conversations (participant1_id, participant1_type, participant2_id, participant2_type, product_id)
        VALUES ($1, 'user', $2, 'user', $3)
        RETURNING id, created_at, updated_at
      `, [userId, otherId, productId || null]);

      logger.info('Conversation created', { conversationId: conv.id, userId });

      res.status(201).json({
        id: conv.id,
        existing: false,
        createdAt: conv.created_at,
      });
    } catch (err) {
      logger.error('Failed to create conversation', { error: err.message });
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // GET /conversations/:id - Get single conversation
  router.get('/:id', async (req, res) => {
    try {
      const userId = req.user.userId;
      const convId = req.params.id;

      const { rows: [conv] } = await pool.query(
        'SELECT * FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)',
        [convId, userId]
      );
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const p1 = await fetchUser(conv.participant1_id);
      const p2 = await fetchUser(conv.participant2_id);

      res.json({
        id: conv.id,
        type: 'direct',
        participants: [
          p1 || { id: conv.participant1_id, name: 'Unknown', username: 'unknown', avatar: null },
          p2 || { id: conv.participant2_id, name: 'Unknown', username: 'unknown', avatar: null },
        ],
        product: conv.product_id ? { id: conv.product_id, name: '', image: '', price: 0 } : undefined,
        updatedAt: conv.updated_at,
      });
    } catch (err) {
      logger.error('Failed to get conversation', { error: err.message });
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  });

  // POST /conversations/support - Create support conversation
  router.post('/support', async (req, res) => {
    try {
      const userId = req.user.userId;
      const { message, category } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const BOT_USER_ID = process.env.BOT_USER_ID || '00000000-0000-0000-0000-000000000001';

      // Check for existing support conversation
      const { rows: existing } = await pool.query(`
        SELECT id FROM conversations
        WHERE (participant1_id = $1 AND participant2_id = $2)
           OR (participant1_id = $2 AND participant2_id = $1)
        ORDER BY updated_at DESC LIMIT 1
      `, [userId, BOT_USER_ID]);

      let convId;
      let isExisting = false;

      if (existing.length > 0) {
        convId = existing[0].id;
        isExisting = true;
      } else {
        const { rows: [conv] } = await pool.query(`
          INSERT INTO conversations (participant1_id, participant1_type, participant2_id, participant2_type)
          VALUES ($1, 'user', $2, 'bot')
          RETURNING id
        `, [userId, BOT_USER_ID]);
        convId = conv.id;
      }

      // Send the initial message
      const { rows: [msg] } = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, type)
        VALUES ($1, $2, 'user', $3, 'text')
        RETURNING id, conversation_id, sender_id, original_text, type, metadata, created_at
      `, [convId, userId, message.trim()]);

      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

      if (redis) {
        await redis.hincrby(`unread:${BOT_USER_ID}`, convId, 1);
      }

      const messageData = {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.original_text,
        type: msg.type,
        metadata: msg.metadata,
        isEdited: false,
        createdAt: msg.created_at,
      };

      if (redis) {
        await redis.publish('chat:new_message', JSON.stringify({
          ...messageData,
          conversationId: convId,
        }));
        await redis.sadd('support:conversations', convId);
        await redis.hmset(`support:meta:${convId}`, { category: category || 'general', userId });
      }

      logger.info('Support conversation created', { conversationId: convId, userId });

      res.status(201).json({
        id: convId,
        existing: isExisting,
        message: messageData,
      });
    } catch (err) {
      logger.error('Failed to create support conversation', { error: err.message });
      res.status(500).json({ error: 'Failed to create support conversation' });
    }
  });

  // PATCH /conversations/:id/read - Mark as read
  router.patch('/:id/read', async (req, res) => {
    try {
      const userId = req.user.userId;
      const convId = req.params.id;

      // Update read_at on the user's messages
      await pool.query(
        'UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
        [convId, userId]
      );

      if (redis) {
        await redis.hdel(`unread:${userId}`, convId);
        await redis.publish('chat:read_update', JSON.stringify({
          conversationId: convId,
          userId,
          readAt: new Date().toISOString(),
        }));
      }

      res.json({ success: true });
    } catch (err) {
      logger.error('Failed to mark as read', { error: err.message });
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  });

  // PATCH /conversations/:id/mute - Toggle mute (no-op with current schema)
  router.patch('/:id/mute', async (req, res) => {
    res.json({ isMuted: false });
  });

  return router;
};
