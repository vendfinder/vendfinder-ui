const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, optionalAuth } = require('../auth');
const { requireActiveSeller } = require('../lib/seller-gate');
const logger = require('../logger');
const { productsCreated } = require('../metrics');

module.exports = function(pool, redis) {
  const router = express.Router();
  const translationService = require('../lib/translation')(redis);
  const translationEnabled = translationService.init();

  // Background translation helper — does not block the response
  async function translateAndStore(product) {
    if (!translationEnabled) return;
    try {
      const sourceText = product.name + ' ' + (product.description || '');
      const sourceLocale = await translationService.detectSourceLocale(sourceText);
      const targetLocales = translationService.ALL_LOCALES.filter(l => l !== sourceLocale);

      const translations = await translationService.translateProductContent(
        { name: product.name, description: product.description, long_description: product.long_description, features: product.features },
        sourceLocale,
        targetLocales
      );

      await pool.query(
        'UPDATE products SET translations = $1, source_language = $2 WHERE id = $3',
        [JSON.stringify(translations), sourceLocale, product.id]
      );
      logger.info('Product translated', { productId: product.id, sourceLocale, locales: Object.keys(translations).length });
    } catch (err) {
      logger.error('Background translation failed', { productId: product.id, error: err.message });
    }
  }

  // GET /categories — list categories with product counts
  router.get('/categories', async (req, res) => {
    try {
      const cached = await redis.get('categories');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const { rows } = await pool.query(`
        SELECT c.*, COUNT(p.id)::int AS product_count
        FROM categories c
        LEFT JOIN products p ON LOWER(p.category) = LOWER(c.name) AND p.status = 'active'
        GROUP BY c.id
        ORDER BY c.sort_order
      `);

      const result = { categories: rows };
      await redis.set('categories', JSON.stringify(result), 'EX', 300);
      res.json(result);
    } catch (err) {
      logger.error('Failed to fetch categories', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET / — list products with filters, pagination, search
  router.get('/', async (req, res) => {
    try {
      const {
        category, brand, search, minPrice, maxPrice,
        sort = 'created_at', order = 'desc',
        limit = 50, offset = 0, tag, status = 'active'
      } = req.query;

      const conditions = ['p.status = $1'];
      const params = [status];
      let paramIdx = 2;

      if (category) {
        conditions.push(`LOWER(p.category) = LOWER($${paramIdx})`);
        params.push(category);
        paramIdx++;
      }

      if (brand) {
        conditions.push(`LOWER(p.brand) = LOWER($${paramIdx})`);
        params.push(brand);
        paramIdx++;
      }

      if (search) {
        conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
      }

      if (minPrice) {
        conditions.push(`p.retail_price >= $${paramIdx}`);
        params.push(parseFloat(minPrice));
        paramIdx++;
      }

      if (maxPrice) {
        conditions.push(`p.retail_price <= $${paramIdx}`);
        params.push(parseFloat(maxPrice));
        paramIdx++;
      }

      if (tag) {
        conditions.push(`$${paramIdx} = ANY(p.tags)`);
        params.push(tag);
        paramIdx++;
      }

      const whereClause = conditions.join(' AND ');

      // Validate sort column
      const validSorts = ['created_at', 'retail_price', 'rating', 'review_count', 'name'];
      const sortCol = validSorts.includes(sort) ? sort : 'created_at';
      const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

      // Count total
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM products p WHERE ${whereClause}`,
        params
      );
      const total = countResult.rows[0].total;

      // Fetch products with market data
      const limitVal = Math.min(parseInt(limit) || 50, 200);
      const offsetVal = parseInt(offset) || 0;

      const { rows } = await pool.query(`
        SELECT p.*,
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS current_lowest_ask,
          (SELECT MAX(b.bid_amount) FROM bids b WHERE b.product_id = p.id AND b.status = 'active') AS current_highest_bid,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = p.id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale_price
        FROM products p
        WHERE ${whereClause}
        ORDER BY p.${sortCol} ${sortOrder}
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...params, limitVal, offsetVal]);

      // Transform to API format
      const products = rows.map(row => ({
        id: row.id,
        vendor_id: row.vendor_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        long_description: row.long_description,
        category: row.category,
        brand: row.brand,
        retail_price: row.retail_price ? row.retail_price.toString() : '0',
        compare_at_price: row.compare_at_price ? row.compare_at_price.toString() : null,
        current_lowest_ask: row.current_lowest_ask ? row.current_lowest_ask.toString() : null,
        image_url: row.image_url,
        badge: row.badge,
        rating: row.rating ? row.rating.toString() : null,
        review_count: row.review_count || 0,
        quantity_available: row.quantity_available || 0,
        in_stock: row.in_stock,
        sku: row.sku,
        sizes: row.sizes,
        features: row.features,
        specifications: row.specifications,
        media: row.media,
        tags: row.tags,
        translations: row.translations || null,
        source_language: row.source_language || null,
        is_global_listing: row.is_global_listing || false,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      // Inject sponsored placements on first page when filtering by category or searching
      let finalProducts = products;
      if (offsetVal === 0 && (category || search)) {
        const spConditions = ["ss.status = 'active'", "ss.expires_at > NOW()", "ss.starts_at <= NOW()", "p.status = 'active'"];
        const spParams = [];
        let spIdx = 1;

        const orClauses = [];
        if (category) {
          orClauses.push(`LOWER(ss.category) = LOWER($${spIdx})`);
          spParams.push(category);
          spIdx++;
        }
        if (search) {
          orClauses.push(`(ss.keyword IS NOT NULL AND LOWER($${spIdx}) LIKE '%' || LOWER(ss.keyword) || '%')`);
          spParams.push(search);
          spIdx++;
        }
        if (orClauses.length > 0) {
          spConditions.push(`(${orClauses.join(' OR ')})`);
        }

        const { rows: spRows } = await pool.query(`
          SELECT DISTINCT ON (p.id) p.*,
            (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS current_lowest_ask
          FROM sponsored_slots ss
          JOIN products p ON p.id = ss.product_id
          WHERE ${spConditions.join(' AND ')}
          ORDER BY p.id, ss.created_at DESC
          LIMIT 2
        `, spParams);

        const sponsoredProducts = spRows.map(row => ({
          id: row.id,
          vendor_id: row.vendor_id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          long_description: row.long_description,
          category: row.category,
          brand: row.brand,
          retail_price: row.retail_price ? row.retail_price.toString() : '0',
          compare_at_price: row.compare_at_price ? row.compare_at_price.toString() : null,
          current_lowest_ask: row.current_lowest_ask ? row.current_lowest_ask.toString() : null,
          image_url: row.image_url,
          badge: row.badge,
          rating: row.rating ? row.rating.toString() : null,
          review_count: row.review_count || 0,
          quantity_available: row.quantity_available || 0,
          in_stock: row.in_stock,
          sku: row.sku,
          sizes: row.sizes,
          features: row.features,
          specifications: row.specifications,
          media: row.media,
          tags: row.tags,
          translations: row.translations || null,
          source_language: row.source_language || null,
          is_global_listing: row.is_global_listing || false,
          is_sponsored: true,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        const sponsoredIds = new Set(sponsoredProducts.map(s => s.id));
        finalProducts = [...sponsoredProducts, ...products.filter(p => !sponsoredIds.has(p.id))];
      }

      res.json({
        products: finalProducts,
        pagination: {
          total,
          limit: limitVal,
          offset: offsetVal,
          hasMore: offsetVal + limitVal < total,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch products', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id — single product with market data
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { rows } = await pool.query(`
        SELECT p.*,
          (SELECT MIN(a.ask_price) FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS lowest_ask,
          (SELECT MAX(b.bid_amount) FROM bids b WHERE b.product_id = p.id AND b.status = 'active') AS highest_bid,
          (SELECT s.sale_price FROM sales s WHERE s.product_id = p.id ORDER BY s.sold_at DESC LIMIT 1) AS last_sale,
          (SELECT COUNT(*)::int FROM asks a WHERE a.product_id = p.id AND a.status = 'active') AS active_asks,
          (SELECT COUNT(*)::int FROM bids b WHERE b.product_id = p.id AND b.status = 'active') AS active_bids
        FROM products p
        WHERE p.id = $1 AND p.status != 'deleted'
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const row = rows[0];
      const spread = (row.lowest_ask && row.highest_bid)
        ? parseFloat(row.lowest_ask) - parseFloat(row.highest_bid)
        : null;

      const product = {
        id: row.id,
        vendor_id: row.vendor_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        long_description: row.long_description,
        category: row.category,
        brand: row.brand,
        retail_price: row.retail_price ? row.retail_price.toString() : '0',
        compare_at_price: row.compare_at_price ? row.compare_at_price.toString() : null,
        current_lowest_ask: row.lowest_ask ? row.lowest_ask.toString() : null,
        image_url: row.image_url,
        badge: row.badge,
        rating: row.rating ? row.rating.toString() : null,
        review_count: row.review_count || 0,
        quantity_available: row.quantity_available || 0,
        in_stock: row.in_stock,
        sku: row.sku,
        sizes: row.sizes,
        features: row.features,
        specifications: row.specifications,
        media: row.media,
        tags: row.tags,
        translations: row.translations || null,
        source_language: row.source_language || null,
        is_global_listing: row.is_global_listing || false,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        market: {
          lowestAsk: row.lowest_ask ? parseFloat(row.lowest_ask) : null,
          highestBid: row.highest_bid ? parseFloat(row.highest_bid) : null,
          spread,
          lastSale: row.last_sale ? parseFloat(row.last_sale) : null,
          activeAsks: row.active_asks,
          activeBids: row.active_bids,
        },
      };

      res.json(product);
    } catch (err) {
      logger.error('Failed to fetch product', { error: err.message, id: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST / — create product (authenticated, requires active seller)
  router.post('/', authMiddleware, requireActiveSeller, async (req, res) => {
    try {
      const {
        name, description, long_description, category, brand,
        retail_price, compare_at_price, image_url, badge,
        sizes, features, specifications, media, tags, sku,
        is_global_listing
      } = req.body;

      if (!name || !category || !retail_price) {
        return res.status(400).json({ error: 'name, category, and retail_price are required' });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = uuidv4();

      const { rows } = await pool.query(`
        INSERT INTO products (id, vendor_id, name, slug, description, long_description, category, brand, retail_price, compare_at_price, image_url, badge, sizes, features, specifications, media, tags, sku, is_global_listing)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [id, req.user.id, name, slug, description, long_description, category, brand,
          retail_price, compare_at_price || null, image_url, badge || null,
          sizes || null, features || null, specifications ? JSON.stringify(specifications) : '{}',
          media ? JSON.stringify(media) : '[]', tags || null, sku || null, is_global_listing || false]);

      // Invalidate caches
      await redis.del('categories');

      productsCreated.inc();
      logger.info('Product created', { productId: id, userId: req.user.id });
      res.status(201).json(rows[0]);

      // Fire-and-forget background translation
      if (is_global_listing) {
        translateAndStore(rows[0]).catch(() => {});
      }
    } catch (err) {
      logger.error('Failed to create product', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /:id — update product (owner only)
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const existing = await pool.query('SELECT vendor_id FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (existing.rows[0].vendor_id && existing.rows[0].vendor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this product' });
      }

      const {
        name, description, long_description, category, brand,
        retail_price, compare_at_price, image_url, badge,
        sizes, features, specifications, media, tags, sku, status
      } = req.body;

      const updates = [];
      const params = [];
      let idx = 1;

      const fields = {
        name, description, long_description, category, brand,
        retail_price, compare_at_price, image_url, badge,
        sku, status
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updates.push(`${key} = $${idx}`);
          params.push(value);
          idx++;
        }
      }

      if (sizes !== undefined) { updates.push(`sizes = $${idx}`); params.push(sizes); idx++; }
      if (features !== undefined) { updates.push(`features = $${idx}`); params.push(features); idx++; }
      if (tags !== undefined) { updates.push(`tags = $${idx}`); params.push(tags); idx++; }
      if (specifications !== undefined) { updates.push(`specifications = $${idx}`); params.push(JSON.stringify(specifications)); idx++; }
      if (media !== undefined) { updates.push(`media = $${idx}`); params.push(JSON.stringify(media)); idx++; }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        updates.push(`slug = $${idx}`);
        params.push(slug);
        idx++;
      }

      params.push(id);
      const { rows } = await pool.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
      );

      await redis.del('categories');
      res.json(rows[0]);
    } catch (err) {
      logger.error('Failed to update product', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /:id — soft-delete product (owner only)
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await pool.query('SELECT vendor_id FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (existing.rows[0].vendor_id && existing.rows[0].vendor_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this product' });
      }

      await pool.query(
        "UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1",
        [id]
      );

      await redis.del('categories');
      res.json({ message: 'Product deleted' });
    } catch (err) {
      logger.error('Failed to delete product', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /:id/view — increment view count on active asks for a product
  router.post('/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query(
        "UPDATE asks SET views = views + 1 WHERE product_id = $1 AND status = 'active'",
        [id]
      );
      res.json({ success: true });
    } catch (err) {
      logger.error('Failed to record view', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
