-- Migration: Add seller listing fee tracking columns
-- Description: Sellers get a 7-day free trial, then must pay $100 to continue listing.

ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_fee_paid_at TIMESTAMPTZ;

-- Set trial_ends_at for existing sellers who don't have it
UPDATE users SET trial_ends_at = created_at + INTERVAL '7 days' WHERE role = 'seller' AND trial_ends_at IS NULL;
