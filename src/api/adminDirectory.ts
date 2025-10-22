// src/api/adminDirectory.ts
import api from "@/services/client";

export type AdminDirectoryPerson = {
  id: number;            // this is users.id
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
};

/** List agents from Admin Directory (UserAccount rows with role=AGENT). */
export async function getDirectoryAgents(): Promise<AdminDirectoryPerson[]> {
  const res = await api.get<AdminDirectoryPerson[]>("/api/v1/admin/directory/agents");
  return res.data ?? [];
}
