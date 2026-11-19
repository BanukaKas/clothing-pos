import React, { useState, useMemo } from 'react';
import { X, Printer, Settings2, Sliders, Layers, CheckCircle2, RefreshCw } from 'lucide-react';
import { BarcodeRenderer } from './BarcodeRenderer';
import { useApp } from '../../context/AppContext';

export interface BarcodePrintItem {
  id: string;
  productId: string;
  productName: string;
  variantInfo?: string;
  sku: string;
  barcode: string;
  price: number;
  quantity: number;
}

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodePrintItem[];
  onQuantityChange?: (id: string, newQty: number) => void;
}

export type LabelPreset = '40x30' | '50x25' | '60x40' | 'custom';

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
}) => {
  const { settings } = useApp();

  // Local editable quantities
  const [items, setItems] = useState<BarcodePrintItem[]>(initialItems);

  // Sync when initialItems changes
  React.useEffect(() => {
    setItems(initialItems.map(it => ({ ...it, quantity: it.quantity > 0 ? it.quantity : 1 })));
  }, [initialItems]);

  // Label Dimensions
  const [preset, setPreset] = useState<LabelPreset>('50x25');
  const [customWidthMm, setCustomWidthMm] = useState<number>(50);
  const [customHeightMm, setCustomHeightMm] = useState<number>(25);

  // Print Content Options
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showVariant, setShowVariant] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBarcodeGraphic, setShowBarcodeGraphic] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);

  // Batch quantity input
  const [bulkQty, setBulkQty] = useState<number>(1);

  const activeDimensions = useMemo(() => {
    switch (preset) {
      case '40x30':
        return { width: 40, height: 30, name: '40mm × 30mm (Compact Tag)' };
      case '50x25':
        return { width: 50, height: 25, name: '50mm × 25mm (Standard Retail)' };
      case '60x40':
        return { width: 60, height: 40, name: '60mm × 40mm (Apparel Hang Tag)' };
      case 'custom':
      default:
        return { width: customWidthMm, height: customHeightMm, name: `Custom (${customWidthMm}×${customHeightMm}mm)` };
    }
  }, [preset, customWidthMm, customHeightMm]);

  const handleUpdateItemQty = (id: string, qty: number) => {
    const val = Math.max(1, Math.min(999, qty || 1));
    setItems(prev => prev.map(item => (item.id === id ? { ...item, quantity: val } : item)));
  };

  const handleApplyBulkQty = () => {
    const val = Math.max(1, Math.min(999, bulkQty || 1));
    setItems(prev => prev.map(item => ({ ...item, quantity: val })));
  };

  const totalLabels = items.reduce((sum, it) => sum + it.quantity, 0);

  // Flatten items for printing based on quantity
  const flattenedLabels = useMemo(() => {
    const list: BarcodePrintItem[] = [];
    for (const it of items) {
      for (let i = 0; i < it.quantity; i++) {
        list.push(it);
      }
    }
    return list;
  }, [items]);

  const handleTriggerPrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-modal">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Thermal Barcode Label Studio</h3>
              <p className="text-xs text-slate-400">
                Configure dimensions, content fields, and print {totalLabels} scannable retail labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-slate-50/50 overflow-y-auto">
            {/* Label Size Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 mb-2.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Label Printer Dimensions</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '40x30', label: '40 × 30 mm', desc: 'Compact Garment' },
                  { id: '50x25', label: '50 × 25 mm', desc: 'Standard Retail' },
                  { id: '60x40', label: '60 × 40 mm', desc: 'Hang Tag Label' },
                  { id: 'custom', label: 'Custom Size', desc: 'User Specified' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreset(opt.id as LabelPreset)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preset === opt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {preset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width (mm)</label>
                    <input
                      type="number"
                      min={25}
                      max={120}
                      value={customWidthMm}
                      onChange={e => setCustomWidthMm(Number(e.target.value) || 50)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Height (mm)</label>
                    <input
                      type="number"
                      min={15}
                      max={150}
                      value={customHeightMm}
                      onChange={e => setCustomHeightMm(Number(e.target.value) || 25)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Toggles */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 mb-2.5">
                <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Included Label Elements</span>
              </label>
              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                {[
                  { label: 'Store Name (Header)', state: showStoreName, setter: setShowStoreName },
                  { label: 'Product Name', state: showProductName, setter: setShowProductName },
                  { label: 'Variant (Size & Color)', state: showVariant, setter: setShowVariant },
                  { label: 'SKU Code', state: showSku, setter: setShowSku },
                  { label: 'Selling Price', state: showPrice, setter: setShowPrice },
                  { label: 'Barcode Graphic (Code 128 / EAN)', state: showBarcodeGraphic, setter: setShowBarcodeGraphic },
                  { label: 'Barcode Digits (Human Readable)', state: showBarcodeText, setter: setShowBarcodeText },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={e => item.setter(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Print Quantity Control per Item */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Item Label Quantities ({items.length} items)</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={bulkQty}
                    onChange={e => setBulkQty(Number(e.target.value) || 1)}
                    className="w-12 text-center text-xs px-1 py-1 border border-slate-200 rounded"
                    title="Set quantity for all items"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkQty}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                  >
                    Apply All
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {items.map(it => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 truncate">{it.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {it.variantInfo ? `${it.variantInfo} • ` : ''}
                        {it.barcode}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-[10px] text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={it.quantity}
                        onChange={e => handleUpdateItemQty(it.id, Number(e.target.value))}
                        className="w-12 text-center text-xs font-bold px-1 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-7 p-6 flex flex-col bg-slate-100/60 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Label Preview</h4>
                <p className="text-[11px] text-slate-500">
                  Rendering at {activeDimensions.name} ({totalLabels} total labels to print)
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ready to Print
              </span>
            </div>

            {/* Scrollable label preview area */}
            <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-inner flex flex-wrap gap-4 items-start justify-center overflow-y-auto min-h-[360px] max-h-[500px]">
              {items.slice(0, 6).map(it => (
                <div
                  key={it.id}
                  style={{
                    width: `${Math.max(160, activeDimensions.width * 4.2)}px`,
                    minHeight: `${Math.max(100, activeDimensions.height * 4.2)}px`,
                  }}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col items-center justify-between text-center shadow-sm relative group hover:border-emerald-500 transition-colors"
                >
                  <div className="w-full">
                    {showStoreName && (
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-0.5 mb-1 truncate">
                        {settings.storeName || 'MINT FASHION'}
                      </div>
                    )}
                    {showProductName && (
                      <div className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2">
                        {it.productName}
                      </div>
                    )}
                    {showVariant && it.variantInfo && (
                      <div className="text-[9px] font-medium text-slate-600 mt-0.5 truncate">
                        {it.variantInfo}
                      </div>
                    )}
                    {showSku && (
                      <div className="text-[8px] font-mono text-slate-400 mt-0.5">
                        SKU: {it.sku}
                      </div>
                    )}
                  </div>

                  {/* Barcode graphic */}
                  <div className="my-1 w-full flex flex-col items-center justify-center">
                    {showBarcodeGraphic ? (
                      <BarcodeRenderer
                        value={it.barcode}
                        width={1.4}
                        height={Math.max(28, activeDimensions.height * 1.3)}
                        displayValue={showBarcodeText}
                        fontSize={10}
                        textMargin={1}
                        margin={2}
                      />
                    ) : (
                      showBarcodeText && (
                        <div className="font-mono text-xs font-bold tracking-widest text-slate-800 py-2">
                          {it.barcode}
                        </div>
                      )
                    )}
                  </div>

                  {/* Price */}
                  {showPrice && (
                    <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-between px-1">
                      <span className="text-[8px] text-slate-400 uppercase font-bold">MRP:</span>
                      <span className="text-xs font-black text-emerald-700 font-mono">
                        {settings.currencySymbol || 'LKR'}{' '}
                        {it.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Badge showing quantity to print */}
                  <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                    ×{it.quantity}
                  </div>
                </div>
              ))}

              {items.length > 6 && (
                <div className="w-full text-center py-2 text-xs text-slate-400 italic">
                  + {items.length - 6} more product label designs in batch...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-xs text-slate-500">
            Selected for print:{' '}
            <strong className="text-slate-900 font-bold">{totalLabels} total labels</strong> on{' '}
            <strong className="text-slate-900 font-bold">{activeDimensions.name}</strong>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={totalLabels === 0}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print {totalLabels} Labels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Thermal Printable Container with Exact Millimeter Page Dimensions */}
      <div id="thermal-barcode-print-container" className="hidden">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #thermal-barcode-print-container, #thermal-barcode-print-container * {
                visibility: visible;
              }
              #thermal-barcode-print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                display: block !important;
                background: white;
                margin: 0;
                padding: 0;
              }
              @page {
                size: ${activeDimensions.width}mm ${activeDimensions.height}mm;
                margin: 0mm;
              }
              .thermal-label-item {
                width: ${activeDimensions.width}mm;
                height: ${activeDimensions.height}mm;
                box-sizing: border-box;
                page-break-after: always;
                page-break-inside: avoid;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                padding: 1.5mm;
                text-align: center;
                overflow: hidden;
                font-family: Arial, sans-serif;
              }
            }
          `
        }} />

        {flattenedLabels.map((it, idx) => (
          <div key={`${it.id}-${idx}`} className="thermal-label-item">
            <div style={{ width: '100%', lineHeight: '1.1' }}>
              {showStoreName && (
                <div style={{ fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {settings.storeName || 'MINT FASHION'}
                </div>
              )}
              {showProductName && (
                <div style={{ fontSize: '8pt', fontWeight: 'bold', marginTop: '1px' }}>
                  {it.productName}
                </div>
              )}
              {showVariant && it.variantInfo && (
                <div style={{ fontSize: '6.5pt', color: '#333' }}>
                  {it.variantInfo}
                </div>
              )}
              {showSku && (
                <div style={{ fontSize: '6pt', color: '#555', fontFamily: 'monospace' }}>
                  SKU: {it.sku}
                </div>
              )}
            </div>

            <div style={{ margin: '1mm 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {showBarcodeGraphic ? (
                <BarcodeRenderer
                  value={it.barcode}
                  width={1.2}
                  height={Math.max(22, activeDimensions.height * 1.1)}
                  displayValue={showBarcodeText}
                  fontSize={8}
                  textMargin={1}
                  margin={1}
                />
              ) : (
                showBarcodeText && (
                  <div style={{ fontFamily: 'monospace', fontSize: '9pt', fontWeight: 'bold' }}>
                    {it.barcode}
                  </div>
                )
              )}
            </div>

            {showPrice && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', borderTop: '0.5px solid #ddd', paddingTop: '0.5mm' }}>
                <span style={{ fontSize: '6pt', textTransform: 'uppercase' }}>PRICE:</span>
                <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>
                  {settings.currencySymbol || 'LKR'} {it.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
