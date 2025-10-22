/*
import { useEffect, useState } from "react";
import { api } from "@/services/client";

type Role = "USER" | "AGENT" | "ADMIN";
type Person = { id: number; firstName: string; lastName: string; email: string; role: Role };
type Upsert = Partial<Person>;
type Mode = "USERS" | "AGENTS";

const PATHS = {
  USERS: { list: "/api/v1/admin/directory/users",  put: (id:number)=>`/api/v1/admin/directory/users/${id}` },
  AGENTS:{ list: "/api/v1/admin/directory/agents", put: (id:number)=>`/api/v1/admin/directory/agents/${id}` },
};

export default function AdminDirectory() {
  const [mode, setMode] = useState<Mode>("USERS");
  const [rows, setRows] = useState<Person[]>([]);
  const [editing, setEditing] = useState<Record<number, Upsert>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { fetchList(); }, [mode]);

  async function fetchList() {
    setLoading(true); setErr(null);
    try {
      const res = await api.get<Person[]>(PATHS[mode].list);
      setRows(res.data ?? []);
    } catch (e: any) {
      const st = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Unknown error";
      setErr(`Failed to load ${mode.toLowerCase()}: (${st ?? "?"}) ${msg}`);
    } finally { setLoading(false); }
  }

  async function save(p: Person) {
    setBusy(p.id);
    try {
      const patch = editing[p.id] ?? {};
      await api.put(PATHS[mode].put(p.id), patch);
      await fetchList();
      setEditing(s => ({ ...s, [p.id]: {} }));
    } catch (e: any) {
      const st = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Unknown error";
      alert(`Save failed: (${st ?? "?"}) ${msg}`);
    } finally { setBusy(null); }
  }

  const Tab = (label: string, m: Mode) => (
    <button
      onClick={()=>setMode(m)}
      className={`px-3 py-1.5 rounded-lg border ${mode===m ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 border-slate-700"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Directory</h1>
        <div className="flex gap-2">
          {Tab("Users", "USERS")}
          {Tab("Agents", "AGENTS")}
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-400 mb-3">{err}</div>}
      {!loading && rows.length === 0 && <div>No records.</div>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="text-left p-3">First Name</th>
                <th className="text-left p-3">Last Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-3">
                    <input defaultValue={u.firstName} onChange={e=>setEditing(s=>({...s,[u.id]:{...s[u.id], firstName:e.target.value}}))} className="px-2 py-1 rounded bg-slate-800 border border-slate-700"/>
                  </td>
                  <td className="p-3">
                    <input defaultValue={u.lastName} onChange={e=>setEditing(s=>({...s,[u.id]:{...s[u.id], lastName:e.target.value}}))} className="px-2 py-1 rounded bg-slate-800 border border-slate-700"/>
                  </td>
                  <td className="p-3">
                    <input defaultValue={u.email} onChange={e=>setEditing(s=>({...s,[u.id]:{...s[u.id], email:e.target.value}}))} className="px-2 py-1 rounded bg-slate-800 border border-slate-700"/>
                  </td>
                  <td className="p-3">
                    <select defaultValue={u.role} onChange={e=>setEditing(s=>({...s,[u.id]:{...s[u.id], role:e.target.value as Role}}))} className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
                      <option>USER</option><option>AGENT</option><option>ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button disabled={busy===u.id} onClick={()=>save(u)} className="px-3 py-1.5 rounded bg-blue-600 text-white">
                      {busy===u.id ? "Saving…" : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

*/


// src/pages/admin/AdminDirectory.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getDirectoryUsers,
  updateDirectoryUser,
  deleteDirectoryUser,
  getDirectoryAgents,
  updateDirectoryAgent,
  deleteDirectoryAgent,
  type PersonDto,
} from "@/services/adminDirectory";

type Tab = "users" | "agents";

type RowEdit = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
  agentActive?: boolean | null;
};

function toEdit(p: PersonDto): RowEdit {
  return {
    userId: p.userId,
    firstName: (p.firstName ?? "").trim(),
    lastName: (p.lastName ?? "").trim(),
    email: (p.email ?? "").trim(),
    role: p.role,
    agentActive: p.agentActive ?? null,
  };
}

