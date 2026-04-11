-- Sponsored search/category placements (paid placement in search and category results)
CREATE TABLE IF NOT EXISTS sponsored_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  category VARCHAR(100),
  keyword VARCHAR(255),
  duration_days INT NOT NULL,
  price_cents INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment',
  stripe_session_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (category IS NOT NULL OR keyword IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_sponsored_active ON sponsored_slots(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sponsored_category ON sponsored_slots(LOWER(category)) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sponsored_vendor ON sponsored_slots(vendor_id);
