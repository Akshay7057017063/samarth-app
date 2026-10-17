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
  FileText,
  IndianRupee,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  Users,
  Wallet,
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

// Income dropdown (Customer Balances tab)
const INCOME_OPTIONS = [
  { value: "all", label: "All Income" },
  { value: "captcha", label: "CAPTCHA Income" },
  { value: "referral", label: "Referral Income" },
  { value: "binary", label: "Binary / Other Income" },
];

const CUSTOMER_PAGE_SIZE = 50;

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
// PDF (no extra package needed)
// ============================================================
//
// Opens the browser print dialog with a clean A4 landscape
// table. Choose "Save as PDF" as the destination.
// This keeps the ₹ sign and long account numbers correct.
//
// ============================================================

const printPdf = ({
  fileName,
  title,
  metaLines = [],
  headers,
  rows,
  rightAlignedColumns = [],
  totalRow = null,
}) => {
  const renderCell = (value, index, tag = "td") =>
    `<${tag}${
      rightAlignedColumns.includes(index) ? ' class="num"' : ""
    }>${escapeHtml(value)}</${tag}>`;

  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row.map((cell, i) => renderCell(cell, i)).join("")}</tr>`
    )
    .join("");

  const totalHtml = totalRow
    ? `<tr class="total">${totalRow
        .map((cell, i) => renderCell(cell, i))
        .join("")}</tr>`
    : "";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(fileName)}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
      h1 { font-size: 16px; margin: 0 0 6px; }
      .meta { font-size: 10px; color: #475569; margin-bottom: 2px; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 4px 6px;
        font-size: 9px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th { background: #e2e8f0; font-weight: bold; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      .num { text-align: right; white-space: nowrap; }
      .total td { font-weight: bold; background: #f1f5f9; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${metaLines
      .map((line) => `<div class="meta">${escapeHtml(line)}</div>`)
      .join("")}
    <table>
      <thead>
        <tr>${headers.map((h, i) => renderCell(h, i, "th")).join("")}</tr>
      </thead>
      <tbody>${bodyHtml}${totalHtml}</tbody>
    </table>
  </body>
</html>`;

  const iframe = document.createElement("iframe");

  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow.document;

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();

    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1500);
  }, 300);
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

