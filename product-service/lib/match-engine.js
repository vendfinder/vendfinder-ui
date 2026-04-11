const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

/**
 * Check for a bid/ask match on a given product+size and execute the sale
 * if the highest active bid meets or exceeds the lowest active ask.
 *
 * Uses SELECT ... FOR UPDATE inside a transaction to prevent race conditions.
 *
 * @param {import('pg').Pool} pool  - PostgreSQL connection pool
 * @param {import('ioredis').Redis} redis - Redis client
 * @param {{ productId: string, size: string|null, type: 'bid'|'ask' }} opts
 * @returns {Promise<{ matched: boolean, matchDetails?: { askId: string, bidId: string, price: number, buyerId: string, sellerId: string } }>}
 */
async function checkForMatch(pool, redis, { productId, size, type }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Build the size condition — NULL sizes must match with IS NULL
    const sizeCondition = size != null ? 'size = $2' : 'size IS NULL';
    const baseParams = size != null ? [productId, size] : [productId];

    // Lock the lowest active ask for this product+size
    const askResult = await client.query(`
      SELECT a.id, a.ask_price, a.seller_id
      FROM asks a
      WHERE a.product_id = $1
        AND ${sizeCondition}
        AND a.status = 'active'
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY a.ask_price ASC
      LIMIT 1
      FOR UPDATE
    `, baseParams);

    if (askResult.rows.length === 0) {
      await client.query('COMMIT');
      return { matched: false };
    }

    // Lock the highest active bid for this product+size
    const bidResult = await client.query(`
      SELECT b.id, b.bid_amount, b.buyer_id
      FROM bids b
      WHERE b.product_id = $1
        AND ${sizeCondition}
        AND b.status = 'active'
        AND (b.expires_at IS NULL OR b.expires_at > NOW())
      ORDER BY b.bid_amount DESC
      LIMIT 1
      FOR UPDATE
    `, baseParams);

    if (bidResult.rows.length === 0) {
      await client.query('COMMIT');
      return { matched: false };
    }

    const ask = askResult.rows[0];
    const bid = bidResult.rows[0];
    const askPrice = parseFloat(ask.ask_price);
    const bidAmount = parseFloat(bid.bid_amount);

    // Match condition: bid meets or exceeds the ask
    if (bidAmount < askPrice) {
      await client.query('COMMIT');
      return { matched: false };
    }

    // Sale executes at the ask price (seller's asking price)
    const salePrice = askPrice;
    const saleId = uuidv4();

    // Mark the ask as matched
    await client.query(
      "UPDATE asks SET status = 'matched', updated_at = NOW() WHERE id = $1",
      [ask.id]
    );

    // Mark the bid as matched
    await client.query(
      "UPDATE bids SET status = 'matched', updated_at = NOW() WHERE id = $1",
      [bid.id]
    );

    // Insert into the sales table (completed transaction record)
    await client.query(`
      INSERT INTO sales (id, product_id, ask_id, bid_id, seller_id, buyer_id, size, sale_price, sold_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [saleId, productId, ask.id, bid.id, ask.seller_id, bid.buyer_id, size || null, salePrice]);

    // Insert into sales_history for market data tracking
    await client.query(`
      INSERT INTO sales_history (id, product_id, size, sale_price, sale_date)
      VALUES ($1, $2, $3, $4, NOW())
    `, [uuidv4(), productId, size || null, salePrice]);

    // Update the product's current lowest ask by finding the next active ask
    // (uses a subquery so it correctly sets NULL if no more active asks exist)
    const nextLowestAsk = await client.query(`
      SELECT MIN(ask_price) AS lowest_ask
      FROM asks
      WHERE product_id = $1 AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [productId]);

    const newLowestAsk = nextLowestAsk.rows[0]?.lowest_ask || null;

    // Update product retail_price to reflect the new lowest ask if one exists
    if (newLowestAsk !== null) {
      await client.query(
        'UPDATE products SET retail_price = $1, updated_at = NOW() WHERE id = $2',
        [newLowestAsk, productId]
      );
    }

    await client.query('COMMIT');

    const matchDetails = {
      askId: ask.id,
      bidId: bid.id,
      price: salePrice,
      buyerId: bid.buyer_id,
      sellerId: ask.seller_id,
    };

    // Publish Redis event for downstream services (order-service, notifications, etc.)
    const eventPayload = {
      saleId,
      bidId: bid.id,
      askId: ask.id,
      productId,
      buyerId: bid.buyer_id,
      sellerId: ask.seller_id,
      size: size || null,
      price: salePrice,
      matchedAt: new Date().toISOString(),
    };

    try {
      await redis.publish('order:auto-match', JSON.stringify(eventPayload));
      logger.info('Auto-match event published', { saleId, productId, price: salePrice });
    } catch (redisErr) {
      // Log but don't fail the match — the DB transaction already committed
      logger.error('Failed to publish auto-match event', {
        error: redisErr.message,
        saleId,
        productId,
      });
    }

    logger.info('Bid/ask matched', {
      saleId,
      bidId: bid.id,
      askId: ask.id,
      productId,
      size,
      price: salePrice,
    });

    return { matched: true, matchDetails };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Match engine error', { error: err.message, productId, size, type });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { checkForMatch };
