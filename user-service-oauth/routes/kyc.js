/**
 * KYC (Know Your Customer) Routes
 * Handles document upload, OCR processing, and verification for payout compliance
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { upload, generateSignedUrl, deleteDocument, isConfigured } = require('../spaces');
const { processKYCDocument } = require('../ocr');
const { authMiddleware } = require('../auth');

const router = express.Router();

/**
 * GET /api/kyc/status
 * Get user's KYC status and requirements
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const userQuery = `
      SELECT kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at,
             kyc_business_name, kyc_tax_id, kyc_country, kyc_notes,
             primary_kyc_document_id
      FROM users
      WHERE id = $1
    `;
    const { rows: [user] } = await req.pool.query(userQuery, [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get uploaded documents
    const documentsQuery = `
      SELECT id, document_type, file_name, upload_status, processing_status,
             verification_status, created_at, processed_at, verified_at, rejection_reason
      FROM kyc_documents
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const { rows: documents } = await req.pool.query(documentsQuery, [userId]);

    // Check if we have extracted data for verified documents
    const extractedDataQuery = `
      SELECT kd.id as document_id, ked.full_name, ked.date_of_birth, ked.id_number,
             ked.address_line1, ked.city, ked.state, ked.zip_code, ked.extraction_confidence,
             ked.manual_review_required
      FROM kyc_documents kd
      LEFT JOIN kyc_extracted_data ked ON kd.id = ked.document_id
      WHERE kd.user_id = $1 AND kd.verification_status = 'verified'
    `;
    const { rows: extractedData } = await req.pool.query(extractedDataQuery, [userId]);

    res.json({
      kycStatus: user.kyc_status,
      kycRequired: !!user.kyc_required_at,
      kycSubmitted: !!user.kyc_submitted_at,
      kycVerified: !!user.kyc_verified_at,
      businessInfo: {
        businessName: user.kyc_business_name,
        taxId: user.kyc_tax_id,
        country: user.kyc_country
      },
      documents: documents,
      extractedData: extractedData[0] || null,
      notes: user.kyc_notes,
      spacesConfigured: isConfigured()
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

/**
 * POST /api/kyc/upload
 * Upload KYC document (driver's license, state ID, passport)
 */
