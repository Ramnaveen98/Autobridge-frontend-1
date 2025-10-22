// src/features/feedback/LeaveFeedbackForm.tsx
import { useState } from "react";
import { leaveFeedback } from "@/api/feedback";

type Props = {
  requestId: number; // must be a valid numeric ID
  requestStatus?: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  onDone?: () => void;
};

export default function LeaveFeedbackForm({ requestId, requestStatus, onDone }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const completed = requestStatus === "COMPLETED";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!requestId || Number.isNaN(requestId)) {
      setError("Invalid request ID.");
      return;
    }
    if (!completed) {
      setError("Feedback is allowed only after the request is completed.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }
    if (!comment.trim()) {
      setError("Comment is required.");
      return;
    }

    setSaving(true);
    try {
      await leaveFeedback(requestId, { rating, comment });
      setComment("");
      setRating(5);
      onDone?.();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Unexpected error";
      if (status === 409) setError("You’ve already submitted feedback for this request.");
      else if (status === 400) setError(msg || "Please check your inputs.");
      else if (status === 403) setError("You’re not allowed to submit feedback for this request.");
      else if (status === 404) setError("Request not found.");
      else setError("We couldn’t submit your feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!completed && (
        <p className="text-xs text-amber-600">
          You can submit feedback only after the request is marked as Completed.
        </p>
      )}

      <label className="block text-sm">
        Rating (1–5)
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 border rounded p-2 w-24"
          required
        />
      </label>

      <label className="block text-sm">
        Comment
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 border rounded p-2 w-full"
          rows={3}
          required
        />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        disabled={saving || !completed}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit Feedback"}
      </button>
    </form>
  );
}
