import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import api from "../../services/api";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionDate = (transaction) => {
  return (
    transaction?.createdAt ||
    transaction?.timestamp ||
    transaction?.date ||
    transaction?.requestedAt ||
    null
  );
};

const getUserId = (user) => {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    ""
  );
};

const getWithdrawalUserId = (withdrawal) => {
  return (
    withdrawal?.userId?._id ||
    withdrawal?.userId ||
    withdrawal?.customerId ||
    ""
  );
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ============================================================
// EARNING TYPE
// ============================================================

const getEarningType = (record) => {
  const referenceKey =
    String(
      record?.referenceKey ||
        record?.referenceId ||
        record?.transaction?.referenceKey ||
        ""
    )
      .trim()
      .toLowerCase();

  const rawValue =
    String(
      record?.earningType ||
        record?.incomeType ||
        record?.earningCategory ||
        record?.incomeCategory ||
        record?.source ||
        record?.category ||
        record?.transactionType ||
        record?.transaction?.earningType ||
        record?.transaction?.incomeType ||
        record?.transaction?.source ||
        record?.transaction?.category ||
        ""
    )
      .trim()
      .toLowerCase();

  const combinedValue = `${rawValue} ${referenceKey}`;

  if (
    combinedValue.includes("captcha") ||
    combinedValue.includes("captcha_reward")
  ) {
    return "captcha";
  }

  if (
    combinedValue.includes("referral") ||
    combinedValue.includes("referral_commission")
  ) {
    return "referral";
  }

  if (
    combinedValue.includes("direct") ||
    combinedValue.includes("direct_income") ||
    combinedValue.includes("direct_commission")
  ) {
    return "direct";
  }

  return "other";
};

const getEarningTypeLabel = (type) => {
  switch (type) {
    case "captcha":
      return "CAPTCHA Earning";

    case "referral":
      return "Referral Earning";

    case "direct":
      return "Direct Earning";

    default:
      return "Other";
  }
};

const getEarningTypeClasses = (type) => {
  switch (type) {
    case "captcha":
      return "bg-violet-100 text-violet-700";

    case "referral":
      return "bg-blue-100 text-blue-700";

    case "direct":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  const config = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700",
      icon: Clock3,
    },

    approved: {
      label: "Approved",
      className:
        "bg-blue-100 text-blue-700",
      icon: CheckCircle2,
    },

    completed: {
      label: "Paid",
      className:
        "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    },

    rejected: {
      label: "Rejected",
      className:
        "bg-red-100 text-red-700",
      icon: XCircle,
    },
  };

  const current =
    config[normalized] || {
      label:
        normalized
          ? normalized
              .charAt(0)
              .toUpperCase() +
            normalized.slice(1)
          : "Unknown",

      className:
        "bg-slate-100 text-slate-700",

      icon: Clock3,
    };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${current.className}`}
    >
      <Icon className="h-3.5 w-3.5" />

      {current.label}
    </span>
  );
}

// ============================================================
// EARNING TYPE BADGE
// ============================================================

function EarningTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getEarningTypeClasses(
        type
      )}`}
    >
      {getEarningTypeLabel(type)}
    </span>
  );
}

// ============================================================
// SUMMARY CARD
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
      <div className="flex items-start justify-between gap-3">
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
// MAIN COMPONENT
// ============================================================

