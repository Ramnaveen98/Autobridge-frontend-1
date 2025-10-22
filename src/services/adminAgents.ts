import { getJSON, postJSON, putJSON, delJSON } from "@/services/client";

export type Agent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  active: boolean;
};

const BASE = "/api/v1/admin/directory/agents";

export async function listAgents(): Promise<Agent[]> {
  const res = await getJSON<any>(BASE);
  if (Array.isArray(res)) return res as Agent[];
  if (Array.isArray(res?.items)) return res.items as Agent[];
  if (Array.isArray(res?.content)) return res.content as Agent[];
  return [];
}

export async function createAgent(body: Partial<Agent>): Promise<Agent> {
  return postJSON<Agent>(BASE, body);
}

export async function updateAgent(id: number, body: Partial<Agent>): Promise<Agent> {
  return putJSON<Agent>(`${BASE}/${id}`, body);
}

export async function deleteAgent(id: number): Promise<void> {
  await delJSON(`${BASE}/${id}`);
}
