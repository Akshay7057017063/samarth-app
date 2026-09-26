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

  if (!open) {
    return null;
  }

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
      setError(
        "Customer password must be at least 6 characters."
      );
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
          response.data?.message ||
            "Failed to create customer."
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
    if (loading) {
      return;
    }

    setError("");
    setForm(initialForm);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Add Customer
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a new customer account
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="customer@example.com"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mobile Number
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={15}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter customer password"
                  minLength={6}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Minimum 6 characters
              </p>
            </div>

            {/* Sponsor */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Sponsor Code
              </label>

              <input
                type="text"
                name="sponsorCode"
                value={form.sponsorCode}
                onChange={handleChange}
                placeholder="SI107476"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            {/* Position */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Position
              </label>

              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              >
                <option value="left">
                  Left
                </option>

                <option value="right">
                  Right
                </option>
              </select>
            </div>
          </div>

          {/* Login credentials information */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              Login credentials
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              The system will automatically generate the
              customer's Account ID. The password will be
              created manually by the admin.
            </p>

            <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-blue-800">
              <p>
                <span className="font-semibold">
                  Account ID:
                </span>{" "}
                Automatically generated
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Password:
                </span>{" "}
                Set by admin
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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