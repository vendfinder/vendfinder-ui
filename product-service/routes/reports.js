const express = require('express');
const { authMiddleware } = require('../auth');
const logger = require('../logger');

const VALID_TARGETS = ['product', 'user', 'review'];
const VALID_REASONS = ['counterfeit', 'spam', 'inappropriate', 'scam', 'other'];

async function sendSlackReportAlert(report) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: '#f59e0b',
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: '🚩 New Report Filed' } },
            {
              type: 'section', fields: [
                { type: 'mrkdwn', text: `*Target Type:*\n${report.target_type}` },
                { type: 'mrkdwn', text: `*Target ID:*\n\`${report.target_id}\`` },
                { type: 'mrkdwn', text: `*Reason:*\n${report.reason}` },
                { type: 'mrkdwn', text: `*Reporter:*\n\`${report.reporter_id}\`` },
              ],
            },
            ...(report.details ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Details:*\n${report.details}` } }] : []),
            { type: 'context', elements: [{ type: 'mrkdwn', text: `Filed at ${new Date().toISOString()}` }] },
          ],
        }],
      }),
    });
  } catch (err) {
    logger.error('Failed to send Slack report alert', { error: err.message });
  }
}

module.exports = function(pool) {
  const router = express.Router();

  // POST /reports — create a new report
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { target_type, target_id, reason, details } = req.body;

      if (!VALID_TARGETS.includes(target_type)) {
        return res.status(400).json({ error: 'Invalid target_type' });
      }
      if (!VALID_REASONS.includes(reason)) {
        return res.status(400).json({ error: 'Invalid reason' });
      }
      if (!target_id) {
        return res.status(400).json({ error: 'target_id required' });
      }
      if (details && details.length > 2000) {
        return res.status(400).json({ error: 'Details too long (max 2000 chars)' });
      }

      try {
        const { rows: [report] } = await pool.query(`
          INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, target_type, target_id, reason, details, reporter_id, created_at
        `, [req.user.id, target_type, target_id, reason, details || null]);

        logger.info('Report filed', { reportId: report.id, targetType: target_type, reporterId: req.user.id });
        sendSlackReportAlert(report).catch(() => {});

        res.status(201).json({ success: true, id: report.id });
      } catch (dbErr) {
        if (dbErr.code === '23505') {
          return res.status(409).json({ error: 'You already have a pending report for this item' });
        }
        throw dbErr;
      }
    } catch (err) {
      logger.error('Report submission error', { error: err.message });
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  // GET /me/reports — list current user's reports
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, target_type, target_id, reason, status, created_at FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC LIMIT 100',
        [req.user.id]
      );
      res.json({ reports: rows });
    } catch (err) {
      logger.error('Failed to fetch user reports', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
