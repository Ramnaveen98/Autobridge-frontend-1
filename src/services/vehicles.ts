import { getJSON, API_BASE } from "@/services/client";

export type PublicVehicle = {
  id: number;
  title: string;
  brand: string;
  year?: number | null;
  price?: number | null;
  imageUrl?: string | null;
};

const PUBLIC_ENDPOINTS = [
  "/api/v1/vehicles/public",   // returns { content: [...] }
  "/api/v1/public/vehicles",   // returns [...]
];

function normalizeList(data: any): PublicVehicle[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export function resolveImg(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return u;
}

export async function fetchPublicVehicles(): Promise<PublicVehicle[]> {
  let lastErr: any;
  for (const url of PUBLIC_ENDPOINTS) {
    try {
      const data = await getJSON<any>(url);
      return normalizeList(data);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to load public vehicles");
}
