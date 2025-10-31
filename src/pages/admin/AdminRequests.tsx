// src/pages/admin/AdminRequests.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/client";
import { listAgents } from "@/services/adminAgents";

/** ===== Types ===== */
type RequestStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type AdminRequestRow = {
  id: number;
  serviceName: string;
  when?: string | null; // optional ISO
  status: RequestStatus;
  agentId?: number | null;
  agentName?: string | null;
  // optional cancellation info (names vary by API)
  cancelReason?: string | null;
  cancellationReason?: string | null;
  reason?: string | null;
  cancelledBy?: string | null;
  cancelledByRole?: string | null;
};

type AgentOption = { id: number; label: string };

/** ===== API helpers ===== */
async function listAdminRequests(): Promise<AdminRequestRow[]> {
  const res = await api.get("/api/v1/admin/requests");
  return res.data;
}

async function assignRequest(reqId: number, agentId: number) {
  const res = await api.post(`/api/v1/admin/requests/${reqId}/assign`, { agentId });
  return res.data;
}

async function cancelRequestAdmin(reqId: number, reason?: string) {
  const res = await api.post(`/api/v1/admin/requests/${reqId}/cancel`, { reason });
  return res.data;
}

/** CSV downloader — tries several endpoint variants */
async function downloadRequestsCsv(): Promise<void> {
  const candidates = [
    "/api/v1/requests/admin/export",
    "/api/v1/requests/admin/export?format=csv",
    "/api/v1/requests/admin/export.csv",
    "/api/v1/admin/requests/export",
    "/api/v1/admin/requests/export?format=csv",
    "/api/v1/admin/requests/export.csv",
  ];

  let lastErr: any;
  for (const path of candidates) {
    try {
      const res = await api.get(path, {
        responseType: "blob",
      });

      const mime =
        res.headers?.["content-type"] ||
        res.headers?.["Content-Type"] ||
        "text/csv;charset=utf-8";
      const blob = new Blob([res.data], { type: mime });

      const cd = res.headers?.["content-disposition"] || res.headers?.["Content-Disposition"];
      let filename = "requests.csv";
      if (cd && /filename=/i.test(cd)) {
        const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (m?.[1]) filename = decodeURIComponent(m[1]);
      } else if (/json/i.test(mime)) {
        throw new Error("Server returned JSON instead of CSV");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    } catch (e) {
      lastErr = e;
    }
  }

  const ax = lastErr;
  let serverMsg = "";
  try {
    if (ax?.response?.data) {
      const text = await new Response(ax.response.data).text();
      try {
        const json = JSON.parse(text);
        serverMsg = json?.message || json?.error || text;
      } catch {
        serverMsg = text;
      }
    }
  } catch {
    /* ignore */
  }
  const status = ax?.response?.status ?? "ERR";
  throw new Error(`CSV export failed (${status}): ${serverMsg || ax?.message || "Unknown error"}`);
}

/** ===== Normalizers ===== */
const toIdOrNull = (val: unknown): number | null => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function normalizeAgents(raw: any[]): AgentOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      const idRaw =
        a?.id ??
        a?.agentId ??
        a?.userId ??
        a?.employeeId ??
        a?.personId ??
        a?.accountId;
      const id = toIdOrNull(idRaw);
      if (id == null) return null;

      const fullName = [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
      const candidates = [
        a?.name,
        a?.fullName,
        fullName,
        a?.displayName,
        a?.username,
        a?.email,
      ];
      const label =
        (candidates.find((v) => typeof v === "string" && v.trim().length > 0) as
          | string
          | undefined) ?? `Agent #${id}`;

      return { id, label };
    })
    .filter(Boolean) as AgentOption[];
}

function getCancelReason(r: AdminRequestRow): string | null {
  return r.cancelReason ?? r.cancellationReason ?? r.reason ?? null;
}
function getCancelBy(r: AdminRequestRow): string | null {
  return (r.cancelledBy ?? r.cancelledByRole ?? null) || null;
}

