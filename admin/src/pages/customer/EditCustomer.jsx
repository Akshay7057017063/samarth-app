import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  Phone,
  Save,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

import api from "../../services/api";

// ============================================================
// VALIDATION (same rules as the server)
// ============================================================

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{6,18}$/;
const UPI_REGEX = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  panNumber: "",
  panVerified: false,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
};

const validateForm = (f) => {
  if (!f.name) return "Customer name is required.";

  if (f.phone && !PHONE_REGEX.test(f.phone)) {
    return "Mobile number must be 10 to 15 digits.";
  }

  if (f.email && !EMAIL_REGEX.test(f.email)) {
    return "Please enter a valid email address.";
  }

  if (f.panNumber && !PAN_REGEX.test(f.panNumber)) {
    return "Invalid PAN format. It should look like ABCDE1234F.";
  }

  const anyBank = f.accountNumber || f.ifscCode || f.bankName;

  if (anyBank) {
    if (!f.accountHolderName) return "Please enter the account holder name.";
    if (!f.bankName) return "Please enter the bank name.";
    if (!ACCOUNT_REGEX.test(f.accountNumber)) {
      return "Account number must be 6 to 18 digits.";
    }
    if (!IFSC_REGEX.test(f.ifscCode)) {
      return "Invalid IFSC code. It should look like SBIN0001234.";
    }
  }

  if (f.upiId && !UPI_REGEX.test(f.upiId)) {
    return "Invalid UPI ID. It should look like username@bank.";
  }

  return "";
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

// ============================================================
// FIELD
// ============================================================

function Field({ id, label, icon: Icon, iconClass, children, hint }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${iconClass}`}
        />
        {children}
      </div>

      {hint ? (
        <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function EditCustomer() {
  const params = useParams();
  const navigate = useNavigate();

  // Works with /customers/edit/:id, :userId or :customerId routes
  const customerId = params.id || params.userId || params.customerId || "";

  const [form, setForm] = useState(EMPTY_FORM);
  const [info, setInfo] = useState({
    memberId: "",
    status: "",
    userType: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const messageRef = useRef(null);

  const showMessage = (text, type) => {
    setMessage({ text, type });

    requestAnimationFrame(() =>
      messageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    );
  };

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const applyCustomer = useCallback((customer) => {
    setInfo({
      memberId: customer.memberId || "",
      status: customer.status || "",
      userType: customer.userType || "",
    });

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      panNumber: customer.panNumber || "",
      panVerified: Boolean(customer.panVerified),
      accountHolderName: customer.accountHolderName || "",
      bankName: customer.bankName || "",
      accountNumber: customer.accountNumber || "",
      ifscCode: customer.ifscCode || "",
      upiId: customer.upiId || "",
    });
  }, []);

  // ==========================================================
  // LOAD CUSTOMER
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!customerId) {
        setLoading(false);
        showMessage("Customer ID not found in the page address.", "error");
        return;
      }

      try {
        setLoading(true);

        const { data } = await api.get(
          `/admin/customer-edit/${customerId}`
        );

        if (cancelled) return;

        if (!data?.success || !data.customer) {
          throw new Error(data?.message || "Failed to load customer.");
        }

        applyCustomer(data.customer);
      } catch (error) {
        if (cancelled) return;

        console.error("Load customer error:", error);

        showMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load customer.",
          "error"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [customerId, applyCustomer]);

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ text: "", type: "" });

    const payload = {
      name: form.name.trim(),
      phone: form.phone.replace(/[\s-]/g, ""),
      email: form.email.trim().toLowerCase(),
      panNumber: form.panNumber.trim().toUpperCase(),
      panVerified: Boolean(form.panVerified),
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      upiId: form.upiId.trim().toLowerCase(),
    };

    const validationError = validateForm(payload);

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    try {
      setSaving(true);

      const { data } = await api.put(
        `/admin/customer-edit/${customerId}`,
        payload
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to update customer.");
      }

      if (data.customer) applyCustomer(data.customer);

      showMessage(
        data.message || "Customer updated successfully.",
        "success"
      );
    } catch (error) {
      console.error("Update customer error:", error);

      showMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update customer.",
        "error"
      );
    } finally {
      setSaving(false);
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
            Loading customer...
          </p>
        </div>
      </div>
    );
  }

  const customerLoaded = Boolean(info.memberId);

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Edit Customer
        </h1>

        {customerLoaded ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              {info.memberId}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                String(info.status).toLowerCase() === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {String(info.status).toLowerCase() === "active"
                ? "Active"
                : "Inactive"}
            </span>

            {info.userType ? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                {info.userType}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* MESSAGE */}

      {message.text ? (
        <div
          ref={messageRef}
          role="alert"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}

          <span>{message.text}</span>
        </div>
      ) : null}

      {customerLoaded ? (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* PROFILE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Customer Details
                </h2>
                <p className="text-xs text-slate-500">
                  Name, mobile number and email
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id="name"
                  label="Customer Name"
                  icon={User}
                  iconClass="text-blue-500"
                >
                  <input
                    id="name"
                    type="text"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Full name"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                id="phone"
                label="Mobile Number"
                icon={Phone}
                iconClass="text-emerald-500"
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  value={form.phone}
                  onChange={(e) =>
                    setField("phone", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="10 digit mobile number"
                  className={inputClass}
                />
              </Field>

              <Field
                id="email"
                label="Email"
                icon={Mail}
                iconClass="text-pink-500"
              >
                <input
                  id="email"
                  type="email"
                  autoCapitalize="none"
                  value={form.email}
                  onChange={(e) =>
                    setField("email", e.target.value.replace(/\s/g, ""))
                  }
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* PAN */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    PAN Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Admin can change PAN and verify it
                  </p>
                </div>
              </div>

              {form.panVerified && form.panNumber ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pending Verification
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="panNumber"
                label="PAN Number"
                icon={CreditCard}
                iconClass="text-violet-500"
              >
                <input
                  id="panNumber"
                  type="text"
                  maxLength={10}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={form.panNumber}
                  onChange={(e) =>
                    setField(
                      "panNumber",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                    )
                  }
                  placeholder="ABCDE1234F"
                  className={`${inputClass} font-mono font-bold tracking-widest`}
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.panVerified}
                  disabled={!form.panNumber}
                  onChange={(e) => setField("panVerified", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />

                <span className="text-sm font-bold text-slate-700">
                  Mark PAN as verified
                </span>
              </label>
            </div>
          </section>

          {/* BANK */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Building className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bank Account &amp; UPI Details
                </h2>
                <p className="text-xs text-slate-500">
                  Used for withdrawal payouts. Clear all bank fields to remove
                  the account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="accountHolderName"
                label="Account Holder Name"
                icon={User}
                iconClass="text-violet-500"
              >
                <input
                  id="accountHolderName"
                  type="text"
                  maxLength={100}
                  value={form.accountHolderName}
                  onChange={(e) =>
                    setField("accountHolderName", e.target.value)
                  }
                  placeholder="Name as in bank"
                  className={inputClass}
                />
              </Field>

              <Field
                id="bankName"
                label="Bank Name"
                icon={Building}
                iconClass="text-pink-500"
              >
                <input
                  id="bankName"
                  type="text"
                  maxLength={100}
                  value={form.bankName}
                  onChange={(e) => setField("bankName", e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className={inputClass}
                />
              </Field>

              <Field
                id="accountNumber"
                label="Bank Account Number"
                icon={Landmark}
                iconClass="text-orange-500"
              >
                <input
                  id="accountNumber"
                  type="text"
                  inputMode="numeric"
                  maxLength={18}
                  autoComplete="off"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setField("accountNumber", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Account number"
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field
                id="ifscCode"
                label="IFSC Code"
                icon={ShieldCheck}
                iconClass="text-emerald-500"
              >
                <input
                  id="ifscCode"
                  type="text"
                  maxLength={11}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={form.ifscCode}
                  onChange={(e) =>
                    setField(
                      "ifscCode",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                    )
                  }
                  placeholder="e.g. SBIN0001234"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="upiId"
                  label="UPI ID"
                  icon={Send}
                  iconClass="text-cyan-500"
                >
                  <input
                    id="upiId"
                    type="text"
                    maxLength={100}
                    autoCapitalize="none"
                    autoComplete="off"
                    value={form.upiId}
                    onChange={(e) =>
                      setField(
                        "upiId",
                        e.target.value.toLowerCase().replace(/\s/g, "")
                      )
                    }
                    placeholder="e.g. username@okhdfcbank"
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ACTIONS */}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}