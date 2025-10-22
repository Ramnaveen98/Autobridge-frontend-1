/*
import { useEffect, useMemo, useState } from "react";
import { api, getJSON } from "@/services/client";

type Vehicle = {
  id: number;
  title: string;
  brand: string;
  price: number | null;
  year?: number | null;
  imageUrl?: string | null;
};

type UpsertReq = {
  id?: number;
  title?: string;
  brand?: string;
  price?: number | null;
  year?: number | null;
  imageUrl?: string | null;

  // fallbacks, in case backend maps these to legacy fields
  name?: string;
  make?: string;
  model?: string;
};

export default function AdminVehiclePhotos() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form to add a new car
  const [newCar, setNewCar] = useState<UpsertReq>({
    title: "", brand: "", price: null, year: null, imageUrl: ""
  });

  // per-row edit state
  const [edit, setEdit] = useState<Record<number, UpsertReq>>({});
  const [busyId, setBusyId] = useState<number | "CREATE" | null>(null);

  const canCreate = useMemo(() => {
    return !!(newCar.title && newCar.brand);
  }, [newCar]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr(null);
    try {
      // Admin list endpoint
      const data = await getJSON<Vehicle[]>("/api/v1/admin/vehicles");
      setRows(data);
    } catch (e) {
      setErr("Failed to load vehicles. Ensure you are logged in as ADMIN.");
    } finally {
      setLoading(false);
    }
  }

  function setEditField(id: number, patch: Partial<UpsertReq>) {
    setEdit((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  }

  async function createCar() {
    if (!canCreate) return;
    setBusyId("CREATE");
    try {
      const payload: UpsertReq = {
        title: newCar.title?.trim(),
        brand: newCar.brand?.trim(),
        price: numberOrNull(newCar.price),
        year: numberOrNull(newCar.year),
        imageUrl: newCar.imageUrl?.trim() || undefined,
        // fallbacks to help backend map
        name: newCar.title?.trim(),
        make: newCar.brand?.trim(),
      };
      await api.post("/api/v1/admin/vehicles", payload);
      setNewCar({ title: "", brand: "", price: null, year: null, imageUrl: "" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function saveRow(v: Vehicle) {
    setBusyId(v.id);
    try {
      const draft = edit[v.id] ?? {};
      const payload: UpsertReq = {
        id: v.id,
        title: val(draft.title, v.title),
        brand: val(draft.brand, v.brand),
        price: draft.price ?? v.price ?? null,
        year: draft.year ?? v.year ?? null,
        imageUrl: val(draft.imageUrl, v.imageUrl || ""),
        name: val(draft.title, v.title),
        make: val(draft.brand, v.brand),
      };
      await api.put(`/api/v1/admin/vehicles/${v.id}`, payload);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRow(v: Vehicle) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setBusyId(v.id);
    try {
      await api.delete(`/api/v1/admin/vehicles/${v.id}`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function setImageUrl(v: Vehicle, url: string) {
    setBusyId(v.id);
    try {
      await api.put(`/api/v1/admin/vehicles/${v.id}/image`, { imageUrl: url });
      await load();
    } finally { setBusyId(null); }
  }

  async function uploadImage(v: Vehicle, file: File) {
    setBusyId(v.id);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/api/v1/admin/vehicles/${v.id}/image-upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Manage Vehicles</h1>

      
      <section className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60 mb-8">
        <h2 className="text-lg font-medium mb-3">Add New Car</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <input
            placeholder="Title (e.g., Toyota Camry)"
            value={newCar.title ?? ""}
            onChange={e => setNewCar(s => ({ ...s, title: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Brand (e.g., Toyota)"
            value={newCar.brand ?? ""}
            onChange={e => setNewCar(s => ({ ...s, brand: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Price (e.g., 21990)"
            value={newCar.price ?? ""}
            onChange={e => setNewCar(s => ({ ...s, price: num(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Year (e.g., 2022)"
            value={newCar.year ?? ""}
            onChange={e => setNewCar(s => ({ ...s, year: num(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Image URL (optional)"
            value={newCar.imageUrl ?? ""}
            onChange={e => setNewCar(s => ({ ...s, imageUrl: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
        </div>
        <div className="mt-3">
          <button
            disabled={!canCreate || busyId === "CREATE"}
            onClick={createCar}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
          >
            {busyId === "CREATE" ? "Adding…" : "Add Car"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Tip: Add the car first, then use “Choose File” on that row to upload a photo.
        </p>
      </section>

      {err && <div className="text-red-400 mb-3">{err}</div>}
      {loading && <div className="opacity-80">Loading…</div>}

      
      <div className="grid md:grid-cols-2 gap-6">
        {rows.map(v => {
          const d = edit[v.id] ?? {};
          return (
            <div key={v.id} className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex gap-4">
                <div className="w-48 aspect-video overflow-hidden rounded-xl border bg-black/30">
                  {v.imageUrl ? (
                    <img className="w-full h-full object-cover" src={v.imageUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      defaultValue={v.title}
                      onChange={e => setEditField(v.id, { title: e.target.value })}
                      placeholder="Title"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 col-span-2"
                    />
                    <input
                      defaultValue={v.brand}
                      onChange={e => setEditField(v.id, { brand: e.target.value })}
                      placeholder="Brand"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.price ?? undefined}
                      onChange={e => setEditField(v.id, { price: num(e.target.value) })}
                      placeholder="Price"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.year ?? undefined}
                      onChange={e => setEditField(v.id, { year: num(e.target.value) })}
                      placeholder="Year"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <div className="col-span-2 flex gap-2">
                      <input
                        defaultValue={v.imageUrl ?? ""}
                        onChange={e => setEditField(v.id, { imageUrl: e.target.value })}
                        placeholder="Image URL"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                      />
                      <button
                        disabled={busyId === v.id}
                        onClick={() => setImageUrl(v, d.imageUrl ?? v.imageUrl ?? "")}
                        className="px-3 py-2 rounded-xl bg-slate-800"
                      >
                        Save URL
                      </button>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(v, file);
                        }}
                        className="block w-full text-sm text-slate-300
                                   file:mr-4 file:py-2 file:px-3
                                   file:rounded-xl file:border-0
                                   file:bg-blue-600 file:text-white
                                   hover:file:opacity-90"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busyId === v.id}
                      onClick={() => saveRow(v)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm"
                    >
                      {busyId === v.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      disabled={busyId === v.id}
                      onClick={() => deleteRow(v)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function num(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function val<T>(v: T | undefined, fallback: T): T {
  return (v === undefined || (typeof v === "string" && v.trim() === "")) ? fallback : v;
}
function numberOrNull(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
*/


