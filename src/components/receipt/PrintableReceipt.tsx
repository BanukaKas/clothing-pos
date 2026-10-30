import React from 'react';
import { Printer, X, Check, Download, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const PrintableReceipt: React.FC = () => {
  const { receiptModalSale, setReceiptModalSale, settings, setCurrentPage } = useApp();

  if (!receiptModalSale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    setReceiptModalSale(null);
    setCurrentPage('pos');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-thermal border border-slate-200 max-w-md w-full overflow-hidden animate-modal flex flex-col">
        {/* Modal Controls Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Sale Completed</h3>
              <p className="text-[11px] text-slate-400 font-mono">{receiptModalSale.receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={() => setReceiptModalSale(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 bg-slate-50 flex justify-center overflow-y-auto max-h-[65vh]">
          <div
            id="printable-receipt-area"
            className="bg-white p-6 shadow-sm border border-slate-200 rounded-xl w-full max-w-[340px] text-slate-900 text-xs font-mono select-none"
          >
            {/* Header */}
            <div className="text-center pb-3 dashed-line mb-3">
              <h2 className="text-base font-extrabold tracking-wider text-slate-950 font-display">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{settings.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
              {settings.taxNumber && (
                <p className="text-[10px] text-slate-500">VAT / TAX ID: {settings.taxNumber}</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="space-y-1 pb-3 dashed-line mb-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{receiptModalSale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formatDateTime(receiptModalSale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{receiptModalSale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{receiptModalSale.customerName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="pb-3 dashed-line mb-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptModalSale.items.map((item, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-1">
                        <div className="font-medium text-slate-900 truncate max-w-[140px]">{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.size} / {item.color}
                        </div>
                      </td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-right">{item.price.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-medium">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pb-3 dashed-line mb-3 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptModalSale.subtotal, settings.currency)}</span>
              </div>
              {receiptModalSale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(receiptModalSale.discount, settings.currency)}</span>
                </div>
              )}
              {receiptModalSale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({settings.taxRatePercent}%):</span>
                  <span>{formatCurrency(receiptModalSale.tax, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptModalSale.total, settings.currency)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 pb-3 dashed-line mb-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold uppercase">{receiptModalSale.paymentMethod.replace('_', ' ')}</span>
              </div>
              {receiptModalSale.paymentMethod === 'cash' && receiptModalSale.cashReceived !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tendered:</span>
                    <span>{formatCurrency(receiptModalSale.cashReceived, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change:</span>
                    <span>{formatCurrency(receiptModalSale.changeGiven || 0, settings.currency)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Simulated Barcode */}
            <div className="py-2 text-center">
              <div className="flex justify-center items-center space-x-[2px] h-9 mx-auto opacity-80">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-full bg-slate-900 inline-block ${
                      i % 4 === 0 ? 'w-[3px]' : i % 3 === 0 ? 'w-[1.5px]' : 'w-[1px]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] tracking-widest text-slate-500 mt-1">{receiptModalSale.receiptNumber}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 mt-2 whitespace-pre-line leading-relaxed">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between space-x-3">
          <button
            onClick={handleNewSale}
            className="flex-1 flex items-center justify-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
