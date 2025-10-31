// src/pages/admin/AdminServices.tsx
import { useEffect, useState } from "react";
import { getJSON, postJSON, putJSON, del } from "@/services/client";

type ServiceRow = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  basePrice: number;
  durationMinutes: number;
  active: boolean;
};

const emptyForm: Omit<ServiceRow, "id"> = {
  slug: "",
  name: "",
  description: "",
  basePrice: 0,
  durationMinutes: 30,
  active: true,
};

export default function AdminServices() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ServiceRow, "id">>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await getJSON<ServiceRow[]>("/api/v1/admin/services");
      setRows(data ?? []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setMsg(null);
  }

  function startEdit(row: ServiceRow) {
    setEditId(row.id);
    setForm({
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      basePrice: row.basePrice,
      durationMinutes: row.durationMinutes,
      active: row.active,
    });
    setMsg(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (editId == null) {
        await postJSON<ServiceRow>("/api/v1/admin/services", form);
        setMsg("Created.");
      } else {
        await putJSON<ServiceRow>(`/api/v1/admin/services/${editId}`, {
          id: editId,
          ...form,
        });
        setMsg("Updated.");
      }
      await load();
      if (editId == null) setForm({ ...emptyForm });
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 422) setMsg("Slug already exists.");
      else setMsg(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this service?")) return;
    try {
      await del(`/api/v1/admin/services/${id}`);
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        alert("Cannot delete: service is referenced by existing requests.");
      } else {
        alert(e?.response?.data?.message || e.message || "Delete failed");
      }
    }
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
        Manage Services
      </h1>

      {/* Form Section */}
      <form
        onSubmit={save}
        className="rounded-2xl border border-slate-800 p-4 sm:p-6 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2"
      >
        <label className="block">
          <div className="text-sm mb-1">Slug</div>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Name</div>
          <input
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm mb-1">Description</div>
          <textarea
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none resize-none"
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Base Price</div>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            value={form.basePrice}
            onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Duration (minutes)</div>
          <input
            type="number"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Active</div>
          <select
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            value={form.active ? "1" : "0"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "1" }))}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </label>

        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            {editId == null ? (saving ? "Creating…" : "Create") : saving ? "Updating…" : "Update"}
          </button>
          {editId != null && (
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
              onClick={startCreate}
            >
              Cancel edit
            </button>
          )}
          {msg && (
            <div className="text-sm text-slate-300 sm:ml-2 break-words">{msg}</div>
          )}
        </div>
      </form>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-800 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Duration</th>
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
            ) : err ? (
              <tr>
                <td className="p-3 text-red-400" colSpan={6}>
                  {err}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={6}>
                  No services
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.slug}</td>
                  <td className="p-3">{fmtCurrency(r.basePrice)}</td>
                  <td className="p-3">{r.durationMinutes}m</td>
                  <td className="p-3">{r.active ? "Yes" : "No"}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <button
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
                      onClick={() => startEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
                      onClick={() => remove(r.id)}
                    >
                      Delete
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

function fmtCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n}`;
  }
}
