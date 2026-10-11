import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Smartphone } from "lucide-react";

import api from "../../services/api";

const TABS = [
  { key: "pending", label: "Pending Requests" },
  { key: "active", label: "Active Devices" },
  { key: "all", label: "Device History" },
];

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

const badge = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  revoked: "bg-slate-200 text-slate-600",
  rejected: "bg-red-100 text-red-700",
};

const DeviceRequests = () => {
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/devices", {
        params: { status: tab, search: search.trim() || undefined },
      });
      setDevices(data.devices || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (d) => {
    if (
      !window.confirm(
        `Approve new device for ${d.memberId}?\n\nConfirm you verified the customer's identity. The OLD device and all old sessions will be revoked.`
      )
    ) {
      return;
    }
    const note = window.prompt("Note (optional):") || "";

    try {
      setBusyId(d._id);
      setMessage("");
      const { data } = await api.post(
        `/admin/devices/${d._id}/approve`,
        { identityVerified: true, note }
      );
      setMessage(data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Approval failed.");
    } finally {
      setBusyId("");
    }
  };

  const reject = async (d) => {
    const note = window.prompt("Reason for rejection (optional):");
    if (note === null) return;

    try {
      setBusyId(d._id);
      setMessage("");
      const { data } = await api.post(
        `/admin/devices/${d._id}/reject`,
        { note }
      );
      setMessage(data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Rejection failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Device Management
            </h1>
            <p className="text-sm text-slate-500">
              Approve or reject new-device requests. Verify the
              customer's identity before approving.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Member ID"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-60"
          />
        </div>
      </div>

      {message && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No devices found.
          </div>
        ) : (
          devices.map((d) => (
            <div
              key={d._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/customers/${d.userId}`}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      {d.memberId}
                    </Link>
                    <span className="text-sm text-slate-700">
                      {d.customerName}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                        badge[d.status] || badge.revoked
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {d.deviceLabel || "Unknown device"}{" "}
                    <span className="font-mono text-xs text-slate-400">
                      {d.deviceIdShort}
                    </span>
                  </p>

                  <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    {d.customerPhone && (
                      <span>Phone: {d.customerPhone}</span>
                    )}
                    <span>Requested: {fmt(d.requestedAt || d.registeredAt)}</span>
                    {d.lastIp && <span>IP: {d.lastIp}</span>}
                    {d.approvedAt && (
                      <span>
                        Approved: {fmt(d.approvedAt)}
                        {d.approvedByName && ` by ${d.approvedByName}`}
                      </span>
                    )}
                    {d.revokedAt && (
                      <span>
                        Revoked: {fmt(d.revokedAt)}
                        {d.revokedByName && ` by ${d.revokedByName}`}
                      </span>
                    )}
                    {d.rejectedAt && (
                      <span>
                        Rejected: {fmt(d.rejectedAt)}
                        {d.rejectedByName && ` by ${d.rejectedByName}`}
                      </span>
                    )}
                    {d.replacedDeviceIdShort && (
                      <span>Replaced: {d.replacedDeviceIdShort}</span>
                    )}
                  </div>

                  {d.adminNote && (
                    <p className="mt-2 text-xs text-slate-500">
                      Note: {d.adminNote}
                    </p>
                  )}
                </div>

                {d.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === d._id}
                      onClick={() => approve(d)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === d._id}
                      onClick={() => reject(d)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceRequests;
