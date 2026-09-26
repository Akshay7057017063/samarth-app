import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  UserPlus,
  Eye,
  Pencil,
  Power,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";

import api from "../../services/api";
import AddCustomer from "./AddCustomer";

const Customer = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showAddCustomer, setShowAddCustomer] =
    useState(false);

  const [deleteCustomerData, setDeleteCustomerData] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // GET CUSTOMER ID
  // =====================================================

  const getCustomerId = (customer) => {
    return (
      customer?._id ||
      customer?.id ||
      customer?.memberId ||
      customer?.userCode
    );
  };

  // =====================================================
  // OPEN CUSTOMER DASHBOARD
  // =====================================================

  const openCustomerDashboard = (customer) => {
    const customerId = getCustomerId(customer);

    if (!customerId) {
      setError("Customer ID is missing.");
      return;
    }

    navigate(`/customers/${customerId}`);
  };

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async (
    showRefreshLoader = false
  ) => {
    try {
      setError("");

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/admin/users", {
        params: {
          search: search.trim(),
          userType,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load customers."
        );
      }

      setCustomers(response.data.users || []);
    } catch (err) {
      console.error(
        "Load customers error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = async (event) => {
    event.preventDefault();

    await loadCustomers(true);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await loadCustomers(true);
  };

  // =====================================================
  // ADD CUSTOMER SUCCESS
  // =====================================================

  const handleAddSuccess = async (data) => {
    setMessage(
      data?.message ||
        "Customer created successfully."
    );

    await loadCustomers(true);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // =====================================================
  // TOGGLE CUSTOMER STATUS
  // =====================================================

  const handleToggleStatus = async (customer) => {
    const customerId = customer?._id;

    if (!customerId) {
      setError("Customer ID is missing.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await api.put(
        `/admin/users/${customerId}/toggle-status`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update customer status."
        );
      }

      setMessage(
        response.data?.message ||
          "Customer status updated successfully."
      );

      await loadCustomers(true);

      setTimeout(() => {
        setMessage("");
      }, 4000);
    } catch (err) {
      console.error(
        "Toggle customer status error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update customer status."
      );
    }
  };

  // =====================================================
  // OPEN DELETE CONFIRMATION
  // =====================================================

  const handleDeleteClick = (customer) => {
    const customerId =
      getCustomerId(customer);

    if (!customerId) {
      setError("Customer ID is missing.");
      return;
    }

    setError("");
    setMessage("");

    setDeleteCustomerData({
      id: customerId,

      name:
        customer.name ||
        customer.fullName ||
        "Unnamed Customer",

      memberId:
        customer.memberId ||
        customer.userCode ||
        "-",

      email:
        customer.email || "-",
    });
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerData?.id) {
      setError("Customer ID is missing.");
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await api.delete(
        `/admin/users/${deleteCustomerData.id}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete customer."
        );
      }

      setDeleteCustomerData(null);

      setMessage(
        response.data?.message ||
          "Customer deleted successfully."
      );

      await loadCustomers(true);

      setTimeout(() => {
        setMessage("");
      }, 4000);
    } catch (err) {
      console.error(
        "Delete customer error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete customer."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // CUSTOMER CARD - MOBILE
  // =====================================================

  const renderCustomerCard = (
    customer,
    index
  ) => {
    const customerId =
      getCustomerId(customer);

    const name =
      customer.name ||
      customer.fullName ||
      "Unnamed Customer";

    const memberId =
      customer.memberId ||
      customer.userCode ||
      "-";

    const email =
      customer.email || "-";

    const phone =
      customer.phone ||
      customer.mobile ||
      "-";

    const type =
      customer.userType ||
      customer.type ||
      "UNPAID";

    const status =
      customer.status || "active";

    const isActive =
      String(status).toLowerCase() ===
      "active";

    return (
      <div
        key={customerId || index}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
      >
        {/* CARD HEADER */}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              {/* CUSTOMER NAME */}
              <button
                type="button"
                onClick={() =>
                  openCustomerDashboard(
                    customer
                  )
                }
                className="block max-w-full truncate text-left text-sm font-bold text-slate-900 transition hover:text-blue-600 sm:text-base"
              >
                {name}
              </button>

              <p className="mt-0.5 text-xs text-slate-400">
                Customer #{index + 1}
              </p>
            </div>
          </div>

          {/* STATUS */}

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            {isActive
              ? "Active"
              : "Inactive"}
          </span>
        </div>

        {/* CUSTOMER DETAILS */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* MEMBER ID */}

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Member ID
            </p>

            <div className="mt-1.5">
              <span className="inline-flex max-w-full truncate rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {memberId}
              </span>
            </div>
          </div>

          {/* TYPE */}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Type
            </p>

            <div className="mt-1.5">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  String(type).toUpperCase() ===
                  "PAID"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {String(
                  type
                ).toUpperCase()}
              </span>
            </div>
          </div>

          {/* EMAIL */}

          <div className="min-w-0 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-1 truncate text-sm text-slate-600">
              {email}
            </p>
          </div>

          {/* PHONE */}

          <div className="min-w-0 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Phone
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {phone}
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Actions
          </p>

          <div className="grid grid-cols-4 gap-2">
            {/* EYE */}

            <button
              type="button"
              title="View Customer Dashboard"
              onClick={() =>
                openCustomerDashboard(
                  customer
                )
              }
              className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* EDIT */}

            <button
              type="button"
              title="Edit Customer"
              onClick={() => {
                console.log(
                  "Edit customer:",
                  customerId
                );
              }}
              className="flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {/* STATUS */}

            <button
              type="button"
              title={
                isActive
                  ? "Deactivate Customer"
                  : "Activate Customer"
              }
              onClick={() =>
                handleToggleStatus(
                  customer
                )
              }
              className={`flex items-center justify-center rounded-lg border p-2.5 transition ${
                isActive
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-emerald-200 text-emerald-500 hover:bg-emerald-50"
              }`}
            >
              <Power className="h-4 w-4" />
            </button>

            {/* DELETE */}

            <button
              type="button"
              title="Delete Customer"
              onClick={() =>
                handleDeleteClick(
                  customer
                )
              }
              className="flex items-center justify-center rounded-lg border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Customers
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Manage customer accounts and
            customer information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setShowAddCustomer(true);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
        >
          <UserPlus className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p className="min-w-0 text-sm font-medium leading-5 text-emerald-700">
            {message}
          </p>
        </div>
      )}

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="min-w-0 text-sm font-medium leading-5 text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_200px_auto_auto]"
        >
          {/* SEARCH */}

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, email, phone, member ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CUSTOMER TYPE */}

          <select
            value={userType}
            onChange={(event) =>
              setUserType(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              All Customer Types
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="UNPAID">
              Unpaid
            </option>
          </select>

          {/* SEARCH BUTTON */}

          <button
            type="submit"
            disabled={
              loading || refreshing
            }
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
          >
            <Search className="h-4 w-4" />
            Search
          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loading || refreshing
            }
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
        </form>
      </div>

      {/* =================================================
          CUSTOMER LIST
      ================================================= */}

      <div className="w-full min-w-0">
        {/* =================================================
            DESKTOP / TABLET
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          {/* HEADER */}

          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Customer List
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {customers.length} customer
                {customers.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center px-5">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />

                <span className="text-sm font-medium">
                  Loading customers...
                </span>
              </div>
            </div>
          ) : customers.length === 0 ? (
            /* EMPTY */
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                No customers found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Try changing your search
                or filter, or create a
                new customer.
              </p>
            </div>
          ) : (
            /* TABLE */
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Member ID
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Phone
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {customers.map(
                    (
                      customer,
                      index
                    ) => {
                      const customerId =
                        getCustomerId(
                          customer
                        );

                      const name =
                        customer.name ||
                        customer.fullName ||
                        "Unnamed Customer";

                      const memberId =
                        customer.memberId ||
                        customer.userCode ||
                        "-";

                      const email =
                        customer.email ||
                        "-";

                      const phone =
                        customer.phone ||
                        customer.mobile ||
                        "-";

                      const type =
                        customer.userType ||
                        customer.type ||
                        "UNPAID";

                      const status =
                        customer.status ||
                        "active";

                      const isActive =
                        String(
                          status
                        ).toLowerCase() ===
                        "active";

                      return (
                        <tr
                          key={
                            customerId ||
                            index
                          }
                          className="transition hover:bg-slate-50"
                        >
                          {/* CUSTOMER */}

                          <td className="px-5 py-4">
                            <div className="flex min-w-[180px] items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                {name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                {/* CUSTOMER NAME */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openCustomerDashboard(
                                      customer
                                    )
                                  }
                                  className="block max-w-[180px] truncate text-left text-sm font-semibold text-slate-800 transition hover:text-blue-600"
                                  title="Open Customer Dashboard"
                                >
                                  {name}
                                </button>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  Customer #
                                  {index +
                                    1}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* MEMBER ID */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {memberId}
                            </span>
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4">
                            <span className="block max-w-[220px] truncate text-sm text-slate-600">
                              {email}
                            </span>
                          </td>

                          {/* PHONE */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="text-sm text-slate-600">
                              {phone}
                            </span>
                          </td>

                          {/* TYPE */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                String(
                                  type
                                ).toUpperCase() ===
                                "PAID"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {String(
                                type
                              ).toUpperCase()}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                }`}
                              />

                              {isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* EYE */}

                              <button
                                type="button"
                                title="View Customer Dashboard"
                                onClick={() =>
                                  openCustomerDashboard(
                                    customer
                                  )
                                }
                                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                title="Edit Customer"
                                onClick={() => {
                                  console.log(
                                    "Edit customer:",
                                    customerId
                                  );
                                }}
                                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* STATUS */}

                              <button
                                type="button"
                                title={
                                  isActive
                                    ? "Deactivate Customer"
                                    : "Activate Customer"
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    customer
                                  )
                                }
                                className={`rounded-lg border p-2 transition ${
                                  isActive
                                    ? "border-red-200 text-red-500 hover:bg-red-50"
                                    : "border-emerald-200 text-emerald-500 hover:bg-emerald-50"
                                }`}
                              >
                                <Power className="h-4 w-4" />
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                title="Delete Customer"
                                onClick={() =>
                                  handleDeleteClick(
                                    customer
                                  )
                                }
                                className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =================================================
            MOBILE CUSTOMER CARDS
        ================================================= */}

        <div className="md:hidden">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Customer List
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {customers.length} customer
                {customers.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center px-5">
                <div className="flex flex-col items-center gap-3 text-center text-slate-500">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />

                  <span className="text-sm font-medium">
                    Loading customers...
                  </span>
                </div>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>

                <h3 className="text-base font-semibold text-slate-800">
                  No customers found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Try changing your search
                  or filter, or create a
                  new customer.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3 sm:p-4">
                {customers.map(
                  renderCustomerCard
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          ADD CUSTOMER
      ================================================= */}

      <AddCustomer
        open={showAddCustomer}
        onClose={() =>
          setShowAddCustomer(false)
        }
        onSuccess={handleAddSuccess}
      />

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {deleteCustomerData && (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-slate-900/40 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
          <div className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900">
                    Delete Customer
                  </h3>

                  <p className="text-xs text-slate-500">
                    Permanent action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  !deleting &&
                  setDeleteCustomerData(
                    null
                  )
                }
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="px-4 py-5 sm:px-5">
              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to
                delete this customer?
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {deleteCustomerData.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {
                        deleteCustomerData.name
                      }
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {
                        deleteCustomerData.memberId
                      }
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {
                        deleteCustomerData.email
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 sm:px-4">
                <p className="text-xs font-medium leading-5 text-red-700">
                  This will permanently
                  remove the customer and
                  their associated wallet and
                  sales records.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteCustomerData(
                    null
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  handleDeleteCustomer
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;