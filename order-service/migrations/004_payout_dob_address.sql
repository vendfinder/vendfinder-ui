-- Add date_of_birth and address for secure CNY transfers to mainland China.
-- These fields are required for enhanced KYC compliance.
ALTER TABLE payout_methods ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE payout_methods ADD COLUMN IF NOT EXISTS address VARCHAR(500);