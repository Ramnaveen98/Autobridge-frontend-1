// src/pages/admin/AdminFeedback.tsx
import { useEffect, useState } from "react";
import { acknowledgeFeedback, FeedbackRow, listAllFeedback } from "@/api/feedbackAdmin";

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await listAllFeedback(0, 50);
      setRows(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(id: number) {
    try {
      const updated = await acknowledgeFeedback(id);
      setRows(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (e: any) {
      alert(e?.response?.data?.message || "Acknowledge failed.");
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
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No feedback yet</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">#{r.requestId}</td>
                  <td className="p-2">{r.rating}</td>
                  <td className="p-2 max-w-[60ch]">{r.comment}</td>
                  <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-2">
                    {r.acknowledged ? (
                      <div>
                        <div className="text-green-600">Yes</div>
                        <div className="text-xs text-gray-500">
                          {r.acknowledgedBy || "-"}<br/>
                          {r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : ""}
                        </div>
                      </div>
                    ) : "No"}
                  </td>
                  <td className="p-2 text-right">
                    {!r.acknowledged && (
                      <button onClick={() => acknowledge(r.id)} className="px-3 py-1 rounded border">
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
