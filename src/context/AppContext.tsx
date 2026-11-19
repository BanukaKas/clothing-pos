import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  PageId,
  Product,
  Category,
  CartItem,
  Sale,
  Customer,
  Supplier,
  PurchaseOrder,
  ReturnRecord,
  Expense,
  UserAccount,
  StoreSettings,
  StockMovement,
  ToastMessage,
  PaymentMethod,
  ClothingSize,
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialSales,
  initialCustomers,
  initialSuppliers,
  initialPurchases,
  initialReturns,
  initialExpenses,
  initialUsers,
  initialSettings,
  initialStockMovements,
} from '../data/mockData';
import { generateId, generateReceiptNumber } from '../utils/formatters';

interface AppContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void | Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => void | Promise<void>;
  toggleProductStatus: (id: string) => void | Promise<void>;
  deleteProduct: (id: string) => void | Promise<void>;
  refreshDatabaseData?: () => Promise<void>;



  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'productCount'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;

  // Cart & POS
  cart: CartItem[];
  addToCart: (product: Product, size: ClothingSize, color: string, quantity?: number) => boolean;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  checkout: (params: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }) => Promise<Sale | null> | (Sale | null);


  // Sales
  sales: Sale[];
  getSaleByReceipt: (receiptNum: string) => Sale | undefined;

  // Inventory & Movements
  stockMovements: StockMovement[];
  adjustStock: (params: {
    productId: string;
    variantId?: string;
    type: 'add' | 'deduct' | 'set';
    quantity: number;
    reason: string;
    performedBy: string;
  }) => void | Promise<void>;


  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalPurchases' | 'orderCount' | 'loyaltyPoints' | 'createdAt'>) => void;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, sup: Partial<Supplier>) => void;

  // Purchases
  purchases: PurchaseOrder[];
  addPurchase: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Returns
  returns: ReturnRecord[];
  processReturn: (params: {
    originalReceiptNumber: string;
    items: {
      productId: string;
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
    processedBy: string;
  }) => boolean;

  // Expenses
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => void;

  // Users
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'lastLogin'>) => void;
  toggleUserStatus: (id: string) => void;
  currentUser: UserAccount;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Toast Notifications
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  dismissToast: (id: string) => void;

  // Active Receipt Modal
  receiptModalSale: Sale | null;
  setReceiptModalSale: (sale: Sale | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'mint_pos_store_settings_v1';

function mapDbProductToProduct(p: any): Product {
  const variants = p.variants || [];
  const sizes = Array.from(new Set(variants.map((v: any) => v.size as ClothingSize)));
  const colorsMap = new Map<string, { name: string; hex: string }>();
  for (const v of variants) {
    if (v.color_name) {
      colorsMap.set(v.color_name, { name: v.color_name, hex: v.color_hex || '#000000' });
    }
  }

  const mappedVariants = variants.map((v: any) => ({
    id: v.id,
    size: v.size as ClothingSize,
    color: v.color_name,
    sku: v.sku,
    barcode: v.barcode,
    stock: v.stock,
  }));

  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category: p.category,
    brand: p.brand || 'MINT FASHION',
    description: p.description || '',
    purchaseCost: p.purchase_cost ?? p.purchaseCost ?? 0,
    sellingPrice: p.selling_price ?? p.sellingPrice ?? 0,
    sizes: sizes.length > 0 ? (sizes as ClothingSize[]) : ['M', 'L'],
    colors: Array.from(colorsMap.values()),
    variants: mappedVariants,
    stock: p.totalStock ?? totalStock,
    reorderLevel: p.reorder_level ?? p.reorderLevel ?? 5,
    image: p.image || '',
    status: p.status || 'active',
    createdAt: p.created_at || new Date().toISOString(),
  };
}

function mapDbMovementToStockMovement(m: any): StockMovement {
  return {
    id: m.id,
    productId: m.product_id || m.productId,
    productName: m.product_name || m.productName,
    sku: m.sku,
    variantInfo: m.variant_info || m.variantInfo || '',
    type: m.type,
    quantityDelta: m.quantity_delta ?? m.quantityDelta ?? 0,
    previousStock: m.previous_stock ?? m.previousStock ?? 0,
    newStock: m.new_stock ?? m.newStock ?? 0,
    reason: m.reason || '',
    performedBy: m.performed_by || m.performedBy || 'System',
    date: m.created_at || m.date || new Date().toISOString(),
  };
}

