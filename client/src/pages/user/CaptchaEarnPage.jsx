import React from 'react';
import CaptchaWorkstation from '../../components/CaptchaWorkstation';
import { ShieldCheck, Info, Sparkles, TrendingUp } from 'lucide-react';

export default function CaptchaEarnPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
          Daily Tasks
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
          Captcha Earning Workstation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Solve verification tasks to build steady daily micro-income deposited directly into your Samarth wallet.
        </p>
      </div>

      {/* The Workstation */}
      <CaptchaWorkstation />

      {/* Rules & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-teal-400" />
            Daily Limit
          </div>
          <p className="text-slate-400">
            Each active member is allotted 50 verification captchas every 24 hours. The quota resets automatically at midnight.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Anti-Bot Security
          </div>
          <p className="text-slate-400">
            Every submission is checked for human solve speed and cryptographic HMAC signatures to ensure fair reward distribution.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            10% Sponsor Override
          </div>
          <p className="text-slate-400">
            Whenever your direct team members solve a captcha, you automatically receive a 10% referral bonus in your wallet!
          </p>
        </div>
      </div>

    </div>
  );
}
