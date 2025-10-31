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

  useEffect(() => {
    load();
  }, []);

  // Function to render stars based on rating
  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: rating }, (_, i) => (
          <span key={i} className="text-amber-400 text-lg leading-none">★</span>
        ))}
        {Array.from({ length: 5 - rating }, (_, i) => (
          <span key={i} className="text-slate-600 text-lg leading-none">★</span>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold tracking-wide text-white">
            Customer Feedback
          </h1>
          <button
            onClick={load}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-blue-700/50"
          >
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 rounded-lg bg-red-800/20 border border-red-600 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-700 shadow-lg shadow-blue-900/20 backdrop-blur-sm">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-slate-800/70 border-b border-slate-700">
              <tr className="text-gray-300">
                <th className="text-left px-4 py-3 font-semibold">Request</th>
                <th className="text-left px-4 py-3 font-semibold">Rating</th>
                <th className="text-left px-4 py-3 font-semibold">Comment</th>
                <th className="text-left px-4 py-3 font-semibold">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                    Loading feedback…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                    No feedback available for your requests.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-medium text-blue-400">{r.requestId}</td>
                    <td className="px-4 py-3">{renderStars(r.rating)}</td>
                    <td className="px-4 py-3 max-w-[60ch] text-gray-300">{r.comment}</td>
                    <td className="px-4 py-3">
                      {r.acknowledged ? (
                        <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-md text-xs font-semibold">
                          Yes
                        </span>
                      ) : (
                        <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded-md text-xs font-semibold">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Autobridge. All rights reserved.
        </div>
      </div>
    </div>
  );
}





/*
//working code
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

*/