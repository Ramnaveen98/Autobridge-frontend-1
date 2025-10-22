// src/pages/user/MyRequests.tsx
import { useEffect, useState } from "react";
import { getJSON } from "@/services/client";
import { Link } from "react-router-dom";

type Req = {
  id: number;
  status: "PENDING"|"ASSIGNED"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED";
  serviceName: string;
  serviceSlug: string;
  slotLocalStart: string; // ISO
  slotLocalEnd: string;   // ISO
  assignedAgentName?: string|null;
};

export default function MyRequests() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        // If you have /api/v1/requests/mine use that instead:
        // const page = await getJSON<{content: Req[]}>("/api/v1/requests/mine");
        const page = await getJSON<{content: Req[]}>("/api/v1/requests?page=0&size=50");
        setItems(page.content || []);
      } catch (e:any) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">My Requests</h1>
      {err && <div className="text-red-500 text-sm mb-3">{err}</div>}

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Service</th>
            <th className="p-2 text-left">Start</th>
            <th className="p-2 text-left">End</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-left">Agent</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">#{r.id}</td>
              <td className="p-2">{r.serviceName}</td>
              <td className="p-2">{new Date(r.slotLocalStart).toLocaleString()}</td>
              <td className="p-2">{new Date(r.slotLocalEnd).toLocaleString()}</td>
              <td className="p-2 text-center">{r.status}</td>
              <td className="p-2">{r.assignedAgentName || "-"}</td>
              <td className="p-2 text-center">
                {r.status === "COMPLETED" && (
                  <Link to={`/user/feedback/${r.id}`} className="btn-primary">Leave feedback</Link>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="p-4 text-center text-gray-500" colSpan={7}>No requests yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
