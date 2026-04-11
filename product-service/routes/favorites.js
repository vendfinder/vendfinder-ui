const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const logger = require('../logger');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/favorites — user's favorites
  router.get('/me/favorites', authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT f.*,
          p.id AS product_id,
          p.name AS product_name,
          p.image_url AS product_image,
          p.category,
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS lowest_ask,
          (SELECT MAX(b.bid_amount) FROM bids b WHERE b.product_id = p.id AND b.status = 'active') AS highest_bid,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = p.id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale
        FROM favorites f
        JOIN products p ON p.id = f.product_id
        WHERE f.user_id = $1 AND p.status = 'active'
        ORDER BY f.created_at DESC
      `, [req.user.id]);

      // Transform to FavoriteItem[] shape
      const favorites = rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        category: row.category,
        lowestAsk: row.lowest_ask ? parseFloat(row.lowest_ask) : 0,
        highestBid: row.highest_bid ? parseFloat(row.highest_bid) : 0,
        lastSale: row.last_sale ? parseFloat(row.last_sale) : 0,
        priceChange: 0, // Would need historical data to compute
        addedAt: row.created_at,
      }));

      res.json({ favorites });
    } catch (err) {
      logger.error('Failed to fetch favorites', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /me/favorites/:productId — add favorite
  router.post('/me/favorites/:productId', authMiddleware, async (req, res) => {
    try {
      const { productId } = req.params;

      // Verify product exists
      const product = await pool.query('SELECT id FROM products WHERE id = $1 AND status = $2', [productId, 'active']);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await pool.query(`
        INSERT INTO favorites (id, user_id, product_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO NOTHING
      `, [uuidv4(), req.user.id, productId]);

      res.status(201).json({ message: 'Added to favorites' });
    } catch (err) {
      logger.error('Failed to add favorite', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /me/favorites/:productId — remove favorite
  router.delete('/me/favorites/:productId', authMiddleware, async (req, res) => {
    try {
      const { productId } = req.params;

      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
        [req.user.id, productId]
      );

      res.json({ message: 'Removed from favorites' });
    } catch (err) {
      logger.error('Failed to remove favorite', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
