// src/services/adminDirectory.ts
import { api } from "@/services/client";

export type PersonDto = {
  userId: number;
  agentId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
  agentActive?: boolean | null; // present for agents (null for pure users)
};

export type UpsertDto = {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role?: "USER" | "AGENT" | "ADMIN";
};

/* -------- Users -------- */
export async function getDirectoryUsers(): Promise<PersonDto[]> {
  const res = await api.get("/api/v1/admin/directory/users");
  return res.data;
}

export async function updateDirectoryUser(userId: number, body: UpsertDto) {
  const res = await api.put(`/api/v1/admin/directory/users/${userId}`, body);
  return res.data;
}

export async function deleteDirectoryUser(userId: number) {
  const res = await api.delete(`/api/v1/admin/directory/users/${userId}`);
  return res.data;
}

/* -------- Agents -------- */
export async function getDirectoryAgents(): Promise<PersonDto[]> {
  const res = await api.get("/api/v1/admin/directory/agents");
  return res.data;
}

export async function updateDirectoryAgent(userId: number, body: UpsertDto) {
  // NOTE: backend expects {userId} in path (not agentId)
  const res = await api.put(`/api/v1/admin/directory/agents/${userId}`, body);
  return res.data;
}

export async function deleteDirectoryAgent(userId: number) {
  const res = await api.delete(`/api/v1/admin/directory/agents/${userId}`);
  return res.data;
}
