const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const logger = require('../logger');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/price-alerts — user's price alerts with product info
  router.get('/me/price-alerts', authMiddleware, async (req, res) => {
    try {
      const { status } = req.query;

      const conditions = ['pa.user_id = $1'];
      const params = [req.user.id];
      let paramIdx = 2;

      if (status) {
        conditions.push(`pa.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const { rows } = await pool.query(`
        SELECT pa.*,
          p.name AS product_name,
          p.image_url AS product_image,
          p.category,
          p.retail_price,
          p.slug AS product_slug,
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS lowest_ask,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = p.id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale
        FROM price_alerts pa
        JOIN products p ON p.id = pa.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY pa.created_at DESC
      `, params);

      const alerts = rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        productSlug: row.product_slug,
        category: row.category,
        retailPrice: row.retail_price ? parseFloat(row.retail_price) : null,
        targetPrice: parseFloat(row.target_price),
        size: row.size || null,
        status: row.status,
        lowestAsk: row.lowest_ask ? parseFloat(row.lowest_ask) : null,
        lastSale: row.last_sale ? parseFloat(row.last_sale) : null,
        triggeredAt: row.triggered_at || null,
        createdAt: row.created_at,
      }));

      res.json({ alerts });
    } catch (err) {
      logger.error('Failed to fetch price alerts', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /:id/price-alerts — create a price alert for a product
  router.post('/:id/price-alerts', authMiddleware, async (req, res) => {
    try {
      const { id: productId } = req.params;
      const { target_price, size } = req.body;

      if (!target_price || target_price <= 0) {
        return res.status(400).json({ error: 'target_price is required and must be positive' });
      }

      // Verify product exists
      const product = await pool.query(
        'SELECT id FROM products WHERE id = $1 AND status != $2',
        [productId, 'deleted']
      );
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check for existing active alert on same product/size combo
      const existingConditions = [
        'user_id = $1',
        'product_id = $2',
        "status = 'active'",
      ];
      const existingParams = [req.user.id, productId];
      let existingIdx = 3;

      if (size) {
        existingConditions.push(`size = $${existingIdx}`);
        existingParams.push(size);
        existingIdx++;
      } else {
        existingConditions.push('size IS NULL');
      }

      const existing = await pool.query(
        `SELECT id FROM price_alerts WHERE ${existingConditions.join(' AND ')}`,
        existingParams
      );

      if (existing.rows.length > 0) {
        // Update existing alert instead of creating duplicate
        const { rows } = await pool.query(
          'UPDATE price_alerts SET target_price = $1, created_at = NOW() WHERE id = $2 RETURNING *',
          [target_price, existing.rows[0].id]
        );
        logger.info('Price alert updated', { alertId: rows[0].id, productId, userId: req.user.id });
        return res.json(rows[0]);
      }

      const { rows } = await pool.query(`
        INSERT INTO price_alerts (id, user_id, product_id, target_price, size)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [uuidv4(), req.user.id, productId, target_price, size || null]);

      logger.info('Price alert created', { alertId: rows[0].id, productId, userId: req.user.id });
      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error('Failed to create price alert', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /price-alerts/:alertId — delete a price alert (owner only)
  router.delete('/price-alerts/:alertId', authMiddleware, async (req, res) => {
    try {
      const { alertId } = req.params;

      const existing = await pool.query('SELECT * FROM price_alerts WHERE id = $1', [alertId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Price alert not found' });
      }
      if (existing.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await pool.query('DELETE FROM price_alerts WHERE id = $1', [alertId]);

      res.json({ message: 'Price alert deleted' });
    } catch (err) {
      logger.error('Failed to delete price alert', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
