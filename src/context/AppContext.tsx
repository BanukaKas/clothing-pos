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
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  toggleProductStatus: (id: string) => void;

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
  }) => Sale | null;

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
  }) => void;

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

  const checkout = ({
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
  }): Sale | null => {
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
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...prodData,
      id: generateId('prod'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts(prev => [newProduct, ...prev]);
    showToast('success', 'Product Created', `${newProduct.name} has been added.`);
  };

  const updateProduct = (id: string, partial: Partial<Product>) => {
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

  const toggleProductStatus = (id: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'active' ? 'inactive' : 'active';
          showToast('info', 'Status Changed', `${p.name} is now ${nextStatus}.`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
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
  const adjustStock = ({
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
