// src/pages/admin/AdminUsers.tsx
import { useEffect, useState } from "react";
import { AbUser, listUsers, createUser, updateUser, deleteUser } from "@/services/adminUsers";

export default function AdminUsers() {
  const [rows, setRows] = useState<AbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<AbUser & { password?: string }>>({});
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setRows(await listUsers());
      } catch (e: any) {
        setErr(e?.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveNew() {
    try {
      setSaving(true);
      const payload: any = {
        firstName: form.firstName || "",
        lastName: form.lastName || "",
        email: form.email || "",
        phone: form.phone || "",
        role: (form.role as any) || "USER",
        password: (form as any).password || "ChangeMe!123",
        active: form.active ?? true,
      };
      const created = await createUser(payload);
      setRows((prev) => [created, ...prev]);
      setForm({});
    } catch (e: any) {
      setErr(e?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AbUser) {
    try {
      const updated = await updateUser(u.id, { active: !u.active });
      setRows((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      setErr(e?.message || "Failed to update user.");
    }
  }

  async function remove(u: AbUser) {
    try {
      setDeletingId(u.id);
      await deleteUser(u.id);
      setRows((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) {
      setErr(e?.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="text-red-400 text-sm">{err}</div>}

      {/* Create */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          placeholder="First name"
          value={form.firstName || ""}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        />
        <input
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          placeholder="Last name"
          value={form.lastName || ""}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        />
        <input
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          placeholder="Email"
          value={form.email || ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <select
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          value={form.role || "USER"}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
        >
          <option value="USER">USER</option>
          <option value="AGENT">AGENT</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <input
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
          placeholder="Temp password"
          value={(form as any).password || ""}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <div className="flex gap-2">
          <input
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 flex-1"
            placeholder="Phone"
            value={form.phone || ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            onClick={saveNew}
            disabled={saving}
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={6}>
                  No users
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.phone || "-"}</td>
                  <td className="p-3">
                    <span className={u.active ? "text-green-400" : "text-slate-400"}>
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button className="px-2 py-1 rounded bg-slate-800" onClick={() => toggleActive(u)}>
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50"
                      onClick={() => remove(u)}
                      disabled={deletingId === u.id}
                    >
                      {deletingId === u.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
