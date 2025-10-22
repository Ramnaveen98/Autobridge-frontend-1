// src/services/adminUsers.ts
import { getJSON, postJSON, putJSON, deleteJSON } from "@/services/client";

export type AbUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: "USER" | "AGENT" | "ADMIN";
  active: boolean;
};

const BASE = "/api/v1/admin/directory/users";

export async function listUsers(): Promise<AbUser[]> {
  const res = await getJSON<any>(BASE);
  if (Array.isArray(res)) return res as AbUser[];
  if (Array.isArray(res?.items)) return res.items as AbUser[];
  if (Array.isArray(res?.content)) return res.content as AbUser[];
  return [];
}

export async function createUser(body: Partial<AbUser> & { password?: string }): Promise<AbUser> {
  return postJSON<AbUser>(BASE, body);
}

export async function updateUser(id: number, body: Partial<AbUser>): Promise<AbUser> {
  return putJSON<AbUser>(`${BASE}/${id}`, body);
}

export async function deleteUser(id: number): Promise<void> {
  await deleteJSON(`${BASE}/${id}`);
}
