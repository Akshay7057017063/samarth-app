import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  const { user } = useAuth();

  /*
   * Zero PIN (UNPAID PIN) members do not have CAPTCHA access.
   * The backend also blocks them; this only avoids showing the
   * workstation and a confusing error to those members.
   */
  const isZeroPinUser =
    String(user?.userType ?? "").trim().toLowerCase() === "unpaid";

  if (isZeroPinUser) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 px-4 text-slate-800">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="absolute right-[-100px] top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="absolute bottom-[-100px] right-1/4 h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <KeyRound className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-xl font-black text-slate-900">
            Captcha Workstation Not Available
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            CAPTCHA work is not available for accounts activated with a free
            (zero) PIN. You can still register new members and use your
            binary team and wallet.
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        relative
        min-h-screen
        w-full
        overflow-x-hidden
        bg-gradient-to-br
        from-violet-50
        via-white
        to-orange-50
        text-slate-800
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="absolute right-[-100px] top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="absolute bottom-[-100px] right-1/4 h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />
      </div>

      {/* =====================================================
          PAGE CONTAINER
      ===================================================== */}

      <main
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-7xl
          px-3
          pb-8
          pt-4

          sm:px-6
          sm:pt-6

          lg:px-8
          lg:pb-12
          lg:pt-8
        "
      >
        {/* ===================================================
            TOP NAV
        =================================================== */}

        <div className="mb-3 flex items-center justify-between sm:mb-5">
          <Link
            to="/dashboard"
            className="
              inline-flex
              min-h-[40px]
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white/95
              px-3
              py-2
              text-[11px]
              font-bold
              text-slate-600
              shadow-sm
              transition-all
              hover:-translate-y-0.5
              hover:border-violet-200
              hover:bg-violet-50
              hover:text-violet-700

              sm:px-3.5
              sm:py-2.5
              sm:text-xs
            "
          >
            <ArrowLeft className="h-3.5 w-3.5" />

            <span>
              Back to Dashboard
            </span>
          </Link>

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              border
              border-emerald-100
              bg-white/90
              px-3
              py-1.5
              text-[10px]
              font-extrabold
              uppercase
              tracking-wider
              text-emerald-700
              shadow-sm

              sm:flex
            "
          >
            <CircleCheck className="h-3.5 w-3.5" />

            Customer Workstation
          </div>
        </div>

        {/* ===================================================
            MOBILE-FIRST WORKSTATION
            IMPORTANT:
            On mobile this comes BEFORE the large hero.
        =================================================== */}

        <section
          className="
            relative
            mb-5
            w-full
            min-w-0
            overflow-visible
            rounded-3xl
            bg-gradient-to-r
            from-violet-200
            via-pink-200
            to-orange-200
            p-[1px]
            shadow-xl
            shadow-violet-100/50

            sm:mb-8
          "
        >
          <div
            className="
              relative
              min-w-0
              rounded-[23px]
              bg-white/95
              p-1.5
              backdrop-blur

              sm:p-3
            "
          >
            {/* Top Gradient Line */}

            <div
              className="
                pointer-events-none
                absolute
                left-5
                right-5
                top-0
                h-1
                rounded-full
                bg-gradient-to-r
                from-violet-500
                via-pink-500
                to-orange-500

                sm:left-8
                sm:right-8
              "
            />

            {/* WORKSTATION CONTAINER */}

            <div
              className="
                min-w-0
                rounded-2xl
                bg-gradient-to-br
                from-slate-50/80
                via-white
                to-violet-50/50
                p-0.5

                sm:p-3
              "
            >
              <CaptchaWorkstation />
            </div>
          </div>
        </section>

        {/* ===================================================
            PAGE HEADER
            MOBILE SECONDARY
        =================================================== */}

        <section
          className="
            relative
            mb-5
            min-w-0
            overflow-hidden
            rounded-3xl
            border
            border-white/80
            bg-white/90
            p-[1px]
            shadow-xl
            shadow-violet-100/50
            backdrop-blur-xl

            sm:mb-7
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[23px]
              bg-gradient-to-br
              from-white
              via-violet-50/60
              to-orange-50/70
              px-4
              py-5

              sm:px-8
              sm:py-9
            "
          >
            {/* GLOW */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-300/25 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="pointer-events-none absolute right-1/3 top-1/3 h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative z-10 text-center">
              {/* BADGE */}

              <div
                className="
                  mb-3
                  inline-flex
                  max-w-full
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-violet-100
                  bg-white/90
                  px-3
                  py-1.5
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-[0.15em]
                  text-violet-700
                  shadow-sm

                  sm:mb-4
                  sm:px-4
                  sm:py-2
                  sm:text-[10px]
                "
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                Daily Customer Tasks
              </div>

              {/* HEADING */}

              <h1
                className="
                  mx-auto
                  max-w-3xl
                  text-2xl
                  font-black
                  leading-tight
                  tracking-tight
                  text-slate-900

                  sm:text-4xl

                  lg:text-5xl
                "
              >
                Captcha{" "}

                <span
                  className="
                    bg-gradient-to-r
                    from-violet-600
                    via-pink-500
                    to-orange-500
                    bg-clip-text
                    text-transparent
                  "
                >
                  Earning Workstation
                </span>
              </h1>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-2xl
                  text-xs
                  leading-5
                  text-slate-500

                  sm:mt-4
                  sm:text-base
                  sm:leading-6
                "
              >
                Complete your available verification tasks through the
                workstation and track your task activity and wallet rewards.
              </p>

              {/* =================================================
                  MINI STATS
              ================================================= */}

              <div
                className="
                  mx-auto
                  mt-5
                  grid
                  max-w-4xl
                  grid-cols-3
                  gap-2

                  sm:mt-7
                  sm:gap-3
                "
              >
                {/* DAILY */}

                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-violet-100
                    bg-white/90
                    p-2.5
                    shadow-sm

                    sm:p-4
                  "
                >
                  <div
                    className="
                      mb-1
                      flex
                      items-center
                      justify-center
                      gap-1
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-wide
                      text-violet-600

                      sm:gap-2
                      sm:text-[10px]
                    "
                  >
                    <Clock3 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                    <span className="truncate">
                      Daily Tasks
                    </span>
                  </div>

                  <p className="text-lg font-black text-slate-900 sm:text-2xl">
                    50
                  </p>

                  <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                    Available daily limit
                  </p>
                </div>

                {/* VERIFICATION */}

                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-emerald-100
                    bg-white/90
                    p-2.5
                    shadow-sm

                    sm:p-4
                  "
                >
                  <div
                    className="
                      mb-1
                      flex
                      items-center
                      justify-center
                      gap-1
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-wide
                      text-emerald-600

                      sm:gap-2
                      sm:text-[10px]
                    "
                  >
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                    <span className="truncate">
                      Verification
                    </span>
                  </div>

                  <p className="text-lg font-black text-slate-900 sm:text-2xl">
                    Secure
                  </p>

                  <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                    Task verification enabled
                  </p>
                </div>

                {/* WALLET */}

                <div
                  className="
                    min-w-0
                    rounded-2xl
                    border
                    border-pink-100
                    bg-white/90
                    p-2.5
                    shadow-sm

                    sm:p-4
                  "
                >
                  <div
                    className="
                      mb-1
                      flex
                      items-center
                      justify-center
                      gap-1
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-wide
                      text-pink-600

                      sm:gap-2
                      sm:text-[10px]
                    "
                  >
                    <WalletCards className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                    <span className="truncate">
                      Wallet Credit
                    </span>
                  </div>

                  <p className="text-lg font-black text-slate-900 sm:text-2xl">
                    Direct
                  </p>

                  <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                    Reward processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            GUIDELINES HEADER
        =================================================== */}

        <div className="mb-3 flex items-center gap-3 px-1 sm:mb-4">
          <div className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-500 via-pink-500 to-orange-500 sm:h-9" />

          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              Workstation Guidelines
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:mt-1 sm:text-xs">
              Important information for your daily task activity.
            </p>
          </div>
        </div>

        {/* ===================================================
            GUIDELINE CARDS
        =================================================== */}

        <section className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-3">
          {/* DAILY LIMIT */}

          <div
            className="
              group
              relative
              min-w-0
              overflow-hidden
              rounded-3xl
              border
              border-violet-100
              bg-white
              p-[1px]
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:shadow-violet-100/60
            "
          >
            <div
              className="
                relative
                h-full
                overflow-hidden
                rounded-[23px]
                bg-gradient-to-br
                from-white
                to-violet-50/70
                p-5

                sm:p-6
              "
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl transition-all group-hover:bg-violet-300/40" />

              <div className="relative z-10">
                <div
                  className="
                    mb-4
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-violet-500
                    to-fuchsia-500
                    text-white
                    shadow-lg
                    shadow-violet-200

                    sm:mb-5
                    sm:h-12
                    sm:w-12
                  "
                >
                  <Clock3 className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Daily Limit
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Each active member can work on the configured daily
                  captcha limit available in the platform.
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-700 sm:mt-5">
                  <CircleCheck className="h-3.5 w-3.5" />

                  Resets Automatically
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY */}

          <div
            className="
              group
              relative
              min-w-0
              overflow-hidden
              rounded-3xl
              border
              border-emerald-100
              bg-white
              p-[1px]
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:shadow-emerald-100/60
            "
          >
            <div
              className="
                relative
                h-full
                overflow-hidden
                rounded-[23px]
                bg-gradient-to-br
                from-white
                to-emerald-50/70
                p-5

                sm:p-6
              "
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl transition-all group-hover:bg-emerald-300/40" />

              <div className="relative z-10">
                <div
                  className="
                    mb-4
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-emerald-500
                    to-cyan-500
                    text-white
                    shadow-lg
                    shadow-emerald-200

                    sm:mb-5
                    sm:h-12
                    sm:w-12
                  "
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Secure Verification
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Task submissions are processed through the platform's
                  verification mechanisms to support fair task handling.
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 sm:mt-5">
                  <ShieldCheck className="h-3.5 w-3.5" />

                  Verification Enabled
                </div>
              </div>
            </div>
          </div>

          {/* SPONSOR */}

          <div
            className="
              group
              relative
              min-w-0
              overflow-hidden
              rounded-3xl
              border
              border-pink-100
              bg-white
              p-[1px]
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
              hover:shadow-pink-100/60
            "
          >
            <div
              className="
                relative
                h-full
                overflow-hidden
                rounded-[23px]
                bg-gradient-to-br
                from-white
                to-pink-50/70
                p-5

                sm:p-6
              "
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl transition-all group-hover:bg-pink-300/40" />

              <div className="relative z-10">
                <div
                  className="
                    mb-4
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-pink-500
                    to-orange-500
                    text-white
                    shadow-lg
                    shadow-pink-200

                    sm:mb-5
                    sm:h-12
                    sm:w-12
                  "
                >
                  <TrendingUp className="h-5 w-5" />
                </div>

                <h3 className="text-base font-black text-slate-900">
                  Sponsor Bonus
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Referral rewards are credited according to the sponsor
                  commission rules configured for the platform.
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-pink-700 sm:mt-5">
                  <CircleCheck className="h-3.5 w-3.5" />

                  Automatic Processing
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          className="
            mt-5
            overflow-hidden
            rounded-3xl
            border
            border-slate-200/70
            bg-white/90
            p-4
            shadow-sm
            backdrop-blur

            sm:mt-8
            sm:p-7
          "
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
            <div className="max-w-xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-violet-700 sm:text-[10px]">
                <KeyRound className="h-3.5 w-3.5" />

                Task Flow
              </div>

              <h2 className="text-lg font-black text-slate-900 sm:text-xl">
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
              className="
                inline-flex
                min-h-[46px]
                w-full
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-violet-600
                via-pink-500
                to-orange-500
                px-5
                py-3
                text-xs
                font-extrabold
                text-white
                shadow-lg
                shadow-violet-200
                transition-all
                hover:-translate-y-0.5
                hover:shadow-xl

                sm:w-auto
              "
            >
              View Wallet

              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* ===================================================
            INFO STRIP
        =================================================== */}

        <section
          className="
            relative
            mt-5
            overflow-hidden
            rounded-3xl
            bg-gradient-to-r
            from-violet-600
            via-pink-500
            to-orange-500
            p-[1px]
            shadow-lg
            shadow-violet-100

            sm:mt-8
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[23px]
              bg-white/10
              px-4
              py-4
              backdrop-blur

              sm:px-7
              sm:py-5
            "
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3 text-white sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Info className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black">
                    Need help with your dashboard?
                  </div>

                  <div className="mt-1 text-[10px] leading-4 text-white/75 sm:text-[11px]">
                    Return to your customer dashboard to access your
                    profile, team and wallet sections.
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="
                  inline-flex
                  min-h-[44px]
                  w-full
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-4
                  py-2.5
                  text-xs
                  font-extrabold
                  text-violet-700
                  shadow-lg
                  transition-all
                  hover:bg-slate-50

                  sm:w-auto
                "
              >
                Open Dashboard

                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================
            BOTTOM RAINBOW
        =================================================== */}

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 sm:mt-8" />
      </main>
    </div>
  );
}