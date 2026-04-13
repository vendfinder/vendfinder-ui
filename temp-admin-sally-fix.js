/**
 * Temporary admin endpoint to fix Sally's paywall issue
 * Add this to user-service index.js temporarily to unlock Sally's seller fee
 */

// Add this route to user-service index.js after the existing admin endpoints:

const tempAdminSallyFixRoute = `
// TEMPORARY ADMIN ENDPOINT - Remove Sally's paywall block
app.post('/admin/fix-sally-paywall', async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = email || 'sally@vendfinder.com';

    console.log('🔧 Admin: Removing paywall for user:', targetEmail);

    // First check current status
    const checkResult = await pool.query(
      'SELECT id, email, username, role, seller_fee_paid, seller_fee_paid_at FROM users WHERE email = $1',
      [targetEmail]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        email: targetEmail
      });
    }

    const user = checkResult.rows[0];
    console.log('📋 Current status:', {
      id: user.id,
      email: user.email,
      role: user.role,
      sellerFeePaid: user.seller_fee_paid,
      feePaidAt: user.seller_fee_paid_at
    });

    if (user.seller_fee_paid) {
      return res.json({
        success: true,
        message: 'User already has seller fee paid',
        user: {
          id: user.id,
          email: user.email,
          sellerFeePaid: user.seller_fee_paid,
          feePaidAt: user.seller_fee_paid_at
        }
      });
    }

    // Fix the paywall by marking seller fee as paid
    const updateResult = await pool.query(
      \`UPDATE users
       SET seller_fee_paid = TRUE,
           seller_fee_paid_at = NOW(),
           updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, username, seller_fee_paid, seller_fee_paid_at\`,
      [targetEmail]
    );

    const updatedUser = updateResult.rows[0];

    // Log the admin action
    logger.userAction('admin paywall removal', updatedUser.username, updatedUser.email, 'admin', {
      previousFeePaid: user.seller_fee_paid,
      newFeePaid: updatedUser.seller_fee_paid
    });

    console.log('✅ Paywall removed successfully for:', updatedUser.email);

    res.json({
      success: true,
      message: 'Paywall removed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        sellerFeePaid: updatedUser.seller_fee_paid,
        feePaidAt: updatedUser.seller_fee_paid_at
      }
    });

  } catch (error) {
    console.error('❌ Admin paywall removal error:', error);
    res.status(500).json({
      error: 'Failed to remove paywall',
      details: error.message
    });
  }
});`;

console.log(`
🚪 Sally Paywall Fix Instructions
================================

1. Add the following route to user-service-oauth/index.js after existing admin routes:

${tempAdminSallyFixRoute}

2. Restart the user-service pod:
   kubectl rollout restart deployment/user-service -n vendfinder

3. Run the fix command:

curl -X POST http://localhost:3004/admin/fix-sally-paywall \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "sally@vendfinder.com"
  }'

4. Verify the fix worked:

curl http://localhost:3004/auth/seller-status \\
  -H "Authorization: Bearer [sally's-auth-token]"

5. Remove the temporary admin endpoint after confirming fix.

Expected Response:
{
  "success": true,
  "message": "Paywall removed successfully",
  "user": {
    "id": "sally-user-id",
    "email": "sally@vendfinder.com",
    "sellerFeePaid": true,
    "feePaidAt": "2026-04-13T..."
  }
}

After this fix, Sally will be able to:
✅ Access her existing product listings
✅ Edit her products
✅ Create new listings
✅ Access her vendor dashboard without paywall blocking
`);

module.exports = tempAdminSallyFixRoute;