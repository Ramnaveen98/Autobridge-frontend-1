// src/pages/Vehicles.tsx
import { useEffect, useState } from "react";
import { getJSON, API_BASE } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

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
  "/api/v1/vehicles/public",
  "/api/v1/public/vehicles",
];

function resolveImg(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return u;
}

function normalizeList(data: any): Vehicle[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export default function Vehicles() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();
  const nav = useNavigate();

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
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    setLoading(false);
    if (lastErr) {
      const st = lastErr?.response?.status ?? "?";
      const msg =
        lastErr?.response?.data?.message ??
        lastErr?.message ??
        "Failed to load vehicles";
      setError(`(${st}) ${msg}`);
      console.error("Public vehicles failed", lastErr);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("autobridge:inventory:changed", onChange);
    return () =>
      window.removeEventListener("autobridge:inventory:changed", onChange);
  }, []);

  if (loading)
    return <div className="px-6 py-8 text-slate-400">Loading vehicles…</div>;
  if (error)
    return <div className="px-6 py-8 text-red-400">{error}</div>;
  if (!rows.length)
    return (
      <div className="px-6 py-8 text-slate-400">
        No cars available right now.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center md:text-left">
          Explore Our Vehicles
        </h1>

        <div className="grid gap-y-16 sm:grid-cols-2 lg:grid-cols-3 place-items-center">
          {rows.map((v) => (
            <div
              key={v.id}
              className="group flex flex-col items-center text-center transition-transform duration-500 hover:-translate-y-2"
            >
              {/* car image */}
              <div className="relative w-80 h-48 sm:w-72 sm:h-44 md:w-80 md:h-48 overflow-visible">
                {v.imageUrl ? (
                  <div className="relative">
                    <img
                      src={resolveImg(v.imageUrl)}
                      alt={v.title}
                      className="w-full h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-110 group-hover:brightness-110 drop-shadow-[0_15px_20px_rgba(0,0,0,0.35)] animate-none group-hover:animate-shine"
                      style={{
                        WebkitMaskImage:
                          "linear-gradient(to bottom, black 90%, transparent)",
                        maskImage:
                          "linear-gradient(to bottom, black 90%, transparent)",
                      }}
                    />
                    {/* shimmer blink effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/60 to-transparent blur-sm animate-shimmer" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>

              {/* info */}
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {v.title}
                </h2>
                <div className="text-sm text-slate-400 mt-1">
                  {v.brand}
                  {v.year ? ` • ${v.year}` : ""}
                </div>
                {typeof v.price === "number" && (
                  <div className="text-blue-400 mt-1 font-medium">
                    ${v.price.toLocaleString()}
                  </div>
                )}
              </div>

              {/* test drive */}
              <button
                className="mt-5 px-6 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition"
                onClick={() => {
                  if (!token) {
                    // not logged in → go to login, then back to test drive
                    const next = `/services?select=TEST-DRIVE&vehicleId=${v.id}`;
                    const qs = new URLSearchParams({ next });
                    nav(`/login?${qs.toString()}`);
                  } else {
                    // logged in → open test drive directly in Services
                    nav(`/services?select=TEST-DRIVE&vehicleId=${v.id}`);
                  }
                }}
              >
                Test Drive
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Extra animations --- */
const styles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
@keyframes shine {
  0%, 90%, 100% { filter: brightness(1); }
  95% { filter: brightness(1.4); }
}
.animate-shimmer {
  animation: shimmer 1.5s ease-in-out;
}
.animate-shine {
  animation: shine 1.5s ease-in-out;
}
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("vehicle-anim-styles")
) {
  const styleTag = document.createElement("style");
  styleTag.id = "vehicle-anim-styles";
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}








/*
//working code
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

// Accepts either an array or a Page object with .content
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

*/