const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createPaymentIntent } = require('../stripe');
const paypal = require('../paypal');
const logger = require('../logger');
const { ordersCreated } = require('../metrics');

module.exports = function(pool, redis) {
  const router = express.Router();

  // POST /checkout — create order + Stripe PaymentIntent
  router.post('/', async (req, res) => {
    try {
      const {
        product_id, ask_id, product_name, product_image, product_category,
        size, item_price, seller_id, seller_name,
        shipping_name, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_zip, shipping_country
      } = req.body;

      if (!product_id || !product_name || !item_price || !seller_id) {
        return res.status(400).json({ error: 'product_id, product_name, item_price, and seller_id are required' });
      }

      if (!shipping_name || !shipping_address_line1 || !shipping_city || !shipping_state || !shipping_zip) {
        return res.status(400).json({ error: 'Shipping address is required' });
      }

      // Calculate fees
      const price = parseFloat(item_price);
      const shippingFee = 0; // No shipping charges - always free
      const taxRate = 0.08;
      const platformFeeRate = 0.09;

      const taxAmount = parseFloat((price * taxRate).toFixed(2));
      const platformFee = parseFloat((price * platformFeeRate).toFixed(2));
      const totalBuyerPays = parseFloat((price + shippingFee + taxAmount).toFixed(2));
      const sellerPayout = parseFloat((price - platformFee).toFixed(2));

      // Generate order number
      const orderNumber = `VF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = uuidv4();

      // Create Stripe PaymentIntent
      const paymentIntent = await createPaymentIntent(totalBuyerPays, 'usd', {
        order_id: orderId,
        order_number: orderNumber,
        buyer_id: req.user.id,
        seller_id: seller_id,
      });

      // Create order in database
      //
      // Escrow flow:
      //   1. Order created → escrow_status = 'held', funds held in escrow
      //   2. Seller ships → buyer receives item
      //   3. Delivery confirmed → 3-day buyer review window begins (auto_release_at set)
      //   4. If no dispute within 3 days → escrow auto-releases to seller
      //   5. If buyer opens dispute → escrow_status = 'disputed', funds remain held
      //   6. Dispute resolved → escrow released to seller or refunded to buyer
      //
      const { rows } = await pool.query(`
        INSERT INTO orders (
          id, order_number, buyer_id, seller_id, seller_name, product_id, ask_id,
          product_name, product_image, product_category, size,
          item_price, shipping_fee, tax_amount, platform_fee, platform_fee_rate,
          total_buyer_pays, seller_payout,
          shipping_name, shipping_address_line1, shipping_address_line2,
          shipping_city, shipping_state, shipping_zip, shipping_country,
          stripe_payment_intent_id, status,
          escrow_status, escrow_held_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18,
          $19, $20, $21,
          $22, $23, $24, $25,
          $26, 'pending_payment',
          'held', NOW()
        ) RETURNING *
      `, [
        orderId, orderNumber, req.user.id, seller_id, seller_name || null, product_id, ask_id || null,
        product_name, product_image || null, product_category || null, size || null,
        price, shippingFee, taxAmount, platformFee, platformFeeRate,
        totalBuyerPays, sellerPayout,
        shipping_name, shipping_address_line1, shipping_address_line2 || null,
        shipping_city, shipping_state, shipping_zip, shipping_country || 'US',
        paymentIntent.id
      ]);

      // Log order event
      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
        VALUES ($1, $2, 'order_created', $3, 'buyer', $4)
      `, [uuidv4(), orderId, req.user.id, JSON.stringify({ total: totalBuyerPays })]);

      ordersCreated.inc();
      logger.info('Order created', { orderId, orderNumber, buyerId: req.user.id });

      res.status(201).json({
        orderId,
        orderNumber,
        clientSecret: paymentIntent.client_secret,
        total: totalBuyerPays,
        breakdown: {
          itemPrice: price,
          shippingFee,
          taxAmount,
          platformFee,
          sellerPayout,
        },
      });
    } catch (err) {
      logger.error('Checkout failed', { error: err.message });
      res.status(500).json({ error: 'Checkout failed' });
    }
  });

  // POST /checkout/paypal — create order + PayPal order
  router.post('/paypal', async (req, res) => {
    try {
      const {
        product_id, ask_id, product_name, product_image, product_category,
        size, item_price, seller_id, seller_name,
        shipping_name, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_zip, shipping_country
      } = req.body;

      if (!product_id || !product_name || !item_price || !seller_id) {
        return res.status(400).json({ error: 'product_id, product_name, item_price, and seller_id are required' });
      }

      if (!shipping_name || !shipping_address_line1 || !shipping_city || !shipping_state || !shipping_zip) {
        return res.status(400).json({ error: 'Shipping address is required' });
      }

      const price = parseFloat(item_price);
      const shippingFee = 0; // No shipping charges - always free
      const taxRate = 0.08;
      const platformFeeRate = 0.09;

      const taxAmount = parseFloat((price * taxRate).toFixed(2));
      const platformFee = parseFloat((price * platformFeeRate).toFixed(2));
      const totalBuyerPays = parseFloat((price + shippingFee + taxAmount).toFixed(2));
      const sellerPayout = parseFloat((price - platformFee).toFixed(2));

      const orderNumber = `VF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = uuidv4();

      // Create PayPal order
      const paypalOrder = await paypal.createOrder(totalBuyerPays, 'usd', {
        order_id: orderId,
        order_number: orderNumber,
        buyer_id: req.user.id,
        seller_id: seller_id,
      });

      // Create order in database with pending_payment status
      await pool.query(`
        INSERT INTO orders (
          id, order_number, buyer_id, seller_id, seller_name, product_id, ask_id,
          product_name, product_image, product_category, size,
          item_price, shipping_fee, tax_amount, platform_fee, platform_fee_rate,
          total_buyer_pays, seller_payout,
          shipping_name, shipping_address_line1, shipping_address_line2,
          shipping_city, shipping_state, shipping_zip, shipping_country,
          paypal_order_id, status,
          escrow_status, escrow_held_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18,
          $19, $20, $21,
          $22, $23, $24, $25,
          $26, 'pending_payment',
          'held', NOW()
        ) RETURNING *
      `, [
        orderId, orderNumber, req.user.id, seller_id, seller_name || null, product_id, ask_id || null,
        product_name, product_image || null, product_category || null, size || null,
        price, shippingFee, taxAmount, platformFee, platformFeeRate,
        totalBuyerPays, sellerPayout,
        shipping_name, shipping_address_line1, shipping_address_line2 || null,
        shipping_city, shipping_state, shipping_zip, shipping_country || 'US',
        paypalOrder.id
      ]);

      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
        VALUES ($1, $2, 'order_created', $3, 'buyer', $4)
      `, [uuidv4(), orderId, req.user.id, JSON.stringify({ total: totalBuyerPays, payment_method: 'paypal' })]);

      ordersCreated.inc();
      logger.info('PayPal order created', { orderId, orderNumber, paypalOrderId: paypalOrder.id });

      res.status(201).json({
        orderId,
        orderNumber,
        paypalOrderId: paypalOrder.id,
        total: totalBuyerPays,
        breakdown: {
          itemPrice: price,
          shippingFee,
          taxAmount,
          platformFee,
          sellerPayout,
        },
      });
    } catch (err) {
      logger.error('PayPal checkout failed', { error: err.message });
      res.status(500).json({ error: 'PayPal checkout failed' });
    }
  });

  // POST /checkout/paypal/capture — capture PayPal payment after buyer approval
  router.post('/paypal/capture', async (req, res) => {
    try {
      const { paypalOrderId } = req.body;
      if (!paypalOrderId) {
        return res.status(400).json({ error: 'paypalOrderId is required' });
      }

      // Capture the payment
      const captureData = await paypal.captureOrder(paypalOrderId);

      if (captureData.status !== 'COMPLETED') {
        logger.warn('PayPal capture not completed', { paypalOrderId, status: captureData.status });
        return res.status(400).json({ error: 'Payment not completed' });
      }

      // Update order status
      const { rows } = await pool.query(`
        UPDATE orders SET status = 'processing', updated_at = NOW()
        WHERE paypal_order_id = $1 AND status = 'pending_payment'
        RETURNING *
      `, [paypalOrderId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];

      // Log payment event
      await pool.query(`
        INSERT INTO order_events (id, order_id, event_type, actor_id, actor_role, metadata)
        VALUES ($1, $2, 'payment_succeeded', $3, 'buyer', $4)
      `, [uuidv4(), order.id, req.user.id, JSON.stringify({
        paypal_order_id: paypalOrderId,
        payment_method: 'paypal',
        capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      })]);

      // Record sale in product-service for price history
      try {
        const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
        await fetch(`${PRODUCT_SERVICE_URL}/internal/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: order.product_id,
            ask_id: order.ask_id || null,
            seller_id: order.seller_id,
            buyer_id: order.buyer_id,
            size: order.size,
            sale_price: parseFloat(order.item_price),
          }),
        });
      } catch (err) {
        logger.warn('Failed to record sale in product-service', { error: err.message });
      }

      logger.info('PayPal payment captured', { orderId: order.id, paypalOrderId });

      res.json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'processing',
      });
    } catch (err) {
      logger.error('PayPal capture failed', { error: err.message });
      res.status(500).json({ error: 'PayPal capture failed' });
    }
  });

  return router;
};
