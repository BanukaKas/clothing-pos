import React, { useState, useMemo } from 'react';
import {
  Barcode,
  Search,
  Filter,
  Printer,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  Download,
  Tag,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarcodeRenderer } from '../components/barcode/BarcodeRenderer';
import { BarcodePrintModal, type BarcodePrintItem } from '../components/barcode/BarcodePrintModal';
import { generateCode128, generateEan13, validateCode128, validateEan13 } from '../utils/barcode';
import type { ClothingSize } from '../types';

interface FlattenedBarcodeRow {
  rowId: string;
  productId: string;
  variantId?: string;
  isVariant: boolean;
  productName: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  size?: ClothingSize;
  color?: string;
  sellingPrice: number;
  stock: number;
}

export const BarcodeManagementPage: React.FC = () => {
  const { products, categories, updateProduct, showToast } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [barcodeFilter, setBarcodeFilter] = useState<'all' | 'has_barcode' | 'missing_barcode'>('all');

  // Multi-Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printItems, setPrintItems] = useState<BarcodePrintItem[]>([]);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<FlattenedBarcodeRow | null>(null);

  // Regeneration Confirmation Modal State
  const [regeneratingItem, setRegeneratingItem] = useState<FlattenedBarcodeRow | null>(null);
  const [regenFormat, setRegenFormat] = useState<'CODE128' | 'EAN13'>('CODE128');

  // Manual Edit State
  const [editingRow, setEditingRow] = useState<FlattenedBarcodeRow | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Flatten products and their variants into unified barcode list
  const allBarcodeRows: FlattenedBarcodeRow[] = useMemo(() => {
    const list: FlattenedBarcodeRow[] = [];

    for (const p of products) {
      // Main product entry
      list.push({
        rowId: `prod-${p.id}`,
        productId: p.id,
        isVariant: false,
        productName: p.name,
        category: p.category,
        brand: p.brand,
        sku: p.sku,
        barcode: p.barcode || '',
        sellingPrice: p.sellingPrice,
        stock: p.stock,
      });

      // Variant entries
      for (const v of p.variants || []) {
        list.push({
          rowId: `var-${v.id}`,
          productId: p.id,
          variantId: v.id,
          isVariant: true,
          productName: p.name,
          category: p.category,
          brand: p.brand,
          sku: v.sku,
          barcode: v.barcode || (p.barcode ? `${p.barcode}-${v.size}` : ''),
          size: v.size,
          color: v.color,
          sellingPrice: p.sellingPrice,
          stock: v.stock,
        });
      }
    }

    return list;
  }, [products]);

  // Extract unique sizes and colors for filter dropdowns
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    for (const p of products) {
      for (const v of p.variants || []) {
        if (v.size) sizes.add(v.size);
      }
    }
    return Array.from(sizes);
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    for (const p of products) {
      for (const v of p.variants || []) {
        if (v.color) colors.add(v.color);
      }
    }
    return Array.from(colors);
  }, [products]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return allBarcodeRows.filter(row => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        row.productName.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.barcode.toLowerCase().includes(q) ||
        row.brand.toLowerCase().includes(q);

      // Category
      const matchesCategory =
        selectedCategory === 'all' || row.category.toLowerCase() === selectedCategory.toLowerCase();

      // Size
      const matchesSize = selectedSize === 'all' || row.size === selectedSize;

      // Color
      const matchesColor = selectedColor === 'all' || row.color?.toLowerCase() === selectedColor.toLowerCase();

      // Barcode Status
      let matchesBarcode = true;
      if (barcodeFilter === 'has_barcode') matchesBarcode = !!row.barcode;
      if (barcodeFilter === 'missing_barcode') matchesBarcode = !row.barcode;

      return matchesSearch && matchesCategory && matchesSize && matchesColor && matchesBarcode;
    });
  }, [allBarcodeRows, searchQuery, selectedCategory, selectedSize, selectedColor, barcodeFilter]);

  // Selection Handlers
  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedRowIds.size === filteredRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredRows.map(r => r.rowId)));
    }
  };

  // Printing Handlers
  const handlePrintSingle = (row: FlattenedBarcodeRow) => {
    const printItem: BarcodePrintItem = {
      id: row.rowId,
      productId: row.productId,
      productName: row.productName,
      variantInfo: row.isVariant ? `Size ${row.size} / ${row.color}` : undefined,
      sku: row.sku,
      barcode: row.barcode,
      price: row.sellingPrice,
      quantity: 1,
    };
    setPrintItems([printItem]);
    setIsPrintModalOpen(true);
  };

  const handlePrintSelected = () => {
    const selected = filteredRows.filter(r => selectedRowIds.has(r.rowId));
    if (selected.length === 0) {
      showToast('warning', 'No Items Selected', 'Please select at least one garment barcode to print.');
      return;
    }

    const items: BarcodePrintItem[] = selected.map(row => ({
      id: row.rowId,
      productId: row.productId,
      productName: row.productName,
      variantInfo: row.isVariant ? `Size ${row.size} / ${row.color}` : undefined,
      sku: row.sku,
      barcode: row.barcode,
      price: row.sellingPrice,
      quantity: 1,
    }));

    setPrintItems(items);
    setIsPrintModalOpen(true);
  };

  // Regeneration Handler
  const handleConfirmRegenerate = async () => {
    if (!regeneratingItem) return;

    try {
      let newBarcode = '';
      if (window.electronAPI) {
        newBarcode = await window.electronAPI.regenerateBarcode(
          regeneratingItem.isVariant ? (regeneratingItem.variantId || '') : regeneratingItem.productId,
          regeneratingItem.isVariant ? 'variant' : 'product',
          regenFormat
        );
      } else {
        newBarcode = regenFormat === 'EAN13' ? generateEan13() : generateCode128();
        // Update local React state in browser preview mode
        const p = products.find(prod => prod.id === regeneratingItem.productId);
        if (p) {
          if (!regeneratingItem.isVariant) {
            updateProduct(p.id, { barcode: newBarcode });
          } else {
            const updatedVars = (p.variants || []).map(v =>
              v.id === regeneratingItem.variantId ? { ...v, barcode: newBarcode } : v
            );
            updateProduct(p.id, { variants: updatedVars });
          }
        }
      }

      showToast(
        'success',
        'Barcode Regenerated',
        `New ${regenFormat} barcode "${newBarcode}" assigned to ${regeneratingItem.sku}. Re-label physical garments.`
      );
      setRegeneratingItem(null);
    } catch (err: any) {
      showToast('error', 'Regeneration Failed', err.message || 'Could not regenerate barcode.');
    }
  };

  // Manual Edit Handlers
  const handleStartManualEdit = (row: FlattenedBarcodeRow) => {
    setEditingRow(row);
    setManualBarcode(row.barcode);
    setManualError(null);
  };

  const handleSaveManualBarcode = async () => {
    if (!editingRow) return;
    const clean = manualBarcode.trim();

    if (!clean) {
      setManualError('Barcode cannot be empty');
      return;
    }

    // Validate format
    const isEan = /^\d{13}$/.test(clean);
    if (isEan) {
      const eanVal = validateEan13(clean);
      if (!eanVal.valid) {
        setManualError(eanVal.reason || 'Invalid EAN-13 check digit');
        return;
      }
    } else {
      const c128Val = validateCode128(clean);
      if (!c128Val.valid) {
        setManualError(c128Val.reason || 'Invalid Code 128 characters');
        return;
      }
    }

    // Validate Uniqueness
    if (window.electronAPI) {
      const uniqueCheck = await window.electronAPI.checkBarcodeUnique(
        clean,
        editingRow.isVariant ? undefined : editingRow.productId,
        editingRow.isVariant ? editingRow.variantId : undefined
      );

      if (!uniqueCheck.isUnique) {
        setManualError(`Already in use by ${uniqueCheck.existingProduct || uniqueCheck.existingVariant}`);
        return;
      }

      // Persist to SQLite
      if (editingRow.isVariant && editingRow.variantId) {
        await window.electronAPI.updateVariantBarcode(editingRow.variantId, clean);
      } else {
        await window.electronAPI.updateProduct(editingRow.productId, { barcode: clean });
      }
    } else {
      // Browser fallback
      const p = products.find(prod => prod.id === editingRow.productId);
      if (p) {
        if (!editingRow.isVariant) {
          updateProduct(p.id, { barcode: clean });
        } else {
          const updatedVars = (p.variants || []).map(v =>
            v.id === editingRow.variantId ? { ...v, barcode: clean } : v
          );
          updateProduct(p.id, { variants: updatedVars });
        }
      }
    }

    showToast('success', 'Barcode Updated', `Updated barcode for ${editingRow.sku} to "${clean}"`);
    setEditingRow(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Product Name', 'Variant Info', 'Category', 'SKU', 'Barcode', 'Price', 'Stock'];
    const rows = filteredRows.map(r => [
      `"${r.productName.replace(/"/g, '""')}"`,
      r.isVariant ? `"${r.size} / ${r.color}"` : '""',
      `"${r.category}"`,
      `"${r.sku}"`,
      `"${r.barcode}"`,
      r.sellingPrice,
      r.stock,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MINT-FASHION-Barcodes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', `Exported ${filteredRows.length} barcode records.`);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 font-display">Barcode Management & Label Studio</h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Code 128 & EAN-13
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scannable retail barcodes, variant-level codes, and batch print thermal labels
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintSelected}
            disabled={selectedRowIds.size === 0}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Selected ({selectedRowIds.size})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU, or barcode..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Garment Sizes</option>
              {availableSizes.map(s => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <select
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Colors</option>
              {availableColors.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Barcode Status Filter */}
          <div>
            <select
              value={barcodeFilter}
              onChange={e => setBarcodeFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Barcodes</option>
              <option value="has_barcode">Has Barcode</option>
              <option value="missing_barcode">Missing Barcode</option>
            </select>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={selectAllFiltered}
              className="flex items-center space-x-1.5 font-bold text-slate-700 hover:text-emerald-600"
            >
              {selectedRowIds.size > 0 && selectedRowIds.size === filteredRows.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedRowIds.size === filteredRows.length && filteredRows.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>
            <span>•</span>
            <span>
              Showing <strong className="text-slate-900 font-bold">{filteredRows.length}</strong> barcode entries
            </span>
          </div>

          {selectedRowIds.size > 0 && (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {selectedRowIds.size} garments selected for batch printing
            </span>
          )}
        </div>
      </div>

      {/* Barcode Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.size > 0 && selectedRowIds.size === filteredRows.length}
                    onChange={selectAllFiltered}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Garment / Item</th>
                <th className="py-3 px-4">Variant Info</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 min-w-[200px]">Scannable Barcode</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.map(row => {
                const isSelected = selectedRowIds.has(row.rowId);
                const isEditingThis = editingRow?.rowId === row.rowId;

                return (
                  <tr
                    key={row.rowId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/40' : ''
                    } ${row.isVariant ? 'bg-slate-50/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.rowId)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Garment Title */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-tight">{row.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {row.brand} • {row.category}
                      </div>
                    </td>

                    {/* Variant Info */}
                    <td className="py-3 px-4">
                      {row.isVariant ? (
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800 text-[11px]">{row.size}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 text-[11px]">{row.color}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">Base Product</span>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 font-mono text-slate-700 font-semibold text-[11px]">
                      {row.sku}
                    </td>

                    {/* Scannable Barcode Graphic & Number */}
                    <td className="py-3 px-4">
                      {isEditingThis ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={manualBarcode}
                              onChange={e => {
                                setManualBarcode(e.target.value);
                                setManualError(null);
                              }}
                              className="w-36 text-xs font-mono px-2 py-1 border border-emerald-500 rounded focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveManualBarcode}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRow(null)}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {manualError && (
                            <div className="text-[10px] text-red-500 font-semibold">{manualError}</div>
                          )}
                        </div>
                      ) : row.barcode ? (
                        <div
                          className="cursor-pointer group flex items-center space-x-2"
                          onClick={() => setPreviewItem(row)}
                          title="Click to preview large label"
                        >
                          <BarcodeRenderer
                            value={row.barcode}
                            width={1.1}
                            height={28}
                            displayValue={true}
                            fontSize={9}
                            margin={0}
                            className="bg-white p-1 rounded border border-slate-200/80 group-hover:border-emerald-500 transition-colors shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-amber-600 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>No Barcode</span>
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      LKR {row.sellingPrice.toLocaleString()}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 font-mono text-xs">
                      <span
                        className={`font-bold ${
                          row.stock > 10 ? 'text-emerald-700' : row.stock > 0 ? 'text-amber-600' : 'text-red-600'
                        }`}
                      >
                        {row.stock}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewItem(row)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Preview Barcode Label"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Regenerate with confirmation */}
                        <button
                          onClick={() => {
                            setRegeneratingItem(row);
                            setRegenFormat(row.barcode.length === 13 ? 'EAN13' : 'CODE128');
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Regenerate Barcode (Requires Confirmation)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Manual Edit */}
                        <button
                          onClick={() => handleStartManualEdit(row)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Barcode Value"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Single Label */}
                        <button
                          onClick={() => handlePrintSingle(row)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Print Barcode Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Barcode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No garments match the current filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Large Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Garment Label Preview</h4>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center space-y-3">
              <div className="font-display font-extrabold text-sm text-slate-900">{previewItem.productName}</div>
              {previewItem.isVariant && (
                <div className="text-xs font-medium text-slate-600">
                  Size: <strong className="text-slate-900">{previewItem.size}</strong> • Color:{' '}
                  <strong className="text-slate-900">{previewItem.color}</strong>
                </div>
              )}
              <div className="text-[11px] font-mono text-slate-500">SKU: {previewItem.sku}</div>

              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 my-2">
                <BarcodeRenderer
                  value={previewItem.barcode}
                  width={1.6}
                  height={55}
                  displayValue={true}
                  fontSize={12}
                  margin={4}
                />
              </div>

              <div className="text-base font-extrabold text-emerald-700 font-mono">
                LKR {previewItem.sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintSingle(previewItem);
                  setPreviewItem(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print This Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Regeneration Confirmation Modal */}
      {regeneratingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display">Confirm Barcode Regeneration</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Regenerating this barcode will permanently invalidate the previous barcode value (
                  <strong className="font-mono text-slate-700">{regeneratingItem.barcode}</strong>).
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 mb-4">
              <div className="font-bold">Important Notice:</div>
              <p>
                Any garments currently tagged with the old barcode will no longer scan at POS checkout until new
                labels are printed and attached.
              </p>
            </div>

            {/* Format Selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Choose Barcode Symbology</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegenFormat('CODE128')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left ${
                    regenFormat === 'CODE128'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Code 128 (Recommended)
                  <div className="text-[10px] font-normal text-slate-500">Universal Alphanumeric</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegenFormat('EAN13')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left ${
                    regenFormat === 'EAN13'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  EAN-13 (13 Digits)
                  <div className="text-[10px] font-normal text-slate-500">With Modulo-10 Check Digit</div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRegeneratingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRegenerate}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Thermal Print Studio Modal */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={printItems}
      />
    </div>
  );
};