export default function AdminDirectory() {
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<RowEdit[]>([]);
  const [agents, setAgents] = useState<RowEdit[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [u, a] = await Promise.all([getDirectoryUsers(), getDirectoryAgents()]);
      setUsers(u.map(toEdit));
      setAgents(a.map(toEdit));
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const roleOptions = useMemo(
    () => [
      { v: "USER", label: "USER" },
      { v: "AGENT", label: "AGENT" },
      { v: "ADMIN", label: "ADMIN" },
    ],
    []
  );

  function bindList(
    list: RowEdit[],
    setList: React.Dispatch<React.SetStateAction<RowEdit[]>>
  ) {
    return {
      onChange(id: number, patch: Partial<RowEdit>) {
        setList((prev) => prev.map((r) => (r.userId === id ? { ...r, ...patch } : r)));
      },
      async onSaveUser(id: number) {
        const row = list.find((r) => r.userId === id);
        if (!row) return;

        try {
          setSavingId(id);
          setErr(null);
          setOk(null);
          await updateDirectoryUser(id, {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            role: row.role,
          });
          await load();
          setOk("Saved!");
          setTimeout(() => setOk(null), 2000);
        } catch (e: any) {
          setErr(e?.response?.data?.message || e?.message || "Failed to save user.");
        } finally {
          setSavingId(null);
        }
      },
      async onDeleteUser(id: number) {
        if (!confirm("Delete this user? This cannot be undone.")) return;
        try {
          setSavingId(id);
          setErr(null);
          setOk(null);
          await deleteDirectoryUser(id);
          await load();
          setOk("Deleted.");
          setTimeout(() => setOk(null), 2000);
        } catch (e: any) {
          setErr(e?.response?.data?.message || e?.message || "Failed to delete user.");
        } finally {
          setSavingId(null);
        }
      },
      async onSaveAgent(id: number) {
        const row = list.find((r) => r.userId === id);
        if (!row) return;

        try {
          setSavingId(id);
          setErr(null);
          setOk(null);
          // Active toggle is implemented by flipping role:
          //   - AGENT => active
          //   - USER/ADMIN => agent deactivated by backend
          await updateDirectoryAgent(id, {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            role: row.role,
          });
          await load();
          setOk("Saved!");
          setTimeout(() => setOk(null), 2000);
        } catch (e: any) {
          setErr(e?.response?.data?.message || e?.message || "Failed to save agent.");
        } finally {
          setSavingId(null);
        }
      },
      async onDeleteAgent(id: number) {
        if (!confirm("Delete this agent (user) record? This cannot be undone.")) return;
        try {
          setSavingId(id);
          setErr(null);
          setOk(null);
          await deleteDirectoryAgent(id);
          await load();
          setOk("Deleted.");
          setTimeout(() => setOk(null), 2000);
        } catch (e: any) {
          setErr(e?.response?.data?.message || e?.message || "Failed to delete agent.");
        } finally {
          setSavingId(null);
        }
      },
    };
  }

  const userBind = bindList(users, setUsers);
  const agentBind = bindList(agents, setAgents);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-2">Directory</h1>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1.5 rounded-lg border ${tab === "users" ? "bg-zinc-800" : "bg-transparent"} border-zinc-700`}
          onClick={() => setTab("users")}
        >
          Users
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg border ${tab === "agents" ? "bg-zinc-800" : "bg-transparent"} border-zinc-700`}
          onClick={() => setTab("agents")}
        >
          Agents
        </button>
      </div>

      {err && (
        <div className="mb-4 rounded border border-rose-800/50 bg-rose-950/30 text-rose-200 px-4 py-3">
          {err}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded border border-emerald-800/50 bg-emerald-950/30 text-emerald-200 px-4 py-3">
          {ok}
        </div>
      )}

      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : tab === "users" ? (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((r) => (
                <tr key={r.userId} className="[&>td]:px-3 [&>td]:py-2 border-t border-zinc-900">
                  <td>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                      value={r.firstName}
                      onChange={(e) => userBind.onChange(r.userId, { firstName: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                      value={r.lastName}
                      onChange={(e) => userBind.onChange(r.userId, { lastName: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                      value={r.email}
                      onChange={(e) => userBind.onChange(r.userId, { email: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                      value={r.role}
                      onChange={(e) => userBind.onChange(r.userId, { role: e.target.value as any })}
                    >
                      {roleOptions.map((o) => (
                        <option key={o.v} value={o.v}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right pr-4 space-x-2">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
                      onClick={() => userBind.onSaveUser(r.userId)}
                      disabled={savingId === r.userId}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                      onClick={() => userBind.onDeleteUser(r.userId)}
                      disabled={savingId === r.userId}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-zinc-400">No users.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/40">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Role / Active</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((r) => {
                const isActive = r.role === "AGENT";
                return (
                  <tr key={r.userId} className="[&>td]:px-3 [&>td]:py-2 border-t border-zinc-900">
                    <td>
                      <input
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                        value={r.firstName}
                        onChange={(e) => agentBind.onChange(r.userId, { firstName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                        value={r.lastName}
                        onChange={(e) => agentBind.onChange(r.userId, { lastName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                        value={r.email}
                        onChange={(e) => agentBind.onChange(r.userId, { email: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <select
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
                          value={r.role}
                          onChange={(e) => agentBind.onChange(r.userId, { role: e.target.value as any })}
                          title="Role (AGENT means active agent; changing away from AGENT deactivates agent row)"
                        >
                          {roleOptions.map((o) => (
                            <option key={o.v} value={o.v}>{o.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) =>
                              agentBind.onChange(r.userId, {
                                role: e.target.checked ? "AGENT" : "USER",
                              })
                            }
                          />
                          Active
                        </label>
                      </div>
                    </td>
                    <td className="text-right pr-4 space-x-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
                        onClick={() => agentBind.onSaveAgent(r.userId)}
                        disabled={savingId === r.userId}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-60"
                        onClick={() => agentBind.onDeleteAgent(r.userId)}
                        disabled={savingId === r.userId}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-zinc-400">No agents.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
