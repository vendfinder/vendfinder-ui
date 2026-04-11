CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price NUMERIC(10,2) NOT NULL,
  size VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id, status);
CREATE INDEX idx_price_alerts_product ON price_alerts(product_id, status);
