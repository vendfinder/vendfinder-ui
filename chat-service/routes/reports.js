const express = require('express');
const router = express.Router({ mergeParams: true });
const logger = require('../logger');

module.exports = function (pool) {
  // POST /messages/:id/report - Report a message
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const messageId = req.params.id;
      const { reason, details } = req.body;

      const validReasons = ['spam', 'harassment', 'scam', 'inappropriate', 'other'];
      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({ error: `Reason must be one of: ${validReasons.join(', ')}` });
      }

      // Verify message exists
      const { rows: [msg] } = await pool.query(
        'SELECT id, conversation_id FROM messages WHERE id = $1',
        [messageId]
      );
      if (!msg) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Verify reporter is a participant
      const { rows: partCheck } = await pool.query(
        "SELECT id FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)",
        [msg.conversation_id, userId]
      );
      if (partCheck.length === 0) {
        return res.status(403).json({ error: 'Not a participant in this conversation' });
      }

      // Check for duplicate report
      const { rows: existingReport } = await pool.query(
        'SELECT id FROM message_reports WHERE message_id = $1 AND reporter_id = $2',
        [messageId, userId]
      );
      if (existingReport.length > 0) {
        return res.status(409).json({ error: 'You have already reported this message' });
      }

      // Create report
      const { rows: [report] } = await pool.query(`
        INSERT INTO message_reports (message_id, reporter_id, reason, details)
        VALUES ($1, $2, $3, $4)
        RETURNING id, message_id, reporter_id, reason, status, created_at
      `, [messageId, userId, reason, details || null]);

      // Flag the message
      await pool.query(
        'UPDATE messages SET is_flagged = TRUE WHERE id = $1',
        [messageId]
      );

      logger.info('Message reported', { reportId: report.id, messageId, reason, userId });

      res.status(201).json({
        id: report.id,
        messageId: report.message_id,
        reason: report.reason,
        status: report.status,
        createdAt: report.created_at,
      });
    } catch (err) {
      logger.error('Failed to report message', { error: err.message });
      res.status(500).json({ error: 'Failed to report message' });
    }
  });

  return router;
};
