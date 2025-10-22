/*
import { useState } from "react";
import { adminApi } from "@/services/admin";

export default function AdminAgents() {
  const [agentId, setAgentId] = useState("");
  const [msg, setMsg] = useState<string|null>(null);

  const approve = async (active:boolean) => {
    setMsg(null);
    if (!agentId) { setMsg("Enter an agent ID"); return; }
    await adminApi.approveAgent(agentId, active);
    setMsg(`Agent ${agentId} is now ${active ? "ACTIVE" : "INACTIVE"}.`);
  };

  return (
    <div className="max-w-xl card p-6">
      <h2 className="text-xl font-semibold mb-3">Agents</h2>
      <div className="space-y-3">
        <div>
          <label className="label">Agent ID</label>
          <input className="input" value={agentId} onChange={e=>setAgentId(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={()=>approve(true)}>Approve</button>
          <button className="btn-outline" onClick={()=>approve(false)}>Disable</button>
        </div>
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
  */



// src/pages/admin/AdminAgents.tsx
import { useEffect, useState } from "react";
import {
  Agent,
  listAgents,
  createAgent,
  updateAgent,
  deleteAgent,
} from "@/services/adminAgents";

export default function AdminAgents() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Agent>>({});
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setRows(await listAgents());
      } catch (e: any) {
        setErr(e?.message || "Failed to load agents.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function resetForm() {
    setForm({});
  }

  async function saveNew() {
    try {
      setSaving(true);
      setErr(null);

      const payload = {
        firstName: (form.firstName || "").trim(),
        lastName: (form.lastName || "").trim(),
        email: (form.email || "").trim(),
        phone: (form.phone || "").trim(),
        active: form.active ?? true,
      };

      if (!payload.email) {
        setErr("Email is required.");
        return;
      }

      const created = await createAgent(payload as any);
      setRows((prev) => [created, ...prev]);
      resetForm();
    } catch (e: any) {
      setErr(e?.message || "Failed to create agent.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Agent) {
    try {
      setErr(null);
      const updated = await updateAgent(a.id, { active: !a.active });
      setRows((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    } catch (e: any) {
      setErr(e?.message || "Failed to update agent.");
    }
  }

  async function remove(a: Agent) {
    try {
      setErr(null);
      setDeletingId(a.id);
      await deleteAgent(a.id);
      setRows((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e: any) {
      setErr(e?.message || "Failed to delete agent.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {err && (
        <div className="rounded border border-red-500/50 bg-red-900/20 text-red-200 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {/* Create */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-300">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={5}>
                  No agents
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-t border-slate-800">
                  <td className="p-3">
                    {(a.firstName ?? "")} {(a.lastName ?? "")}
                  </td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.phone || "—"}</td>
                  <td className="p-3">
                    <span className={a.active ? "text-green-400" : "text-slate-400"}>
                      {a.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="px-2 py-1 rounded bg-slate-800"
                      onClick={() => toggleActive(a)}
                    >
                      {a.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50"
                      onClick={() => remove(a)}
                      disabled={deletingId === a.id}
                    >
                      {deletingId === a.id ? "Deleting…" : "Delete"}
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
