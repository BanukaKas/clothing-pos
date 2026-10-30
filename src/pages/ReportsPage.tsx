import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Boxes,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/csvExport';

const monthlyReportData = [
  { month: 'Jun', revenue: 1450000, profit: 680000, expenses: 410000 },
  { month: 'Jul', revenue: 1680000, profit: 790000, expenses: 430000 },
  { month: 'Aug', revenue: 1920000, profit: 910000, expenses: 470000 },
  { month: 'Sep', revenue: 2150000, profit: 1040000, expenses: 490000 },
  { month: 'Oct (Current)', revenue: 2480000, profit: 1220000, expenses: 564000 },
];

const paymentMethodDistribution = [
  { name: 'Card (Visa / Master)', value: 1350000, color: '#2563eb' },
  { name: 'Cash at Till', value: 820000, color: '#059669' },
  { name: 'Bank Transfer / QR', value: 310000, color: '#7c3aed' },
];

export const ReportsPage: React.FC = () => {
  const { sales, products, expenses, settings, showToast } = useApp();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Business calculations
  const totalGrossRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCOGS = sales.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc, it) => itemAcc + it.cost * it.quantity, 0);
  }, 0);
  const grossProfit = totalGrossRevenue - totalCOGS;
  const totalStoreExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalStoreExpenses;
  const avgBasket = totalGrossRevenue / Math.max(1, sales.length);

  // Real CSV Download
  const handleExportFullReport = () => {
    const reportData = sales.flatMap(s =>
      s.items.map(item => ({
        ReceiptNumber: s.receiptNumber,
        Date: s.createdAt,
        Customer: s.customerName,
        GarmentName: item.name,
        SKU: item.sku,
        Size: item.size,
        Color: item.color,
        Quantity: item.quantity,
        UnitPrice: item.price,
        UnitCost: item.cost,
        LineSubtotal: item.total,
        Tender: s.paymentMethod,
        Cashier: s.cashierName,
      }))
    );

    exportToCSV(`mint-fashion-executive-report-${new Date().toISOString().split('T')[0]}`, reportData);
    showToast('success', 'Report Downloaded', `Generated CSV with ${reportData.length} itemized transaction lines.`);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Financial & Sales Analytics</h2>
          <p className="text-xs text-slate-500">
            Real-time profit margins, cost of goods sold (COGS), and download center
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="today">Today's Trading</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Current Month (October)</option>
            <option value="year">Fiscal Year to Date</option>
          </select>

          {/* REAL CSV EXPORT BUTTON */}
          <button
            onClick={handleExportFullReport}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Complete CSV Report</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Volume</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(totalGrossRevenue, settings.currency)}
            </h3>
            <p className="text-xs text-emerald-700 font-semibold mt-1">+14.2% vs previous period</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost of Goods (COGS)</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-700 font-display">
              {formatCurrency(totalCOGS, settings.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Wholesale inventory consumption</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Trading Profit</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-700 font-display">
              {formatCurrency(grossProfit, settings.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Margin: {Math.round((grossProfit / Math.max(1, totalGrossRevenue)) * 100)}%
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Basket Size</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(avgBasket, settings.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Per transaction ticket</p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Profit Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Revenue vs Operational Cost</h3>
              <p className="text-xs text-slate-400">Monthly gross sales compared against overhead expenses</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              Fiscal 2026
            </span>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReportData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Gross Revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="Gross Margin" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Tender Share */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display">Tender Distribution</h3>
            <p className="text-xs text-slate-400">Share of payment methods at checkout</p>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Total Tendered']}
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
          </div>

          <div className="mt-auto space-y-2 pt-2 border-t border-slate-100 text-xs">
            {paymentMethodDistribution.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.value, settings.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSV Export Notice Box */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-emerald-800/40">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-display">Ready for Accounting & Tax Reconciliations</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Exports a fully formatted CSV spreadsheet containing receipt identifiers, garment SKUs, unit costs, and profit lines.
            </p>
          </div>
        </div>
        <button
          onClick={handleExportFullReport}
          className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
        >
          Download CSV Spreadsheet
        </button>
      </div>
    </div>
  );
};
