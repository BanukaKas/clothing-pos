import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Barcode,
  Tags,
  Boxes,
  History,
  Users,
  Truck,
  FileSpreadsheet,
  RotateCcw,
  Receipt,
  BarChart3,
  UserCheck,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: (cartCount: number, lowStockCount: number) => number | null;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'pos',
    label: 'Point of Sale',
    icon: ShoppingBag,
    badge: (cartCount) => (cartCount > 0 ? cartCount : null),
    badgeColor: 'bg-emerald-500 text-white',
  },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'barcode-management', label: 'Barcode Studio', icon: Barcode },
  { id: 'categories', label: 'Categories', icon: Tags },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    badge: (_, lowStockCount) => (lowStockCount > 0 ? lowStockCount : null),
    badgeColor: 'bg-amber-500 text-slate-900',
  },
  { id: 'sales', label: 'Sales History', icon: History },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'purchases', label: 'Purchases', icon: FileSpreadsheet },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: UserCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, cart, products } = useApp();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 shadow-2xl ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0b1120]">
        {!sidebarCollapsed ? (
          <div className="flex items-center space-x-3 overflow-hidden cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold tracking-wider text-white text-base font-display">
                MINT <span className="text-emerald-400 font-normal">FASHION</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400/90 font-medium truncate">
                Retail POS Suite
              </span>
            </div>
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg text-white mx-auto cursor-pointer"
            onClick={() => setCurrentPage('dashboard')}
            title="MINT FASHION"
          >
            <Sparkles className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(prev => !prev)}
          className={`text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors ${
            sidebarCollapsed ? 'hidden' : 'block'
          }`}
          title="Toggle Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const badgeVal = item.badge ? item.badge(cartCount, lowStockCount) : null;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center text-sm font-medium rounded-xl transition-all duration-150 group relative ${
                sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
              )}
              <Icon
                className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'
                } ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}
              />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

              {badgeVal !== null && (
                <span
                  className={`ml-auto font-bold text-[10px] px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  } ${sidebarCollapsed ? 'absolute -top-1 -right-1 text-[9px] px-1' : ''}`}
                >
                  {badgeVal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Store Location Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0a0f1d]/80">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate">
                <p className="text-slate-200 font-medium truncate">Colombo 03 Store</p>
                <p className="text-[10px] text-slate-500 truncate">Register #01 • Online</p>
              </div>
            </div>
            <Store className="w-4 h-4 text-emerald-500/70 shrink-0 ml-1" />
          </div>
        ) : (
          <div className="flex justify-center" title="Store Online • Colombo 03">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-full mt-2 flex justify-center py-1 text-slate-500 hover:text-slate-200 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
