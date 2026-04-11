/**
 * OCR Service for KYC Document Data Extraction
 * Supports Google Cloud Vision API with fallback options
 */

const vision = require('@google-cloud/vision');
const { generateSignedUrl } = require('./spaces');

/**
 * Google Cloud Vision API client
 * Automatically uses GOOGLE_APPLICATION_CREDENTIALS environment variable
 * or service account key file for authentication
 */
let visionClient = null;

/**
 * Initialize Vision API client
 */
function initializeVision() {
  try {
    if (process.env.GOOGLE_VISION_API_KEY) {
      // Use API key authentication
      visionClient = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account key file
      visionClient = new vision.ImageAnnotatorClient();
    } else {
      console.warn('Google Vision API not configured - OCR will be disabled');
      return false;
    }

    console.log('Google Vision API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Vision API:', error);
    return false;
  }
}

/**
 * Extract text from image using Google Vision API
 */
async function extractTextFromImage(imageUrl) {
  if (!visionClient) {
    throw new Error('Google Vision API not configured');
  }

  try {
    // Generate signed URL for Vision API to access the image
    const signedUrl = generateSignedUrl(imageUrl.replace(/.*\//, ''), 1800); // 30 minutes

    const [result] = await visionClient.textDetection({
      image: { source: { imageUri: signedUrl } }
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return {
        success: false,
        error: 'No text detected in image',
        fullText: '',
        confidence: 0
      };
    }

    // First annotation contains all detected text
    const fullText = detections[0].description;

    // Calculate average confidence from all text blocks
    const confidenceScores = result.fullTextAnnotation?.pages?.[0]?.blocks
      ?.map(block => block.confidence || 0) || [0];
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

    return {
      success: true,
      fullText: fullText,
      confidence: avgConfidence,
      detections: detections,
      rawResponse: result
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    return {
      success: false,
      error: error.message,
      fullText: '',
      confidence: 0
    };
  }
}

/**
 * Extract structured data from driver's license text
 */
function parseDriversLicense(text) {
  const data = {
    fullName: null,
    firstName: null,
    lastName: null,
    middleName: null,
    dateOfBirth: null,
    idNumber: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    expirationDate: null,
    issueDate: null,
    confidence: {}
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Common patterns for different data fields
  const patterns = {
    // Driver's license number patterns
    dlNumber: /(?:DL|DRIVER\s*LICENSE|LIC|LICENSE)[\s#:]*([A-Z0-9\-]{6,20})/i,

    // Date patterns (MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD)
    date: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,

    // Name patterns (look for common indicators)
    nameField: /(?:NAME|NOME|FIRST|LAST)[\s:]*([A-Z\s]+)/i,

    // Address patterns
    address: /(\d+[\w\s]*(?:ST|STREET|AVE|AVENUE|RD|ROAD|BLVD|BOULEVARD|LN|LANE|DR|DRIVE|CT|COURT|PL|PLACE))/i,

    // State patterns (2-letter state codes)
    state: /\b([A-Z]{2})\b/,

    // ZIP code patterns
    zipCode: /\b(\d{5}(?:-\d{4})?)\b/,

    // Common DOB indicators
    dobIndicators: /(?:DOB|BIRTH|BORN|DATE\s*OF\s*BIRTH)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,

    // Expiration indicators
    expIndicators: /(?:EXP|EXPIRES?|EXPIRATION)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
  };

  // Extract driver's license number
  for (const line of lines) {
    const dlMatch = line.match(patterns.dlNumber);
    if (dlMatch) {
      data.idNumber = dlMatch[1];
      data.confidence.idNumber = 0.8;
      break;
    }
  }

  // Extract dates
  for (const line of lines) {
    // Look for DOB specifically
    const dobMatch = line.match(patterns.dobIndicators);
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1];
      data.confidence.dateOfBirth = 0.9;
      continue;
    }

    // Look for expiration date
    const expMatch = line.match(patterns.expIndicators);
    if (expMatch) {
      data.expirationDate = expMatch[1];
      data.confidence.expirationDate = 0.9;
      continue;
    }
  }

  // Extract name (usually one of the first few lines after header info)
  const nameLines = lines.slice(0, 8).filter(line =>
    /^[A-Z\s]+$/.test(line) &&
    line.length > 3 &&
    line.length < 40 &&
    !/(?:LICENSE|DRIVER|STATE|EXPIRES|CLASS)/i.test(line)
  );

  if (nameLines.length > 0) {
    const nameParts = nameLines[0].split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      data.firstName = nameParts[0];
      data.lastName = nameParts[nameParts.length - 1];
      if (nameParts.length > 2) {
        data.middleName = nameParts.slice(1, -1).join(' ');
      }
      data.fullName = nameParts.join(' ');
      data.confidence.fullName = 0.7;
    }
  }

  // Extract address components
  for (const line of lines) {
    const addressMatch = line.match(patterns.address);
    if (addressMatch && !data.address) {
      data.address = addressMatch[1];
      data.confidence.address = 0.6;
    }

    const stateMatch = line.match(patterns.state);
    if (stateMatch && !data.state) {
      data.state = stateMatch[1];
      data.confidence.state = 0.7;
    }

    const zipMatch = line.match(patterns.zipCode);
    if (zipMatch && !data.zipCode) {
      data.zipCode = zipMatch[1];
      data.confidence.zipCode = 0.8;
    }
  }

  // Try to extract city (text before state abbreviation)
  for (const line of lines) {
    if (data.state && line.includes(data.state)) {
      const beforeState = line.substring(0, line.indexOf(data.state)).trim();
      const cityMatch = beforeState.match(/([A-Z\s]+)$/i);
      if (cityMatch && !data.city) {
        data.city = cityMatch[1].trim();
        data.confidence.city = 0.6;
      }
    }
  }

  return data;
}

/**
 * Process uploaded KYC document
 */
async function processKYCDocument(documentUrl, documentType = 'drivers_license') {
  try {
    // Extract text using OCR
    const ocrResult = await extractTextFromImage(documentUrl);

    if (!ocrResult.success) {
      return {
        success: false,
        error: ocrResult.error,
        extractedData: null,
        rawOCR: null
      };
    }

    // Parse extracted text based on document type
    let extractedData;
    switch (documentType) {
      case 'drivers_license':
      case 'state_id':
        extractedData = parseDriversLicense(ocrResult.fullText);
        break;

      default:
        extractedData = parseDriversLicense(ocrResult.fullText); // Default to DL parsing
    }

    // Calculate overall confidence
    const confidenceValues = Object.values(extractedData.confidence);
    const overallConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    return {
      success: true,
      extractedData: extractedData,
      overallConfidence: overallConfidence,
      rawOCR: ocrResult.rawResponse,
      ocrService: 'google_vision'
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      error: error.message,
      extractedData: null,
      rawOCR: null
    };
  }
}

module.exports = {
  initializeVision,
  extractTextFromImage,
  parseDriversLicense,
  processKYCDocument
};