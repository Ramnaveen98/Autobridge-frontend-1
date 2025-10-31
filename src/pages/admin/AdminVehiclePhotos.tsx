// src/pages/admin/AdminVehiclePhotos.tsx
import { useEffect, useMemo, useState } from "react";
import { api, getJSON, API_BASE } from "@/services/client";

/* ===== Types ===== */

type Vehicle = {
  id: number;
  vin?: string | null;
  title: string;
  brand: string;
  model?: string | null;
  color?: string | null;
  year: number | null;
  price: number | null;
  status?: string | null;          // "AVAILABLE" | "PENDING" | "RESERVED" | "SOLD" (etc.)
  imageUrl?: string | null;        // server may send imageUrl or image_url
  description?: string | null;
};

type Upsert = Partial<Vehicle> & {
  // aliases the backend accepts
  name?: string;
  make?: string;
};

type Toast = { id: number; kind: "ok" | "err"; text: string };

/* Reasonable defaults for your enum */
const STATUS_OPTS = ["AVAILABLE", "PENDING", "RESERVED", "SOLD"];

export default function AdminVehiclePhotos() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // create form (no image url here; upload after create)
  const [draftNew, setDraftNew] = useState<Upsert>({
    vin: "",
    title: "",
    brand: "",
    model: "",
    color: "",
    year: null,
    price: null,
    status: "",
    description: "",
  });
  const canCreate = useMemo(
    () => !!(draftNew.title && draftNew.brand),
    [draftNew]
  );

  // per-row edits
  const [edit, setEdit] = useState<Record<number, Upsert>>({});
  const [busy, setBusy] = useState<number | "CREATE" | null>(null);

  // toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const raw = await getJSON<any[]>("/api/v1/admin/vehicles");
      const data: Vehicle[] = (Array.isArray(raw) ? raw : []).map((r) => ({
        id: r.id,
        vin: r.vin ?? "",
        title: r.title,
        brand: r.brand,
        model: r.model ?? "",
        color: r.color ?? "",
        year: r.year ?? null,
        price: r.price ?? null,
        status: r.status ?? null,
        imageUrl: r.imageUrl ?? r.image_url ?? null, // backend may use either
        description: r.description ?? "",
      }));
      data.sort((a, b) => b.id - a.id);
      setRows(data);
    } catch (e: any) {
      setErr("Failed to load vehicles: " + explain(e));
    } finally {
      setLoading(false);
    }
  }

  /* ===== Utils ===== */

  function explain(e: any) {
    const st = e?.response?.status;
    const msg =
      e?.response?.data?.message || e?.response?.data || e?.message || "Unknown error";
    return `(${st ?? "?"}) ${String(msg)}`.slice(0, 300);
  }
  function toast(kind: Toast["kind"], text: string) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }
  function setEditField(id: number, patch: Partial<Upsert>) {
    setEdit((s) => ({ ...s, [id]: { ...(s[id] ?? {}), ...patch } }));
  }
  function numOrNull(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function keep<T>(v: T | undefined, fb: T): T {
    return v === undefined || (typeof v === "string" && v.trim() === "") ? fb : v;
  }
  function resolveImg(u?: string | null) {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    return u;
  }
  function fileNameFromUrl(u?: string | null) {
    if (!u) return "";
    const q = u.split("?")[0];
    const parts = q.split("/");
    return parts[parts.length - 1] || "";
  }
  function notifyInventoryChanged() {
    window.dispatchEvent(new CustomEvent("autobridge:inventory:changed"));
  }

  /* ===== CRUD ===== */

  async function create() {
    if (!canCreate) return;
    setBusy("CREATE");
    try {
      const payload: Upsert = {
        vin: draftNew.vin?.trim(),
        title: draftNew.title?.trim(),
        name: draftNew.title?.trim(),
        brand: draftNew.brand?.trim(),
        make: draftNew.brand?.trim(),
        model: draftNew.model?.trim(),
        color: draftNew.color?.trim(),
        year: draftNew.year ?? null,
        price: draftNew.price ?? null,
        status: draftNew.status?.trim() || undefined,
        description: draftNew.description?.trim() || undefined,
      };
      await api.post("/api/v1/admin/vehicles", payload);
      setDraftNew({
        vin: "",
        title: "",
        brand: "",
        model: "",
        color: "",
        year: null,
        price: null,
        status: "",
        description: "",
      });
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
        vin: d.vin !== undefined ? d.vin : v.vin,
        title: keep(d.title, v.title),
        name: keep(d.title, v.title),
        brand: keep(d.brand, v.brand),
        make: keep(d.brand, v.brand),
        model: d.model !== undefined ? d.model : v.model,
        color: d.color !== undefined ? d.color : v.color,
        year: d.year ?? v.year ?? null,
        price: d.price ?? v.price ?? null,
        status: d.status !== undefined ? d.status : v.status,
        description: d.description !== undefined ? d.description : v.description,
        // imageUrl is managed by upload; no manual edits here
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

  async function uploadImage(v: Vehicle, file: File) {
    setBusy(v.id);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/api/v1/admin/vehicles/${v.id}/image-upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();            // server already saved image_url; refresh to show it
      toast("ok", "Image uploaded");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Upload failed: " + explain(e));
    } finally {
      setBusy(null);
    }
  }

  /* ===== UI ===== */

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* toasts */}
      <div className="fixed right-3 sm:right-4 top-16 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-3 py-2 rounded-lg shadow ${t.kind === "ok" ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center sm:text-left">
        Manage Vehicles
      </h1>

      {/* create */}
      <section className="rounded-2xl p-4 sm:p-6 border border-slate-800 bg-slate-900/60 mb-6 sm:mb-8">
        <h2 className="text-lg font-medium mb-3 sm:mb-4">Add New Car</h2>

        {/* 1-col mobile, 2-col tablet, 6-col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
          <input
            placeholder="VIN"
            value={draftNew.vin ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, vin: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <input
            placeholder="Title (e.g., Honda Model 14)"
            value={draftNew.title ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, title: e.target.value }))}
            className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <input
            placeholder="Brand (e.g., Honda)"
            value={draftNew.brand ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, brand: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <input
            placeholder="Model"
            value={draftNew.model ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, model: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <input
            placeholder="Color"
            value={draftNew.color ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, color: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />

          <input
            placeholder="Year (e.g., 2025)"
            value={draftNew.year ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, year: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <input
            placeholder="Price (e.g., 31000)"
            value={draftNew.price ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, price: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          />
          <select
            value={draftNew.status ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, status: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
          >
            <option value="">— Status —</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <textarea
            placeholder="Description (optional)"
            value={draftNew.description ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, description: e.target.value }))}
            className="md:col-span-6 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[70px] w-full"
          />
        </div>

        <div className="mt-3 sm:mt-4">
          <button
            disabled={!canCreate || busy === "CREATE"}
            onClick={create}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60 hover:opacity-95"
          >
            {busy === "CREATE" ? "Adding…" : "Add Car"}
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Tip: After creating the car, use “Choose File” on that row to upload a photo. The server will
          store the file and automatically update <code>image_url</code>.
        </p>
      </section>

      {err && <div className="text-red-400 mb-3">{err}</div>}
      {loading && <div className="opacity-80">Loading…</div>}

      {/* cards: 1 col on mobile, 2 on md, 3 on xl, 4 on 2xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
        {rows.map((v) => {
          const d = edit[v.id] ?? {};
          const img = resolveImg(v.imageUrl);
          const fname = fileNameFromUrl(v.imageUrl);

          return (
            <div
              key={v.id}
              className="h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image on top for a clean, consistent card */}
              <div className="w-full aspect-[16/9] md:aspect-[3/2] bg-black/30">
                {v.imageUrl ? (
                  <img
                    className="w-full h-full object-cover"
                    src={img}
                    alt={v.title}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.25"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                {/* Inputs grid: 1-col on mobile, 2-col on >=sm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <input
                    defaultValue={v.vin ?? ""}
                    onChange={(e) => setEditField(v.id, { vin: e.target.value })}
                    placeholder="VIN"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />
                  <input
                    defaultValue={v.title}
                    onChange={(e) => setEditField(v.id, { title: e.target.value })}
                    placeholder="Title"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />

                  <input
                    defaultValue={v.brand}
                    onChange={(e) => setEditField(v.id, { brand: e.target.value })}
                    placeholder="Brand"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />
                  <input
                    defaultValue={v.model ?? ""}
                    onChange={(e) => setEditField(v.id, { model: e.target.value })}
                    placeholder="Model"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />

                  <input
                    defaultValue={v.color ?? ""}
                    onChange={(e) => setEditField(v.id, { color: e.target.value })}
                    placeholder="Color"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />
                  <input
                    defaultValue={v.year ?? undefined}
                    onChange={(e) => setEditField(v.id, { year: numOrNull(e.target.value) })}
                    placeholder="Year"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />

                  <input
                    defaultValue={v.price ?? undefined}
                    onChange={(e) => setEditField(v.id, { price: numOrNull(e.target.value) })}
                    placeholder="Price"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  />
                  <select
                    defaultValue={v.status ?? ""}
                    onChange={(e) => setEditField(v.id, { status: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 w-full"
                  >
                    <option value="">— Status —</option>
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {/* read-only image url info */}
                  <div className="sm:col-span-2 text-xs text-slate-400 space-y-1.5">
                    {v.imageUrl ? (
                      <>
                        <div className="break-words">
                          URL:{" "}
                          <a className="underline break-all" href={img} target="_blank" rel="noreferrer">
                            {v.imageUrl}
                          </a>
                        </div>
                        <div>
                          Stored file: <span className="font-mono">{fname}</span>
                        </div>
                      </>
                    ) : (
                      <div>URL: —</div>
                    )}
                  </div>

                  {/* file upload */}
                  <div className="sm:col-span-2">
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

                  {/* description */}
                  <textarea
                    defaultValue={v.description ?? ""}
                    onChange={(e) => setEditField(v.id, { description: e.target.value })}
                    placeholder="Description"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[70px] w-full"
                  />
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    disabled={busy === v.id}
                    onClick={() => save(v)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-blue-600 text-white text-sm hover:opacity-95 disabled:opacity-60"
                  >
                    {busy === v.id ? "Saving…" : "Save"}
                  </button>
                  <button
                    disabled={busy === v.id}
                    onClick={() => remove(v)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-red-600 text-white text-sm hover:opacity-95 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}






/*

// src/pages/admin/AdminVehiclePhotos.tsx
import { useEffect, useMemo, useState } from "react";
import { api, getJSON, API_BASE } from "@/services/client";



type Vehicle = {
  id: number;
  vin?: string | null;
  title: string;
  brand: string;
  model?: string | null;
  color?: string | null;
  year: number | null;
  price: number | null;
  status?: string | null;          // "AVAILABLE" | "PENDING" | "RESERVED" | "SOLD" (etc.)
  imageUrl?: string | null;        // server may send imageUrl or image_url
  description?: string | null;
};

type Upsert = Partial<Vehicle> & {
  // aliases the backend accepts
  name?: string;
  make?: string;
};

type Toast = { id: number; kind: "ok" | "err"; text: string };


const STATUS_OPTS = ["AVAILABLE", "PENDING", "RESERVED", "SOLD"];

export default function AdminVehiclePhotos() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // create form (no image url here; upload after create)
  const [draftNew, setDraftNew] = useState<Upsert>({
    vin: "",
    title: "",
    brand: "",
    model: "",
    color: "",
    year: null,
    price: null,
    status: "",
    description: "",
  });
  const canCreate = useMemo(
    () => !!(draftNew.title && draftNew.brand),
    [draftNew]
  );

  // per-row edits
  const [edit, setEdit] = useState<Record<number, Upsert>>({});
  const [busy, setBusy] = useState<number | "CREATE" | null>(null);

  // toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const raw = await getJSON<any[]>("/api/v1/admin/vehicles");
      const data: Vehicle[] = (Array.isArray(raw) ? raw : []).map((r) => ({
        id: r.id,
        vin: r.vin ?? "",
        title: r.title,
        brand: r.brand,
        model: r.model ?? "",
        color: r.color ?? "",
        year: r.year ?? null,
        price: r.price ?? null,
        status: r.status ?? null,
        imageUrl: r.imageUrl ?? r.image_url ?? null, // backend may use either
        description: r.description ?? "",
      }));
      data.sort((a, b) => b.id - a.id);
      setRows(data);
    } catch (e: any) {
      setErr("Failed to load vehicles: " + explain(e));
    } finally {
      setLoading(false);
    }
  }

 

  function explain(e: any) {
    const st = e?.response?.status;
    const msg =
      e?.response?.data?.message || e?.response?.data || e?.message || "Unknown error";
    return `(${st ?? "?"}) ${String(msg)}`.slice(0, 300);
  }
  function toast(kind: Toast["kind"], text: string) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }
  function setEditField(id: number, patch: Partial<Upsert>) {
    setEdit((s) => ({ ...s, [id]: { ...(s[id] ?? {}), ...patch } }));
  }
  function numOrNull(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function keep<T>(v: T | undefined, fb: T): T {
    return v === undefined || (typeof v === "string" && v.trim() === "") ? fb : v;
  }
  function resolveImg(u?: string | null) {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    return u;
  }
  function fileNameFromUrl(u?: string | null) {
    if (!u) return "";
    const q = u.split("?")[0];
    const parts = q.split("/");
    return parts[parts.length - 1] || "";
  }
  function notifyInventoryChanged() {
    window.dispatchEvent(new CustomEvent("autobridge:inventory:changed"));
  }

 

  async function create() {
    if (!canCreate) return;
    setBusy("CREATE");
    try {
      const payload: Upsert = {
        vin: draftNew.vin?.trim(),
        title: draftNew.title?.trim(),
        name: draftNew.title?.trim(),
        brand: draftNew.brand?.trim(),
        make: draftNew.brand?.trim(),
        model: draftNew.model?.trim(),
        color: draftNew.color?.trim(),
        year: draftNew.year ?? null,
        price: draftNew.price ?? null,
        status: draftNew.status?.trim() || undefined,
        description: draftNew.description?.trim() || undefined,
      };
      await api.post("/api/v1/admin/vehicles", payload);
      setDraftNew({
        vin: "",
        title: "",
        brand: "",
        model: "",
        color: "",
        year: null,
        price: null,
        status: "",
        description: "",
      });
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
        vin: d.vin !== undefined ? d.vin : v.vin,
        title: keep(d.title, v.title),
        name: keep(d.title, v.title),
        brand: keep(d.brand, v.brand),
        make: keep(d.brand, v.brand),
        model: d.model !== undefined ? d.model : v.model,
        color: d.color !== undefined ? d.color : v.color,
        year: d.year ?? v.year ?? null,
        price: d.price ?? v.price ?? null,
        status: d.status !== undefined ? d.status : v.status,
        description: d.description !== undefined ? d.description : v.description,
        // imageUrl is managed by upload; no manual edits here
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

  async function uploadImage(v: Vehicle, file: File) {
    setBusy(v.id);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/api/v1/admin/vehicles/${v.id}/image-upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();            // server already saved image_url; refresh to show it
      toast("ok", "Image uploaded");
      notifyInventoryChanged();
    } catch (e: any) {
      toast("err", "Upload failed: " + explain(e));
    } finally {
      setBusy(null);
    }
  }

 

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      //{}
      <div className="fixed right-4 top-16 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-3 py-2 rounded-lg shadow ${t.kind === "ok" ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-semibold mb-6">Manage Vehicles</h1>

     // {}
      <section className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60 mb-8">
        <h2 className="text-lg font-medium mb-3">Add New Car</h2>
        <div className="grid md:grid-cols-6 gap-3">
          <input
            placeholder="VIN"
            value={draftNew.vin ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, vin: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Title (e.g., Honda Model 14)"
            value={draftNew.title ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, title: e.target.value }))}
            className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Brand (e.g., Honda)"
            value={draftNew.brand ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, brand: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Model"
            value={draftNew.model ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, model: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Color"
            value={draftNew.color ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, color: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />

          <input
            placeholder="Year (e.g., 2025)"
            value={draftNew.year ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, year: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <input
            placeholder="Price (e.g., 31000)"
            value={draftNew.price ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, price: numOrNull(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          />
          <select
            value={draftNew.status ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, status: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
          >
            <option value="">— Status —</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <textarea
            placeholder="Description (optional)"
            value={draftNew.description ?? ""}
            onChange={(e) => setDraftNew((s) => ({ ...s, description: e.target.value }))}
            className="md:col-span-6 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[70px]"
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
          Tip: After creating the car, use “Choose File” on that row to upload a photo. The server will
          store the file and automatically update <code>image_url</code>.
        </p>
      </section>

      {err && <div className="text-red-400 mb-3">{err}</div>}
      {loading && <div className="opacity-80">Loading…</div>}

     // {}
      <div className="grid md:grid-cols-2 gap-6">
        {rows.map((v) => {
          const d = edit[v.id] ?? {};
          const img = resolveImg(v.imageUrl);
          const fname = fileNameFromUrl(v.imageUrl);

          return (
            <div key={v.id} className="rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex gap-4">
                <div className="w-48 aspect-video overflow-hidden rounded-xl border bg-black/30">
                  {v.imageUrl ? (
                    <img
                      className="w-full h-full object-cover"
                      src={img}
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
                      defaultValue={v.vin ?? ""}
                      onChange={(e) => setEditField(v.id, { vin: e.target.value })}
                      placeholder="VIN"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.title}
                      onChange={(e) => setEditField(v.id, { title: e.target.value })}
                      placeholder="Title"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />

                    <input
                      defaultValue={v.brand}
                      onChange={(e) => setEditField(v.id, { brand: e.target.value })}
                      placeholder="Brand"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.model ?? ""}
                      onChange={(e) => setEditField(v.id, { model: e.target.value })}
                      placeholder="Model"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />

                    <input
                      defaultValue={v.color ?? ""}
                      onChange={(e) => setEditField(v.id, { color: e.target.value })}
                      placeholder="Color"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <input
                      defaultValue={v.year ?? undefined}
                      onChange={(e) => setEditField(v.id, { year: numOrNull(e.target.value) })}
                      placeholder="Year"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />

                    <input
                      defaultValue={v.price ?? undefined}
                      onChange={(e) => setEditField(v.id, { price: numOrNull(e.target.value) })}
                      placeholder="Price"
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    />
                    <select
                      defaultValue={v.status ?? ""}
                      onChange={(e) => setEditField(v.id, { status: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700"
                    >
                      <option value="">— Status —</option>
                      {STATUS_OPTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    //{}
                    <div className="col-span-2 text-xs text-slate-400">
                      {v.imageUrl ? (
                        <>
                          <div>URL: <a className="underline" href={img} target="_blank" rel="noreferrer">{v.imageUrl}</a></div>
                          <div>Stored file: <span className="font-mono">{fname}</span></div>
                        </>
                      ) : (
                        <div>URL: —</div>
                      )}
                    </div>

                    //{}
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

                   // {}
                    <textarea
                      defaultValue={v.description ?? ""}
                      onChange={(e) => setEditField(v.id, { description: e.target.value })}
                      placeholder="Description"
                      className="col-span-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[70px]"
                    />
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


*/