import { getJSON } from "@/services/client";

export type AgentProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
};

export async function getAllAgents(): Promise<AgentProfile[]> {
  return await getJSON<AgentProfile[]>("/api/v1/agents");
}
