import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

import api from "../../services/api";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

const normalizeStatus = (value) => {
  const status = String(value || "").trim().toLowerCase();

  if (status === "active") {
    return "active";
  }

  return "inactive";
};

const getCustomerName = (user) => {
  return (
    user?.name ||
    user?.fullName ||
    "Unnamed Customer"
  );
};

const getMemberId = (user) => {
  return (
    user?.memberId ||
    user?.userCode ||
    "-"
  );
};

// ============================================================
// STAT CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WALLET DETAIL ITEM
// ============================================================

function WalletDetailItem({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1.5 text-lg font-black ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Wallets() {
  const [users, setUsers] = useState([]);
  const [walletRows, setWalletRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const [selectedWallet, setSelectedWallet] = useState(null);

  // ==========================================================
  // LOAD WALLET DATA
  // ==========================================================

  const loadWallets = useCallback(
    async ({
      silent = false,
    } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        // ----------------------------------------------------
        // LOAD CUSTOMER LIST + ADMIN SUMMARY
        // ----------------------------------------------------

        const [usersResult, statsResult] =
          await Promise.allSettled([
            api.get("/admin/users"),
            api.get("/admin/stats"),
          ]);

        // ----------------------------------------------------
        // USERS
        // ----------------------------------------------------

        if (
          usersResult.status !==
          "fulfilled"
        ) {
          throw new Error(
            usersResult.reason?.response
              ?.data?.message ||
              usersResult.reason?.message ||
              "Failed to load customers."
          );
        }

        const usersData =
          usersResult.value?.data || {};

        if (!usersData.success) {
          throw new Error(
            usersData.message ||
              "Failed to load customers."
          );
        }

        const customerList =
          Array.isArray(
            usersData.users
          )
            ? usersData.users
            : [];

        setUsers(customerList);

        // ----------------------------------------------------
        // CUSTOMER WALLET DETAILS
        // ----------------------------------------------------
        //
        // Existing customer details endpoint already returns
        // wallet-related statistics.
        //
        // ----------------------------------------------------

        const detailResults =
          await Promise.allSettled(
            customerList.map(
              async (customer) => {
                const customerId =
                  customer?._id ||
                  customer?.id;

                if (!customerId) {
                  return {
                    customer,
                    details: null,
                  };
                }

                try {
                  const response =
                    await api.get(
                      `/admin/users/${encodeURIComponent(
                        customerId
                      )}/details`
                    );

                  return {
                    customer,
                    details:
                      response?.data ||
                      null,
                  };
                } catch (detailError) {
                  console.error(
                    "Wallet detail error:",
                    customerId,
                    detailError
                  );

                  return {
                    customer,
                    details: null,
                  };
                }
              }
            )
          );

        const rows =
          detailResults
            .filter(
              (result) =>
                result.status ===
                "fulfilled"
            )
            .map(
              (result) => {
                const {
                  customer,
                  details,
                } =
                  result.value;

                const stats =
                  details?.stats ||
                  details?.statistics ||
                  {};

                const wallet =
                  customer?.wallet ||
                  details?.wallet ||
                  {};

                const currentBalance =
                  Number(
                    stats?.currentBalance ??
                      stats?.walletBalance ??
                      wallet?.currentBalance ??
                      wallet?.balance ??
                      0
                  );

                const totalEarnings =
                  Number(
                    stats?.totalEarnings ??
                      wallet?.totalEarnings ??
                      0
                  );

                const captchaEarnings =
                  Number(
                    stats?.captchaEarnings ??
                      wallet?.captchaEarnings ??
                      0
                  );

                const referralCommissions =
                  Number(
                    stats?.referralCommissions ??
                      wallet?.referralCommissions ??
                      0
                  );

                const binaryIncome =
                  Number(
                    stats?.binaryIncome ??
                      stats?.totalBinaryIncome ??
                      customer?.binaryIncome ??
                      customer?.matchingIncome ??
                      0
                  );

                const totalWithdrawn =
                  Number(
                    stats?.totalWithdrawn ??
                      wallet?.totalWithdrawn ??
                      0
                  );

                const pendingWithdrawal =
                  Number(
                    stats?.pendingWithdrawals ??
                      wallet?.pendingWithdrawals ??
                      0
                  );

                return {
                  id:
                    customer?._id ||
                    customer?.id ||
                    "-",

                  name:
                    getCustomerName(
                      customer
                    ),

                  memberId:
                    getMemberId(
                      customer
                    ),

                  email:
                    customer?.email ||
                    "-",

                  phone:
                    customer?.phone ||
                    customer?.mobile ||
                    "-",

                  status:
                    normalizeStatus(
                      customer?.status
                    ),

                  currentBalance,
                  totalEarnings,
                  captchaEarnings,
                  referralCommissions,
                  binaryIncome,
                  totalWithdrawn,
                  pendingWithdrawal,

                  createdAt:
                    customer?.createdAt ||
                    customer?.joinedAt ||
                    null,

                  updatedAt:
                    wallet?.updatedAt ||
                    details?.wallet?.updatedAt ||
                    customer?.updatedAt ||
                    null,
                };
              }
            );

        setWalletRows(rows);

        // ----------------------------------------------------
        // ADMIN SUMMARY
        // ----------------------------------------------------

        if (
          statsResult.status ===
          "fulfilled"
        ) {
          const statsData =
            statsResult.value?.data ||
            {};

          if (statsData.success) {
            // Summary is kept separately below.
            // No additional state required here because
            // values are derived from walletRows as well.
          }
        }
      } catch (loadError) {
        console.error(
          "Wallet page load error:",
          loadError
        );

        setError(
          loadError?.response?.data
            ?.message ||
            loadError?.message ||
            "Failed to load wallet data."
        );

        setUsers([]);
        setWalletRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // ==========================================================
  // SEARCH + FILTERED DATA
  // ==========================================================

  const filteredRows = useMemo(() => {
    const cleanSearch =
      String(search || "")
        .trim()
        .toLowerCase();

    return walletRows
      .filter((row) => {
        if (
          statusFilter ===
          "all"
        ) {
          return true;
        }

        return (
          row.status ===
          statusFilter
        );
      })
      .filter((row) => {
        if (
          balanceFilter ===
          "all"
        ) {
          return true;
        }

        if (
          balanceFilter ===
          "positive"
        ) {
          return (
            Number(
              row.currentBalance
            ) > 0
          );
        }

        if (
          balanceFilter ===
          "zero"
        ) {
          return (
            Number(
              row.currentBalance
            ) === 0
          );
        }

        return true;
      })
      .filter((row) => {
        if (!cleanSearch) {
          return true;
        }

        return [
          row.memberId,
          row.name,
          row.email,
          row.phone,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(
                cleanSearch
              )
          );
      });
  }, [
    walletRows,
    search,
    statusFilter,
    balanceFilter,
  ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    return walletRows.reduce(
      (accumulator, row) => {
        accumulator.currentBalance +=
          Number(
            row.currentBalance || 0
          );

        accumulator.totalEarnings +=
          Number(
            row.totalEarnings || 0
          );

        accumulator.captchaEarnings +=
          Number(
            row.captchaEarnings || 0
          );

        accumulator.binaryIncome +=
          Number(
            row.binaryIncome || 0
          );

        accumulator.totalWithdrawn +=
          Number(
            row.totalWithdrawn || 0
          );

        return accumulator;
      },
      {
        currentBalance: 0,
        totalEarnings: 0,
        captchaEarnings: 0,
        binaryIncome: 0,
        totalWithdrawn: 0,
      }
    );
  }, [walletRows]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <p className="text-sm font-semibold text-slate-500">
            Loading wallet data...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            <WalletIcon className="h-3.5 w-3.5" />
            Finance Management
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Wallets
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            View customer wallet balances, earnings and
            withdrawal totals in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadWallets({
              silent: true,
            })
          }
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-red-700">
              Unable to load wallet data
            </p>

            <p className="mt-1 break-words text-xs text-red-600">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <SummaryCard
          title="Total Wallet Balance"
          value={formatCurrency(
            summary.currentBalance
          )}
          icon={WalletIcon}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Total Earnings"
          value={formatCurrency(
            summary.totalEarnings
          )}
          icon={IndianRupee}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-700"
        />

        <SummaryCard
          title="CAPTCHA Earnings"
          value={formatCurrency(
            summary.captchaEarnings
          )}
          icon={CheckCircle2}
          iconClass="bg-cyan-50 text-cyan-600"
          valueClass="text-cyan-700"
        />

        <SummaryCard
          title="Binary Income"
          value={formatCurrency(
            summary.binaryIncome
          )}
          icon={TrendingUp}
          iconClass="bg-violet-50 text-violet-600"
          valueClass="text-violet-700"
        />

        <SummaryCard
          title="Total Withdrawn"
          value={formatCurrency(
            summary.totalWithdrawn
          )}
          icon={ArrowDownToLine}
          iconClass="bg-purple-50 text-purple-600"
          valueClass="text-purple-700"
        />

      </div>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search member ID, name, phone or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <select
            value={balanceFilter}
            onChange={(event) =>
              setBalanceFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">
              All Balances
            </option>

            <option value="positive">
              Balance &gt; ₹0
            </option>

            <option value="zero">
              Zero Balance
            </option>
          </select>

        </div>
      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <WalletIcon className="h-5 w-5 text-blue-600" />
              Customer Wallets
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {formatNumber(
                  filteredRows.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {formatNumber(
                  walletRows.length
                )}
              </span>{" "}
              customers.
            </p>
          </div>

        </div>

        {filteredRows.length === 0 ? (
          <div className="p-10 text-center">

            <WalletIcon className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-bold text-slate-600">
              No wallet records found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-[1050px] w-full text-left">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Current Balance
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Total Earnings
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Binary Income
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Withdrawn
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredRows.map(
                  (row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* Customer */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                            {String(
                              row.name || "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-800">
                              {row.name}
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                              {row.memberId}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            row.status ===
                            "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              row.status ===
                              "active"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />

                          {row.status ===
                          "active"
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      {/* Current Balance */}

                      <td className="px-5 py-4 text-right">

                        <p className="text-sm font-black text-slate-900">
                          {formatCurrency(
                            row.currentBalance
                          )}
                        </p>

                      </td>

                      {/* Total Earnings */}

                      <td className="px-5 py-4 text-right">

                        <p className="text-sm font-bold text-emerald-700">
                          {formatCurrency(
                            row.totalEarnings
                          )}
                        </p>

                      </td>

                      {/* Binary Income */}

                      <td className="px-5 py-4 text-right">

                        <p className="text-sm font-bold text-violet-700">
                          {formatCurrency(
                            row.binaryIncome
                          )}
                        </p>

                      </td>

                      {/* Withdrawn */}

                      <td className="px-5 py-4 text-right">

                        <p className="text-sm font-bold text-purple-700">
                          {formatCurrency(
                            row.totalWithdrawn
                          )}
                        </p>

                      </td>

                      {/* Action */}

                      <td className="px-5 py-4 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWallet(
                              row
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}
      </div>

      {/* ====================================================
          WALLET DETAIL MODAL
      ==================================================== */}

      {selectedWallet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* Header */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <WalletIcon className="h-6 w-6 text-blue-600" />
                </div>

                <div className="min-w-0">

                  <h3 className="truncate text-lg font-black text-slate-900">
                    Wallet Details
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedWallet.name}
                    {" · "}
                    <span className="font-bold text-slate-700">
                      {
                        selectedWallet.memberId
                      }
                    </span>
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedWallet(
                    null
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close wallet details"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Customer Info */}

            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold">
                    {selectedWallet.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 break-all text-xs text-slate-500">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    {selectedWallet.email}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>
                    {selectedWallet.phone}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      selectedWallet.status ===
                      "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedWallet.status ===
                        "active"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />

                    {selectedWallet.status ===
                    "active"
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

              </div>

            </div>

            {/* Wallet Values */}

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">

              <WalletDetailItem
                label="Current Balance"
                value={formatCurrency(
                  selectedWallet.currentBalance
                )}
                valueClass="text-blue-700"
              />

              <WalletDetailItem
                label="Total Earnings"
                value={formatCurrency(
                  selectedWallet.totalEarnings
                )}
                valueClass="text-emerald-700"
              />

              <WalletDetailItem
                label="CAPTCHA Earnings"
                value={formatCurrency(
                  selectedWallet.captchaEarnings
                )}
                valueClass="text-cyan-700"
              />

              <WalletDetailItem
                label="Referral Commission"
                value={formatCurrency(
                  selectedWallet.referralCommissions
                )}
                valueClass="text-pink-700"
              />

              <WalletDetailItem
                label="Binary Income"
                value={formatCurrency(
                  selectedWallet.binaryIncome
                )}
                valueClass="text-violet-700"
              />

              <WalletDetailItem
                label="Total Withdrawn"
                value={formatCurrency(
                  selectedWallet.totalWithdrawn
                )}
                valueClass="text-purple-700"
              />

              <WalletDetailItem
                label="Pending Withdrawal"
                value={formatCurrency(
                  selectedWallet.pendingWithdrawal
                )}
                valueClass="text-amber-700"
              />

            </div>

            {/* Footer */}

            <div className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  setSelectedWallet(
                    null
                  )
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
}