/*
import { useEffect, useState } from 'react';
import { getAgentMine, type AgentRow } from '@/api/requests';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function AgentDashboard() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // simple runtime debug info
  const [debug, setDebug] = useState<{
    lastUrl?: string;
    lastStatus?: number | string;
    tokenDots?: number;
  }>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // show quick token sanity in UI
        const tok = localStorage.getItem('autobridge.token') || '';
        setDebug((d) => ({ ...d, tokenDots: (tok.match(/\./g) || []).length }));

        // call API
        const data = await getAgentMine();
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        const status = e?.response?.status ?? 'ERR';
        const url = e?.config?.url
          ? (e.config.url.startsWith('http')
              ? e.config.url
              : `${import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'}${e.config.url}`)
          : undefined;
        setDebug((d) => ({ ...d, lastUrl: url, lastStatus: status }));
        setErr(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          `Failed to load (status ${status})`
        );
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
      <p className="text-sm text-slate-400">Your assigned service requests.</p>
//one line deleted here for testing the code.
      {err && (
        <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-4 text-rose-200 text-sm">
          <div className="font-semibold mb-1">Load error</div>
          <div>Message: {err}</div>
          <div>URL: {debug.lastUrl || '—'}</div>
          <div>Status: {String(debug.lastStatus ?? '—')}</div>
          <div>Token parts (must be 3): {debug.tokenDots !== undefined ? debug.tokenDots + 1 : '—'}</div>
          {debug.lastUrl && (
          <pre className="mt-2 whitespace-pre-wrap">
                    {`# Reproduce in shell:
                    API="${import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'}"
                    TOKEN="$(pbpaste)"  # or paste your token here
                    curl -i "$API${new URL(debug.lastUrl).pathname}" \\
                    -H "Authorization: Bearer $TOKEN"`}
            </pre>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-4 text-slate-400" colSpan={6}>No requests yet</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.serviceName}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{fmt(r.slotStartAtLocal)}</td>
                  <td className="p-3">{r.inventoryVehicleId ?? '—'}</td>
                  <td className="p-3">{r.agentEmail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/


/*// src/pages/agent/AgentDashboard.tsx
import { useEffect, useState } from 'react';
import { getAgentMine, type AgentRow } from '@/api/requests';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function AgentDashboard() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // simple runtime debug info
  const [debug, setDebug] = useState<{
    lastUrl?: string;
    lastStatus?: number | string;
    tokenDots?: number;
  }>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // quick token sanity in UI (JWT should have 2 dots → 3 parts)
        const tok = localStorage.getItem('autobridge.token') || '';
        setDebug((d) => ({ ...d, tokenDots: (tok.match(/\./g) || []).length }));

        const data = await getAgentMine();
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        const status = e?.response?.status ?? 'ERR';
        const url = e?.config?.url
          ? (e.config.url.startsWith('http')
              ? e.config.url
              : `${import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'}${e.config.url}`)
          : undefined;
        setDebug((d) => ({ ...d, lastUrl: url, lastStatus: status }));
        setErr(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          `Failed to load (status ${status})`
        );
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
      <p className="text-sm text-slate-400">Your assigned service requests.</p>

      {err && (
        <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-4 text-rose-200 text-sm">
          <div className="font-semibold mb-1">Load error</div>
          <div>Message: {err}</div>
          <div>URL: {debug.lastUrl || '—'}</div>
          <div>Status: {String(debug.lastStatus ?? '—')}</div>
          <div>Token parts (must be 3): {debug.tokenDots !== undefined ? debug.tokenDots + 1 : '—'}</div>
          {debug.lastUrl && (
            <pre className="mt-2 whitespace-pre-wrap">
{`# Reproduce in shell:
API="${import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'}"
TOKEN="$(pbpaste)"  # paste your token here (or set manually)
curl -i "$API${new URL(debug.lastUrl).pathname}" \\
  -H "Authorization: Bearer $TOKEN"`}
            </pre>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-4 text-slate-400" colSpan={6}>No requests yet</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.serviceName}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{fmt(r.slotStartAtLocal)}</td>
                  <td className="p-3">{r.inventoryVehicleId ?? '—'}</td>
                  <td className="p-3">{r.agentEmail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/


/*
import { useEffect, useState } from 'react';
import { getAgentMine, type AgentRow } from '@/api/requests';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function AgentDashboard() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // simple runtime debug info
  const [debug, setDebug] = useState<{
    lastUrl?: string;
    lastStatus?: number | string;
    tokenDots?: number;
  }>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const tok = localStorage.getItem('autobridge.token') || '';
        setDebug((d) => ({ ...d, tokenDots: (tok.match(/\./g) || []).length }));

        const data = await getAgentMine();
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log("[AgentDashboard] /api/v1/agent/requests →", data);
        }
      } catch (e: any) {
        const status = e?.response?.status ?? 'ERR';
        const url = e?.config?.url
          ? (e.config.url.startsWith('http')
              ? e.config.url
              : `${import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'}${e.config.url}`)
          : undefined;
        setDebug((d) => ({ ...d, lastUrl: url, lastStatus: status }));
        setErr(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          `Failed to load (status ${status})`
        );
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
      <p className="text-sm text-slate-400">Your assigned service requests.</p>
    
      {err && (
        <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-4 text-rose-200 text-sm">
          <div className="font-semibold mb-1">Load error</div>
          <div>Message: {err}</div>
          <div>URL: {debug.lastUrl || '—'}</div>
          <div>Status: {String(debug.lastStatus ?? '—')}</div>
          <div>Token parts (must be 3): {debug.tokenDots !== undefined ? debug.tokenDots + 1 : '—'}</div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Agent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-4 text-slate-400" colSpan={6}>No requests yet</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.serviceName}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{fmt(r.slotStartAtLocal)}</td>
                  <td className="p-3">{r.inventoryVehicleId ?? '—'}</td>
                  <td className="p-3">{r.agentEmail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/



 
import { useEffect, useState } from "react";
import {
  getAgentMine,
  startRequest,
  completeRequest,
  cancelRequest,
  type AgentRow,
  type Status,
} from "@/api/requests";

function fmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function canStart(status: Status) {
  return status === "ASSIGNED";
}
function canComplete(status: Status) {
  return status === "IN_PROGRESS";
}
function canCancel(status: Status) {
  // allow cancel before completion
  return status === "PENDING" || status === "ASSIGNED" || status === "IN_PROGRESS";
}

// Normalized readers
function getCancelReason(row: any): string | null {
  return row?.cancelReason ?? row?.cancellationReason ?? row?.reason ?? null;
}
function getCancelledBy(row: any): string | null {
  return (row?.cancelledBy ?? row?.cancelledByRole ?? null) || null;
}

export default function AgentDashboard() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Cancel modal
  const [cancelFor, setCancelFor] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getAgentMine();
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

  async function onStart(id: number) {
    try {
      await startRequest(id);
      await refresh();
    } catch (e: any) {
      alert(
        `Start failed: ${e?.response?.status || ""} ${
          e?.response?.data?.message || e?.message || ""
        }`.trim()
      );
    }
  }

  async function onComplete(id: number) {
    try {
      await completeRequest(id);
      await refresh();
    } catch (e: any) {
      alert(
        `Complete failed: ${e?.response?.status || ""} ${
          e?.response?.data?.message || e?.message || ""
        }`.trim()
      );
    }
  }

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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
      <p className="text-sm text-slate-400">Your assigned service requests.</p>

      {err && (
        <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-4 text-rose-200 text-sm">
          <div className="font-semibold mb-1">Load error</div>
          <div>{err}</div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={6}>
                  No requests yet
                </td>
              </tr>
            ) : (
              rows.map((r: any) => {
                const reason = getCancelReason(r);
                const cancelledBy = getCancelledBy(r);
                return (
                  <tr key={r.id} className="border-t border-slate-800 align-top">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">
                      {r.status}
                      {r.status === "CANCELLED" && reason && (
                        <div className="mt-2 text-xs rounded-md border border-rose-900/40 bg-rose-950/40 text-rose-200 px-2 py-1">
                          Cancelled{cancelledBy ? ` by ${cancelledBy}` : ""}: “{reason}”
                        </div>
                      )}
                    </td>
                    <td className="p-3">{fmt(r.slotStartAtLocal)}</td>
                    <td className="p-3">{r.inventoryVehicleId ?? "—"}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {canStart(r.status) && (
                          <button
                            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500"
                            onClick={() => onStart(r.id)}
                            title="Mark work started (ASSIGNED → IN_PROGRESS)"
                          >
                            Start
                          </button>
                        )}

                        {canComplete(r.status) && (
                          <button
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => onComplete(r.id)}
                            title="Complete work (IN_PROGRESS → COMPLETED)"
                          >
                            Complete
                          </button>
                        )}

                        {canCancel(r.status) && (
                          <button
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                            onClick={() => {
                              setCancelFor(r.id);
                              setCancelReason("");
                              setCancelErr(null);
                            }}
                            title="Cancel this request"
                          >
                            Cancel…
                          </button>
                        )}
                      </div>
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
