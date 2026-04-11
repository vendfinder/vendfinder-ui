-- Run this against the user-service database to create the support bot user
-- Execute: psql $USER_DB_URL -f scripts/create-bot-user.sql

INSERT INTO users (id, username, email, display_name, avatar_url, is_verified, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'vendbot',
  'support-bot@vendfinder.com',
  'VendBot',
  NULL,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'VendBot',
  is_verified = TRUE,
  updated_at = NOW();
