import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Receipt,
  RotateCw,
  ShoppingBag,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { Sale, PaymentMethod, ClothingSize } from '../types';

export const ReturnsPage: React.FC = () => {
  const { sales, returns, processReturn, currentUser, settings, showToast } = useApp();

  const [receiptSearch, setReceiptSearch] = useState('');
  const [activeSale, setActiveSale] = useState<Sale | null>(null);

  // Return form state: map of itemIndex -> { selected, returnQty, reason }
  const [returnSelection, setReturnSelection] = useState<
    Record<number, { selected: boolean; returnQty: number; reason: string }>
  >({});
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');

  const handleSearchReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptSearch.trim()) return;

    const query = receiptSearch.trim().toUpperCase();
    const found = sales.find(s => s.receiptNumber.toUpperCase() === query);

    if (found) {
      setActiveSale(found);
      const initial: Record<number, { selected: boolean; returnQty: number; reason: string }> = {};
      found.items.forEach((_, idx) => {
        initial[idx] = {
          selected: false,
          returnQty: 1,
          reason: 'Wrong size requested by customer',
        };
      });
      setReturnSelection(initial);
      showToast('info', 'Receipt Found', `${found.receiptNumber} with ${found.items.length} garments.`);
    } else {
      showToast('error', 'Receipt Not Found', `No sale matches receipt: ${query}`);
    }
  };

  // Calculate refund sum
  const refundTotal = activeSale
    ? activeSale.items.reduce((sum, item, idx) => {
        const sel = returnSelection[idx];
        if (sel && sel.selected) {
          return sum + item.price * sel.returnQty;
        }
        return sum;
      }, 0)
    : 0;

  const handleProcessReturn = () => {
    if (!activeSale || refundTotal <= 0) {
      showToast('error', 'Select Items', 'Please select at least one item to return.');
      return;
    }

    const itemsToReturn = activeSale.items
      .map((item, idx) => {
        const sel = returnSelection[idx];
        if (sel && sel.selected) {
          return {
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: sel.returnQty,
            price: item.price,
            reason: sel.reason,
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    processReturn({
      originalReceiptNumber: activeSale.receiptNumber,
      items: itemsToReturn,
      refundAmount: refundTotal,
      refundMethod,
      customerName: activeSale.customerName,
      processedBy: currentUser.name,
    });

    setActiveSale(null);
    setReceiptSearch('');
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Customer Returns & Exchange</h2>
          <p className="text-xs text-slate-500">
            Validate original purchase receipts, restock garments, and issue refunds
          </p>
        </div>
      </div>

      {/* Receipt Lookup Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>Step 1: Look Up Original Receipt</span>
        </h3>

        <form onSubmit={handleSearchReceipt} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={receiptSearch}
              onChange={e => setReceiptSearch(e.target.value)}
              placeholder="Enter receipt number (e.g. REC-2026-0842 or REC-2026-0843)..."
              className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2.5 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            Find Receipt
          </button>
        </form>

        {/* Quick Recent Receipts Suggestions */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1">
          <span className="font-semibold">Recent Receipts:</span>
          {sales.slice(0, 3).map(s => (
            <button
              key={s.id}
              onClick={() => {
                setReceiptSearch(s.receiptNumber);
                setActiveSale(s);
                const initial: Record<number, { selected: boolean; returnQty: number; reason: string }> = {};
                s.items.forEach((_, idx) => {
                  initial[idx] = {
                    selected: false,
                    returnQty: 1,
                    reason: 'Wrong size requested by customer',
                  };
                });
                setReturnSelection(initial);
              }}
              className="font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
            >
              {s.receiptNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Active Receipt Processing Panel */}
      {activeSale && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-modal">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                Original Transaction Verified
              </span>
              <h3 className="text-base font-bold font-mono mt-0.5">{activeSale.receiptNumber}</h3>
              <p className="text-xs text-slate-300">
                Customer: <span className="font-semibold">{activeSale.customerName}</span> • Date:{' '}
                {formatDateTime(activeSale.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Tendered</span>
              <span className="text-lg font-extrabold text-white font-mono">
                {formatCurrency(activeSale.total, settings.currency)}
              </span>
            </div>
          </div>

          {/* Items Selector */}
          <div className="p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step 2: Select Items and Specify Return Reason
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {activeSale.items.map((item, idx) => {
                const sel = returnSelection[idx] || {
                  selected: false,
                  returnQty: 1,
                  reason: 'Wrong size requested by customer',
                };

                return (
                  <div
                    key={idx}
                    className={`p-4 transition-colors ${
                      sel.selected ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={sel.selected}
                        onChange={e =>
                          setReturnSelection(prev => ({
                            ...prev,
                            [idx]: { ...sel, selected: e.target.checked },
                          }))
                        }
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{item.name}</h5>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {formatCurrency(item.price, settings.currency)} / unit
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.sku} • Size: {item.size} • Color: {item.color} • Purchased: {item.quantity} units
                        </p>

                        {/* Interactive return fields when checked */}
                        {sel.selected && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                            <div>
                              <label className="font-semibold text-slate-600 block mb-1">
                                Return Quantity (Max: {item.quantity}):
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={sel.returnQty}
                                onChange={e => {
                                  const val = Math.min(item.quantity, Math.max(1, Number(e.target.value)));
                                  setReturnSelection(prev => ({
                                    ...prev,
                                    [idx]: { ...sel, returnQty: val },
                                  }));
                                }}
                                className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="font-semibold text-slate-600 block mb-1">Return Reason:</label>
                              <select
                                value={sel.reason}
                                onChange={e =>
                                  setReturnSelection(prev => ({
                                    ...prev,
                                    [idx]: { ...sel, reason: e.target.value },
                                  }))
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-medium"
                              >
                                <option value="Wrong size requested by customer">
                                  Wrong size requested by customer
                                </option>
                                <option value="Defective fabric or stitching flaw">
                                  Defective fabric or stitching flaw
                                </option>
                                <option value="Customer changed mind / Gift exchange">
                                  Customer changed mind / Gift exchange
                                </option>
                                <option value="Color shade mismatch in daylight">
                                  Color shade mismatch in daylight
                                </option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Refund Method & Total */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Refund Method</label>
                <div className="flex items-center space-x-2">
                  {['cash', 'card', 'bank_transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMethod(m as PaymentMethod)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                        refundMethod === m
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">Total Refund Calculated:</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-display">
                  {formatCurrency(refundTotal, settings.currency)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSale(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel Return
              </button>
              <button
                type="button"
                onClick={handleProcessReturn}
                disabled={refundTotal <= 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-sm active:scale-95 ${
                  refundTotal <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Confirm Refund & Restock Garment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Returns Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display">Processed Returns & Exchanges Log</h3>
          <span className="text-xs text-slate-400 font-mono">{returns.length} return events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-3">Original Receipt</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Garment Returned</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Refund Amount</th>
                <th className="py-3 px-4 text-right">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ret.returnNumber}</td>
                  <td className="py-3 px-3 font-mono text-emerald-700 font-semibold">{ret.originalReceiptNumber}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{ret.customerName}</td>
                  <td className="py-3 px-3">
                    {ret.items.map((it, idx) => (
                      <span key={idx} className="font-semibold text-slate-700">
                        {it.productName} ({it.size}/{it.color}) &times; {it.quantity}
                      </span>
                    ))}
                  </td>
                  <td className="py-3 px-3 text-slate-500 italic max-w-[200px] truncate">{ret.items[0]?.reason}</td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">
                    -{formatCurrency(ret.refundAmount, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-semibold">{ret.processedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
