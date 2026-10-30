import React, { useState } from 'react';
import { Plus, UserCheck, Shield, Mail, Power, Edit2, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserAccount } from '../types';

export const UsersPage: React.FC = () => {
  const { users, addUser, toggleUserStatus, currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserAccount['role']>('Senior Cashier');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;

    addUser({
      name,
      username,
      email: email || `${username}@mintfashion.lk`,
      role,
      status: 'active',
    });

    setIsModalOpen(false);
    setName('');
    setUsername('');
    setEmail('');
  };

  return (
    <div className="space-y-6 pb-12 animate-modal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Staff & Cashier Registers</h2>
          <p className="text-xs text-slate-500">
            {users.length} authorized store operators, managers and sales associates
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-3">Username</th>
                <th className="py-3.5 px-3">Role / Permissions</th>
                <th className="py-3.5 px-3">Email Address</th>
                <th className="py-3.5 px-3">Last Register Login</th>
                <th className="py-3.5 px-3">Account Status</th>
                <th className="py-3.5 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isCurrent = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">{u.username}</td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">{u.email}</td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{u.lastLogin}</td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">Create Staff Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!username) {
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '.')
                          .replace(/[^a-z0-9.]/g, '')
                      );
                    }
                  }}
                  placeholder="e.g. Ruwani Fonseka"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. ruwani.f"
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Permissions</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-[#f8faf8] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="Senior Cashier">Senior Cashier (POS, Returns, Cash drawer)</option>
                  <option value="Store Manager">Store Manager (Inventory, Discounts, Reports)</option>
                  <option value="Sales Associate">Sales Associate (POS Terminal only)</option>
                  <option value="Administrator">Administrator (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ruwani.f@mintfashion.lk"
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
