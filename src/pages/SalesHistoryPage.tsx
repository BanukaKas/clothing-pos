import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { exportToCSV } from '../utils/csvExport';
import type { Sale } from '../types';

export const SalesHistoryPage: React.FC = () => {
  const { sales, setReceiptModalSale, settings, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'bank_transfer' | 'split'>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch =
        s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, searchQuery, paymentFilter]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const handleExportCSV = () => {
    const exportRows = filteredSales.map(s => ({
      ReceiptNumber: s.receiptNumber,
      Date: s.createdAt,
      Customer: s.customerName,
      Cashier: s.cashierName,
      ItemsCount: s.items.length,
      Subtotal: s.subtotal,
      Discount: s.discount,
      Tax: s.tax,
      Total: s.total,
      PaymentMethod: s.paymentMethod,
      Status: s.status,
    }));

    exportToCSV(`mint-fashion-sales-${new Date().toISOString().split('T')[0]}`, exportRows);
    showToast('success', 'CSV Export Ready', `${exportRows.length} sales rows exported.`);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Sales & Receipts Ledger</h2>
          <p className="text-xs text-slate-500">
            {sales.length} commercial retail transactions recorded on this register
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, customer name, or cashier..."
            className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Tender</option>
            <option value="card">Credit / Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="split">Split Tender</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-3">Date & Time</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Cashier</th>
                <th className="py-3.5 px-3">Garments</th>
                <th className="py-3.5 px-3">Total Amount</th>
                <th className="py-3.5 px-3">Tender</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <span
                      onClick={() => setReceiptModalSale(sale)}
                      className="cursor-pointer text-emerald-700 hover:underline"
                    >
                      {sale.receiptNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                    {formatDateTime(sale.createdAt)}
                  </td>

                  <td className="py-3.5 px-3 font-semibold text-slate-800">{sale.customerName}</td>

                  <td className="py-3.5 px-3 text-slate-600">{sale.cashierName}</td>

                  <td className="py-3.5 px-3 font-mono text-slate-700">{sale.items.length} items</td>

                  <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 text-sm">
                    {formatCurrency(sale.total, settings.currency)}
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        sale.paymentMethod === 'cash'
                          ? 'bg-green-50 text-green-700'
                          : sale.paymentMethod === 'card'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {sale.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setSelectedSaleDetail(sale)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Line Items"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReceiptModalSale(sale)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Preview & Print Thermal Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Showing {filteredSales.length} of {sales.length} orders</span>
          <span className="font-semibold">
            Filtered Total: <span className="font-extrabold text-slate-900">{formatCurrency(totalRevenue, settings.currency)}</span>
          </span>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-lg w-full overflow-hidden animate-modal flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">{selectedSaleDetail.receiptNumber}</h3>
                <p className="text-xs text-slate-400">{formatDateTime(selectedSaleDetail.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Customer</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedSaleDetail.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Cashier</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedSaleDetail.cashierName}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Line Items Purchased:</h4>
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {selectedSaleDetail.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.size} / {item.color} • {item.quantity} &times;{' '}
                          {formatCurrency(item.price, settings.currency)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(item.total, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSaleDetail.subtotal, settings.currency)}</span>
                </div>
                {selectedSaleDetail.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedSaleDetail.discount, settings.currency)}</span>
                  </div>
                )}
                {selectedSaleDetail.tax > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedSaleDetail.tax, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700">
                    {formatCurrency(selectedSaleDetail.total, settings.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const s = selectedSaleDetail;
                  setSelectedSaleDetail(null);
                  setReceiptModalSale(s);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
