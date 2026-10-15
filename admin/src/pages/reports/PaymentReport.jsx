import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import api from "../../services/api";

// ============================================================
// CONSTANTS
// ============================================================

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionDate = (transaction) =>
  transaction?.createdAt ||
  transaction?.timestamp ||
  transaction?.date ||
  transaction?.requestedAt ||
  null;

const getUserId = (user) =>
  user?._id || user?.id || user?.userId || "";

const getWithdrawalUserId = (withdrawal) =>
  withdrawal?.userId?._id ||
  withdrawal?.userId ||
  withdrawal?.customerId ||
  "";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Text cell: keeps leading zeros and long account numbers intact in Excel.
const textCell = (value) =>
  `<td style="mso-number-format:'\\@'">${escapeHtml(value)}</td>`;

const csvCell = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// ============================================================
// BANK DETAILS
// ============================================================
//
// IMPORTANT: bank details are taken as ONE complete set.
//
// 1. The details saved on the withdrawal (what the customer
//    had when requesting the payout), if it has an account
//    number or UPI ID.
// 2. Otherwise the customer's current profile details.
//
// Fields are never mixed between the two sources, so an
// account number can never be paired with another bank's IFSC.
//
// ============================================================

const resolveBankDetails = (withdrawal, user) => {
  const snapshot = withdrawal?.bankDetails || withdrawal?.bank || {};
  const profile = user?.bankDetails || {};

  const snapshotHasData = Boolean(snapshot.accountNumber || snapshot.upiId);
  const profileHasData = Boolean(profile.accountNumber || profile.upiId);

  const source = snapshotHasData ? snapshot : profile;

  return {
    source: snapshotHasData
      ? "withdrawal"
      : profileHasData
      ? "profile"
      : "none",

    details: {
      accountHolderName: String(source.accountHolderName || "").trim(),
      accountNumber: String(source.accountNumber || "").trim(),
      ifscCode: String(source.ifscCode || "").trim().toUpperCase(),
      bankName: String(source.bankName || "").trim(),
      upiId: String(source.upiId || "").trim(),
    },
  };
};

const isBankTransferReady = (bank) =>
  Boolean(bank.accountNumber && IFSC_REGEX.test(bank.ifscCode));

// ============================================================
// EARNING TYPE
// ============================================================

