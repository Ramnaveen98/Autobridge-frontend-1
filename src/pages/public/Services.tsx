// src/pages/public/Services.tsx
import React, { useEffect, useState } from "react";
import { catalogApi, ServiceDto as Service } from "@/services/catalog";
import BookingForm from "@/components/BookingForm";

// simple fallback slug generator if backend doesn't provide one
function toSlug(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

export default function Services() {
  const [items, setItems] = useState<Service[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [activeService, setActiveService] = useState<{ id: number; name: string; slug?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const res = await catalogApi.services();
        if (alive) setItems(res);
      } catch (e: any) {
        if (alive) {
          const msg = e?.response?.status ? `Failed: HTTP ${e.response.status}` : "Failed to load services";
          setErr(msg);
          setItems([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Helper to open modal with a specific service
  function openBooking(s: Service) {
    const slug = (s as any).slug ?? toSlug(s.name);
    setActiveService({ id: s.id, name: s.name, slug });
    setOpen(true);
  }

  // Common close handler
  function closeModal() {
    setOpen(false);
    setActiveService(null);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#0e2954] to-[#051d3b] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Services</h1>

        {err && <div className="text-rose-300 mb-4">{err}</div>}

        {items === null && (
          <div className="space-y-3">
            <div className="h-6 w-48 bg-white/10 rounded" />
            <div className="h-24 w-full bg-white/5 rounded" />
            <div className="h-24 w-full bg-white/5 rounded" />
          </div>
        )}

        {items && items.length === 0 && !err && (
          <div className="opacity-80">No services available.</div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((s) => {
            const hasDescription = (s as any).description != null && String((s as any).description).length > 0;
            const duration = (s as any).durationMin as number | undefined;
            const rawPrice = (s as any).price as number | string | undefined;
            const priceNumber =
              typeof rawPrice === "number"
                ? rawPrice
                : typeof rawPrice === "string"
                ? Number(rawPrice)
                : undefined;

            return (
              <article
                key={s.id}
                className="rounded-2xl bg-slate-800/60 backdrop-blur p-5 shadow-md border border-white/5"
              >
                <header className="text-lg font-medium">{s.name}</header>

                {hasDescription && (
                  <p className="text-sm opacity-80 mt-1 line-clamp-3">{String((s as any).description)}</p>
                )}

                {duration != null && (
                  <div className="mt-4 text-sm opacity-90">Duration: {duration} min</div>
                )}

                {priceNumber != null && !Number.isNaN(priceNumber) && (
                  <div className="mt-1 font-semibold">${priceNumber.toFixed(2)}</div>
                )}

                <div className="mt-4">
                  <button
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm"
                    onClick={() => openBooking(s)}
                  >
                    Book this service
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* === Modal mounted at the bottom so it overlays the page === */}
      {activeService && open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            // click on backdrop closes
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
            <BookingForm
              service={activeService}
              onClose={closeModal}
              onSuccess={() => {
                // you can toast or refresh if needed
                closeModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
