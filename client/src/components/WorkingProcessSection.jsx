import React, { useState } from 'react';
import { UserCheck, KeyRound, Network, IndianRupee, ArrowRight, Check } from 'lucide-react';

const DEFAULT_STEPS = [
  {
    step: "01",
    title: "Join with Sponsor ID",
    desc: "Register in under 60 seconds with your sponsor referral code and activate your digital member portal.",
    icon: UserCheck,
    color: "from-emerald-500 to-teal-500"
  },
  {
    step: "02",
    title: "Solve Daily Captchas",
    desc: "Access your workstation to solve daily verification tasks and watch instant cash credit directly into your wallet.",
    icon: KeyRound,
    color: "from-teal-500 to-cyan-500"
  },
  {
    step: "03",
    title: "Grow Your Chain Tree",
    desc: "Share your referral link with friends. Track your multi-level downline genealogy tree in real-time.",
    icon: Network,
    color: "from-cyan-500 to-blue-500"
  },
  {
    step: "04",
    title: "Direct TDS Bank Payout",
    desc: "Request instant withdrawals via UPI or IMPS. 100% tax compliant with automated 5% TDS deduction and Form 16A.",
    icon: IndianRupee,
    color: "from-amber-500 to-orange-500"
  }
];

export default function WorkingProcessSection({ steps = [] }) {
  const [activeStep, setActiveStep] = useState(0);

  const displaySteps = steps && steps.length === 4 ? steps.map((s, i) => ({
    step: s.step || `0${i+1}`,
    title: s.title,
    desc: s.desc,
    icon: DEFAULT_STEPS[i].icon,
    color: DEFAULT_STEPS[i].color
  })) : DEFAULT_STEPS;

  return (
    <section id="working-process" className="py-20 bg-slate-900/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/30">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
            Our 4-Step <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Earning & Wellness Pipeline</span>
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            A clear, verified, and automated workflow designed for sustained wellness and predictable digital micro-income.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {displaySteps.map((item, index) => {
            const Icon = item.icon;
            const isHovered = activeStep === index;
            return (
              <div
                key={index}
                onMouseEnter={() => setActiveStep(index)}
                className={`relative rounded-2xl p-6 transition-all duration-300 border ${
                  isHovered
                    ? 'bg-slate-800/90 border-teal-500/80 shadow-xl shadow-teal-500/10 -translate-y-1.5'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Step Number Top Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.step}
                  </span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-[1.5px] shadow-md`}>
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>

                {/* Progress Indicator line */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${isHovered ? 'bg-teal-400 animate-ping' : 'bg-slate-600'}`}></span>
                  <span>{isHovered ? 'Active Phase' : `Phase ${item.step}`}</span>
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
