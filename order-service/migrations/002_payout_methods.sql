-- Payout methods table
CREATE TABLE IF NOT EXISTS payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('alipay', 'paypal', 'wechat')),
  label VARCHAR(100),
  account_id VARCHAR(200) NOT NULL,
  account_name VARCHAR(200),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one primary method per seller
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_methods_one_primary
  ON payout_methods (seller_id) WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_payout_methods_seller_id ON payout_methods (seller_id);

-- Add FK column to payouts table
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payout_method_id UUID REFERENCES payout_methods(id);
