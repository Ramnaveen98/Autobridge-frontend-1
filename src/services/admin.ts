import { api } from "./client";

export const adminApi = {
  approveAgent: async (agentId: number | string, active: boolean) =>
    (await api.patch(`/api/v1/agents/${agentId}/active`, { active })).data
};
