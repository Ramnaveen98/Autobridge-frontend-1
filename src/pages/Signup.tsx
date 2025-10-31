// src/pages/Signup.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/services/auth";

type Role = "USER" | "AGENT" | "ADMIN";

export default function Signup() {
  const nav = useNavigate();

  // form state
  const [role, setRole] = useState<Role>("USER");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvite] = useState("");

  // ui state
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // simple client validations (kept lightweight)
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const phoneOk = phone.trim() === "" || /^[0-9()\-\s+]{7,20}$/.test(phone.trim());

  const pwRules = useMemo(() => {
    const v = password;
    return {
      len: v.length >= 8,
      up: /[A-Z]/.test(v),
      low: /[a-z]/.test(v),
      num: /\d/.test(v),
      sym: /[^A-Za-z0-9]/.test(v),
    };
  }, [password]);
  const pwOk = pwRules.len && pwRules.up && pwRules.low && pwRules.num && pwRules.sym;

  const inviteNeeded = role === "ADMIN" || role === "AGENT";
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    emailOk &&
    phoneOk &&
    pwOk &&
    (!inviteNeeded || inviteCode.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await authApi.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        accountType: role,
        inviteCode: inviteCode.trim() || undefined,
      });
      setOk("Sign up successful. Please log in.");
      setTimeout(() => nav("/login", { replace: true }), 700);
    } catch (e: any) {
      if (e?.response?.status === 409) setErr("Email already registered.");
      else if (e?.response?.status === 403) setErr("Invalid invite code for selected role.");
      else setErr("Server error while signing up.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 py-10">
      {/* match Login page width/centering */}
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Create an account</h1>

        <form onSubmit={submit} className="space-y-4">
          {/* First name */}
          <label className="block">
            <div className="text-sm mb-1">First name</div>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
              required
            />
          </label>

          {/* Last name */}
          <label className="block">
            <div className="text-sm mb-1">Last name</div>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
              required
            />
          </label>

          {/* Email */}
          <label className="block">
            <div className="text-sm mb-1">Email</div>
            <input
              type="email"
              className={`w-full rounded-lg bg-slate-800 border px-3 py-2 outline-none ${
                email && !emailOk ? "border-red-600" : "border-slate-700"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={!!email && !emailOk}
            />
            {!emailOk && email.length > 0 && (
              <p className="mt-1 text-xs text-red-400">Enter a valid email address.</p>
            )}
          </label>

          {/* Phone */}
          <label className="block">
            <div className="text-sm mb-1">Phone</div>
            <input
              placeholder="(###) ###-####"
              className={`w-full rounded-lg bg-slate-800 border px-3 py-2 outline-none ${
                phone && !phoneOk ? "border-red-600" : "border-slate-700"
              }`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!phone && !phoneOk}
            />
            {!phoneOk && phone.length > 0 && (
              <p className="mt-1 text-xs text-red-400">Use digits, spaces, dashes, or ( ).</p>
            )}
          </label>

          {/* Password + toggle */}
          <label className="block">
            <div className="text-sm mb-1">Password</div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className={`w-full rounded-lg bg-slate-800 border px-3 py-2 pr-16 outline-none ${
                  password && !pwOk ? "border-red-600" : "border-slate-700"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                required
                aria-invalid={!!password && !pwOk}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            {/* Subtle checklist; small & wraps nicely on mobile */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300">
              <Rule ok={pwRules.len} text="At least 8 characters" />
              <Rule ok={pwRules.up} text="Contains an uppercase letter (A–Z)" />
              <Rule ok={pwRules.low} text="Contains a lowercase letter (a–z)" />
              <Rule ok={pwRules.num} text="Contains a number (0–9)" />
              <Rule ok={pwRules.sym} text="Contains a symbol (!@#$…)" />
            </div>
          </label>

          {/* Role */}
          <label className="block">
            <div className="text-sm mb-1">Account type</div>
            <select
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="USER">User</option>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          {/* Invite code (conditional) */}
          {inviteNeeded && (
            <label className="block">
              <div className="text-sm mb-1">
                Invite code <span className="text-slate-400">(required for {role.toLowerCase()})</span>
              </div>
              <input
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                value={inviteCode}
                onChange={(e) => setInvite(e.target.value)}
                required={inviteNeeded}
              />
            </label>
          )}

          {err && <div className="text-red-400 text-sm">{err}</div>}
          {ok && <div className="text-emerald-400 text-sm">{ok}</div>}

          <button
            disabled={busy || !canSubmit}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        {/* footer links — mirror Login page placement/size */}
        <div className="mt-4 text-sm text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          ok ? "bg-emerald-400" : "bg-slate-600"
        }`}
        aria-hidden
      />
      <span className={ok ? "text-emerald-300" : ""}>{text}</span>
    </div>
  );
}
