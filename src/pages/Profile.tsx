// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { getJSON, putJSON } from "@/services/client";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export default function Profile() {
  const [form, setForm] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const p = await getJSON<Profile>("/api/v1/me");
        if (!alive) return;
        setForm({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          email: p.email || "",
          phone: p.phone || "",
        });
      } catch (e: any) {
        setErr(
          e?.response?.data?.message || e?.message || "Failed to load profile."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      await putJSON("/api/v1/me", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
      });
      setMsg("✅ Profile updated successfully!");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex justify-center items-start md:pt-16 pt-10 px-4 transition-all">
      <div className="w-full max-w-3xl bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl p-6 sm:p-10 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-8">
          My Profile
        </h1>

        <form className="space-y-6" onSubmit={save}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">First Name</div>
              <input
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Enter your first name"
              />
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Last Name</div>
              <input
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Enter your last name"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Email</div>
              <input
                type="email"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Phone</div>
              <input
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </label>
          </div>

          {/* Messages */}
          {err && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 text-center">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm p-3 text-center">
              {msg}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium transition disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}








/*
//working code
// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { getJSON, putJSON } from "@/services/client";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export default function Profile() {
  const [form, setForm] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const p = await getJSON<Profile>("/api/v1/me");
        if (!alive) return;
        setForm({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          email: p.email || "",
          phone: p.phone || "",
        });
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      // Only send fields that exist in UserAccount
      await putJSON("/api/v1/me", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
      });
      setMsg("Profile updated.");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      <form className="space-y-4" onSubmit={save}>
        <label className="block">
          <div className="text-sm mb-1">First Name</div>
          <input
            className="input"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Last Name</div>
          <input
            className="input"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Email</div>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Phone</div>
          <input
            className="input"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>

        {err && <div className="text-red-400 text-sm">{err}</div>}
        {msg && <div className="text-green-400 text-sm">{msg}</div>}

        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
*/