/** ===== Component ===== */
export default function AdminRequests() {
  const [rows, setRows] = useState<AdminRequestRow[]>([]);
  const [agentOpts, setAgentOpts] = useState<AgentOption[]>([]);
  const [picked, setPicked] = useState<Record<number, number | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  // cancel modal
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const agentNameById = useMemo(() => {
    const m = new Map<number, string>();
    agentOpts.forEach((a) => m.set(a.id, a.label));
    return m;
  }, [agentOpts]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [reqs, rawAgents] = await Promise.all([listAdminRequests(), listAgents()]);
        setRows(Array.isArray(reqs) ? reqs : []);
        setAgentOpts(normalizeAgents(rawAgents ?? []));
        setPicked((prev) => {
          const next = { ...prev };
          reqs.forEach((r) => {
            const id = toIdOrNull(r.agentId as any);
            if (id != null && next[r.id] === undefined) next[r.id] = id;
          });
          return next;
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load admin requests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onPick(reqId: number, rawValue: string) {
    const num = rawValue === "" ? undefined : Number.parseInt(rawValue, 10);
    setPicked((p) => ({ ...p, [reqId]: num }));
  }

  async function onAssignOrReassign(reqId: number) {
    const agentId = picked[reqId];
    if (!agentId) {
      setErr("Please pick an agent before assigning.");
      return;
    }
    try {
      setSavingId(reqId);
      setErr(null);
      setOk(null);
      await assignRequest(reqId, agentId);
      const fresh = await listAdminRequests();
      setRows(fresh);
      setPicked((prev) => ({ ...prev, [reqId]: agentId }));
      setOk("Successfully reassigned to the agent!");
      setTimeout(() => setOk(null), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to assign agent.";
      setErr(msg);
    } finally {
      setSavingId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequestAdmin(cancelFor, cancelReason || undefined);
      const fresh = await listAdminRequests();
      setRows(fresh);
      setCancelFor(null);
      setCancelReason("");
      setOk("Request cancelled.");
      setTimeout(() => setOk(null), 2500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to cancel request.";
      setCancelErr(msg);
    } finally {
      setCancelSaving(false);
    }
  }

  async function onDownloadCsv() {
    try {
      setErr(null);
      setOk(null);
      setDownloading(true);
      await downloadRequestsCsv();
      setOk("CSV downloaded.");
      setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setErr(e?.message || "CSV export failed.");
    } finally {
      setDownloading(false);
    }
  }

  function renderStatusBadge(s: RequestStatus) {
    const color =
      s === "COMPLETED"
        ? "bg-emerald-700/30 text-emerald-300"
        : s === "IN_PROGRESS"
        ? "bg-amber-700/30 text-amber-300"
        : s === "ASSIGNED"
        ? "bg-sky-700/30 text-sky-300"
        : s === "PENDING"
        ? "bg-zinc-700/30 text-zinc-200"
        : "bg-rose-700/30 text-rose-200";
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${color}`}>
        {s}
      </span>
    );
  }

  const canAssign = (s: RequestStatus) => s === "PENDING";
  const canReassign = (s: RequestStatus) => s === "ASSIGNED";
  const canCancel = (s: RequestStatus) => s !== "COMPLETED" && s !== "CANCELLED";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold mb-0.5">Admin Requests</h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Assign when requests are <span className="font-medium">PENDING</span>, reassign while{" "}
            <span className="font-medium">ASSIGNED</span>. After the agent starts work, reassignment is
            locked.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={downloading}
          className="w-full sm:w-auto inline-flex justify-center px-3 sm:px-4 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60 text-sm"
          title="Download all requests as CSV"
        >
          {downloading ? "Downloading…" : "Download CSV"}
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded border border-rose-800/50 bg-rose-950/30 text-rose-200 px-3 sm:px-4 py-2.5 text-sm">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded border border-emerald-800/50 bg-emerald-950/30 text-emerald-200 px-3 sm:px-4 py-2.5 text-sm">
          {ok}
        </div>
      )}

      {loading ? (
        <div className="mt-4 text-sm opacity-70">Loading…</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-zinc-950/40 sticky top-0 z-10">
              <tr className="[&>th]:px-3 sm:[&>th]:px-4 [&>th]:py-2.5 text-left">
                <th className="whitespace-nowrap">ID</th>
                <th className="min-w-[12rem]">Service</th>
                <th className="min-w-[8rem]">When</th>
                <th className="min-w-[8rem]">Status</th>
                <th className="min-w-[18rem] sm:min-w-[20rem]">Agent</th>
                <th className="text-right pr-3 sm:pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const reason = getCancelReason(r);
                const by = getCancelBy(r);
                return (
                  <tr
                    key={r.id}
                    className="[&>td]:px-3 sm:[&>td]:px-4 [&>td]:py-2 border-t border-zinc-900 align-top"
                  >
                    <td className="text-zinc-400 whitespace-nowrap">{r.id}</td>
                    <td className="py-2">
                      <div className="font-medium">{r.serviceName}</div>
                    </td>
                    <td className="text-zinc-300">—</td>
                    <td className="py-2">
                      {renderStatusBadge(r.status)}
                      {r.status === "CANCELLED" && reason && (
                        <div className="mt-2 text-[11px] sm:text-xs rounded-md border border-rose-900/40 bg-rose-950/40 text-rose-200 px-2 py-1">
                          Cancelled{by ? ` by ${by}` : ""}: “{reason}”
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      <select
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-2 sm:py-1.5 outline-none"
                        value={picked[r.id] ?? ""}
                        onChange={(e) => onPick(r.id, e.target.value)}
                      >
                        <option value="">— Select agent —</option>
                        {agentOpts.map((a) => (
                          <option key={a.id} value={String(a.id)}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-[11px] sm:text-xs text-zinc-500">
                        Current:{" "}
                        {picked[r.id]
                          ? `${picked[r.id]} • ${agentNameById.get(picked[r.id]!) || "Agent"}`
                          : "none"}
                      </div>
                    </td>
                    <td className="text-right pr-3 sm:pr-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canAssign(r.status) && (
                          <button
                            type="button"
                            onClick={() => onAssignOrReassign(r.id)}
                            disabled={savingId === r.id}
                            className="px-2 sm:px-3 py-2 sm:py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs sm:text-sm"
                          >
                            {savingId === r.id ? "Saving…" : "Assign"}
                          </button>
                        )}
                        {canReassign(r.status) && (
                          <button
                            type="button"
                            onClick={() => onAssignOrReassign(r.id)}
                            disabled={savingId === r.id}
                            className="px-2 sm:px-3 py-2 sm:py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-xs sm:text-sm"
                          >
                            {savingId === r.id ? "Saving…" : "Reassign"}
                          </button>
                        )}
                        {canCancel(r.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelFor(r.id);
                              setCancelReason("");
                              setCancelErr(null);
                            }}
                            className="px-2 sm:px-3 py-2 sm:py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-xs sm:text-sm"
                          >
                            Cancel…
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-zinc-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel modal */}
      {cancelFor !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-sm sm:text-base">Cancel Request #{cancelFor}</div>
              <button
                className="text-zinc-400 hover:text-zinc-100 text-lg leading-none"
                onClick={() => setCancelFor(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <label className="block">
              <div className="text-xs sm:text-sm mb-1">Reason (optional)</div>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 outline-none"
              />
            </label>
            {cancelErr && <div className="text-rose-400 text-sm mt-2">{cancelErr}</div>}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-5">
              <button
                className="px-3 py-2 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
                onClick={() => setCancelFor(null)}
              >
                Close
              </button>
              <button
                className="px-3 py-2 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm"
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
// src/pages/admin/AdminRequests.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/client";
import { listAgents } from "@/services/adminAgents";

// ===== Types =====
type RequestStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type AdminRequestRow = {
  id: number;
  serviceName: string;
  when?: string | null; // optional ISO
  status: RequestStatus;
  agentId?: number | null;
  agentName?: string | null;
  // optional cancellation info (names vary by API)
  cancelReason?: string | null;
  cancellationReason?: string | null;
  reason?: string | null;
  cancelledBy?: string | null;
  cancelledByRole?: string | null;
};

type AgentOption = { id: number; label: string };

// ===== API helpers ===== 
async function listAdminRequests(): Promise<AdminRequestRow[]> {
  const res = await api.get("/api/v1/admin/requests");
  return res.data;
}

async function assignRequest(reqId: number, agentId: number) {
  const res = await api.post(`/api/v1/admin/requests/${reqId}/assign`, { agentId });
  return res.data;
}

async function cancelRequestAdmin(reqId: number, reason?: string) {
  const res = await api.post(`/api/v1/admin/requests/${reqId}/cancel`, { reason });
  return res.data;
}

// CSV downloader — tries several endpoint variants 
async function downloadRequestsCsv(): Promise<void> {
  const candidates = [
    "/api/v1/requests/admin/export",
    "/api/v1/requests/admin/export?format=csv",
    "/api/v1/requests/admin/export.csv",
    "/api/v1/admin/requests/export",
    "/api/v1/admin/requests/export?format=csv",
    "/api/v1/admin/requests/export.csv",
  ];

  let lastErr: any;
  for (const path of candidates) {
    try {
      const res = await api.get(path, {
        responseType: "blob", // accept whatever the server returns (csv/octet-stream)
      });

      const mime =
        res.headers?.["content-type"] ||
        res.headers?.["Content-Type"] ||
        "text/csv;charset=utf-8";
      const blob = new Blob([res.data], { type: mime });

      // Try to read a filename from Content-Disposition if server sets it
      const cd = res.headers?.["content-disposition"] || res.headers?.["Content-Disposition"];
      let filename = "requests.csv";
      if (cd && /filename=/i.test(cd)) {
        const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (m?.[1]) filename = decodeURIComponent(m[1]);
      } else if (/json/i.test(mime)) {
        // Defensive: if server accidentally returned JSON, bail and try the next variant
        throw new Error("Server returned JSON instead of CSV");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    } catch (e) {
      lastErr = e;
    }
  }

  // All attempts failed — surface a useful message
  const ax = lastErr;
  let serverMsg = "";
  try {
    if (ax?.response?.data) {
      const text = await new Response(ax.response.data).text();
      try {
        const json = JSON.parse(text);
        serverMsg = json?.message || json?.error || text;
      } catch {
        serverMsg = text;
      }
    }
  } catch {
    // ignore
  }
  const status = ax?.response?.status ?? "ERR";
  throw new Error(`CSV export failed (${status}): ${serverMsg || ax?.message || "Unknown error"}`);
}

// ===== Normalizers ===== 
const toIdOrNull = (val: unknown): number | null => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function normalizeAgents(raw: any[]): AgentOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      const idRaw =
        a?.id ??
        a?.agentId ??
        a?.userId ??
        a?.employeeId ??
        a?.personId ??
        a?.accountId;
      const id = toIdOrNull(idRaw);
      if (id == null) return null;

      const fullName = [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
      const candidates = [
        a?.name,
        a?.fullName,
        fullName,
        a?.displayName,
        a?.username,
        a?.email,
      ];
      const label =
        (candidates.find((v) => typeof v === "string" && v.trim().length > 0) as
          | string
          | undefined) ?? `Agent #${id}`;

      return { id, label };
    })
    .filter(Boolean) as AgentOption[];
}

function getCancelReason(r: AdminRequestRow): string | null {
  return r.cancelReason ?? r.cancellationReason ?? r.reason ?? null;
}
function getCancelBy(r: AdminRequestRow): string | null {
  return (r.cancelledBy ?? r.cancelledByRole ?? null) || null;
}

// ===== Component =====
export default function AdminRequests() {
  const [rows, setRows] = useState<AdminRequestRow[]>([]);
  const [agentOpts, setAgentOpts] = useState<AgentOption[]>([]);
  const [picked, setPicked] = useState<Record<number, number | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  // cancel modal
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const agentNameById = useMemo(() => {
    const m = new Map<number, string>();
    agentOpts.forEach((a) => m.set(a.id, a.label));
    return m;
  }, [agentOpts]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [reqs, rawAgents] = await Promise.all([listAdminRequests(), listAgents()]);
        setRows(Array.isArray(reqs) ? reqs : []);
        setAgentOpts(normalizeAgents(rawAgents ?? []));
        setPicked((prev) => {
          const next = { ...prev };
          reqs.forEach((r) => {
            const id = toIdOrNull(r.agentId as any);
            if (id != null && next[r.id] === undefined) next[r.id] = id;
          });
          return next;
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load admin requests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onPick(reqId: number, rawValue: string) {
    const num = rawValue === "" ? undefined : Number.parseInt(rawValue, 10);
    setPicked((p) => ({ ...p, [reqId]: num }));
  }

  async function onAssignOrReassign(reqId: number) {
    const agentId = picked[reqId];
    if (!agentId) {
      setErr("Please pick an agent before assigning.");
      return;
    }
    try {
      setSavingId(reqId);
      setErr(null);
      setOk(null);
      await assignRequest(reqId, agentId);
      const fresh = await listAdminRequests();
      setRows(fresh);
      setPicked((prev) => ({ ...prev, [reqId]: agentId }));
      setOk("Successfully reassigned to the agent!");
      setTimeout(() => setOk(null), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to assign agent.";
      setErr(msg);
    } finally {
      setSavingId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelFor) return;
    setCancelSaving(true);
    setCancelErr(null);
    try {
      await cancelRequestAdmin(cancelFor, cancelReason || undefined);
      const fresh = await listAdminRequests();
      setRows(fresh);
      setCancelFor(null);
      setCancelReason("");
      setOk("Request cancelled.");
      setTimeout(() => setOk(null), 2500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to cancel request.";
      setCancelErr(msg);
    } finally {
      setCancelSaving(false);
    }
  }

  async function onDownloadCsv() {
    try {
      setErr(null);
      setOk(null);
      setDownloading(true);
      await downloadRequestsCsv();
      setOk("CSV downloaded.");
      setTimeout(() => setOk(null), 2000);
    } catch (e: any) {
      setErr(e?.message || "CSV export failed.");
    } finally {
      setDownloading(false);
    }
  }

  function renderStatusBadge(s: RequestStatus) {
    const color =
      s === "COMPLETED"
        ? "bg-emerald-700/30 text-emerald-300"
        : s === "IN_PROGRESS"
        ? "bg-amber-700/30 text-amber-300"
        : s === "ASSIGNED"
        ? "bg-sky-700/30 text-sky-300"
        : s === "PENDING"
        ? "bg-zinc-700/30 text-zinc-200"
        : "bg-rose-700/30 text-rose-200";
    return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{s}</span>;
  }

  const canAssign = (s: RequestStatus) => s === "PENDING";
  const canReassign = (s: RequestStatus) => s === "ASSIGNED";
  const canCancel = (s: RequestStatus) => s !== "COMPLETED" && s !== "CANCELLED";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold mb-1">Admin Requests</h1>
          <p className="text-sm text-zinc-400">
            Assign when requests are <span className="font-medium">PENDING</span>, reassign while{" "}
            <span className="font-medium">ASSIGNED</span>. After the agent starts work, reassignment is
            locked.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={downloading}
          className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60"
          title="Download all requests as CSV"
        >
          {downloading ? "Downloading…" : "Download CSV"}
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded border border-rose-800/50 bg-rose-950/30 text-rose-200 px-4 py-3">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded border border-emerald-800/50 bg-emerald-950/30 text-emerald-200 px-4 py-3">
          {ok}
        </div>
      )}

      {loading ? (
        <div className="mt-4 text-sm opacity-70">Loading…</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>ID</th>
                <th>Service</th>
                <th>When</th>
                <th>Status</th>
                <th>Agent</th>
                <th className="text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const reason = getCancelReason(r);
                const by = getCancelBy(r);
                return (
                  <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 border-t border-zinc-900">
                    <td className="text-zinc-400">{r.id}</td>
                    <td>{r.serviceName}</td>
                    <td>—</td>
                    <td>
                      {renderStatusBadge(r.status)}
                      {r.status === "CANCELLED" && reason && (
                        <div className="mt-2 text-xs rounded-md border border-rose-900/40 bg-rose-950/40 text-rose-200 px-2 py-1">
                          Cancelled{by ? ` by ${by}` : ""}: “{reason}”
                        </div>
                      )}
                    </td>
                    <td className="min-w-[16rem]">
                      <select
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                        value={picked[r.id] ?? ""}
                        onChange={(e) => onPick(r.id, e.target.value)}
                      >
                        <option value="">— Select agent —</option>
                        {agentOpts.map((a) => (
                          <option key={a.id} value={String(a.id)}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-xs text-zinc-500">
                        Current:{" "}
                        {picked[r.id]
                          ? `${picked[r.id]} • ${agentNameById.get(picked[r.id]!) || "Agent"}`
                          : "none"}
                      </div>
                    </td>
                    <td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        {canAssign(r.status) && (
                          <button
                            type="button"
                            onClick={() => onAssignOrReassign(r.id)}
                            disabled={savingId === r.id}
                            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                          >
                            {savingId === r.id ? "Saving…" : "Assign"}
                          </button>
                        )}
                        {canReassign(r.status) && (
                          <button
                            type="button"
                            onClick={() => onAssignOrReassign(r.id)}
                            disabled={savingId === r.id}
                            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
                          >
                            {savingId === r.id ? "Saving…" : "Reassign"}
                          </button>
                        )}
                        {canCancel(r.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelFor(r.id);
                              setCancelReason("");
                              setCancelErr(null);
                            }}
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                          >
                            Cancel…
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-zinc-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {cancelFor !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Cancel Request #{cancelFor}</div>
              <button
                className="text-zinc-400 hover:text-zinc-100"
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
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 outline-none"
              />
            </label>
            {cancelErr && <div className="text-rose-400 text-sm mt-2">{cancelErr}</div>}
            <div className="flex justify-end gap-3 pt-5">
              <button
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                onClick={() => setCancelFor(null)}
              >
                Close
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
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