import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

type RequestSummary = {
  id: number;
  serviceName: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

type ApiError = { status: number; message: string };

export default function FeedbackForm() {
  const { requestId } = useParams<{ requestId: string }>();
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [req, setReq] = useState<RequestSummary | null>(null);
  const [loadingReq, setLoadingReq] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const disabled = useMemo(
    () => submitting || !token || role !== "USER" || !req || req.status !== "COMPLETED",
    [submitting, token, role, req]
  );

  // load request (to gate feedback to COMPLETED only)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!requestId || !token) return;
      setLoadingReq(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/requests/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw { status: res.status, message: text || res.statusText } as ApiError;
        }
        const data: any = await res.json();
        if (!alive) return;
        setReq({
          id: data.id,
          serviceName: data.serviceName,
          status: data.status,
        });
      } catch (e: any) {
        if (alive) setError({ status: e?.status ?? 0, message: e?.message ?? "Failed to load request." });
      } finally {
        if (alive) setLoadingReq(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [requestId, token]);

  async function submit() {
    if (!requestId || !token) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/requests/${requestId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!res.ok) {
        const text = await res.text();
        // 409 means already left feedback (based on our backend changes)
        throw { status: res.status, message: text || res.statusText } as ApiError;
      }

      setSuccess("Thanks! Your feedback was submitted.");
      setTimeout(() => nav("/app/user", { replace: true }), 600);
    } catch (e: any) {
      setError({ status: e?.status ?? 0, message: e?.message ?? "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Leave Feedback</h1>

      {!token && (
        <div className="mb-4 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          Please log in to leave feedback.
        </div>
      )}
      {role !== "USER" && token && (
        <div className="mb-4 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          Only customer accounts (USER) can submit feedback.
        </div>
      )}

      {loadingReq ? (
        <div className="text-sm text-slate-400">Loading request…</div>
      ) : error ? (
        <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">
          <div className="font-medium">Error {error.status}</div>
          <div className="whitespace-pre-wrap">{error.message}</div>
        </div>
      ) : req ? (
        <>
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <div>Request: <b>#{req.id}</b></div>
            <div>Service: <b>{req.serviceName}</b></div>
            <div>Status: <b>{req.status}</b></div>
            {req.status !== "COMPLETED" && (
              <div className="mt-2 text-slate-400">
                Feedback is available once the request is marked <b>COMPLETED</b>.
              </div>
            )}
          </div>

          {success && (
            <div className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              {success}
            </div>
          )}

          <label className="block text-sm mb-1">Rating (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
            className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 mb-3"
          />

          <label className="block text-sm mb-1">Comments</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-28 px-3 py-2 rounded bg-slate-900 border border-slate-700 mb-4"
            placeholder="How was your service?"
          />

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={disabled}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit feedback"}
            </button>
            <button
              onClick={() => history.back()}
              className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
