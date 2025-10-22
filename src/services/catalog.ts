import { getFirstOk } from "./client";

export type ServiceDto = {
  id: number;
  slug: string;
  name: string;
  durationMinutes: number;
  basePrice: number;
};

export type VehicleDto = {
  id: number;
  title: string;
  brand: string;
  price: number;
  imageUrl: string | null;
};

export const catalogApi = {
  async services(): Promise<ServiceDto[]> {
    return getFirstOk<ServiceDto[]>([
      "/api/v1/public/services",
      "/api/v1/services"
    ]);
  },

  async vehicles(): Promise<VehicleDto[]> {
    return getFirstOk<VehicleDto[]>([
      "/api/v1/public/vehicles",
      "/api/v1/vehicles"
    ]);
  }
};
