
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Users,
  HeartPulse,
  Coins,
  Award,
  CheckCircle2,
  ChevronRight,
  Zap,
  Calculator,
  Phone,
} from 'lucide-react';

import InteractiveProductExplorer from '../components/InteractiveProductExplorer';
import WorkingProcessSection from '../components/WorkingProcessSection';
import LiveTicker from '../components/LiveTicker';

export default function HomePage() {
  const { cmsContent } = useAuth();

  // CMS dynamic values with fallbacks
  const heroBadge =
    cmsContent?.heroBadge ||
    "India's #1 Smart Wellness & Direct Reward Community";

  const heroTitle =
    cmsContent?.heroTitle ||
    'Elevate Your Health, Build Financial Freedom';

  const heroSubtitle =
    cmsContent?.heroSubtitle ||
    'Experience next-generation Bio-Magnetic healthcare solutions while unlocking daily digital earnings through genuine referrals and micro-tasks.';

  const aboutTitle =
    cmsContent?.aboutTitle || 'Welcome to DIGITAL LYF PVT. LTD.';

  const aboutDesc =
    cmsContent?.aboutDescription ||
    'DIGITAL LYF PVT. LTD. is an emerging provider of advanced bio-magnetic health products and direct community marketing. We bridge holistic wellness with sustainable digital micro-earnings.';

  const mission =
    cmsContent?.missionStatement ||
    'To empower every family across India with drug-free magnetic health therapy and transparent, rewarding affiliate career opportunities.';

  const phone = cmsContent?.supportPhone || '+91 98765 43210';

  // Calculator state
  const [directReferrals, setDirectReferrals] = useState(5);
  const [dailyCaptchasPerMember, setDailyCaptchasPerMember] = useState(30);

  // Earnings estimation
  const personalDaily = 50 * 0.5;
  const teamDailyCommission =
    directReferrals * dailyCaptchasPerMember * (0.5 * 0.1);

  const totalDaily = personalDaily + teamDailyCommission;
  const estimatedMonthly = Math.round(totalDaily * 30);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800">

      {/* Decorative Rainbow Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      <LiveTicker />

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Rainbow Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-violet-300/20 via-pink-300/20 to-orange-300/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* LEFT HERO */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 via-pink-100 to-orange-100 border border-violet-200 text-violet-700 text-xs font-bold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-ping" />
                <span>{heroBadge}</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-900">
                {heroTitle.split(' ').slice(0, 3).join(' ')}{' '}
                <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {heroTitle.split(' ').slice(3).join(' ') ||
                    'Wellness & Rewards'}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {heroSubtitle}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
                >
                  <span>Start Earning Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#products"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl font-semibold text-sm bg-white/80 hover:bg-white text-slate-700 border border-slate-200 hover:border-violet-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Products</span>
                  <ChevronRight className="w-4 h-4 text-violet-500" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    50K+
                  </div>
                  <div className="text-xs text-slate-500">
                    Happy Users
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-emerald-600">
                    100%
                  </div>
                  <div className="text-xs text-slate-500">
                    Tax Compliant (TDS)
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-orange-500">
                    ₹0.50
                  </div>
                  <div className="text-xs text-slate-500">
                    Instant / Captcha
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT HERO CARD */}
            <div className="lg:col-span-5 relative">

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 z-20 bg-white/90 border border-emerald-200 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>ISO 9001:2015 Certified</span>
              </div>

              <div className="relative rounded-3xl p-6 sm:p-8 bg-white/80 border border-white shadow-2xl backdrop-blur-xl">

                <div className="space-y-4">

                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Live Member Hub
                    </span>

                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LIVE EARNINGS
                    </span>
                  </div>

                  {/* Captcha Stats */}
                  <div className="bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 p-4 rounded-xl border border-violet-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        Today's Captcha Solved
                      </span>

                      <span className="text-slate-800 font-bold">
                        42 / 50 Tasks
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="w-[84%] h-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 rounded-full" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-violet-100 shadow-sm">
                      <div className="text-slate-500 text-[11px]">
                        Direct Team
                      </div>

                      <div className="text-lg font-black text-violet-600 mt-1">
                        14 Members
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                      <div className="text-slate-500 text-[11px]">
                        Wallet Balance
                      </div>

                      <div className="text-lg font-black text-emerald-600 mt-1">
                        ₹3,450.00
                      </div>
                    </div>
                  </div>

                  {/* Captcha Demo */}
                  <div className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 p-4 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1">
                      <Coins className="w-4 h-4 text-emerald-500" />
                      Daily Micro-Task Automation
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal">
                      Solve 50 captchas daily + earn referral commissions
                      from every task your team completes.
                    </p>

                    <Link
                      to="/login"
                      className="mt-3 block text-center py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-105 text-white font-bold text-xs transition-all shadow-sm"
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

      {/* =========================================================
          FEATURE STRIP
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white/70 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Free Shipping
              </h4>
              <p className="text-xs text-slate-500">
                All India Doorstep Delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">
                100% Tax Compliant
              </h4>
              <p className="text-xs text-slate-500">
                Automated 5% TDS with Form 16A
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
              <Coins className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Daily Captcha Rewards
              </h4>
              <p className="text-xs text-slate-500">
                Solve & earn directly into wallet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Genealogy Chain Tree
              </h4>
              <p className="text-xs text-slate-500">
                Real-time downline visualization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================= */}
      <section id="about" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-5">

              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-100 px-3 py-1.5 rounded-full border border-violet-200">
                About DIGITAL LYF PVT. LTD.
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {aboutTitle}
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                {aboutDesc}
              </p>

              <div className="bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 border border-violet-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-sm text-violet-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  Our Mission
                </div>

                <p className="leading-relaxed text-slate-600">
                  {mission}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">

                <div className="p-4 rounded-xl bg-white border border-violet-100 shadow-sm">
                  <div className="text-2xl font-black text-violet-600">
                    15+
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    Years Trust in Wellness
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-cyan-100 shadow-sm">
                  <div className="text-2xl font-black text-cyan-600">
                    24/7
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    Community Helpdesk
                  </div>
                </div>

              </div>
            </div>

            {/* Right Cards */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">

              <div className="space-y-4">

                <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-50 to-cyan-50 border border-emerald-200 shadow-lg">
                  <HeartPulse className="w-8 h-8 text-emerald-500 mb-3" />

                  <h4 className="text-base font-bold text-slate-800">
                    Bio-Magnetic Science
                  </h4>

                  <p className="text-xs text-slate-600 mt-1">
                    Stimulating healthy blood circulation naturally through
                    therapeutic gauss fields.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-lg">
                  <Award className="w-8 h-8 text-orange-500 mb-3" />

                  <h4 className="text-base font-bold text-slate-800">
                    Premium Quality
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Directly manufactured with Neodymium medical magnets and
                    orthopedic foam.
                  </p>
                </div>

              </div>

              <div className="space-y-4 pt-8">

                <div className="p-6 rounded-3xl bg-gradient-to-b from-cyan-50 to-blue-50 border border-cyan-200 shadow-lg">
                  <Coins className="w-8 h-8 text-cyan-500 mb-3" />

                  <h4 className="text-base font-bold text-slate-800">
                    Daily Tasks
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Solve verification captchas for instant daily wallet
                    credits.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-b from-violet-50 to-pink-50 border border-violet-200 shadow-lg">
                  <Users className="w-8 h-8 text-violet-500 mb-3" />

                  <h4 className="text-base font-bold text-slate-800">
                    Downline Tree
                  </h4>

                  <p className="text-xs text-slate-600 mt-1">
                    Interactive genealogy tracking with transparent multi-tier
                    commission logic.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Explorer */}
      <section id="products">
        <InteractiveProductExplorer products={cmsContent?.products} />
      </section>

      {/* Working Process */}
      <WorkingProcessSection steps={cmsContent?.processSteps} />

      {/* =========================================================
          REWARDS CALCULATOR
      ========================================================= */}
      <section
        id="rewards"
        className="py-20 relative bg-gradient-to-br from-violet-50 via-white to-orange-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">

          <div className="text-center max-w-2xl mx-auto mb-14">

            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200">
              Interactive Calculator
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
              Estimate Your{' '}
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">
                Monthly Digital Income
              </span>
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              See how combining daily personal tasks with direct team referrals
              compounds into reliable income.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white/80 border border-white rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              {/* Sliders */}
              <div className="space-y-6">

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                    <span>Direct Team Members:</span>

                    <span className="text-violet-600 text-sm font-black">
                      {directReferrals} Members
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={directReferrals}
                    onChange={(e) =>
                      setDirectReferrals(
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full accent-violet-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 Member</span>
                    <span>25 Members</span>
                    <span>50 Members</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                    <span>Daily Captchas Solved Per Member:</span>

                    <span className="text-cyan-600 text-sm font-black">
                      {dailyCaptchasPerMember} Tasks
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={dailyCaptchasPerMember}
                    onChange={(e) =>
                      setDailyCaptchasPerMember(
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10 Tasks</span>
                    <span>30 Tasks</span>
                    <span>50 Tasks (Max)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-50 to-orange-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div>
                    • Personal Earning (50 tasks/day):{' '}
                    <strong className="text-slate-700">
                      ₹25.00/day
                    </strong>
                  </div>

                  <div>
                    • Team Referral Override:{' '}
                    <strong className="text-slate-700">
                      10% of each team task
                    </strong>
                  </div>

                  <div>
                    • TDS Deducted on Payout:{' '}
                    <strong className="text-slate-700">
                      5% with PAN
                    </strong>
                  </div>
                </div>
              </div>

              {/* Estimated Earnings */}
              <div className="bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl shadow-pink-500/20">

                <div className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Estimated Monthly Income
                </div>

                <div className="text-4xl sm:text-5xl font-black text-white">
                  ₹{estimatedMonthly.toLocaleString('en-IN')}
                </div>

                <div className="text-xs text-white/80">
                  Approx. ₹{Math.round(totalDaily)} / day after team rewards
                </div>

                <div className="pt-2">
                  <Link
                    to="/register"
                    className="block w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-violet-700 hover:bg-slate-50 shadow-lg transition-all"
                  >
                    Start Earning With This Plan
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400">

        <div className="absolute inset-0 bg-white/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">

          <div className="bg-white/95 border border-white/70 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-8">

            <div className="space-y-3 text-center lg:text-left">

              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-100 px-3 py-1 rounded-full border border-violet-200">
                Direct Distributor Career
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Let's Work Together
              </h2>

              <p className="text-slate-600 text-sm max-w-xl">
                Providing real advice, wellness products, and a sustainable
                digital compensation plan. Start with zero barriers today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">

              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Phone className="w-4 h-4 text-violet-600" />
                <span>Call: {phone}</span>
              </a>

              <Link
                to="/register"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
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