router.post('/upload', authMiddleware, (req, res) => {
  // Check if Spaces is configured
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Document upload service not configured',
      code: 'STORAGE_NOT_CONFIGURED'
    });
  }

  // Use multer middleware with error handling
  upload.single('document')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File too large. Maximum size is 10MB.',
          code: 'FILE_TOO_LARGE'
        });
      }

      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
          error: 'Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.',
          code: 'INVALID_FILE_TYPE'
        });
      }

      return res.status(400).json({
        error: err.message || 'Upload failed',
        code: 'UPLOAD_FAILED'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    try {
      const userId = req.user.userId || req.user.id;
      const documentType = req.body.documentType || 'drivers_license';

      // Validate document type
      const validTypes = ['drivers_license', 'state_id', 'passport', 'national_id'];
      if (!validTypes.includes(documentType)) {
        // Clean up uploaded file
        await deleteDocument(req.file.key);
        return res.status(400).json({
          error: 'Invalid document type',
          code: 'INVALID_DOCUMENT_TYPE'
        });
      }

      // Save document record to database
      const documentId = uuidv4();
      const insertQuery = `
        INSERT INTO kyc_documents (
          id, user_id, document_type, file_url, file_name, file_size, mime_type,
          upload_status, processing_status, verification_status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const metadata = JSON.stringify({
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        userAgent: req.get('User-Agent') || '',
        ipAddress: req.ip || req.connection.remoteAddress || ''
      });

      const { rows: [document] } = await req.pool.query(insertQuery, [
        documentId,
        userId,
        documentType,
        req.file.location, // S3/Spaces URL
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        'uploaded',
        'pending',
        'unverified',
        metadata
      ]);

      // Update user's KYC status
      await req.pool.query(
        'UPDATE users SET kyc_status = $1, kyc_submitted_at = NOW() WHERE id = $2',
        ['submitted', userId]
      );

      // Start background OCR processing (don't wait for it)
      processDocumentAsync(req.pool, document.id, req.file.location, documentType)
        .catch(error => {
          console.error('Background OCR processing failed:', error);
        });

      res.status(201).json({
        documentId: document.id,
        status: 'uploaded',
        processingStatus: 'pending',
        message: 'Document uploaded successfully. Processing will begin shortly.',
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        }
      });
    } catch (error) {
      console.error('Error saving document record:', error);

      // Clean up uploaded file on database error
      if (req.file?.key) {
        await deleteDocument(req.file.key).catch(console.error);
      }

      res.status(500).json({
        error: 'Failed to save document record',
        code: 'DATABASE_ERROR'
      });
    }
  });
});

/**
 * GET /api/kyc/documents/:id
 * Get document details and signed URL for viewing
 */
router.get('/documents/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const documentId = req.params.id;

    const documentQuery = `
      SELECT kd.*, ked.full_name, ked.date_of_birth, ked.id_number, ked.address_line1,
             ked.city, ked.state, ked.zip_code, ked.extraction_confidence,
             ked.manual_review_required, ked.manual_review_notes
      FROM kyc_documents kd
      LEFT JOIN kyc_extracted_data ked ON kd.id = ked.document_id
      WHERE kd.id = $1 AND kd.user_id = $2
    `;

    const { rows: [document] } = await req.pool.query(documentQuery, [documentId, userId]);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate signed URL for document access
    const key = document.file_url.split('/').slice(-2).join('/'); // Extract key from full URL
    const signedUrl = generateSignedUrl(key, 3600); // 1 hour expiration

    res.json({
      document: {
        id: document.id,
        type: document.document_type,
        fileName: document.file_name,
        fileSize: document.file_size,
        uploadStatus: document.upload_status,
        processingStatus: document.processing_status,
        verificationStatus: document.verification_status,
        createdAt: document.created_at,
        processedAt: document.processed_at,
        verifiedAt: document.verified_at,
        rejectionReason: document.rejection_reason
      },
      extractedData: document.full_name ? {
        fullName: document.full_name,
        dateOfBirth: document.date_of_birth,
        idNumber: document.id_number,
        address: document.address_line1,
        city: document.city,
        state: document.state,
        zipCode: document.zip_code,
        confidence: document.extraction_confidence,
        requiresReview: document.manual_review_required,
        reviewNotes: document.manual_review_notes
      } : null,
      signedUrl: signedUrl
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * POST /api/kyc/documents/:id/reprocess
 * Reprocess document OCR (if processing failed)
 */
router.post('/documents/:id/reprocess', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const documentId = req.params.id;

    const documentQuery = `
      SELECT * FROM kyc_documents
      WHERE id = $1 AND user_id = $2 AND processing_status IN ('failed', 'completed')
    `;

    const { rows: [document] } = await req.pool.query(documentQuery, [documentId, userId]);

    if (!document) {
      return res.status(404).json({ error: 'Document not found or cannot be reprocessed' });
    }

    // Reset processing status
    await req.pool.query(
      'UPDATE kyc_documents SET processing_status = $1, processed_at = NULL WHERE id = $2',
      ['pending', documentId]
    );

    // Start background processing
    processDocumentAsync(req.pool, documentId, document.file_url, document.document_type)
      .catch(error => {
        console.error('Reprocessing failed:', error);
      });

    res.json({
      message: 'Document reprocessing started',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error reprocessing document:', error);
    res.status(500).json({ error: 'Failed to reprocess document' });
  }
});

/**
 * DELETE /api/kyc/documents/:id
 * Delete uploaded document and reset KYC status if needed
 */
router.delete('/documents/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const documentId = req.params.id;

    const documentQuery = `
      SELECT * FROM kyc_documents
      WHERE id = $1 AND user_id = $2 AND verification_status != 'verified'
    `;

    const { rows: [document] } = await req.pool.query(documentQuery, [documentId, userId]);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found or cannot be deleted (verified documents cannot be removed)'
      });
    }

    // Delete from storage
    try {
      const key = document.file_url.split('/').slice(-2).join('/');
      await deleteDocument(key);
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database (CASCADE will remove extracted data)
    await req.pool.query('DELETE FROM kyc_documents WHERE id = $1', [documentId]);

    // Check if user has any remaining documents
    const remainingQuery = `
      SELECT COUNT(*) as count FROM kyc_documents WHERE user_id = $1
    `;
    const { rows: [{ count }] } = await req.pool.query(remainingQuery, [userId]);

    // If no documents remain, reset KYC status to allow fresh upload
    if (parseInt(count) === 0) {
      await req.pool.query(
        'UPDATE users SET kyc_status = $1, kyc_submitted_at = NULL WHERE id = $2',
        ['required', userId]
      );

      res.json({
        message: 'Document deleted successfully. You can now upload a new document.',
        kycStatusReset: true
      });
    } else {
      res.json({
        message: 'Document deleted successfully.',
        kycStatusReset: false
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * Background OCR processing function
 */
async function processDocumentAsync(pool, documentId, fileUrl, documentType) {
  try {
    console.log(`Starting OCR processing for document ${documentId}`);

    // Update status to processing
    await pool.query(
      'UPDATE kyc_documents SET processing_status = $1 WHERE id = $2',
      ['processing', documentId]
    );

    // Process with OCR
    const result = await processKYCDocument(fileUrl, documentType);

    if (!result.success) {
      // Provide detailed error message based on failure type
      let userFriendlyError = 'Document processing failed';
      let retryable = false;

      if (result.error.includes('No text detected')) {
        userFriendlyError = 'Could not read text in your ID. Please ensure your photo is clear, well-lit, and shows all text clearly. Try taking a new photo with better lighting.';
        retryable = true;
      } else if (result.error.includes('invalid')) {
        userFriendlyError = 'Invalid image format. Please upload a clear JPEG, PNG, or PDF file.';
        retryable = true;
      } else if (result.error.includes('quality')) {
        userFriendlyError = 'Image quality too low. Please take a clearer, higher resolution photo.';
        retryable = true;
      } else {
        userFriendlyError = 'Technical processing error. Please try uploading again.';
        retryable = true;
      }

      // Mark as failed with detailed error info
      await pool.query(
        'UPDATE kyc_documents SET processing_status = $1, rejection_reason = $2, processed_at = NOW() WHERE id = $3',
        ['failed', userFriendlyError, documentId]
      );

      console.error(`OCR processing failed for document ${documentId}:`, result.error);
      console.log(`User-friendly error: ${userFriendlyError}`);
      return;
    }

    // Save extracted data
    const insertDataQuery = `
      INSERT INTO kyc_extracted_data (
        document_id, full_name, first_name, last_name, date_of_birth, id_number,
        address_line1, city, state, zip_code, expiration_date,
        extraction_confidence, extraction_service, raw_ocr_data, field_confidence,
        manual_review_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `;

    const data = result.extractedData;
    const requiresReview = result.overallConfidence < 0.7; // Require review if confidence is low

    await pool.query(insertDataQuery, [
      documentId,
      data.fullName,
      data.firstName,
      data.lastName,
      data.dateOfBirth,
      data.idNumber,
      data.address,
      data.city,
      data.state,
      data.zipCode,
      data.expirationDate,
      result.overallConfidence,
      result.ocrService,
      JSON.stringify(result.rawOCR),
      JSON.stringify(data.confidence),
      requiresReview
    ]);

    // Update document status
    const verificationStatus = requiresReview ? 'requires_review' : 'unverified';
    await pool.query(
      'UPDATE kyc_documents SET processing_status = $1, verification_status = $2, processed_at = NOW() WHERE id = $3',
      ['completed', verificationStatus, documentId]
    );

    console.log(`OCR processing completed for document ${documentId} (confidence: ${result.overallConfidence})`);
  } catch (error) {
    console.error(`OCR processing error for document ${documentId}:`, error);

    // Mark as failed
    await pool.query(
      'UPDATE kyc_documents SET processing_status = $1, processed_at = NOW() WHERE id = $2',
      ['failed', documentId]
    ).catch(console.error);
  }
}

module.exports = router;