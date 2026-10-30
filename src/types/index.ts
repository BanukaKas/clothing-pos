export type PageId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'returns'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '28' | '30' | '32' | '34' | '36' | '38' | 'Free Size';

export interface ColorVariant {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  size: ClothingSize;
  color: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  purchaseCost: number;
  sellingPrice: number;
  sizes: ClothingSize[];
  colors: ColorVariant[];
  variants: ProductVariant[];
  stock: number;
  reorderLevel: number;
  image: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  accentColor: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  cost: number;
  size: ClothingSize;
  color: string;
  quantity: number;
  maxStock: number;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'split';

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  size: ClothingSize;
  color: string;
  price: number;
  cost: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  createdAt: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeGiven?: number;
  status: 'completed' | 'refunded' | 'partially_refunded';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantInfo: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'damage';
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  orderCount: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categoriesSupplied: string[];
  paymentTerms: string;
}

export interface PurchaseItem {
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
  status: 'received' | 'pending' | 'in_transit' | 'cancelled';
  orderDate: string;
  expectedDate?: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  originalReceiptNumber: string;
  saleId: string;
  items: {
    productName: string;
    sku: string;
    size: ClothingSize;
    color: string;
    quantity: number;
    price: number;
    reason: string;
  }[];
  refundAmount: number;
  refundMethod: PaymentMethod;
  customerName: string;
  date: string;
  processedBy: string;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Maintenance' | 'Packaging' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  date: string;
  recordedBy: string;
  reference?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'Administrator' | 'Store Manager' | 'Senior Cashier' | 'Sales Associate';
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  enableTax: boolean;
  receiptWidth: '80mm' | '58mm';
  receiptHeader: string;
  receiptFooter: string;
  primaryColor: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
