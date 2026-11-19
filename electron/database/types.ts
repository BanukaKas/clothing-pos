export interface DbRole {
  id: string;
  name: string;
  permissions: string;
  created_at: string;
}

export interface DbUser {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: string; // 'Administrator' | 'Store Manager' | 'Senior Cashier' | 'Sales Associate'
  email: string;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent_color: string;
  created_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  purchase_cost: number;
  selling_price: number;
  reorder_level: number;
  image: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  barcode: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface DbSupplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  categories_supplied: string; // JSON array
  payment_terms: string;
  created_at: string;
}

export interface DbPurchase {
  id: string;
  reference: string;
  supplier_id: string;
  supplier_name: string;
  total_cost: number;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  order_date: string;
  expected_date: string | null;
  notes: string | null;
  created_at: string;
  received_at: string | null;
}

export interface DbPurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface DbCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  total_purchases: number;
  order_count: number;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface DbSale {
  id: string;
  receipt_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  cashier_id: string;
  cashier_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'split';
  status: 'completed' | 'refunded' | 'partially_refunded';
  notes: string | null;
  created_at: string;
}

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
}

export interface DbPayment {
  id: string;
  sale_id: string;
  amount: number;
  method: string;
  cash_received: number | null;
  change_given: number | null;
  transaction_ref: string | null;
  created_at: string;
}

export interface DbReturn {
  id: string;
  return_number: string;
  sale_id: string;
  original_receipt_number: string;
  customer_name: string;
  refund_amount: number;
  refund_method: string;
  reason: string;
  processed_by: string;
  created_at: string;
}

export interface DbReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  reason: string;
  is_restocked: number; // 1 or 0
}

export interface DbStockMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string;
  variant_info: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'damage';
  quantity_delta: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id: string | null;
  performed_by: string;
  created_at: string;
}

export interface DbExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  recorded_by: string;
  expense_date: string;
  created_at: string;
}

export interface DbCashSession {
  id: string;
  cashier_id: string;
  cashier_name: string;
  register_number: string;
  opening_time: string;
  closing_time: string | null;
  opening_cash: number;
  total_cash_sales: number;
  total_cash_refunds: number;
  total_cash_expenses: number;
  expected_closing_cash: number;
  actual_closing_cash: number | null;
  cash_difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
}

export interface DbSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}
