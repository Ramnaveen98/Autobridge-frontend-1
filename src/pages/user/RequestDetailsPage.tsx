/*
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/client";
import LeaveFeedbackForm from "@/features/feedback/LeaveFeedbackForm";

type RequestStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type RequestDto = {
  id: number;
  serviceName: string;
  scheduledAt?: string;
  status: RequestStatus;
  // add other fields you have...
};

export default function RequestDetailsPage() {
  const { id } = useParams(); // expects route like /app/user/requests/:id
  const requestId = Number(id);
  const [req, setReq] = useState<RequestDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // adjust to your actual endpoint if different:
      const { data } = await api.get<RequestDto>(`/api/v1/requests/${requestId}`);
      setReq(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isNaN(requestId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  if (Number.isNaN(requestId)) return <div className="p-6">Invalid request id.</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!req) return <div className="p-6">Not found.</div>;

  const completed = req.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Request #{req.id}</h1>
        <p className="text-sm text-gray-600">
          Service: <span className="font-medium">{req.serviceName}</span>
        </p>
        <p className="text-sm text-gray-600">Status: <span className="font-medium">{req.status}</span></p>
        {req.scheduledAt && (
          <p className="text-sm text-gray-600">Scheduled: {new Date(req.scheduledAt).toLocaleString()}</p>
        )}
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-2">Leave Feedback</h2>
        {!completed && (
          <p className="text-xs text-amber-600 mb-2">
            You can submit feedback only after the request is marked as Completed.
          </p>
        )}

        <LeaveFeedbackForm
          requestId={req.id}
          requestStatus={req.status}
          onDone={() => {
            // re-load to reflect new feedback state if you show it here
            load();
            alert("Thanks! Feedback submitted.");
          }}
        />
      </div>
    </div>
  );
}
  */


import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

type RequestDto = {
  id: number;
  serviceName: string;
  status: string;
  startAtLocal?: string | null;
  endAtLocal?: string | null;
  assignedAgentName?: string | null;
};

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [data, setData] = useState<RequestDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || !token) return;
      setLoading(true);
      const res = await fetch(`/api/v1/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!alive) return;
      setData(json);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, token]);

  if (loading) return <div>Loading…</div>;
  if (!data) return <div>Not found.</div>;

  const canFeedback = data.status === "COMPLETED";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Request #{data.id}</h1>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm space-y-2 mb-4">
        <div><b>Service:</b> {data.serviceName}</div>
        <div><b>Status:</b> {data.status}</div>
        <div><b>Start:</b> {data.startAtLocal || "-"}</div>
        <div><b>End:</b> {data.endAtLocal || "-"}</div>
        <div><b>Agent:</b> {data.assignedAgentName || "-"}</div>
      </div>

      {canFeedback ? (
        <Link
          to={`/user/feedback/${data.id}`}
          className="inline-block px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm"
        >
          Leave feedback
        </Link>
      ) : (
        <div className="text-slate-400 text-sm">Feedback is available after completion.</div>
      )}
    </div>
  );
}

