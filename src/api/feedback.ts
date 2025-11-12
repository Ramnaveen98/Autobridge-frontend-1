// src/api/feedback.ts
import api from "@/services/client";

export type FeedbackRow = {
  id: number;
  requestId: number;
  rating: number;
  comment: string;
  createdAtUtc?: string | null;
  createdAt?: string | null;
  acknowledged?: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
};

type PageResponse<T> = {
  items?: T[];
  content?: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

function normalizeRows(rows: FeedbackRow[]): FeedbackRow[] {
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ?? r.createdAtUtc ?? null,
  }));
}

/** Create/leave feedback for a completed request */
export type LeaveFeedbackPayload = {
  rating: number;
  comment: string;
};

export async function leaveFeedback(
  requestId: number,
  payload: LeaveFeedbackPayload
): Promise<FeedbackRow | void> {
  // ✅ match backend controller: POST /api/v1/requests/{requestId}/feedback
  const { data } = await api.post<FeedbackRow | undefined>(
    `/api/v1/requests/${requestId}/feedback`,
    { rating: payload.rating, comment: payload.comment }
  );
  if (data) return normalizeRows([data])[0];
}

/** List all feedback (admin) */
export async function listAllFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/feedback", {
    params: { page, size },
  });
  const list = (data.items ?? data.content ?? []) as FeedbackRow[];
  return normalizeRows(list);
}

/** Acknowledge a feedback item (admin/agent) */
export async function acknowledgeFeedback(id: number): Promise<FeedbackRow> {
  const { data } = await api.patch<FeedbackRow>(`/api/v1/feedback/${id}/acknowledge`);
  return normalizeRows([data])[0];
}

/** List feedback for agent */
export async function listAgentFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/agent/feedback", {
    params: { page, size },
  });
  const list = (data.items ?? data.content ?? []) as FeedbackRow[];
  return normalizeRows(list);
}

export const feedbackApi = {
  leave: leaveFeedback,
  listAllFeedback,
  acknowledge: acknowledgeFeedback,
  listAgent: listAgentFeedback,
};
