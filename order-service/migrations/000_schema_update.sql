-- Schema migration to add missing columns to existing orders table
-- This must run BEFORE 001_initial_schema.sql

-- Add missing columns to existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ask_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_category VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS size VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_price DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(4,4) DEFAULT 0.0900;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_buyer_pays DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_payout DECIMAL(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zip VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) DEFAULT 'US';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Update existing orders to have NOT NULL constraints where safe
-- (Skip this for production data safety - handle in application logic)

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi ON orders(stripe_payment_intent_id);