const getEarningType = (record) => {
  const referenceKey = String(
    record?.referenceKey ||
      record?.referenceId ||
      record?.transaction?.referenceKey ||
      ""
  )
    .trim()
    .toLowerCase();

  const rawValue = String(
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

  if (combinedValue.includes("captcha")) return "captcha";
  if (combinedValue.includes("referral")) return "referral";
  if (combinedValue.includes("direct")) return "direct";

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
// SMALL COMPONENTS
// ============================================================

function StatusBadge({ status }) {
  const normalized = String(status || "").trim().toLowerCase();

  const config = {
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700",
      icon: Clock3,
    },
    approved: {
      label: "Approved",
      className: "bg-blue-100 text-blue-700",
      icon: CheckCircle2,
    },
    completed: {
      label: "Paid",
      className: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700",
      icon: XCircle,
    },
  };

  const current = config[normalized] || {
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Unknown",
    className: "bg-slate-100 text-slate-700",
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

function EarningTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getEarningTypeClasses(
        type
      )}`}
    >
      {getEarningTypeLabel(type)}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  note,
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

          <p className={`mt-2 break-words text-2xl font-black ${valueClass}`}>
            {value}
          </p>

          {note ? (
            <p className="mt-1 text-[11px] font-semibold text-slate-400">
              {note}
            </p>
          ) : null}
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

function CopyButton({ value, label, copied, onCopy }) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={onCopy}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PaymentReport() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // "" | "bank-excel" | "bank-csv" | "full"
  const [exporting, setExporting] = useState("");

  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // ----------------------------------------------------------
  // FILTERS
  // Default = approved (bank ready) because that is the list
  // that is given to the bank for transfer.
  // ----------------------------------------------------------

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [earningTypeFilter, setEarningTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ==========================================================
  // LOAD REPORT DATA
  // ==========================================================

  const loadReport = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [withdrawalsResult, usersResult] = await Promise.all([
        api.get("/admin/withdrawals"),
        api.get("/admin/users"),
      ]);

      const withdrawalData = withdrawalsResult?.data || {};
      const userData = usersResult?.data || {};

      if (!withdrawalData.success) {
        throw new Error(
          withdrawalData.message || "Failed to load payment report."
        );
      }

      if (!userData.success) {
        throw new Error(
          userData.message || "Failed to load customer data."
        );
      }

      setWithdrawals(
        Array.isArray(withdrawalData.withdrawals)
          ? withdrawalData.withdrawals
          : []
      );

      setUsers(Array.isArray(userData.users) ? userData.users : []);
    } catch (loadError) {
      console.error("Payment report load error:", loadError);

      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Failed to load payment report."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ==========================================================
  // COPY TO CLIPBOARD
  // ==========================================================

  const handleCopy = useCallback(async (text, key) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedKey(key);

      setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 1500);
    } catch (copyError) {
      console.error("Copy failed:", copyError);
    }
  }, []);

  // ==========================================================
  // USER MAP
  // ==========================================================

  const userMap = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      const id = String(getUserId(user));

      if (id) map.set(id, user);
    });

    return map;
  }, [users]);

  // ==========================================================
  // MERGED REPORT ROWS
  // ==========================================================

  const reportRows = useMemo(() => {
    return withdrawals.map((withdrawal) => {
      const withdrawalUserId = getWithdrawalUserId(withdrawal);

      const user = userMap.get(String(withdrawalUserId)) || null;

      const name =
        withdrawal?.name ||
        withdrawal?.customerName ||
        user?.name ||
        user?.fullName ||
        "Customer";

      const { details: bank, source: bankSource } = resolveBankDetails(
        withdrawal,
        user
      );

      const grossAmount = toNumber(
        withdrawal?.grossAmount ?? withdrawal?.amount ?? 0
      );

      const tdsAmount = toNumber(withdrawal?.tdsAmount);
      const adminFee = toNumber(withdrawal?.adminFee);

      const netAmount = toNumber(
        withdrawal?.netAmount ??
          Math.max(0, grossAmount - tdsAmount - adminFee)
      );

      const earningType = getEarningType(withdrawal);

      const bankReady = isBankTransferReady(bank);

      return {
        id:
          withdrawal?._id ||
          `${withdrawalUserId}-${getTransactionDate(withdrawal)}`,

        memberId:
          withdrawal?.memberId || user?.memberId || user?.userCode || "-",

        name,

        phone:
          withdrawal?.phone ||
          withdrawal?.mobile ||
          user?.phone ||
          user?.mobile ||
          "-",

        email: withdrawal?.email || user?.email || "-",

        userId: withdrawalUserId,

        status: String(withdrawal?.status || "pending").toLowerCase(),

        earningType,
        earningTypeLabel: getEarningTypeLabel(earningType),

        date: getTransactionDate(withdrawal),

        grossAmount,
        tdsAmount,
        adminFee,
        netAmount,

        // Beneficiary = name that must match the bank account
        accountHolderName: bank.accountHolderName || name,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        bankName: bank.bankName,
        upiId: bank.upiId,

        bankSource,
        bankReady,
        upiOnly: !bankReady && Boolean(bank.upiId),

        transactionId:
          withdrawal?._id || withdrawal?.transactionId || "-",

        reason:
          withdrawal?.reason ||
          withdrawal?.remark ||
          withdrawal?.description ||
          "",
      };
    });
  }, [withdrawals, userMap]);

  // ==========================================================
  // AVAILABLE YEARS
  // ==========================================================

  const availableYears = useMemo(() => {
    const years = new Set();

    reportRows.forEach((row) => {
      if (!row.date) return;

      const date = new Date(row.date);

      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [reportRows]);

  // ==========================================================
  // FILTERED REPORT
  // ==========================================================

  const filteredRows = useMemo(() => {
    const cleanSearch = String(search || "").trim().toLowerCase();

    const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const endDate = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return reportRows
      .filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) {
          return false;
        }

        if (
          earningTypeFilter !== "all" &&
          row.earningType !== earningTypeFilter
        ) {
          return false;
        }

        const needsDate =
          yearFilter !== "all" ||
          monthFilter !== "all" ||
          startDate ||
          endDate;

        if (needsDate) {
          if (!row.date) return false;

          const rowDate = new Date(row.date);

          if (Number.isNaN(rowDate.getTime())) return false;

          if (
            yearFilter !== "all" &&
            String(rowDate.getFullYear()) !== String(yearFilter)
          ) {
            return false;
          }

          if (
            monthFilter !== "all" &&
            rowDate.getMonth() + 1 !== Number(monthFilter)
          ) {
            return false;
          }

          if (startDate && rowDate < startDate) return false;
          if (endDate && rowDate > endDate) return false;
        }

        if (cleanSearch) {
          const matches = [
            row.memberId,
            row.name,
            row.accountHolderName,
            row.phone,
            row.email,
            row.accountNumber,
            row.ifscCode,
            row.bankName,
            row.upiId,
            row.earningTypeLabel,
            row.transactionId,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(cleanSearch)
            );

          if (!matches) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
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
  // BANK TRANSFER LIST
  // Only approved + complete bank details + amount > 0.
  // Paid, rejected and pending rows are never sent to the bank.
  // ==========================================================

  const transferRows = useMemo(
    () =>
      filteredRows.filter(
        (row) =>
          row.status === "approved" && row.bankReady && row.netAmount > 0
      ),
    [filteredRows]
  );

  const transferTotal = useMemo(
    () => transferRows.reduce((sum, row) => sum + row.netAmount, 0),
    [transferRows]
  );

  const incompleteApprovedCount = useMemo(
    () =>
      filteredRows.filter(
        (row) => row.status === "approved" && !row.bankReady
      ).length,
    [filteredRows]
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.grossAmount += row.grossAmount;
        acc.tdsAmount += row.tdsAmount;
        acc.adminFee += row.adminFee;
        acc.netAmount += row.netAmount;

        if (row.status === "pending") acc.pending += row.netAmount;
        if (row.status === "approved") acc.approved += row.netAmount;
        if (row.status === "completed") acc.completed += row.netAmount;

        if (row.earningType === "captcha") acc.captcha += row.netAmount;
        if (row.earningType === "referral") acc.referral += row.netAmount;
        if (row.earningType === "direct") acc.direct += row.netAmount;

        return acc;
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
  // EXPORTS
  // ==========================================================

  const buildFileSuffix = () =>
    [
      yearFilter !== "all" ? `Year-${yearFilter}` : "",
      monthFilter !== "all"
        ? `Month-${String(monthFilter).padStart(2, "0")}`
        : "",
      earningTypeFilter !== "all" ? `Earning-${earningTypeFilter}` : "",
      fromDate ? `From-${fromDate}` : "",
      toDate ? `To-${toDate}` : "",
      statusFilter !== "all" ? `Status-${statusFilter}` : "",
    ]
      .filter(Boolean)
      .join("_") || "All";

  const buildExcelHtml = ({ title, metaLines, headers, bodyRows }) => `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { font-size: 18px; }
          .meta { margin-bottom: 8px; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-size: 11px;
            text-align: left;
          }
          th { background: #e2e8f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${metaLines
          .map((line) => `<div class="meta">${escapeHtml(line)}</div>`)
          .join("")}
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `;

  const handleExport = (kind) => {
    const isBank = kind === "bank-excel" || kind === "bank-csv";
    const sourceRows = isBank ? transferRows : filteredRows;

    if (sourceRows.length === 0) return;

    try {
      setExporting(kind);

      const suffix = buildFileSuffix();
      const generated = formatDateTime(new Date());

      // --------------------------------------------------
      // BANK TRANSFER SHEET (CSV)
      // --------------------------------------------------

      if (kind === "bank-csv") {
        const header = [
          "S.No",
          "Member ID",
          "Beneficiary Name",
          "Bank Name",
          "Account Number",
          "IFSC Code",
          "Amount",
          "Narration",
          "Transaction ID",
        ];

        const lines = [
          header.map(csvCell).join(","),
          ...sourceRows.map((row, index) =>
            [
              index + 1,
              row.memberId,
              row.accountHolderName,
              row.bankName,
              row.accountNumber,
              row.ifscCode,
              row.netAmount.toFixed(2),
              `Payout ${row.memberId}`,
              row.transactionId,
            ]
              .map(csvCell)
              .join(",")
          ),
        ];

        // BOM so Excel reads the file as UTF-8
        downloadFile(
          `\uFEFF${lines.join("\r\n")}`,
          `DIGITAL_LYF_Bank_Transfer_${suffix}.csv`,
          "text/csv;charset=utf-8;"
        );

        return;
      }

      // --------------------------------------------------
      // BANK TRANSFER SHEET (EXCEL)
      // --------------------------------------------------

      if (kind === "bank-excel") {
        const bodyRows =
          sourceRows
            .map(
              (row, index) => `
          <tr>
            <td>${index + 1}</td>
            ${textCell(row.memberId)}
            ${textCell(row.accountHolderName)}
            ${textCell(row.bankName)}
            ${textCell(row.accountNumber)}
            ${textCell(row.ifscCode)}
            <td>${row.netAmount.toFixed(2)}</td>
            ${textCell(`Payout ${row.memberId}`)}
            ${textCell(row.transactionId)}
          </tr>`
            )
            .join("") +
          `
          <tr>
            <td colspan="6"><b>Total</b></td>
            <td><b>${transferTotal.toFixed(2)}</b></td>
            <td colspan="2"></td>
          </tr>`;

        const html = buildExcelHtml({
          title: "DIGITAL LYF PVT. LTD. - Bank Transfer Sheet",
          metaLines: [
            `Generated: ${generated}`,
            `Total Transfers: ${sourceRows.length}   |   Total Amount: ₹${transferTotal.toFixed(
              2
            )}`,
          ],
          headers: [
            "S.No.",
            "Member ID",
            "Beneficiary Name",
            "Bank Name",
            "Account Number",
            "IFSC Code",
            "Amount (INR)",
            "Narration",
            "Transaction ID",
          ],
          bodyRows,
        });

        downloadFile(
          html,
          `DIGITAL_LYF_Bank_Transfer_${suffix}.xls`,
          "application/vnd.ms-excel;charset=utf-8;"
        );

        return;
      }

      // --------------------------------------------------
      // FULL REPORT (all filtered rows)
      // --------------------------------------------------

      const bodyRows = sourceRows
        .map(
          (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(formatDate(row.date))}</td>
          ${textCell(row.memberId)}
          ${textCell(row.name)}
          ${textCell(row.phone)}
          ${textCell(row.email)}
          ${textCell(row.earningTypeLabel)}
          ${textCell(row.accountHolderName)}
          ${textCell(row.bankName)}
          ${textCell(row.accountNumber)}
          ${textCell(row.ifscCode)}
          ${textCell(row.upiId)}
          <td>${row.grossAmount.toFixed(2)}</td>
          <td>${row.tdsAmount.toFixed(2)}</td>
          <td>${row.adminFee.toFixed(2)}</td>
          <td>${row.netAmount.toFixed(2)}</td>
          ${textCell(row.status)}
          ${textCell(row.transactionId)}
          ${textCell(row.reason)}
        </tr>`
        )
        .join("");

      const html = buildExcelHtml({
        title: "DIGITAL LYF PVT. LTD. - Payment Report",
        metaLines: [
          `Generated: ${generated}`,
          `Total Records: ${sourceRows.length}   |   Total Net Payable: ₹${summary.netAmount.toFixed(
            2
          )}`,
        ],
        headers: [
          "S.No.",
          "Payment Date",
          "Member ID",
          "Customer Name",
          "Mobile",
          "Email",
          "Earning Type",
          "Account Holder",
          "Bank Name",
          "Account Number",
          "IFSC",
          "UPI ID",
          "Gross Amount",
          "TDS",
          "Admin Fee",
          "Net Payable",
          "Status",
          "Transaction ID",
          "Remark",
        ],
        bodyRows,
      });

      downloadFile(
        html,
        `DIGITAL_LYF_Payment_Report_${suffix}.xls`,
        "application/vnd.ms-excel;charset=utf-8;"
      );
    } catch (exportError) {
      console.error("Payment report export error:", exportError);
    } finally {
      setExporting("");
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

  const busy = refreshing || Boolean(exporting);

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            <Landmark className="h-3.5 w-3.5" />
            Bank Payment Tracking
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Payment Report
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Customer name, bank details and the exact amount to transfer.
            Download the bank transfer sheet and hand it to the bank.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadReport({ silent: true })}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => handleExport("bank-excel")}
            disabled={busy || transferRows.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "bank-excel" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Bank Sheet (Excel)
          </button>

          <button
            type="button"
            onClick={() => handleExport("bank-csv")}
            disabled={busy || transferRows.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "bank-csv" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Bank Sheet (CSV)
          </button>

          <button
            type="button"
            onClick={() => handleExport("full")}
            disabled={busy || filteredRows.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "full" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Full Report
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-red-700">
              Unable to load payment report
            </p>

            <p className="mt-1 break-words text-xs text-red-600">{error}</p>
          </div>
        </div>
      ) : null}

      {/* INCOMPLETE BANK DETAILS WARNING */}

      {incompleteApprovedCount > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">
              {incompleteApprovedCount} approved payment
              {incompleteApprovedCount === 1 ? "" : "s"} cannot go in the
              bank sheet
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              The account number or IFSC code is missing or invalid. These
              rows are marked in the table. Ask the customer to update their
              bank details in KYC.
            </p>
          </div>
        </div>
      ) : null}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Records"
          value={filteredRows.length}
          icon={FileSpreadsheet}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Gross Amount"
          value={formatCurrency(summary.grossAmount)}
          icon={IndianRupee}
          iconClass="bg-slate-100 text-slate-600"
        />

        <SummaryCard
          title="TDS + Admin Fee"
          value={formatCurrency(summary.tdsAmount + summary.adminFee)}
          icon={IndianRupee}
          iconClass="bg-orange-50 text-orange-600"
          valueClass="text-orange-700"
        />

        <SummaryCard
          title="Net Payable"
          value={formatCurrency(summary.netAmount)}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-700"
        />

        <SummaryCard
          title="Ready to Transfer"
          value={formatCurrency(transferTotal)}
          note={`${transferRows.length} bank transfer${
            transferRows.length === 1 ? "" : "s"
          }`}
          icon={Landmark}
          iconClass="bg-cyan-50 text-cyan-600"
          valueClass="text-cyan-700"
        />
      </div>

      {/* FILTER PANEL */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Report Filters
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing approved payments by default. Change the status to see
              other records.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, member ID, phone, account no..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Payment status"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved / Bank Ready</option>
            <option value="completed">Paid / Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Earning type */}

          <select
            value={earningTypeFilter}
            onChange={(event) => setEarningTypeFilter(event.target.value)}
            aria-label="Earning type"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          >
            <option value="all">All Earnings</option>
            <option value="captcha">CAPTCHA Earning</option>
            <option value="referral">Referral Earning</option>
            <option value="direct">Direct Earning</option>
          </select>

          {/* Year */}

          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            aria-label="Year"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">All Years</option>

            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Month */}

          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            aria-label="Month"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">All Months</option>

            {MONTHS.map((month, index) => (
              <option key={month} value={String(index + 1)}>
                {month}
              </option>
            ))}
          </select>

          {/* From date */}

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              title="From date"
              aria-label="From date"
            />
          </div>

          {/* To date */}

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              title="To date"
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bank Transfer Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredRows.length}
              </span>{" "}
              records. Use the copy buttons to paste details into your
              bank portal.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total to transfer:{" "}
            <span className="font-black text-emerald-700">
              {formatCurrency(transferTotal)}
            </span>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <Landmark className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-bold text-slate-600">
              No payment records found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Only approved payments are shown by default. Change the status
              filter or clear the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Bank Details
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Amount to Transfer
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date &amp; Transaction
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50">
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

                      <div className="mt-2">
                        <EarningTypeBadge type={row.earningType} />
                      </div>
                    </td>

                    {/* Bank details */}

                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-slate-800">
                          {row.accountHolderName}
                        </p>

                        <CopyButton
                          value={row.accountHolderName}
                          label="beneficiary name"
                          copied={copiedKey === `${row.id}-name`}
                          onCopy={() =>
                            handleCopy(
                              row.accountHolderName,
                              `${row.id}-name`
                            )
                          }
                        />
                      </div>

                      <p className="text-xs text-slate-500">
                        {row.bankName || "Bank name not provided"}
                      </p>

                      <div className="mt-1 flex items-center gap-1">
                        <p className="font-mono text-xs font-semibold text-slate-700">
                          A/C: {row.accountNumber || "Not provided"}
                        </p>

                        <CopyButton
                          value={row.accountNumber}
                          label="account number"
                          copied={copiedKey === `${row.id}-acc`}
                          onCopy={() =>
                            handleCopy(row.accountNumber, `${row.id}-acc`)
                          }
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <p className="font-mono text-xs font-bold text-slate-500">
                          IFSC: {row.ifscCode || "Not provided"}
                        </p>

                        <CopyButton
                          value={row.ifscCode}
                          label="IFSC code"
                          copied={copiedKey === `${row.id}-ifsc`}
                          onCopy={() =>
                            handleCopy(row.ifscCode, `${row.id}-ifsc`)
                          }
                        />
                      </div>

                      {row.upiId ? (
                        <p className="mt-1 text-[11px] font-semibold text-violet-600">
                          UPI: {row.upiId}
                        </p>
                      ) : null}

                      {!row.bankReady ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                          <AlertCircle className="h-3 w-3" />
                          {row.upiOnly
                            ? "UPI only, no bank account"
                            : "Bank details incomplete"}
                        </span>
                      ) : null}

                      {row.bankSource === "profile" ? (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Taken from current profile
                        </p>
                      ) : null}
                    </td>

                    {/* Amount */}

                    <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-base font-black text-emerald-700">
                          {formatCurrency(row.netAmount)}
                        </p>

                        <CopyButton
                          value={row.netAmount.toFixed(2)}
                          label="amount"
                          copied={copiedKey === `${row.id}-amt`}
                          onCopy={() =>
                            handleCopy(
                              row.netAmount.toFixed(2),
                              `${row.id}-amt`
                            )
                          }
                        />
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Gross {formatCurrency(row.grossAmount)}
                      </p>

                      <p className="text-[11px] text-orange-600">
                        TDS {formatCurrency(row.tdsAmount)}
                      </p>

                      <p className="text-[11px] text-red-500">
                        Fee {formatCurrency(row.adminFee)}
                      </p>
                    </td>

                    {/* Status */}

                    <td className="whitespace-nowrap px-5 py-4 text-center align-top">
                      <StatusBadge status={row.status} />
                    </td>

                    {/* Date + transaction */}

                    <td className="px-5 py-4 align-top">
                      <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                        {formatDate(row.date)}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDateTime(row.date)}
                      </p>

                      <p className="mt-2 max-w-[200px] break-all font-mono text-[11px] font-semibold text-slate-500">
                        {row.transactionId}
                      </p>

                      {row.reason ? (
                        <p className="mt-2 max-w-[200px] text-xs leading-5 text-slate-400">
                          {row.reason}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STATUS SUMMARY */}

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
                {formatCurrency(summary.pending)}
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
                {formatCurrency(summary.approved)}
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
                {formatCurrency(summary.completed)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

          <div>
            <p className="text-sm font-bold text-slate-800">
              Bank Payment Workflow
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              1. Filter the period and keep the status on Approved. 2. Check
              that no row shows a red bank-details warning. 3. Download the
              bank sheet and give it to the bank. 4. Mark the withdrawals as
              Paid after the transfer so they are not sent twice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}