/**
 * Platform Security Routes - Apply KYC restrictions to buying/selling
 */

const express = require('express');
const { requireKYCForSelling, requireKYCForHighValuePurchases, getKYCDetails } = require('../middleware/kycMiddleware');
const { authMiddleware } = require('../auth');

const router = express.Router();

/**
 * GET /api/security/kyc-check
 * Check current user's KYC status and permissions
 */
router.get('/kyc-check', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const kycDetails = await getKYCDetails(userId);

    const permissions = {
      canSell: kycDetails.user?.kyc_status === 'verified',
      canBuyHighValue: kycDetails.user?.kyc_status === 'verified',
      canBuyLowValue: true, // Anyone can make small purchases
      kycStatus: kycDetails.user?.kyc_status || 'not_required',
      verifiedAt: kycDetails.user?.kyc_verified_at,
      extractedData: kycDetails.extractedData ? {
        fullName: kycDetails.extractedData.full_name,
        dateOfBirth: kycDetails.extractedData.date_of_birth,
        idNumber: kycDetails.extractedData.id_number,
        address: {
          line1: kycDetails.extractedData.address_line1,
          city: kycDetails.extractedData.city,
          state: kycDetails.extractedData.state,
          zipCode: kycDetails.extractedData.zip_code
        },
        confidence: kycDetails.extractedData.extraction_confidence
      } : null
    };

    res.json({
      success: true,
      permissions,
      message: permissions.canSell
        ? 'Account fully verified - all platform features available'
        : 'Identity verification required for selling'
    });

  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({
      error: 'Failed to check account status',
      code: 'KYC_CHECK_FAILED'
    });
  }
});

/**
 * GET /api/security/wise-data
 * Get extracted data formatted for Wise/payment services
 */
router.get('/wise-data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const kycDetails = await getKYCDetails(userId);

    if (!kycDetails.extractedData) {
      return res.status(404).json({
        error: 'No verified identity data found',
        code: 'NO_EXTRACTED_DATA',
        message: 'Complete KYC verification to access payment data'
      });
    }

    const data = kycDetails.extractedData;

    // Format data for Wise API
    const wisePayload = {
      fullName: data.full_name,
      dateOfBirth: data.date_of_birth,
      idNumber: data.id_number,
      address: {
        line1: data.address_line1,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        country: 'US'
      },
      metadata: {
        extractionConfidence: data.extraction_confidence,
        documentType: kycDetails.documents[0]?.document_type,
        verifiedAt: kycDetails.user.kyc_verified_at
      }
    };

    res.json({
      success: true,
      wisePayload,
      message: 'Identity data ready for payment service integration'
    });

  } catch (error) {
    console.error('Wise data error:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment data',
      code: 'PAYMENT_DATA_ERROR'
    });
  }
});

/**
 * POST /api/security/validate-selling
 * Validate if user can create listings/sell products
 */
router.post('/validate-selling', authMiddleware, requireKYCForSelling, (req, res) => {
  res.json({
    success: true,
    canSell: true,
    message: 'Account verified - selling permissions granted'
  });
});

/**
 * POST /api/security/validate-purchase
 * Validate if user can make a purchase (checks high-value restrictions)
 */
router.post('/validate-purchase', authMiddleware, requireKYCForHighValuePurchases(500), (req, res) => {
  const amount = req.body.amount || 0;

  res.json({
    success: true,
    canPurchase: true,
    amount: amount,
    message: amount >= 500
      ? 'High-value purchase approved - account verified'
      : 'Purchase approved'
  });
});

module.exports = router;