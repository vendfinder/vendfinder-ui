-- Create a complete test user with all required fields
INSERT INTO users (
  username,
  email,
  password_hash,
  role,
  verified,
  is_active,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'testuser2024',
  'testuser2024@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'seller',
  false,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email;