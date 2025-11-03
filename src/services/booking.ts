// src/services/booking.ts
import { getJSON, postJSON } from "./client";

/**
 * Lightweight service/slot/request types used by the booking UI.
 * (DTOs are kept small here to avoid coupling to backend internals.)
 */
export type ServiceRef = {
  id: number;
  name: string;
  price: number;
  durationMin: number;
  description?: string;
};

export type SlotRef = {
  id: number;
  date: string;   // ISO yyyy-MM-dd
  time: string;   // HH:mm
  available: boolean;
};

export type CreateRequestBody = {
  type: "TEST_DRIVE" | "SERVICE";
  serviceId?: number;
  vehicleId?: number;
  preferredDate: string;  // yyyy-MM-dd
  preferredTime: string;  // HH:mm
  notes?: string;
};

export const bookingApi = {
  /**
   * List available services for booking.
   * Backend path is relative to API base; adjust if your server expects /api/v1/...
   */
  listServices(): Promise<ServiceRef[]> {
    return getJSON<ServiceRef[]>("/services");
  },

  /**
   * List available time slots. Accepts optional date and vehicleId filters.
   * The params are sent via Axios config -> { params }.
   */
  listSlots(params: { date?: string; vehicleId?: number } = {}): Promise<SlotRef[]> {
    return getJSON<SlotRef[]>("/slots", { params });
  },

  /**
   * Create a booking request (test drive or service).
   */
  createRequest(body: CreateRequestBody): Promise<{ id: number }> {
    return postJSON<{ id: number }>("/requests", body);
  },

  // --- convenience helpers (optional, keep if your UI calls these directly) ---
  bookTestDrive(input: {
    vehicleId: number;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
  }): Promise<{ id: number }> {
    return this.createRequest({
      type: "TEST_DRIVE",
      vehicleId: input.vehicleId,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      notes: input.notes,
    });
  },

  bookService(input: {
    serviceId: number;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
  }): Promise<{ id: number }> {
    return this.createRequest({
      type: "SERVICE",
      serviceId: input.serviceId,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      notes: input.notes,
    });
  },
};
