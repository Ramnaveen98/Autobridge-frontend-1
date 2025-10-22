/*
// src/services/requests.ts
import { api, unwrap } from "./client";

export type RequestRow = {
  id: number;
  type: "TEST_DRIVE" | "SERVICE" | string;
  status: string;
  serviceName?: string | null;
  carTitle?: string | null;
  requestedBy?: string | null;
  assignee?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  [k: string]: any;
};

async function getFirstOk<T = any>(candidates: string[], params?: any): Promise<T> {
  const errors: any[] = [];
  for (const url of candidates) {
    try {
      const { data } = await api.get(url, params ? { params } : undefined);
      return data;
    } catch (e) {
      errors.push({ url, e });
    }
  }
  const last = errors[errors.length - 1];
  throw last?.e || new Error("All endpoints failed");
}

function mapRow(raw: any): RequestRow {
  const type =
    raw.type ??
    raw.requestType ??
    (raw.serviceId ? "SERVICE" : raw.carId ? "TEST_DRIVE" : "REQUEST");

  const serviceName =
    raw.serviceName ?? raw.service?.name ?? raw.service ?? null;

  const carTitle =
    raw.carTitle ?? raw.car?.title ?? raw.vehicle?.title ?? raw.carName ?? null;

  const preferredDate = raw.preferredDate ?? raw.date ?? raw.targetDate ?? null;
  const preferredTime = raw.preferredTime ?? raw.time ?? raw.targetTime ?? null;

  const requestedBy =
    raw.requestedBy ??
    raw.userEmail ??
    raw.user?.email ??
    raw.userName ??
    null;

  const assignee =
    raw.assignee ??
    raw.agentName ??
    raw.agent?.name ??
    raw.assignedTo ??
    null;

  const status =
    raw.status ??
    raw.currentStatus ??
    raw.state ??
    "PENDING";

  return {
    id: Number(raw.id ?? raw.requestId),
    type,
    status,
    serviceName,
    carTitle,
    requestedBy,
    assignee,
    preferredDate,
    preferredTime,
    ...raw
  };
}

// Helper to POST to the first working URL
async function postFirstOk<T = any>(candidates: string[], body: any): Promise<T> {
  const errors: any[] = [];
  for (const url of candidates) {
    try {
      const { data } = await api.post(url, body);
      return data;
    } catch (e) {
      errors.push({ url, e });
    }
  }
  const last = errors[errors.length - 1];
  throw last?.e || new Error("All POST endpoints failed");
}

export const reqApi = {
  myRequests: async (): Promise<RequestRow[]> => {
    const data = await getFirstOk<any>([
      "/api/v1/requests/mine",
      "/api/v1/user/requests",
      "/api/requests/mine",
      "/requests/mine"
    ]);
    return unwrap<any>(data).map(mapRow);
  },

  // User actions
  bookTestDrive: async (p: { carId: number; preferredDate: string; preferredTime: string }) =>
    postFirstOk<any>(
      [
        "/api/v1/requests/test-drive",
        "/api/v1/test-drives",
        "/api/test-drives",
        "/test-drives"
      ],
      p
    ),

  requestService: async (p: { serviceId: number; preferredDate: string; preferredTime: string; note?: string }) =>
    postFirstOk<any>(
      [
        "/api/v1/requests/service",
        "/api/v1/service-requests",
        "/api/service-requests",
        "/service-requests"
      ],
      p
    ),

  // Admin
  adminAll: async (params?: { status?: string; q?: string }): Promise<RequestRow[]> => {
    const data = await getFirstOk<any>(
      [
        "/api/v1/requests/admin",
        "/api/v1/admin/requests",
        "/api/requests/admin",
        "/admin/requests"
      ],
      params
    );
    return unwrap<any>(data).map(mapRow);
  },

  // Agent
  myAssignments: async (): Promise<RequestRow[]> => {
    const data = await getFirstOk<any>([
      "/api/v1/requests/agent/mine",
      "/api/v1/agent/requests",
      "/api/requests/agent/mine",
      "/agent/requests"
    ]);
    return unwrap<any>(data).map(mapRow);
  },

  start: async (id: number) =>
    postFirstOk<any>(
      [
        `/api/v1/requests/${id}/start`,
        `/api/v1/agent/requests/${id}/start`,
        `/api/requests/${id}/start`,
        `/requests/${id}/start`
      ],
      {}
    ),

  complete: async (id: number) =>
    postFirstOk<any>(
      [
        `/api/v1/requests/${id}/complete`,
        `/api/v1/agent/requests/${id}/complete`,
        `/api/requests/${id}/complete`,
        `/requests/${id}/complete`
      ],
      {}
    )
};
*/


// src/services/requests.ts
import { api } from "./client";

/** Minimal type for creating a request (matches backend DTO/property names) */
export type CreateRequestPayload = {
  serviceId: number;
  inventoryVehicleId?: number | null;
  slotId?: number | null;
  scheduledAt?: string; // "YYYY-MM-DDTHH:mm:ss" when creating an ad-hoc slot

  userFirstName?: string | null;
  userLastName: string;   // REQUIRED by DB
  userEmail: string;      // REQUIRED by DB
  userPhone?: string | null;

  addressLine1: string;   // REQUIRED by DB
  addressLine2?: string | null;
  city: string;           // REQUIRED by DB
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  notes?: string | null;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
};

export const reqApi = {
  /** Create a service request (token is attached by api interceptor) */
  async create(payload: CreateRequestPayload): Promise<{ id: number }> {
    const { data } = await api.post("/api/v1/requests", payload);
    return data;
  },

  async mine(): Promise<any[]> {
    const { data } = await api.get("/api/v1/requests/mine");
    return data;
  },

  async admin(): Promise<any[]> {
    const { data } = await api.get("/api/v1/requests/admin");
    return data;
  },

  async agentInbox(): Promise<any[]> {
    const { data } = await api.get("/api/v1/requests/admin?assignedTo=me");
    return data;
  }
};
