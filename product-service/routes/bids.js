const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../auth');
const logger = require('../logger');
const { bidsPlaced } = require('../metrics');
const { checkForMatch } = require('../lib/match-engine');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/bids — buyer's bids (MUST be before /:id/bids)
  router.get('/me/bids', authMiddleware, async (req, res) => {
    try {
      const { status } = req.query;

      const conditions = ['b.buyer_id = $1'];
      const params = [req.user.id];
      let paramIdx = 2;

      if (status) {
        conditions.push(`b.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const { rows } = await pool.query(`
        SELECT b.*,
          p.name AS product_name,
          p.image_url AS product_image,
          p.category,
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = b.product_id AND a.status = 'active') AS lowest_ask,
          (SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.product_id = b.product_id AND b2.status = 'active') AS highest_bid,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = b.product_id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale
        FROM bids b
        JOIN products p ON p.id = b.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY b.created_at DESC
      `, params);

      // Transform to Bid[] shape
      const bids = rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        category: row.category,
        size: row.size,
        bidAmount: parseFloat(row.bid_amount),
        lowestAsk: row.lowest_ask ? parseFloat(row.lowest_ask) : undefined,
        highestBid: row.highest_bid ? parseFloat(row.highest_bid) : undefined,
        lastSale: row.last_sale ? parseFloat(row.last_sale) : undefined,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));

      res.json({ bids });
    } catch (err) {
      logger.error('Failed to fetch user bids', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id/bids — list bids for a product (public)
  router.get('/:id/bids', async (req, res) => {
    try {
      const { id } = req.params;
      const { status = 'active', size, limit = 50, offset = 0 } = req.query;

      const conditions = ['b.product_id = $1', 'b.status = $2'];
      const params = [id, status];
      let paramIdx = 3;

      if (size) {
        conditions.push(`b.size = $${paramIdx}`);
        params.push(size);
        paramIdx++;
      }

      const limitVal = Math.min(parseInt(limit) || 50, 200);
      const offsetVal = parseInt(offset) || 0;

      const { rows } = await pool.query(`
        SELECT b.*, p.name AS product_name, p.image_url AS product_image, p.category
        FROM bids b
        JOIN products p ON p.id = b.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY b.bid_amount DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limitVal, offsetVal]);

      res.json({ bids: rows });
    } catch (err) {
      logger.error('Failed to fetch bids', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /:id/bids — place bid (authenticated)
  router.post('/:id/bids', authMiddleware, async (req, res) => {
    try {
      const { id: productId } = req.params;
      const { size, bid_amount, expires_at } = req.body;

      if (!bid_amount || bid_amount <= 0) {
        return res.status(400).json({ error: 'bid_amount is required and must be positive' });
      }

      // Verify product exists
      const product = await pool.query('SELECT id FROM products WHERE id = $1 AND status = $2', [productId, 'active']);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const expiresDate = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { rows } = await pool.query(`
        INSERT INTO bids (id, product_id, buyer_id, size, bid_amount, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [uuidv4(), productId, req.user.id, size || null, bid_amount, expiresDate]);

      bidsPlaced.inc();
      logger.info('Bid placed', { bidId: rows[0].id, productId, userId: req.user.id });

      // Attempt automatic bid/ask matching
      try {
        const matchResult = await checkForMatch(pool, redis, {
          productId,
          size: size || null,
          type: 'bid',
        });

        if (matchResult.matched) {
          logger.info('Bid auto-matched', {
            bidId: rows[0].id,
            askId: matchResult.matchDetails.askId,
            price: matchResult.matchDetails.price,
          });
          return res.status(201).json({ ...rows[0], matched: true, matchDetails: matchResult.matchDetails });
        }
      } catch (matchErr) {
        // Log but don't fail the bid creation — the bid was already inserted
        logger.error('Match check failed after bid creation', {
          error: matchErr.message,
          bidId: rows[0].id,
          productId,
        });
      }

      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error('Failed to place bid', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /bids/:bidId — update bid (owner only)
  router.put('/bids/:bidId', authMiddleware, async (req, res) => {
    try {
      const { bidId } = req.params;
      const { bid_amount, expires_at } = req.body;

      const existing = await pool.query('SELECT * FROM bids WHERE id = $1', [bidId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Bid not found' });
      }
      if (existing.rows[0].buyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (existing.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'Can only update active bids' });
      }

      const updates = ['updated_at = NOW()'];
      const params = [];
      let idx = 1;

      if (bid_amount !== undefined) {
        if (bid_amount <= 0) return res.status(400).json({ error: 'bid_amount must be positive' });
        updates.push(`bid_amount = $${idx}`);
        params.push(bid_amount);
        idx++;
      }
      if (expires_at !== undefined) {
        updates.push(`expires_at = $${idx}`);
        params.push(expires_at);
        idx++;
      }

      params.push(bidId);
      const { rows } = await pool.query(
        `UPDATE bids SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
      );

      res.json(rows[0]);
    } catch (err) {
      logger.error('Failed to update bid', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /bids/:bidId — cancel bid (owner only)
  router.delete('/bids/:bidId', authMiddleware, async (req, res) => {
    try {
      const { bidId } = req.params;

      const existing = await pool.query('SELECT * FROM bids WHERE id = $1', [bidId]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Bid not found' });
      }
      if (existing.rows[0].buyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await pool.query(
        "UPDATE bids SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [bidId]
      );

      res.json({ message: 'Bid cancelled' });
    } catch (err) {
      logger.error('Failed to cancel bid', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
