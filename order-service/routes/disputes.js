const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

const VALID_REASONS = ['not_as_described', 'not_received', 'counterfeit', 'damaged', 'wrong_item', 'other'];
const VALID_RESOLUTIONS = ['buyer_refund', 'seller_paid', 'partial_refund', 'cancelled'];
const VALID_OFFERS = ['refund', 'partial_refund', 'replacement'];

module.exports = function(pool, redis) {
  const router = express.Router();

  // POST /orders/:id/dispute — Open a dispute on an order
  router.post('/orders/:id/dispute', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, description } = req.body;

      if (!reason || !VALID_REASONS.includes(reason)) {
        return res.status(400).json({
          error: `reason is required and must be one of: ${VALID_REASONS.join(', ')}`,
        });
      }

      // Fetch the order
      const { rows: orderRows } = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (orderRows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderRows[0];

      // Only buyer or seller can dispute
      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to dispute this order' });
      }

      // Can only dispute orders in delivered or shipped status
      if (!['delivered', 'shipped'].includes(order.status)) {
        return res.status(400).json({
          error: `Cannot dispute order in "${order.status}" status. Order must be in "shipped" or "delivered" status.`,
        });
      }

      // Check if there's already an open dispute for this order
      const { rows: existingDisputes } = await pool.query(
        "SELECT id FROM disputes WHERE order_id = $1 AND status IN ('open', 'under_review')",
        [id]
      );

      if (existingDisputes.length > 0) {
        return res.status(409).json({ error: 'An open dispute already exists for this order' });
      }

      const disputeId = uuidv4();

      // Create the dispute and update escrow status in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(`
          INSERT INTO disputes (id, order_id, initiated_by, reason, description, status)
          VALUES ($1, $2, $3, $4, $5, 'open')
        `, [disputeId, id, req.user.id, reason, description || null]);

        await client.query(`
          UPDATE orders
          SET escrow_status = 'disputed', updated_at = NOW()
          WHERE id = $1
        `, [id]);

        // Log the dispute event
        await client.query(`
          INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
          VALUES ($1, $2, 'dispute_opened', $3, $4, $5)
        `, [
          uuidv4(), id, req.user.id,
          order.buyer_id === req.user.id ? 'buyer' : 'seller',
          JSON.stringify({ dispute_id: disputeId, reason }),
        ]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      // Invalidate any cached order data
      await redis.del(`order:${id}`).catch(() => {});

      logger.info('Dispute opened', { disputeId, orderId: id, reason, userId: req.user.id });

      const { rows: disputeRows } = await pool.query(
        'SELECT * FROM disputes WHERE id = $1',
        [disputeId]
      );

      res.status(201).json(disputeRows[0]);
    } catch (err) {
      logger.error('Failed to open dispute', { error: err.message });
      res.status(500).json({ error: 'Failed to open dispute' });
    }
  });

  // GET /me/disputes — List user's disputes (as buyer or seller)
  router.get('/me/disputes', async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const conditions = [];
      const params = [];
      let paramIdx = 1;

      // User can see disputes where they are buyer or seller on the order
      conditions.push(`(o.buyer_id = $${paramIdx} OR o.seller_id = $${paramIdx})`);
      params.push(req.user.id);
      paramIdx++;

      if (status) {
        conditions.push(`d.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const limitVal = Math.min(parseInt(limit) || 50, 200);
      const offsetVal = parseInt(offset) || 0;

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM disputes d
         JOIN orders o ON o.id = d.order_id
         WHERE ${conditions.join(' AND ')}`,
        params
      );

      const { rows } = await pool.query(`
        SELECT d.*, o.order_number, o.product_name, o.product_image, o.item_price,
               o.buyer_id, o.seller_id, o.status AS order_status, o.escrow_status
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY d.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limitVal, offsetVal]);

      res.json({
        disputes: rows,
        pagination: {
          total: countResult.rows[0].total,
          limit: limitVal,
          offset: offsetVal,
          hasMore: offsetVal + limitVal < countResult.rows[0].total,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch disputes', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /disputes/:id — Get dispute details (only participants can view)
  router.get('/disputes/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(`
        SELECT d.*, o.order_number, o.product_name, o.product_image, o.item_price,
               o.total_buyer_pays, o.seller_payout, o.buyer_id, o.seller_id,
               o.status AS order_status, o.escrow_status
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        WHERE d.id = $1
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const dispute = rows[0];

      // Only buyer or seller on the order can view the dispute
      if (dispute.buyer_id !== req.user.id && dispute.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this dispute' });
      }

      // Get dispute-related order events for the timeline
      const events = await pool.query(`
        SELECT * FROM order_events
        WHERE order_id = $1 AND event_type LIKE 'dispute%'
        ORDER BY created_at ASC
      `, [dispute.order_id]);

      res.json({ ...dispute, events: events.rows });
    } catch (err) {
      logger.error('Failed to fetch dispute', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /disputes/:id/respond — Seller responds to a dispute
  router.post('/disputes/:id/respond', async (req, res) => {
    try {
      const { id } = req.params;
      const { response, offer } = req.body;

      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        return res.status(400).json({ error: 'response text is required' });
      }

      if (offer && !VALID_OFFERS.includes(offer)) {
        return res.status(400).json({
          error: `offer must be one of: ${VALID_OFFERS.join(', ')}`,
        });
      }

      // Fetch the dispute with order details
      const { rows } = await pool.query(`
        SELECT d.*, o.buyer_id, o.seller_id
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        WHERE d.id = $1
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const dispute = rows[0];

      // Only the seller can respond
      if (dispute.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the seller can respond to a dispute' });
      }

      // Dispute must be open
      if (dispute.status !== 'open') {
        return res.status(400).json({ error: `Cannot respond to a dispute in "${dispute.status}" status` });
      }

      // Update dispute status to under_review
      const updated = await pool.query(`
        UPDATE disputes
        SET status = 'under_review', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      // Log the response event
      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
        VALUES ($1, $2, 'dispute_response', $3, 'seller', $4)
      `, [
        uuidv4(), dispute.order_id, req.user.id,
        JSON.stringify({ response: response.trim(), offer: offer || null }),
      ]);

      logger.info('Dispute response submitted', { disputeId: id, sellerId: req.user.id, offer });

      res.json(updated.rows[0]);
    } catch (err) {
      logger.error('Failed to respond to dispute', { error: err.message });
      res.status(500).json({ error: 'Failed to respond to dispute' });
    }
  });

  // POST /disputes/:id/resolve — Resolve a dispute (admin, or could be extended to participants for agreed resolutions)
  router.post('/disputes/:id/resolve', async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, resolution_notes } = req.body;

      if (!resolution || !VALID_RESOLUTIONS.includes(resolution)) {
        return res.status(400).json({
          error: `resolution is required and must be one of: ${VALID_RESOLUTIONS.join(', ')}`,
        });
      }

      // Fetch the dispute with order details
      const { rows } = await pool.query(`
        SELECT d.*, o.buyer_id, o.seller_id, o.seller_payout, o.item_price, o.platform_fee
        FROM disputes d
        JOIN orders o ON o.id = d.order_id
        WHERE d.id = $1
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const dispute = rows[0];

      // Only participants (or admin) can resolve — for now allow buyer, seller, or admin
      // Admin check: req.user.role === 'admin'
      const isParticipant = dispute.buyer_id === req.user.id || dispute.seller_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isParticipant && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to resolve this dispute' });
      }

      // Dispute must be open or under_review
      if (!['open', 'under_review'].includes(dispute.status)) {
        return res.status(400).json({ error: `Cannot resolve a dispute in "${dispute.status}" status` });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Resolve the dispute
        await client.query(`
          UPDATE disputes
          SET status = 'resolved', resolution = $2, resolution_notes = $3,
              resolved_by = $4, resolved_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [id, resolution, resolution_notes || null, req.user.id]);

        // Update the order based on the resolution
        if (resolution === 'buyer_refund') {
          // Full refund to buyer — escrow released back, order refunded
          await client.query(`
            UPDATE orders
            SET escrow_status = 'refunded', escrow_released_at = NOW(),
                status = 'refunded', updated_at = NOW()
            WHERE id = $1
          `, [dispute.order_id]);
        } else if (resolution === 'seller_paid') {
          // Seller wins — escrow released to seller
          await client.query(`
            UPDATE orders
            SET escrow_status = 'released', escrow_released_at = NOW(),
                status = 'completed', updated_at = NOW()
            WHERE id = $1
          `, [dispute.order_id]);

          // Create payout for seller
          await client.query(`
            INSERT INTO payouts (id, seller_id, order_id, gross_amount, fee_amount, net_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
          `, [
            uuidv4(), dispute.seller_id, dispute.order_id,
            dispute.item_price, dispute.platform_fee, dispute.seller_payout,
          ]);
        } else if (resolution === 'partial_refund') {
          // Partial refund — mark escrow as released, order completed
          await client.query(`
            UPDATE orders
            SET escrow_status = 'released', escrow_released_at = NOW(),
                status = 'completed', updated_at = NOW()
            WHERE id = $1
          `, [dispute.order_id]);
        } else if (resolution === 'cancelled') {
          // Dispute cancelled — restore escrow to held state
          await client.query(`
            UPDATE orders
            SET escrow_status = 'held', updated_at = NOW()
            WHERE id = $1
          `, [dispute.order_id]);
        }

        // Log the resolution event
        await client.query(`
          INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
          VALUES ($1, $2, 'dispute_resolved', $3, $4, $5)
        `, [
          uuidv4(), dispute.order_id, req.user.id,
          isAdmin ? 'admin' : (dispute.buyer_id === req.user.id ? 'buyer' : 'seller'),
          JSON.stringify({ resolution, resolution_notes: resolution_notes || null }),
        ]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      // Invalidate cache
      await redis.del(`order:${dispute.order_id}`).catch(() => {});

      logger.info('Dispute resolved', { disputeId: id, resolution, resolvedBy: req.user.id });

      const { rows: updatedRows } = await pool.query(
        'SELECT * FROM disputes WHERE id = $1',
        [id]
      );

      res.json(updatedRows[0]);
    } catch (err) {
      logger.error('Failed to resolve dispute', { error: err.message });
      res.status(500).json({ error: 'Failed to resolve dispute' });
    }
  });

  return router;
};
