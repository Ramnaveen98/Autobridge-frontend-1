// src/pages/Login.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function Login() {
  const nav = useNavigate();
  const { search } = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      const qs = new URLSearchParams(search);
      const next = qs.get("next");
      nav(next || "/services", { replace: true });
    } catch (ex: any) {
      if (ex?.response?.status === 401) setErr("Invalid email or password.");
      else setErr("Server error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-12 sm:pt-16 md:pt-24 lg:pt-12">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {err && <div className="text-red-400 text-sm text-center">{err}</div>}

        <button
          disabled={busy}
          className="w-full py-2 rounded-lg bg-blue-600 text-white disabled:opacity-70"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* ---- Footer links ---- */}
      <div className="text-center text-sm mt-6 space-y-1">
        <p>
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-400 underline hover:text-blue-300">
            Sign up now
          </a>
        </p>
        <p>
          Forgot your password?{" "}
          <a href="/reset-password" className="text-blue-400 underline hover:text-blue-300">
            Reset Password
          </a>
        </p>
      </div>
    </div>
  );
}
