import React, { useState, useMemo } from 'react';
import { Plus, Search, Receipt, DollarSign, Calendar, Tag, CreditCard, Building, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Expense } from '../types';

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, currentUser, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [category, setCategory] = useState<Expense['category']>('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(15000);
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('bank_transfer');
  const [reference, setReference] = useState('');

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch =
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.reference && e.reference.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    addExpense({
      category,
      description,
      amount,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser.name,
      reference: reference || `EXP-${Math.floor(100 + Math.random() * 900)}`,
    });

    setIsModalOpen(false);
    setDescription('');
    setAmount(15000);
    setReference('');
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Store Operating Expenses</h2>
          <p className="text-xs text-slate-500">
            Log overhead costs, monthly store lease, utilities and promotional campaigns
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Overhead</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(totalExpense, settings.currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{expenses.length} operating vouchers logged</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store Lease & Rent</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(
                expenses.filter(e => e.category === 'Rent').reduce((s, e) => s + e.amount, 0),
                settings.currency
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Flagship boutique premises</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Packaging & Bags</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(
                expenses.filter(e => e.category === 'Packaging').reduce((s, e) => s + e.amount, 0),
                settings.currency
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Branded bags & garment covers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marketing & Displays</span>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {formatCurrency(
                expenses.filter(e => e.category === 'Marketing').reduce((s, e) => s + e.amount, 0),
                settings.currency
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Social ads & window styling</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search description, voucher reference..."
            className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
        >
          <option value="all">All Expense Categories</option>
          <option value="Rent">Rent</option>
          <option value="Utilities">Utilities</option>
          <option value="Packaging">Packaging</option>
          <option value="Marketing">Marketing</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Salaries">Salaries</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-3">Expense Category</th>
                <th className="py-3.5 px-3">Description</th>
                <th className="py-3.5 px-3">Voucher Ref</th>
                <th className="py-3.5 px-3">Payment Method</th>
                <th className="py-3.5 px-3">Amount</th>
                <th className="py-3.5 px-4 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{formatDate(exp.date)}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{exp.description}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{exp.reference || '—'}</td>
                  <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-500">
                    {exp.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(exp.amount, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-semibold">{exp.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">Record Operating Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                  <option value="Rent">Rent & Boutique Lease</option>
                  <option value="Packaging">Packaging (Bags, Ribbons, Tags)</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Store Cleaning & Maintenance</option>
                  <option value="Salaries">Staff Salaries & Overtime</option>
                  <option value="Other">Other Miscellaneous Cost</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. October CEB Electricity Bill"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ({settings.currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Store Petty Cash</option>
                    <option value="card">Company Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice / Receipt Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. CEB-BILL-10-26"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                />
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
