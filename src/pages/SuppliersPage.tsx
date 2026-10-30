import React, { useState, useMemo } from 'react';
import { Plus, Search, Truck, Phone, Mail, MapPin, Building, Edit2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [categoriesSupplied, setCategoriesSupplied] = useState<string[]>(['Shirts & Tops']);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suppliers, searchQuery]);

  const openAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPaymentTerms('Net 30 Days');
    setCategoriesSupplied(['Shirts & Tops']);
    setIsModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setPaymentTerms(s.paymentTerms);
    setCategoriesSupplied(s.categoriesSupplied);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
        paymentTerms,
        categoriesSupplied,
      });
    } else {
      addSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        paymentTerms,
        categoriesSupplied,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Garment Mills & Suppliers</h2>
          <p className="text-xs text-slate-500">
            {suppliers.length} authorized manufacturing partners and textile vendors
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, representative, email..."
            className="w-full bg-[#f8faf8] border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Supplier Firm</th>
                <th className="py-3.5 px-3">Contact Person</th>
                <th className="py-3.5 px-3">Phone</th>
                <th className="py-3.5 px-3">Email</th>
                <th className="py-3.5 px-3">Categories Supplied</th>
                <th className="py-3.5 px-3">Payment Terms</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{sup.name}</div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                          {sup.address}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-800">{sup.contactPerson}</td>

                  <td className="py-3 px-3 font-mono text-slate-700">{sup.phone}</td>

                  <td className="py-3 px-3 text-slate-600">{sup.email}</td>

                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {sup.categoriesSupplied.map(cat => (
                        <span
                          key={cat}
                          className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-700">{sup.paymentTerms}</td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEdit(sup)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">
                {editingSupplier ? 'Edit Supplier' : 'Add New Garment Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Mill Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kobe Denim Works Ltd"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Representative Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. Kenji Takahashi"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+94 11 200 0000"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sales@mill.com"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Factory / Office Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Export Zone, City, Country"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
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
                  {editingSupplier ? 'Save Changes' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
