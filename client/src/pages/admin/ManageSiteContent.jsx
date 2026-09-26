import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, Save, CheckCircle2, AlertCircle, Phone, 
  MapPin, Settings, IndianRupee, Layers, Check 
} from 'lucide-react';

export default function ManageSiteContent() {
  const { token, refreshCms } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (token) {
      fetch('/api/admin/site-content', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setContent(data.content);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(content)
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Website content & platform settings successfully saved to MongoDB!', type: 'success' });
        setContent(data.content);
        refreshCms(); // updates public website in real time!
      } else {
        setMessage({ text: data.message || 'Failed to save content.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error saving CMS content.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return <div className="p-12 text-center text-slate-400">Loading website CMS content...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Live Website Content Management System (CMS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Website Content & Platform Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every change made here dynamically updates the customer website, products, contact info, and tax rates without touching code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Changes...' : 'Publish to Website'}</span>
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950/70 border border-red-500/40 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Section 1: Earning & Tax Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <IndianRupee className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Earning, Captcha, & Tax Rates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Captcha Reward Per Task (₹)
              </label>
              <input
                type="number"
                step="0.05"
                value={content.settings?.captchaReward ?? 0.50}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, captchaReward: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Daily Captcha Limit Per Member
              </label>
              <input
                type="number"
                value={content.settings?.dailyCaptchaLimit ?? 50}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, dailyCaptchaLimit: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minimum Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                value={content.settings?.minWithdrawalAmount ?? 200}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, minWithdrawalAmount: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                TDS Rate With PAN (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={content.settings?.tdsRateWithPan ?? 5.0}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, tdsRateWithPan: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Sec. 194H standard (5%)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                TDS Rate Without PAN (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={content.settings?.tdsRateNoPan ?? 20.0}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, tdsRateNoPan: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-500">Sec. 206AA standard (20%)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin & Processing Fee (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={content.settings?.adminFeeRate ?? 5.0}
                onChange={(e) => setContent({
                  ...content,
                  settings: { ...content.settings, adminFeeRate: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Header & Contact Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Phone className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              Header Top Bar & Contact Info
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Top Banner Text</label>
              <input
                type="text"
                value={content.topBarText || ''}
                onChange={(e) => setContent({ ...content, topBarText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Support Phone</label>
              <input
                type="text"
                value={content.supportPhone || ''}
                onChange={(e) => setContent({ ...content, supportPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Support Email</label>
              <input
                type="text"
                value={content.supportEmail || ''}
                onChange={(e) => setContent({ ...content, supportEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Working Hours</label>
              <input
                type="text"
                value={content.workingHours || ''}
                onChange={(e) => setContent({ ...content, workingHours: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Office Address</label>
              <input
                type="text"
                value={content.officeAddress || ''}
                onChange={(e) => setContent({ ...content, officeAddress: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Hero & About Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Hero & About Section Content
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Floating Badge Text</label>
              <input
                type="text"
                value={content.heroBadge || ''}
                onChange={(e) => setContent({ ...content, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Main Headline</label>
              <input
                type="text"
                value={content.heroTitle || ''}
                onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Subtitle</label>
              <textarea
                rows={2}
                value={content.heroSubtitle || ''}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">About Us Description</label>
              <textarea
                rows={3}
                value={content.aboutDescription || ''}
                onChange={(e) => setContent({ ...content, aboutDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Mission Statement</label>
              <textarea
                rows={2}
                value={content.missionStatement || ''}
                onChange={(e) => setContent({ ...content, missionStatement: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Live to Website'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
