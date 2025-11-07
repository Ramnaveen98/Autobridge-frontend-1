// src/services/client.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";
import type { AxiosRequestHeaders } from "axios";

/* -----------------------------------------------------------------------------
   API base URL resolution (no trailing slash)
   Priority:
   1) window.__API_BASE__              (runtime override without rebuild)
   2) import.meta.env.VITE_API_BASE    (Vite build-time env)
   3) <meta name="autobridge-api-base" content="https://..."> (index.html)
   4) Cloud Run default (edit if you prefer another fallback)
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
  "https://javaspringboot-project-tpy3lssbpa-uc.a.run.app";

export const API_BASE = String(DEFAULT_API_BASE).replace(/\/$/, "");

/* -----------------------------------------------------------------------------
   Axios instance
----------------------------------------------------------------------------- */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 15000,
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
// Optional alias used elsewhere
export const registerTokenProvider = registerTokenGetter;

/* -----------------------------------------------------------------------------
   Public GET allowlist (no Authorization header)
----------------------------------------------------------------------------- */
const PUBLIC_GET_ALLOWLIST: RegExp[] = [
  // services catalog
  /^\/api\/v1\/services\/public(?:\/.*)?$/i,

  // vehicles (exposes both patterns)
  /^\/api\/v1\/vehicles\/public(?:\/.*)?$/i,
  /^\/api\/v1\/public\/vehicles(?:\/.*)?$/i,

  // other public endpoints
  /^\/api\/v1\/public(?:\/.*)?$/i,

  // uploaded static files
  /^\/uploads\/.*$/i,

  // swagger/docs
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

  if ((import.meta as any)?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(
      "[API REQUEST]",
      (config.method || "GET").toUpperCase(),
      isAbsolute ? rawUrl : `${API_BASE}${rawUrl}`,
      (config.headers as any)?.Authorization ? "(auth✓)" : "(public)"
    );
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
  (res) => {
    if ((import.meta as any)?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        "[API RESPONSE]",
        res.config.method?.toUpperCase(),
        res.config.url,
        res.status
      );
    }
    return res;
  },
  (err) => {
    const ax = err as AxiosError;
    const method = ax.config?.method?.toUpperCase();
    const url = ax.config?.url?.startsWith("http")
      ? ax.config?.url
      : `${API_BASE}${ax.config?.url ?? ""}`;
    const status = ax.response?.status ?? "-";

    if (status === 401 || status === 403) {
      try {
        onUnauthorized?.(Number(status), ax.response?.data);
      } catch {
        // ignore handler errors
      }
    }

    // eslint-disable-next-line no-console
    console.error("[API ERROR]", method, url, status, ax.message);
    return Promise.reject(err);
  }
);

/* -----------------------------------------------------------------------------
   Tiny JSON helpers (normalize empty 201/204 responses to null)
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

/** Aliases so older code keeps working */
export const delJSON = deleteJSON;
export const del = deleteJSON;

/** Try multiple endpoints and return the first that succeeds. */
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

/** Default export for `import api from "@/services/client"` */
export default api;
