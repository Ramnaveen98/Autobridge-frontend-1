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
