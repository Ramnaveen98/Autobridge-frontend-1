import { useState } from "react";
import { api } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (!data?.token || !data?.role) throw new Error("Malformed login response");
      login(data.token, data.role);
      // navigate as you prefer
      // e.g., window.location.href = "/";
    } catch (ex: any) {
      setErr(ex?.response?.status ? `Login failed: HTTP ${ex.response.status}` : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e2954] to-[#051d3b] flex items-center justify-center p-4">
      <div className="w-[420px] max-w-[92vw] rounded-2xl bg-white text-slate-900 p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">Autobridge Portal</p>
        {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}

        <form className="space-y-4" onSubmit={doLogin}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
