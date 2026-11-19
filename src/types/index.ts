export type PageId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'barcode-management'
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
  barcode?: string;
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

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getAppInfo: () => Promise<any>;
      testPersistence: (action: 'insert' | 'verify', payload?: any) => Promise<any>;
      getDatabasePath: () => Promise<string | null>;
      checkIntegrity: () => Promise<{ ok: boolean; message: string }>;
      backupDatabase: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
      restoreDatabase: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;

      getProducts: () => Promise<any[]>;
      getProductById: (id: string) => Promise<any>;
      getProductByBarcode: (barcode: string) => Promise<any>;
      createProduct: (productData: any) => Promise<any>;
      updateProduct: (id: string, productData: any) => Promise<any>;
      deleteProduct: (id: string) => Promise<boolean>;
      getCategories: () => Promise<any[]>;
      checkBarcodeUnique: (barcode: string, excludeProductId?: string, excludeVariantId?: string) => Promise<{ isUnique: boolean; existingProduct?: string; existingVariant?: string }>;
      generateUniqueBarcode: (format?: 'CODE128' | 'EAN13', prefix?: string) => Promise<string>;
      updateVariantBarcode: (variantId: string, barcode: string) => Promise<boolean>;
      regenerateBarcode: (id: string, type: 'product' | 'variant', format?: 'CODE128' | 'EAN13') => Promise<string>;
      updateProductBarcodes: (productId: string, productBarcode: string, variantBarcodes: { variantId: string; barcode: string }[]) => Promise<boolean>;

      getStockMovements: (productId?: string) => Promise<any[]>;
      adjustStock: (adjustmentData: any) => Promise<any>;
      getLowStock: () => Promise<any[]>;
      getValuation: () => Promise<any>;

      getSales: () => Promise<any[]>;
      getSaleById: (id: string) => Promise<any>;
      processCheckout: (checkoutData: any) => Promise<any>;

      getReturns: () => Promise<any[]>;
      getReturnById: (id: string) => Promise<any>;
      processReturn: (returnData: any) => Promise<any>;

      getCustomers: () => Promise<any[]>;
      getCustomerById: (id: string) => Promise<any>;
      createCustomer: (customerData: any) => Promise<any>;
      updateCustomer: (id: string, customerData: any) => Promise<any>;

      getSuppliers: () => Promise<any[]>;
      getPurchases: () => Promise<any[]>;
      getPurchaseById: (id: string) => Promise<any>;
      createPurchase: (purchaseData: any) => Promise<any>;
      receivePurchase: (purchaseId: string, receivedBy: string) => Promise<any>;
      cancelPurchase: (purchaseId: string) => Promise<any>;

      getExpenses: (filter?: any) => Promise<any[]>;
      createExpense: (expenseData: any) => Promise<any>;
      deleteExpense: (id: string) => Promise<boolean>;
      getExpenseSummary: () => Promise<any>;

      getCurrentSession: () => Promise<any>;
      openCashSession: (sessionData: any) => Promise<any>;
      closeCashSession: (sessionData: any) => Promise<any>;
      getAllSessions: () => Promise<any[]>;

      getDashboardSummary: () => Promise<any>;
      getCategorySales: () => Promise<any[]>;
      getTopProducts: (limit?: number) => Promise<any[]>;
      getPaymentBreakdown: () => Promise<any[]>;
      getDailySales: (days?: number) => Promise<any[]>;

      getStoreProfile: () => Promise<any>;
      updateStoreProfile: (profile: any) => Promise<any>;
      getAllSettings: () => Promise<Record<string, string>>;
      updateSettings: (settingsMap: Record<string, string>) => Promise<boolean>;

      getUsers: () => Promise<any[]>;
      authenticateUser: (credentials: { username: string; password: string }) => Promise<any>;
      createUser: (userData: any) => Promise<any>;
      updateUser: (id: string, userData: any) => Promise<any>;
      deleteUser: (id: string) => Promise<boolean>;
      getRoles: () => Promise<any[]>;
    };
  }
}

