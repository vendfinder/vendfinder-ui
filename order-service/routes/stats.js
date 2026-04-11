const express = require('express');
const logger = require('../logger');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

async function fetchVerification(userId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${USER_SERVICE_URL}/users/${userId}/verification`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

function computeBadges(verification, totalSales, sellerRating) {
  if (!verification) return { verified: false, proSeller: false, topRated: false, kycVerified: false };
  return {
    verified: !!verification.subscriptionActive,
    proSeller: verification.tier === 'pro' || verification.tier === 'enterprise',
    topRated: totalSales >= 10 && sellerRating >= 4.5,
    kycVerified: !!verification.kycVerified,
  };
}

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/stats — seller stats
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const authHeader = req.headers.authorization;

      // Fetch order-based stats from local DB - ONLY COUNT SUCCESSFUL TRANSACTIONS
      const salesResult = await pool.query(`
        SELECT
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped', 'delivered', 'completed'))::int AS total_sales,
          COALESCE(SUM(oi.subtotal) FILTER (WHERE o.status IN ('processing', 'shipped', 'delivered', 'completed')), 0)::numeric AS total_revenue,
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped'))::int AS pending_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1
      `, [userId]);

      const purchaseResult = await pool.query(`
        SELECT COUNT(*)::int AS total_purchases
        FROM orders
        WHERE buyer_id = $1 AND status IN ('processing', 'shipped', 'delivered', 'completed')
      `, [userId]);

      const shipTimeResult = await pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (o.shipped_at - o.created_at)) / 3600)::numeric AS avg_ship_hours
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1 AND o.shipped_at IS NOT NULL
      `, [userId]);

      const completionResult = await pool.query(`
        SELECT
          COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed')::numeric AS completed,
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped', 'delivered', 'completed'))::numeric AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1
      `, [userId]);

      // Fetch listing/bid/favorite counts from product-service
      let activeListings = 0;
      let totalListings = 0;
      let activeBids = 0;
      let totalFavorites = 0;
      let portfolioValue = 0;

      try {
        const fetch = (await import('node-fetch')).default;

        const [listingsRes, bidsRes, favoritesRes] = await Promise.all([
          fetch(`${PRODUCT_SERVICE_URL}/me/asks`, {
            headers: { Authorization: authHeader },
          }),
          fetch(`${PRODUCT_SERVICE_URL}/me/bids`, {
            headers: { Authorization: authHeader },
          }),
          fetch(`${PRODUCT_SERVICE_URL}/me/favorites`, {
            headers: { Authorization: authHeader },
          }),
        ]);

        if (listingsRes.ok) {
          const data = await listingsRes.json();
          totalListings = data.listings?.length || 0;
          activeListings = data.listings?.filter(l => l.status === 'active').length || 0;
        }

        if (bidsRes.ok) {
          const data = await bidsRes.json();
          activeBids = data.bids?.filter(b => b.status === 'active').length || 0;
        }

        if (favoritesRes.ok) {
          const data = await favoritesRes.json();
          totalFavorites = data.favorites?.length || 0;
        }
      } catch (err) {
        logger.warn('Failed to fetch product-service stats', { error: err.message });
      }

      // Calculate portfolio value from completed purchases
      const portfolioResult = await pool.query(`
        SELECT COALESCE(SUM(item_price), 0)::numeric AS portfolio_value
        FROM orders
        WHERE buyer_id = $1 AND status IN ('completed', 'delivered', 'authenticated')
      `, [userId]);

      const sales = salesResult.rows[0];
      const avgHours = shipTimeResult.rows[0].avg_ship_hours;
      const completion = completionResult.rows[0];
      const completionRate = completion.total > 0
        ? parseFloat((completion.completed / completion.total * 100).toFixed(1))
        : 100;

      const avgShipTime = avgHours
        ? `${Math.round(avgHours)} hours`
        : 'N/A';

      const stats = {
        totalSales: sales.total_sales,
        totalRevenue: parseFloat(sales.total_revenue),
        avgShipTime,
        completionRate,
        sellerRating: 4.8, // Would need review service
        totalListings,
        activeListings,
        pendingSales: sales.pending_sales,
        totalPurchases: purchaseResult.rows[0].total_purchases,
        activeBids,
        portfolioValue: parseFloat(portfolioResult.rows[0].portfolio_value),
        totalFavorites,
      };

      res.json({ stats });
    } catch (err) {
      logger.error('Failed to fetch stats', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};

module.exports.publicStats = function(pool) {
  const router = express.Router();

  // GET /sellers/:userId/stats — public seller stats (no auth needed)
  router.get('/:userId/stats', async (req, res) => {
    try {
      const { userId } = req.params;

      const salesResult = await pool.query(`
        SELECT
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped', 'delivered', 'completed'))::int AS total_sales,
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped'))::int AS pending_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1
      `, [userId]);

      const shipTimeResult = await pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (o.shipped_at - o.created_at)) / 3600)::numeric AS avg_ship_hours
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1 AND o.shipped_at IS NOT NULL
      `, [userId]);

      const completionResult = await pool.query(`
        SELECT
          COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed')::numeric AS completed,
          COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('processing', 'shipped', 'delivered', 'completed'))::numeric AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1
      `, [userId]);

      const sales = salesResult.rows[0];
      const avgHours = shipTimeResult.rows[0].avg_ship_hours;
      const completion = completionResult.rows[0];
      const completionRate = completion.total > 0
        ? parseFloat((completion.completed / completion.total * 100).toFixed(1))
        : 100;

      const avgShipTime = avgHours ? `${Math.round(avgHours)} hours` : 'N/A';
      const sellerRating = 4.8;
      const verification = await fetchVerification(userId);
      const badges = computeBadges(verification, sales.total_sales, sellerRating);

      res.json({
        stats: {
          totalSales: sales.total_sales,
          pendingSales: sales.pending_sales,
          avgShipTime,
          completionRate,
          sellerRating,
          verification: badges,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch public stats', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
