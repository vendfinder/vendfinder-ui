ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paypal_batch_id VARCHAR(255);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paypal_item_id VARCHAR(255);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_payouts_paypal_batch_id ON payouts(paypal_batch_id) WHERE paypal_batch_id IS NOT NULL;
