const express = require('express');
const logger = require('../logger');

module.exports = function (pool) {
  const router = express.Router();

  // GET /me/payout-methods — list seller's payout methods
  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM payout_methods WHERE seller_id = $1 ORDER BY is_primary DESC, created_at ASC`,
        [req.user.id]
      );

      const methods = rows.map(toJSON);
      res.json({ methods });
    } catch (err) {
      logger.error('Failed to fetch payout methods', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /me/payout-methods — add a new payout method
  router.post('/', async (req, res) => {
    try {
      const { method_type, label, account_id, account_name, national_id, date_of_birth, address } = req.body;

      if (!method_type || !account_id) {
        return res.status(400).json({ error: 'method_type and account_id are required' });
      }

      if (!['alipay', 'paypal', 'wechat'].includes(method_type)) {
        return res.status(400).json({ error: 'method_type must be alipay, paypal, or wechat' });
      }

      // CNY payouts to Alipay/WeChat require the recipient's full legal
      // name (as on their Alipay/WeChat account), Chinese national ID, date of birth, and address.
      // PayPal doesn't need these fields.
      if (method_type === 'alipay' || method_type === 'wechat') {
        if (!account_name || !String(account_name).trim()) {
          return res.status(400).json({ error: 'account_name is required for Alipay/WeChat payouts' });
        }
        if (!national_id || !String(national_id).trim()) {
          return res.status(400).json({ error: 'national_id is required for Alipay/WeChat payouts' });
        }
        if (!date_of_birth || !String(date_of_birth).trim()) {
          return res.status(400).json({ error: 'date_of_birth is required for Alipay/WeChat payouts' });
        }
        if (!address || !String(address).trim()) {
          return res.status(400).json({ error: 'address is required for Alipay/WeChat payouts' });
        }
        // Chinese national ID is 18 characters (17 digits + check digit which can be X)
        const idTrimmed = String(national_id).trim().toUpperCase();
        if (!/^\d{17}[\dX]$/.test(idTrimmed)) {
          return res.status(400).json({ error: 'national_id must be an 18-character Chinese national ID (身份证号)' });
        }
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date_of_birth).trim())) {
          return res.status(400).json({ error: 'date_of_birth must be in YYYY-MM-DD format' });
        }
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Auto-primary if first method
        const { rows: existing } = await client.query(
          'SELECT id FROM payout_methods WHERE seller_id = $1 LIMIT 1',
          [req.user.id]
        );
        const isPrimary = existing.length === 0;

        const { rows } = await client.query(
          `INSERT INTO payout_methods (seller_id, method_type, label, account_id, account_name, national_id, date_of_birth, address, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            req.user.id,
            method_type,
            label ? String(label).trim() : null,
            String(account_id).trim(),
            account_name ? String(account_name).trim() : null,
            national_id ? String(national_id).trim().toUpperCase() : null,
            date_of_birth ? String(date_of_birth).trim() : null,
            address ? String(address).trim() : null,
            isPrimary,
          ]
        );

        await client.query('COMMIT');
        res.status(201).json({ method: toJSON(rows[0]) });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Failed to create payout method', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /me/payout-methods/:id — update account details
  router.put('/:id', async (req, res) => {
    try {
      const { label, account_id, account_name, national_id, date_of_birth, address } = req.body;

      // Validate national_id format if provided
      let normalizedNationalId = null;
      if (national_id !== undefined && national_id !== null && String(national_id).trim() !== '') {
        normalizedNationalId = String(national_id).trim().toUpperCase();
        if (!/^\d{17}[\dX]$/.test(normalizedNationalId)) {
          return res.status(400).json({ error: 'national_id must be an 18-character Chinese national ID (身份证号)' });
        }
      }

      // Validate date_of_birth format if provided
      let normalizedDateOfBirth = null;
      if (date_of_birth !== undefined && date_of_birth !== null && String(date_of_birth).trim() !== '') {
        normalizedDateOfBirth = String(date_of_birth).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateOfBirth)) {
          return res.status(400).json({ error: 'date_of_birth must be in YYYY-MM-DD format' });
        }
      }

      const { rows } = await pool.query(
        `UPDATE payout_methods
         SET label = COALESCE($1, label),
             account_id = COALESCE($2, account_id),
             account_name = COALESCE($3, account_name),
             national_id = COALESCE($4, national_id),
             date_of_birth = COALESCE($5, date_of_birth),
             address = COALESCE($6, address),
             updated_at = NOW()
         WHERE id = $7 AND seller_id = $8
         RETURNING *`,
        [
          label !== undefined ? (label ? String(label).trim() : null) : null,
          account_id !== undefined ? String(account_id).trim() : null,
          account_name !== undefined ? (account_name ? String(account_name).trim() : null) : null,
          normalizedNationalId,
          normalizedDateOfBirth,
          address !== undefined ? (address ? String(address).trim() : null) : null,
          req.params.id,
          req.user.id,
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Payout method not found' });
      }

      res.json({ method: toJSON(rows[0]) });
    } catch (err) {
      logger.error('Failed to update payout method', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /me/payout-methods/:id/primary — set as primary
  router.put('/:id/primary', async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const { rows: check } = await client.query(
        'SELECT id FROM payout_methods WHERE id = $1 AND seller_id = $2',
        [req.params.id, req.user.id]
      );
      if (check.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Payout method not found' });
      }

      // Unset current primary
      await client.query(
        'UPDATE payout_methods SET is_primary = FALSE, updated_at = NOW() WHERE seller_id = $1 AND is_primary = TRUE',
        [req.user.id]
      );

      // Set new primary
      const { rows } = await client.query(
        'UPDATE payout_methods SET is_primary = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
        [req.params.id]
      );

      await client.query('COMMIT');
      res.json({ method: toJSON(rows[0]) });
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed to set primary payout method', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });

  // DELETE /me/payout-methods/:id — remove a payout method
  router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: deleted } = await client.query(
        'DELETE FROM payout_methods WHERE id = $1 AND seller_id = $2 RETURNING *',
        [req.params.id, req.user.id]
      );

      if (deleted.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Payout method not found' });
      }

      // If we deleted the primary, promote the next one
      if (deleted[0].is_primary) {
        await client.query(
          `UPDATE payout_methods SET is_primary = TRUE, updated_at = NOW()
           WHERE id = (
             SELECT id FROM payout_methods WHERE seller_id = $1 ORDER BY created_at ASC LIMIT 1
           )`,
          [req.user.id]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete payout method', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });

  return router;
};

function toJSON(row) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    methodType: row.method_type,
    label: row.label,
    accountId: row.account_id,
    accountName: row.account_name,
    nationalId: row.national_id,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