function mapDbSaleToSale(s: any): Sale {
  return {
    id: s.id,
    receiptNumber: s.receipt_number || s.receiptNumber,
    createdAt: s.created_at || s.createdAt || new Date().toISOString(),
    customerId: s.customer_id || s.customerId,
    customerName: s.customer_name || s.customerName || 'Walk-in Customer',
    customerPhone: s.customer_phone || s.customerPhone,
    cashierName: s.cashier_name || s.cashierName || 'Cashier',
    items: (s.items || []).map((it: any) => ({
      productId: it.product_id || it.productId,
      name: it.product_name || it.name,
      sku: it.sku,
      size: it.size as ClothingSize,
      color: it.color,
      price: it.unit_price ?? it.price ?? 0,
      cost: it.unit_cost ?? it.cost ?? 0,
      quantity: it.quantity,
      total: it.line_total ?? it.total ?? ((it.unit_price || it.price || 0) * it.quantity),
    })),
    subtotal: s.subtotal,
    discount: s.discount || 0,
    tax: s.tax || 0,
    total: s.total,
    paymentMethod: s.payment_method || s.paymentMethod || 'cash',
    cashReceived: s.cash_received ?? s.cashReceived,
    changeGiven: s.change_given ?? s.changeGiven,
    status: s.status || 'completed',
    notes: s.notes,
  };
}

function mapDbCustomerToCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    totalPurchases: c.total_purchases ?? c.totalPurchases ?? 0,
    orderCount: c.order_count ?? c.orderCount ?? 0,
    loyaltyPoints: c.loyalty_points ?? c.loyaltyPoints ?? 0,
    createdAt: c.created_at || c.createdAt || new Date().toISOString().split('T')[0],
  };
}

function mapDbSupplierToSupplier(s: any): Supplier {
  let categoriesSupplied: string[] = [];
  try {
    if (typeof s.categories_supplied === 'string') {
      categoriesSupplied = JSON.parse(s.categories_supplied);
    } else if (Array.isArray(s.categories_supplied)) {
      categoriesSupplied = s.categories_supplied;
    } else if (Array.isArray(s.categoriesSupplied)) {
      categoriesSupplied = s.categoriesSupplied;
    }
  } catch {
    categoriesSupplied = ['Apparel'];
  }

  return {
    id: s.id,
    name: s.name,
    contactPerson: s.contact_person || s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    categoriesSupplied,
    paymentTerms: s.payment_terms || s.paymentTerms || 'Net 30 Days',
  };
}

function mapDbPurchaseToPurchase(p: any): PurchaseOrder {
  return {
    id: p.id,
    reference: p.reference,
    supplierId: p.supplier_id || p.supplierId,
    supplierName: p.supplier_name || p.supplierName,
    items: (p.items || []).map((it: any) => ({
      productName: it.product_name || it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitCost: it.unit_cost ?? it.unitCost ?? 0,
      totalCost: it.total_cost ?? it.totalCost ?? ((it.unit_cost || 0) * it.quantity),
    })),
    totalCost: p.total_cost ?? p.totalCost ?? 0,
    status: p.status,
    orderDate: p.order_date || p.orderDate || new Date().toISOString().split('T')[0],
    expectedDate: p.expected_date || p.expectedDate,
  };
}

function mapDbReturnToReturn(r: any): ReturnRecord {
  return {
    id: r.id,
    returnNumber: r.return_number || r.returnNumber,
    originalReceiptNumber: r.original_receipt_number || r.originalReceiptNumber,
    saleId: r.sale_id || r.saleId,
    items: (r.items || []).map((it: any) => ({
      productName: it.product_name || it.productName,
      sku: it.sku,
      size: it.size as ClothingSize,
      color: it.color,
      quantity: it.quantity,
      price: it.unit_price ?? it.price ?? 0,
      reason: it.reason || r.reason || '',
    })),
    refundAmount: r.refund_amount ?? r.refundAmount ?? 0,
    refundMethod: r.refund_method || r.refundMethod || 'cash',
    customerName: r.customer_name || r.customerName || 'Walk-in Customer',
    date: r.created_at || r.date || new Date().toISOString(),
    processedBy: r.processed_by || r.processedBy || 'Cashier',
  };
}

