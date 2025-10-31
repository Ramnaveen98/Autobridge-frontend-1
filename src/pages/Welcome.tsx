// src/pages/Welcome.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getJSON, API_BASE } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";

/* ---------- Shared types and helpers ---------- */
type Vehicle = {
  id: number;
  title: string;
  brand: string;
  year?: number | null;
  price?: number | null;
  imageUrl?: string | null;
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

/* ---------- Component ---------- */
export default function Welcome() {
  const nav = useNavigate();
  const { token } = useAuth();

  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    let lastErr: any;
    for (const url of PUBLIC_ENDPOINTS) {
      try {
        const data = await getJSON<any>(url);
        const list = normalizeList(data);
        setRows(list.slice(0, 8)); // ✅ show first 8 for lineup style
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    setLoading(false);
    if (lastErr) {
      const st = lastErr?.response?.status ?? "?";
      const msg = lastErr?.response?.data?.message ?? lastErr?.message ?? "Failed to load vehicles";
      setError(`(${st}) ${msg}`);
      console.error("Welcome public vehicles failed", lastErr);
    }
  }

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("autobridge:inventory:changed", onChange);
    return () => window.removeEventListener("autobridge:inventory:changed", onChange);
  }, []);

  const goTestDrive = (v: Vehicle) => {
    const next = `/services?select=TEST-DRIVE&vehicleId=${v.id}`;
    if (!token) {
      const qs = new URLSearchParams({ next, intent: "test-drive", vehicleId: String(v.id) });
      nav(`/login?${qs.toString()}`);
    } else {
      nav(next);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Welcome to <span className="text-blue-400">Autobridge</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto md:mx-0 text-base md:text-lg">
            Explore the latest cars and book services in one seamless experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
            <button
              onClick={() => nav("/services")}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition"
            >
              Book a Service
            </button>
            <Link
              to="/vehicles"
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-gray-200 font-medium hover:bg-slate-700 transition"
            >
              See Latest Cars
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Cars Section */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-xl font-semibold mb-8 text-center md:text-left">
          Latest Cars
        </h2>

        {loading ? (
          <div className="text-slate-400 text-center">Loading latest cars…</div>
        ) : error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : !rows.length ? (
          <div className="text-slate-400 text-center">No cars available right now.</div>
        ) : (
          <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 text-center place-items-center">
            {rows.map((v) => (
              <div key={v.id} className="flex flex-col items-center">
                <div className="w-64 h-40 flex items-center justify-center overflow-hidden">
                  {v.imageUrl ? (
                    <img
                      src={resolveImg(v.imageUrl)}
                      alt={v.title}
                      className="object-contain w-full h-full hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">No image</div>
                  )}
                </div>

                <div className="mt-3 text-lg font-semibold text-white">
                  {v.title}
                </div>

                {typeof v.price === "number" && (
                  <div className="text-slate-300 text-sm">
                    Starting at ${v.price.toLocaleString()}
                  </div>
                )}

                <button
                  className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500"
                  onClick={() => goTestDrive(v)}
                >
                  Test Drive
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}








/*
//working code static
// src/pages/Welcome.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getJSON } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";

type VehicleDto = {
  id: number;
  title: string;
  brand: string;
  price: number;
  imageUrl?: string | null;
};

export default function Welcome() {
  const nav = useNavigate();
  const { token } = useAuth();
  const [latest, setLatest] = useState<VehicleDto[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const data = await getJSON<VehicleDto[]>("/api/v1/public/vehicles");
        if (alive) setLatest(data.slice(0, 3));
      } catch (e) {
        if (alive) setErr("Failed to load latest cars.");
      }
    })();
    return () => { alive = false; };
  }, []);

  const goTestDrive = (v: VehicleDto) => {
    const next = `/services?select=TEST-DRIVE&vehicleId=${v.id}`;
    if (!token) {
      const qs = new URLSearchParams({ next, intent: "test-drive", vehicleId: String(v.id) });
      nav(`/login?${qs.toString()}`);
    } else {
      nav(next);
    }
  };

  return (
    <div className="p-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Welcome to <span className="text-blue-400">Autobridge</span>
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl">
            Explore the latest cars and book services in one seamless experience.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => nav("/services")}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white"
            >
              Book a Service
            </button>
            <Link to="/vehicles" className="px-4 py-2 rounded-xl bg-slate-800">
              See Latest Cars
            </Link>
          </div>
        </div>
      </section>

      <h2 className="mx-auto max-w-6xl px-6 pt-8 text-xl font-semibold">Latest</h2>
      {err && <div className="mx-auto max-w-6xl px-6 text-red-400 mt-2">{err}</div>}

      <section className="mx-auto max-w-6xl px-6 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {latest.map((v) => (
          <article key={v.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="h-40 rounded-xl bg-slate-800 mb-3 overflow-hidden flex items-center justify-center">
              {v.imageUrl ? (
                <img src={v.imageUrl} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500">No image</span>
              )}
            </div>
            <div className="font-medium">{v.title}</div>
            <div className="text-sm text-slate-400">{v.brand}</div>
            <div className="text-sm text-slate-400 mt-1">{fmtCurrency(v.price)}</div>
            <div className="mt-3">
              <button
                onClick={() => goTestDrive(v)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm"
              >
                Test Drive
              </button>
            </div>
          </article>
        ))}
      </section>
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

*/