// src/services/adminRequests.ts
import { getJSON, postJSON } from "@/services/client";

export type AdminRequestRow = {
  id: number;
  serviceName: string;
  status: string;
  assignedAgentName?: string | null;
};

// list endpoint (unchanged)
const LIST_BASE = "/api/v1/requests";

// prefer legacy staff-action routes (usually already implemented)
const LEGACY_BASE = "/api/v1/requests";
const ADMIN_BASE  = "/api/v1/admin/requests";

export async function listAdminRequests(): Promise<AdminRequestRow[]> {
  const res = await getJSON<any>(`${LIST_BASE}/admin`);
  if (Array.isArray(res)) return res as AdminRequestRow[];
  if (Array.isArray(res?.items)) return res.items as AdminRequestRow[];
  if (Array.isArray(res?.content)) return res.content as AdminRequestRow[];
  return [];
}

export async function assignRequest(reqId: number, agentId: number): Promise<void> {
  // Try legacy first; if it doesn't exist, fall back to admin route.
  try {
    await postJSON<void>(`${LEGACY_BASE}/${reqId}/assign`, { agentId });
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 404 || status === 405) {
      await postJSON<void>(`${ADMIN_BASE}/${reqId}/assign`, { agentId });
      return;
    }
    throw e;
  }
}

export async function cancelRequest(reqId: number, reason?: string): Promise<void> {
  try {
    await postJSON<void>(`${LEGACY_BASE}/${reqId}/cancel`, reason ? { reason } : undefined);
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 404 || status === 405) {
      await postJSON<void>(`${ADMIN_BASE}/${reqId}/cancel`, reason ? { reason } : undefined);
      return;
    }
    throw e;
  }
}
