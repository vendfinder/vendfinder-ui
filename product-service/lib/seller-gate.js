const logger = require('../logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

/**
 * Middleware to gate listing creation behind seller trial/fee.
 * Calls the user-service /auth/seller-status endpoint and checks
 * whether the seller's trial is active or the listing fee has been paid.
 *
 * Non-sellers and unauthenticated requests pass through.
 * If the status check fails, requests pass through (graceful degradation).
 */
async function requireActiveSeller(req, res, next) {
  try {
    const fetch = (await import('node-fetch')).default;
    const statusRes = await fetch(`${USER_SERVICE_URL}/auth/seller-status`, {
      headers: { 'Authorization': req.headers.authorization }
    });

    if (!statusRes.ok) {
      // Non-sellers or auth issues — pass through (other middleware handles auth)
      return next();
    }

    const data = await statusRes.json();

    if (data.canList) {
      return next();
    }

    return res.status(403).json({
      error: 'Seller subscription required',
      code: 'SELLER_FEE_REQUIRED',
      trialEndsAt: data.trialEndsAt,
      trialDaysRemaining: data.trialDaysRemaining,
      sellerFeePaid: data.sellerFeePaid,
    });
  } catch (err) {
    // If status check fails, allow through (graceful degradation)
    logger.warn('Seller gate check failed, allowing through', { error: err.message });
    next();
  }
}

module.exports = { requireActiveSeller };
