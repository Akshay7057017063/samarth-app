import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, ShieldCheck, IndianRupee, Filter } from 'lucide-react';

export default function TdsReport() {
  const { token } = useAuth();
  const [report, setReport] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/tds-report', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReport(data.report);
          setSummary(data.summary);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [token]);

  // Export to CSV Function
  const exportCsv = () => {
    if (report.length === 0) return;

    const headers = ["Member ID", "Member Name", "PAN Card", "Gross Amount (INR)", "TDS Percentage", "TDS Deducted (INR)", "Admin Fee (INR)", "Net Paid (INR)", "Bank UTR", "Payout Date"];
    
    const rows = report.map(r => [
      `"${r.memberId}"`,
      `"${r.userId?.name || 'Member'}"`,
      `"${r.panNumber || 'N/A'}"`,
      r.grossAmount.toFixed(2),
      `${r.tdsPercentage}%`,
      r.tdsAmount.toFixed(2),
      r.adminFeeAmount.toFixed(2),
      r.netAmount.toFixed(2),
      `"${r.utrNumber || ''}"`,
      `"${new Date(r.createdAt).toISOString().split('T')[0]}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Samarth_India_TDS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Tax & Regulatory Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            TDS Tax Ledger & Form 26Q Statement
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with Section 194H (Commission & Brokerage) of the Indian Income Tax Act. Ready for quarterly e-TDS filing.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={report.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export TDS CSV (Excel)</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">Total Gross Earnings Disbursed</div>
          <div className="text-2xl font-black text-white">₹{summary?.totalGross?.toFixed(2) || '0.00'}</div>
          <div className="text-[11px] text-slate-500 mt-2">{summary?.totalPayoutsCount || 0} Payouts Processed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">Total TDS Deposited to Govt</div>
          <div className="text-2xl font-black text-emerald-400">₹{summary?.totalTds?.toFixed(2) || '0.00'}</div>
          <div className="text-[11px] text-emerald-400/80 mt-2">Section 194H (5% / 20%)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">Platform Admin Fee Collected</div>
          <div className="text-2xl font-black text-teal-300">₹{summary?.totalAdmin?.toFixed(2) || '0.00'}</div>
          <div className="text-[11px] text-slate-500 mt-2">Maintenance & Gateway charges</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="text-xs text-slate-400 mb-1">Net Transferred to Members</div>
          <div className="text-2xl font-black text-cyan-300">₹{summary?.totalNet?.toFixed(2) || '0.00'}</div>
          <div className="text-[11px] text-slate-500 mt-2">Direct UPI & IMPS Credits</div>
        </div>
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h3 className="text-base font-bold text-white">
            Tax Deducted at Source (TDS) Transactions
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {report.length} Records Logged
          </span>
        </div>

        {report.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No TDS records found yet. Approved payouts will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-3">Member ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">PAN Card</th>
                  <th className="pb-3">Gross (₹)</th>
                  <th className="pb-3">TDS (₹)</th>
                  <th className="pb-3">Admin Fee (₹)</th>
                  <th className="pb-3">Net Paid (₹)</th>
                  <th className="pb-3">UTR Reference</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {report.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 font-bold text-emerald-400">{r.memberId}</td>
                    <td className="py-3 font-sans font-semibold text-white">{r.userId?.name || 'Member'}</td>
                    <td className="py-3 font-bold text-slate-300">{r.panNumber || 'N/A'}</td>
                    <td className="py-3 font-bold text-white">₹{r.grossAmount.toFixed(2)}</td>
                    <td className="py-3 font-bold text-red-400">₹{r.tdsAmount.toFixed(2)} ({r.tdsPercentage}%)</td>
                    <td className="py-3 text-slate-400">₹{r.adminFeeAmount.toFixed(2)}</td>
                    <td className="py-3 font-bold text-emerald-400">₹{r.netAmount.toFixed(2)}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-xs">{r.utrNumber || '-'}</td>
                    <td className="py-3 text-slate-500 font-sans">{new Date(r.createdAt).toLocaleDateString()}</td>
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
