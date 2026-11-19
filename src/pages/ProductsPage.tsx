import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { generateCode128, generateEan13 } from '../utils/barcode';
import type { Product, ClothingSize } from '../types';

const allAvailableSizes: ClothingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];

export const ProductsPage: React.FC = () => {
  const { products, categories, addProduct, updateProduct, toggleProductStatus, settings, showToast } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const itemsPerPage = 8;

  // Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    barcode: string;
    category: string;
    brand: string;
    description: string;
    purchaseCost: number;
    sellingPrice: number;
    sizes: ClothingSize[];
    colors: { name: string; hex: string }[];
    reorderLevel: number;
    stock: number;
    image: string;
  }>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Shirts & Tops',
    brand: 'Mint Couture',
    description: '',
    purchaseCost: 3500,
    sellingPrice: 7900,
    sizes: ['S', 'M', 'L'],
    colors: [{ name: 'Pure White', hex: '#ffffff' }, { name: 'Deep Indigo', hex: '#1e3a8a' }],
    reorderLevel: 10,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  });

  // Filtered dataset
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery);

      const matchesCategory =
        selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();

      let matchesStatus = true;
      if (selectedStatus === 'in_stock') matchesStatus = product.stock > product.reorderLevel;
      if (selectedStatus === 'low_stock') matchesStatus = product.stock > 0 && product.stock <= product.reorderLevel;
      if (selectedStatus === 'out_of_stock') matchesStatus = product.stock <= 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const openAddModal = () => {
    setEditingProduct(null);
    const initialBarcode = generateCode128('MF');
    setFormData({
      name: '',
      sku: `MNT-CL-${Math.floor(100 + Math.random() * 900)}`,
      barcode: initialBarcode,
      category: categories[0]?.name || 'Shirts & Tops',
      brand: 'Mint Basics',
      description: '',
      purchaseCost: 3000,
      sellingPrice: 6500,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Navy Blue', hex: '#1e3a8a' },
        { name: 'Sand Cream', hex: '#e2d9cc' },
      ],
      reorderLevel: 10,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      brand: p.brand,
      description: p.description,
      purchaseCost: p.purchaseCost,
      sellingPrice: p.sellingPrice,
      sizes: p.sizes,
      colors: p.colors,
      reorderLevel: p.reorderLevel,
      stock: p.stock,
      image: p.image,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Validation Error', 'Product title is required.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        brand: formData.brand,
        description: formData.description,
        purchaseCost: formData.purchaseCost,
        sellingPrice: formData.sellingPrice,
        sizes: formData.sizes,
        colors: formData.colors,
        reorderLevel: formData.reorderLevel,
        stock: formData.stock,
        image: formData.image,
      });
    } else {
      // Generate variants for combinations of sizes and colors with unique barcodes
      const newVariants = formData.sizes.flatMap((s, sIdx) =>
        formData.colors.map((c, cIdx) => ({
          id: `var-new-${sIdx}-${cIdx}`,
          size: s,
          color: c.name,
          sku: `${formData.sku}-${s}-${c.name.substring(0, 3).toUpperCase()}`,
          barcode: `${formData.barcode}-${s}-${c.name.substring(0, 3).toUpperCase()}`,
          stock: Math.floor(formData.stock / (formData.sizes.length * formData.colors.length)) || 2,
        }))
      );

      addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        brand: formData.brand,
        description: formData.description,
        purchaseCost: formData.purchaseCost,
        sellingPrice: formData.sellingPrice,
        sizes: formData.sizes,
        colors: formData.colors,
        variants: newVariants,
        stock: formData.stock,
        reorderLevel: formData.reorderLevel,
        image: formData.image,
        status: 'active',
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Garment Product Catalog</h2>
          <p className="text-xs text-slate-500">
            {products.length} registered garments across {categories.length} retail categories
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPageNum(1);
            }}
            placeholder="Search garment name, SKU, brand, barcode..."
            className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPageNum(1);
            }}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value as any);
              setCurrentPageNum(1);
            }}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; Reorder)</option>
            <option value="low_stock">Low Stock (Critical)</option>
            <option value="out_of_stock">Out of Stock (Zero)</option>
          </select>
        </div>
      </div>

      {/* Product Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Garment</th>
                <th className="py-3.5 px-3">SKU / Barcode</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Available Sizes</th>
                <th className="py-3.5 px-3">Colors</th>
                <th className="py-3.5 px-3">Cost / Price</th>
                <th className="py-3.5 px-3">Stock Units</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No products found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(p => {
                  const marginPct = Math.round(
                    ((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 100
                  );
                  const isLow = p.stock <= p.reorderLevel && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-13 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {p.brand}
                            </span>
                            <div className="font-bold text-slate-900 truncate max-w-[200px]" title={p.name}>
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="font-bold text-slate-800">{p.sku}</div>
                        <div className="text-slate-400 text-[10px]">{p.barcode}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 font-semibold text-[11px] px-2.5 py-1 rounded-lg">
                          {p.category}
                        </span>
                      </td>

                      {/* Sizes */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[130px]">
                          {p.sizes.map(s => (
                            <span
                              key={s}
                              className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Colors */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1">
                          {p.colors.map(col => (
                            <span
                              key={col.name}
                              title={col.name}
                              className="w-3.5 h-3.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: col.hex }}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Cost / Price */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-700">
                          {formatCurrency(p.sellingPrice, settings.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {formatCurrency(p.purchaseCost, settings.currency)} ({marginPct}% margin)
                        </div>
                      </td>

                      {/* Stock Units */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`font-bold font-mono ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}
                          >
                            {p.stock}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded">
                              Low
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">units</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Reorder at {p.reorderLevel}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              p.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Garment Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Garment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeactivatingProduct(p)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.status === 'active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.status === 'active' ? 'Deactivate Garment' : 'Activate Garment'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(currentPageNum - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPageNum * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} garments
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
              disabled={currentPageNum === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-2xl w-full overflow-hidden animate-modal flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">
                  {editingProduct ? 'Edit Garment Details' : 'Add New Garment to Catalog'}
                </h3>
                <p className="text-xs text-slate-300">Fill in sizes, color variants, pricing and stock</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Signature Oxford Cotton Shirt"
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Mint Couture"
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Barcode</label>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct && !window.confirm('Regenerating barcode will change this garment tag. Continue?')) {
                            return;
                          }
                          setFormData({ ...formData, barcode: generateCode128('MF') });
                        }}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                        title="Generate unique Code 128 barcode"
                      >
                        + Code 128
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct && !window.confirm('Regenerating barcode will change this garment tag. Continue?')) {
                            return;
                          }
                          setFormData({ ...formData, barcode: generateEan13('200') });
                        }}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200"
                        title="Generate valid 13-digit EAN-13 barcode"
                      >
                        + EAN-13
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                    placeholder="e.g. MF84920193 or 2001234567890"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retail Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Image Thumbnail URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Purchase Cost ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchaseCost}
                    onChange={e => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Selling Price ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorderLevel}
                    onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Sizes Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Available Sizes (Multi-Select)</label>
                <div className="flex flex-wrap gap-1.5">
                  {allAvailableSizes.map(size => {
                    const selected = formData.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
                          } else {
                            setFormData({ ...formData, sizes: [...formData.sizes, size] });
                          }
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Garment Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Material specs, weave, wash instructions..."
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Thumbnail Image Live Preview */}
              {formData.image && (
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-14 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Thumbnail Preview</span>
                    <span className="text-[10px] text-slate-400">Loads with 1:1 or 4:3 clothing aspect ratio</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {editingProduct ? 'Save Changes' : 'Create Garment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT DETAILS MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-lg w-full overflow-hidden animate-modal flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={viewingProduct.image}
                  alt={viewingProduct.name}
                  className="w-16 h-20 rounded-2xl object-cover border border-slate-700 shadow-md"
                />
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                    {viewingProduct.brand}
                  </span>
                  <h3 className="text-base font-bold font-display mt-0.5">{viewingProduct.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">{viewingProduct.description}</p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Selling Price</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {formatCurrency(viewingProduct.sellingPrice, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Cost</span>
                  <span className="text-base font-extrabold text-slate-700">
                    {formatCurrency(viewingProduct.purchaseCost, settings.currency)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Variant Stock Breakdown:</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {viewingProduct.variants.map(v => (
                    <div
                      key={v.id}
                      className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {v.size}
                        </span>
                        <span className="text-slate-600">{v.color}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({v.sku})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{v.stock} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE / ACTIVATE CONFIRMATION DIALOG */}
      {deactivatingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-sm w-full p-6 text-center animate-modal">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
              deactivatingProduct.status === 'active' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              {deactivatingProduct.status === 'active' ? 'Deactivate Garment?' : 'Reactivate Garment?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {deactivatingProduct.status === 'active'
                ? `Deactivating "${deactivatingProduct.name}" hides it from the active POS terminal.`
                : `Activating "${deactivatingProduct.name}" makes it available again for sales checkout.`}
            </p>
            <div className="mt-5 flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeactivatingProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleProductStatus(deactivatingProduct.id);
                  setDeactivatingProduct(null);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                  deactivatingProduct.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