export default function PaymentReport() {
  const [withdrawals, setWithdrawals] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] =
    useState("");

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [earningTypeFilter, setEarningTypeFilter] =
    useState("all");

  const [yearFilter, setYearFilter] =
    useState("all");

  const [monthFilter, setMonthFilter] =
    useState("all");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // ==========================================================
  // LOAD REPORT DATA
  // ==========================================================

  const loadReport = useCallback(
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

        const [
          withdrawalsResult,
          usersResult,
        ] = await Promise.all([
          api.get("/admin/withdrawals"),
          api.get("/admin/users"),
        ]);

        const withdrawalData =
          withdrawalsResult?.data || {};

        const userData =
          usersResult?.data || {};

        if (!withdrawalData.success) {
          throw new Error(
            withdrawalData.message ||
              "Failed to load payment report."
          );
        }

        if (!userData.success) {
          throw new Error(
            userData.message ||
              "Failed to load customer data."
          );
        }

        setWithdrawals(
          Array.isArray(
            withdrawalData.withdrawals
          )
            ? withdrawalData.withdrawals
            : []
        );

        setUsers(
          Array.isArray(
            userData.users
          )
            ? userData.users
            : []
        );
      } catch (loadError) {
        console.error(
          "Payment report load error:",
          loadError
        );

        setError(
          loadError?.response?.data
            ?.message ||
            loadError?.message ||
            "Failed to load payment report."
        );
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
    loadReport();
  }, [loadReport]);

  // ==========================================================
  // USER MAP
  // ==========================================================

  const userMap = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      const id = String(
        getUserId(user)
      );

      if (id) {
        map.set(id, user);
      }
    });

    return map;
  }, [users]);

  // ==========================================================
  // MERGED REPORT ROWS
  // ==========================================================

  const reportRows = useMemo(() => {
    return withdrawals.map(
      (withdrawal) => {
        const withdrawalUserId =
          getWithdrawalUserId(
            withdrawal
          );

        const user =
          userMap.get(
            String(
              withdrawalUserId
            )
          ) || null;

        const transactionBank =
          withdrawal?.bankDetails ||
          withdrawal?.bank ||
          {};

        const userBank =
          user?.bankDetails ||
          {};

        const bankDetails = {
          accountHolderName:
            transactionBank?.accountHolderName ||
            userBank?.accountHolderName ||
            user?.name ||
            "",

          accountNumber:
            transactionBank?.accountNumber ||
            userBank?.accountNumber ||
            "",

          ifscCode:
            transactionBank?.ifscCode ||
            userBank?.ifscCode ||
            "",

          bankName:
            transactionBank?.bankName ||
            userBank?.bankName ||
            "",

          upiId:
            transactionBank?.upiId ||
            userBank?.upiId ||
            "",
        };

        const grossAmount =
          toNumber(
            withdrawal?.grossAmount ??
              withdrawal?.amount ??
              0
          );

        const tdsAmount =
          toNumber(
            withdrawal?.tdsAmount
          );

        const adminFee =
          toNumber(
            withdrawal?.adminFee
          );

        const netAmount =
          toNumber(
            withdrawal?.netAmount ??
              Math.max(
                0,
                grossAmount -
                  tdsAmount -
                  adminFee
              )
          );

        const earningType =
          getEarningType(
            withdrawal
          );

        return {
          id:
            withdrawal?._id ||
            `${withdrawalUserId}-${getTransactionDate(
              withdrawal
            )}`,

          memberId:
            withdrawal?.memberId ||
            user?.memberId ||
            user?.userCode ||
            "-",

          name:
            withdrawal?.name ||
            withdrawal?.customerName ||
            user?.name ||
            user?.fullName ||
            "Customer",

          phone:
            withdrawal?.phone ||
            withdrawal?.mobile ||
            user?.phone ||
            user?.mobile ||
            "-",

          email:
            withdrawal?.email ||
            user?.email ||
            "-",

          userId:
            withdrawalUserId,

          status:
            String(
              withdrawal?.status ||
                "pending"
            ).toLowerCase(),

          earningType,

          earningTypeLabel:
            getEarningTypeLabel(
              earningType
            ),

          date:
            getTransactionDate(
              withdrawal
            ),

          grossAmount,

          tdsAmount,

          adminFee,

          netAmount,

          accountHolderName:
            bankDetails.accountHolderName,

          accountNumber:
            bankDetails.accountNumber,

          ifscCode:
            bankDetails.ifscCode,

          bankName:
            bankDetails.bankName,

          upiId:
            bankDetails.upiId,

          transactionId:
            withdrawal?._id ||
            withdrawal?.transactionId ||
            "-",

          reason:
            withdrawal?.reason ||
            withdrawal?.remark ||
            withdrawal?.description ||
            "",

          panNumber:
            withdrawal?.panNumber ||
            user?.panNumber ||
            "",
        };
      }
    );
  }, [
    withdrawals,
    userMap,
  ]);

  // ==========================================================
  // AVAILABLE YEARS
  // ==========================================================

  const availableYears = useMemo(() => {
    const years = new Set();

    reportRows.forEach((row) => {
      if (!row.date) {
        return;
      }

      const date =
        new Date(row.date);

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        years.add(
          date.getFullYear()
        );
      }
    });

    return Array.from(years)
      .sort(
        (a, b) => b - a
      );
  }, [reportRows]);

  // ==========================================================
  // FILTERED REPORT
  // ==========================================================

  const filteredRows = useMemo(() => {
    const cleanSearch =
      String(search || "")
        .trim()
        .toLowerCase();

    return reportRows
      // ------------------------------------------------------
      // STATUS
      // ------------------------------------------------------
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

      // ------------------------------------------------------
      // EARNING TYPE
      // ------------------------------------------------------
      .filter((row) => {
        if (
          earningTypeFilter ===
          "all"
        ) {
          return true;
        }

        return (
          row.earningType ===
          earningTypeFilter
        );
      })

      // ------------------------------------------------------
      // YEAR
      // ------------------------------------------------------
      .filter((row) => {
        if (
          yearFilter ===
          "all"
        ) {
          return true;
        }

        if (!row.date) {
          return false;
        }

        const date =
          new Date(row.date);

        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          String(
            date.getFullYear()
          ) ===
            String(yearFilter)
        );
      })

      // ------------------------------------------------------
      // MONTH
      // ------------------------------------------------------
      .filter((row) => {
        if (
          monthFilter ===
          "all"
        ) {
          return true;
        }

        if (!row.date) {
          return false;
        }

        const date =
          new Date(row.date);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return false;
        }

        return (
          date.getMonth() + 1 ===
          Number(monthFilter)
        );
      })

      // ------------------------------------------------------
      // FROM DATE
      // ------------------------------------------------------
      .filter((row) => {
        if (!fromDate) {
          return true;
        }

        if (!row.date) {
          return false;
        }

        const rowDate =
          new Date(row.date);

        const startDate =
          new Date(
            `${fromDate}T00:00:00`
          );

        return (
          !Number.isNaN(
            rowDate.getTime()
          ) &&
          rowDate >= startDate
        );
      })

      // ------------------------------------------------------
      // TO DATE
      // ------------------------------------------------------
      .filter((row) => {
        if (!toDate) {
          return true;
        }

        if (!row.date) {
          return false;
        }

        const rowDate =
          new Date(row.date);

        const endDate =
          new Date(
            `${toDate}T23:59:59.999`
          );

        return (
          !Number.isNaN(
            rowDate.getTime()
          ) &&
          rowDate <= endDate
        );
      })

      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------
      .filter((row) => {
        if (!cleanSearch) {
          return true;
        }

        return [
          row.memberId,
          row.name,
          row.phone,
          row.email,
          row.accountNumber,
          row.ifscCode,
          row.upiId,
          row.earningTypeLabel,
          row.transactionId,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(
                cleanSearch
              )
          );
      })

      // ------------------------------------------------------
      // SORT
      // ------------------------------------------------------
      .sort((a, b) => {
        const first =
          new Date(
            a.date || 0
          ).getTime();

        const second =
          new Date(
            b.date || 0
          ).getTime();

        return second - first;
      });
  }, [
    reportRows,
    statusFilter,
    earningTypeFilter,
    yearFilter,
    monthFilter,
    fromDate,
    toDate,
    search,
  ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (accumulator, row) => {
        accumulator.grossAmount +=
          row.grossAmount;

        accumulator.tdsAmount +=
          row.tdsAmount;

        accumulator.adminFee +=
          row.adminFee;

        accumulator.netAmount +=
          row.netAmount;

        if (
          row.status ===
          "pending"
        ) {
          accumulator.pending +=
            row.netAmount;
        }

        if (
          row.status ===
          "approved"
        ) {
          accumulator.approved +=
            row.netAmount;
        }

        if (
          row.status ===
          "completed"
        ) {
          accumulator.completed +=
            row.netAmount;
        }

        if (
          row.earningType ===
          "captcha"
        ) {
          accumulator.captcha +=
            row.netAmount;
        }

        if (
          row.earningType ===
          "referral"
        ) {
          accumulator.referral +=
            row.netAmount;
        }

        if (
          row.earningType ===
          "direct"
        ) {
          accumulator.direct +=
            row.netAmount;
        }

        return accumulator;
      },
      {
        grossAmount: 0,
        tdsAmount: 0,
        adminFee: 0,
        netAmount: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        captcha: 0,
        referral: 0,
        direct: 0,
      }
    );
  }, [filteredRows]);

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setEarningTypeFilter("all");
    setYearFilter("all");
    setMonthFilter("all");
    setFromDate("");
    setToDate("");
  };

  // ==========================================================
  // EXCEL EXPORT
  // ==========================================================

  const handleExport = async () => {
    if (
      filteredRows.length ===
      0
    ) {
      return;
    }

    try {
      setExporting(true);

      const rows = filteredRows.map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>

            <td>${escapeHtml(
              formatDate(row.date)
            )}</td>

            <td>${escapeHtml(
              row.memberId
            )}</td>

            <td>${escapeHtml(
              row.name
            )}</td>

            <td>${escapeHtml(
              row.phone
            )}</td>

            <td>${escapeHtml(
              row.email
            )}</td>

            <td>${escapeHtml(
              row.earningTypeLabel
            )}</td>

            <td>${escapeHtml(
              row.accountHolderName
            )}</td>

            <td>${escapeHtml(
              row.bankName
            )}</td>

            <td>${escapeHtml(
              row.accountNumber
            )}</td>

            <td>${escapeHtml(
              row.ifscCode
            )}</td>

            <td>${escapeHtml(
              row.upiId
            )}</td>

            <td>${row.grossAmount.toFixed(
              2
            )}</td>

            <td>${row.tdsAmount.toFixed(
              2
            )}</td>

            <td>${row.adminFee.toFixed(
              2
            )}</td>

            <td>${row.netAmount.toFixed(
              2
            )}</td>

            <td>${escapeHtml(
              row.status
            )}</td>

            <td>${escapeHtml(
              row.transactionId
            )}</td>

            <td>${escapeHtml(
              row.reason
            )}</td>
          </tr>
        `
      ).join("");

      const filterText = [
        yearFilter !== "all"
          ? `Year-${yearFilter}`
          : "",

        monthFilter !== "all"
          ? `Month-${String(
              monthFilter
            ).padStart(2, "0")}`
          : "",

        earningTypeFilter !== "all"
          ? `Earning-${earningTypeFilter}`
          : "",

        fromDate
          ? `From-${fromDate}`
          : "",

        toDate
          ? `To-${toDate}`
          : "",

        statusFilter !== "all"
          ? `Status-${statusFilter}`
          : "",
      ]
        .filter(Boolean)
        .join("_");

      const fileName =
        `DIGITAL_LYF_Bank_Payment_Report_${
          filterText ||
          "All"
        }.xls`;

      const html = `
        <html>

          <head>

            <meta charset="UTF-8" />

            <style>

              body {
                font-family: Arial, sans-serif;
              }

              h1 {
                font-size: 18px;
              }

              .meta {
                margin-bottom: 14px;
                font-size: 12px;
              }

              table {
                border-collapse: collapse;
                width: 100%;
              }

              th,
              td {
                border: 1px solid #cbd5e1;
                padding: 6px 8px;
                font-size: 11px;
                text-align: left;
              }

              th {
                background: #e2e8f0;
                font-weight: bold;
              }

            </style>

          </head>

          <body>

            <h1>
              DIGITAL LYF PVT. LTD. - Bank Payment Report
            </h1>

            <div class="meta">
              Generated:
              ${escapeHtml(
                formatDateTime(
                  new Date()
                )
              )}
            </div>

            <div class="meta">
              Total Records:
              ${filteredRows.length}

              &nbsp;&nbsp;|&nbsp;&nbsp;

              Total Net Payable:
              ₹${summary.netAmount.toFixed(
                2
              )}
            </div>

            <table>

              <thead>

                <tr>

                  <th>S.No.</th>

                  <th>Payment Date</th>

                  <th>Member ID</th>

                  <th>Customer Name</th>

                  <th>Mobile</th>

                  <th>Email</th>

                  <th>Earning Type</th>

                  <th>Account Holder</th>

                  <th>Bank Name</th>

                  <th>Account Number</th>

                  <th>IFSC</th>

                  <th>UPI ID</th>

                  <th>Gross Amount</th>

                  <th>TDS</th>

                  <th>Admin Fee</th>

                  <th>Net Payable</th>

                  <th>Status</th>

                  <th>Transaction ID</th>

                  <th>Remark</th>

                </tr>

              </thead>

              <tbody>

                ${rows}

              </tbody>

            </table>

          </body>

        </html>
      `;

      const blob =
        new Blob(
          [html],
          {
            type:
              "application/vnd.ms-excel;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        fileName;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    } catch (exportError) {
      console.error(
        "Payment report export error:",
        exportError
      );
    } finally {
      setExporting(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="flex flex-col items-center gap-3 text-center">

          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <p className="text-sm font-semibold text-slate-500">
            Loading payment report...
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

            <FileSpreadsheet className="h-3.5 w-3.5" />

            Bank Payment Tracking

          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Payment Report
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Track customer withdrawals and prepare bank-ready
            payment records for processing.
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              loadReport({
                silent: true,
              })
            }
            disabled={
              refreshing ||
              exporting
            }
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

          <button
            type="button"
            onClick={
              handleExport
            }
            disabled={
              exporting ||
              filteredRows.length ===
                0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            Download Bank Excel

          </button>

        </div>

      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div className="min-w-0">

            <p className="text-sm font-bold text-red-700">
              Unable to load payment report
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
          title="Records"
          value={filteredRows.length}
          icon={FileSpreadsheet}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Gross Amount"
          value={formatCurrency(
            summary.grossAmount
          )}
          icon={IndianRupee}
          iconClass="bg-slate-100 text-slate-600"
        />

        <SummaryCard
          title="TDS + Admin Fee"
          value={formatCurrency(
            summary.tdsAmount +
              summary.adminFee
          )}
          icon={IndianRupee}
          iconClass="bg-orange-50 text-orange-600"
          valueClass="text-orange-700"
        />

        <SummaryCard
          title="Net Payable"
          value={formatCurrency(
            summary.netAmount
          )}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-700"
        />

        <SummaryCard
          title="Already Paid"
          value={formatCurrency(
            summary.completed
          )}
          icon={CheckCircle2}
          iconClass="bg-cyan-50 text-cyan-600"
          valueClass="text-cyan-700"
        />

      </div>

      {/* ====================================================
          EARNING SUMMARY
      ==================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">

          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
            CAPTCHA Earning
          </p>

          <p className="mt-2 text-xl font-black text-violet-800">
            {formatCurrency(
              summary.captcha
            )}
          </p>

        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Referral Earning
          </p>

          <p className="mt-2 text-xl font-black text-blue-800">
            {formatCurrency(
              summary.referral
            )}
          </p>

        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Direct Earning
          </p>

          <p className="mt-2 text-xl font-black text-emerald-800">
            {formatCurrency(
              summary.direct
            )}
          </p>

        </div>

      </div>

      {/* ====================================================
          FILTER PANEL
      ==================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-base font-bold text-slate-900">
              Report Filters
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Filter by earning type, date, month, year,
              payment status or customer.
            </p>

          </div>

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >

            <X className="h-3.5 w-3.5" />

            Clear Filters

          </button>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">

          {/* Search */}

          <div className="relative xl:col-span-2">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Member ID, name, phone, email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />

          </div>

          {/* Status */}

          <select
            value={
              statusFilter
            }
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

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved / Bank Ready
            </option>

            <option value="completed">
              Paid / Completed
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>

          {/* Earning Type */}

          <select
            value={
              earningTypeFilter
            }
            onChange={(event) =>
              setEarningTypeFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          >

            <option value="all">
              All Earnings
            </option>

            <option value="captcha">
              CAPTCHA Earning
            </option>

            <option value="referral">
              Referral Earning
            </option>

            <option value="direct">
              Direct Earning
            </option>

          </select>

          {/* Year */}

          <select
            value={
              yearFilter
            }
            onChange={(event) =>
              setYearFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >

            <option value="all">
              All Years
            </option>

            {availableYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}

          </select>

          {/* Month */}

          <select
            value={
              monthFilter
            }
            onChange={(event) =>
              setMonthFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >

            <option value="all">
              All Months
            </option>

            <option value="1">
              January
            </option>

            <option value="2">
              February
            </option>

            <option value="3">
              March
            </option>

            <option value="4">
              April
            </option>

            <option value="5">
              May
            </option>

            <option value="6">
              June
            </option>

            <option value="7">
              July
            </option>

            <option value="8">
              August
            </option>

            <option value="9">
              September
            </option>

            <option value="10">
              October
            </option>

            <option value="11">
              November
            </option>

            <option value="12">
              December
            </option>

          </select>

          {/* From Date */}

          <div className="relative">

            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={
                fromDate
              }
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              title="From date"
            />

          </div>

        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

          {/* To Date */}

          <div className="relative">

            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={
                toDate
              }
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              title="To date"
            />

          </div>

          {/* Info */}

          <div className="flex items-center rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">

            <div className="min-w-0">

              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Earning Type
              </p>

              <p className="mt-1 text-xs leading-5 text-violet-700">
                Choose CAPTCHA, Referral or Direct earning
                to filter the payment report.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-base font-bold text-slate-900">
              Payment Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">

              Showing{" "}

              <span className="font-bold text-slate-700">
                {filteredRows.length}
              </span>{" "}

              payment records.

            </p>

          </div>

          <div className="text-xs font-semibold text-slate-500">

            Net Payable:{" "}

            <span className="font-black text-emerald-700">

              {formatCurrency(
                summary.netAmount
              )}

            </span>

          </div>

        </div>

        {filteredRows.length ===
        0 ? (

          <div className="p-10 text-center">

            <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-bold text-slate-600">
              No payment records found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Change the filters and try again.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[1580px] w-full text-left">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Earning Type
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Bank Details
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Gross
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    TDS
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Admin Fee
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Net Payable
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Transaction
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredRows.map(
                  (row) => (

                    <tr
                      key={
                        row.id
                      }
                      className="transition hover:bg-slate-50"
                    >

                      {/* Date */}

                      <td className="whitespace-nowrap px-5 py-4 align-top">

                        <p className="text-sm font-bold text-slate-800">

                          {formatDate(
                            row.date
                          )}

                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">

                          {formatDateTime(
                            row.date
                          )}

                        </p>

                      </td>

                      {/* Customer */}

                      <td className="px-5 py-4 align-top">

                        <p className="text-sm font-bold text-slate-800">
                          {row.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-blue-600">
                          {row.memberId}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {row.phone}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {row.email}
                        </p>

                      </td>

                      {/* Earning Type */}

                      <td className="px-5 py-4 align-top">

                        <EarningTypeBadge
                          type={
                            row.earningType
                          }
                        />

                      </td>

                      {/* Bank */}

                      <td className="px-5 py-4 align-top">

                        <p className="text-sm font-bold text-slate-800">

                          {row.accountHolderName ||
                            row.name}

                        </p>

                        <p className="mt-1 text-xs text-slate-500">

                          {row.bankName ||
                            "Bank not provided"}

                        </p>

                        <p className="mt-1 font-mono text-xs font-semibold text-slate-700">

                          {row.accountNumber ||
                            "Account not provided"}

                        </p>

                        <p className="mt-1 font-mono text-[11px] font-bold text-slate-500">

                          IFSC:{" "}

                          {row.ifscCode ||
                            "-"}

                        </p>

                        {row.upiId ? (

                          <p className="mt-1 text-[11px] font-semibold text-violet-600">

                            UPI:{" "}

                            {row.upiId}

                          </p>

                        ) : null}

                      </td>

                      {/* Gross */}

                      <td className="whitespace-nowrap px-5 py-4 text-right align-top text-sm font-bold text-slate-700">

                        {formatCurrency(
                          row.grossAmount
                        )}

                      </td>

                      {/* TDS */}

                      <td className="whitespace-nowrap px-5 py-4 text-right align-top text-sm font-bold text-orange-700">

                        {formatCurrency(
                          row.tdsAmount
                        )}

                      </td>

                      {/* Fee */}

                      <td className="whitespace-nowrap px-5 py-4 text-right align-top text-sm font-bold text-red-600">

                        {formatCurrency(
                          row.adminFee
                        )}

                      </td>

                      {/* Net */}

                      <td className="whitespace-nowrap px-5 py-4 text-right align-top">

                        <p className="text-sm font-black text-emerald-700">

                          {formatCurrency(
                            row.netAmount
                          )}

                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Bank payment
                        </p>

                      </td>

                      {/* Status */}

                      <td className="whitespace-nowrap px-5 py-4 text-center align-top">

                        <StatusBadge
                          status={
                            row.status
                          }
                        />

                      </td>

                      {/* Transaction */}

                      <td className="px-5 py-4 align-top">

                        <p className="max-w-[220px] break-all font-mono text-[11px] font-semibold text-slate-500">

                          {row.transactionId}

                        </p>

                        {row.reason ? (

                          <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-400">

                            {row.reason}

                          </p>

                        ) : null}

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
          PAYMENT STATUS SUMMARY
      ==================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <Clock3 className="h-5 w-5 text-amber-600" />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Pending
              </p>

              <p className="mt-1 text-xl font-black text-amber-800">

                {formatCurrency(
                  summary.pending
                )}

              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <CheckCircle2 className="h-5 w-5 text-blue-600" />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Approved / Bank Ready
              </p>

              <p className="mt-1 text-xl font-black text-blue-800">

                {formatCurrency(
                  summary.approved
                )}

              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <CheckCircle2 className="h-5 w-5 text-emerald-600" />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Paid / Completed
              </p>

              <p className="mt-1 text-xl font-black text-emerald-800">

                {formatCurrency(
                  summary.completed
                )}

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          FOOTER NOTE
      ==================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex items-start gap-3">

          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

          <div>

            <p className="text-sm font-bold text-slate-800">
              Bank Payment Workflow
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">

              Filter the required period, earning type and payment
              status, verify customer bank details and download the
              filtered Excel-compatible report.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}