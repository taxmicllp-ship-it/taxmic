ALTER TABLE plans ADD COLUMN stripe_product_id VARCHAR(255);
ALTER TABLE plans ADD COLUMN stripe_price_id VARCHAR(255);
CREATE INDEX idx_plans_stripe_product_id ON plans(stripe_product_id);
CREATE UNIQUE INDEX idx_plans_stripe_price_id ON plans(stripe_price_id);
