import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Settings,
  Calendar,
  Award,
  IndianRupee,
  Users,
  Layers,
  ArrowLeft,
  ArrowRight,
  Copy,
  CreditCard,
  KeyRound,
  Sparkles,
  WalletCards,
  ShieldCheck,
  TrendingUp,
  CircleCheck,
  ArrowUpRight,
  RefreshCw,
  Clock3,
  Activity,
} from "lucide-react";

export default function UserDashboard() {
  const {
    user: authUser,
    wallet: authWallet,
    token,
    logout,
  } = useAuth();

  // ==========================================================
  // LOCAL LIVE DASHBOARD STATE
  // ==========================================================

  const [dashboardUser, setDashboardUser] =
    useState(authUser);

  const [dashboardWallet, setDashboardWallet] =
    useState(authWallet);

  const [captchaStats, setCaptchaStats] =
    useState(null);

  const [referralStats, setReferralStats] =
    useState(null);

  const [directs, setDirects] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [copiedLeft, setCopiedLeft] =
    useState(false);

  const [copiedRight, setCopiedRight] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("dashboard");

  // ==========================================================
  // SYNC CONTEXT DATA
  // ==========================================================

  useEffect(() => {
    if (authUser) {
      setDashboardUser(authUser);
    }

    if (authWallet) {
      setDashboardWallet(authWallet);
    }
  }, [authUser, authWallet]);

  // ==========================================================
  // API HELPER
  // ==========================================================

  const fetchJson = async (
    url,
    options = {}
  ) => {
    const response = await fetch(
      url,
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          `Request failed with status ${response.status}.`
      );
    }

    return data;
  };

  // ==========================================================
  // LOAD COMPLETE CUSTOMER DASHBOARD DATA
  // ==========================================================

  const loadDashboardData = async ({
    showPageLoader = true,
  } = {}) => {
    if (!token) {
      setPageLoading(false);
      return;
    }

    if (showPageLoader) {
      setPageLoading(true);
    } else {
      setRefreshing(true);
    }

    setPageError("");

    try {
      // ------------------------------------------------------
      // STEP 1
      // Get the latest authenticated customer + wallet.
      // ------------------------------------------------------

      const meData =
        await fetchJson(
          "/api/auth/me"
        );

      if (
        meData?.success &&
        meData?.user
      ) {
        setDashboardUser(
          meData.user
        );
      }

      if (
        meData?.success &&
        meData?.wallet
      ) {
        setDashboardWallet(
          meData.wallet
        );
      }

      // ------------------------------------------------------
      // STEP 2
      // Load all page-specific customer data.
      //
      // Promise.allSettled is used so one endpoint failure
      // does not remove all other valid customer data.
      // ------------------------------------------------------

      const results =
        await Promise.allSettled([
          fetchJson(
            "/api/wallet/summary"
          ),

          fetchJson(
            "/api/wallet/transactions"
          ),

          fetchJson(
            "/api/referral/tree"
          ),

          fetchJson(
            "/api/referral/directs"
          ),

          fetchJson(
            "/api/captcha/my-stats"
          ),
        ]);

      const [
        walletResult,
        transactionsResult,
        referralTreeResult,
        directRefsResult,
        captchaResult,
      ] = results;

      // ------------------------------------------------------
      // WALLET SUMMARY
      // ------------------------------------------------------

      if (
        walletResult.status === "fulfilled"
      ) {
        const data =
          walletResult.value;

        if (
          data?.success &&
          data?.wallet
        ) {
          setDashboardWallet(
            data.wallet
          );
        }

        if (
          data?.success &&
          data?.user
        ) {
          setDashboardUser(
            data.user
          );
        }
      }

      // ------------------------------------------------------
      // TRANSACTIONS
      // ------------------------------------------------------

      if (
        transactionsResult.status ===
        "fulfilled"
      ) {
        const data =
          transactionsResult.value;

        setTransactions(
          Array.isArray(
            data?.transactions
          )
            ? data.transactions
            : []
        );
      } else {
        setTransactions([]);
      }

      // ------------------------------------------------------
      // REFERRAL TREE
      // ------------------------------------------------------

      if (
        referralTreeResult.status ===
        "fulfilled"
      ) {
        const data =
          referralTreeResult.value;

        if (data?.success) {
          setReferralStats(
            data.stats || null
          );

          // If the tree endpoint has a fresher user tree,
          // use its root values for customer statistics.
          if (data.tree) {
            setDashboardUser(
              (previous) => ({
                ...previous,
                leftCount:
                  data.tree.leftCount ??
                  previous?.leftCount,
                rightCount:
                  data.tree.rightCount ??
                  previous?.rightCount,
                leftPv:
                  data.tree.leftPv ??
                  previous?.leftPv,
                rightPv:
                  data.tree.rightPv ??
                  previous?.rightPv,
                leftBusiness:
                  data.tree.leftBusiness ??
                  previous?.leftBusiness,
                rightBusiness:
                  data.tree.rightBusiness ??
                  previous?.rightBusiness,
              })
            );
          }
        }
      }

      // ------------------------------------------------------
      // DIRECT REFERRALS
      // ------------------------------------------------------

      if (
        directRefsResult.status ===
        "fulfilled"
      ) {
        const data =
          directRefsResult.value;

        setDirects(
          Array.isArray(
            data?.directs
          )
            ? data.directs
            : []
        );
      } else {
        setDirects([]);
      }

      // ------------------------------------------------------
      // CAPTCHA STATISTICS
      // ------------------------------------------------------

      if (
        captchaResult.status ===
        "fulfilled"
      ) {
        const data =
          captchaResult.value;

        if (
          data?.success &&
          data?.stats
        ) {
          setCaptchaStats(
            data.stats
          );
        }
      } else {
        setCaptchaStats(null);
      }

      // ------------------------------------------------------
      // PARTIAL ERROR INFORMATION
      // ------------------------------------------------------

      const failedRequests =
        results.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      if (
        failedRequests.length > 0
      ) {
        console.warn(
          `${failedRequests.length} dashboard API request(s) failed.`,
          failedRequests.map(
            (item) =>
              item.reason?.message
          )
        );
      }
    } catch (error) {
      console.error(
        "CUSTOMER DASHBOARD LOAD ERROR:",
        error
      );

      setPageError(
        error.message ||
          "Unable to load your customer dashboard."
      );
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================================
  // INITIAL DASHBOARD LOAD
  // ==========================================================

  useEffect(() => {
    if (!token) {
      setPageLoading(false);
      return;
    }

    loadDashboardData({
      showPageLoader: true,
    });
  }, [token]);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatCurrency = (
    value
  ) => {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return "₹0.00";
    }

    return `₹${number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatNumber = (
    value
  ) => {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return "0";
    }

    return number.toLocaleString(
      "en-IN"
    );
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getInitial = () => {
    const name =
      String(
        dashboardUser?.name ||
          ""
      ).trim();

    return name
      ? name
          .charAt(0)
          .toUpperCase()
      : "U";
  };

  const getFirstName = () => {
    const name =
      String(
        dashboardUser?.name ||
          ""
      ).trim();

    if (!name) {
      return "Member";
    }

    return name.split(
      /\s+/
    )[0];
  };

  // ==========================================================
  // COPY REFERRAL LINK
  // ==========================================================

  const copyLink = async (
    text,
    isLeft
  ) => {
    try {
      if (
        navigator?.clipboard
          ?.writeText
      ) {
        await navigator.clipboard.writeText(
          text
        );
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );
      }

      if (isLeft) {
        setCopiedLeft(true);

        setTimeout(() => {
          setCopiedLeft(false);
        }, 2000);
      } else {
        setCopiedRight(true);

        setTimeout(() => {
          setCopiedRight(false);
        }, 2000);
      }
    } catch (error) {
      console.error(
        "COPY REFERRAL LINK ERROR:",
        error
      );
    }
  };

  // ==========================================================
  // CUSTOMER DATA
  // ==========================================================

  const userCode =
    dashboardUser?.userCode ||
    dashboardUser?.memberId ||
    "MEMBER";

  const sponsorCode =
    dashboardUser?.sponsorCode ||
    "-";

  const matchingIncome =
    dashboardUser?.matchingIncome ??
    0;

  const todayMatchingIncome =
    dashboardUser?.todayMatchingIncome ??
    0;

  const franchiseReferralIncome =
    dashboardUser?.franchiseReferralIncome ??
    0;

  const franchiseMatchingIncome =
    dashboardUser?.franchiseMatchingIncome ??
    0;

  const totalIncome =
    dashboardUser?.totalIncome ??
    0;

  const walletBalance =
    dashboardWallet?.currentBalance ??
    dashboardWallet?.balance ??
    captchaStats?.currentBalance ??
    0;

  const leftCount =
    dashboardUser?.leftCount ??
    0;

  const rightCount =
    dashboardUser?.rightCount ??
    0;

  const leftBusiness =
    dashboardUser?.leftBusiness ??
    0;

  const rightBusiness =
    dashboardUser?.rightBusiness ??
    0;

  const totalReferral =
    dashboardUser?.totalReferral ??
    referralStats?.directCount ??
    directs.length ??
    0;

  const activeReferral =
    dashboardUser?.activeReferral ??
    referralStats?.activeDirectCount ??
    0;

  const leftPv =
    dashboardUser?.leftPv ??
    0;

  const rightPv =
    dashboardUser?.rightPv ??
    0;

  const leftCarryForwardPv =
    dashboardUser?.leftCarryForwardPv ??
    0;

  const rightCarryForwardPv =
    dashboardUser?.rightCarryForwardPv ??
    0;

  const totalTeam =
    referralStats?.totalDownline ??
    dashboardUser?.totalTeam ??
    dashboardUser?.teamCount ??
    0;

  const activeTeam =
    dashboardUser?.activeTeam ??
    0;

  const teamPercent =
    Number(
      dashboardUser?.teamPercent ?? 0
    );

  const rank =
    dashboardUser?.rank ||
    "Distributor";

  const userType =
    dashboardUser?.userType ||
    "UNPAID";

  const dateOfEntry =
    dashboardUser?.dateOfEntry;

  const activationDate =
    dashboardUser?.activationDate;

  const joiningPackage =
    dashboardUser?.joiningPackage ||
    "-";

  // ==========================================================
  // CAPTCHA LIVE DATA
  // ==========================================================

  const dailyLimit =
    Number(
      captchaStats?.todayLimit ??
        50
    );

  const todayCaptchaSolved =
    Number(
      captchaStats?.todayCorrect ??
        dashboardWallet?.todayCaptchasSolved ??
        0
    );

  const remainingCaptcha =
    Math.max(
      0,
      Number(
        captchaStats?.remainingToday ??
          dailyLimit -
            todayCaptchaSolved
      )
    );

  const captchaReward =
    Number(
      captchaStats?.captchaReward ??
        0.5
    );

  const captchaEarnings =
    Number(
      captchaStats?.captchaEarnings ??
        dashboardWallet?.captchaEarnings ??
        0
    );

  const referralCommissions =
    Number(
      dashboardWallet?.referralCommissions ??
        0
    );

  const totalWithdrawn =
    Number(
      dashboardWallet?.totalWithdrawn ??
        0
    );

  const totalEarnings =
    Number(
      dashboardWallet?.totalEarnings ??
        0
    );

  const captchaProgress = Math.min(
    100,
    Math.round(
      (todayCaptchaSolved /
        Math.max(
          1,
          dailyLimit
        )) *
        100
    )
  );

  // ==========================================================
  // REFERRAL LINKS
  // ==========================================================

  const origin =
    window.location.origin;

  const leftReferralLink =
    `${origin}/register?ref=${encodeURIComponent(
      userCode
    )}&pos=1`;

  const rightReferralLink =
    `${origin}/register?ref=${encodeURIComponent(
      userCode
    )}&pos=2`;

  // ==========================================================
  // PERSONAL STAT CARDS
  // ==========================================================

  const personalStats =
    useMemo(
      () => [
        {
          label: "User Code",
          value: userCode,
          icon: User,
          iconClass:
            "bg-violet-100 text-violet-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Sponsor Code",
          value: sponsorCode,
          icon: Settings,
          iconClass:
            "bg-pink-100 text-pink-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Date Of Entry",
          value:
            formatDate(
              dateOfEntry
            ),
          icon: Calendar,
          iconClass:
            "bg-orange-100 text-orange-600",
          valueClass: "",
        },
        {
          label: "User Type",
          value: userType,
          icon: ShieldCheck,
          iconClass:
            "bg-cyan-100 text-cyan-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Activation Date",
          value:
            formatDate(
              activationDate
            ),
          icon: Calendar,
          iconClass:
            "bg-emerald-100 text-emerald-600",
          valueClass: "",
        },
        {
          label: "Joining Package",
          value:
            joiningPackage,
          icon: IndianRupee,
          iconClass:
            "bg-amber-100 text-amber-600",
          valueClass: "",
        },
        {
          label: "Left Count",
          value:
            formatNumber(
              leftCount
            ),
          icon: Layers,
          iconClass:
            "bg-violet-100 text-violet-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Right Count",
          value:
            formatNumber(
              rightCount
            ),
          icon: CreditCard,
          iconClass:
            "bg-pink-100 text-pink-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Left Business",
          value:
            formatNumber(
              leftBusiness
            ),
          icon: Users,
          iconClass:
            "bg-orange-100 text-orange-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Right Business",
          value:
            formatNumber(
              rightBusiness
            ),
          icon: Users,
          iconClass:
            "bg-cyan-100 text-cyan-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Total Referral",
          value:
            formatNumber(
              totalReferral
            ),
          icon: Layers,
          iconClass:
            "bg-emerald-100 text-emerald-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Active Referral",
          value:
            formatNumber(
              activeReferral
            ),
          icon: Users,
          iconClass:
            "bg-violet-100 text-violet-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Left PV",
          value:
            formatNumber(
              leftPv
            ),
          icon: Layers,
          iconClass:
            "bg-pink-100 text-pink-600",
          valueClass:
            "font-mono",
        },
        {
          label: "Right PV",
          value:
            formatNumber(
              rightPv
            ),
          icon: Layers,
          iconClass:
            "bg-orange-100 text-orange-600",
          valueClass:
            "font-mono",
        },
        {
          label:
            "Left Carry Forward PV",
          value:
            formatNumber(
              leftCarryForwardPv
            ),
          icon: ArrowLeft,
          iconClass:
            "bg-cyan-100 text-cyan-600",
          valueClass:
            "font-mono",
        },
        {
          label:
            "Right Carry Forward PV",
          value:
            formatNumber(
              rightCarryForwardPv
            ),
          icon: ArrowRight,
          iconClass:
            "bg-emerald-100 text-emerald-600",
          valueClass:
            "font-mono",
        },
      ],
      [
        userCode,
        sponsorCode,
        dateOfEntry,
        activationDate,
        joiningPackage,
        userType,
        leftCount,
        rightCount,
        leftBusiness,
        rightBusiness,
        totalReferral,
        activeReferral,
        leftPv,
        rightPv,
        leftCarryForwardPv,
        rightCarryForwardPv,
      ]
    );

  // ==========================================================
  // LOADING VIEW
  // ==========================================================

  if (
    pageLoading &&
    !dashboardUser
  ) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 px-6">

        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="pointer-events-none absolute right-[-80px] top-10 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-200">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>

          <h2 className="mt-5 text-lg font-black text-slate-900">
            Loading Your Dashboard
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Fetching your latest account, wallet, team and activity data.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800 antialiased font-sans">

      {/* ==================================================
          AMBIENT BACKGROUND
      ================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute right-[-100px] top-20 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[-100px] right-1/4 h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />
      </div>

      {/* ==================================================
          TOP CUSTOMER HEADER
      ================================================== */}

      <header className="relative z-10 border-b border-white/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">

          {/* Brand + Welcome */}

          <div className="flex min-w-0 items-center gap-4">

            <Link
              to="/"
              className="group flex shrink-0 items-center gap-3"
            >
              <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 p-[2px] shadow-lg shadow-violet-200 transition-transform duration-300 group-hover:scale-105">

                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>

              </div>

              <div className="hidden sm:block">

                <div className="text-base font-black tracking-tight text-slate-900">
                  Samarth
                  <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                    India
                  </span>
                </div>

                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Organics & Wellness
                </div>

              </div>
            </Link>

            <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent sm:block" />

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">

                <span className="truncate">
                  Welcome {getFirstName()}
                </span>

                <span className="text-lg">
                  👋
                </span>

                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">
                  {userCode}
                </span>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Here's what's happening with your account today.
              </p>

            </div>
          </div>

          {/* Profile */}

          <div className="flex items-center gap-3 self-end rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm md:self-auto">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-sm font-black text-white shadow-md shadow-violet-200">
              {getInitial()}
            </div>

            <div className="text-right">

              <div className="text-xs font-extrabold text-slate-800">
                {getFirstName()}
              </div>

              <div className="mt-0.5 text-[10px] font-semibold capitalize text-slate-500">
                {rank}
              </div>

            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden text-right sm:block">

              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Wallet
              </div>

              <div className="text-sm font-black text-slate-900">
                {formatCurrency(walletBalance)}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* ==================================================
          CUSTOMER NAVIGATION
      ================================================== */}

      <nav className="relative z-10 border-b border-white/70 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl sm:px-8">

        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto text-xs font-bold">

          <button
            type="button"
            onClick={() =>
              setActiveTab("dashboard")
            }
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 transition-all ${
              activeTab ===
              "dashboard"
                ? "bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 text-white shadow-md shadow-violet-200"
                : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
            }`}
          >
            Dashboard
          </button>

          <Link
            to="/dashboard/profile"
            className="shrink-0 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-violet-50 hover:text-violet-700"
          >
            Profile
          </Link>

          <Link
            to="/dashboard/tree"
            className="shrink-0 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-pink-50 hover:text-pink-700"
          >
            Team
          </Link>

          <Link
            to="/dashboard/captcha"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-emerald-700 ring-1 ring-emerald-100 transition-all hover:bg-emerald-100"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Captcha Workstation
          </Link>

          <Link
            to="/dashboard/wallet"
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-orange-50 hover:text-orange-700"
          >
            <WalletCards className="h-3.5 w-3.5" />
            Withdraw
          </Link>

          <button
            type="button"
            onClick={() =>
              alert(
                `Package pin information will be available here for ${userCode}.`
              )
            }
            className="shrink-0 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-violet-50 hover:text-violet-700"
          >
            Pin Management
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "Franchise application and eligibility details will be available here."
              )
            }
            className="shrink-0 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-pink-50 hover:text-pink-700"
          >
            Add Franchise
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "Package upgrade options will be available here."
              )
            }
            className="shrink-0 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-orange-50 hover:text-orange-700"
          >
            Topup
          </button>

          <button
            type="button"
            onClick={() =>
              loadDashboardData({
                showPageLoader: false,
              })
            }
            disabled={refreshing}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-slate-600 transition-all hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={logout}
            className="ml-auto shrink-0 rounded-xl px-3 py-2.5 font-extrabold text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-700"
          >
            Logout
          </button>

        </div>
      </nav>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-8 lg:py-8">

        {/* Page error */}

        {pageError && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">

            <span>
              {pageError}
            </span>

            <button
              type="button"
              onClick={() =>
                loadDashboardData({
                  showPageLoader: false,
                })
              }
              className="rounded-lg bg-white px-3 py-1.5 font-bold text-red-700 shadow-sm"
            >
              Retry
            </button>

          </div>
        )}

        {/* Live refresh status */}

        {refreshing && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Updating your latest customer data...
          </div>
        )}

        {/* ==================================================
            TITLE
        ================================================== */}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Live Member Portal
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Customer
              <span className="ml-2 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Your account information, wallet, earnings, team and task
              activity are loaded from your customer account.
            </p>

          </div>

          <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-left shadow-sm backdrop-blur sm:text-right">

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Balance
            </div>

            <div className="mt-1 text-xl font-black text-slate-900">
              {formatCurrency(
                walletBalance
              )}
            </div>

            <div className="mt-1 text-[9px] font-semibold text-slate-400">
              Live wallet balance
            </div>

          </div>
        </div>

        {/* ==================================================
            INCOME CARDS
        ================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* Matching */}

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 p-[1px] shadow-lg shadow-orange-100 transition-transform duration-300 hover:-translate-y-1">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 p-5 text-white">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    Matching Income
                  </p>

                  <div className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      matchingIncome
                    )}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <TrendingUp className="h-5 w-5" />
                </div>

              </div>
            </div>
          </div>

          {/* Today's matching */}

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 p-[1px] shadow-lg shadow-violet-100 transition-transform duration-300 hover:-translate-y-1">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 p-5 text-white">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    Today's Matching
                  </p>

                  <div className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      todayMatchingIncome
                    )}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Sparkles className="h-5 w-5" />
                </div>

              </div>
            </div>
          </div>

          {/* Franchise referral */}

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-100 transition-transform duration-300 hover:-translate-y-1">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-blue-600 via-violet-600 to-indigo-600 p-5 text-white">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    Franchise Referral
                  </p>

                  <div className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      franchiseReferralIncome
                    )}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Users className="h-5 w-5" />
                </div>

              </div>
            </div>
          </div>

          {/* Franchise matching */}

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-[1px] shadow-lg shadow-orange-100 transition-transform duration-300 hover:-translate-y-1">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-5 text-white">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    Franchise Matching
                  </p>

                  <div className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      franchiseMatchingIncome
                    )}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <ArrowUpRight className="h-5 w-5" />
                </div>

              </div>
            </div>
          </div>

          {/* Total */}

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-[1px] shadow-lg shadow-emerald-100 transition-transform duration-300 hover:-translate-y-1">

            <div className="relative h-full overflow-hidden rounded-[23px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white">

              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
                    Total Income
                  </p>

                  <div className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      totalIncome
                    )}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <IndianRupee className="h-5 w-5" />
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            CUSTOMER LIVE SNAPSHOT
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Wallet */}

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <WalletCards className="h-5 w-5" />
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm">
                Live
              </span>

            </div>

            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">
              Wallet Balance
            </div>

            <div className="mt-1 text-2xl font-black text-slate-900">
              {formatCurrency(
                walletBalance
              )}
            </div>

          </div>

          {/* Total earnings */}

          <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-5 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <IndianRupee className="h-5 w-5" />
            </div>

            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-violet-700/70">
              Total Wallet Earnings
            </div>

            <div className="mt-1 text-2xl font-black text-slate-900">
              {formatCurrency(
                totalEarnings
              )}
            </div>

          </div>

          {/* CAPTCHA */}

          <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm">
                <KeyRound className="h-5 w-5" />
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-pink-700 shadow-sm">
                {todayCaptchaSolved}
                /{dailyLimit}
              </span>

            </div>

            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-pink-700/70">
              Today's CAPTCHA
            </div>

            <div className="mt-1 text-2xl font-black text-slate-900">
              {todayCaptchaSolved}
            </div>

          </div>

          {/* Referral */}

          <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-5 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
              <Users className="h-5 w-5" />
            </div>

            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-orange-700/70">
              Referral Team
            </div>

            <div className="mt-1 text-2xl font-black text-slate-900">
              {formatNumber(
                totalTeam
              )}
            </div>

          </div>

        </section>

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* ==================================================
              ACCOUNT OVERVIEW
          ================================================== */}

          <div className="xl:col-span-8">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Account Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Information loaded from your customer account.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100 sm:flex">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                Customer Account
              </div>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {personalStats.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={
                        item.label
                      }
                      className="group rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60"
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass} transition-transform duration-300 group-hover:scale-105`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">

                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.label}
                          </div>

                          <div
                            className={`mt-1 truncate text-sm font-black text-slate-900 ${item.valueClass}`}
                          >
                            {item.value}
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                }
              )}

              {/* Rank */}

              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/80 p-4 shadow-sm sm:col-span-2 lg:col-span-2">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600">
                    <Award className="h-5 w-5" />
                  </div>

                  <div>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      My Rank
                    </div>

                    <div className="mt-1 text-base font-black text-slate-900">
                      {rank}
                    </div>

                  </div>
                </div>
              </div>

              {/* Wallet */}

              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">

                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">
                      Wallet Balance
                    </div>

                    <div className="mt-1 truncate text-base font-black text-slate-900">
                      {formatCurrency(
                        walletBalance
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="space-y-5 xl:col-span-4">

            {/* Grow */}

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 p-[1px] shadow-xl shadow-violet-100">

              <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 p-6 text-white">

                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">

                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-black leading-tight">
                    Grow Your Business
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/80">
                    Manage your account and access your available customer
                    portal features.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Upgrade options will be available here."
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Explore Upgrade
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>

                </div>
              </div>
            </div>

            {/* Team summary */}

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Team Summary
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest network statistics.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                  <Users className="h-5 w-5" />
                </div>

              </div>

              <div className="mt-5 space-y-4">

                <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="text-xs font-bold text-slate-500">
                        Total Team
                      </div>

                      <div className="mt-1 text-2xl font-black text-slate-900">
                        {formatNumber(
                          totalTeam
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-black text-violet-600 shadow-sm">
                      {teamPercent}%
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="text-xs font-bold text-slate-500">
                        Active Team
                      </div>

                      <div className="mt-1 text-2xl font-black text-slate-900">
                        {formatNumber(
                          activeTeam
                        )}
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <CircleCheck className="h-4 w-4" />
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* CAPTCHA */}

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">

              <div className="flex items-center justify-between gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <KeyRound className="h-5 w-5" />
                </div>

                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  {remainingCaptcha} Left
                </span>

              </div>

              <h3 className="mt-4 text-base font-black text-slate-900">
                Captcha Workstation
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {todayCaptchaSolved} of{" "}
                {dailyLimit} daily tasks completed.
              </p>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 transition-all"
                  style={{
                    width: `${captchaProgress}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  Reward / task
                </span>

                <span className="font-bold text-emerald-600">
                  {formatCurrency(
                    captchaReward
                  )}
                </span>
              </div>

              <Link
                to="/dashboard/captcha"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-100 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Open Workstation
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

            </div>

          </div>
        </section>

        {/* ==================================================
            WALLET & CAPTCHA SUMMARY
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Wallet */}

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-base font-black text-slate-900">
                  Wallet Summary
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest wallet information.
                </p>
              </div>

              <WalletCards className="h-5 w-5 text-violet-600" />

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-2xl bg-violet-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  Balance
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(
                    walletBalance
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Earnings
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(
                    totalEarnings
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-pink-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  CAPTCHA
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(
                    captchaEarnings
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  Withdrawn
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(
                    totalWithdrawn
                  )}
                </div>
              </div>

            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">

              <div className="flex items-center justify-between gap-3 text-xs">

                <span className="font-semibold text-slate-500">
                  Referral Commissions
                </span>

                <span className="font-black text-slate-900">
                  {formatCurrency(
                    referralCommissions
                  )}
                </span>

              </div>
            </div>

          </div>

          {/* CAPTCHA */}

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-base font-black text-slate-900">
                  CAPTCHA Activity
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Latest task statistics from your account.
                </p>
              </div>

              <Activity className="h-5 w-5 text-pink-600" />

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-2xl bg-violet-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  Today
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {todayCaptchaSolved}
                </div>
              </div>

              <div className="rounded-2xl bg-pink-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  Limit
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {dailyLimit}
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  Remaining
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {remainingCaptcha}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Accuracy
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {Number(
                    captchaStats?.accuracy ??
                      0
                  ).toFixed(2)}
                  %
                </div>
              </div>

            </div>

            <div className="mt-4">

              <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  Today's progress
                </span>

                <span>
                  {captchaProgress}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 transition-all"
                  style={{
                    width: `${captchaProgress}%`,
                  }}
                />
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-lg font-black text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Jump directly to the main areas of your customer portal.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              to="/dashboard/captcha"
              className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-105">
                <KeyRound className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Captcha Workstation
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Complete your available CAPTCHA tasks.
              </p>
            </Link>

            <Link
              to="/dashboard/tree"
              className="group rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-105">
                <Users className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                My Team
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                View your referral tree and direct members.
              </p>
            </Link>

            <Link
              to="/dashboard/wallet"
              className="group rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-transform group-hover:scale-105">
                <WalletCards className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Wallet & Withdrawal
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Check your balance and withdrawal details.
              </p>
            </Link>

            <Link
              to="/dashboard/profile"
              className="group rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-900">
                Profile & KYC
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Manage your profile and KYC information.
              </p>
            </Link>

          </div>
        </section>

        {/* ==================================================
            REFERRAL LINKS
        ================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-lg font-black text-slate-900">
              Referral Links
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Your live referral links are generated from your member code.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* LEFT */}

            <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">

              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-100/50 blur-2xl" />

              <div className="relative">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                      Position 01
                    </div>

                    <h3 className="mt-1 text-base font-black text-slate-900">
                      Left Side Referral
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <ArrowLeft className="h-5 w-5" />
                  </div>

                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                  <input
                    type="text"
                    readOnly
                    value={
                      leftReferralLink
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      copyLink(
                        leftReferralLink,
                        true
                      )
                    }
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all ${
                      copiedLeft
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-violet-600 to-pink-500 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    {copiedLeft ? (
                      <>
                        <CircleCheck className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>

                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">

              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-100/50 blur-2xl" />

              <div className="relative">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                      Position 02
                    </div>

                    <h3 className="mt-1 text-base font-black text-slate-900">
                      Right Side Referral
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                  <input
                    type="text"
                    readOnly
                    value={
                      rightReferralLink
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      copyLink(
                        rightReferralLink,
                        false
                      )
                    }
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all ${
                      copiedRight
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-orange-500 to-pink-500 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    {copiedRight ? (
                      <>
                        <CircleCheck className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            RECENT CUSTOMER TRANSACTIONS
        ================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-7">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>

              <h2 className="text-lg font-black text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest transactions from your customer wallet.
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Activity className="h-5 w-5" />
            </div>

          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Clock3 className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-700">
                No recent transactions
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Your recent wallet activity will appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">

              <table className="w-full min-w-[760px] text-left text-xs">

                <thead className="bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50">

                  <tr className="border-b border-slate-200 text-slate-500">

                    <th className="px-4 py-3 font-extrabold">
                      Type
                    </th>

                    <th className="px-4 py-3 font-extrabold">
                      Description
                    </th>

                    <th className="px-4 py-3 font-extrabold">
                      Amount
                    </th>

                    <th className="px-4 py-3 font-extrabold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-extrabold">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">

                  {transactions
                    .slice(0, 5)
                    .map(
                      (
                        transaction,
                        index
                      ) => {

                        const amount =
                          Number(
                            transaction?.amount ??
                              transaction?.netAmount ??
                              0
                          );

                        const status =
                          String(
                            transaction?.status ||
                              "completed"
                          ).toLowerCase();

                        const isCredit =
                          [
                            "credit",
                            "captcha_reward",
                            "referral_bonus",
                            "completed",
                          ].includes(
                            String(
                              transaction?.type ||
                                ""
                            ).toLowerCase()
                          );

                        return (
                          <tr
                            key={
                              transaction?._id ||
                              `${transaction?.type}-${index}`
                            }
                            className="transition-colors hover:bg-violet-50/30"
                          >

                            <td className="px-4 py-4">

                              <span className="rounded-lg bg-violet-50 px-2.5 py-1 font-mono text-[10px] font-extrabold text-violet-700">
                                {transaction?.type ||
                                  transaction?.category ||
                                  "transaction"}
                              </span>

                            </td>

                            <td className="max-w-[320px] truncate px-4 py-4 font-medium text-slate-600">
                              {transaction?.description ||
                                transaction?.reason ||
                                "Wallet transaction"}
                            </td>

                            <td className="px-4 py-4">

                              <span
                                className={`font-black ${
                                  isCredit
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {isCredit
                                  ? "+"
                                  : "-"}
                                {formatCurrency(
                                  Math.abs(
                                    amount
                                  )
                                )}
                              </span>

                            </td>

                            <td className="px-4 py-4">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                  status ===
                                  "completed"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : status ===
                                      "pending"
                                    ? "border-orange-200 bg-orange-50 text-orange-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >
                                {status}
                              </span>

                            </td>

                            <td className="px-4 py-4 text-slate-500">
                              {formatDateTime(
                                transaction?.createdAt ||
                                  transaction?.timestamp
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )}

                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* ==================================================
            LATEST NEWS
        ================================================== */}

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-violet-100 bg-white/90 p-[1px] shadow-sm">

          <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-violet-50 via-white to-orange-50 p-6">

            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-200/30 blur-3xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="text-base font-black text-slate-900">
                    Latest News
                  </h3>

                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-violet-700">
                    Customer Update
                  </span>

                </div>

                <p className="mt-2 max-w-4xl text-xs leading-6 text-slate-500">
                  Welcome to your Samarth India customer portal. Your
                  dashboard is connected to your account data, wallet,
                  network and task activity.
                </p>

              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            BOTTOM STATUS
        ================================================== */}

        <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 p-[1px] shadow-lg shadow-violet-100">

          <div className="rounded-[23px] bg-white/10 p-5 backdrop-blur">

            <div className="flex flex-col gap-4 text-white sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>

                  <div className="text-sm font-black">
                    Your customer portal is active
                  </div>

                  <div className="mt-0.5 text-[11px] text-white/75">
                    Member ID: {userCode}
                  </div>

                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-white/80">
                <CircleCheck className="h-4 w-4 text-white" />
                Secure Customer Access
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}