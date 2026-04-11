const express = require('express');
const logger = require('../logger');

module.exports = function(pool, redis) {
  const router = express.Router();

  // GET /:id/sales-history — returns sales history for a product
  // Query params: size (optional), limit (default 100), period (7d, 30d, 90d, 1y, all)
  router.get('/:id/sales-history', async (req, res) => {
    try {
      const { id } = req.params;
      const { size, limit = 100, period = 'all' } = req.query;

      // Verify product exists
      const product = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const conditions = ['sh.product_id = $1'];
      const params = [id];
      let paramIdx = 2;

      // Apply size filter
      if (size) {
        conditions.push(`sh.size = $${paramIdx}`);
        params.push(size);
        paramIdx++;
      }

      // Apply period filter
      if (period && period !== 'all') {
        let interval;
        switch (period) {
          case '7d':  interval = '7 days'; break;
          case '30d': interval = '30 days'; break;
          case '90d': interval = '90 days'; break;
          case '1y':  interval = '1 year'; break;
          default:    interval = null;
        }
        if (interval) {
          conditions.push(`sh.sale_date >= NOW() - INTERVAL '${interval}'`);
        }
      }

      const whereClause = conditions.join(' AND ');
      const limitVal = Math.min(parseInt(limit) || 100, 500);

      // Fetch sales history
      const { rows: sales } = await pool.query(`
        SELECT sh.id, sh.size, sh.sale_price, sh.sale_date
        FROM sales_history sh
        WHERE ${whereClause}
        ORDER BY sh.sale_date DESC
        LIMIT $${paramIdx}
      `, [...params, limitVal]);

      // Compute stats from the filtered set (no limit applied to stats)
      // params contains [id] or [id, size]; size param is always $2 when present
      const { rows: statsRows } = await pool.query(`
        SELECT
          COUNT(*)::int AS total_sales,
          COALESCE(AVG(sh.sale_price), 0) AS avg_price,
          COALESCE(MAX(sh.sale_price), 0) AS high_price,
          COALESCE(MIN(sh.sale_price), 0) AS low_price,
          (SELECT sh2.sale_price FROM sales_history sh2
           WHERE sh2.product_id = $1
           ${size ? 'AND sh2.size = $2' : ''}
           ORDER BY sh2.sale_date DESC LIMIT 1) AS last_sale
        FROM sales_history sh
        WHERE ${whereClause}
      `, params);

      const stat = statsRows[0];

      res.json({
        sales: sales.map(s => ({
          id: s.id,
          size: s.size,
          sale_price: parseFloat(s.sale_price),
          sale_date: s.sale_date,
        })),
        stats: {
          totalSales: stat.total_sales,
          avgPrice: parseFloat(stat.avg_price) || 0,
          highPrice: parseFloat(stat.high_price) || 0,
          lowPrice: parseFloat(stat.low_price) || 0,
          lastSale: stat.last_sale ? parseFloat(stat.last_sale) : null,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch sales history', { error: err.message, productId: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id/market-data — returns aggregated market data for a product
  router.get('/:id/market-data', async (req, res) => {
    try {
      const { id } = req.params;

      // Verify product exists
      const product = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Fetch lowest ask and highest bid from the live order book
      const { rows: marketRows } = await pool.query(`
        SELECT
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = $1 AND a.status = 'active') AS lowest_ask,
          (SELECT MAX(b.bid_amount) FROM bids b WHERE b.product_id = $1 AND b.status = 'active') AS highest_bid
      `, [id]);

      // Fetch aggregated sales data from sales_history
      const { rows: salesRows } = await pool.query(`
        SELECT
          COUNT(*)::int AS total_sales,
          COALESCE(AVG(sh.sale_price), 0) AS avg_sale_price,
          (SELECT sh2.sale_price FROM sales_history sh2
           WHERE sh2.product_id = $1
           ORDER BY sh2.sale_date DESC LIMIT 1) AS last_sale
        FROM sales_history sh
        WHERE sh.product_id = $1
      `, [id]);

      // 30-day price change: compare latest sale to the sale closest to 30 days ago
      const { rows: priceChangeRows } = await pool.query(`
        SELECT
          (SELECT sh1.sale_price FROM sales_history sh1
           WHERE sh1.product_id = $1
           ORDER BY sh1.sale_date DESC LIMIT 1) AS current_price,
          (SELECT sh2.sale_price FROM sales_history sh2
           WHERE sh2.product_id = $1 AND sh2.sale_date <= NOW() - INTERVAL '30 days'
           ORDER BY sh2.sale_date DESC LIMIT 1) AS price_30d_ago
      `, [id]);

      // 52-week high and low
      const { rows: yearRows } = await pool.query(`
        SELECT
          COALESCE(MAX(sh.sale_price), 0) AS high_52w,
          COALESCE(MIN(sh.sale_price), 0) AS low_52w
        FROM sales_history sh
        WHERE sh.product_id = $1 AND sh.sale_date >= NOW() - INTERVAL '52 weeks'
      `, [id]);

      // Volatility: standard deviation of sale prices over the last 90 days
      const { rows: volRows } = await pool.query(`
        SELECT
          COALESCE(STDDEV(sh.sale_price), 0) AS volatility
        FROM sales_history sh
        WHERE sh.product_id = $1 AND sh.sale_date >= NOW() - INTERVAL '90 days'
      `, [id]);

      const market = marketRows[0];
      const salesData = salesRows[0];
      const priceChange = priceChangeRows[0];
      const yearData = yearRows[0];
      const volData = volRows[0];

      // Calculate percentage change
      let priceChange30d = null;
      if (priceChange.current_price && priceChange.price_30d_ago) {
        const current = parseFloat(priceChange.current_price);
        const old = parseFloat(priceChange.price_30d_ago);
        priceChange30d = old !== 0 ? ((current - old) / old) * 100 : null;
      }

      res.json({
        lowestAsk: market.lowest_ask ? parseFloat(market.lowest_ask) : null,
        highestBid: market.highest_bid ? parseFloat(market.highest_bid) : null,
        lastSale: salesData.last_sale ? parseFloat(salesData.last_sale) : null,
        avgSalePrice: parseFloat(salesData.avg_sale_price) || 0,
        totalSales: salesData.total_sales,
        priceChange30d: priceChange30d !== null ? Math.round(priceChange30d * 100) / 100 : null,
        high52w: parseFloat(yearData.high_52w) || 0,
        low52w: parseFloat(yearData.low_52w) || 0,
        volatility: parseFloat(volData.volatility) || 0,
      });
    } catch (err) {
      logger.error('Failed to fetch market data', { error: err.message, productId: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
