// src/pages/user/FeedbackForm.tsx
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
  const [info, setInfo] = useState<string | null>(null);

  const ADMIN_EMAIL = "admin@autobridge.com";

  const disabled = useMemo(
    () =>
      submitting || !token || role !== "USER" || !req || req.status !== "COMPLETED",
    [submitting, token, role, req]
  );

  // Load request details
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
        if (alive)
          setError({
            status: e?.status ?? 0,
            message: e?.message ?? "Failed to load request.",
          });
      } finally {
        if (alive) setLoadingReq(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [requestId, token]);

  // --- Submit feedback ---
  async function submit() {
    if (!requestId || !token) return;

    // ✅ Local validation before calling API
    if (!comment.trim()) {
      setError({
        status: 400,
        message: "Please enter a valid feedback comment before submitting.",
      });
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/v1/requests/${requestId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      if (res.status === 409) {
        setInfo(
          `You’ve already submitted feedback for this service. Thank you!\nIf you are facing any issue, please contact Admin — ${ADMIN_EMAIL}`
        );
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw { status: res.status, message: text || res.statusText } as ApiError;
      }

      const feedbackData = await res.json().catch(() => ({
        rating,
        comment,
        serviceName: req?.serviceName,
      }));

      nav("/thank-you", {
        replace: true,
        state: {
          feedback: {
            serviceName: req?.serviceName,
            comments: feedbackData.comment ?? comment,
            rating: feedbackData.rating ?? rating,
          },
        },
      });
    } catch (e: any) {
      setError({
        status: e?.status ?? 0,
        message:
          e?.message?.includes("Comment is required")
            ? "Please enter a valid feedback comment before submitting."
            : e?.message ?? "Submission failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex justify-center items-start md:pt-16 pt-8 transition-all duration-300">
      <div className="w-full max-w-2xl bg-slate-900/60 rounded-2xl border border-slate-800 p-6 sm:p-10 shadow-lg mx-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-400">
          Leave Feedback
        </h1>

        {!token && (
          <div className="mb-4 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            Please log in to leave feedback.
          </div>
        )}
        {role !== "USER" && token && (
          <div className="mb-4 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            Only customer accounts (USER) can submit feedback.
          </div>
        )}

        {loadingReq ? (
          <div className="text-sm text-slate-400 text-center">Loading request…</div>
        ) : error && !req ? (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-center">
            <div className="font-medium text-red-300">Error {error.status}</div>
            <div className="whitespace-pre-wrap">{error.message}</div>
          </div>
        ) : req ? (
          <>
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-4 sm:p-5 text-sm">
              <div>
                <span className="text-slate-400">Request:</span>{" "}
                <b>{req.id}</b> {/* ✅ Removed "#" */}
              </div>
              <div>
                <span className="text-slate-400">Service:</span>{" "}
                <b>{req.serviceName}</b>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <b
                  className={`${
                    req.status === "COMPLETED"
                      ? "text-emerald-400"
                      : req.status === "CANCELLED"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {req.status}
                </b>
              </div>
              {req.status !== "COMPLETED" && (
                <div className="mt-2 text-slate-400">
                  Feedback is available once the request is marked{" "}
                  <b>COMPLETED</b>.
                </div>
              )}
            </div>

            {info && (
              <div className="mb-4 rounded border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-300 whitespace-pre-line text-center">
                {info}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-1 text-slate-300">
                  Rating (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) =>
                    setRating(Math.max(1, Math.min(5, Number(e.target.value) || 1)))
                  }
                  className="w-full sm:w-28 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm mb-1 text-slate-300">
                  Comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-28 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="How was your service?"
                />
                {/* Inline validation error */}
                {error?.status === 400 &&
                  error?.message?.includes("feedback comment") && (
                    <p className="text-red-400 text-sm mt-2">
                      {error.message}
                    </p>
                  )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4">
              <button
                onClick={submit}
                disabled={disabled}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
              <button
                onClick={() => nav(-1)}
                className="px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}







/*
//working code latest
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
  const [info, setInfo] = useState<string | null>(null);

  // replace with your real admin support email if stored in config
  const ADMIN_EMAIL = "admin@autobridge.com";

  const disabled = useMemo(
    () => submitting || !token || role !== "USER" || !req || req.status !== "COMPLETED",
    [submitting, token, role, req]
  );

  // Load request details
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
        if (alive)
          setError({
            status: e?.status ?? 0,
            message: e?.message ?? "Failed to load request.",
          });
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
    setInfo(null);
    try {
      const res = await fetch(`/api/v1/requests/${requestId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.status === 409) {
        setInfo(
          `You’ve already submitted feedback for this service. Thank you!\nIf you are facing any issue, please contact Admin — ${ADMIN_EMAIL}`
        );
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw { status: res.status, message: text || res.statusText } as ApiError;
      }

      const feedbackData = await res.json().catch(() => ({
        rating,
        comment,
        serviceName: req?.serviceName,
      }));

      // Redirect to Thank You page
      nav("/thank-you", {
        replace: true,
        state: {
          feedback: {
            serviceName: req?.serviceName,
            comments: feedbackData.comment ?? comment,
            rating: feedbackData.rating ?? rating,
          },
        },
      });
    } catch (e: any) {
      setError({
        status: e?.status ?? 0,
        message: e?.message ?? "Submission failed.",
      });
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
            <div>
              Request: <b>#{req.id}</b>
            </div>
            <div>
              Service: <b>{req.serviceName}</b>
            </div>
            <div>
              Status: <b>{req.status}</b>
            </div>
            {req.status !== "COMPLETED" && (
              <div className="mt-2 text-slate-400">
                Feedback is available once the request is marked{" "}
                <b>COMPLETED</b>.
              </div>
            )}
          </div>

          {info && (
            <div className="mb-4 rounded border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-300 whitespace-pre-line">
              {info}
            </div>
          )}

          {error && !info && (
            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm">
              <div className="font-medium">Error {error.status}</div>
              <div className="whitespace-pre-wrap">{error.message}</div>
            </div>
          )}

          <label className="block text-sm mb-1">Rating (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) =>
              setRating(Math.max(1, Math.min(5, Number(e.target.value) || 1)))
            }
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

*/



/*

//working code
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


*/