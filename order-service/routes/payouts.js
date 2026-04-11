const express = require('express');
const logger = require('../logger');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /me/payouts — seller payouts
  router.get('/', async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      const conditions = ['p.seller_id = $1'];
      const params = [req.user.id];
      let paramIdx = 2;

      if (status) {
        conditions.push(`p.status = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }

      const { rows } = await pool.query(`
        SELECT p.*, o.product_name, o.order_number,
               pm.method_type AS pm_method_type, pm.label AS pm_label
        FROM payouts p
        JOIN orders o ON o.id = p.order_id
        LEFT JOIN payout_methods pm ON pm.id = p.payout_method_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0]);

      // Transform to Payout[] shape
      const payouts = rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.gross_amount),
        fee: parseFloat(row.fee_amount),
        net: parseFloat(row.net_amount),
        status: row.status,
        method: row.pm_method_type || row.method || 'Direct Deposit',
        date: row.created_at,
        items: [row.product_name],
      }));

      res.json({ payouts });
    } catch (err) {
      logger.error('Failed to fetch payouts', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
