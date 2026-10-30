import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

const pageTitleMap: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Retail analytics, revenue & stock metrics' },
  pos: { title: 'Point of Sale (POS)', subtitle: 'Checkout terminal, barcode scanning & cart' },
  products: { title: 'Product Catalog', subtitle: 'Manage clothing items, sizes, colors and pricing' },
  categories: { title: 'Category Management', subtitle: 'Organize collections & merchandising categories' },
  inventory: { title: 'Inventory & Stock Control', subtitle: 'Stock audit, variant tracking & adjustments' },
  sales: { title: 'Sales & Receipts History', subtitle: 'Past orders, payments and printable receipts' },
  customers: { title: 'Customer Directory', subtitle: 'Loyalty points, contact profiles and spending history' },
  suppliers: { title: 'Garment Suppliers', subtitle: 'Fabric mills, international vendors and contact books' },
  purchases: { title: 'Purchases & Inward Goods', subtitle: 'Purchase orders, stock receiving and cost tracking' },
  returns: { title: 'Returns & Exchange', subtitle: 'Refund processing, receipt lookup and inventory restock' },
  expenses: { title: 'Store Expenses', subtitle: 'Operating costs, store lease, utilities and staff pay' },
  reports: { title: 'Reports & Analytics', subtitle: 'Sales reports, category performance and CSV export' },
  users: { title: 'Users & Staff Permissions', subtitle: 'Cashiers, store managers and access control' },
  settings: { title: 'System Settings', subtitle: 'Store details, currency, tax rates and receipt design' },
};

export const Topbar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    setSidebarCollapsed,
    globalSearch,
    setGlobalSearch,
    currentUser,
    cart,
    products,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const pageInfo = pageTitleMap[currentPage] || { title: 'MINT FASHION', subtitle: '' };
  const lowStockItems = products.filter(p => p.stock <= p.reorderLevel);

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-300 px-6 flex items-center justify-between shadow-sm ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <span className="hover:text-emerald-600 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
              MINT FASHION
            </span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold capitalize">{currentPage}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 leading-tight font-display">{pageInfo.title}</h1>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Quick search products, SKU, receipts..."
          className="w-full bg-[#f8faf8] border border-slate-200 text-sm text-slate-800 pl-9 pr-14 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
        />
        <div className="absolute right-2.5 flex items-center space-x-1">
          <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Date & Live Clock */}
        <div className="hidden xl:flex items-center space-x-3 text-xs text-slate-500 border-r border-slate-200 pr-4">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-slate-700 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Quick Launch POS Button */}
        {currentPage !== 'pos' && (
          <button
            onClick={() => setCurrentPage('pos')}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all duration-150 transform active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Open POS</span>
            {cart.length > 0 && (
              <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {cart.length}
              </span>
            )}
          </button>
        )}

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
            {lowStockItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-elevation border border-slate-100 py-3 z-50 animate-modal">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  System Active
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto px-2 py-1 space-y-1 text-xs">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentPage('inventory');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/60 cursor-pointer transition-colors flex items-start space-x-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Low Stock: {item.stock} units left (Reorder: {item.reorderLevel})
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    All stock levels optimal
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-emerald-500/30">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">{currentUser.role}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevation border border-slate-100 p-2 z-50 animate-modal">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  <span>● Active Cashier Session</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentPage('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>Store Settings</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setCurrentPage('users');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>Switch Cashier / Role</span>
                <User className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
