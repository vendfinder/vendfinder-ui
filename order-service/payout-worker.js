const { v4: uuidv4 } = require('uuid');
const paypal = require('./paypal');
const logger = require('./logger');

const PROCESS_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

module.exports = function startPayoutWorker(pool) {
  async function processEscrowReleases() {
    try {
      // Find orders where escrow auto-release time has passed and payout is still pending
      const { rows: releasable } = await pool.query(`
        SELECT p.id AS payout_id, p.net_amount, p.order_id,
               o.order_number, o.seller_id, o.escrow_status,
               pm.account_id AS paypal_email, pm.method_type
        FROM payouts p
        JOIN orders o ON o.id = p.order_id
        LEFT JOIN payout_methods pm ON pm.seller_id = o.seller_id AND pm.is_primary = true
        WHERE p.status = 'pending'
          AND o.auto_release_at IS NOT NULL
          AND o.auto_release_at <= NOW()
          AND o.escrow_status != 'disputed'
          AND o.status IN ('completed', 'delivered')
      `);

      if (releasable.length === 0) return;

      logger.info(`Processing ${releasable.length} escrow release(s)`);

      for (const row of releasable) {
        try {
          // Update escrow status
          await pool.query(`
            UPDATE orders SET escrow_status = 'released', updated_at = NOW()
            WHERE id = $1 AND escrow_status = 'held'
          `, [row.order_id]);

          if (row.method_type === 'paypal' && row.paypal_email) {
            await processPayPalPayout(pool, row);
          } else {
            // No PayPal payout method — mark payout as needing manual processing
            logger.info('No PayPal payout method for seller, payout needs manual processing', {
              payoutId: row.payout_id,
              sellerId: row.seller_id,
            });
          }

          // Log escrow release event
          await pool.query(`
            INSERT INTO order_events (id, order_id, event_type, actor_role, metadata)
            VALUES ($1, $2, 'escrow_released', 'system', $3)
          `, [uuidv4(), row.order_id, JSON.stringify({ payout_id: row.payout_id })]);

        } catch (err) {
          logger.error('Failed to process escrow release', {
            payoutId: row.payout_id,
            orderId: row.order_id,
            error: err.message,
          });
        }
      }
    } catch (err) {
      logger.error('Escrow release check failed', { error: err.message });
    }
  }

  async function processPayPalPayout(pool, row) {
    const { payout_id, net_amount, order_id, order_number, paypal_email } = row;

    // Mark as processing
    await pool.query(`
      UPDATE payouts SET status = 'processing', method = 'paypal', updated_at = NOW()
      WHERE id = $1
    `, [payout_id]);

    try {
      const result = await paypal.createPayout(
        paypal_email,
        parseFloat(net_amount),
        'USD',
        { payout_id, order_number }
      );

      const batchId = result.batch_header.payout_batch_id;

      await pool.query(`
        UPDATE payouts
        SET paypal_batch_id = $2, updated_at = NOW()
        WHERE id = $1
      `, [payout_id, batchId]);

      logger.info('PayPal payout initiated', {
        payoutId: payout_id,
        orderId: order_id,
        batchId,
        amount: net_amount,
        recipient: paypal_email,
      });
    } catch (err) {
      await pool.query(`
        UPDATE payouts SET status = 'failed', error_message = $2, updated_at = NOW()
        WHERE id = $1
      `, [payout_id, err.message]);

      logger.error('PayPal payout failed', {
        payoutId: payout_id,
        error: err.message,
      });
    }
  }

  async function checkPayoutStatuses() {
    try {
      // Check processing payouts for completion
      const { rows } = await pool.query(`
        SELECT id, paypal_batch_id
        FROM payouts
        WHERE status = 'processing' AND paypal_batch_id IS NOT NULL
      `);

      for (const payout of rows) {
        try {
          const status = await paypal.getPayoutStatus(payout.paypal_batch_id);
          const batchStatus = status.batch_header.batch_status;

          if (batchStatus === 'SUCCESS') {
            const itemId = status.items?.[0]?.payout_item_id;
            await pool.query(`
              UPDATE payouts
              SET status = 'completed', paypal_item_id = $2, processed_at = NOW(), updated_at = NOW()
              WHERE id = $1
            `, [payout.id, itemId || null]);

            logger.info('PayPal payout completed', { payoutId: payout.id, batchId: payout.paypal_batch_id });
          } else if (['DENIED', 'CANCELED'].includes(batchStatus)) {
            const errorMsg = status.items?.[0]?.errors?.message || `Batch status: ${batchStatus}`;
            await pool.query(`
              UPDATE payouts SET status = 'failed', error_message = $2, updated_at = NOW()
              WHERE id = $1
            `, [payout.id, errorMsg]);

            logger.error('PayPal payout denied', { payoutId: payout.id, batchStatus });
          }
          // PENDING/PROCESSING - leave as-is, check again next cycle
        } catch (err) {
          logger.warn('Failed to check payout status', {
            payoutId: payout.id,
            error: err.message,
          });
        }
      }
    } catch (err) {
      logger.error('Payout status check failed', { error: err.message });
    }
  }

  // Run both tasks on an interval
  async function tick() {
    await processEscrowReleases();
    await checkPayoutStatuses();
  }

  // Start the worker
  logger.info('Payout worker started', { intervalMs: PROCESS_INTERVAL_MS });
  tick(); // Run immediately on startup
  const interval = setInterval(tick, PROCESS_INTERVAL_MS);

  return { stop: () => clearInterval(interval) };
};
