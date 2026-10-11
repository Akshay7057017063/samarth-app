import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";

import api from "../services/api";

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

const badge = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  revoked: "bg-slate-200 text-slate-600",
  rejected: "bg-red-100 text-red-700",
};

// Shows registered device + history of one customer and allows
const DevicePanel = ({ customerId }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!customerId || customerId === "-") return;
    try {
      setLoading(true);
      const { data } = await api.get(
        `/admin/customers/${customerId}/devices`
      );
      setDevices(data.devices || []);
      setError("");
    } catch (e) {
      setError(
        e.response?.data?.message || "Failed to load devices."
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const active = devices.find((d) => d.status === "active");

  const handleRevoke = async () => {
    if (
      !window.confirm(
        "Have you verified this customer's identity (call / video / in person)?\n\nThis removes the registered device and logs the customer out everywhere."
      )
    ) {
      return;
    }
    const note = window.prompt("Note (optional):") || "";

    try {
      setBusy(true);
      setMessage("");
      const { data } = await api.post(
        `/admin/customers/${customerId}/devices/revoke`,
        { identityVerified: true, note }
      );
      setMessage(data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to revoke device.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Registered Device
            </h2>
            <p className="text-xs text-slate-500">
              One active device per account
            </p>
          </div>
        </div>

        {active && (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Reset Device
          </button>
        )}
      </div>

      <div className="p-5">
        {message && (
          <p className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : devices.length === 0 ? (
          <p className="text-sm text-slate-500">
            No device registered yet. The first login will register one.
          </p>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d._id}
                className="rounded-xl border border-slate-200 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                      badge[d.status] || badge.revoked
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {d.deviceLabel || "Unknown device"}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {d.deviceIdShort}
                  </span>
                </div>

                <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Registered: {fmt(d.registeredAt)}</span>
                  <span>Last login: {fmt(d.lastLoginAt)}</span>
                  {d.requestedAt && (
                    <span>Requested: {fmt(d.requestedAt)}</span>
                  )}
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
                  {d.lastIp && <span>IP: {d.lastIp}</span>}
                </div>

                {d.adminNote && (
                  <p className="mt-2 text-xs text-slate-500">
                    Note: {d.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicePanel;
