const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { constructWebhookEvent } = require('../stripe');
const logger = require('../logger');
const { paymentsProcessed } = require('../metrics');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

module.exports = function(pool, redis) {
  const router = express.Router();

  // POST /webhooks/stripe — Stripe webhook handler
  router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err.message });
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.order_id;

          if (!orderId) {
            logger.warn('PaymentIntent missing order_id metadata', { piId: paymentIntent.id });
            break;
          }

          // Update order status to processing
          await pool.query(`
            UPDATE orders SET status = 'processing', updated_at = NOW()
            WHERE id = $1 AND status = 'pending_payment'
          `, [orderId]);

          // Log event
          await pool.query(`
            INSERT INTO order_events (id, order_id, event_type, metadata)
            VALUES ($1, $2, 'payment_succeeded', $3)
          `, [uuidv4(), orderId, JSON.stringify({ payment_intent: paymentIntent.id })]);

          // Record sale in product-service for price history
          const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
          if (order.rows.length > 0) {
            try {
              await fetch(`${PRODUCT_SERVICE_URL}/internal/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: order.rows[0].product_id,
                  ask_id: order.rows[0].ask_id || null,
                  seller_id: order.rows[0].seller_id,
                  buyer_id: order.rows[0].buyer_id,
                  size: order.rows[0].size,
                  sale_price: parseFloat(order.rows[0].item_price),
                }),
              });
            } catch (err) {
              logger.warn('Failed to record sale in product-service', { error: err.message });
            }
          }

          paymentsProcessed.inc({ status: 'succeeded' });
          logger.info('Payment succeeded', { orderId, piId: paymentIntent.id });
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.order_id;

          if (orderId) {
            await pool.query(`
              UPDATE orders SET status = 'cancelled', updated_at = NOW()
              WHERE id = $1 AND status = 'pending_payment'
            `, [orderId]);

            await pool.query(`
              INSERT INTO order_events (id, order_id, event_type, metadata)
              VALUES ($1, $2, 'payment_failed', $3)
            `, [uuidv4(), orderId, JSON.stringify({
              payment_intent: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
            })]);
          }

          paymentsProcessed.inc({ status: 'failed' });
          logger.info('Payment failed', { orderId, piId: paymentIntent.id });
          break;
        }

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook processing failed', { error: err.message, type: event.type });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  return router;
};
