ALTER TABLE products
  ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_language VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_global_listing BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_translations ON products USING gin(translations);
