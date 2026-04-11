/**
 * KYC Verification Middleware
 * Enforces KYC requirements for platform access
 */

const pool = require('../db');

/**
 * Check if user has completed KYC verification
 */
async function checkKYCStatus(userId) {
  const result = await pool.query(
    'SELECT kyc_status, kyc_verified_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  return {
    isVerified: user.kyc_status === 'verified',
    status: user.kyc_status,
    verifiedAt: user.kyc_verified_at
  };
}

/**
 * Middleware: Require KYC verification for selling
 */
function requireKYCForSelling(req, res, next) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const kycStatus = await checkKYCStatus(userId);

      if (!kycStatus.isVerified) {
        return res.status(403).json({
          error: 'KYC verification required to sell products',
          code: 'KYC_VERIFICATION_REQUIRED',
          currentStatus: kycStatus.status,
          message: 'Complete identity verification to start selling on VendFinder',
          redirectUrl: '/dashboard/kyc'
        });
      }

      next();
    } catch (error) {
      console.error('KYC check error:', error);
      return res.status(500).json({
        error: 'Unable to verify account status',
        code: 'KYC_CHECK_FAILED'
      });
    }
  };
}

/**
 * Middleware: Require KYC verification for high-value purchases
 */
function requireKYCForHighValuePurchases(threshold = 500) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      const orderTotal = req.body.total || req.body.amount || 0;

      if (orderTotal >= threshold) {
        const kycStatus = await checkKYCStatus(userId);

        if (!kycStatus.isVerified) {
          return res.status(403).json({
            error: `KYC verification required for purchases over $${threshold}`,
            code: 'KYC_VERIFICATION_REQUIRED_HIGH_VALUE',
            currentStatus: kycStatus.status,
            orderTotal: orderTotal,
            threshold: threshold,
            message: 'Complete identity verification to make high-value purchases',
            redirectUrl: '/dashboard/kyc'
          });
        }
      }

      next();
    } catch (error) {
      console.error('KYC check error:', error);
      return res.status(500).json({
        error: 'Unable to verify account status',
        code: 'KYC_CHECK_FAILED'
      });
    }
  };
}

/**
 * Middleware: Check KYC status and add to request
 */
function addKYCStatusToRequest(req, res, next) {
  return async (req, res, next) => {
    try {
      if (req.user && (req.user.userId || req.user.id)) {
        const userId = req.user.userId || req.user.id;
        req.user.kycStatus = await checkKYCStatus(userId);
      }
      next();
    } catch (error) {
      // Don't block request if KYC check fails, just log
      console.warn('KYC status check failed:', error.message);
      req.user.kycStatus = { isVerified: false, status: 'unknown' };
      next();
    }
  };
}

/**
 * Get detailed KYC information for a user
 */
async function getKYCDetails(userId) {
  const userQuery = `
    SELECT kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at,
           kyc_business_name, kyc_tax_id, kyc_country, kyc_notes
    FROM users WHERE id = $1
  `;

  const documentsQuery = `
    SELECT kd.*, ked.full_name, ked.date_of_birth, ked.id_number,
           ked.address_line1, ked.city, ked.state, ked.zip_code,
           ked.extraction_confidence
    FROM kyc_documents kd
    LEFT JOIN kyc_extracted_data ked ON kd.id = ked.document_id
    WHERE kd.user_id = $1
    ORDER BY kd.created_at DESC
  `;

  const [userResult, documentsResult] = await Promise.all([
    pool.query(userQuery, [userId]),
    pool.query(documentsQuery, [userId])
  ]);

  return {
    user: userResult.rows[0] || null,
    documents: documentsResult.rows || [],
    extractedData: documentsResult.rows.find(doc => doc.full_name) || null
  };
}

module.exports = {
  checkKYCStatus,
  requireKYCForSelling,
  requireKYCForHighValuePurchases,
  addKYCStatusToRequest,
  getKYCDetails
};