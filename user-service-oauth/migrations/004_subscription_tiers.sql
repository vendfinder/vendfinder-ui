-- Premium vendor tier support
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_featured_slots_used INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_featured_slots_cycle_start TIMESTAMPTZ;

-- Backfill existing sellers
UPDATE users SET subscription_tier = 'standard' WHERE subscription_tier IS NULL AND role = 'seller';

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
