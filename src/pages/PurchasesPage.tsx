import React, { useState } from 'react';
import { Plus, Search, FileSpreadsheet, Truck, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { PurchaseOrder } from '../types';

export const PurchasesPage: React.FC = () => {
  const { purchases, suppliers, addPurchase, updatePurchaseStatus, settings, products } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [unitCost, setUnitCost] = useState(products[0]?.purchaseCost || 3500);

  const openAdd = () => {
    setSupplierId(suppliers[0]?.id || '');
    setSelectedProductId(products[0]?.id || '');
    setQuantity(50);
    setUnitCost(products[0]?.purchaseCost || 3500);
    setIsModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitCost(prod.purchaseCost);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId) || suppliers[0];
    const prod = products.find(p => p.id === selectedProductId) || products[0];

    const ref = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalCost = quantity * unitCost;

    addPurchase({
      reference: ref,
      supplierId: sup.id,
      supplierName: sup.name,
      items: [
        {
          productName: prod.name,
          sku: prod.sku,
          quantity,
          unitCost,
          totalCost,
        },
      ],
      totalCost,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Purchases & Goods Inward</h2>
          <p className="text-xs text-slate-500">
            {purchases.length} bulk purchase orders dispatched to garment mills
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">PO Reference</th>
                <th className="py-3.5 px-3">Supplier</th>
                <th className="py-3.5 px-3">Ordered Items</th>
                <th className="py-3.5 px-3">Total Cost</th>
                <th className="py-3.5 px-3">Order Date</th>
                <th className="py-3.5 px-3">Delivery Status</th>
                <th className="py-3.5 px-4 text-right">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.reference}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{po.supplierName}</td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="text-slate-700">
                          <span className="font-bold">{item.quantity} units</span> • {item.productName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 text-sm">
                    {formatCurrency(po.totalCost, settings.currency)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-500">{formatDate(po.orderDate)}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        po.status === 'received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : po.status === 'in_transit'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {po.status !== 'received' ? (
                      <button
                        onClick={() => updatePurchaseStatus(po.id, 'received')}
                        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        Mark Received
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Stock Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">New Wholesale Purchase Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Garment</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Agreed Unit Cost ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(Number(e.target.value))}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-emerald-900">Total Purchase Cost:</span>
                <span className="font-mono text-base font-extrabold text-emerald-800">
                  {formatCurrency(quantity * unitCost, settings.currency)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
