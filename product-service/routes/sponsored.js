const express = require('express');
const { authMiddleware } = require('../auth');
const logger = require('../logger');

const PRICING = {
  category: { perDayCents: 1500 },
  keyword: { perDayCents: 1000 },
};

const VALID_DURATIONS = [1, 3, 7, 14, 30];

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /sponsored/pricing — public pricing info
  router.get('/pricing', (req, res) => {
    res.json({ pricing: PRICING, validDurations: VALID_DURATIONS });
  });

  // POST /sponsored/checkout — create Stripe session for sponsored placement
  router.post('/checkout', authMiddleware, async (req, res) => {
    try {
      const { product_id, target_type, category, keyword, duration_days } = req.body;

      if (!product_id || !target_type || !duration_days) {
        return res.status(400).json({ error: 'product_id, target_type, and duration_days required' });
      }
      if (target_type !== 'category' && target_type !== 'keyword') {
        return res.status(400).json({ error: 'target_type must be "category" or "keyword"' });
      }
      if (target_type === 'category' && !category) {
        return res.status(400).json({ error: 'category required for category targeting' });
      }
      if (target_type === 'keyword' && !keyword) {
        return res.status(400).json({ error: 'keyword required for keyword targeting' });
      }
      if (!VALID_DURATIONS.includes(duration_days)) {
        return res.status(400).json({ error: 'Invalid duration' });
      }

      // Verify product ownership
      const { rows: [product] } = await pool.query(
        'SELECT id, name, vendor_id FROM products WHERE id = $1',
        [product_id]
      );
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.vendor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to sponsor this product' });
      }

      const priceCents = PRICING[target_type].perDayCents * duration_days;
      const targetLabel = target_type === 'category'
        ? `Category: ${category}`
        : `Search: "${keyword}"`;

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Sponsored Placement — ${duration_days} day${duration_days > 1 ? 's' : ''}`,
              description: `Sponsor "${product.name}" in ${targetLabel} results`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard/selling?sponsored_activated=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard/selling`,
        metadata: {
          user_id: req.user.id,
          product_id,
          target_type,
          category: category || '',
          keyword: (keyword || '').slice(0, 255),
          duration_days: String(duration_days),
          type: 'sponsored_slot',
        },
      });

      res.json({ checkoutUrl: session.url, sessionId: session.id });
    } catch (err) {
      logger.error('Sponsored checkout error', { error: err.message });
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // POST /sponsored/confirm — activate sponsored slot after payment
  router.post('/confirm', authMiddleware, async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ error: 'session_id required' });

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
      const targetType = session.metadata.target_type;
      const category = session.metadata.category || null;
      const keyword = session.metadata.keyword || null;
      const priceCents = PRICING[targetType].perDayCents * durationDays;

      const startsAt = new Date();
      const expiresAt = new Date(startsAt);
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await pool.query(`
        INSERT INTO sponsored_slots (product_id, vendor_id, category, keyword, duration_days, price_cents, starts_at, expires_at, status, stripe_session_id, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW())
      `, [productId, req.user.id, category || null, keyword || null, durationDays, priceCents, startsAt, expiresAt, session_id]);

      logger.info('Sponsored slot activated', { productId, userId: req.user.id, targetType, durationDays });
      res.json({ success: true, expiresAt });
    } catch (err) {
      logger.error('Sponsored confirm error', { error: err.message });
      res.status(500).json({ error: 'Failed to confirm sponsored slot' });
    }
  });

  // GET /sponsored/me — vendor's active sponsored campaigns
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT s.*, p.name AS product_name, p.image_url
        FROM sponsored_slots s
        JOIN products p ON p.id = s.product_id
        WHERE s.vendor_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
        ORDER BY s.starts_at DESC
      `, [req.user.id]);
      res.json({ slots: rows });
    } catch (err) {
      logger.error('Failed to fetch vendor sponsored slots', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
