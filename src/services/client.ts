// src/services/client.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type { AxiosRequestHeaders } from "axios";

/* -----------------------------------------------------------------------------
   API base URL (no trailing slash)
   Priority:
   1) window.__API_BASE__              (runtime override)
   2) import.meta.env.VITE_API_BASE    (build-time var)
   3) <meta name="autobridge-api-base" content="https://..."> (index.html)
   4) Cloud Run backend URL (fallback)
----------------------------------------------------------------------------- */
const metaApiBase =
  typeof document !== "undefined"
    ? document
        .querySelector<HTMLMetaElement>('meta[name="autobridge-api-base"]')
        ?.getAttribute("content")
    : undefined;

const DEFAULT_API_BASE =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  (import.meta as any)?.env?.VITE_API_BASE ||
  metaApiBase ||
  // ✅ fixed fallback (was "hhttps")
  "https://javaspringboot-project-22420323301.us-central1.run.app";

export const API_BASE = String(DEFAULT_API_BASE).replace(/\/$/, "");

/* -----------------------------------------------------------------------------
   Axios instance
----------------------------------------------------------------------------- */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  // give the backend a little headroom on cold/warm startup
  timeout: 30000,
  headers: {
    Accept: "application/json, text/plain, */*",
  },
});

/* -----------------------------------------------------------------------------
   Auth token plumbing
----------------------------------------------------------------------------- */
let getToken: () => string | null = () =>
  (typeof window !== "undefined"
    ? localStorage.getItem("autobridge.token")
    : null) || null;

export function registerTokenGetter(fn: () => string | null) {
  getToken = fn;
}
export const registerTokenProvider = registerTokenGetter;

/* -----------------------------------------------------------------------------
   Public GET allowlist (no Authorization header)
----------------------------------------------------------------------------- */
const PUBLIC_GET_ALLOWLIST: RegExp[] = [
  /^\/api\/v1\/services\/public(?:\/.*)?$/i,
  /^\/api\/v1\/vehicles\/public(?:\/.*)?$/i,
  /^\/api\/v1\/public\/vehicles(?:\/.*)?$/i,
  /^\/api\/v1\/public(?:\/.*)?$/i,
  /^\/uploads\/.*$/i,
  /^\/v3\/api-docs(?:\/.*)?$/i,
  /^\/swagger-ui(?:\/.*)?$/i,
];

/* -----------------------------------------------------------------------------
   Request interceptor: attach JWT except for public GETs
----------------------------------------------------------------------------- */
api.interceptors.request.use((config) => {
  const rawUrl = config.url ?? "";
  const isAbsolute = /^https?:\/\//i.test(rawUrl);
  const path = isAbsolute ? new URL(rawUrl).pathname : rawUrl;

  const method = (config.method || "get").toLowerCase();
  const isPublicGet =
    method === "get" && PUBLIC_GET_ALLOWLIST.some((re) => re.test(path));

  if (!isPublicGet) {
    const token = getToken();
    if (token) {
      config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
      (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* -----------------------------------------------------------------------------
   Unauthorized (401/403) handler hook
----------------------------------------------------------------------------- */
let onUnauthorized: null | ((status: number, data?: any) => void) = null;
export function registerUnauthorizedHandler(
  fn: (status: number, data?: any) => void
) {
  onUnauthorized = fn;
}

/* -----------------------------------------------------------------------------
   Response interceptor: concise error logs + unauthorized hook
----------------------------------------------------------------------------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const ax = err as AxiosError;
    const status = ax.response?.status ?? "-";

    if (status === 401 || status === 403) {
      try {
        onUnauthorized?.(Number(status), ax.response?.data);
      } catch {}
    }

    // Helpful console for production only when things go wrong:
    try {
      const method = ax.config?.method?.toUpperCase();
      const url = ax.config?.url?.startsWith("http")
        ? ax.config?.url
        : `${API_BASE}${ax.config?.url ?? ""}`;
      // eslint-disable-next-line no-console
      console.error("[API ERROR]", method, url, status, ax.message);
    } catch {}
    return Promise.reject(err);
  }
);

/* -----------------------------------------------------------------------------
   JSON helpers (normalize empty 201/204 responses to null)
----------------------------------------------------------------------------- */
function normalizeData<T = any>(data: any): T {
  if (data === "" || data === undefined) return null as any;
  return data as T;
}

export async function getJSON<T>(
  url: string,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.get<T>(url, cfg);
  return normalizeData<T>(res.data);
}

export async function postJSON<T>(
  url: string,
  body?: unknown,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.post<T>(url, body, {
    headers: { "Content-Type": "application/json" },
    ...(cfg || {}),
  });
  return normalizeData<T>(res.data);
}

export async function putJSON<T>(
  url: string,
  body?: unknown,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.put<T>(url, body, {
    headers: { "Content-Type": "application/json" },
    ...(cfg || {}),
  });
  return normalizeData<T>(res.data);
}

export async function patchJSON<T>(
  url: string,
  body?: unknown,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.patch<T>(url, body, {
    headers: { "Content-Type": "application/json" },
    ...(cfg || {}),
  });
  return normalizeData<T>(res.data);
}

export async function deleteJSON<T>(
  url: string,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await api.delete<T>(url, cfg);
  return normalizeData<T>(res.data);
}

export const delJSON = deleteJSON;
export const del = deleteJSON;

export async function getFirstOk<T>(paths: string[]): Promise<T> {
  let lastErr: unknown;
  for (const p of paths) {
    try {
      const data = await getJSON<T>(p);
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export default api;
