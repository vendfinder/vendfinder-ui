-- Add national_id for secure CNY transfers to mainland China.
-- Chinese national ID (身份证号) is 18 characters; stored as VARCHAR(50) to
-- accommodate future foreign-ID formats (e.g. passport for overseas Chinese).
ALTER TABLE payout_methods ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
