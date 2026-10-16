import { useState } from "react";
import {
  X,
  UserPlus,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";

import api from "../../services/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  sponsorCode: "",
  position: "left",
};

const AddCustomer = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter customer name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter customer email.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter customer phone number.");
      return;
    }

    if (!form.password.trim()) {
      setError("Please enter customer password.");
      return;
    }

    if (form.password.length < 6) {
      setError("Customer password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        sponsorCode: form.sponsorCode.trim(),
        position: form.position,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to create customer."
        );
      }

      setForm(initialForm);

      if (onSuccess) {
        await onSuccess(response.data);
      }

      onClose();
    } catch (error) {
      console.error("Add customer error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create customer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setError("");
    setForm(initialForm);
    onClose();
  };

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Fixed Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="add-customer-title"
              className="text-lg font-bold text-slate-900 sm:text-xl"
            >
              Add Customer
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Create a new customer account
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close add customer form"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form - scrollbar hidden */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-6"
        >
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-red-700 sm:px-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="break-words text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Name */}
            <div className="min-w-0">
              <label htmlFor="customer-name" className={labelClass}>
                Full Name <span className="text-red-500">*</span>
              </label>

              <input
                id="customer-name"
                type="text"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={loading}
                required
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="min-w-0">
              <label htmlFor="customer-email" className={labelClass}>
                Email Address <span className="text-red-500">*</span>
              </label>

              <input
                id="customer-email"
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="customer@example.com"
                disabled={loading}
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div className="min-w-0">
              <label htmlFor="customer-phone" className={labelClass}>
                Mobile Number <span className="text-red-500">*</span>
              </label>

              <input
                id="customer-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={15}
                disabled={loading}
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="min-w-0">
              <label htmlFor="customer-password" className={labelClass}>
                Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="customer-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  minLength={6}
                  disabled={loading}
                  required
                  className={`${inputClass} pl-10`}
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Minimum 6 characters
              </p>
            </div>

            {/* Sponsor */}
            <div className="min-w-0">
              <label htmlFor="customer-sponsor" className={labelClass}>
                Sponsor Code
              </label>

              <input
                id="customer-sponsor"
                type="text"
                name="sponsorCode"
                value={form.sponsorCode}
                onChange={handleChange}
                placeholder="Enter sponsor code"
                autoCapitalize="characters"
                disabled={loading}
                className={`${inputClass} uppercase`}
              />
            </div>

            {/* Position */}
            <div className="min-w-0">
              <label htmlFor="customer-position" className={labelClass}>
                Position
              </label>

              <select
                id="customer-position"
                name="position"
                value={form.position}
                onChange={handleChange}
                disabled={loading}
                className={`${inputClass} appearance-auto`}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:mt-6 sm:p-4">
            <p className="text-sm font-semibold text-blue-800">
              Login credentials
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              The system automatically generates the customer's Account ID.
              The admin sets the password manually.
            </p>

            <div className="mt-3 space-y-2 rounded-lg bg-white/70 p-3 text-xs text-blue-800 sm:flex sm:items-center sm:justify-between sm:space-y-0 sm:gap-3">
              <p>
                <span className="font-semibold">Account ID:</span>{" "}
                Automatically generated
              </p>

              <p>
                <span className="font-semibold">Password:</span>{" "}
                Set by admin
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col-reverse gap-3 pb-1 sm:mt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;