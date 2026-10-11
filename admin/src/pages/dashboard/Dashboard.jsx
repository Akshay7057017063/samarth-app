import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  GitBranch,
} from "lucide-react";

import api from "../../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/admin/stats");

      if (response.data?.success) {
        setStats(response.data.stats || {});
      } else {
        setStats(
          response.data?.stats ||
            response.data ||
            {}
        );
      }
    } catch (err) {
      console.error(
        "Dashboard stats error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      "en-IN"
    );
  };

  const derivedStats = useMemo(() => {
    const totalUsers = Number(
      stats?.totalUsers || 0
    );

    const activeUsers = Number(
      stats?.activeUsers || 0
    );

    const inactiveUsers = Math.max(
      totalUsers - activeUsers,
      0
    );

    const totalBinaryIncome = Number(
      stats?.totalBinaryIncome ||
        0
    );

    const binaryPairCount = Number(
      stats?.binaryPairCount ||
        0
    );

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalBinaryIncome,
      binaryPairCount,
    };
  }, [stats]);

  const cards = [
    {
      title: "Total Customers",
      value: formatNumber(
        derivedStats.totalUsers
      ),
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },

    {
      title: "Active Customers",
      value: formatNumber(
        derivedStats.activeUsers
      ),
      icon: Activity,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },

    {
      title: "Current Balance",
      value: formatCurrency(
        stats?.totalCurrentBalance
      ),
      icon: Wallet,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },

    {
      title: "Captcha Paid",
      value: formatCurrency(
        stats?.totalCaptchaPaid
      ),
      icon: CircleDollarSign,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },

    {
      title: "Referral Paid",
      value: formatCurrency(
        stats?.totalReferralPaid
      ),
      icon: IndianRupee,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },

    {
      title: "Binary Income",
      value: formatCurrency(
        derivedStats.totalBinaryIncome
      ),
      icon: GitBranch,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },

    {
      title: "Pending Withdrawals",
      value: formatNumber(
        stats?.pendingWithdrawalsCount
      ),
      icon: Clock3,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },

    {
      title: "Sales Count",
      value: formatNumber(
        stats?.totalSalesCount
      ),
      icon: ShoppingCart,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },

    {
      title: "Sales Volume",
      value: formatCurrency(
        stats?.totalSalesVolume
      ),
      icon: TrendingUp,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },

    {
      title: "Binary Pairs",
      value: formatNumber(
        derivedStats.binaryPairCount
      ),
      icon: GitBranch,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your DIGITAL LYF platform
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchStats(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              fetchStats()
            }
            className="self-start font-semibold text-red-700 underline sm:self-auto"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {Array.from({
            length: 10,
          }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ))}

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {cards.map((card) => {
            const Icon =
              card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <p className="mt-3 truncate text-2xl font-bold text-slate-800">
                      {card.value}
                    </p>

                  </div>

                  <div
                    className={`shrink-0 rounded-xl p-3 ${card.iconBg}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${card.iconColor}`}
                    />
                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* =====================================================
          DETAILED OVERVIEW
      ===================================================== */}

      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* =================================================
              CUSTOMERS OVERVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-blue-100 p-2.5">

                <Users className="h-5 w-5 text-blue-600" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Customers Overview
                </h2>

                <p className="text-sm text-slate-500">
                  Customer account status
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Total Customers
                </span>

                <span className="font-semibold text-slate-800">
                  {formatNumber(
                    derivedStats.totalUsers
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Active Customers
                </span>

                <span className="font-semibold text-emerald-600">
                  {formatNumber(
                    derivedStats.activeUsers
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Inactive / Suspended
                </span>

                <span className="font-semibold text-red-600">
                  {formatNumber(
                    derivedStats.inactiveUsers
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Paid Customers
                </span>

                <span className="font-semibold text-blue-600">
                  {formatNumber(
                    stats?.paidUsers
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Unpaid Customers
                </span>

                <span className="font-semibold text-orange-600">
                  {formatNumber(
                    stats?.unpaidUsers
                  )}
                </span>

              </div>

            </div>
          </div>

          {/* =================================================
              WITHDRAWAL OVERVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-yellow-100 p-2.5">

                <ArrowDownToLine className="h-5 w-5 text-yellow-600" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Withdrawal Overview
                </h2>

                <p className="text-sm text-slate-500">
                  Current withdrawal information
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Pending Requests
                </span>

                <span className="font-semibold text-yellow-600">
                  {formatNumber(
                    stats?.pendingWithdrawalsCount
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Pending Amount
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(
                    stats?.pendingWithdrawalsNet
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Total Withdrawn
                </span>

                <span className="font-semibold text-blue-600">
                  {formatCurrency(
                    stats?.totalWithdrawnPaid
                  )}
                </span>

              </div>

            </div>
          </div>

          {/* =================================================
              FINANCIAL OVERVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-emerald-100 p-2.5">

                <CircleDollarSign className="h-5 w-5 text-emerald-600" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Financial Overview
                </h2>

                <p className="text-sm text-slate-500">
                  Platform financial summary
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  TDS Deducted
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(
                    stats?.totalTdsDeducted
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Admin Fee
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(
                    stats?.totalAdminFee
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Sales Volume
                </span>

                <span className="font-semibold text-blue-600">
                  {formatCurrency(
                    stats?.totalSalesVolume
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Captcha Earnings
                </span>

                <span className="font-semibold text-orange-600">
                  {formatCurrency(
                    stats?.totalCaptchaPaid
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Referral Earnings
                </span>

                <span className="font-semibold text-pink-600">
                  {formatCurrency(
                    stats?.totalReferralPaid
                  )}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm font-semibold text-cyan-600">
                  Binary Income
                </span>

                <span className="font-bold text-cyan-700">
                  {formatCurrency(
                    derivedStats.totalBinaryIncome
                  )}
                </span>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* =====================================================
          BINARY INCOME OVERVIEW
      ===================================================== */}

      {!loading && (
        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-cyan-100 p-3">

                <GitBranch className="h-6 w-6 text-cyan-700" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Binary Income Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Binary pair completion and income credited to customers
                </p>

              </div>

            </div>

            <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3 text-right shadow-sm">

              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total Binary Income
              </div>

              <div className="mt-1 text-xl font-black text-cyan-700">
                {formatCurrency(
                  derivedStats.totalBinaryIncome
                )}
              </div>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-cyan-100">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completed Pairs
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {formatNumber(
                  derivedStats.binaryPairCount
                )}
              </p>

            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-cyan-100">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Income Per Pair
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-600">
                ₹450.00
              </p>

            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-cyan-100">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Calculation
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {formatNumber(
                  derivedStats.binaryPairCount
                )} × ₹450
              </p>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          PLATFORM SUMMARY
      ===================================================== */}

      {!loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Platform Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Live information from the DIGITAL LYFbackend
              </p>

            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-600">

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              Backend Connected

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Current Balance
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {formatCurrency(
                  stats?.totalCurrentBalance
                )}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Captcha Paid
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {formatCurrency(
                  stats?.totalCaptchaPaid
                )}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Referral Paid
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {formatCurrency(
                  stats?.totalReferralPaid
                )}
              </p>

            </div>

            <div className="rounded-xl bg-cyan-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Total Binary Income
              </p>

              <p className="mt-2 text-xl font-bold text-cyan-700">
                {formatCurrency(
                  derivedStats.totalBinaryIncome
                )}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Withdrawn
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {formatCurrency(
                  stats?.totalWithdrawnPaid
                )}
              </p>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          WELCOME BANNER
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-xl font-bold">
              Welcome to DIGITAL LYFAdmin Panel 👋
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Monitor customers, captcha work, wallets, withdrawals,
              referrals, binary income and platform activity from one place.
            </p>

          </div>

          <div className="hidden rounded-2xl bg-white/10 p-4 sm:block">

            <Wallet className="h-10 w-10 text-white" />

          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;