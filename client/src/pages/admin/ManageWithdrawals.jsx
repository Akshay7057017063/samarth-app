import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  IndianRupee, CheckCircle2, XCircle, Clock, ShieldCheck, 
  Search, AlertCircle, FileText 
} from 'lucide-react';

export default function ManageWithdrawals() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, tx: null, action: '', utr: '', remark: '' });
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const loadWithdrawals = () => {
    if (token) {
      const url = statusFilter === 'all' 
        ? '/api/admin/withdrawals' 
        : `/api/admin/withdrawals?status=${statusFilter}`;

      fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWithdrawals(data.withdrawals);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [token, statusFilter]);

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.tx) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${actionModal.tx._id}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: actionModal.action,
          utrNumber: actionModal.utr,
          remark: actionModal.remark
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setActionModal({ open: false, tx: null, action: '', utr: '', remark: '' });
        loadWithdrawals();
      } else {
        setFeedback({ text: data.message || 'Action failed.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error.', type: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <IndianRupee className="w-4 h-4" />
            <span>Payout Clearance Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Withdrawal Approvals & TDS Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verify member payouts, confirm IMPS/UPI transfers with UTR numbers, and log statutory TDS deductions.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === s 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
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

      {/* Withdrawals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {withdrawals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No withdrawal requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-3">Member</th>
                  <th className="pb-3">PAN Card</th>
                  <th className="pb-3">Gross</th>
                  <th className="pb-3">TDS (Tax)</th>
                  <th className="pb-3">Net Payout</th>
                  <th className="pb-3">Payment Channel</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {withdrawals.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/30">
                    <td className="py-3">
                      <div className="font-bold text-white">{tx.userId?.name || 'Member'}</div>
                      <div className="font-mono text-emerald-400 text-[11px]">{tx.memberId}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-300">
                      {tx.panNumber !== 'NOT_PROVIDED' ? tx.panNumber : <span className="text-amber-400">NO PAN (20% TDS)</span>}
                    </td>
                    <td className="py-3 font-mono font-bold text-white">₹{tx.grossAmount.toFixed(2)}</td>
                    <td className="py-3 font-mono text-red-400">
                      -₹{tx.tdsAmount.toFixed(2)} ({tx.tdsPercentage}%)
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-400 text-sm">
                      ₹{tx.netAmount.toFixed(2)}
                    </td>
                    <td className="py-3 font-mono text-slate-300 text-[11px] max-w-xs truncate">
                      {tx.payoutMethod}: {tx.payoutDetails}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'approved' || tx.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {tx.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActionModal({ open: true, tx, action: 'approve', utr: `IMPS${Date.now()}`, remark: '' })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ open: true, tx, action: 'reject', utr: '', remark: 'KYC mismatch' })}
                            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {tx.utrNumber ? `UTR: ${tx.utrNumber}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {actionModal.action === 'approve' ? 'Approve & Clear Payout' : 'Reject Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Member: <strong className="text-white">{actionModal.tx.memberId}</strong> | Net Payout: <strong className="text-emerald-400">₹{actionModal.tx.netAmount.toFixed(2)}</strong>
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionModal.action === 'approve' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank UTR / Transaction Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={actionModal.utr}
                    onChange={(e) => setActionModal({ ...actionModal, utr: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Remark (Optional)
                </label>
                <input
                  type="text"
                  value={actionModal.remark}
                  onChange={(e) => setActionModal({ ...actionModal, remark: e.target.value })}
                  placeholder="e.g. Paid via ICICI IMPS"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, tx: null, action: '', utr: '', remark: '' })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
                    actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
