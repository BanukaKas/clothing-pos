-- Migration 002: Barcode Management & Variant Barcode Indexing
-- 1. Index for fast barcode lookup on product_variants
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);

-- 2. Default Barcode Studio settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('barcode_default_symbology', 'CODE128'),
  ('barcode_default_prefix', 'MF'),
  ('label_default_size', '50x25'),
  ('label_show_price', '1'),
  ('label_show_sku', '1'),
  ('label_show_name', '1');
