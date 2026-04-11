-- Add 'matched' as a valid status for bids and asks to support auto-matching

ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE bids ADD CONSTRAINT bids_status_check
  CHECK (status IN ('active', 'pending', 'won', 'lost', 'expired', 'cancelled', 'matched'));

ALTER TABLE asks DROP CONSTRAINT IF EXISTS asks_status_check;
ALTER TABLE asks ADD CONSTRAINT asks_status_check
  CHECK (status IN ('active', 'pending', 'sold', 'cancelled', 'expired', 'matched'));
