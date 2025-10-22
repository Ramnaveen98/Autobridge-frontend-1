import { getJson, postJson } from "./client";

export type ServiceRef = { id: number; name: string; price: number; durationMin: number; description?: string };
export type SlotRef = { id: number; date: string; time: string; available: boolean };

export const bookingApi = {
  listServices(): Promise<ServiceRef[]> {
    return getJson<ServiceRef[]>("/services");
  },
  listSlots(params: { date?: string; vehicleId?: number }) {
    return getJson<SlotRef[]>("/slots", params);
  },
  createRequest(body: {
    type: "TEST_DRIVE" | "SERVICE";
    serviceId?: number;
    vehicleId?: number;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
  }) {
    return postJson<{ id: number }>("/requests", body);
  },
};
