import { useEffect, useState } from "react";
import { getJSON, API_BASE } from "@/services/client";

type Vehicle = {
  id: number;
  title: string;
  brand: string;
  year?: number | null;
  price?: number | null;
  imageUrl?: string | null;
  status?: string | null;
};

const PUBLIC_ENDPOINTS = [
  "/api/v1/vehicles/public",   // returns { content: [...] }
  "/api/v1/public/vehicles",   // returns [...]
];

function resolveImg(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return u;
}

/** Accepts either an array or a Page object with .content */
function normalizeList(data: any): Vehicle[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export default function Vehicles() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    let lastErr: any;
    for (const url of PUBLIC_ENDPOINTS) {
      try {
        const data = await getJSON<any>(url);
        const list = normalizeList(data);
        setRows(list);
        lastErr = null;
        break; // success, stop trying others
      } catch (e) {
        lastErr = e;
      }
    }
    setLoading(false);
    if (lastErr) {
      const st  = lastErr?.response?.status ?? "?";
      const msg = lastErr?.response?.data?.message ?? lastErr?.message ?? "Failed to load vehicles";
      setError(`(${st}) ${msg}`);
      // eslint-disable-next-line no-console
      console.error("Public vehicles failed", lastErr);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("autobridge:inventory:changed", onChange);
    return () => window.removeEventListener("autobridge:inventory:changed", onChange);
  }, []);

  if (loading) return <div className="px-6 py-8 opacity-80">Loading…</div>;
  if (error)   return <div className="px-6 py-8 text-red-400">{error}</div>;
  if (!rows.length) return <div className="px-6 py-8 opacity-80">No cars available right now.</div>;

  return (
    <div className="px-6 py-8 grid md:grid-cols-3 gap-6">
      {rows.map(v => (
        <div key={v.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="aspect-video bg-black/30">
            {v.imageUrl ? (
              <img src={resolveImg(v.imageUrl)} className="w-full h-full object-cover" alt={v.title}/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No image</div>
            )}
          </div>
          <div className="p-4">
            <div className="font-semibold">{v.title}</div>
            <div className="text-sm text-slate-400">
              {v.brand}{v.year ? ` • ${v.year}` : ""}
            </div>
            {typeof v.price === "number" && (
              <div className="mt-1 text-sm">₹ {v.price.toLocaleString()}</div>
            )}
            <button
              className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 text-white"
              onClick={() => {
                const next = `/login?intent=${encodeURIComponent("/book/test-drive?vehicleId="+v.id)}`;
                window.location.href = next;
              }}
            >
              Test Drive
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
