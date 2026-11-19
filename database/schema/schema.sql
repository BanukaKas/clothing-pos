-- MINT FASHION POS — SQLite Production Schema
-- Designed for Local Offline Retail Garment Desktop POS

PRAGMA foreign_keys = ON;

-- 1. Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Accounts & Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clothing Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  accent_color TEXT DEFAULT '#059669',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Garment Products Catalog
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  purchase_cost REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Product Variants (Size, Color, SKU, Barcode, Stock)
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. Suppliers Directory
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  categories_supplied TEXT,
  payment_terms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Purchase Orders
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  total_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TEXT NOT NULL,
  expected_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  received_at DATETIME,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
);

-- 8. Purchase Order Line Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 9. Customers & Loyalty
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_purchases REAL NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Sales Transactions
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone TEXT,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 11. Sale Line Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  unit_cost REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 12. Payment Tenders (Cash, Card, Bank Transfer, Split)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  cash_received REAL,
  change_given REAL,
  transaction_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- 13. Customer Returns & Refunds
CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  return_number TEXT NOT NULL UNIQUE,
  original_receipt_number TEXT NOT NULL,
  sale_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  refund_amount REAL NOT NULL,
  refund_method TEXT NOT NULL,
  reason TEXT,
  processed_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT
);

-- 14. Return Line Items
CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  reason TEXT,
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
);

-- 15. Stock Movement Audit Trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  variant_info TEXT,
  type TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 16. Store Operating Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  recorded_by TEXT NOT NULL,
  expense_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Cash Drawer Register Sessions
CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  register_number TEXT NOT NULL DEFAULT 'Register #01',
  opening_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  closing_time DATETIME,
  opening_cash REAL NOT NULL DEFAULT 0,
  total_cash_sales REAL NOT NULL DEFAULT 0,
  total_cash_refunds REAL NOT NULL DEFAULT 0,
  total_cash_expenses REAL NOT NULL DEFAULT 0,
  expected_closing_cash REAL NOT NULL DEFAULT 0,
  actual_closing_cash REAL,
  cash_difference REAL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT
);

-- 18. Store Settings & Config Key-Value Store
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
