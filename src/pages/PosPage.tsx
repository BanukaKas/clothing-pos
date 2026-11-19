import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Building,
  Layers,
  ArrowRight,
  RotateCcw,
  Tag,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import type { Product, ClothingSize, PaymentMethod } from '../types';

export const PosPage: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartDiscount,
    setCartDiscount,
    checkout,
    settings,
    customers,
    showToast,
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected item variant state for product cards: map of productId -> { size, color }
  const [cardVariantSelection, setCardVariantSelection] = useState<
    Record<string, { size: ClothingSize; color: string }>
  >({});

  // Checkout modal & payment state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery);

      const matchesCategory =
        selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle barcode scanner input simulation (supports product & variant barcodes)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const cleanCode = barcodeInput.trim();

    // 1. First check if barcode matches a specific product variant
    let matchedVariantProduct: Product | undefined;
    let matchedVariantSize: ClothingSize | undefined;
    let matchedVariantColor: string | undefined;

    for (const p of products) {
      for (const v of p.variants || []) {
        if (
          (v.barcode && v.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
          v.sku.toLowerCase() === cleanCode.toLowerCase()
        ) {
          matchedVariantProduct = p;
          matchedVariantSize = v.size;
          matchedVariantColor = v.color;
          break;
        }
      }
      if (matchedVariantProduct) break;
    }

    if (matchedVariantProduct && matchedVariantSize && matchedVariantColor) {
      addToCart(matchedVariantProduct, matchedVariantSize, matchedVariantColor, 1);
      setBarcodeInput('');
      showToast(
        'success',
        'Garment Scanned',
        `Added ${matchedVariantProduct.name} (${matchedVariantSize} / ${matchedVariantColor}) to cart.`
      );
      return;
    }

    // 2. Otherwise check base product barcode or SKU
    const matched = products.find(
      p => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched) {
      const defaultSize = matched.sizes[0] || 'M';
      const defaultColor = matched.colors[0]?.name || 'Standard';
      addToCart(matched, defaultSize, defaultColor, 1);
      setBarcodeInput('');
      showToast('success', 'Garment Scanned', `Added ${matched.name} to cart.`);
    } else {
      showToast('error', 'Barcode Not Found', `No garment found matching barcode: ${cleanCode}`);
    }
  };

  // Helper to get currently selected variant on a card
  const getCardSelection = (product: Product) => {
    if (cardVariantSelection[product.id]) {
      return cardVariantSelection[product.id];
    }
    return {
      size: product.sizes[0] || 'M',
      color: product.colors[0]?.name || 'Standard',
    };
  };

  const handleSelectSize = (productId: string, size: ClothingSize) => {
    setCardVariantSelection(prev => ({
      ...prev,
      [productId]: {
        ...getCardSelection(products.find(p => p.id === productId)!),
        size,
      },
    }));
  };

  const handleSelectColor = (productId: string, color: string) => {
    setCardVariantSelection(prev => ({
      ...prev,
      [productId]: {
        ...getCardSelection(products.find(p => p.id === productId)!),
        color,
      },
    }));
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.min(cartDiscount, subtotal);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = settings.enableTax ? Math.round(taxableSubtotal * (settings.taxRatePercent / 100)) : 0;
  const totalPayable = taxableSubtotal + tax;

  // Change calculation
  const changeDue = Math.max(0, (cashReceived || 0) - totalPayable);

  // Quick cash tender helpers
  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      showToast('error', 'Empty Cart', 'Add at least one item before checkout.');
      return;
    }
    setCashReceived(totalPayable);
    setIsCheckoutModalOpen(true);
  };

  const handleCompleteSale = async () => {
    const sale = await checkout({
      customerName: selectedCustomer,
      customerPhone,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceived : totalPayable,
      notes: checkoutNotes,
    });

    if (sale) {
      setIsCheckoutModalOpen(false);
      setCashReceived(0);
      setCheckoutNotes('');
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-6.5rem)] pb-4 animate-modal">
      {/* LEFT SECTION: Products & Barcode Grid (7 cols on lg, 8 on xl) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search, Barcode & Category Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by garment name, SKU or brand..."
                className="w-full bg-white border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="sm:col-span-5 relative flex">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan / Type Barcode..."
                className="w-full bg-white border border-slate-200 text-xs text-slate-900 pl-9 pr-14 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm font-mono"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2.5 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Scan</span>
              </button>
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-slate-900/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-emerald-900/10'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-3 stroke-[1.2] text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No clothing items match your search</p>
              <p className="text-xs text-slate-400 mt-1">Try another keyword or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const currentSelection = getCardSelection(product);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.reorderLevel;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group card-hover-border relative"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Stock Badge */}
                      <div className="absolute top-2 left-2">
                        {isOutOfStock ? (
                          <span className="bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            {product.stock} Left
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            {product.stock} in stock
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {product.sku}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                        {product.brand}
                      </p>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5" title={product.name}>
                        {product.name}
                      </h4>

                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-sm font-extrabold text-emerald-700 font-display">
                          {formatCurrency(product.sellingPrice, settings.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                      </div>

                      {/* Size Selector */}
                      <div className="mt-2.5">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">Size:</span>
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map(size => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSelectSize(product.id, size)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                                currentSelection.size === size
                                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Selector */}
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Color: <span className="font-normal text-slate-700">{currentSelection.color}</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {product.colors.map(col => (
                            <button
                              key={col.name}
                              type="button"
                              onClick={() => handleSelectColor(product.id, col.name)}
                              title={col.name}
                              className={`w-4 h-4 rounded-full border transition-all ${
                                currentSelection.color === col.name
                                  ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110'
                                  : 'border-slate-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: col.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() =>
                          addToCart(product, currentSelection.size, currentSelection.color, 1)
                        }
                        disabled={isOutOfStock}
                        className={`mt-3.5 w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/10'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Interactive Cart & Checkout Panel (5 cols on lg, 4 on xl) */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Order</h3>
              <p className="text-[11px] text-slate-400">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} garments selected
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              title="Clear all cart items"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Customer Quick Selector */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedCustomer}
              onChange={e => {
                setSelectedCustomer(e.target.value);
                const cust = customers.find(c => c.name === e.target.value);
                if (cust) setCustomerPhone(cust.phone);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="Walk-in Customer">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
            Cashier: Register #1
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">
                Select sizes & colors from the product catalog or scan a barcode to add.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-3 hover:border-slate-300 transition-colors"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                      {item.size}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.color}</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    {formatCurrency(item.price * item.quantity, settings.currency)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end space-y-1 shrink-0">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-900 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Trigger */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          {/* Discount input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Discount ({settings.currency}):</span>
            </span>
            <input
              type="number"
              min="0"
              value={cartDiscount || ''}
              onChange={e => setCartDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-24 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Subtotal, Tax, and Final Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(subtotal, settings.currency)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(discountAmount, settings.currency)}</span>
              </div>
            )}
            {settings.enableTax && (
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax ({settings.taxRatePercent}%):</span>
                <span>{formatCurrency(tax, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total Payable:</span>
              <span className="text-xl font-extrabold text-emerald-700 font-display">
                {formatCurrency(totalPayable, settings.currency)}
              </span>
            </div>
          </div>

          {/* Complete Sale Action Button */}
          <button
            onClick={openCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20'
            }`}
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHECKOUT CONFIRMATION & PAYMENT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-lg w-full overflow-hidden animate-modal flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">Confirm & Complete Sale</h3>
                <p className="text-xs text-slate-300">Select payment tender and finalize receipt</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Grand Total Summary Display */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-800">
                  Total Amount Due
                </span>
                <div className="text-3xl font-extrabold text-emerald-800 mt-1 font-display">
                  {formatCurrency(totalPayable, settings.currency)}
                </div>
                <p className="text-xs text-emerald-700/80 mt-1">
                  {cart.reduce((s, i) => s + i.quantity, 0)} garments • Customer: {selectedCustomer}
                </p>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'bank_transfer', label: 'Bank', icon: Building },
                    { id: 'split', label: 'Split', icon: Layers },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tender Calculation (Only for Cash payment) */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Cash Received ({settings.currency}):</label>
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(Number(e.target.value))}
                      className="w-36 text-right bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  {/* Quick cash tender pill buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Exact', val: totalPayable },
                      { label: '+1,000', val: Math.ceil(totalPayable / 1000) * 1000 },
                      { label: '+2,000', val: Math.ceil(totalPayable / 1000) * 1000 + 1000 },
                      { label: '+5,000', val: Math.ceil(totalPayable / 5000) * 5000 },
                    ].map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickCash(btn.val)}
                        className="text-[11px] font-bold bg-white border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change returned indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="font-semibold text-slate-600">Change Due to Customer:</span>
                    <span className={`font-mono text-sm font-extrabold ${
                      cashReceived >= totalPayable ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {cashReceived >= totalPayable
                        ? formatCurrency(changeDue, settings.currency)
                        : `Short by ${formatCurrency(totalPayable - cashReceived, settings.currency)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Phone & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer Contact Phone (for SMS e-Receipt):
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full bg-white border border-slate-200 text-xs text-slate-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Order Notes (Optional):</label>
                  <input
                    type="text"
                    value={checkoutNotes}
                    onChange={e => setCheckoutNotes(e.target.value)}
                    placeholder="e.g. Gift wrapped, VIP loyalty discount applied"
                    className="w-full bg-white border border-slate-200 text-xs text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={paymentMethod === 'cash' && cashReceived < totalPayable}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 ${
                  paymentMethod === 'cash' && cashReceived < totalPayable
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Sale & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
