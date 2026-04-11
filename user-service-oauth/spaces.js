/**
 * DigitalOcean Spaces Configuration
 * S3-compatible object storage for secure document uploads
 */

const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false, // Configures to use subdomain/virtual calling format
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vendfinder-kyc-documents';
const CDN_ENDPOINT = process.env.DO_SPACES_CDN_ENDPOINT;

/**
 * Generate secure filename for uploaded documents
 */
function generateSecureFilename(originalName, userId) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `kyc/${userId}/${timestamp}-${random}${ext}`;
}

/**
 * File filter for document uploads
 */
function fileFilter(req, file, cb) {
  // Only allow specific file types for KYC documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
  }
}

/**
 * Multer configuration for DigitalOcean Spaces upload
 */
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: 'private', // Keep documents private
    key: function (req, file, cb) {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return cb(new Error('User authentication required for file upload'));
      }

      const filename = generateSecureFilename(file.originalname, userId);
      cb(null, filename);
    },
    metadata: function (req, file, cb) {
      cb(null, {
        uploadedBy: req.user?.id || req.user?.userId || 'unknown',
        originalName: file.originalname,
        uploadTime: new Date().toISOString(),
        documentType: req.body?.documentType || 'unknown'
      });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file per request
  }
});

/**
 * Generate signed URL for secure document access
 */
function generateSignedUrl(key, expirationSeconds = 3600) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expirationSeconds
  };

  return s3.getSignedUrl('getObject', params);
}

/**
 * Generate public CDN URL if available
 */
function generateCDNUrl(key) {
  if (CDN_ENDPOINT) {
    return `${CDN_ENDPOINT}/${key}`;
  }
  return `https://${BUCKET_NAME}.${process.env.DO_SPACES_REGION || 'nyc3'}.digitaloceanspaces.com/${key}`;
}

/**
 * Delete document from storage
 */
async function deleteDocument(key) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Failed to delete document from Spaces:', error);
    return false;
  }
}

/**
 * Check if Spaces is properly configured
 */
function isConfigured() {
  return !!(
    process.env.DO_SPACES_KEY &&
    process.env.DO_SPACES_SECRET &&
    process.env.DO_SPACES_ENDPOINT
  );
}

/**
 * Test Spaces connection
 */
async function testConnection() {
  if (!isConfigured()) {
    throw new Error('DigitalOcean Spaces not configured');
  }

  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    return true;
  } catch (error) {
    console.error('Spaces connection test failed:', error);
    throw new Error(`Spaces connection failed: ${error.message}`);
  }
}

/**
 * Initialize Spaces bucket with CORS configuration
 */
async function initializeBucket() {
  if (!isConfigured()) {
    console.warn('DigitalOcean Spaces not configured - skipping initialization');
    return false;
  }

  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();

    // Set CORS configuration for web uploads
    const corsParams = {
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [{
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          AllowedOrigins: ['*'], // Configure this to your domain in production
          MaxAgeSeconds: 3000
        }]
      }
    };

    await s3.putBucketCors(corsParams).promise();
    console.log(`DigitalOcean Spaces bucket '${BUCKET_NAME}' configured successfully`);
    return true;
  } catch (error) {
    console.error('Failed to initialize Spaces bucket:', error);
    return false;
  }
}

module.exports = {
  s3,
  upload,
  generateSignedUrl,
  generateCDNUrl,
  deleteDocument,
  isConfigured,
  testConnection,
  initializeBucket,
  BUCKET_NAME
};