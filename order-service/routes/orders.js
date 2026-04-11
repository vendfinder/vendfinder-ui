const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3007';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

async function triggerKycCheck(sellerId, pool) {
  if (!INTERNAL_SERVICE_TOKEN) return;
  try {
    // Compute 30-day and lifetime revenue for this seller
    const { rows: [totals] } = await pool.query(`
      SELECT
        COALESCE(SUM(seller_payout * 100), 0)::bigint AS lifetime_cents,
        COALESCE(SUM(seller_payout * 100) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::bigint AS revenue_30d_cents
      FROM orders
      WHERE seller_id = $1 AND status NOT IN ('cancelled','refunded')
    `, [sellerId]);

    const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${USER_SERVICE_URL}/auth/kyc-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Service-Token': INTERNAL_SERVICE_TOKEN },
      body: JSON.stringify({
        user_id: sellerId,
        lifetime_cents: totals.lifetime_cents,
        revenue_30d_cents: totals.revenue_30d_cents,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    logger.warn('KYC check trigger failed', { error: err.message });
  }
}

async function sendOrderShippedEmail(order, trackingNumber, carrier) {
  if (!INTERNAL_SERVICE_TOKEN) return;
  try {
    const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(`${EMAIL_SERVICE_URL}/send/order-shipped`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Service-Token': INTERNAL_SERVICE_TOKEN },
      body: JSON.stringify({
        buyerId: order.buyer_id,
        orderNumber: order.order_number,
        productName: order.product_name,
        trackingNumber: trackingNumber,
        carrier: carrier,
        sellerName: order.seller_name || 'Seller',
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    logger.info('Order shipped email sent', { orderId: order.id });
  } catch (err) {
    logger.warn('Failed to send order shipped email', { error: err.message, orderId: order.id });
  }
}

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET / — list orders (query: role=buyer|seller)
  router.get('/', async (req, res) => {
    try {
      const { role = 'buyer', status, limit = 50, offset = 0 } = req.query;

      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (role === 'seller') {
        conditions.push(`o.seller_id = $${paramIdx}`);
      } else {
        conditions.push(`o.buyer_id = $${paramIdx}`);
      }
      params.push(req.user.id);
      paramIdx++;

      if (status) {
        conditions.push(`o.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const limitVal = Math.min(parseInt(limit) || 50, 200);
      const offsetVal = parseInt(offset) || 0;

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM orders o WHERE ${conditions.join(' AND ')}`,
        params
      );

      const { rows } = await pool.query(`
        SELECT o.*
        FROM orders o
        WHERE ${conditions.join(' AND ')}
        ORDER BY o.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limitVal, offsetVal]);

      res.json({
        orders: rows,
        pagination: {
          total: countResult.rows[0].total,
          limit: limitVal,
          offset: offsetVal,
          hasMore: offsetVal + limitVal < countResult.rows[0].total,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch orders', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /me/purchases — buyer's purchases
  router.get('/me/purchases', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT o.* FROM orders o
        WHERE o.buyer_id = $1
        ORDER BY o.created_at DESC
      `, [req.user.id]);

      // Transform to Purchase[] shape
      const purchases = rows.map(row => ({
        id: row.id,
        productName: row.product_name,
        productImage: row.product_image,
        category: row.product_category,
        size: row.size,
        price: parseFloat(row.total_buyer_pays),
        status: mapOrderStatusToPurchaseStatus(row.status),
        date: row.created_at,
        trackingNumber: row.tracking_number,
        carrier: row.carrier,
        sellerId: row.seller_id,
        sellerName: row.seller_name || 'Seller'
      }));

      res.json({ purchases });
    } catch (err) {
      logger.error('Failed to fetch purchases', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /me/sales — seller's sales (ONLY SUCCESSFUL TRANSACTIONS)
  router.get('/me/sales', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT o.* FROM orders o
        WHERE o.seller_id = $1
          AND o.status IN ('processing', 'shipped', 'delivered', 'completed')
        ORDER BY o.created_at DESC
      `, [req.user.id]);

      res.json({ sales: rows });
    } catch (err) {
      logger.error('Failed to fetch sales', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id — single order (participant only)
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];
      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this order' });
      }

      // Get order events
      const events = await pool.query(
        'SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC',
        [id]
      );

      res.json({ ...order, events: events.rows });
    } catch (err) {
      logger.error('Failed to fetch order', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /:id/ship — seller marks shipped
  router.patch('/:id/ship', async (req, res) => {
    try {
      const { id } = req.params;
      const { trackingNumber, carrier } = req.body;

      if (!trackingNumber || !String(trackingNumber).trim()) {
        return res.status(400).json({ error: 'Tracking number is required' });
      }
      if (!carrier || !String(carrier).trim()) {
        return res.status(400).json({ error: 'Carrier is required' });
      }

      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];
      if (order.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Only seller can mark as shipped' });
      }
      if (order.status !== 'processing') {
        return res.status(400).json({ error: `Cannot ship order in ${order.status} status` });
      }

      const trimmedTracking = String(trackingNumber).trim();
      const trimmedCarrier = String(carrier).trim();

      const updated = await pool.query(`
        UPDATE orders
        SET status = 'shipped', tracking_number = $2, carrier = $3, shipped_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, trimmedTracking, trimmedCarrier]);

      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
        VALUES ($1, $2, 'order_shipped', $3, 'seller', $4)
      `, [uuidv4(), id, req.user.id, JSON.stringify({ trackingNumber: trimmedTracking, carrier: trimmedCarrier })]);

      // Publish order shipped event to WebSocket service
      try {
        await redis.publish('order:shipped', JSON.stringify({
          orderId: id,
          orderNumber: order.order_number,
          buyerId: order.buyer_id,
          sellerId: order.seller_id,
          productName: order.product_name,
          trackingNumber: trimmedTracking,
          carrier: trimmedCarrier,
          timestamp: new Date().toISOString()
        }));
      } catch (redisErr) {
        logger.warn('Failed to publish order shipped event', { error: redisErr.message });
        // Don't fail the request if Redis publish fails
      }

      // Send order shipped email notification
      sendOrderShippedEmail(order, trimmedTracking, trimmedCarrier).catch(() => {});

      logger.info('Order shipped', { orderId: id, carrier: trimmedCarrier });
      res.json(updated.rows[0]);
    } catch (err) {
      logger.error('Failed to ship order', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /:id/confirm-delivery — buyer confirms receipt
  router.patch('/:id/confirm-delivery', async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];
      if (order.buyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Only buyer can confirm delivery' });
      }
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        return res.status(400).json({ error: `Cannot confirm delivery for order in ${order.status} status` });
      }

      // Set auto_release_at to 3 days from now — gives the buyer a review window
      // to open a dispute before escrow funds are released to the seller.
      const updated = await pool.query(`
        UPDATE orders
        SET status = 'completed', delivered_at = NOW(), completed_at = NOW(), updated_at = NOW(),
            auto_release_at = NOW() + INTERVAL '3 days'
        WHERE id = $1
        RETURNING *
      `, [id]);

      // Create payout for seller (will be held until escrow auto-releases or is manually released)
      await pool.query(`
        INSERT INTO payouts (id, seller_id, order_id, gross_amount, fee_amount, net_amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      `, [
        uuidv4(), order.seller_id, id,
        order.item_price, order.platform_fee, order.seller_payout
      ]);

      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role)
        VALUES ($1, $2, 'delivery_confirmed', $3, 'buyer')
      `, [uuidv4(), id, req.user.id]);

      logger.info('Delivery confirmed', { orderId: id });

      // Fire-and-forget KYC threshold check
      triggerKycCheck(order.seller_id, pool).catch(() => {});

      res.json(updated.rows[0]);
    } catch (err) {
      logger.error('Failed to confirm delivery', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /:id/cancel — cancel order (before shipment)
  router.patch('/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];
      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (!['pending_payment', 'processing'].includes(order.status)) {
        return res.status(400).json({ error: `Cannot cancel order in ${order.status} status` });
      }

      const updated = await pool.query(`
        UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *
      `, [id]);

      const actorRole = order.buyer_id === req.user.id ? 'buyer' : 'seller';
      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role)
        VALUES ($1, $2, 'order_cancelled', $3, $4)
      `, [uuidv4(), id, req.user.id, actorRole]);

      logger.info('Order cancelled', { orderId: id });
      res.json(updated.rows[0]);
    } catch (err) {
      logger.error('Failed to cancel order', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

function mapOrderStatusToPurchaseStatus(status) {
  const map = {
    pending_payment: 'pending_shipment',
    processing: 'pending_shipment',
    shipped: 'shipped',
    delivered: 'delivered',
    authenticated: 'authenticated',
    completed: 'delivered',
    cancelled: 'cancelled',
    refunded: 'cancelled',
  };
  return map[status] || status;
}
