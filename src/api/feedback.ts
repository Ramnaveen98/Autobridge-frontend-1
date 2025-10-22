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
  return rows.map(r => ({
    ...r,
    // present both, so UI rendering can safely read either
    createdAt: r.createdAt ?? r.createdAtUtc ?? null,
  }));
}

export async function listAllFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/feedback", { params: { page, size } });
  const list = (data.items ?? data.content ?? []) as FeedbackRow[];
  return normalizeRows(list);
}

export async function acknowledgeFeedback(id: number): Promise<FeedbackRow> {
  const { data } = await api.patch<FeedbackRow>(`/api/v1/feedback/${id}/acknowledge`);
  return normalizeRows([data])[0];
}

export async function listAgentFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/agent/feedback", { params: { page, size } });
  const list = (data.items ?? data.content ?? []) as FeedbackRow[];
  return normalizeRows(list);
}
