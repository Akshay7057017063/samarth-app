import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, ShieldCheck, ArrowRight, TrendingUp, Users, HeartPulse, 
  Coins, Award, CheckCircle2, ChevronRight, Zap, Calculator, Phone
} from 'lucide-react';
import InteractiveProductExplorer from '../components/InteractiveProductExplorer';
import WorkingProcessSection from '../components/WorkingProcessSection';
import LiveTicker from '../components/LiveTicker';

export default function HomePage() {
  const { cmsContent } = useAuth();

  // CMS dynamic values with fallbacks
  const heroBadge = cmsContent?.heroBadge || "India's #1 Smart Wellness & Direct Reward Community";
  const heroTitle = cmsContent?.heroTitle || "Elevate Your Health, Build Financial Freedom";
  const heroSubtitle = cmsContent?.heroSubtitle || "Experience next-generation Bio-Magnetic healthcare solutions while unlocking daily digital earnings through genuine referrals and micro-tasks.";
  const aboutTitle = cmsContent?.aboutTitle || "Welcome to Samarth India";
  const aboutDesc = cmsContent?.aboutDescription || "Samarth India is an emerging provider of advanced bio-magnetic health products and direct community marketing. We bridge holistic wellness with sustainable digital micro-earnings.";
  const mission = cmsContent?.missionStatement || "To empower every family across India with drug-free magnetic health therapy and transparent, rewarding affiliate career opportunities.";
  const phone = cmsContent?.supportPhone || "+91 98765 43210";

  // Interactive Compensation Calculator State
  const [directReferrals, setDirectReferrals] = useState(5);
  const [dailyCaptchasPerMember, setDailyCaptchasPerMember] = useState(30);

  // Earnings estimation (₹0.50 personal captcha + 10% sponsor override per member solve)
  const personalDaily = 50 * 0.50; // ₹25
  const teamDailyCommission = directReferrals * dailyCaptchasPerMember * (0.50 * 0.10);
  const totalDaily = personalDaily + teamDailyCommission;
  const estimatedMonthly = Math.round(totalDaily * 30);

  return (
    <div className="relative overflow-hidden">
      <LiveTicker />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Ambient Gradient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Floating Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{heroBadge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {heroTitle.split(' ').slice(0, 3).join(' ')}{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  {heroTitle.split(' ').slice(3).join(' ') || 'Wellness & Rewards'}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {heroSubtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
                >
                  <span>Start Earning Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#products"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Products</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-black text-white">50K+</div>
                  <div className="text-xs text-slate-400">Happy Users</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">100%</div>
                  <div className="text-xs text-slate-400">Tax Compliant (TDS)</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-400">₹0.50</div>
                  <div className="text-xs text-slate-400">Instant / Captcha</div>
                </div>
              </div>

            </div>

            {/* Right Hero Interactive 3D Card HUD */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-800/80 via-slate-900 to-slate-950 border border-slate-700 shadow-2xl backdrop-blur-xl">
                
                {/* Floating Badge 1 */}
                <div className="absolute -top-4 -right-4 bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ISO 9001:2015 Certified</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase">Live Member Hub</span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      LIVE EARNINGS
                    </span>
                  </div>

                  {/* Sample Live Stats Display */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Today's Captcha Solved</span>
                      <span className="text-white font-bold">42 / 50 Tasks</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[84%] h-full bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Direct Team</div>
                      <div className="text-lg font-black text-teal-300 mt-1">14 Members</div>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Wallet Balance</div>
                      <div className="text-lg font-black text-emerald-400 mt-1">₹3,450.00</div>
                    </div>
                  </div>

                  {/* Instant Captcha Demo Preview */}
                  <div className="bg-gradient-to-r from-emerald-950/50 to-slate-900 p-4 rounded-2xl border border-emerald-500/30">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      Daily Micro-Task Automation
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Solve 50 captchas daily + earn referral commissions from every task your team completes.
                    </p>
                    <Link
                      to="/login"
                      className="mt-3 block text-center py-2 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-xs transition-colors border border-emerald-500/40"
                    >
                      Login to Try Workstation →
                    </Link>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4 Feature Badges Strip (Modernized from Screenshot) */}
      <section className="border-y border-slate-800/80 bg-slate-950/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Shipping</h4>
              <p className="text-xs text-slate-400">All India Doorstep Delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Tax Compliant</h4>
              <p className="text-xs text-slate-400">Automated 5% TDS with Form 16A</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Daily Captcha Rewards</h4>
              <p className="text-xs text-slate-400">Solve & earn directly into wallet</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Genealogy Chain Tree</h4>
              <p className="text-xs text-slate-400">Real-time downline visualization</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                About Samarth India
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {aboutTitle}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {aboutDesc}
              </p>

              <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-5 text-xs text-emerald-200 space-y-2">
                <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Our Mission
                </div>
                <p className="leading-relaxed text-emerald-300/90">
                  {mission}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-white">15+</div>
                  <div className="text-xs text-slate-400 mt-0.5">Years Trust in Wellness</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-teal-400">24/7</div>
                  <div className="text-xs text-slate-400 mt-0.5">Community Helpdesk</div>
                </div>
              </div>
            </div>

            {/* Right Card Collage */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-900/60 to-slate-900 border border-emerald-500/30 shadow-xl">
                  <HeartPulse className="w-8 h-8 text-emerald-400 mb-3" />
                  <h4 className="text-base font-bold text-white">Bio-Magnetic Science</h4>
                  <p className="text-xs text-slate-300 mt-1">Stimulating healthy blood circulation naturally through therapeutic gauss fields.</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                  <Award className="w-8 h-8 text-amber-400 mb-3" />
                  <h4 className="text-base font-bold text-white">Premium Quality</h4>
                  <p className="text-xs text-slate-400 mt-1">Directly manufactured with Neodymium medical magnets and orthopedic foam.</p>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                  <Coins className="w-8 h-8 text-teal-400 mb-3" />
                  <h4 className="text-base font-bold text-white">Daily Tasks</h4>
                  <p className="text-xs text-slate-400 mt-1">Solve verification captchas for instant daily wallet credits.</p>
                </div>
                <div className="p-6 rounded-3xl bg-gradient-to-b from-teal-900/60 to-slate-900 border border-teal-500/30 shadow-xl">
                  <Users className="w-8 h-8 text-cyan-400 mb-3" />
                  <h4 className="text-base font-bold text-white">Downline Tree</h4>
                  <p className="text-xs text-slate-300 mt-1">Interactive genealogy tracking with transparent multi-tier commission logic.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive 3D Product Explorer Section */}
      <InteractiveProductExplorer products={cmsContent?.products} />

      {/* Working Process 4-Step Pipeline */}
      <WorkingProcessSection steps={cmsContent?.processSteps} />

      {/* Interactive Earning & Chain Marketing Calculator */}
      <section id="rewards" className="py-20 bg-slate-950/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
              Interactive Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
              Estimate Your <span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">Monthly Digital Income</span>
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              See how combining daily personal tasks with direct team referrals compounds into reliable income.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
                    <span>Direct Team Members:</span>
                    <span className="text-emerald-400 text-sm font-black">{directReferrals} Members</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={directReferrals}
                    onChange={(e) => setDirectReferrals(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 Member</span>
                    <span>25 Members</span>
                    <span>50 Members</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
                    <span>Daily Captchas Solved Per Member:</span>
                    <span className="text-teal-400 text-sm font-black">{dailyCaptchasPerMember} Tasks</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={dailyCaptchasPerMember}
                    onChange={(e) => setDailyCaptchasPerMember(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>10 Tasks</span>
                    <span>30 Tasks</span>
                    <span>50 Tasks (Max)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>• Personal Earning (50 tasks/day): <strong>₹25.00/day</strong></div>
                  <div>• Team Referral Override: <strong>10% of each team task</strong></div>
                  <div>• TDS Deducted on Payout: <strong>5% with PAN</strong></div>
                </div>
              </div>

              {/* Estimated Earning Display */}
              <div className="bg-gradient-to-b from-emerald-950/70 to-slate-950 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Estimated Monthly Income
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white">
                  ₹{estimatedMonthly.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-400">
                  Approx. ₹{Math.round(totalDaily)} / day after team rewards
                </div>

                <div className="pt-2">
                  <Link
                    to="/register"
                    className="block w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all"
                  >
                    Start Earning With This Plan
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CTA Section (Modernized from Screenshot "Let's Work Together?") */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center lg:text-left">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Direct Distributor Career
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Let's Work Together
              </h2>
              <p className="text-slate-300 text-sm max-w-xl">
                Providing real advice, wellness products, and a sustainable digital compensation plan. Start with zero barriers today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call: {phone}</span>
              </a>
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all"
              >
                Join Network Now
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
