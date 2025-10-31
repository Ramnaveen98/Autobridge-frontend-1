/*
import { useEffect, useState } from "react";
import { api } from "@/services/client";

type Role = "USER" | "AGENT" | "ADMIN";

type Row = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export default function AdminDirectoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/v1/admin/users", {
        params: roleFilter ? { role: roleFilter } : {},
      });
      setRows(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function save(row: Row, patch: Partial<Row>) {
    setSavingId(row.id);
    setError(null);
    try {
      const { data } = await api.patch(`/api/v1/admin/users/${row.id}`, {
        name: patch.name ?? row.name,
        phone: patch.phone ?? row.phone,
        role: (patch.role ?? row.role) as Role,
        active: patch.active ?? row.active,
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? data : r)));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function resetPassword(row: Row) {
    setSavingId(row.id);
    try {
      await api.post(`/api/v1/admin/users/${row.id}/reset-password`);
      alert("Temporary password issued.");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Reset failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Directory</h1>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded p-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="AGENT">Agents</option>
            <option value="ADMIN">Admins</option>
          </select>
          <button onClick={load} className="border rounded px-3 py-1 text-sm">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No users
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-48"
                      defaultValue={r.name}
                      onBlur={(e) => save(r, { name: e.target.value })}
                    />
                  </td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-40"
                      defaultValue={r.phone || ""}
                      onBlur={(e) => save(r, { phone: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      defaultValue={r.role}
                      className="border rounded p-1"
                      onChange={(e) => save(r, { role: e.target.value as Role })}
                    >
                      <option>USER</option>
                      <option>AGENT</option>
                      <option>ADMIN</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      defaultChecked={r.active}
                      onChange={(e) => save(r, { active: e.target.checked })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      disabled={savingId === r.id}
                      onClick={() => resetPassword(r)}
                      className="px-3 py-1 rounded border"
                    >
                      {savingId === r.id ? "…" : "Reset Password"}
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


*/


import { useEffect, useState } from "react";
import { api } from "@/services/client";

type Role = "USER" | "AGENT" | "ADMIN";

type Row = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export default function AdminDirectoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/v1/admin/users", {
        params: roleFilter ? { role: roleFilter } : {},
      });
      setRows(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function save(row: Row, patch: Partial<Row>) {
    setSavingId(row.id);
    setError(null);
    try {
      const { data } = await api.patch(`/api/v1/admin/users/${row.id}`, {
        name: patch.name ?? row.name,
        phone: patch.phone ?? row.phone,
        role: (patch.role ?? row.role) as Role,
        active: patch.active ?? row.active,
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? data : r)));
    } catch (e: any) {
      setError(e?.response?.data?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function resetPassword(row: Row) {
    setSavingId(row.id);
    try {
      await api.post(`/api/v1/admin/users/${row.id}/reset-password`);
      alert("Temporary password issued.");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Reset failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-lg sm:text-xl font-semibold">Directory</h1>
        <div className="flex items-stretch gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded p-2 text-sm w-full sm:w-44"
          >
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="AGENT">Agents</option>
            <option value="ADMIN">Admins</option>
          </select>
          <button onClick={load} className="border rounded px-3 py-2 text-sm">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      {/* Desktop/tablet table */}
      <div className="hidden md:block overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No users
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-48"
                      defaultValue={r.name}
                      onBlur={(e) => save(r, { name: e.target.value })}
                    />
                  </td>
                  <td className="p-2 break-words">{r.email}</td>
                  <td className="p-2">
                    <input
                      className="border rounded p-1 w-40"
                      defaultValue={r.phone || ""}
                      onBlur={(e) => save(r, { phone: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      defaultValue={r.role}
                      className="border rounded p-1"
                      onChange={(e) => save(r, { role: e.target.value as Role })}
                    >
                      <option>USER</option>
                      <option>AGENT</option>
                      <option>ADMIN</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      defaultChecked={r.active}
                      onChange={(e) => save(r, { active: e.target.checked })}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      disabled={savingId === r.id}
                      onClick={() => resetPassword(r)}
                      className="px-3 py-1.5 rounded border"
                    >
                      {savingId === r.id ? "…" : "Reset Password"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden rounded border divide-y">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No users</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="p-3 sm:p-4 bg-white/5">
              <div className="grid gap-3">
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Email</div>
                  <div className="text-sm break-words">{r.email}</div>
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-1">Name</div>
                  <input
                    className="border rounded px-2 py-2 w-full"
                    defaultValue={r.name}
                    onBlur={(e) => save(r, { name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Role</div>
                    <select
                      defaultValue={r.role}
                      className="border rounded px-2 py-2 w-full"
                      onChange={(e) => save(r, { role: e.target.value as Role })}
                    >
                      <option>USER</option>
                      <option>AGENT</option>
                      <option>ADMIN</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      defaultChecked={r.active}
                      onChange={(e) => save(r, { active: e.target.checked })}
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-1">Phone</div>
                  <input
                    className="border rounded px-2 py-2 w-full"
                    defaultValue={r.phone || ""}
                    onBlur={(e) => save(r, { phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  disabled={savingId === r.id}
                  onClick={() => resetPassword(r)}
                  className="w-full px-3 py-2 rounded border"
                >
                  {savingId === r.id ? "…" : "Reset Password"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
