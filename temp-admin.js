/**
 * Temporary admin endpoint to add to user-service for password reset
 * Add this to user-service index.js temporarily
 */

// Add this route to user-service index.js after line 1900:

/*
// TEMPORARY ADMIN ENDPOINT - REMOVE AFTER TESTING
app.post('/admin/reset-password-temp', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and newPassword required' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 OR email = $3 RETURNING username, email',
      [hashedPassword, username, `${username}@example.com`]
    );

    if (result.rowCount > 0) {
      logger.userAction('admin password reset', result.rows[0].username, result.rows[0].email, 'admin');
      res.json({
        success: true,
        message: 'Password reset successfully',
        user: result.rows[0]
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});
*/

console.log(`
Add the above route to user-service index.js, restart the pod, then run:

curl -X POST http://localhost:3004/admin/reset-password-temp \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "testuser12345",
    "newPassword": "testpass123"
  }'
`);