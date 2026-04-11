const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

module.exports = function(pool) {
  const router = express.Router();

  // POST /internal/sales — record a completed sale (called by order-service)
  router.post('/sales', async (req, res) => {
    try {
      const { product_id, seller_id, buyer_id, size, sale_price, ask_id } = req.body;

      if (!product_id || !sale_price) {
        return res.status(400).json({ error: 'product_id and sale_price are required' });
      }

      // Insert into sales_history
      const { rows } = await pool.query(`
        INSERT INTO sales_history (id, product_id, size, sale_price, sale_date)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [uuidv4(), product_id, size || null, sale_price]);

      // If there was an ask, mark it as sold
      if (ask_id) {
        await pool.query(`
          UPDATE asks SET status = 'sold', updated_at = NOW()
          WHERE id = $1 AND status = 'active'
        `, [ask_id]);
      }

      logger.info('Sale recorded', { productId: product_id, salePrice: sale_price, size });

      res.status(201).json({ sale: rows[0] });
    } catch (err) {
      logger.error('Failed to record sale', { error: err.message });
      res.status(500).json({ error: 'Failed to record sale' });
    }
  });

  return router;
};
