// src/pages/app/UserDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import {
  getUserMine,
  cancelRequest,
  type UserMineRow,
  type Status,
} from "@/api/requests";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function canUserCancel(status: Status) {
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

// ✅ Extract first 8 chars before '@'
function extractNameFromEmail(email?: string | null) {
  if (!email) return "—";
  const atIdx = email.indexOf("@");
  const base = atIdx > 0 ? email.slice(0, atIdx) : email;
  return base.length > 8 ? base.slice(0, 8) : base;
}

export default function UserDashboard() {
  const nav = useNavigate();
  const { role, token, isAuthReady } = useAuth(); // ✅ new flag from AuthProvider
  const [rows, setRows] = useState<UserMineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  // ✅ Wait for Auth to finish before redirecting or loading
  useEffect(() => {
    if (!isAuthReady) return; // wait until provider finished checking token
    if (!token) return; // let PrivateRoute handle redirects
    if (role === "AGENT") nav("/app/agent", { replace: true });
    else if (role === "ADMIN") nav("/app/admin", { replace: true });
  }, [role, token, isAuthReady, nav]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getUserMine();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load requests";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthReady || !token) return;
    refresh();
  }, [isAuthReady, token]);

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequest(cancelFor, cancelReason || undefined);
      await refresh();
      setCancelFor(null);
      setCancelReason("");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to cancel";
      setCancelErr(msg);
    } finally {
      setCancelSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-2">My Dashboard</h1>
      <p className="text-slate-400 mb-8 text-sm sm:text-base">
        Manage your booked services easily.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-lg">
        <table className="w-full text-sm sm:text-base">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-red-400">
                  {err}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400">
                  No requests yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const canCancel = canUserCancel(r.status as Status);
                const canFeedback = r.status === "COMPLETED";
                const shortName = extractNameFromEmail(r.agentEmail);

                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-800 hover:bg-slate-800/30 transition"
                  >
                    <td className="p-3">{r.id}</td>
                    <td className="p-3 font-medium text-blue-300">{r.serviceName}</td>
                    <td className="p-3 text-slate-300">{fmtDate(r.slotStartAtLocal)}</td>
                    <td
                      className={`p-3 font-semibold ${
                        r.status === "COMPLETED"
                          ? "text-emerald-400"
                          : r.status === "CANCELLED"
                          ? "text-rose-400"
                          : "text-amber-300"
                      }`}
                    >
                      {r.status}
                    </td>

                    {/* ✅ Vehicle: show number only, no # prefix */}
                    <td className="p-3 text-slate-300">
                      {r.inventoryVehicleId ? r.inventoryVehicleId : "—"}
                    </td>

                    {/* ✅ Agent name + avatar */}
                    <td className="p-3 text-slate-300 flex items-center gap-2">
                      {r.agentEmail ? (
                        <>
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                            {r.agentEmail.charAt(0).toUpperCase()}
                          </div>
                          <span title={r.agentEmail}>{shortName}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-3 space-x-2">
                      {canFeedback && (
                        <button
                          onClick={() => nav(`/user/feedback/${r.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition"
                        >
                          Feedback
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => {
                            setCancelFor(r.id);
                            setCancelReason("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel modal */}
      {cancelFor !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold text-lg mb-4">
              Cancel Request #{cancelFor}
            </h2>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Optional reason"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none text-slate-100"
            />
            {cancelErr && <div className="text-red-400 text-sm mt-2">{cancelErr}</div>}

            <div className="flex justify-end gap-3 pt-5">
              <button
                onClick={() => setCancelFor(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelSaving}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50"
              >
                {cancelSaving ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










































/*
//working code
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import {
  getUserMine,
  cancelRequest,
  type UserMineRow,
  type Status,
} from "@/api/requests";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function canUserCancel(status: Status) {
  // user can cancel until work is completed (and not after it’s already cancelled)
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

// Friendly readers for whatever your API returns
function getCancelReason(row: any): string | null {
  return row?.cancelReason ?? row?.cancellationReason ?? row?.reason ?? null;
}
function getCancelledBy(row: any): string | null {
  return (row?.cancelledBy ?? row?.cancelledByRole ?? null) || null;
}

export default function UserDashboard() {
  const nav = useNavigate();
  const { role } = useAuth();

  // redirect non-users away from user dashboard
  useEffect(() => {
    if (role === "AGENT") nav("/app/agent", { replace: true });
    else if (role === "ADMIN") nav("/app/admin", { replace: true });
  }, [role, nav]);

  const [rows, setRows] = useState<UserMineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // cancel modal state
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getUserMine();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const status = e?.response?.status ?? "ERR";
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        `Failed to load (status ${status})`;
      setErr(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequest(cancelFor, cancelReason || undefined);
      await refresh();
      setCancelFor(null);
      setCancelReason("");
    } catch (e: any) {
      const status = e?.response?.status ?? "ERR";
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        `Failed to cancel (status ${status})`;
      setCancelErr(msg);
    } finally {
      setCancelSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Dashboard</h1>
      <p className="text-sm text-slate-400">Manage your service requests.</p>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="p-3 text-red-400" colSpan={7}>
                  {err}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={7}>
                  No requests yet
                </td>
              </tr>
            ) : (
              rows.map((r: any) => {
                const canCancelNow = canUserCancel(r.status as Status);
                const canFeedback = r.status === "COMPLETED";
                const reason = getCancelReason(r);
                const cancelledBy = getCancelledBy(r);

                return (
                  <tr key={r.id} className="border-t border-slate-800 align-top">
                    <td className="p-3">#{r.id}</td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">{fmtDate(r.slotStartAtLocal)}</td>
                    <td className="p-3">
                      {r.status}
                      {r.status === "CANCELLED" && reason && (
                        <div className="mt-2 text-xs rounded-md border border-rose-900/40 bg-rose-950/40 text-rose-200 px-2 py-1">
                          Cancelled{cancelledBy ? ` by ${cancelledBy}` : ""}: “{reason}”
                        </div>
                      )}
                    </td>
                    <td className="p-3">{r.inventoryVehicleId ?? "—"}</td>
                    <td className="p-3">{r.agentEmail ?? "—"}</td>
                    <td className="p-3 space-x-2">
                      {canFeedback && (
                        <button
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => nav(`/user/feedback/${r.id}`)}
                        >
                          Leave feedback
                        </button>
                      )}
                      {canCancelNow ? (
                        <button
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                          onClick={() => {
                            setCancelFor(r.id);
                            setCancelReason("");
                            setCancelErr(null);
                          }}
                        >
                          Cancel…
                        </button>
                      ) : (
                        !canFeedback && <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      //{/* Cancel modal }
      {cancelFor !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Cancel Request #{cancelFor}</div>
              <button
                className="text-slate-400 hover:text-slate-200"
                onClick={() => setCancelFor(null)}
              >
                ✕
              </button>
            </div>
            <label className="block">
              <div className="text-sm mb-1">Reason (optional)</div>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
              />
            </label>
            {cancelErr && <div className="text-red-400 text-sm mt-2">{cancelErr}</div>}
            <div className="flex justify-end gap-3 pt-5">
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                onClick={() => setCancelFor(null)}
              >
                Close
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50"
                onClick={confirmCancel}
                disabled={cancelSaving}
              >
                {cancelSaving ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

*/