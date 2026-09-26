import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Wallet, IndianRupee, ShieldCheck, AlertCircle, CheckCircle2, 
  ArrowRight, FileText, Building, Send, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WithdrawalPage() {
  const { user, wallet, token, updateWalletLocally } = useAuth();
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    tdsRateWithPan: 5,
    tdsRateNoPan: 20,
    adminFeeRate: 5,
    minWithdrawalAmount: 200
  });

  const loadData = () => {
    if (token) {
      fetch('/api/wallet/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.settings) setSettings(data.settings);
          if (payoutMethod === 'UPI' && data.user?.bankDetails?.upiId) {
            setPayoutDetails(data.user.bankDetails.upiId);
          } else if (payoutMethod === 'BANK' && data.user?.bankDetails?.accountNumber) {
            setPayoutDetails(`${data.user.bankDetails.accountNumber} (${data.user.bankDetails.ifscCode})`);
          }
        }
      });

      fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTransactions(data.transactions.filter(t => t.type === 'withdrawal'));
        }
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [token, payoutMethod]);

  // Real-time TDS & Admin Fee calculation
  const gross = parseFloat(amount) || 0;
  const hasPan = Boolean(user?.panVerified && user?.panNumber && user?.panNumber.length >= 10);
  const tdsRate = hasPan ? settings.tdsRateWithPan : settings.tdsRateNoPan;
  const tdsDeduction = parseFloat(((gross * tdsRate) / 100).toFixed(2));
  const adminFee = parseFloat(((gross * settings.adminFeeRate) / 100).toFixed(2));
  const netPayable = Math.max(0, parseFloat((gross - tdsDeduction - adminFee).toFixed(2)));

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || gross < settings.minWithdrawalAmount) {
      setFeedback({ text: `Minimum withdrawal is ₹${settings.minWithdrawalAmount}.`, type: 'error' });
      return;
    }

    if (gross > (wallet?.currentBalance || 0)) {
      setFeedback({ text: 'Insufficient wallet balance.', type: 'error' });
      return;
    }

    if (!payoutDetails.trim()) {
      setFeedback({ text: `Please provide your ${payoutMethod} details.`, type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback({ text: '', type: '' });

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: gross,
          payoutMethod,
          payoutDetails: payoutDetails.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setAmount('');
        updateWalletLocally(data.newBalance);
        loadData();
      } else {
        setFeedback({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <IndianRupee className="w-4 h-4" />
            <span>Tax Compliant Payout Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Wallet Withdrawal & TDS Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with Section 194H of the Income Tax Act. Instant transfer to bank or UPI after admin review.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
          <Wallet className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Available for Payout</div>
            <div className="text-xl font-black text-white">₹{wallet?.currentBalance?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Withdrawal Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Request Payout
          </h3>

          {feedback.text && (
            <div className={`p-4 rounded-xl text-xs mb-6 flex items-center gap-2.5 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/70 border border-red-500/40 text-red-300'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gross Withdrawal Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min={settings.minWithdrawalAmount}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount (Min ₹${settings.minWithdrawalAmount})`}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Payout Destination Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payout Channel
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('UPI')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    payoutMethod === 'UPI'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Instant UPI ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('BANK')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    payoutMethod === 'BANK'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Bank Account / IMPS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {payoutMethod === 'UPI' ? 'Recipient UPI ID' : 'Bank Account & IFSC'}
              </label>
              <input
                type="text"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={payoutMethod === 'UPI' ? 'e.g. mobile@upi' : 'Account No, Bank Name, IFSC'}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>

            {/* Real-time TDS Calculation Table */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Gross Requested:</span>
                <span className="font-mono font-bold text-white">₹{gross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>TDS Tax ({tdsRate}% {hasPan ? 'with PAN' : 'No PAN'}):</span>
                <span className="font-mono font-bold">-₹{tdsDeduction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Admin & Processing Fee ({settings.adminFeeRate}%):</span>
                <span className="font-mono font-bold">-₹{adminFee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400 text-sm">
                <span>Net Transfer Amount:</span>
                <span className="font-mono text-base">₹{netPayable.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || gross < settings.minWithdrawalAmount || gross > (wallet?.currentBalance || 0)}
              className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <span>Submitting Request...</span> : (
                <>
                  <IndianRupee className="w-4 h-4" />
                  <span>Submit Withdrawal Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Tax & KYC Compliance Explainer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tax Compliance Guidelines (TDS)
            </h4>
            <div className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
              <p>
                As per Indian Direct Selling & Income Tax laws (Section 194H), TDS is deducted at source from commission and task earnings before payout.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-emerald-400 font-bold">• With Valid PAN Card: 5% TDS</div>
                <div className="text-amber-400 font-bold">• Without PAN Card: 20% TDS (Sec 206AA)</div>
              </div>
              <p>
                All TDS deducted is deposited under your PAN and can be claimed back during your annual Income Tax Return (ITR) via Form 26AS.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/dashboard/profile"
                className="block text-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Update PAN & Bank Details →
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Withdrawal History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">
          Withdrawal Requests & Payout Log
        </h3>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No withdrawal requests made yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Gross Amount</th>
                  <th className="pb-3">TDS Deducted</th>
                  <th className="pb-3">Admin Fee</th>
                  <th className="pb-3">Net Paid</th>
                  <th className="pb-3">Channel / UTR</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-mono font-bold text-white">₹{tx.grossAmount.toFixed(2)}</td>
                    <td className="py-3 font-mono text-red-400">-₹{tx.tdsAmount.toFixed(2)} ({tx.tdsPercentage}%)</td>
                    <td className="py-3 font-mono text-slate-400">-₹{tx.adminFeeAmount.toFixed(2)}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">₹{tx.netAmount.toFixed(2)}</td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {tx.utrNumber ? `UTR: ${tx.utrNumber}` : `${tx.payoutMethod}: ${tx.payoutDetails}`}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'approved' || tx.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
