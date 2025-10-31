/*
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
import AdminResetPasswordModal from "@/pages/admin/AdminResetPasswordModal";

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

  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

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
        if (!confirm("Delete this agent? This cannot be undone.")) return;
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

      {err && <div className="mb-3 text-red-500">{err}</div>}
      {ok && <div className="mb-3 text-green-500">{ok}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : tab === "users" ? (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left bg-zinc-950/40">
                <th>First</th>
                <th>Last</th>
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
                      value={r.firstName}
                      onChange={(e) => userBind.onChange(r.userId, { firstName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td>
                    <input
                      value={r.lastName}
                      onChange={(e) => userBind.onChange(r.userId, { lastName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td>{r.email}</td>
                  <td>
                    <select
                      value={r.role}
                      onChange={(e) => userBind.onChange(r.userId, { role: e.target.value as any })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    >
                      {roleOptions.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right pr-4 space-x-2">
                    <button
                      onClick={() => userBind.onSaveUser(r.userId)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmail(r.email);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => userBind.onDeleteUser(r.userId)}
                      className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-zinc-400">
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left bg-zinc-950/40">
                <th>First</th>
                <th>Last</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((r) => (
                <tr key={r.userId} className="[&>td]:px-3 [&>td]:py-2 border-t border-zinc-900">
                  <td>
                    <input
                      value={r.firstName}
                      onChange={(e) => agentBind.onChange(r.userId, { firstName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td>
                    <input
                      value={r.lastName}
                      onChange={(e) => agentBind.onChange(r.userId, { lastName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td>{r.email}</td>
                  <td>
                    <select
                      value={r.role}
                      onChange={(e) => agentBind.onChange(r.userId, { role: e.target.value as any })}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-full"
                    >
                      {roleOptions.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right pr-4 space-x-2">
                    <button
                      onClick={() => agentBind.onSaveAgent(r.userId)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmail(r.email);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => agentBind.onDeleteAgent(r.userId)}
                      className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-zinc-400">
                    No agents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedEmail && (
        <AdminResetPasswordModal
          email={selectedEmail}
          onClose={() => {
            setShowModal(false);
            setSelectedEmail(null);
          }}
        />
      )}
    </div>
  );
}


*/






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
import AdminResetPasswordModal from "@/pages/admin/AdminResetPasswordModal";

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

  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

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
          setTimeout(() => setOk(null), 1800);
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
          setTimeout(() => setOk(null), 1800);
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
          await updateDirectoryAgent(id, {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            role: row.role,
          });
          await load();
          setOk("Saved!");
          setTimeout(() => setOk(null), 1800);
        } catch (e: any) {
          setErr(e?.response?.data?.message || e?.message || "Failed to save agent.");
        } finally {
          setSavingId(null);
        }
      },
      async onDeleteAgent(id: number) {
        if (!confirm("Delete this agent? This cannot be undone.")) return;
        try {
          setSavingId(id);
          setErr(null);
          setOk(null);
          await deleteDirectoryAgent(id);
          await load();
          setOk("Deleted.");
          setTimeout(() => setOk(null), 1800);
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

  function Section({
    rows,
    bind,
  }: {
    rows: RowEdit[];
    bind: ReturnType<typeof bindList>;
  }) {
    return (
      <div
        className="
          rounded-2xl border border-zinc-800 bg-zinc-950/30
          py-6 md:py-8
          min-h-[64vh] sm:min-h-[78vh] md:min-h-[84vh]
        "
      >
        {/* Tablet & Desktop: Scrollable table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[15px] sm:text-sm min-w-[980px]">
            <thead>
              <tr className="[&>th]:px-4 [&>th]:py-3 text-left bg-zinc-950/50 sticky top-0 z-10">
                <th className="w-[180px]">First</th>
                <th className="w-[180px]">Last</th>
                <th className="w-[320px]">Email</th>
                <th className="w-[150px]">Role</th>
                <th className="text-right pr-5 w-[380px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  className="
                    [&>td]:px-4 [&>td]:py-3
                    border-t border-zinc-900
                    hover:bg-zinc-900/30 transition-colors align-top
                  "
                >
                  <td>
                    <input
                      value={r.firstName}
                      onChange={(e) => bind.onChange(r.userId, { firstName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 w-full"
                    />
                  </td>
                  <td>
                    <input
                      value={r.lastName}
                      onChange={(e) => bind.onChange(r.userId, { lastName: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 w-full"
                    />
                  </td>
                  <td>
                    <input
                      value={r.email}
                      onChange={(e) => bind.onChange(r.userId, { email: e.target.value })}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 w-full"
                    />
                  </td>
                  <td>
                    <select
                      value={r.role}
                      onChange={(e) => bind.onChange(r.userId, { role: e.target.value as any })}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 w-full"
                    >
                      {roleOptions.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="pr-5">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => (bind as any).onSaveUser?.(r.userId) || (bind as any).onSaveAgent?.(r.userId)}
                        className="px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500"
                      >
                        {savingId === r.userId ? "…" : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmail(r.email);
                          setShowModal(true);
                        }}
                        className="px-3.5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => (bind as any).onDeleteUser?.(r.userId) || (bind as any).onDeleteAgent?.(r.userId)}
                        className="px-3.5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-400">
                    No records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phone: Card layout (kept, with a touch more height) */}
        <div className="sm:hidden divide-y divide-zinc-900">
          {rows.length === 0 ? (
            <div className="py-6 text-center text-zinc-400">No records.</div>
          ) : (
            rows.map((r) => (
              <div key={r.userId} className="p-3">
                <div className="rounded-xl ring-1 ring-zinc-800 bg-zinc-900/40 p-4">
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400">First</label>
                        <input
                          value={r.firstName}
                          onChange={(e) => bind.onChange(r.userId, { firstName: e.target.value })}
                          className="mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">Last</label>
                        <input
                          value={r.lastName}
                          onChange={(e) => bind.onChange(r.userId, { lastName: e.target.value })}
                          className="mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400">Email</label>
                      <input
                        value={r.email}
                        onChange={(e) => bind.onChange(r.userId, { email: e.target.value })}
                        className="mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400">Role</label>
                      <select
                        value={r.role}
                        onChange={(e) => bind.onChange(r.userId, { role: e.target.value as any })}
                        className="mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 w-full"
                      >
                        {roleOptions.map((o) => (
                          <option key={o.v} value={o.v}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => (bind as any).onSaveUser?.(r.userId) || (bind as any).onSaveAgent?.(r.userId)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500"
                    >
                      {savingId === r.userId ? "…" : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmail(r.email);
                        setShowModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => (bind as any).onDeleteUser?.(r.userId) || (bind as any).onDeleteAgent?.(r.userId)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-7 min-h-[80vh] md:min-h-[88vh] pb-20">
      <h1 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Directory</h1>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          className={`px-3.5 py-2 rounded-lg border ${tab === "users" ? "bg-zinc-800" : "bg-transparent"} border-zinc-700 text-sm`}
          onClick={() => setTab("users")}
        >
          Users
        </button>
        <button
          className={`px-3.5 py-2 rounded-lg border ${tab === "agents" ? "bg-zinc-800" : "bg-transparent"} border-zinc-700 text-sm`}
          onClick={() => setTab("agents")}
        >
          Agents
        </button>
      </div>

      {err && <div className="mb-3 text-red-500 text-sm">{err}</div>}
      {ok && <div className="mb-3 text-green-500 text-sm">{ok}</div>}

      {loading ? (
        <div className="text-sm">Loading…</div>
      ) : tab === "users" ? (
        <Section rows={users} bind={userBind} />
      ) : (
        <Section rows={agents} bind={agentBind} />
      )}

      {showModal && selectedEmail && (
        <AdminResetPasswordModal
          email={selectedEmail}
          onClose={() => {
            setShowModal(false);
            setSelectedEmail(null);
          }}
        />
      )}
    </div>
  );
}
