const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { constructWebhookEvent } = require('../stripe');
const logger = require('../logger');
const { paymentsProcessed } = require('../metrics');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3009';

// Fetch buyer's email address from user-service
async function getBuyerEmail(buyerId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${USER_SERVICE_URL}/users/${buyerId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      logger.warn('Failed to fetch buyer details', { buyerId, status: response.status });
      return null;
    }
    const user = await response.json();
    return user.email || null;
  } catch (err) {
    logger.warn('Error fetching buyer email', { buyerId, error: err.message });
    return null;
  }
}

// Fetch seller's email address from user-service
async function getSellerEmail(sellerId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${USER_SERVICE_URL}/users/${sellerId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      logger.warn('Failed to fetch seller details', { sellerId, status: response.status });
      return null;
    }
    const user = await response.json();
    return user.email || null;
  } catch (err) {
    logger.warn('Error fetching seller email', { sellerId, error: err.message });
    return null;
  }
}

// Send order confirmation email via email-service
async function sendOrderConfirmationEmail(buyerEmail, order) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const payload = {
      email: buyerEmail,
      orderNumber: order.order_number,
      items: [{
        productName: order.product_name,
        quantity: 1,
        subtotal: parseFloat(order.item_price),
      }],
      subtotal: parseFloat(order.item_price),
      shipping: parseFloat(order.shipping_fee || 0),
      total: parseFloat(order.total_buyer_pays),
      shippingAddress: {
        name: order.shipping_name,
        line1: order.shipping_address_line1,
        line2: order.shipping_address_line2,
        city: order.shipping_city,
        state: order.shipping_state,
        postalCode: order.shipping_zip,
        country: order.shipping_country || 'US',
      },
    };
    const response = await fetch(`${EMAIL_SERVICE_URL}/emails/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text();
      logger.warn('Order confirmation email failed', { status: response.status, body: text.slice(0, 200) });
      return;
    }
    logger.info('Order confirmation email sent', { orderNumber: order.order_number, email: buyerEmail });
  } catch (err) {
    logger.warn('Error sending order confirmation email', { error: err.message });
  }
}

// Send seller sale notification email via email-service
async function sendSellerSaleNotificationEmail(sellerEmail, order) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const payload = {
      email: sellerEmail,
      orderNumber: order.order_number,
      productName: order.product_name,
      salePrice: parseFloat(order.item_price),
      sellerPayout: parseFloat(order.seller_payout || 0),
    };
    const response = await fetch(`${EMAIL_SERVICE_URL}/emails/seller-sale-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text();
      logger.warn('Seller sale notification email failed', { status: response.status, body: text.slice(0, 200) });
      return;
    }
    logger.info('Seller sale notification email sent', { orderNumber: order.order_number, email: sellerEmail });
  } catch (err) {
    logger.warn('Error sending seller sale notification email', { error: err.message });
  }
}

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

            // Send order confirmation email (async, do not block)
            (async () => {
              const buyerEmail = await getBuyerEmail(order.rows[0].buyer_id);
              if (buyerEmail) {
                await sendOrderConfirmationEmail(buyerEmail, order.rows[0]);
              } else {
                logger.warn('Skipping order confirmation email — no buyer email', { orderId });
              }
            })().catch((err) => {
              logger.warn('Order confirmation email task failed', { error: err.message });
            });

            // Send seller sale notification email (async, do not block)
            (async () => {
              if (!order.rows[0].seller_id) {
                logger.warn('Skipping seller sale notification — no seller_id on order', { orderId });
                return;
              }
              const sellerEmail = await getSellerEmail(order.rows[0].seller_id);
              if (sellerEmail) {
                await sendSellerSaleNotificationEmail(sellerEmail, order.rows[0]);
              } else {
                logger.warn('Skipping seller sale notification — no seller email', { orderId });
              }
            })().catch((err) => {
              logger.warn('Seller sale notification task failed', { error: err.message });
            });
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
