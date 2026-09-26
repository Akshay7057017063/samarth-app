import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, ShieldCheck, AlertCircle, CheckCircle2, 
  Edit3, ShoppingBag, Wallet, Eye, UserX, UserCheck, X, Save, 
  ArrowLeft, ArrowRight, IndianRupee, Layers, Calendar, Check, Download
} from 'lucide-react';

export default function ManageUsers() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewTab, setViewTab] = useState('customers'); // 'customers' | 'sales'
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Modals state
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [walletModal, setWalletModal] = useState({ open: false, user: null, amount: '', type: 'credit', reason: '' });
  const [sellModal, setSellModal] = useState({ open: false, user: null, packageName: 'Bio-Magnetic Healthcare Single Mat', pv: 20, amount: 3600, paymentMode: 'UPI / Bank Transfer', legPosition: 'left' });

  const loadData = () => {
    if (token) {
      const url = `/api/admin/users?userType=${filterType}&search=${encodeURIComponent(search.trim())}`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.success) setUsers(data.users); })
        .catch(console.error);

      fetch('/api/admin/sales', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.success) setSales(data.sales); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [token, filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // 1-Click Login As Customer (Impersonation)
  const handleImpersonate = async (targetUser) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('samarth_token', data.token);
        window.location.href = '/dashboard';
      } else {
        setFeedback({ text: data.message || 'Failed to login as customer.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Impersonation failed.', type: 'error' });
    }
  };

  // Save Master Customer Edit
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${editModal.data._id}/update-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editModal.data)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setEditModal({ open: false, data: null });
        loadData();
      } else {
        setFeedback({ text: data.message || 'Update failed.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error saving customer details.', type: 'error' });
    }
  };

  // Adjust Customer Wallet
  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${walletModal.user._id}/adjust-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: walletModal.amount,
          type: walletModal.type,
          reason: walletModal.reason
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setWalletModal({ open: false, user: null, amount: '', type: 'credit', reason: '' });
        loadData();
      } else {
        setFeedback({ text: data.message || 'Wallet adjustment failed.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Error adjusting wallet.', type: 'error' });
    }
  };

  // Sell Package to Customer
  const handleSellPackage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${sellModal.user._id}/sell-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sellModal)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setSellModal({ open: false, user: null, packageName: 'Bio-Magnetic Healthcare Single Mat', pv: 20, amount: 3600, paymentMode: 'UPI / Bank Transfer', legPosition: 'left' });
        loadData();
      } else {
        setFeedback({ text: data.message || 'Failed to sell package.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Error assigning package.', type: 'error' });
    }
  };

  // Toggle user status
  const toggleStatus = async (user) => {
    try {
      const res = await fetch(`/api/admin/users/${user._id}/toggle-status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        loadData();
      }
    } catch (err) {
      setFeedback({ text: 'Failed to toggle status.', type: 'error' });
    }
  };

  // Export Users CSV
  const exportUsersCsv = () => {
    if (users.length === 0) return;
    const headers = ["User Code", "Name", "Phone", "Email", "Sponsor Code", "User Type", "Left PV", "Right PV", "Left Business", "Right Business", "Total Income", "PAN Card", "Status"];
    const rows = users.map(u => [
      `"${u.userCode || u.memberId}"`,
      `"${u.name}"`,
      `"${u.phone}"`,
      `"${u.email}"`,
      `"${u.sponsorCode}"`,
      `"${u.userType}"`,
      u.leftPv || 0,
      u.rightPv || 0,
      u.leftBusiness || 0,
      u.rightBusiness || 0,
      u.totalIncome || 0,
      `"${u.panNumber || 'N/A'}"`,
      `"${u.status}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Samarth_Customers_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSalesRevenue = sales.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Super Admin Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Administrator Master Command Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Customer Master Data & Sales Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Edit any customer's binary PV, leg business, and wallet balance, sell packages, or login directly into their store dashboard.
          </p>
        </div>

        <button
          onClick={exportUsersCsv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export All Customers (CSV)</span>
        </button>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Members</div>
          <div className="text-2xl font-black text-white mt-1">{users.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">PAID Users</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{users.filter(u => u.userType === 'PAID').length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">UNPAID Users</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{users.filter(u => u.userType !== 'PAID').length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Status</div>
          <div className="text-2xl font-black text-teal-400 mt-1">{users.filter(u => u.status === 'active').length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Sales Count</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{sales.length} Orders</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Package Revenue</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalSalesRevenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950/70 border border-red-500/40 text-red-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Tabs (Customers List vs All Product Sales) */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setViewTab('customers')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            viewTab === 'customers' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory & Data Editor ({users.length})</span>
        </button>

        <button
          onClick={() => setViewTab('sales')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            viewTab === 'sales' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Product Sales & Orders ({sales.length})</span>
        </button>
      </div>

      {viewTab === 'customers' && (
        <>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
              {['all', 'PAID', 'UNPAID'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === t ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search User Code, Name, Phone, Sponsor..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Customers Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800/80">
                    <th className="pb-3">User Code</th>
                    <th className="pb-3">Customer Name</th>
                    <th className="pb-3">Sponsor</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Left / Right PV</th>
                    <th className="pb-3">Business (₹)</th>
                    <th className="pb-3">Total Income</th>
                    <th className="pb-3 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-bold text-emerald-400">{u.userCode || u.memberId}</td>
                      <td className="py-3 font-sans">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>
                      </td>
                      <td className="py-3 text-teal-300 font-bold">{u.sponsorCode || u.sponsorMemberId}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.userType === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {u.userType || 'UNPAID'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        L: <strong className="text-teal-400">{u.leftPv ?? 0}</strong> | R: <strong className="text-cyan-400">{u.rightPv ?? 0}</strong>
                      </td>
                      <td className="py-3 text-slate-300">
                        ₹{(u.leftBusiness || 0) + (u.rightBusiness || 0)}
                      </td>
                      <td className="py-3 text-emerald-400 font-bold font-mono">
                        ₹{u.totalIncome || 0}
                      </td>
                      <td className="py-3 font-sans text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1-Click Login As Customer */}
                          <button
                            onClick={() => handleImpersonate(u)}
                            title="Open / Login as this Customer"
                            className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Store</span>
                          </button>

                          {/* Sell Package */}
                          <button
                            onClick={() => setSellModal({ open: true, user: u, packageName: 'Bio-Magnetic Healthcare Single Mat (20 PV)', pv: 20, amount: 3600, paymentMode: 'UPI / Bank Transfer', legPosition: 'left' })}
                            title="Sell Package to Customer"
                            className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Sell</span>
                          </button>

                          {/* Adjust Wallet */}
                          <button
                            onClick={() => setWalletModal({ open: true, user: u, amount: '500', type: 'credit', reason: 'Performance Incentive' })}
                            title="Credit / Debit Wallet"
                            className="p-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Wallet</span>
                          </button>

                          {/* Master Edit Customer Data */}
                          <button
                            onClick={() => setEditModal({ open: true, data: { ...u } })}
                            title="Edit All Information"
                            className="p-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit All</span>
                          </button>

                          {/* Suspend / Activate */}
                          <button
                            onClick={() => toggleStatus(u)}
                            title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                              u.status === 'active' ? 'text-red-400 hover:bg-red-950/60' : 'text-emerald-400 hover:bg-emerald-950/60'
                            }`}
                          >
                            {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewTab === 'sales' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-base font-bold text-white">
              Customer Package Sales & Invoices ({sales.length})
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              Total Sales: ₹{totalSalesRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-3">Invoice Date</th>
                  <th className="pb-3">User Code</th>
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">Package Sold</th>
                  <th className="pb-3">Point Value (PV)</th>
                  <th className="pb-3">Amount (₹)</th>
                  <th className="pb-3">Payment Mode</th>
                  <th className="pb-3">Dispatch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 text-slate-400 font-sans">{s.invoiceDate}</td>
                    <td className="py-3 font-bold text-emerald-400">{s.userCode}</td>
                    <td className="py-3 font-sans font-bold text-white">{s.customerName}</td>
                    <td className="py-3 font-sans text-slate-300 max-w-xs truncate">{s.packageName}</td>
                    <td className="py-3 font-bold text-teal-400">{s.pv} PV</td>
                    <td className="py-3 font-bold text-white">₹{s.amount}</td>
                    <td className="py-3 font-sans text-slate-400">{s.paymentMode}</td>
                    <td className="py-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {s.dispatchStatus || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: MASTER CUSTOMER DATA EDITOR */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Super Admin Master Editor</span>
                <h3 className="text-xl font-bold text-white">
                  Edit All Data for: {editModal.data.name} ({editModal.data.userCode || editModal.data.memberId})
                </h3>
              </div>
              <button onClick={() => setEditModal({ open: false, data: null })} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
              
              {/* Profile Block */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase">Profile & Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editModal.data.name || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, name: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editModal.data.phone || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, phone: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={editModal.data.email || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, email: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">User Type</label>
                    <select
                      value={editModal.data.userType || 'UNPAID'}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, userType: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Activation Date</label>
                    <input
                      type="text"
                      value={editModal.data.activationDate || '-'}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, activationDate: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Joining Package</label>
                    <input
                      type="text"
                      value={editModal.data.joiningPackage || '-'}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, joiningPackage: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Binary Leg Stats (Counts, Business, PV, Carry Forward PV) */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase">Binary Leg PV & Business Numbers</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Left Count</label>
                    <input
                      type="number"
                      value={editModal.data.leftCount ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, leftCount: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Right Count</label>
                    <input
                      type="number"
                      value={editModal.data.rightCount ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, rightCount: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Left Business (₹)</label>
                    <input
                      type="number"
                      value={editModal.data.leftBusiness ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, leftBusiness: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Right Business (₹)</label>
                    <input
                      type="number"
                      value={editModal.data.rightBusiness ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, rightBusiness: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Left PV</label>
                    <input
                      type="number"
                      value={editModal.data.leftPv ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, leftPv: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Right PV</label>
                    <input
                      type="number"
                      value={editModal.data.rightPv ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, rightPv: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Left Carry Forward PV</label>
                    <input
                      type="number"
                      value={editModal.data.leftCarryForwardPv ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, leftCarryForwardPv: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Right Carry Forward PV</label>
                    <input
                      type="number"
                      value={editModal.data.rightCarryForwardPv ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, rightCarryForwardPv: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Incomes Block */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase">Customer Incomes (Displayed on Dashboard)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Matching Income</label>
                    <input
                      type="number"
                      value={editModal.data.matchingIncome ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, matchingIncome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Today's Matching</label>
                    <input
                      type="number"
                      value={editModal.data.todayMatchingIncome ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, todayMatchingIncome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Franchise Ref.</label>
                    <input
                      type="number"
                      value={editModal.data.franchiseReferralIncome ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, franchiseReferralIncome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Franchise Match.</label>
                    <input
                      type="number"
                      value={editModal.data.franchiseMatchingIncome ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, franchiseMatchingIncome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Total Income</label>
                    <input
                      type="number"
                      value={editModal.data.totalIncome ?? 0}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, totalIncome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* KYC & Bank Details */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase">Tax KYC & Bank Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={editModal.data.panNumber || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, panNumber: e.target.value.toUpperCase() } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">PAN Verified (5% TDS)</label>
                    <select
                      value={editModal.data.panVerified ? 'true' : 'false'}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, panVerified: e.target.value === 'true' } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="true">Verified (5% TDS)</option>
                      <option value="false">Unverified (20% TDS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={editModal.data.bankDetails?.upiId || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, bankDetails: { ...editModal.data.bankDetails, upiId: e.target.value } } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editModal.data.bankDetails?.bankName || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, bankDetails: { ...editModal.data.bankDetails, bankName: e.target.value } } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={editModal.data.bankDetails?.accountNumber || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, bankDetails: { ...editModal.data.bankDetails, accountNumber: e.target.value } } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={editModal.data.bankDetails?.ifscCode || ''}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, bankDetails: { ...editModal.data.bankDetails, ifscCode: e.target.value.toUpperCase() } } })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, data: null })}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/20"
                >
                  Save All Customer Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SELL PACKAGE TO CUSTOMER */}
      {sellModal.open && sellModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Sell Product Package to: {sellModal.user.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              User Code: <strong className="text-emerald-400">{sellModal.user.userCode || sellModal.user.memberId}</strong>
            </p>

            <form onSubmit={handleSellPackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Package</label>
                <select
                  value={sellModal.packageName}
                  onChange={(e) => {
                    const name = e.target.value;
                    let pv = 20;
                    let amt = 3600;
                    if (name.includes('Double')) { pv = 50; amt = 7499; }
                    else if (name.includes('Franchise')) { pv = 100; amt = 15000; }
                    setSellModal({ ...sellModal, packageName: name, pv, amount: amt });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="Bio-Magnetic Healthcare Single Mat (20 PV)">Bio-Magnetic Single Mat (20 PV) - ₹3,600</option>
                  <option value="Bio-Magnetic Healthcare Double Bed Pad (50 PV)">Bio-Magnetic Double Bed Pad (50 PV) - ₹7,499</option>
                  <option value="Bio-Magnetic Master Franchise Kit (100 PV)">Master Franchise Kit (100 PV) - ₹15,000</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Point Value (PV)</label>
                  <input
                    type="number"
                    value={sellModal.pv}
                    onChange={(e) => setSellModal({ ...sellModal, pv: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Amount (₹)</label>
                  <input
                    type="number"
                    value={sellModal.amount}
                    onChange={(e) => setSellModal({ ...sellModal, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placement Leg</label>
                <select
                  value={sellModal.legPosition}
                  onChange={(e) => setSellModal({ ...sellModal, legPosition: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="left">Left Leg (Adds to Left PV & Left Business)</option>
                  <option value="right">Right Leg (Adds to Right PV & Right Business)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Channel</label>
                <input
                  type="text"
                  value={sellModal.paymentMode}
                  onChange={(e) => setSellModal({ ...sellModal, paymentMode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300">
                ✓ Sells package, marks customer as <strong>PAID</strong>, and adds {sellModal.pv} PV to binary hierarchy.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSellModal({ open: false, user: null })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  Confirm Sale & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST WALLET */}
      {walletModal.open && walletModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Adjust Wallet for: {walletModal.user.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              User Code: <strong className="text-teal-400">{walletModal.user.userCode || walletModal.user.memberId}</strong>
            </p>

            <form onSubmit={handleAdjustWallet} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWalletModal({ ...walletModal, type: 'credit' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    walletModal.type === 'credit' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  + Credit (Add Funds)
                </button>
                <button
                  type="button"
                  onClick={() => setWalletModal({ ...walletModal, type: 'debit' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    walletModal.type === 'debit' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  - Debit (Deduct Funds)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={walletModal.amount}
                  onChange={(e) => setWalletModal({ ...walletModal, amount: e.target.value })}
                  placeholder="500.00"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Reason</label>
                <input
                  type="text"
                  required
                  value={walletModal.reason}
                  onChange={(e) => setWalletModal({ ...walletModal, reason: e.target.value })}
                  placeholder="e.g. Offline cash collected / Bonus incentive"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModal({ open: false, user: null })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
                    walletModal.type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Confirm {walletModal.type.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
