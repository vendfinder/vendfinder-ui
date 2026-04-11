const express = require('express');
const { authMiddleware } = require('../auth');
const logger = require('../logger');

const TIERS = {
  1: { days: 1, priceCents: 2500, label: '24 hours' },
  3: { days: 3, priceCents: 6000, label: '3 days' },
  7: { days: 7, priceCents: 12500, label: '7 days' },
};

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /featured — public list of currently active featured products
  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT p.*, fs.expires_at, fs.starts_at
        FROM featured_slots fs
        JOIN products p ON p.id = fs.product_id
        WHERE fs.status = 'active'
          AND fs.expires_at > NOW()
          AND fs.starts_at <= NOW()
          AND p.status = 'active'
        ORDER BY fs.starts_at DESC
        LIMIT 12
      `);

      const products = rows.map(row => ({
        id: row.id,
        vendor_id: row.vendor_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        category: row.category,
        brand: row.brand,
        retail_price: row.retail_price ? row.retail_price.toString() : '0',
        compare_at_price: row.compare_at_price ? row.compare_at_price.toString() : null,
        image_url: row.image_url,
        badge: row.badge,
        rating: row.rating ? row.rating.toString() : null,
        review_count: row.review_count || 0,
        quantity_available: row.quantity_available || 0,
        sizes: row.sizes,
        media: row.media,
        translations: row.translations || null,
        is_global_listing: row.is_global_listing || false,
        created_at: row.created_at,
      }));

      res.json({ products });
    } catch (err) {
      logger.error('Failed to fetch featured products', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /featured/tiers — pricing tiers
  router.get('/tiers', (req, res) => {
    res.json({ tiers: TIERS });
  });

  // POST /featured/checkout — create Stripe session for a feature slot
  router.post('/checkout', authMiddleware, async (req, res) => {
    try {
      const { product_id, duration_days } = req.body;

      if (!product_id || !duration_days) {
        return res.status(400).json({ error: 'product_id and duration_days required' });
      }

      const tier = TIERS[duration_days];
      if (!tier) {
        return res.status(400).json({ error: 'Invalid duration' });
      }

      // Verify product ownership
      const { rows: [product] } = await pool.query(
        'SELECT id, name, vendor_id FROM products WHERE id = $1',
        [product_id]
      );
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.vendor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to feature this product' });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Featured Listing — ${tier.label}`,
              description: `Feature "${product.name}" on the VendFinder homepage for ${tier.label}`,
            },
            unit_amount: tier.priceCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard/selling?featured_activated=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard/selling`,
        metadata: {
          user_id: req.user.id,
          product_id,
          duration_days: String(duration_days),
          type: 'featured_slot',
        },
      });

      res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (err) {
      logger.error('Featured checkout error', { error: err.message });
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // POST /featured/confirm — confirm payment and activate slot
  router.post('/confirm', authMiddleware, async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!session_id) {
        return res.status(400).json({ error: 'session_id required' });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Payment not completed' });
      }

      if (session.metadata.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Session does not belong to this user' });
      }

      const durationDays = parseInt(session.metadata.duration_days);
      const productId = session.metadata.product_id;
      const tier = TIERS[durationDays];

      const startsAt = new Date();
      const expiresAt = new Date(startsAt);
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await pool.query(`
        INSERT INTO featured_slots (product_id, vendor_id, duration_days, price_cents, starts_at, expires_at, status, stripe_session_id, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW())
      `, [productId, req.user.id, durationDays, tier.priceCents, startsAt, expiresAt, session_id]);

      logger.info('Featured slot activated', { productId, userId: req.user.id, durationDays });
      res.json({ success: true, expiresAt });
    } catch (err) {
      logger.error('Featured confirm error', { error: err.message });
      res.status(500).json({ error: 'Failed to confirm featured slot' });
    }
  });

  // GET /featured/me — vendor's own active featured slots
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT fs.*, p.name AS product_name, p.image_url
        FROM featured_slots fs
        JOIN products p ON p.id = fs.product_id
        WHERE fs.vendor_id = $1
          AND fs.status = 'active'
          AND fs.expires_at > NOW()
        ORDER BY fs.starts_at DESC
      `, [req.user.id]);

      res.json({ slots: rows });
    } catch (err) {
      logger.error('Failed to fetch vendor featured slots', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
