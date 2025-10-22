/*
// src/api/requests.ts
import api from '@/services/client';

export type Status =
  | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type UserMineRow = {
  id: number;
  serviceName: string;
  status: Status;
  slotStartAtLocal: string;
  inventoryVehicleId?: number | null;
  agentEmail?: string | null;
};

export type ServiceRequestDto = {
  id: number;
  status: Status;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;

  serviceId: number;
  serviceSlug: string;
  serviceName: string;

  slotId: number;
  slotStartAtUtc: string;
  slotEndAtUtc: string;
  slotStartAtLocal: string;
  slotEndAtLocal: string;
  timeZone: string;

  inventoryVehicleId?: number | null;
  inventoryVehicleBrand?: string | null;
  inventoryVehicleModel?: string | null;
  inventoryVehicleYear?: number | null;
  inventoryVehicleVin?: string | null;

  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail: string;
  userPhone?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  notes?: string | null;

  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
};

// ---------- USER ----------
export async function getUserMine(): Promise<UserMineRow[]> {
  const res = await api.get<UserMineRow[]>('/api/v1/requests/mine');
  return res.data ?? [];
}

// ---------- ADMIN ----------
export async function getAdminUserRequests(email: string): Promise<ServiceRequestDto[]> {
  const res = await api.get<ServiceRequestDto[]>(
    `/api/v1/admin/requests/mine`,
    { params: { email } }
  );
  return res.data ?? [];
}

export async function assignRequest(id: number, agentId: number) {
  const res = await api.post(`/api/v1/requests/${id}/assign`, { agentId });
  return res.data;
}

export async function startRequest(id: number) {
  const res = await api.post(`/api/v1/requests/${id}/start`, {});
  return res.data;
}

export async function completeRequest(id: number) {
  const res = await api.post(`/api/v1/requests/${id}/complete`, {});
  return res.data;
}

export async function cancelRequest(id: number, cancelReason?: string) {
  const res = await api.post(
    `/api/v1/requests/${id}/cancel`,
    cancelReason ? { reason: cancelReason } : {}
  );
  return res.data;
}

// ---------- AGENT ----------
export type AgentRow = {
  id: number;
  serviceName: string;
  status: Status;
  slotStartAtLocal: string;
  inventoryVehicleId?: number | null;
  agentEmail?: string | null;
};

export async function getAgentMine(): Promise<AgentRow[]> {
  // IMPORTANT: use Axios instance with baseURL + JWT interceptor
  const res = await api.get<AgentRow[]>('/api/v1/agent/requests');
  return res.data ?? [];
}

*/

// src/api/requests.ts
// src/api/requests.ts
import api from '@/services/client';

export type Status =
  | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** What the agent sees in their dashboard rows */
export type AgentRow = {
  id: number;
  serviceName: string;
  status: Status;
  slotStartAtLocal: string;
  inventoryVehicleId?: number | null;
  agentEmail?: string | null;
};

/** What the user sees in their dashboard rows */
export type UserMineRow = {
  id: number;
  serviceName: string;
  status: Status;
  slotStartAtLocal: string;
  inventoryVehicleId?: number | null;
  agentEmail?: string | null;
};

export type ServiceRequestDto = {
  id: number;
  status: Status;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;

  serviceId: number;
  serviceSlug: string;
  serviceName: string;

  slotId: number;
  slotStartAtUtc: string;
  slotEndAtUtc: string;
  slotStartAtLocal: string;
  slotEndAtLocal: string;
  timeZone: string;

  inventoryVehicleId?: number | null;
  inventoryVehicleBrand?: string | null;
  inventoryVehicleModel?: string | null;
  inventoryVehicleYear?: number | null;
  inventoryVehicleVin?: string | null;

  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail: string;
  userPhone?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  notes?: string | null;

  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
};

/** Admin Directory → Agents row (from AdminDirectoryController#listAgents) */
export type AgentDirectoryPerson = {
  id: number;           // <-- THIS IS agents.id (the one we must send to assign)
  firstName: string;
  lastName: string;
  email: string;
  role: 'AGENT';
};

// ---------- USER ----------
export async function getUserMine(): Promise<UserMineRow[]> {
  const res = await api.get<UserMineRow[]>('/api/v1/requests/mine');
  return res.data ?? [];
}

// ---------- ADMIN ----------
export async function getAdminUserRequests(email: string): Promise<ServiceRequestDto[]> {
  const res = await api.get<ServiceRequestDto[]>(
    `/api/v1/admin/requests/mine`,
    { params: { email } }
  );
  return res.data ?? [];
}

/** Load agents from the Admin Directory (guarantees we have agents.id) */
export async function listAdminAgents(): Promise<AgentDirectoryPerson[]> {
  const res = await api.get<AgentDirectoryPerson[]>('/api/v1/admin/directory/agents');
  return res.data ?? [];
}

/**
 * IMPORTANT: Always send agents.id here.
 * Backend is tolerant (can resolve via users.id by email), but we keep UI consistent.
 */
export async function assignRequest(id: number, agentId: number) {
  const res = await api.post(`/api/v1/admin/requests/${id}/assign`, { agentId });
  return res.data;
}

export async function startRequest(id: number) {
  const res = await api.post(`/api/v1/requests/${id}/start`, {});
  return res.data;
}

export async function completeRequest(id: number) {
  const res = await api.post(`/api/v1/requests/${id}/complete`, {});
  return res.data;
}

export async function cancelRequest(id: number, cancelReason?: string) {
  const res = await api.post(
    `/api/v1/requests/${id}/cancel`,
    cancelReason ? { reason: cancelReason } : {}
  );
  return res.data;
}

// ---------- AGENT ----------
export async function getAgentMine(): Promise<AgentRow[]> {
  const res = await api.get<AgentRow[]>('/api/v1/agent/requests');
  return res.data ?? [];
}
