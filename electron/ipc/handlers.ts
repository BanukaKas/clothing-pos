import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {
  checkIntegrity,
  backupDatabase,
  restoreDatabase,
  getDatabasePath,
  run,
  get,
  query,
} from '../database/connection';
import * as productsRepo from '../database/repositories/productsRepo';
import * as inventoryRepo from '../database/repositories/inventoryRepo';
import * as salesRepo from '../database/repositories/salesRepo';
import * as returnsRepo from '../database/repositories/returnsRepo';
import * as customersRepo from '../database/repositories/customersRepo';
import * as purchasesRepo from '../database/repositories/purchasesRepo';
import * as expensesRepo from '../database/repositories/expensesRepo';
import * as cashSessionsRepo from '../database/repositories/cashSessionsRepo';
import * as reportsRepo from '../database/repositories/reportsRepo';
import * as settingsRepo from '../database/repositories/settingsRepo';
import * as usersRepo from '../database/repositories/usersRepo';

export function registerIpcHandlers(): void {
  // --- App & Diagnostics ---
  ipcMain.handle('app:getInfo', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      userData: app.getPath('userData'),
      dbPath: getDatabasePath(),
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
    };
  });

  // Diagnostic & persistence test helper
  ipcMain.handle('app:testPersistence', (_event, action: 'insert' | 'verify', payload?: any) => {
    if (action === 'insert') {
      const testId = payload?.id || `test_${Date.now()}`;
      const testValue = payload?.value || 'Test Record Persistence';
      run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');`,
        [testId, testValue]
      );
      return { ok: true, id: testId, value: testValue, dbPath: getDatabasePath() };
    } else if (action === 'verify') {
      const testId = payload?.id;
      const record = get<{ key: string; value: string; updated_at: string }>(
        'SELECT * FROM settings WHERE key = ?;',
        [testId]
      );
      return { ok: !!record, record, dbPath: getDatabasePath() };
    }
    return { ok: false };
  });

  // --- Database System ---
  ipcMain.handle('database:getPath', () => {
    return getDatabasePath();
  });

  ipcMain.handle('database:checkIntegrity', () => {
    return checkIntegrity();
  });

  ipcMain.handle('database:backup', async () => {
    const defaultName = `mint-fashion-backup-${new Date().toISOString().slice(0, 10)}.db`;
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Backup SQLite Database',
      defaultPath: defaultName,
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    await backupDatabase(filePath);
    return { success: true, filePath };
  });

  ipcMain.handle('database:restore', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Restore SQLite Database',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const sourcePath = filePaths[0];
    await restoreDatabase(sourcePath);
    return { success: true, filePath: sourcePath };
  });

  // --- Products ---
  ipcMain.handle('products:getAll', () => {
    return productsRepo.getAllProducts();
  });

  ipcMain.handle('products:getById', (_event, id: string) => {
    return productsRepo.getProductById(id);
  });

  ipcMain.handle('products:getByBarcode', (_event, barcode: string) => {
    return productsRepo.getProductByBarcode(barcode);
  });

  ipcMain.handle('products:create', (_event, input: any) => {
    const product = input.product || input;
    const variants = input.variants || [];
    const performedBy = input.performedBy || 'System';
    return productsRepo.createProduct(product, variants, performedBy);
  });

  ipcMain.handle('products:update', (_event, id: string, input: any) => {
    const productData = input.product || input;
    const performedBy = input.performedBy || 'System';
    return productsRepo.updateProduct(id, productData, performedBy);
  });

  ipcMain.handle('products:delete', (_event, id: string) => {
    return productsRepo.deleteProduct(id, 'System');
  });

  ipcMain.handle('products:getCategories', () => {
    return productsRepo.getAllCategories();
  });

  // --- Barcode Operations ---
  ipcMain.handle(
    'products:checkBarcodeUnique',
    (_event, barcode: string, excludeProductId?: string, excludeVariantId?: string) => {
      return productsRepo.checkBarcodeUnique(barcode, excludeProductId, excludeVariantId);
    }
  );

  ipcMain.handle(
    'products:generateUniqueBarcode',
    (_event, format?: 'CODE128' | 'EAN13', prefix?: string) => {
      return productsRepo.generateUniqueBarcode(format, prefix);
    }
  );

  ipcMain.handle(
    'products:updateVariantBarcode',
    (_event, variantId: string, barcode: string, performedBy?: string) => {
      return productsRepo.updateVariantBarcode(variantId, barcode, performedBy || 'Cashier');
    }
  );

  ipcMain.handle(
    'products:regenerateBarcode',
    (_event, id: string, type: 'product' | 'variant', format?: 'CODE128' | 'EAN13', performedBy?: string) => {
      return productsRepo.regenerateBarcode(id, type, format, performedBy || 'Admin');
    }
  );

  ipcMain.handle(
    'products:updateProductBarcodes',
    (_event, productId: string, productBarcode: string, variantBarcodes: { variantId: string; barcode: string }[], performedBy?: string) => {
      return productsRepo.updateProductBarcodes(productId, productBarcode, variantBarcodes, performedBy || 'Admin');
    }
  );

  // --- Inventory ---
  ipcMain.handle('inventory:getStockMovements', (_event, productId?: string) => {
    return inventoryRepo.getStockMovements(productId);
  });

  ipcMain.handle('inventory:adjustStock', (_event, input: any) => {
    return inventoryRepo.adjustStock(input);
  });

  ipcMain.handle('inventory:getLowStock', () => {
    return inventoryRepo.getLowStockAlerts();
  });

  ipcMain.handle('inventory:getValuation', () => {
    return inventoryRepo.getInventoryValuation();
  });

  // --- Sales & POS ---
  ipcMain.handle('sales:getAll', () => {
    return salesRepo.getAllSales();
  });

  ipcMain.handle('sales:getById', (_event, id: string) => {
    return salesRepo.getSaleById(id);
  });

  ipcMain.handle('sales:processCheckout', (_event, input: any) => {
    return salesRepo.processCheckout(input);
  });

  // --- Returns ---
  ipcMain.handle('returns:getAll', () => {
    return returnsRepo.getAllReturns();
  });

  ipcMain.handle('returns:getById', (_event, id: string) => {
    return returnsRepo.getReturnById(id);
  });

  ipcMain.handle('returns:process', (_event, input: any) => {
    return returnsRepo.processReturn(input);
  });

  // --- Customers ---
  ipcMain.handle('customers:getAll', () => {
    return customersRepo.getAllCustomers();
  });

  ipcMain.handle('customers:getById', (_event, id: string) => {
    return customersRepo.getCustomerById(id);
  });

  ipcMain.handle('customers:create', (_event, input: any) => {
    return customersRepo.createCustomer(input, input.performedBy || 'System');
  });

  ipcMain.handle('customers:update', (_event, id: string, input: any) => {
    return customersRepo.updateCustomer(id, input, input.performedBy || 'System');
  });

  // --- Suppliers & Purchases ---
  ipcMain.handle('suppliers:getAll', () => {
    return purchasesRepo.getAllSuppliers();
  });

  ipcMain.handle('purchases:getAll', () => {
    return purchasesRepo.getAllPurchases();
  });

  ipcMain.handle('purchases:getById', (_event, id: string) => {
    return purchasesRepo.getPurchaseById(id);
  });

  ipcMain.handle('purchases:create', (_event, input: any) => {
    return purchasesRepo.createPurchaseOrder(input, input.performedBy || 'System');
  });

  ipcMain.handle('purchases:receive', (_event, purchaseId: string, receivedBy: string) => {
    return purchasesRepo.receivePurchaseOrder(purchaseId, receivedBy || 'System');
  });

  ipcMain.handle('purchases:cancel', (_event, purchaseId: string) => {
    return purchasesRepo.cancelPurchaseOrder(purchaseId, 'System');
  });

  // --- Expenses ---
  ipcMain.handle('expenses:getAll', (_event, filter?: any) => {
    return expensesRepo.getAllExpenses(filter);
  });

  ipcMain.handle('expenses:create', (_event, input: any) => {
    return expensesRepo.addExpense(input);
  });

  ipcMain.handle('expenses:delete', (_event, id: string) => {
    return expensesRepo.deleteExpense(id);
  });

  ipcMain.handle('expenses:getSummary', () => {
    return expensesRepo.getExpenseSummary();
  });

  // --- Cash Sessions ---
  ipcMain.handle('cashSessions:getCurrent', () => {
    return cashSessionsRepo.getCurrentSession();
  });

  ipcMain.handle('cashSessions:open', (_event, input: any) => {
    return cashSessionsRepo.openCashSession(input);
  });

  ipcMain.handle('cashSessions:close', (_event, input: any) => {
    return cashSessionsRepo.closeCashSession(input);
  });

  ipcMain.handle('cashSessions:getAll', () => {
    return cashSessionsRepo.getAllSessions();
  });

  // --- Reports & Analytics ---
  ipcMain.handle('reports:getDashboard', () => {
    return reportsRepo.getDashboardSummary();
  });

  ipcMain.handle('reports:getCategorySales', () => {
    return reportsRepo.getCategorySales();
  });

  ipcMain.handle('reports:getTopProducts', (_event, limit?: number) => {
    return reportsRepo.getTopSellingProducts(limit);
  });

  ipcMain.handle('reports:getPaymentBreakdown', () => {
    return reportsRepo.getPaymentBreakdown();
  });

  ipcMain.handle('reports:getDailySales', (_event, days?: number) => {
    return reportsRepo.getDailySalesHistory(days);
  });

  // --- Settings ---
  ipcMain.handle('settings:getStoreProfile', () => {
    return settingsRepo.getStoreProfile();
  });

  ipcMain.handle('settings:updateStoreProfile', (_event, profile: any) => {
    return settingsRepo.updateStoreProfile(profile);
  });

  ipcMain.handle('settings:getAll', () => {
    return settingsRepo.getAllSettings();
  });

  ipcMain.handle('settings:update', (_event, settingsMap: Record<string, string>) => {
    settingsRepo.updateSettings(settingsMap);
    return true;
  });

  // --- Users & Auth ---
  ipcMain.handle('users:getAll', () => {
    return usersRepo.getAllUsers();
  });

  ipcMain.handle('users:authenticate', (_event, credentials: { username: string; password: string }) => {
    return usersRepo.authenticateUser(credentials.username, credentials.password);
  });

  ipcMain.handle('users:create', (_event, input: any) => {
    return usersRepo.createUser(input);
  });

  ipcMain.handle('users:update', (_event, id: string, input: any) => {
    return usersRepo.updateUser(id, input);
  });

  ipcMain.handle('users:delete', (_event, id: string) => {
    return usersRepo.deleteUser(id);
  });

  ipcMain.handle('users:getRoles', () => {
    return usersRepo.getAllRoles();
  });
}
