/*
// src/pages/agent/AgentFeedback.tsx
import { useEffect, useState } from "react";
import { getJSON } from "@/services/client";

type AgentFeedbackRow = {
  id: number;
  requestId: number;
  serviceName?: string | null;
  rating: number;
  comment?: string | null;
  author?: string | null;
  createdAt?: string | null;
};

export default function AgentFeedback() {
  const [rows, setRows] = useState<AgentFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function tryEndpoints() {
      const candidates = [
        "/api/v1/agent/feedback",
        "/api/v1/feedback/agent", // fallback naming
      ];

      for (const url of candidates) {
        try {
          const data = await getJSON<AgentFeedbackRow[]>(url);
          if (!alive) return;
          if (Array.isArray(data)) {
            setRows(data);
            setLoading(false);
            return;
          }
        } catch {
          // keep trying
        }
      }

      if (alive) {
        setRows([]);
        setLoading(false);
      }
    }

    tryEndpoints();
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feedback About My Jobs</h1>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">Request</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Rating</th>
              <th className="text-left p-3">Comment</th>
              <th className="text-left p-3">Author</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3 text-slate-400" colSpan={6}>No feedback for you yet</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="p-3">#{r.requestId}</td>
                  <td className="p-3">{r.serviceName || "-"}</td>
                  <td className="p-3">{r.rating}</td>
                  <td className="p-3">{r.comment || "-"}</td>
                  <td className="p-3">{r.author || "-"}</td>
                  <td className="p-3">{fmtDate(r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}
  */



// src/pages/agent/AgentFeedback.tsx
import { useEffect, useState } from "react";
import { FeedbackRow, listAgentFeedback } from "@/api/feedbackAdmin";

export default function AgentFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await listAgentFeedback(0, 50);
      setRows(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Customer Feedback</h1>
        <button onClick={load} className="border rounded px-3 py-1 text-sm">Refresh</button>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Request</th>
              <th className="text-left p-2">Rating</th>
              <th className="text-left p-2">Comment</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Acknowledged</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No feedback for your requests</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">#{r.requestId}</td>
                  <td className="p-2">{r.rating}</td>
                  <td className="p-2 max-w-[60ch]">{r.comment}</td>
                  <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-2">{r.acknowledged ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

