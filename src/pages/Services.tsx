// src/pages/Services.tsx
import { useEffect, useMemo, useState } from "react";
import { getJSON } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import BookingForm from "@/components/BookingForm";

type ServiceSummary = {
  id: number;
  slug: string;
  name: string;
  durationMinutes: number;
  basePrice: number;
};

export default function Services() {
  const nav = useNavigate();
  const { token, role } = useAuth();

  const [services, setServices] = useState<ServiceSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const s = await getJSON<ServiceSummary[]>("/api/v1/services/public");
        if (!alive) return;
        setServices(s);
      } catch (e) {
        if (!alive) return;
        setErr("Failed to load services. Please retry.");
        setServices([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const canBook = useMemo(
    () => !!token && (role === "USER" || role === "ADMIN" || role === "AGENT"),
    [token, role]
  );

  function startBooking(svc: ServiceSummary) {
    if (!canBook) {
      return nav(`/login?next=/services`);
    }
    setSelectedService(svc);
    setOpen(true);
  }

  if (loading) return <div className="p-6 text-slate-400">Loading services…</div>;
  if (err) return <div className="p-6 text-red-400">{err}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 sm:mb-0 text-white">
            Our Services
          </h1>
          {!canBook && (
            <div className="text-sm text-slate-400">Sign in to book a service.</div>
          )}
        </header>

        {!services?.length && (
          <div className="text-slate-400 text-center">No services available.</div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((svc) => (
            <article
              key={svc.id}
              className="group relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-800/70 to-slate-900/80 p-6 shadow-lg hover:shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col h-full justify-between">
                {/* Service name & info */}
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                    {svc.name}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {svc.durationMinutes} min • {fmtCurrency(svc.basePrice)}
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition"
                    onClick={() => startBooking(svc)}
                  >
                    Book Now
                  </button>
                </div>

                {/* Soft glow hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-blue-500/0 group-hover:bg-blue-500/10 blur-2xl -z-10 transition" />
              </div>
            </article>
          ))}
        </div>

        {/* Booking Modal */}
        {open && selectedService && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-white">
                  Request: {selectedService.name}
                </div>
                <button
                  className="text-slate-400 hover:text-slate-200"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <BookingForm
                service={{
                  id: selectedService.id,
                  name: selectedService.name,
                  slug: selectedService.slug,
                }}
                onClose={() => setOpen(false)}
                onSuccess={(reqId) => {
                  setOpen(false);
                  const target =
                    role === "ADMIN"
                      ? "/app/admin"
                      : role === "AGENT"
                      ? "/app/agent"
                      : "/app/user";
                  nav(target);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n}`;
  }
}


