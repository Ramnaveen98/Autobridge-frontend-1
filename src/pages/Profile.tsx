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