function mapDbExpenseToExpense(e: any): Expense {
  return {
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount,
    paymentMethod: e.payment_method || e.paymentMethod || 'cash',
    date: e.expense_date || e.date || new Date().toISOString().split('T')[0],
    recordedBy: e.recorded_by || e.recordedBy || 'Admin',
    reference: e.reference,
  };
}

function mapDbUserToUser(u: any): UserAccount {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email || '',
    role: u.role,
    status: u.status || 'active',
    lastLogin: u.last_login || u.lastLogin || 'Never',
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Persistent Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback to initial
    }
    return initialSettings;
  });

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
      return updated;
    });
    showToast('success', 'Settings Saved', 'Store configuration updated successfully.');
  };

  // State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(initialPurchases);
  const [returns, setReturns] = useState<ReturnRecord[]>(initialReturns);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [currentUser] = useState<UserAccount>(initialUsers[0]); // Amara Perera (Store Manager)

  const loadDatabaseData = async () => {
    if (!window.electronAPI) return;
    try {
      const [
        dbProds,
        dbMovements,
        dbCats,
        dbSales,
        dbCusts,
        dbSuppliers,
        dbPurchases,
        dbReturns,
        dbExpenses,
        dbUsers,
      ] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getStockMovements(),
        window.electronAPI.getCategories(),
        window.electronAPI.getSales(),
        window.electronAPI.getCustomers(),
        window.electronAPI.getSuppliers(),
        window.electronAPI.getPurchases(),
        window.electronAPI.getReturns(),
        window.electronAPI.getExpenses(),
        window.electronAPI.getUsers(),
      ]);

      if (dbProds && dbProds.length > 0) {
        setProducts(dbProds.map(mapDbProductToProduct));
      }
      if (dbMovements && dbMovements.length > 0) {
        setStockMovements(dbMovements.map(mapDbMovementToStockMovement));
      }
      if (dbCats && dbCats.length > 0) {
        setCategories(
          dbCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            productCount: 0,
            accentColor: c.accent_color || '#059669',
          }))
        );
      }
      if (dbSales && dbSales.length > 0) {
        setSales(dbSales.map(mapDbSaleToSale));
      }
      if (dbCusts && dbCusts.length > 0) {
        setCustomers(dbCusts.map(mapDbCustomerToCustomer));
      }
      if (dbSuppliers && dbSuppliers.length > 0) {
        setSuppliers(dbSuppliers.map(mapDbSupplierToSupplier));
      }
      if (dbPurchases && dbPurchases.length > 0) {
        setPurchases(dbPurchases.map(mapDbPurchaseToPurchase));
      }
      if (dbReturns && dbReturns.length > 0) {
        setReturns(dbReturns.map(mapDbReturnToReturn));
      }
      if (dbExpenses && dbExpenses.length > 0) {
        setExpenses(dbExpenses.map(mapDbExpenseToExpense));
      }
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers.map(mapDbUserToUser));
      }
    } catch (err) {
      console.error('Failed to load SQLite data in AppContext:', err);
    }
  };


  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Receipt Modal State
  const [receiptModalSale, setReceiptModalSale] = useState<Sale | null>(null);


  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = generateId('toast');
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cart operations
  const addToCart = (product: Product, size: ClothingSize, color: string, quantity = 1): boolean => {
    if (product.status !== 'active') {
      showToast('error', 'Cannot Add Product', 'This product is currently inactive.');
      return false;
    }

    const variant = product.variants.find(v => v.size === size && v.color === color);
    const maxStock = variant ? variant.stock : product.stock;

    if (maxStock <= 0) {
      showToast('error', 'Out of Stock', `${product.name} (${size} / ${color}) has zero stock available.`);
      return false;
    }

    const cartItemId = `${product.id}-${size}-${color}`;
    const existingIndex = cart.findIndex(item => item.id === cartItemId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > maxStock) {
        showToast('warning', 'Stock Limit Reached', `Only ${maxStock} units available for this variant.`);
        return false;
      }
      setCart(prev => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      });
    } else {
      setCart(prev => [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          sku: variant ? variant.sku : product.sku,
          image: product.image,
          price: product.sellingPrice,
          cost: product.purchaseCost,
          size,
          color,
          quantity,
          maxStock,
        },
      ]);
    }

    showToast('success', 'Added to Cart', `${product.name} (${size} / ${color}) added.`);
    return true;
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const clamped = Math.min(quantity, item.maxStock);
          if (clamped < quantity) {
            showToast('warning', 'Stock Limit', `Maximum available stock is ${item.maxStock}`);
          }
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  const checkout = async ({
    customerName,
    customerPhone,
    paymentMethod,
    cashReceived,
    notes,
  }: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    notes?: string;
  }): Promise<Sale | null> => {

    if (cart.length === 0) {
      showToast('error', 'Cart Empty', 'Please add products to cart before checkout.');
      return null;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.min(cartDiscount, subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = settings.enableTax ? Math.round(taxableAmount * (settings.taxRatePercent / 100)) : 0;
    const total = taxableAmount + tax;

    let changeGiven: number | undefined;
    if (paymentMethod === 'cash') {
      const received = cashReceived || 0;
      if (received < total) {
        showToast('error', 'Insufficient Cash', `Cash received (${received}) is less than total (${total}).`);
        return null;
      }
      changeGiven = received - total;
    }

    const receiptNumber = generateReceiptNumber();

    if (window.electronAPI) {
      try {
        const checkoutPayload = {
          receiptNumber,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || '',
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.price,
            unitCost: item.cost,
          })),
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          cashReceived: paymentMethod === 'cash' ? (cashReceived || total) : total,
          changeGiven: changeGiven || 0,
          notes,
        };

        const dbSale = await window.electronAPI.processCheckout(checkoutPayload);
        const mappedSale = mapDbSaleToSale(dbSale);
        await loadDatabaseData();
        clearCart();
        setReceiptModalSale(mappedSale);
        showToast('success', 'Sale Completed!', `Receipt ${mappedSale.receiptNumber} recorded in SQLite.`);
        return mappedSale;
      } catch (err: any) {
        console.error('Error processing checkout in SQLite:', err);
        showToast('error', 'Checkout Failed', err.message || 'Transaction failed');
        return null;
      }
    }

    const newSale: Sale = {
      id: generateId('sale'),
      receiptNumber,
      createdAt: new Date().toISOString(),
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      cashierName: currentUser.name,
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        price: item.price,
        cost: item.cost,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      cashReceived,
      changeGiven,
      status: 'completed',
      notes,
    };


    // Deduct stock from products & log movement
    setProducts(prevProducts => {
      const updated = [...prevProducts];
      const newMovements: StockMovement[] = [];

      for (const cartItem of cart) {
        const prodIndex = updated.findIndex(p => p.id === cartItem.productId);
        if (prodIndex > -1) {
          const product = updated[prodIndex];
          const prevTotalStock = product.stock;
          const newTotalStock = Math.max(0, prevTotalStock - cartItem.quantity);

          // update variant stock
          const updatedVariants = product.variants.map(v => {
            if (v.size === cartItem.size && v.color === cartItem.color) {
              return { ...v, stock: Math.max(0, v.stock - cartItem.quantity) };
            }
            return v;
          });

          updated[prodIndex] = {
            ...product,
            stock: newTotalStock,
            variants: updatedVariants,
          };

          newMovements.push({
            id: generateId('mv'),
            productId: product.id,
            productName: product.name,
            sku: cartItem.sku,
            variantInfo: `${cartItem.size} / ${cartItem.color}`,
            type: 'out',
            quantityDelta: -cartItem.quantity,
            previousStock: prevTotalStock,
            newStock: newTotalStock,
            reason: `Sold on ${receiptNumber}`,
            performedBy: currentUser.name,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          });
        }
      }

      setStockMovements(prev => [...newMovements, ...prev]);
      return updated;
    });

    // Update sales record
    setSales(prev => [newSale, ...prev]);

    // Update customer total purchases if customer exists
    if (customerName && customerName !== 'Walk-in Customer') {
      setCustomers(prevCusts =>
        prevCusts.map(c => {
          if (c.name.toLowerCase() === customerName.toLowerCase()) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + total,
              orderCount: c.orderCount + 1,
              loyaltyPoints: c.loyaltyPoints + Math.floor(total / 100),
            };
          }
          return c;
        })
      );
    }

    clearCart();
    setReceiptModalSale(newSale);
    showToast('success', 'Sale Completed!', `Receipt ${receiptNumber} generated.`);
    return newSale;
  };

  const getSaleByReceipt = (receiptNum: string) => {
    const clean = receiptNum.trim().toUpperCase();
    return sales.find(s => s.receiptNumber.toUpperCase() === clean);
  };

  // Products CRUD
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newId = generateId('prod');

    if (window.electronAPI) {
      try {
        const variantsPayload = (prodData.variants || []).map(v => ({
          size: v.size,
          color_name: v.color,
          color_hex: prodData.colors.find(c => c.name === v.color)?.hex || '#000000',
          sku: v.sku,
          barcode: `${prodData.barcode}-${v.size}`,
          stock: v.stock,
        }));

        await window.electronAPI.createProduct({
          product: {
            id: newId,
            name: prodData.name,
            sku: prodData.sku,
            barcode: prodData.barcode,
            category: prodData.category,
            brand: prodData.brand,
            description: prodData.description,
            purchase_cost: prodData.purchaseCost,
            selling_price: prodData.sellingPrice,
            reorder_level: prodData.reorderLevel,
            image: prodData.image,
            status: prodData.status,
          },
          variants: variantsPayload,
          performedBy: currentUser.name,
        });

        await loadDatabaseData();
        showToast('success', 'Product Created', `${prodData.name} saved to SQLite.`);
        return;
      } catch (err: any) {
        console.error('Error creating product in SQLite:', err);
        showToast('error', 'Product Creation Failed', err.message || 'Database error');
      }
    }

    const newProduct: Product = {
      ...prodData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts(prev => [newProduct, ...prev]);
    showToast('success', 'Product Created', `${newProduct.name} has been added.`);
  };

  const updateProduct = async (id: string, partial: Partial<Product>) => {
    if (window.electronAPI) {
      try {
        const payload: any = {};
        if (partial.name !== undefined) payload.name = partial.name;
        if (partial.sku !== undefined) payload.sku = partial.sku;
        if (partial.barcode !== undefined) payload.barcode = partial.barcode;
        if (partial.category !== undefined) payload.category = partial.category;
        if (partial.brand !== undefined) payload.brand = partial.brand;
        if (partial.description !== undefined) payload.description = partial.description;
        if (partial.purchaseCost !== undefined) payload.purchase_cost = partial.purchaseCost;
        if (partial.sellingPrice !== undefined) payload.selling_price = partial.sellingPrice;
        if (partial.reorderLevel !== undefined) payload.reorder_level = partial.reorderLevel;
        if (partial.image !== undefined) payload.image = partial.image;
        if (partial.status !== undefined) payload.status = partial.status;

        await window.electronAPI.updateProduct(id, {
          product: payload,
          performedBy: currentUser.name,
        });
        await loadDatabaseData();
        showToast('success', 'Product Updated', 'Product details updated in SQLite.');
        return;
      } catch (err: any) {
        console.error('Error updating product in SQLite:', err);
        showToast('error', 'Update Failed', err.message || 'Database error');
      }
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return { ...p, ...partial };
        }
        return p;
      })
    );
    showToast('success', 'Product Updated', 'Product details updated successfully.');
  };

  const toggleProductStatus = async (id: string) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';

    if (window.electronAPI) {
      try {
        await window.electronAPI.updateProduct(id, {
          product: { status: nextStatus },
          performedBy: currentUser.name,
        });
        await loadDatabaseData();
        showToast('info', 'Status Changed', `${target.name} is now ${nextStatus}.`);
        return;
      } catch (err: any) {
        console.error('Error toggling product status in SQLite:', err);
      }
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          showToast('info', 'Status Changed', `${p.name} is now ${nextStatus}.`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const deleteProduct = async (id: string) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.deleteProduct(id);
        await loadDatabaseData();
        showToast('info', 'Product Deleted', 'Product removed from SQLite.');
        return;
      } catch (err: any) {
        console.error('Error deleting product in SQLite:', err);
        showToast('error', 'Delete Failed', err.message || 'Database error');
      }
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('info', 'Product Deleted', 'Product removed.');
  };



  // Categories CRUD
  const addCategory = (catData: Omit<Category, 'id' | 'productCount'>) => {
    const newCat: Category = {
      ...catData,
      id: generateId('cat'),
      productCount: 0,
    };
    setCategories(prev => [...prev, newCat]);
    showToast('success', 'Category Created', `${newCat.name} category created.`);
  };

  const updateCategory = (id: string, partial: Partial<Category>) => {
    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          return { ...c, ...partial };
        }
        return c;
      })
    );
    showToast('success', 'Category Updated', 'Category updated successfully.');
  };

  // Stock Adjustment
  const adjustStock = async ({
    productId,
    variantId,
    type,
    quantity,
    reason,
    performedBy,
  }: {
    productId: string;
    variantId?: string;
    type: 'add' | 'deduct' | 'set';
    quantity: number;
    reason: string;
    performedBy: string;
  }) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.adjustStock({
          productId,
          variantId,
          type,
          quantity,
          reason,
          performedBy,
        });
        await loadDatabaseData();
        showToast('success', 'Stock Adjusted', 'Inventory updated and persisted to SQLite.');
        return;
      } catch (err: any) {
        console.error('Error adjusting stock in SQLite:', err);
        showToast('error', 'Adjustment Failed', err.message || 'Database error');
      }
    }

    setProducts(prev => {
      return prev.map(p => {
        if (p.id !== productId) return p;

        const prevStock = p.stock;
        let newStock = prevStock;
        let delta = 0;

        if (variantId) {
          const updatedVariants = p.variants.map(v => {
            if (v.id === variantId) {
              const oldVStock = v.stock;
              let newVStock = oldVStock;
              if (type === 'add') {
                newVStock = oldVStock + quantity;
                delta = quantity;
              } else if (type === 'deduct') {
                newVStock = Math.max(0, oldVStock - quantity);
                delta = -(oldVStock - newVStock);
              } else {
                newVStock = Math.max(0, quantity);
                delta = newVStock - oldVStock;
              }
              return { ...v, stock: newVStock };
            }
            return v;
          });
          const totalFromVariants = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
          newStock = totalFromVariants;

          setStockMovements(m => [
            {
              id: generateId('mv'),
              productId: p.id,
              productName: p.name,
              sku: p.sku,
              variantInfo: variantId,
              type: 'adjustment',
              quantityDelta: delta,
              previousStock: prevStock,
              newStock,
              reason,
              performedBy,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            },
            ...m,
          ]);

          return { ...p, stock: newStock, variants: updatedVariants };
        } else {
          if (type === 'add') {
            newStock = prevStock + quantity;
            delta = quantity;
          } else if (type === 'deduct') {
            newStock = Math.max(0, prevStock - quantity);
            delta = -(prevStock - newStock);
          } else {
            newStock = Math.max(0, quantity);
            delta = newStock - prevStock;
          }

          setStockMovements(m => [
            {
              id: generateId('mv'),
              productId: p.id,
              productName: p.name,
              sku: p.sku,
              variantInfo: 'Main Stock',
              type: 'adjustment',
              quantityDelta: delta,
              previousStock: prevStock,
              newStock,
              reason,
              performedBy,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            },
            ...m,
          ]);

          return { ...p, stock: newStock };
        }
      });
    });

    showToast('success', 'Stock Adjusted', 'Inventory updated successfully.');
  };


  // Customers
  const addCustomer = (cust: Omit<Customer, 'id' | 'totalPurchases' | 'orderCount' | 'loyaltyPoints' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cust,
      id: generateId('cust'),
      totalPurchases: 0,
      orderCount: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast('success', 'Customer Added', `${newCust.name} added to customer directory.`);
  };

  const updateCustomer = (id: string, cust: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...cust } : c)));
    showToast('success', 'Customer Updated', 'Customer details updated.');
  };

  // Suppliers
  const addSupplier = (sup: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...sup, id: generateId('sup') };
    setSuppliers(prev => [newSup, ...prev]);
    showToast('success', 'Supplier Added', `${newSup.name} saved.`);
  };

  const updateSupplier = (id: string, sup: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...sup } : s)));
    showToast('success', 'Supplier Updated', 'Supplier record updated.');
  };

  // Purchases
  const addPurchase = (po: Omit<PurchaseOrder, 'id'>) => {
    const newPO: PurchaseOrder = { ...po, id: generateId('po') };
    setPurchases(prev => [newPO, ...prev]);
    showToast('success', 'Purchase Order Created', `Reference ${newPO.reference} recorded.`);
  };

  const updatePurchaseStatus = (id: string, status: PurchaseOrder['status']) => {
    setPurchases(prev =>
      prev.map(p => {
        if (p.id === id) {
          return { ...p, status };
        }
        return p;
      })
    );
    showToast('info', 'PO Status Updated', `Status changed to ${status}.`);
  };

  // Returns
  const processReturn = ({
    originalReceiptNumber,
    items,
    refundAmount,
    refundMethod,
    customerName,
    processedBy,
  }: {
    originalReceiptNumber: string;
    items: {
      productId: string;
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
    processedBy: string;
  }): boolean => {
    const returnNumber = `RET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const sale = getSaleByReceipt(originalReceiptNumber);

    const newReturn: ReturnRecord = {
      id: generateId('ret'),
      returnNumber,
      originalReceiptNumber,
      saleId: sale?.id || 'unknown',
      items,
      refundAmount,
      refundMethod,
      customerName,
      date: new Date().toISOString(),
      processedBy,
    };

    // Restore returned stock
    setProducts(prev => {
      const updated = [...prev];
      for (const item of items) {
        const pIndex = updated.findIndex(p => p.id === item.productId);
        if (pIndex > -1) {
          const product = updated[pIndex];
          const newVariants = product.variants.map(v => {
            if (v.size === item.size && v.color === item.color) {
              return { ...v, stock: v.stock + item.quantity };
            }
            return v;
          });
          updated[pIndex] = {
            ...product,
            stock: product.stock + item.quantity,
            variants: newVariants,
          };
        }
      }
      return updated;
    });

    // Mark sale as refunded or partially refunded
    if (sale) {
      setSales(prev =>
        prev.map(s => {
          if (s.id === sale.id) {
            return {
              ...s,
              status: s.total <= refundAmount ? 'refunded' : 'partially_refunded',
            };
          }
          return s;
        })
      );
    }

    setReturns(prev => [newReturn, ...prev]);
    showToast('success', 'Return Processed', `Return #${returnNumber} recorded and stock restored.`);
    return true;
  };

  // Expenses
  const addExpense = (exp: Omit<Expense, 'id'>) => {
    const newExp: Expense = { ...exp, id: generateId('exp') };
    setExpenses(prev => [newExp, ...prev]);
    showToast('success', 'Expense Recorded', `${exp.category} expense of ${exp.amount} added.`);
  };

  // Users
  const addUser = (userData: Omit<UserAccount, 'id' | 'lastLogin'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: generateId('user'),
      lastLogin: 'Never',
    };
    setUsers(prev => [...prev, newUser]);
    showToast('success', 'User Created', `User account for ${newUser.name} created.`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const next = u.status === 'active' ? 'inactive' : 'active';
          showToast('info', 'User Status Changed', `${u.name} is now ${next}.`);
          return { ...u, status: next };
        }
        return u;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        sidebarCollapsed,
        setSidebarCollapsed,
        globalSearch,
        setGlobalSearch,
        products,
        addProduct,
        updateProduct,
        toggleProductStatus,
        deleteProduct,
        refreshDatabaseData: loadDatabaseData,
        categories,

        addCategory,
        updateCategory,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        checkout,
        sales,
        getSaleByReceipt,
        stockMovements,
        adjustStock,
        customers,
        addCustomer,
        updateCustomer,
        suppliers,
        addSupplier,
        updateSupplier,
        purchases,
        addPurchase,
        updatePurchaseStatus,
        returns,
        processReturn,
        expenses,
        addExpense,
        users,
        addUser,
        toggleUserStatus,
        currentUser,
        settings,
        updateSettings,
        toasts,
        showToast,
        dismissToast,
        receiptModalSale,
        setReceiptModalSale,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
