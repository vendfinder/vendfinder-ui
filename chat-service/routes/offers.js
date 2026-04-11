const express = require('express');
const router = express.Router({ mergeParams: true });
const logger = require('../logger');
const { offersTotal } = require('../metrics');

module.exports = function (pool, redis) {
  // POST /conversations/:id/offers - Create offer
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const convId = req.params.id;
      const { price, expiresInHours } = req.body;

      if (!price || price <= 0) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      // Verify participant
      const { rows: partCheck } = await pool.query(
        "SELECT id FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)",
        [convId, userId]
      );
      if (partCheck.length === 0) {
        return res.status(403).json({ error: 'Not a participant in this conversation' });
      }

      // Verify conversation has a product
      const { rows: [conv] } = await pool.query(
        'SELECT product_id, product_name, product_price FROM conversations WHERE id = $1',
        [convId]
      );
      if (!conv || !conv.product_id) {
        return res.status(400).json({ error: 'Offers can only be made in product conversations' });
      }

      const expiresAt = new Date(Date.now() + (expiresInHours || 24) * 60 * 60 * 1000);

      // Insert offer message
      const offerBody = `Offer: $${parseFloat(price).toFixed(2)}`;
      const { rows: [msg] } = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, body, type, metadata)
        VALUES ($1, $2, $3, 'offer', $4)
        RETURNING id, conversation_id, sender_id, body, type, metadata, created_at
      `, [convId, userId, offerBody, JSON.stringify({ proposedPrice: price })]);

      // Insert offer row
      const { rows: [offer] } = await pool.query(`
        INSERT INTO offers (conversation_id, message_id, sender_id, proposed_price, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, conversation_id, message_id, sender_id, proposed_price, status, expires_at, created_at
      `, [convId, msg.id, userId, price, expiresAt]);

      // Update conversation
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

      const message = {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.body,
        type: 'offer',
        metadata: {
          offerId: offer.id,
          proposedPrice: parseFloat(offer.proposed_price),
          status: offer.status,
          expiresAt: offer.expires_at,
        },
        createdAt: msg.created_at,
      };

      // Publish to Redis
      if (redis) {
        await redis.publish('chat:new_message', JSON.stringify(message));
      }

      offersTotal.inc({ status: 'pending' });

      res.status(201).json({
        offer: {
          id: offer.id,
          conversationId: offer.conversation_id,
          messageId: offer.message_id,
          senderId: offer.sender_id,
          proposedPrice: parseFloat(offer.proposed_price),
          status: offer.status,
          expiresAt: offer.expires_at,
          createdAt: offer.created_at,
        },
        message,
      });
    } catch (err) {
      logger.error('Failed to create offer', { error: err.message });
      res.status(500).json({ error: 'Failed to create offer' });
    }
  });

  // PATCH /offers/:offerId - Accept/Decline/Counter
  router.patch('/:offerId', async (req, res) => {
    try {
      const userId = req.user.userId;
      const offerId = req.params.offerId;
      const { action, counterPrice } = req.body;

      if (!['accept', 'decline', 'counter'].includes(action)) {
        return res.status(400).json({ error: 'Action must be accept, decline, or counter' });
      }

      // Get the offer
      const { rows: [offer] } = await pool.query(
        'SELECT * FROM offers WHERE id = $1',
        [offerId]
      );
      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Offer is no longer pending' });
      }

      // Verify the responder is a participant (and not the sender)
      const { rows: partCheck } = await pool.query(
        "SELECT id FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)",
        [offer.conversation_id, userId]
      );
      if (partCheck.length === 0) {
        return res.status(403).json({ error: 'Not a participant' });
      }

      if (offer.sender_id === userId && action !== 'cancel') {
        // Sender can only cancel their own offer (if we add that)
      }

      const convId = offer.conversation_id;
      let newStatus;
      let systemMsg;

      if (action === 'accept') {
        newStatus = 'accepted';
        systemMsg = `Offer of $${parseFloat(offer.proposed_price).toFixed(2)} accepted`;

        await pool.query(
          "UPDATE offers SET status = 'accepted', resolved_at = NOW() WHERE id = $1",
          [offerId]
        );
      } else if (action === 'decline') {
        newStatus = 'declined';
        systemMsg = `Offer of $${parseFloat(offer.proposed_price).toFixed(2)} declined`;

        await pool.query(
          "UPDATE offers SET status = 'declined', resolved_at = NOW() WHERE id = $1",
          [offerId]
        );
      } else if (action === 'counter') {
        if (!counterPrice || counterPrice <= 0) {
          return res.status(400).json({ error: 'Counter price is required' });
        }

        newStatus = 'countered';
        systemMsg = `Counter offer: $${parseFloat(counterPrice).toFixed(2)}`;

        // Mark original as countered
        await pool.query(
          "UPDATE offers SET status = 'countered', resolved_at = NOW() WHERE id = $1",
          [offerId]
        );

        // Create counter offer message
        const { rows: [counterMsg] } = await pool.query(`
          INSERT INTO messages (conversation_id, sender_id, body, type, metadata)
          VALUES ($1, $2, $3, 'offer', $4)
          RETURNING id, conversation_id, sender_id, body, type, metadata, created_at
        `, [convId, userId, `Counter offer: $${parseFloat(counterPrice).toFixed(2)}`, JSON.stringify({ proposedPrice: counterPrice })]);

        // Create new offer
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(`
          INSERT INTO offers (conversation_id, message_id, sender_id, proposed_price, counter_offer_id, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [convId, counterMsg.id, userId, counterPrice, offerId, expiresAt]);

        if (redis) {
          await redis.publish('chat:new_message', JSON.stringify({
            id: counterMsg.id,
            conversationId: convId,
            senderId: userId,
            content: counterMsg.body,
            type: 'offer',
            metadata: { proposedPrice: counterPrice },
            createdAt: counterMsg.created_at,
          }));
        }
      }

      // Insert system message
      await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, body, type)
        VALUES ($1, $2, $3, 'system')
      `, [convId, userId, systemMsg]);

      // Update conversation
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

      // Publish offer update
      if (redis) {
        await redis.publish('chat:offer_update', JSON.stringify({
          offerId,
          conversationId: convId,
          status: newStatus,
          userId,
        }));
      }

      res.json({ success: true, status: newStatus });
    } catch (err) {
      logger.error('Failed to update offer', { error: err.message });
      res.status(500).json({ error: 'Failed to update offer' });
    }
  });

  return router;
};
