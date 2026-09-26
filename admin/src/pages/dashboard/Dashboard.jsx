
import { useEffect, useState } from "react";
import {
  Activity,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
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
        setStats(response.data.stats);
      } else {
        setStats(response.data);
      }
    } catch (err) {
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
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const cards = [
    {
      title: "Total Customers",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Customers",
      value: stats?.activeUsers ?? 0,
      icon: Activity,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Current Balance",
      value: formatCurrency(stats?.totalCurrentBalance),
      icon: Wallet,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      title: "Captcha Paid",
      value: formatCurrency(stats?.totalCaptchaPaid),
      icon: CircleDollarSign,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Referral Paid",
      value: formatCurrency(stats?.totalReferralPaid),
      icon: IndianRupee,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      title: "Pending Withdrawals",
      value: stats?.pendingWithdrawalsCount ?? 0,
      icon: Clock3,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Sales Count",
      value: stats?.totalSalesCount ?? 0,
      icon: ShoppingCart,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      title: "Sales Volume",
      value: formatCurrency(stats?.totalSalesVolume),
      icon: CircleDollarSign,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your Samarth platform
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchStats()}
            className="font-semibold text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
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

      {/* Additional Overview */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Customers Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Customers Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customer account status
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Total Customers
                </span>

                <span className="font-semibold text-slate-800">
                  {stats?.totalUsers ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Active Customers
                </span>

                <span className="font-semibold text-emerald-600">
                  {stats?.activeUsers ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Paid Customers
                </span>

                <span className="font-semibold text-blue-600">
                  {stats?.paidUsers ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Unpaid Customers
                </span>

                <span className="font-semibold text-orange-600">
                  {stats?.unpaidUsers ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Withdrawal Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Withdrawal Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current withdrawal information
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Pending Requests
                </span>

                <span className="font-semibold text-yellow-600">
                  {stats?.pendingWithdrawalsCount ?? 0}
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

          {/* Financial Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Financial Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Platform financial summary
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  TDS Deducted
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(stats?.totalTdsDeducted)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Admin Fee
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(stats?.totalAdminFee)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Sales Volume
                </span>

                <span className="font-semibold text-blue-600">
                  {formatCurrency(stats?.totalSalesVolume)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">
          Welcome to Samarth Admin Panel 👋
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
          Monitor customers, captcha work, wallets, withdrawals,
          referrals and platform activity from one place.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

