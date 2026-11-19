import { contextBridge, ipcRenderer } from 'electron';

// Expose secure API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // App & Diagnostics
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  testPersistence: (action: 'insert' | 'verify', payload?: any) =>
    ipcRenderer.invoke('app:testPersistence', action, payload),

  // Database System
  getDatabasePath: () => ipcRenderer.invoke('database:getPath'),
  checkIntegrity: () => ipcRenderer.invoke('database:checkIntegrity'),
  backupDatabase: () => ipcRenderer.invoke('database:backup'),
  restoreDatabase: () => ipcRenderer.invoke('database:restore'),

  // Products
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProductById: (id: string) => ipcRenderer.invoke('products:getById', id),
  getProductByBarcode: (barcode: string) => ipcRenderer.invoke('products:getByBarcode', barcode),
  createProduct: (productData: any) => ipcRenderer.invoke('products:create', productData),
  updateProduct: (id: string, productData: any) => ipcRenderer.invoke('products:update', id, productData),
  deleteProduct: (id: string) => ipcRenderer.invoke('products:delete', id),
  getCategories: () => ipcRenderer.invoke('products:getCategories'),
  checkBarcodeUnique: (barcode: string, excludeProductId?: string, excludeVariantId?: string) =>
    ipcRenderer.invoke('products:checkBarcodeUnique', barcode, excludeProductId, excludeVariantId),
  generateUniqueBarcode: (format?: 'CODE128' | 'EAN13', prefix?: string) =>
    ipcRenderer.invoke('products:generateUniqueBarcode', format, prefix),
  updateVariantBarcode: (variantId: string, barcode: string) =>
    ipcRenderer.invoke('products:updateVariantBarcode', variantId, barcode),
  regenerateBarcode: (id: string, type: 'product' | 'variant', format?: 'CODE128' | 'EAN13') =>
    ipcRenderer.invoke('products:regenerateBarcode', id, type, format),
  updateProductBarcodes: (productId: string, productBarcode: string, variantBarcodes: { variantId: string; barcode: string }[]) =>
    ipcRenderer.invoke('products:updateProductBarcodes', productId, productBarcode, variantBarcodes),

  // Inventory
  getStockMovements: (productId?: string) => ipcRenderer.invoke('inventory:getStockMovements', productId),
  adjustStock: (adjustmentData: any) => ipcRenderer.invoke('inventory:adjustStock', adjustmentData),
  getLowStock: () => ipcRenderer.invoke('inventory:getLowStock'),
  getValuation: () => ipcRenderer.invoke('inventory:getValuation'),

  // Sales & POS Checkout
  getSales: () => ipcRenderer.invoke('sales:getAll'),
  getSaleById: (id: string) => ipcRenderer.invoke('sales:getById', id),
  processCheckout: (checkoutData: any) => ipcRenderer.invoke('sales:processCheckout', checkoutData),

  // Returns
  getReturns: () => ipcRenderer.invoke('returns:getAll'),
  getReturnById: (id: string) => ipcRenderer.invoke('returns:getById', id),
  processReturn: (returnData: any) => ipcRenderer.invoke('returns:process', returnData),

  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  getCustomerById: (id: string) => ipcRenderer.invoke('customers:getById', id),
  createCustomer: (customerData: any) => ipcRenderer.invoke('customers:create', customerData),
  updateCustomer: (id: string, customerData: any) => ipcRenderer.invoke('customers:update', id, customerData),

  // Suppliers & Purchases
  getSuppliers: () => ipcRenderer.invoke('suppliers:getAll'),
  getPurchases: () => ipcRenderer.invoke('purchases:getAll'),
  getPurchaseById: (id: string) => ipcRenderer.invoke('purchases:getById', id),
  createPurchase: (purchaseData: any) => ipcRenderer.invoke('purchases:create', purchaseData),
  receivePurchase: (purchaseId: string, receivedBy: string) =>
    ipcRenderer.invoke('purchases:receive', purchaseId, receivedBy),
  cancelPurchase: (purchaseId: string) => ipcRenderer.invoke('purchases:cancel', purchaseId),

  // Expenses
  getExpenses: (filter?: any) => ipcRenderer.invoke('expenses:getAll', filter),
  createExpense: (expenseData: any) => ipcRenderer.invoke('expenses:create', expenseData),
  deleteExpense: (id: string) => ipcRenderer.invoke('expenses:delete', id),
  getExpenseSummary: () => ipcRenderer.invoke('expenses:getSummary'),

  // Cash Sessions
  getCurrentSession: () => ipcRenderer.invoke('cashSessions:getCurrent'),
  openCashSession: (sessionData: any) => ipcRenderer.invoke('cashSessions:open', sessionData),
  closeCashSession: (sessionData: any) => ipcRenderer.invoke('cashSessions:close', sessionData),
  getAllSessions: () => ipcRenderer.invoke('cashSessions:getAll'),

  // Reports & Analytics
  getDashboardSummary: () => ipcRenderer.invoke('reports:getDashboard'),
  getCategorySales: () => ipcRenderer.invoke('reports:getCategorySales'),
  getTopProducts: (limit?: number) => ipcRenderer.invoke('reports:getTopProducts', limit),
  getPaymentBreakdown: () => ipcRenderer.invoke('reports:getPaymentBreakdown'),
  getDailySales: (days?: number) => ipcRenderer.invoke('reports:getDailySales', days),

  // Settings
  getStoreProfile: () => ipcRenderer.invoke('settings:getStoreProfile'),
  updateStoreProfile: (profile: any) => ipcRenderer.invoke('settings:updateStoreProfile', profile),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSettings: (settingsMap: Record<string, string>) => ipcRenderer.invoke('settings:update', settingsMap),

  // Users & Auth
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  authenticateUser: (credentials: { username: string; password: string }) =>
    ipcRenderer.invoke('users:authenticate', credentials),
  createUser: (userData: any) => ipcRenderer.invoke('users:create', userData),
  updateUser: (id: string, userData: any) => ipcRenderer.invoke('users:update', id, userData),
  deleteUser: (id: string) => ipcRenderer.invoke('users:delete', id),
  getRoles: () => ipcRenderer.invoke('users:getRoles'),
});
