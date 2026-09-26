import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Wallet, IndianRupee, FileText, Settings, ShieldCheck, 
  ArrowUpRight, Clock, CheckCircle2, AlertCircle, Sparkles, LayoutDashboard
} from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Administration Controller</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Platform Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage website content (CMS), approve withdrawals, audit TDS deductions, and monitor referral trees.
          </p>
        </div>

        <Link
          to="/admin/cms"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Edit Website Content (CMS)</span>
        </Link>
      </div>

      {/* Main Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Members */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Registered Members</span>
            <Users className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {stats?.totalUsers || 0}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-bold">{stats?.activeUsers || 0} Active</span>
            <Link to="/admin/users" className="text-slate-400 hover:text-white">Manage →</Link>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Pending Payouts</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300">
            ₹{stats?.pendingWithdrawalsNet?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">{stats?.pendingWithdrawalsCount || 0} Requests</span>
            <Link to="/admin/withdrawals" className="text-amber-400 font-bold hover:underline">Review Now →</Link>
          </div>
        </div>

        {/* Total TDS Deducted */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Total TDS Deducted</span>
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300">
            ₹{stats?.totalTdsDeducted?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Sec. 194H Compliant</span>
            <Link to="/admin/tds" className="text-emerald-400 font-bold hover:underline">Tax Ledger →</Link>
          </div>
        </div>

        {/* Total Wallet Liabilities */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>User Wallet Balance</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">
            ₹{stats?.totalCurrentBalance?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            Total Distributed Earnings
          </div>
        </div>

      </div>

      {/* Admin Module Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link
          to="/admin/cms"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Website CMS Editor
          </h3>
          <p className="text-xs text-slate-400">
            Manage homepage banners, hero headlines, products, contact info, and tax rates.
          </p>
        </Link>

        <Link
          to="/admin/withdrawals"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Withdrawal Approvals
          </h3>
          <p className="text-xs text-slate-400">
            Approve payouts with bank UTR numbers or reject and refund member balances.
          </p>
        </Link>

        <Link
          to="/admin/tds"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition-all shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            TDS Tax Reports
          </h3>
          <p className="text-xs text-slate-400">
            Export complete TDS withholding statements categorized by PAN for quarterly returns.
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Member Management
          </h3>
          <p className="text-xs text-slate-400">
            Search members, view their downlines, inspect KYC details, or suspend accounts.
          </p>
        </Link>

      </div>

    </div>
  );
}
