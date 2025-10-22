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

      {/* Cancel modal */}
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





/*
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { getUserMine, cancelRequest, type UserMineRow, type Status } from "@/api/requests";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function canUserCancel(status: Status) {
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

export default function UserDashboard() {
  const nav = useNavigate();
  const { role } = useAuth();

  // 🔐 Option B: self-redirect AGENT/ADMIN away from the user dashboard
  useEffect(() => {
    if (role === "AGENT") {
      nav("/app/agent", { replace: true });
    } else if (role === "ADMIN") {
      nav("/app/admin", { replace: true });
    }
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
      // uses axios instance with JWT from AuthProvider (client.ts interceptor)
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
    let alive = true;
    (async () => {
      await refresh();
    })();
    return () => {
      alive = false;
    };
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
              <tr><td className="p-3" colSpan={7}>Loading…</td></tr>
            ) : err ? (
              <tr><td className="p-3 text-red-400" colSpan={7}>{err}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={7}>No requests yet</td></tr>
            ) : (
              rows.map((r) => {
                const canCancelNow = canUserCancel(r.status);
                const canFeedback = r.status === "COMPLETED";
                return (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="p-3">#{r.id}</td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">{fmtDate(r.slotStartAtLocal)}</td>
                    <td className="p-3">{r.status}</td>
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



/*import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserMine,
  cancelRequest,
  type UserMineRow,
  type Status,
} from "@/api/requests";

// If you have an auth hook/context, replace this stub.
function useAuthToken(): string {
  // e.g., return useAuth().token
  return localStorage.getItem("auth_token") ?? "";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function canUserCancel(status: Status) {
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

export default function UserDashboard() {
  const [rows, setRows] = useState<UserMineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // cancel modal state
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const token = useAuthToken();
  const nav = useNavigate();

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getUserMine(token);
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
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequest(cancelFor, token, cancelReason || undefined);
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
      <h1 className="text-2xl font-semibold">My Requests</h1>
      <p className="text-sm text-slate-400">
        Manage your service requests.
      </p>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={7}>Loading…</td></tr>
            ) : err ? (
              <tr><td className="p-3 text-red-400" colSpan={7}>{err}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={7}>No requests yet</td></tr>
            ) : (
              rows.map((r) => {
                const canFeedback = r.status === "COMPLETED";
                const canCancelNow = canUserCancel(r.status);
                return (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="p-3">#{r.id}</td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">{fmtDate(r.slotStartAtLocal)}</td>
                    <td className="p-3">{r.agentName ?? "—"}</td>
                    <td className="p-3">{r.inventoryVehicleId ?? "—"}</td>
                    <td className="p-3">{r.agentEmail ?? "—"}</td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3 space-x-2">
                      {canFeedback ? (
                        <button
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => nav(`/user/feedback/${r.id}`)}
                        >
                          Leave feedback
                        </button>
                      ) : null}
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




/*import { useEffect, useState } from "react";
import { getJSON, postJSON } from "@/services/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

type UserRequestRow = {
  id: number;
  serviceName: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  agentName?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function canUserCancel(status: UserRequestRow["status"]) {
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

async function cancelRequestForUser(requestId: number, reason?: string) {
  const body = reason ? { reason } : {};
  const candidates = [
    `/api/v1/requests/${requestId}/cancel`,
    `/api/v1/user/requests/${requestId}/cancel`,
    `/api/v1/requests/cancel?id=${requestId}`,
  ];
  let lastErr: any = null;
  for (const url of candidates) {
    try {
      await postJSON(url, body);
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Cancel failed");
}

export default function UserDashboard() {
  const [rows, setRows] = useState<UserRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // cancel modal
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const nav = useNavigate();
  const { role, token } = useAuth();

  // ⛳️ Hard-redirect agents/admins to their dashboards if they land here
  useEffect(() => {
    if (!token) return;
    if (role === "AGENT") nav("/app/agent", { replace: true });
    else if (role === "ADMIN") nav("/app/admin", { replace: true });
  }, [role, token, nav]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getJSON<UserRequestRow[]>("/api/v1/requests/mine");
      setRows(Array.isArray(data) ? data : []);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[UserDashboard] /api/v1/requests/mine →", data);
      }
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
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequestForUser(cancelFor, cancelReason || undefined);
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
      <p className="text-sm text-slate-400">
        Manage your service requests.
      </p>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Start</th>
              <th className="text-left p-3">End</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Agent</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={7}>Loading…</td></tr>
            ) : err ? (
              <tr><td className="p-3 text-red-400" colSpan={7}>{err}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={7}>No requests yet</td></tr>
            ) : (
              rows.map((r) => {
                const canFeedback = r.status === "COMPLETED";
                const canCancelNow = canUserCancel(r.status);
                return (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="p-3">#{r.id}</td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">{fmtDate(r.scheduledStart)}</td>
                    <td className="p-3">{fmtDate(r.scheduledEnd)}</td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3">{r.agentName || "-"}</td>
                    <td className="p-3 space-x-2">
                      {canFeedback ? (
                        <button
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => nav(`/user/feedback/${r.id}`)}
                        >
                          Leave feedback
                        </button>
                      ) : null}
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