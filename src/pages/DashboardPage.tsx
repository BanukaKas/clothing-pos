import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const salesTrendData = [
  { time: '09:00', revenue: 15800, orders: 2 },
  { time: '10:00', revenue: 38400, orders: 4 },
  { time: '11:00', revenue: 64200, orders: 7 },
  { time: '12:00', revenue: 98600, orders: 12 },
  { time: '13:00', revenue: 134000, orders: 16 },
  { time: '14:00', revenue: 168500, orders: 21 },
  { time: '15:00', revenue: 202400, orders: 28 },
  { time: '16:00', revenue: 248500, orders: 35 },
];

const categorySalesData = [
  { name: 'Shirts & Tops', value: 84500, color: '#059669' },
  { name: 'Denim & Jeans', value: 58000, color: '#2563eb' },
  { name: 'Dresses', value: 44200, color: '#db2777' },
  { name: 'T-Shirts & Polos', value: 31200, color: '#0d9488' },
  { name: 'Footwear & Outerwear', value: 30600, color: '#7c3aed' },
];

export const DashboardPage: React.FC = () => {
  const { sales, products, setCurrentPage, setReceiptModalSale, settings } = useApp();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Calculate live summary stats from actual mock sales
  const todayRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesCount = sales.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock <= p.reorderLevel);

  // Top selling products derived from products and sales
  const topSelling = products.slice(0, 5);

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Top Welcome Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>MINT FASHION • STORE INTELLIGENCE</span>
          </div>
          <h2 className="text-2xl font-bold font-display">Welcome back, Amara</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Store operations are running smoothly. Today's retail volume is up by{' '}
            <span className="text-emerald-400 font-semibold">+14.2%</span> compared to yesterday's shift.
          </p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={() => setCurrentPage('pos')}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Point of Sale</span>
          </button>
          <button
            onClick={() => setCurrentPage('products')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Garment</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              {formatCurrency(todayRevenue, settings.currency)}
            </h3>
            <div className="mt-2 flex items-center space-x-1.5 text-xs">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2%
              </span>
              <span className="text-slate-400">vs yesterday (Rs. 217,600)</span>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              {totalSalesCount} Transactions
            </h3>
            <div className="mt-2 flex items-center space-x-1.5 text-xs">
              <span className="inline-flex items-center text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +8.5%
              </span>
              <span className="text-slate-400">Avg ticket: {formatCurrency(todayRevenue / Math.max(1, totalSalesCount), settings.currency)}</span>
            </div>
          </div>
        </div>

        {/* Products in Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock on Hand</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              {totalStockUnits.toLocaleString()} Garments
            </h3>
            <div className="mt-2 flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">{products.length} active clothing styles</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold cursor-pointer hover:underline" onClick={() => setCurrentPage('inventory')}>
                Audit
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-extrabold tracking-tight font-display ${
              lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {lowStockItems.length} Items Alert
            </h3>
            <div className="mt-2 flex items-center space-x-1.5 text-xs">
              {lowStockItems.length > 0 ? (
                <button
                  onClick={() => setCurrentPage('inventory')}
                  className="inline-flex items-center text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors"
                >
                  Restock Now &rarr;
                </button>
              ) : (
                <span className="text-emerald-700 font-semibold">Inventory optimal</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Sales Revenue Trend</h3>
              <p className="text-xs text-slate-400">Cumulative store gross sales across today's trading hours</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Gross Revenue']}
                  labelFormatter={lbl => `Trading Time: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display">Sales by Category</h3>
            <p className="text-xs text-slate-400">Share of revenue across collections</p>
          </div>

          <div className="h-56 w-full mt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Top Category</span>
              <span className="text-sm font-extrabold text-slate-900">Shirts & Tops</span>
            </div>
          </div>

          {/* Custom Category Legend */}
          <div className="mt-auto space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {categorySalesData.slice(0, 4).map(cat => (
              <div key={cat.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatCurrency(cat.value, settings.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Top-Selling Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Top-Selling Garments</h3>
              <p className="text-xs text-slate-400">Best-performing styles by demand</p>
            </div>
            <button
              onClick={() => setCurrentPage('products')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View Catalog &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto flex-1">
            {topSelling.map((prod, idx) => (
              <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-12 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {prod.category} • <span className="font-mono">{prod.sku}</span>
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700">
                        {formatCurrency(prod.sellingPrice, settings.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    prod.stock <= prod.reorderLevel
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {prod.stock} in stock
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cost: {formatCurrency(prod.purchaseCost, settings.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Live cashier register audit stream</p>
            </div>
            <button
              onClick={() => setCurrentPage('sales')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Full Sales Log &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto flex-1">
            {sales.slice(0, 5).map(sale => (
              <div
                key={sale.id}
                onClick={() => setReceiptModalSale(sale)}
                className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors font-mono">
                      {sale.receiptNumber}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      sale.paymentMethod === 'cash'
                        ? 'bg-green-50 text-green-700'
                        : sale.paymentMethod === 'card'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {sale.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{sale.customerName}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatDateTime(sale.createdAt)} • Cashier: {sale.cashierName}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {formatCurrency(sale.total, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400">{sale.items.length} garments</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