const resolveBankDetails = (withdrawal, profileBank) => {
  const snapshot = withdrawal?.bankDetails || withdrawal?.bank || {};
  const profile = profileBank || {};

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
if (combinedValue.includes("binary")) return "binary";

// Direct referral हा Referral पेक्षा आधी तपासला पाहिजे.
if (combinedValue.includes("direct")) return "direct";
if (combinedValue.includes("referral")) return "referral";

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

    case "binary":
      return "Binary Earning";

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

    case "binary":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

// ============================================================
// CUSTOMER INCOME (Customer Balances tab)
// ============================================================

const getIncomeValue = (row, type) => {
  switch (type) {
    case "captcha":
      return row.captchaIncome;
    case "referral":
      return row.referralIncome;
    case "binary":
      return row.binaryIncome;
    default:
      return row.totalIncome;
  }
};

const getIncomeLabel = (type) =>
  INCOME_OPTIONS.find((option) => option.value === type)?.label ||
  "All Income";

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

// Reusable bank details block (used in both tables)
function BankDetailsCell({ row, copiedKey, onCopy }) {
  return (
    <>
      <div className="flex items-center gap-1">
        <p className="text-sm font-bold text-slate-800">
          {row.accountHolderName || "-"}
        </p>

        <CopyButton
          value={row.accountHolderName}
          label="beneficiary name"
          copied={copiedKey === `${row.id}-name`}
          onCopy={() => onCopy(row.accountHolderName, `${row.id}-name`)}
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
          onCopy={() => onCopy(row.accountNumber, `${row.id}-acc`)}
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
          onCopy={() => onCopy(row.ifscCode, `${row.id}-ifsc`)}
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
          {row.upiOnly ? "UPI only, no bank account" : "Bank details incomplete"}
        </span>
      ) : null}
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PaymentReport() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // "" | "bank-excel" | "bank-csv" | "bank-pdf" | "full"
  // | "cust-excel" | "cust-pdf"
  const [exporting, setExporting] = useState("");

  const [error, setError] = useState("");
  const [customersError, setCustomersError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // "withdrawals" | "customers"
  const [view, setView] = useState("withdrawals");

  // ----------------------------------------------------------
  // WITHDRAWAL FILTERS
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

  // ----------------------------------------------------------
  // CUSTOMER BALANCE FILTERS
  // ----------------------------------------------------------

  const [custSearch, setCustSearch] = useState("");
  const [custIncomeType, setCustIncomeType] = useState("all");
  const [custStatus, setCustStatus] = useState("all");
  const [custBank, setCustBank] = useState("all");
  const [custSort, setCustSort] = useState("balance-desc");
  const [custLimit, setCustLimit] = useState(CUSTOMER_PAGE_SIZE);

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
      setCustomersError("");

      const [withdrawalsResult, usersResult, customersResult] =
        await Promise.allSettled([
          api.get("/admin/withdrawals"),
          api.get("/admin/users"),
          api.get("/admin/payment-report/customers"),
        ]);

      // Withdrawals + users are required.
      if (withdrawalsResult.status === "rejected") {
        throw withdrawalsResult.reason;
      }

      if (usersResult.status === "rejected") {
        throw usersResult.reason;
      }

      const withdrawalData = withdrawalsResult.value?.data || {};
      const userData = usersResult.value?.data || {};

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

      // Customer balances are optional: the rest of the page
      // still works if this endpoint is missing.
      if (customersResult.status === "fulfilled") {
        const customerData = customersResult.value?.data || {};

        if (customerData.success && Array.isArray(customerData.customers)) {
          setCustomers(customerData.customers);
        } else {
          setCustomers([]);
          setCustomersError(
            customerData.message || "Customer balance data is not available."
          );
        }
      } else {
        setCustomers([]);
        setCustomersError(
          customersResult.reason?.response?.data?.message ||
            "Customer balance data could not be loaded. Check that the /admin/payment-report/customers route is added on the server."
        );
      }
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
  // LOOKUP MAPS
  // ==========================================================

  const userMap = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      const id = String(getUserId(user));

      if (id) map.set(id, user);
    });

    return map;
  }, [users]);

  const customerMap = useMemo(() => {
    const map = new Map();

    customers.forEach((customer) => {
      if (customer?.userId) map.set(String(customer.userId), customer);
    });

    return map;
  }, [customers]);

  // ==========================================================
  // WITHDRAWAL REPORT ROWS
  // ==========================================================

  const reportRows = useMemo(() => {
    return withdrawals.map((withdrawal) => {
      const withdrawalUserId = getWithdrawalUserId(withdrawal);

      const user = userMap.get(String(withdrawalUserId)) || null;
      const customer = customerMap.get(String(withdrawalUserId)) || null;

      const name =
        withdrawal?.name ||
        withdrawal?.customerName ||
        user?.name ||
        user?.fullName ||
        customer?.name ||
        "Customer";

      // Profile bank details: new BankDetails data first,
      // then the old data saved on the user.
      const profileBank = customer?.bank || user?.bankDetails || {};

      const { details: bank, source: bankSource } = resolveBankDetails(
        withdrawal,
        profileBank
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

      const id =
        withdrawal?._id ||
        `${withdrawalUserId}-${getTransactionDate(withdrawal)}`;

      return {
        id,

        memberId:
          withdrawal?.memberId ||
          user?.memberId ||
          user?.userCode ||
          customer?.memberId ||
          "-",

        name,

        phone:
          withdrawal?.phone ||
          withdrawal?.mobile ||
          user?.phone ||
          user?.mobile ||
          customer?.phone ||
          "-",

        email: withdrawal?.email || user?.email || customer?.email || "-",

        userId: withdrawalUserId,

        status: String(withdrawal?.status || "pending").toLowerCase(),

        earningType,
        earningTypeLabel: getEarningTypeLabel(earningType),

        date: getTransactionDate(withdrawal),

        grossAmount,
        tdsAmount,
        adminFee,
        netAmount,

        // Customer's current wallet balance (null = not available)
        walletBalance: customer
          ? toNumber(customer.wallet?.currentBalance)
          : null,

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
  }, [withdrawals, userMap, customerMap]);

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
  // FILTERED WITHDRAWAL REPORT
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
  // WITHDRAWAL SUMMARY
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
      }
    );
  }, [filteredRows]);

  // ==========================================================
  // CUSTOMER ROWS (Customer Balances tab)
  // ==========================================================

  const customerRows = useMemo(() => {
    return customers.map((customer) => {
      const wallet = customer.wallet || {};
      const bank = customer.bank || {};

      const bankInfo = {
        accountHolderName: String(bank.accountHolderName || "").trim(),
        accountNumber: String(bank.accountNumber || "").trim(),
        ifscCode: String(bank.ifscCode || "").trim().toUpperCase(),
        bankName: String(bank.bankName || "").trim(),
        upiId: String(bank.upiId || "").trim(),
      };

      const bankReady = isBankTransferReady(bankInfo);

      return {
        id: customer.userId,
        userId: customer.userId,
        memberId: customer.memberId || "-",
        name: customer.name || "Customer",
        phone: customer.phone || "-",
        email: customer.email || "-",
        status: String(customer.status || "").toLowerCase(),
        userType: customer.userType || "",

        balance: toNumber(wallet.currentBalance),
        totalIncome: toNumber(wallet.totalEarnings),
        captchaIncome: toNumber(wallet.captchaEarnings),
        referralIncome: toNumber(wallet.referralCommissions),
        binaryIncome: toNumber(wallet.binaryEarnings),
        withdrawn: toNumber(wallet.totalWithdrawn),

        panNumber: bank.panNumber || "",
        panVerified: Boolean(bank.panVerified),

        ...bankInfo,
        accountHolderName: bankInfo.accountHolderName || customer.name || "",

        bankReady,
        upiOnly: !bankReady && Boolean(bankInfo.upiId),
        hasAnyBank: Boolean(
          bankInfo.accountNumber || bankInfo.upiId || bankInfo.bankName
        ),
      };
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const cleanSearch = String(custSearch || "").trim().toLowerCase();

    const list = customerRows.filter((row) => {
      if (custStatus !== "all" && row.status !== custStatus) {
        return false;
      }

      if (custBank === "ready" && !row.bankReady) return false;
      if (custBank === "missing" && row.bankReady) return false;

      if (cleanSearch) {
        const matches = [
          row.memberId,
          row.name,
          row.phone,
          row.email,
          row.accountHolderName,
          row.accountNumber,
          row.ifscCode,
          row.bankName,
          row.upiId,
          row.panNumber,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(cleanSearch)
          );

        if (!matches) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      switch (custSort) {
        case "income-desc":
          return (
            getIncomeValue(b, custIncomeType) -
            getIncomeValue(a, custIncomeType)
          );
        case "withdrawn-desc":
          return b.withdrawn - a.withdrawn;
        case "name-asc":
          return String(a.name).localeCompare(String(b.name));
        case "balance-desc":
        default:
          return b.balance - a.balance;
      }
    });

    return list;
  }, [
    customerRows,
    custSearch,
    custStatus,
    custBank,
    custSort,
    custIncomeType,
  ]);

  const visibleCustomers = useMemo(
    () => filteredCustomers.slice(0, custLimit),
    [filteredCustomers, custLimit]
  );

  const customerSummary = useMemo(
    () =>
      filteredCustomers.reduce(
        (acc, row) => {
          acc.balance += row.balance;
          acc.income += getIncomeValue(row, custIncomeType);
          acc.withdrawn += row.withdrawn;
          if (row.bankReady) acc.bankReady += 1;
          return acc;
        },
        { balance: 0, income: 0, withdrawn: 0, bankReady: 0 }
      ),
    [filteredCustomers, custIncomeType]
  );

  // Show the first page again whenever a filter changes
  useEffect(() => {
    setCustLimit(CUSTOMER_PAGE_SIZE);
  }, [custSearch, custStatus, custBank, custSort, custIncomeType]);

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

  const clearCustomerFilters = () => {
    setCustSearch("");
    setCustIncomeType("all");
    setCustStatus("all");
    setCustBank("all");
    setCustSort("balance-desc");
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

  // ----------------------------------------------------------
  // WITHDRAWAL EXPORTS
  // ----------------------------------------------------------

  const handleExport = (kind) => {
    const isBank =
      kind === "bank-excel" || kind === "bank-csv" || kind === "bank-pdf";

    const sourceRows = isBank ? transferRows : filteredRows;

    if (sourceRows.length === 0) return;

    try {
      setExporting(kind);

      const suffix = buildFileSuffix();
      const generated = formatDateTime(new Date());

      // --------------------------------------------------
      // BANK TRANSFER SHEET (PDF)
      // --------------------------------------------------

      if (kind === "bank-pdf") {
        printPdf({
          fileName: `DIGITAL_LYF_Bank_Transfer_${suffix}`,
          title: "DIGITAL LYF PVT. LTD. - Bank Transfer Sheet",
          metaLines: [
            `Generated: ${generated}`,
            `Total Transfers: ${sourceRows.length}   |   Total Amount: ${formatCurrency(
              transferTotal
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
          ],
          rows: sourceRows.map((row, index) => [
            index + 1,
            row.memberId,
            row.accountHolderName,
            row.bankName,
            row.accountNumber,
            row.ifscCode,
            row.netAmount.toFixed(2),
            `Payout ${row.memberId}`,
          ]),
          rightAlignedColumns: [6],
          totalRow: ["", "", "", "", "", "Total", transferTotal.toFixed(2), ""],
        });

        return;
      }

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
          <td>${
            row.walletBalance === null ? "" : row.walletBalance.toFixed(2)
          }</td>
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
          "Wallet Balance",
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

  // ----------------------------------------------------------
  // CUSTOMER BALANCE EXPORTS (all filtered customers)
  // ----------------------------------------------------------

  const handleCustomerExport = (kind) => {
    if (filteredCustomers.length === 0) return;

    try {
      setExporting(kind);

      const generated = formatDateTime(new Date());
      const incomeLabel = getIncomeLabel(custIncomeType);

      const fileBase = `DIGITAL_LYF_Customer_Balances_${custIncomeType}`;

      const metaLines = [
        `Generated: ${generated}`,
        `Customers: ${filteredCustomers.length}   |   Income shown: ${incomeLabel}`,
        `Total Balance: ${formatCurrency(
          customerSummary.balance
        )}   |   Total ${incomeLabel}: ${formatCurrency(
          customerSummary.income
        )}   |   Total Withdrawn: ${formatCurrency(customerSummary.withdrawn)}`,
      ];

      const headers = [
        "S.No.",
        "Member ID",
        "Customer Name",
        "Mobile",
        "Status",
        "Account Holder",
        "Bank Name",
        "Account Number",
        "IFSC",
        "UPI ID",
        "PAN",
        "Wallet Balance",
        incomeLabel,
        "Total Withdrawn",
      ];

      const rowValues = (row, index) => [
        index + 1,
        row.memberId,
        row.name,
        row.phone,
        row.status,
        row.accountHolderName,
        row.bankName,
        row.accountNumber,
        row.ifscCode,
        row.upiId,
        row.panNumber,
        row.balance.toFixed(2),
        getIncomeValue(row, custIncomeType).toFixed(2),
        row.withdrawn.toFixed(2),
      ];

      // --------------------------------------------------
      // PDF
      // --------------------------------------------------

      if (kind === "cust-pdf") {
        printPdf({
          fileName: fileBase,
          title: "DIGITAL LYF PVT. LTD. - Customer Balance & Bank Report",
          metaLines,
          headers,
          rows: filteredCustomers.map(rowValues),
          rightAlignedColumns: [11, 12, 13],
          totalRow: [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "Total",
            customerSummary.balance.toFixed(2),
            customerSummary.income.toFixed(2),
            customerSummary.withdrawn.toFixed(2),
          ],
        });

        return;
      }

      // --------------------------------------------------
      // EXCEL
      // --------------------------------------------------

      const bodyRows =
        filteredCustomers
          .map((row, index) => {
            const values = rowValues(row, index);

            return `<tr>${values
              .map((value, i) =>
                i >= 11 || i === 0
                  ? `<td>${escapeHtml(value)}</td>`
                  : textCell(value)
              )
              .join("")}</tr>`;
          })
          .join("") +
        `
        <tr>
          <td colspan="11"><b>Total</b></td>
          <td><b>${customerSummary.balance.toFixed(2)}</b></td>
          <td><b>${customerSummary.income.toFixed(2)}</b></td>
          <td><b>${customerSummary.withdrawn.toFixed(2)}</b></td>
        </tr>`;

      downloadFile(
        buildExcelHtml({
          title: "DIGITAL LYF PVT. LTD. - Customer Balance & Bank Report",
          metaLines,
          headers,
          bodyRows,
        }),
        `${fileBase}.xls`,
        "application/vnd.ms-excel;charset=utf-8;"
      );
    } catch (exportError) {
      console.error("Customer report export error:", exportError);
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

  const exportButtonClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50";

  const outlineButtonClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  const selectClass =
    "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

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
            Customer name, bank details, wallet balance and income. Download
            the bank transfer sheet or the customer report as PDF or Excel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadReport({ silent: true })}
            disabled={busy}
            className={outlineButtonClass}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {view === "withdrawals" ? (
            <>
              <button
                type="button"
                onClick={() => handleExport("bank-pdf")}
                disabled={busy || transferRows.length === 0}
                className={`${exportButtonClass} bg-red-600 hover:bg-red-700`}
              >
                {exporting === "bank-pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Bank Sheet (PDF)
              </button>

              <button
                type="button"
                onClick={() => handleExport("bank-excel")}
                disabled={busy || transferRows.length === 0}
                className={`${exportButtonClass} bg-emerald-600 hover:bg-emerald-700`}
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
                className={`${exportButtonClass} bg-emerald-600 hover:bg-emerald-700`}
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
                className={outlineButtonClass}
              >
                {exporting === "full" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Full Report
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleCustomerExport("cust-pdf")}
                disabled={busy || filteredCustomers.length === 0}
                className={`${exportButtonClass} bg-red-600 hover:bg-red-700`}
              >
                {exporting === "cust-pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Download PDF
              </button>

              <button
                type="button"
                onClick={() => handleCustomerExport("cust-excel")}
                disabled={busy || filteredCustomers.length === 0}
                className={`${exportButtonClass} bg-emerald-600 hover:bg-emerald-700`}
              >
                {exporting === "cust-excel" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Download Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setView("withdrawals")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            view === "withdrawals"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Landmark className="h-4 w-4" />
          Withdrawal Payments
        </button>

        <button
          type="button"
          onClick={() => setView("customers")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            view === "customers"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="h-4 w-4" />
          Customer Balances
        </button>
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

      {customersError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">
              Customer balance data not loaded
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-amber-700">
              {customersError}
            </p>
          </div>
        </div>
      ) : null}

      {/* ====================================================== */}
      {/* VIEW 1: WITHDRAWAL PAYMENTS                            */}
      {/* ====================================================== */}

      {view === "withdrawals" ? (
        <>
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
                  The account number or IFSC code is missing or invalid.
                  These rows are marked in the table. Ask the customer to
                  update their bank details in KYC.
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
                  Showing approved payments by default. Change the status to
                  see other records.
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
                className={selectClass}
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
                className={selectClass}
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
                className={selectClass}
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
                className={selectClass}
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
                  Only approved payments are shown by default. Change the
                  status filter or clear the filters.
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
                      <tr
                        key={row.id}
                        className="transition hover:bg-slate-50"
                      >
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
                          <BankDetailsCell
                            row={row}
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                          />

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

                          {row.walletBalance !== null ? (
                            <p className="mt-1 text-[11px] font-bold text-slate-600">
                              Wallet balance{" "}
                              {formatCurrency(row.walletBalance)}
                            </p>
                          ) : null}
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
                  1. Filter the period and keep the status on Approved. 2.
                  Check that no row shows a red bank-details warning. 3.
                  Download the bank sheet (PDF, Excel or CSV) and give it to
                  the bank. 4. Mark the withdrawals as Paid after the
                  transfer so they are not sent twice.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ====================================================== */}
      {/* VIEW 2: CUSTOMER BALANCES                              */}
      {/* ====================================================== */}

      {view === "customers" ? (
        <>
          {/* SUMMARY */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Customers"
              value={filteredCustomers.length}
              note={`${customerSummary.bankReady} with complete bank details`}
              icon={Users}
              iconClass="bg-blue-50 text-blue-600"
            />

            <SummaryCard
              title="Total Wallet Balance"
              value={formatCurrency(customerSummary.balance)}
              icon={Wallet}
              iconClass="bg-emerald-50 text-emerald-600"
              valueClass="text-emerald-700"
            />

            <SummaryCard
              title={getIncomeLabel(custIncomeType)}
              value={formatCurrency(customerSummary.income)}
              icon={IndianRupee}
              iconClass="bg-violet-50 text-violet-600"
              valueClass="text-violet-700"
            />

            <SummaryCard
              title="Total Withdrawn"
              value={formatCurrency(customerSummary.withdrawn)}
              icon={Landmark}
              iconClass="bg-orange-50 text-orange-600"
              valueClass="text-orange-700"
            />
          </div>

          {/* FILTER PANEL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Customer Filters
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Pick an income type to see each customer&apos;s CAPTCHA,
                  referral or binary income. PDF and Excel follow the same
                  filters.
                </p>
              </div>

              <button
                type="button"
                onClick={clearCustomerFilters}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={custSearch}
                  onChange={(event) => setCustSearch(event.target.value)}
                  placeholder="Name, member ID, phone, account no, PAN..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <select
                value={custIncomeType}
                onChange={(event) => setCustIncomeType(event.target.value)}
                aria-label="Income type"
                className="h-11 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              >
                {INCOME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={custStatus}
                onChange={(event) => setCustStatus(event.target.value)}
                aria-label="Account status"
                className={selectClass}
              >
                <option value="all">All Accounts</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={custBank}
                onChange={(event) => setCustBank(event.target.value)}
                aria-label="Bank details"
                className={selectClass}
              >
                <option value="all">All Bank Status</option>
                <option value="ready">Bank Details Complete</option>
                <option value="missing">Bank Details Missing</option>
              </select>

              <select
                value={custSort}
                onChange={(event) => setCustSort(event.target.value)}
                aria-label="Sort by"
                className={selectClass}
              >
                <option value="balance-desc">Balance: High to Low</option>
                <option value="income-desc">Income: High to Low</option>
                <option value="withdrawn-desc">Withdrawn: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Customer Balance &amp; Bank Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {Math.min(visibleCustomers.length, filteredCustomers.length)}
                  </span>{" "}
                  of {filteredCustomers.length} customers.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Income shown:{" "}
                <span className="font-black text-violet-700">
                  {getIncomeLabel(custIncomeType)}
                </span>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-sm font-bold text-slate-600">
                  No customers found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try clearing the filters.
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
                        Wallet Balance
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        {getIncomeLabel(custIncomeType)}
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        Withdrawn
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleCustomers.map((row) => (
                      <tr
                        key={row.id}
                        className="transition hover:bg-slate-50"
                      >
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

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                row.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {row.status === "active"
                                ? "Active"
                                : row.status
                                ? "Inactive"
                                : "Unknown"}
                            </span>

                            {row.userType ? (
                              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                {row.userType}
                              </span>
                            ) : null}
                          </div>

                          {row.panNumber ? (
                            <p className="mt-2 font-mono text-[11px] font-semibold text-slate-500">
                              PAN: {row.panNumber}{" "}
                              <span
                                className={
                                  row.panVerified
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }
                              >
                                ({row.panVerified ? "verified" : "unverified"})
                              </span>
                            </p>
                          ) : null}
                        </td>

                        {/* Bank details */}

                        <td className="px-5 py-4 align-top">
                          <BankDetailsCell
                            row={row}
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                          />
                        </td>

                        {/* Balance */}

                        <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <p className="text-base font-black text-emerald-700">
                              {formatCurrency(row.balance)}
                            </p>

                            <CopyButton
                              value={row.balance.toFixed(2)}
                              label="balance"
                              copied={copiedKey === `${row.id}-bal`}
                              onCopy={() =>
                                handleCopy(
                                  row.balance.toFixed(2),
                                  `${row.id}-bal`
                                )
                              }
                            />
                          </div>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Available to withdraw
                          </p>
                        </td>

                        {/* Income (follows the dropdown) */}

                        <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                          {custIncomeType === "all" ? (
                            <>
                              <p className="text-base font-black text-violet-700">
                                {formatCurrency(row.totalIncome)}
                              </p>

                              <p className="mt-1 text-[11px] text-violet-600">
                                CAPTCHA {formatCurrency(row.captchaIncome)}
                              </p>

                              <p className="text-[11px] text-blue-600">
                                Referral {formatCurrency(row.referralIncome)}
                              </p>

                              <p className="text-[11px] text-emerald-600">
                                Binary / Other{" "}
                                {formatCurrency(row.binaryIncome)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-base font-black text-violet-700">
                                {formatCurrency(
                                  getIncomeValue(row, custIncomeType)
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Total income {formatCurrency(row.totalIncome)}
                              </p>
                            </>
                          )}
                        </td>

                        {/* Withdrawn */}

                        <td className="whitespace-nowrap px-5 py-4 text-right align-top">
                          <p className="text-base font-black text-orange-700">
                            {formatCurrency(row.withdrawn)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredCustomers.length > visibleCustomers.length ? (
              <div className="border-t border-slate-200 p-4 text-center">
                <button
                  type="button"
                  onClick={() =>
                    setCustLimit((current) => current + CUSTOMER_PAGE_SIZE)
                  }
                  className={outlineButtonClass}
                >
                  Show more (
                  {filteredCustomers.length - visibleCustomers.length} left)
                </button>
              </div>
            ) : null}
          </div>

          {/* NOTE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

              <div>
                <p className="text-sm font-bold text-slate-800">
                  How income is calculated
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Wallet Balance is the amount the customer can withdraw
                  now. CAPTCHA and Referral income come from the wallet
                  totals. Binary / Other income is the remaining part of
                  total earnings. PDF and Excel include every customer that
                  matches the filters, not only the ones visible on screen.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}