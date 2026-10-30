import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Store,
  Receipt,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { StoreSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();
  const [formData, setFormData] = useState<StoreSettings>(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal max-w-4xl">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 font-display">Store & POS Settings</h2>
        <p className="text-xs text-slate-500">
          Configure thermal printer layout, currency formatting, tax rates and store headers
        </p>
      </div>

      {/* Notice Callout for Electron & SQLite phase */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-950">Frontend Prototype Phase Active</h4>
          <p className="text-emerald-800/90 leading-relaxed mt-0.5">
            Settings and mock retail data are persisted directly to browser localStorage. In the next phase, these settings and transactions will sync directly to a local offline SQLite database wrapped inside an Electron desktop app container.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Store Profile Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Retail Store Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Slogan / Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Phone Hotline</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Care Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Store Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Currency & Tax Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Currency Code</label>
              <input
                type="text"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                placeholder="LKR"
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: LKR (Sri Lankan Rupee)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tax / VAT Registration Number</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="VAT-102938475-7000"
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2 sm:col-span-2">
              <input
                type="checkbox"
                id="enableTaxCheck"
                checked={formData.enableTax}
                onChange={e => setFormData({ ...formData, enableTax: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="enableTaxCheck" className="font-bold text-slate-800 cursor-pointer">
                Enable Automated Sales Tax / VAT at Checkout
              </label>
            </div>

            {formData.enableTax && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Rate Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.taxRatePercent}
                    onChange={e => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thermal Receipt Layout */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Thermal Receipt Design</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt Paper Roll Width</label>
              <div className="flex items-center space-x-3">
                {[
                  { id: '80mm', label: '80mm (Standard POS Thermal Printer)' },
                  { id: '58mm', label: '58mm (Compact Mobile Thermal Printer)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, receiptWidth: opt.id as any })}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      formData.receiptWidth === opt.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt Footer Return Policy / Message</label>
              <textarea
                rows={3}
                value={formData.receiptFooter}
                onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This notice prints at the bottom of every customer cash receipt.
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
