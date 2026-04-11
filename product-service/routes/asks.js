const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const { requireActiveSeller } = require('../lib/seller-gate');
const logger = require('../logger');
const { asksCreated } = require('../metrics');
const { checkForMatch } = require('../lib/match-engine');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/asks — seller's listings (MUST be before /:id/asks)
  router.get('/me/asks', authMiddleware, async (req, res) => {
    try {
      const { status } = req.query;

      const conditions = ['a.seller_id = $1'];
      const params = [req.user.id];
      let paramIdx = 2;

      if (status) {
        conditions.push(`a.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const { rows } = await pool.query(`
        SELECT a.*,
          p.name AS product_name,
          p.image_url AS product_image,
          p.category,
          (SELECT MIN(a2.ask_price) FROM asks a2 WHERE a2.product_id = a.product_id AND a2.status = 'active') AS lowest_ask,
          (SELECT MAX(b.bid_amount) FROM bids b WHERE b.product_id = a.product_id AND b.status = 'active') AS highest_bid,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = a.product_id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale
        FROM asks a
        JOIN products p ON p.id = a.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.created_at DESC
      `, params);

      // Transform to Listing[] shape
      const listings = rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        category: row.category,
        size: row.size,
        condition: row.condition,
        askPrice: parseFloat(row.ask_price),
        lowestAsk: row.lowest_ask ? parseFloat(row.lowest_ask) : undefined,
        highestBid: row.highest_bid ? parseFloat(row.highest_bid) : undefined,
        lastSale: row.last_sale ? parseFloat(row.last_sale) : undefined,
        status: row.status,
        createdAt: row.created_at,
        soldAt: row.sold_at || undefined,
        expiresAt: row.expires_at || undefined,
        views: row.views || 0,
      }));

      res.json({ listings });
    } catch (err) {
      logger.error('Failed to fetch user asks', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id/asks — list asks for a product (public)
  router.get('/:id/asks', async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'active', size, limit = 50, offset = 0 } = req.query;

      const conditions = ['a.product_id = $1', 'a.status = $2'];
      const params = [id, status];
      let paramIdx = 3;

      if (size) {
        conditions.push(`a.size = $${paramIdx}`);
        params.push(size);
        paramIdx++;
      }

      const limitVal = Math.min(parseInt(limit) || 50, 200);
      const offsetVal = parseInt(offset) || 0;

      const { rows } = await pool.query(`
        SELECT a.*, p.name AS product_name, p.image_url AS product_image, p.category
        FROM asks a
        JOIN products p ON p.id = a.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.ask_price ASC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limitVal, offsetVal]);

      res.json({ asks: rows });
    } catch (err) {
      logger.error('Failed to fetch asks', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /:id/asks — create ask/listing (authenticated, requires active seller)
  router.post('/:id/asks', authMiddleware, requireActiveSeller, async (req, res) => {
    try {
      const { id: productId } = req.params;
      const { size, condition = 'new', ask_price, expires_at } = req.body;

      if (!ask_price || ask_price <= 0) {
        return res.status(400).json({ error: 'ask_price is required and must be positive' });
      }

      // Verify product exists
      const product = await pool.query('SELECT id FROM products WHERE id = $1 AND status = $2', [productId, 'active']);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const expiresDate = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { rows } = await pool.query(`
        INSERT INTO asks (id, product_id, seller_id, size, condition, ask_price, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [uuidv4(), productId, req.user.id, size || null, condition, ask_price, expiresDate]);

      asksCreated.inc();
      logger.info('Ask created', { askId: rows[0].id, productId, userId: req.user.id });

      // Attempt automatic bid/ask matching
      try {
        const matchResult = await checkForMatch(pool, redis, {
          productId,
          size: size || null,
          type: 'ask',
        });

        if (matchResult.matched) {
          logger.info('Ask auto-matched', {
            askId: rows[0].id,
            bidId: matchResult.matchDetails.bidId,
            price: matchResult.matchDetails.price,
          });
          return res.status(201).json({ ...rows[0], matched: true, matchDetails: matchResult.matchDetails });
        }
      } catch (matchErr) {
        // Log but don't fail the ask creation — the ask was already inserted
        logger.error('Match check failed after ask creation', {
          error: matchErr.message,
          askId: rows[0].id,
          productId,
        });
      }

      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error('Failed to create ask', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /asks/:askId — update ask price (owner only)
  router.put('/asks/:askId', authMiddleware, async (req, res) => {
    try {
      const { askId } = req.params;
      const { ask_price, expires_at } = req.body;

      const existing = await pool.query('SELECT * FROM asks WHERE id = $1', [askId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Ask not found' });
      }
      if (existing.rows[0].seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (existing.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'Can only update active asks' });
      }

      const updates = ['updated_at = NOW()'];
      const params = [];
      let idx = 1;

      if (ask_price !== undefined) {
        if (ask_price <= 0) return res.status(400).json({ error: 'ask_price must be positive' });
        updates.push(`ask_price = $${idx}`);
        params.push(ask_price);
        idx++;
      }
      if (expires_at !== undefined) {
        updates.push(`expires_at = $${idx}`);
        params.push(expires_at);
        idx++;
      }

      params.push(askId);
      const { rows } = await pool.query(
        `UPDATE asks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
      );

      res.json(rows[0]);
    } catch (err) {
      logger.error('Failed to update ask', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /asks/:askId — cancel ask (owner only)
  router.delete('/asks/:askId', authMiddleware, async (req, res) => {
    try {
      const { askId } = req.params;

      const existing = await pool.query('SELECT * FROM asks WHERE id = $1', [askId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Ask not found' });
      }
      if (existing.rows[0].seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const productId = existing.rows[0].product_id;

      await pool.query(
        "UPDATE asks SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [askId]
      );

      // If no active asks remain, deactivate the product
      const remaining = await pool.query(
        "SELECT COUNT(*) FROM asks WHERE product_id = $1 AND status = 'active'",
        [productId]
      );
      if (parseInt(remaining.rows[0].count) === 0) {
        await pool.query(
          "UPDATE products SET status = 'archived', updated_at = NOW() WHERE id = $1",
          [productId]
        );
        logger.info('Product archived (no active asks)', { productId });
      }

      res.json({ message: 'Ask cancelled' });
    } catch (err) {
      logger.error('Failed to cancel ask', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
