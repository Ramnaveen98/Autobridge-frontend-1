/*
// src/pages/Signup.tsx
import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/services/auth";

type AccountType = "USER" | "ADMIN" | "AGENT";

export default function Signup() {
  const nav = useNavigate();

  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPw] = useState("");
  const [accountType, setType] = useState<AccountType>("USER");
  const [inviteCode, setInvite] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await authApi.signup({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
        accountType,           // backend expects: USER | ADMIN | AGENT
        inviteCode: inviteCode || undefined // only checked for ADMIN/AGENT
      });

      // signup returns 201 and NO token. send user to login.
      nav("/login", { replace: true, state: { msg: "Sign up successful. Please sign in." } });
    } catch (e: any) {
      // map common HTTP errors to friendly text
      const msg =
        e?.response?.status === 409
          ? "An account with this email already exists."
          : e?.response?.status === 403
          ? "Invalid or missing invite code for selected account type."
          : "Sign up failed. Please try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const needsInvite = accountType === "ADMIN" || accountType === "AGENT";

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg p-6 rounded-2xl bg-slate-900/60 border border-slate-800"
      >
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-slate-400 mb-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 underline">
            Sign in
          </Link>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-300">First name</span>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Last name</span>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Phone (optional)</span>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 555 5555"
            />
          </label>
        </div>

        <div className="mt-3">
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={password}
              onChange={(e) => setPw(e.target.value)}
              required
              minLength={6}
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-300">Account type</span>
            <select
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={accountType}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              <option value="USER">User</option>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className={`block ${needsInvite ? "" : "opacity-60"}`}>
            <span className="text-sm text-slate-300">
              Invite code {needsInvite ? "" : "(not required)"}
            </span>
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 disabled:opacity-60"
              value={inviteCode}
              onChange={(e) => setInvite(e.target.value)}
              disabled={!needsInvite}
              placeholder={needsInvite ? "Enter invite code" : "N/A"}
              required={needsInvite}
            />
          </label>
        </div>

        {err && <p className="mt-4 text-red-400 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
  */


// src/pages/Signup.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/auth";

type Role = "USER" | "AGENT" | "ADMIN";

export default function Signup() {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("USER");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null); setOk(null);

    try {
      await authApi.signup({
        firstName, lastName, email, password, phone,
        accountType: role, inviteCode: inviteCode || undefined
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
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create an account</h1>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm mb-1">First name</div>
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                   value={firstName} onChange={e => setFirst(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Last name</div>
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                   value={lastName} onChange={e => setLast(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Email</div>
          <input type="email" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                 value={email} onChange={e => setEmail(e.target.value)} />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Phone</div>
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                   value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Password</div>
            <input type="password" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                   value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Account type</div>
          <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                  value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="USER">User</option>
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        {(role === "ADMIN" || role === "AGENT") && (
          <label className="block">
            <div className="text-sm mb-1">Invite code (required for {role.toLowerCase()})</div>
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                   value={inviteCode} onChange={e => setInvite(e.target.value)} />
          </label>
        )}

        {err && <div className="text-red-400 text-sm">{err}</div>}
        {ok && <div className="text-emerald-400 text-sm">{ok}</div>}

        <button disabled={busy}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
