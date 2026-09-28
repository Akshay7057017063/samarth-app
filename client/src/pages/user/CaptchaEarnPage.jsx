import React from "react";
import { Link } from "react-router-dom";
import CaptchaWorkstation from "../../components/CaptchaWorkstation";
import {
  ShieldCheck,
  Info,
  TrendingUp,
  Sparkles,
  Clock3,
  CircleCheck,
  ArrowLeft,
  KeyRound,
  WalletCards,
  ArrowUpRight,
} from "lucide-react";

export default function CaptchaEarnPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute right-[-100px] top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[-100px] right-1/4 h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =====================================================
            BACK TO DASHBOARD
        ===================================================== */}

        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm sm:flex">
            <CircleCheck className="h-3.5 w-3.5" />
            Customer Workstation
          </div>
        </div>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-[1px] shadow-xl shadow-violet-100/50 backdrop-blur-xl">

          <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-white via-violet-50/60 to-orange-50/70 px-5 py-7 sm:px-8 sm:py-9">

            {/* Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-1/3 top-1/3 h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative z-10 text-center">

              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Daily Customer Tasks
              </div>

              {/* Heading */}
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Captcha
                <span className="ml-2 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  Earning Workstation
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Complete your available verification tasks through the
                workstation and track your task activity and wallet rewards.
              </p>

              {/* Mini Stats */}
              <div className="mx-auto mt-7 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">

                {/* Daily Tasks */}
                <div className="group rounded-2xl border border-violet-100 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-1 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                    <Clock3 className="h-4 w-4" />
                    Daily Tasks
                  </div>

                  <p className="text-2xl font-black text-slate-900">
                    50
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Available daily limit
                  </p>
                </div>

                {/* Verification */}
                <div className="group rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-1 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                    <CircleCheck className="h-4 w-4" />
                    Verification
                  </div>

                  <p className="text-2xl font-black text-slate-900">
                    Secure
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Task verification enabled
                  </p>
                </div>

                {/* Wallet */}
                <div className="group rounded-2xl border border-pink-100 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-1 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-pink-600">
                    <WalletCards className="h-4 w-4" />
                    Wallet Credit
                  </div>

                  <p className="text-2xl font-black text-slate-900">
                    Direct
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Reward processing
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            WORKSTATION
        ===================================================== */}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 via-pink-200 to-orange-200 p-[1px] shadow-xl shadow-violet-100/50">

          <div className="relative rounded-[23px] bg-white/95 p-2 backdrop-blur sm:p-3">

            {/* Top Gradient Line */}
            <div className="pointer-events-none absolute left-8 right-8 top-0 h-1 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500" />

            <div className="rounded-2xl bg-gradient-to-br from-slate-50/80 via-white to-violet-50/50 p-2 sm:p-3">
              <CaptchaWorkstation />
            </div>
          </div>
        </section>

        {/* =====================================================
            GUIDELINES HEADER
        ===================================================== */}

        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="h-9 w-1 rounded-full bg-gradient-to-b from-violet-500 via-pink-500 to-orange-500" />

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Workstation Guidelines
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Important information for your daily task activity.
            </p>
          </div>
        </div>

        {/* =====================================================
            GUIDELINE CARDS
        ===================================================== */}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">

          {/* Daily Limit */}
          <div className="group relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-[1px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-white to-violet-50/70 p-6">

              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl transition-all group-hover:bg-violet-300/40" />

              <div className="relative z-10">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200">
                  <Clock3 className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Daily Limit
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Each active member can work on the configured daily
                  captcha limit available in the platform.
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Resets Automatically
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-[1px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/60">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-white to-emerald-50/70 p-6">

              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl transition-all group-hover:bg-emerald-300/40" />

              <div className="relative z-10">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Secure Verification
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Task submissions are processed through the platform's
                  verification mechanisms to support fair task handling.
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verification Enabled
                </div>
              </div>
            </div>
          </div>

          {/* Sponsor */}
          <div className="group relative overflow-hidden rounded-3xl border border-pink-100 bg-white p-[1px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/60">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-white to-pink-50/70 p-6">

              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl transition-all group-hover:bg-pink-300/40" />

              <div className="relative z-10">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-200">
                  <TrendingUp className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Sponsor Bonus
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Referral rewards are credited according to the sponsor
                  commission rules configured for the platform.
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-pink-700">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Automatic Processing
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-xl">

              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
                <KeyRound className="h-3.5 w-3.5" />
                Task Flow
              </div>

              <h2 className="text-xl font-black text-slate-900">
                Keep your work simple and consistent
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open the workstation, complete the available task,
                submit the answer and monitor the resulting activity
                through your customer account.
              </p>
            </div>

            <Link
              to="/dashboard/wallet"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              View Wallet
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

          </div>
        </section>

        {/* =====================================================
            INFO STRIP
        ===================================================== */}

        <section className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 p-[1px] shadow-lg shadow-violet-100">

          <div className="relative overflow-hidden rounded-[23px] bg-white/10 px-5 py-5 backdrop-blur sm:px-7">

            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Info className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-sm font-black">
                    Need help with your dashboard?
                  </div>

                  <div className="mt-1 text-[11px] text-white/75">
                    Return to your customer dashboard to access your
                    profile, team and wallet sections.
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-lg transition-all hover:bg-slate-50"
              >
                Open Dashboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

            </div>
          </div>
        </section>

        {/* =====================================================
            BOTTOM RAINBOW STRIP
        ===================================================== */}

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500" />

      </div>
    </div>
  );
}