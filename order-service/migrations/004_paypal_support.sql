-- Add PayPal support to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'stripe';

CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
