// src/providers/AuthProvider.tsx
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authApi } from "@/services/auth";
import { registerTokenGetter, registerUnauthorizedHandler } from "@/services/client";

type Role = "USER" | "ADMIN" | "AGENT";
type MaybeRole = Role | null;

type AuthContextShape = {
  token: string | null;
  role: MaybeRole;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthContextShape>({
  token: null,
  role: null,
  email: null,
  async login() {},
  logout() {},
});

export function useAuth() {
  return useContext(Ctx);
}

const STORAGE_KEY = "autobridge.auth";
const TOKEN_KEY = "autobridge.token";
const AUTH_EVENT_KEY = "autobridge.auth.event";

// auto-logout slightly before exp to avoid race
const EXP_SKEW_MS = 5000;

function base64UrlDecode(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 2 ? "==" : b64.length % 4 === 3 ? "=" : "";
  try {
    return atob(b64 + pad);
  } catch {
    return "";
  }
}

function getJwtExpMs(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    const payload = JSON.parse(json || "{}");
    if (typeof payload.exp === "number" && isFinite(payload.exp)) {
      return payload.exp * 1000; // seconds → ms
    }
  } catch {
    // ignore bad tokens
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<MaybeRole>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          token: string | null;
          role: MaybeRole;
          email: string | null;
        };
        setToken(parsed.token ?? null);
        setRole(parsed.role ?? null);
        setEmail(parsed.email ?? null);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Register token getter for API client
  useEffect(() => {
    registerTokenGetter(() => token);
  }, [token]);

  // Keep a plain token copy for quick access (optional)
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  // --- Auto-logout timer management ---
  const timerRef = useRef<number | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimer();
    setToken(null);
    setRole(null);
    setEmail(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      // broadcast to other tabs
      localStorage.setItem(
        AUTH_EVENT_KEY,
        JSON.stringify({ type: "LOGOUT", t: Date.now() })
      );
    } catch {}
  }, [clearTimer]);

  const scheduleAutoLogout = useCallback(
    (tok: string | null) => {
      clearTimer();
      const expMs = getJwtExpMs(tok);
      if (!expMs) return; // token without exp, do nothing
      const now = Date.now();
      const delay = Math.max(0, expMs - now - EXP_SKEW_MS);
      if (delay === 0) {
        // already expired or within skew — logout now
        logout();
        return;
      }
      timerRef.current = window.setTimeout(() => {
        logout();
      }, delay);
    },
    [clearTimer, logout]
  );

  async function login(em: string, pw: string) {
    const resp = await authApi.login(em, pw);
    if (!resp?.token || !resp?.role || !resp?.email) {
      throw new Error("Malformed login response from server");
    }
    setToken(resp.token);
    setRole(resp.role as Role);
    setEmail(resp.email);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: resp.token, role: resp.role, email: resp.email })
      );
      localStorage.setItem(TOKEN_KEY, resp.token); // keep plain token for Axios
      // broadcast login to other tabs (optional)
      localStorage.setItem(
        AUTH_EVENT_KEY,
        JSON.stringify({ type: "LOGIN", t: Date.now() })
      );
    } catch {}

    scheduleAutoLogout(resp.token);
  }

  // schedule on mount (after storage restore) and on every token change
  useEffect(() => {
    scheduleAutoLogout(token);
  }, [token, scheduleAutoLogout]);

  // 401/403 from API → logout immediately
  useEffect(() => {
    registerUnauthorizedHandler((_status) => {
      // You can show a toast here if desired (session expired).
      logout();
    });
  }, [logout]);

  // Re-check when tab becomes visible (helps if device slept past expiry)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      const expMs = getJwtExpMs(localStorage.getItem(TOKEN_KEY));
      if (expMs && Date.now() >= expMs - EXP_SKEW_MS) {
        logout();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [logout]);

  // Cross-tab sync via storage events
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setToken(parsed?.token ?? null);
          setRole((parsed?.role as MaybeRole) ?? null);
          setEmail(parsed?.email ?? null);
          scheduleAutoLogout(parsed?.token ?? null);
        } catch {}
      }
      if (e.key === AUTH_EVENT_KEY && e.newValue) {
        try {
          const ev = JSON.parse(e.newValue);
          if (ev?.type === "LOGOUT") {
            clearTimer();
            setToken(null);
            setRole(null);
            setEmail(null);
          }
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearTimer, scheduleAutoLogout]);

  const value = useMemo(
    () => ({ token, role, email, login, logout }),
    [token, role, email, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}


/*


// The below particular code is for working AuthProvider.tsx , there are No errors and 
// i want to add little security features so , that i am commenting .
//We can use this in any features purpose

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/services/auth";
import { registerTokenGetter } from "@/services/client";

type Role = "USER" | "ADMIN" | "AGENT";
type MaybeRole = Role | null;

type AuthContextShape = {
  token: string | null;
  role: MaybeRole;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthContextShape>({
  token: null,
  role: null,
  email: null,
  async login() {},
  logout() {},
});

export function useAuth() {
  return useContext(Ctx);
}

const STORAGE_KEY = "autobridge.auth";
const TOKEN_KEY = "autobridge.token";

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<MaybeRole>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          token: string | null;
          role: MaybeRole;
          email: string | null;
        };
        setToken(parsed.token ?? null);
        setRole(parsed.role ?? null);
        setEmail(parsed.email ?? null);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Register token getter for API client
  useEffect(() => {
    registerTokenGetter(() => token);
  }, [token]);

  // Keep a plain token copy for quick access (optional)
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  async function login(em: string, pw: string) {
    const resp = await authApi.login(em, pw);
    if (!resp?.token || !resp?.role || !resp?.email) {
      throw new Error("Malformed login response from server");
    }
    setToken(resp.token);
    setRole(resp.role as Role);
    setEmail(resp.email);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: resp.token, role: resp.role, email: resp.email })
    );
    localStorage.setItem(TOKEN_KEY, resp.token); // keep plain token for Axios
  }

  function logout() {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  const value = useMemo(
    () => ({ token, role, email, login, logout }),
    [token, role, email]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

*/