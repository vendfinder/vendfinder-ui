-- Quick SQL fix for Sally's paywall issue
-- Run this directly against the user database to unlock Sally's seller access

-- Check Sally's current status
SELECT
    id,
    email,
    username,
    role,
    seller_fee_paid,
    seller_fee_paid_at,
    trial_ends_at
FROM users
WHERE email = 'sally@vendfinder.com';

-- Fix Sally's paywall by marking seller fee as paid
UPDATE users
SET
    seller_fee_paid = TRUE,
    seller_fee_paid_at = NOW(),
    updated_at = NOW()
WHERE email = 'sally@vendfinder.com'
RETURNING
    id,
    email,
    username,
    seller_fee_paid,
    seller_fee_paid_at;

-- Verify the fix
SELECT
    id,
    email,
    seller_fee_paid,
    seller_fee_paid_at,
    CASE
        WHEN seller_fee_paid = TRUE THEN '✅ PAYWALL REMOVED - Sally can access her products'
        ELSE '❌ PAYWALL STILL ACTIVE'
    END as status
FROM users
WHERE email = 'sally@vendfinder.com';