// src/pages/admin/AdminVehiclePhotos.tsx
import { useEffect, useMemo, useState } from "react";
import { api, getJSON, API_BASE } from "@/services/client";

type Vehicle = {
  id: number;
  title: string;
  brand: string;
  year: number | null;
  price: number | null;
  imageUrl?: string | null;
  // backend also returns extra fields (vin, model, etc.) which we ignore here
};

type Upsert = {
  id?: number;
  title?: string;
  brand?: string;
  year?: number | null;
  price?: number | null;
  imageUrl?: string | null;
  // aliases to be safe with any legacy mapping
  name?: string;
  make?: string;
};

type Toast = { id: number; kind: "ok" | "err"; text: string };

export default function AdminVehiclePhotos() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [draftNew, setDraftNew] = useState<Upsert>({ title: "", brand: "", year: null, price: null, imageUrl: "" });
  const canCreate = useMemo(() => !!(draftNew.title && draftNew.brand), [draftNew]);

  // per-row edits
  const [edit, setEdit] = useState<Record<number, Upsert>>({});
  const [busy, setBusy] = useState<number | "CREATE" | null>(null);

  // toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setErr(null); setLoading(true);
    try {
      const data = await getJSON<Vehicle[]>("/api/v1/admin/vehicles");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr("Failed to load vehicles: " + explain(e));
    } finally {
      setLoading(false);
    }
  }

  function explain(e: any) {
    const st = e?.response?.status;
    const msg = e?.response?.data?.message || e?.response?.data || e?.message || "Unknown error";
    return `(${st ?? "?"}) ${String(msg)}`.slice(0, 300);
  }
  function toast(kind: Toast["kind"], text: string) {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }
  function setEditField(id: number, patch: Partial<Upsert>) {
    setEdit(s => ({ ...s, [id]: { ...(s[id] ?? {}), ...patch } }));
  }
  function numOrNull(v: string) { const n = Number(v); return Number.isFinite(n) ? n : null; }
  function keep<T>(v: T | undefined, fb: T): T { return v === undefined || (typeof v === "string" && v.trim() === "") ? fb : v; }
  function normalizeUrl(u?: string | null) {
    const s = (u ?? "").trim();
    if (!s) return undefined;
    if (s.startsWith("/uploads/")) return s;
    if (/^https?:\/\//i.test(s)) return `/api/v1/public/image-proxy?url=${encodeURIComponent(s)}`;
    return s;
  }
  function notifyInventoryChanged() {
    window.dispatchEvent(new CustomEvent("autobridge:inventory:changed"));
  }

  /* -------------------- create / update / delete -------------------- */

  async function create() {
    if (!canCreate) return;
    setBusy("CREATE");
    try {
      const payload: Upsert = {
        title: draftNew.title?.trim(), name: draftNew.title?.trim(),
        brand: draftNew.brand?.trim(), make: draftNew.brand?.trim(),
        year: draftNew.year ?? null,
        price: draftNew.price ?? null,
        imageUrl: normalizeUrl(draftNew.imageUrl),
      };
      await api.post("/api/v1/admin/vehicles", payload);
      setDraftNew({ title: "", brand: "", year: null, price: null, imageUrl: "" });
      await load();
      toast("ok", "Car added");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Create failed: " + explain(e));
    } finally {
      setBusy(null);
    }
  }

  async function save(v: Vehicle) {
    setBusy(v.id);
    try {
      const d = edit[v.id] ?? {};
      const payload: Upsert = {
        id: v.id,
        title: keep(d.title, v.title), name: keep(d.title, v.title),
        brand: keep(d.brand, v.brand), make: keep(d.brand, v.brand),
        year: d.year ?? v.year ?? null,
        price: d.price ?? v.price ?? null,
        imageUrl: normalizeUrl(keep(d.imageUrl, v.imageUrl ?? "")),
      };
      await api.put(`/api/v1/admin/vehicles/${v.id}`, payload);
      await load();
      toast("ok", "Saved");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Save failed: " + explain(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove(v: Vehicle) {
    if (!confirm(`Delete "${v.title}"?`)) return;
    setBusy(v.id);
    try {
      await api.delete(`/api/v1/admin/vehicles/${v.id}`);
      await load();
      toast("ok", "Deleted");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Delete failed: " + explain(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveImageUrl(v: Vehicle, url: string) {
    setBusy(v.id);
    try {
      const finalUrl = normalizeUrl(url) ?? "";
      await api.put(`/api/v1/admin/vehicles/${v.id}/image`, { imageUrl: finalUrl });
      await load();
      toast("ok", "Image URL saved");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Save URL failed: " + explain(e));
    } finally { setBusy(null); }
  }

  async function uploadImage(v: Vehicle, file: File) {
    setBusy(v.id);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/api/v1/admin/vehicles/${v.id}/image-upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      toast("ok", "Image uploaded");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Upload failed: " + explain(e));
    } finally { setBusy(null); }
  }
        function resolveImg(u?: string | null) 
        {
        if (!u) return "";
        if (/^https?:\/\//i.test(u)) return u;        // already absolute
        if (u.startsWith("/")) return `${API_BASE}${u}`; // make absolute to backend
        return u; // anything else
        }


  /* -------------------- UI -------------------- */

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* toasts */}
      <div className="fixed right-4 top-16 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded-lg shadow ${t.kind==="ok"?"bg-green-600":"bg-red-600"} text-white`}>
            {t.text}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-semibold mb-6">Manage Vehicles</h1>

      {/* create */}
      <section className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60 mb-8">
        <h2 className="text-lg font-medium mb-3">Add New Car</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <input
            placeholder="Title (e.g., Toyota Camry)"
            value={draftNew.title ?? ""}
            onChange={e => setDraftNew(s => ({ ...s, title: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Brand (e.g., Toyota)"
            value={draftNew.brand ?? ""}
            onChange={e => setDraftNew(s => ({ ...s, brand: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Price (e.g., 21990)"
            value={draftNew.price ?? ""}
            onChange={e => setDraftNew(s => ({ ...s, price: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Year (e.g., 2024)"
            value={draftNew.year ?? ""}
            onChange={e => setDraftNew(s => ({ ...s, year: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Image URL (optional)"
            value={draftNew.imageUrl ?? ""}
            onChange={e => setDraftNew(s => ({ ...s, imageUrl: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
        </div>
        <div className="mt-3">
          <button
            disabled={!canCreate || busy === "CREATE"}
            onClick={create}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
          >
            {busy === "CREATE" ? "Adding…" : "Add Car"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Tip: You can either paste an external image URL and click “Save URL”, or upload a file with “Choose File”.
        </p>
      </section>

      {err && <div className="text-red-400 mb-3">{err}</div>}
      {loading && <div className="opacity-80">Loading…</div>}

      {/* cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {rows.map(v => {
          const d = edit[v.id] ?? {};
          return (
            <div key={v.id} className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex gap-4">
                <div className="w-48 aspect-video overflow-hidden rounded-xl border bg-black/30">
                  {v.imageUrl ? (
                    <img
                        className="w-full h-full object-cover"
                        src={resolveImg(v.imageUrl)}
                        alt={v.title}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.25"; }}
                        />

                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      defaultValue={v.title}
                      onChange={e => setEditField(v.id, { title: e.target.value })}
                      placeholder="Title"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 col-span-2"
                    />
                    <input
                      defaultValue={v.brand}
                      onChange={e => setEditField(v.id, { brand: e.target.value })}
                      placeholder="Brand"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.price ?? undefined}
                      onChange={e => setEditField(v.id, { price: numOrNull(e.target.value) })}
                      placeholder="Price"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.year ?? undefined}
                      onChange={e => setEditField(v.id, { year: numOrNull(e.target.value) })}
                      placeholder="Year"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <div className="col-span-2 flex gap-2">
                      <input
                        defaultValue={v.imageUrl ?? ""}
                        onChange={e => setEditField(v.id, { imageUrl: e.target.value })}
                        placeholder="Image URL"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                      />
                      <button
                        disabled={busy === v.id}
                        onClick={() => saveImageUrl(v, d.imageUrl ?? v.imageUrl ?? "")}
                        className="px-3 py-2 rounded-xl bg-slate-800"
                      >
                        Save URL
                      </button>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(v, file);
                        }}
                        className="block w-full text-sm text-slate-300
                                   file:mr-4 file:py-2 file:px-3
                                   file:rounded-xl file:border-0
                                   file:bg-blue-600 file:text-white
                                   hover:file:opacity-90"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busy === v.id}
                      onClick={() => save(v)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm"
                    >
                      {busy === v.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      disabled={busy === v.id}
                      onClick={() => remove(v)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
