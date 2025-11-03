// src/api/feedback.ts
import api from "@/services/client";

export type FeedbackRow = {
  id: number;
  requestId: number;
  rating: number;
  comment: string;
  createdAtUtc?: string | null;   // backend name
  createdAt?: string | null;      // legacy fallback
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
    // present both so UI can read either
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
  const { data } = await api.post<FeedbackRow | undefined>("/api/v1/feedback", {
    requestId,
    ...payload,
  });
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

/** ✅ Aggregated API object so you can `import { feedbackApi } ...` */
export const feedbackApi = {
  leave: leaveFeedback,
  listAllFeedback,
  acknowledge: acknowledgeFeedback,
  listAgent: listAgentFeedback,
};
