import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  DollarSign,
  Search,
  Filter,
  Plus,
  Minus,
  SlidersHorizontal,
  History,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle,
  X,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import type { Product } from '../types';

export const InventoryPage: React.FC = () => {
  const { products, stockMovements, adjustStock, currentUser, settings } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Restock from local warehouse');

  // Stat calculations
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.purchaseCost, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  // Filtered inventory list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.stock <= p.reorderLevel && p.stock > 0;
      if (stockFilter === 'out') matchesStock = p.stock <= 0;

      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setSelectedVariantId(product.variants[0]?.id || '');
    setAdjustType('add');
    setAdjustQty(10);
    setAdjustReason('Periodic physical inventory audit');
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    adjustStock({
      productId: adjustingProduct.id,
      variantId: selectedVariantId || undefined,
      type: adjustType,
      quantity: adjustQty,
      reason: adjustReason,
      performedBy: currentUser.name,
    });

    setAdjustingProduct(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Inventory & Stock Audit</h2>
          <p className="text-xs text-slate-500">
            Real-time garment warehouse counts, variant allocations, and movement ledger
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Inventory Units ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Stock Movement Log ({stockMovements.length})
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">{totalUnits.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-1">Available garments in stock</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(totalValue, settings.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Total wholesale stock valuation</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-amber-600 font-display">{lowStockProducts.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Garments below reorder limit</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-rose-600 font-display">{outOfStockProducts.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Zero units currently available</p>
          </div>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inventory by garment name, SKU, brand..."
                className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  stockFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  stockFilter === 'low'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Low Stock ({lowStockProducts.length})
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  stockFilter === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Out of Stock ({outOfStockProducts.length})
              </button>
            </div>
          </div>

          {/* Inventory Table with Variant Stock */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Garment</th>
                    <th className="py-3.5 px-3">SKU</th>
                    <th className="py-3.5 px-3">Unit Valuation</th>
                    <th className="py-3.5 px-3">Size & Color Variants</th>
                    <th className="py-3.5 px-3">Total Stock</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map(p => {
                    const isLow = p.stock <= p.reorderLevel && p.stock > 0;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">{p.brand}</span>
                              <div className="font-bold text-slate-900 truncate max-w-[200px]">{p.name}</div>
                              <span className="text-[10px] text-slate-400">{p.category}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-800">{p.sku}</td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {formatCurrency(p.purchaseCost * p.stock, settings.currency)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatCurrency(p.purchaseCost, settings.currency)} / unit
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {p.variants.map(v => (
                              <span
                                key={v.id}
                                className="inline-flex items-center space-x-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                <span className="font-bold">{v.size}</span>
                                <span className="text-slate-400">•</span>
                                <span className="truncate max-w-[60px]">{v.color}</span>
                                <span className="font-mono font-bold text-emerald-700">({v.stock})</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-sm">
                          <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}>
                            {p.stock}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            Reorder: {p.reorderLevel}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOut
                                ? 'bg-rose-50 text-rose-700'
                                : isLow
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Adequate'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors shadow-sm"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Movement History Table */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-display">Inventory Audit Trail</h3>
            <span className="text-xs text-slate-400 font-mono">{stockMovements.length} records logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-3">Garment & Variant</th>
                  <th className="py-3 px-3">Change Quantity</th>
                  <th className="py-3 px-3">Previous &rarr; New</th>
                  <th className="py-3 px-3">Audit Reason</th>
                  <th className="py-3 px-4 text-right">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{m.date}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{m.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.sku} • {m.variantInfo}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${
                          m.quantityDelta > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {m.previousStock} &rarr; <span className="font-bold">{m.newStock}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{m.reason}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT DIALOG */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display">Adjust Garment Stock</h3>
                <p className="text-xs text-slate-300 truncate max-w-[280px]">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="p-6 space-y-4 text-xs">
              {/* Variant Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Size & Color Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="">Whole Product (All Variants)</option>
                  {adjustingProduct.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} (Currently {v.stock} units) - {v.sku}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Mode */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'add', label: 'Add (+)', icon: Plus },
                    { id: 'deduct', label: 'Deduct (-)', icon: Minus },
                    { id: 'set', label: 'Set Exact (=)', icon: SlidersHorizontal },
                  ].map(action => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setAdjustType(action.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                        adjustType === action.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantity Units</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Reason</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="Restock from supplier / PO receipt">Restock from supplier / PO receipt</option>
                  <option value="Physical stocktaking count adjustment">Physical stocktaking count adjustment</option>
                  <option value="Damaged display garment written off">Damaged display garment written off</option>
                  <option value="Customer return restocked into inventory">Customer return restocked into inventory</option>
                  <option value="Showroom promotion or mannequin sample">Showroom promotion or mannequin sample</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
