-- KYC Document Upload and OCR Data Extraction Tables
-- Migration: Add support for driver's license/ID document upload with automatic data extraction

-- Table for storing uploaded KYC documents
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL DEFAULT 'drivers_license', -- 'drivers_license', 'state_id', 'passport', 'national_id'
    file_url TEXT NOT NULL, -- DigitalOcean Spaces URL
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    upload_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploading', 'uploaded', 'failed'
    processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    verification_status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'rejected', 'requires_review'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id), -- Admin who verified
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}' -- Additional document metadata
);

-- Table for extracted data from KYC documents via OCR
CREATE TABLE IF NOT EXISTS kyc_extracted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES kyc_documents(id) ON DELETE CASCADE,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    middle_name TEXT,
    date_of_birth DATE,
    id_number TEXT, -- Driver's license number, state ID number, etc.
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    expiration_date DATE,
    issue_date DATE,
    issuing_authority TEXT, -- State, agency that issued the ID
    extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1), -- 0.00-1.00
    extraction_service VARCHAR(50) DEFAULT 'google_vision', -- 'google_vision', 'tesseract', 'manual'
    raw_ocr_data JSONB, -- Full OCR response for debugging
    field_confidence JSONB, -- Per-field confidence scores
    manual_review_required BOOLEAN DEFAULT FALSE,
    manual_review_notes TEXT,
    reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add document reference to main users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_kyc_document_id UUID REFERENCES kyc_documents(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON kyc_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_processing ON kyc_documents(processing_status) WHERE processing_status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_kyc_extracted_data_document_id ON kyc_extracted_data(document_id);
CREATE INDEX IF NOT EXISTS idx_kyc_extracted_data_review ON kyc_extracted_data(manual_review_required) WHERE manual_review_required = TRUE;

-- Update trigger for extracted data
CREATE OR REPLACE FUNCTION update_kyc_extracted_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_kyc_extracted_data_updated_at
    BEFORE UPDATE ON kyc_extracted_data
    FOR EACH ROW
    EXECUTE FUNCTION update_kyc_extracted_data_updated_at();

-- Add constraints for data integrity
ALTER TABLE kyc_documents ADD CONSTRAINT chk_document_type
    CHECK (document_type IN ('drivers_license', 'state_id', 'passport', 'national_id'));

ALTER TABLE kyc_documents ADD CONSTRAINT chk_upload_status
    CHECK (upload_status IN ('uploading', 'uploaded', 'failed'));

ALTER TABLE kyc_documents ADD CONSTRAINT chk_processing_status
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE kyc_documents ADD CONSTRAINT chk_verification_status
    CHECK (verification_status IN ('unverified', 'verified', 'rejected', 'requires_review'));

-- Add comments for documentation
COMMENT ON TABLE kyc_documents IS 'Stores uploaded KYC documents (driver licenses, IDs, etc.)';
COMMENT ON TABLE kyc_extracted_data IS 'OCR-extracted data from KYC documents';
COMMENT ON COLUMN kyc_extracted_data.extraction_confidence IS 'Overall confidence score from OCR service (0.0-1.0)';
COMMENT ON COLUMN kyc_extracted_data.field_confidence IS 'JSON object with per-field confidence scores';
COMMENT ON COLUMN kyc_documents.metadata IS 'Additional metadata like image dimensions, OCR hints, etc.';