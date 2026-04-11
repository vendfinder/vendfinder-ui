CREATE TABLE IF NOT EXISTS sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(20),
  sale_price NUMERIC(10,2) NOT NULL,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sales_history_product ON sales_history(product_id, sale_date DESC);
CREATE INDEX idx_sales_history_product_size ON sales_history(product_id, size, sale_date DESC);
