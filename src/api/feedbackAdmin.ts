// src/api/feedbackAdmin.ts
import api from "@/services/client";

export type FeedbackRow = {
  id: number;
  requestId: number;
  rating: number;
  comment: string;
  createdAt: string | null;
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

export async function listAllFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/feedback", {
    params: { page, size },
  });
  return (data.items ?? data.content ?? []) as FeedbackRow[];
}

export async function acknowledgeFeedback(id: number): Promise<FeedbackRow> {
  const { data } = await api.patch<FeedbackRow>(`/api/v1/feedback/${id}/acknowledge`);
  return data;
}

export async function listAgentFeedback(page = 0, size = 50): Promise<FeedbackRow[]> {
  const { data } = await api.get<PageResponse<FeedbackRow>>("/api/v1/agent/feedback", {
    params: { page, size },
  });
  return (data.items ?? data.content ?? []) as FeedbackRow[];
}
