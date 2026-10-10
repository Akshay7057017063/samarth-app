import React, { useState } from 'react';
import {
  UserCheck,
  KeyRound,
  Network,
  IndianRupee,
  Check,
} from 'lucide-react';

const DEFAULT_STEPS = [
  {
    step: '01',
    title: 'Get Registered by Your Sponsor',
    desc: 'Your sponsor registers you from their dashboard. Activate your account with the PIN sent to your email and login.',
    icon: UserCheck,
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    step: '02',
    title: 'Solve Daily Captchas',
    desc: 'Access your workstation to solve daily verification tasks and watch instant cash credit directly into your wallet.',
    icon: KeyRound,
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    step: '03',
    title: 'Grow Your Chain Tree',
    desc: 'Share your referral link with friends. Track your multi-level downline genealogy tree in real-time.',
    icon: Network,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    step: '04',
    title: 'Direct TDS Bank Payout',
    desc: 'Request instant withdrawals via UPI or IMPS. 100% tax compliant with automated 5% TDS deduction and Form 16A.',
    icon: IndianRupee,
    color: 'from-amber-500 to-orange-500',
  },
];

export default function WorkingProcessSection({ steps = [] }) {
  const [activeStep, setActiveStep] = useState(0);

  const displaySteps =
    steps && steps.length === 4
      ? steps.map((s, i) => ({
          step: s.step || `0${i + 1}`,
          title: s.title,
          desc: s.desc,
          icon: DEFAULT_STEPS[i].icon,
          color: DEFAULT_STEPS[i].color,
        }))
      : DEFAULT_STEPS;

  return (
    <section
      id="working-process"
      className="relative overflow-hidden py-20 sm:py-24 bg-gradient-to-br from-violet-50 via-white to-orange-50"
    >
      {/* Rainbow Background Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />

      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl pointer-events-none" />

      <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-orange-300/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full border border-violet-200 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-orange-500" />
            How It Works
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-5 tracking-tight">
            Our 4-Step{' '}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
              Earning & Wellness Pipeline
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed max-w-2xl mx-auto">
            A clear, verified, and automated workflow designed for sustained
            wellness and predictable digital micro-income.
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
                className={`group relative rounded-3xl p-[1px] transition-all duration-300 ${
                  isHovered
                    ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-xl shadow-violet-500/15 -translate-y-2'
                    : 'bg-gradient-to-br from-slate-200 via-white to-slate-200 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Card */}
                <div className="relative h-full rounded-[23px] bg-white/90 backdrop-blur-xl p-6 sm:p-7 overflow-hidden">
                  {/* Card Decorative Glow */}
                  <div
                    className={`absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br ${item.color} opacity-10 blur-2xl transition-opacity duration-300 ${
                      isHovered ? 'opacity-25' : ''
                    }`}
                  />

                  {/* Step Number + Icon */}
                  <div className="relative z-10 flex items-center justify-between mb-7">
                    <span
                      className={`text-3xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                    >
                      {item.step}
                    </span>

                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} p-[1.5px] shadow-md transition-transform duration-300 ${
                        isHovered ? 'scale-110 rotate-2' : ''
                      }`}
                    >
                      <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                        <Icon
                          className={`w-5 h-5 ${
                            isHovered ? 'text-violet-600' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="relative z-10 text-base sm:text-lg font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="relative z-10 text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[72px]">
                    {item.desc}
                  </p>

                  {/* Progress Indicator */}
                  <div className="relative z-10 mt-7 pt-4 border-t border-slate-200 flex items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`relative flex w-2.5 h-2.5 rounded-full ${
                        isHovered
                          ? 'bg-gradient-to-r from-violet-500 to-orange-500'
                          : 'bg-slate-300'
                      }`}
                    >
                      {isHovered && (
                        <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-40" />
                      )}
                    </span>

                    <span
                      className={
                        isHovered ? 'text-violet-600' : 'text-slate-500'
                      }
                    >
                      {isHovered ? 'Active Phase' : `Phase ${item.step}`}
                    </span>

                    {isHovered && (
                      <Check className="w-3.5 h-3.5 ml-auto text-emerald-500" />
                    )}
                  </div>

                  {/* Bottom Rainbow Line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Connecting Rainbow Flow */}
        <div className="hidden lg:flex items-center justify-center mt-10">
          <div className="w-full max-w-4xl h-[2px] bg-gradient-to-r from-violet-400 via-fuchsia-400 via-cyan-400 to-orange-400 opacity-30 rounded-full" />
        </div>
      </div>
    </section>
  );
}