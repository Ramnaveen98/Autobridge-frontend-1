import { useEffect, useState } from "react";
import { catalogApi, Vehicle } from "@/services/catalog";

export default function Cars() {
  const [items, setItems] = useState<Vehicle[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const res = await catalogApi.vehicles();
        if (alive) setItems(res);
      } catch (e: any) {
        if (alive) {
          const msg = e?.response?.status ? `Failed: HTTP ${e.response.status}` : "Failed to load vehicles";
          setErr(msg);
          setItems([]);
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0e2954] to-[#051d3b] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Available Cars</h1>

        {err && <div className="text-rose-300 mb-4">{err}</div>}
        {items === null && <div className="opacity-80">Loading…</div>}
        {items && items.length === 0 && !err && <div className="opacity-80">No cars available.</div>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((v) => (
            <article key={v.id} className="rounded-2xl bg-slate-800/60 backdrop-blur p-5 shadow-md border border-white/5">
              {v.imageUrl && (
                <img src={v.imageUrl} alt={v.title} className="w-full h-44 object-cover rounded-xl mb-3" />
              )}
              <div className="text-lg font-medium">{v.title}</div>
              <div className="text-sm opacity-80">{v.brand}</div>
              <div className="mt-2 font-semibold">${v.price?.toFixed(2)}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
