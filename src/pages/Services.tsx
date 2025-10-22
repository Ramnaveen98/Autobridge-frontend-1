/*

// src/pages/Services.tsx
import { useEffect, useMemo, useState } from "react";
import { getJSON, postJSON } from "@/services/client";
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

type VehicleSummary = {
  id: number;
  title: string;
  brand: string;
  price: number;
  imageUrl?: string | null;
};

export default function Services() {
  const nav = useNavigate();
  const { token, role } = useAuth();

  const [services, setServices] = useState<ServiceSummary[] | null>(null);
  const [vehicles, setVehicles] = useState<VehicleSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // booking dialog state (full info, single submit)
  const [open, setOpen] = useState(false);

  // core selection
  const [serviceId, setServiceId] = useState<number | "">("");
  const [scheduledAt, setScheduledAt] = useState<string>(""); // datetime-local

  // optional inventory vehicle
  const [vehicleId, setVehicleId] = useState<number | "">("");

  // contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");  // required
  const [email, setEmail]         = useState("");  // required
  const [phone, setPhone]         = useState("");

  // address
  const [addressLine1, setAddressLine1] = useState(""); // required
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity]                 = useState("");  // required
  const [stateUS, setStateUS]           = useState("");
  const [postalCode, setPostalCode]     = useState("");
  const [country, setCountry]           = useState("USA");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // ✅ Updated endpoints to match your backend
        const servicesP = getJSON<ServiceSummary[]>("/api/v1/services/public");

        // Vehicles are optional — if the endpoint isn't there yet, we'll ignore errors
        const vehiclesP = getJSON<VehicleSummary[]>("/api/v1/vehicles/public")
          .catch(() => [] as VehicleSummary[]);

        const [s, v] = await Promise.all([servicesP, vehiclesP]);
        if (!alive) return;
        setServices(s);
        setVehicles(v);
      } catch (e: any) {
        if (!alive) return;
        console.error("Failed to load services/vehicles", e);
        // Most common cause is a 401/500 from the public services endpoint
        setErr("Failed to load services. Please retry.");
        setServices([]);
        setVehicles([]);
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

  function startBooking(prefService?: ServiceSummary) {
    if (!canBook) {
      // send to login, come back to services
      return nav(`/login?next=/services`);
    }
    setOpen(true);
    setServiceId(prefService ? prefService.id : "");
    setScheduledAt("");
    setVehicleId("");
    setNotes("");
    // clear contact/address (you can prefill from profile if you store it)
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setStateUS("");
    setPostalCode("");
    setCountry("USA");
    setMsg(null);
    setFormErr(null);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setMsg(null);

    if (!serviceId || !scheduledAt) {
      setFormErr("Please choose a service and a date/time.");
      return;
    }
    if (!lastName || !email || !addressLine1 || !city) {
      setFormErr("Please fill Last Name, Email, Address Line 1, and City.");
      return;
    }

    const scheduled =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledAt)
        ? scheduledAt + ":00"
        : scheduledAt;

    const payload: Record<string, any> = {
      serviceId: Number(serviceId),
      scheduledAt: scheduled,
      userFirstName: firstName || "N/A",
      userLastName: lastName,
      userEmail: email,
      userPhone: phone || undefined,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      state: stateUS || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      notes: notes || undefined,
    };
    if (vehicleId !== "") payload.inventoryVehicleId = Number(vehicleId);

    try {
      setSubmitting(true);
      await postJSON("/api/v1/requests", payload);
      setMsg("Request submitted!");
      const target =
        role === "ADMIN" ? "/app/admin" :
        role === "AGENT" ? "/app/agent" :
        "/app/user";
      setTimeout(() => {
        setOpen(false);
        nav(target);
      }, 800);
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status ?? "ERR";
      const apiMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        `Request failed (${status})`;
      setFormErr(apiMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading services…</div>;
  if (err) return <div className="p-6 text-red-400">{err}</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        {!canBook && <div className="text-sm text-slate-400">Sign in to book a service.</div>}
      </header>

      {!services?.length && <div className="text-slate-400">No services available.</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((svc) => (
          <article
            key={svc.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <h2 className="text-lg font-medium">{svc.name}</h2>
            <p className="text-sm opacity-80 mt-1">
              {svc.durationMinutes} min · {fmtCurrency(svc.basePrice)}
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wide text-slate-400">#{svc.slug}</span>
              <button
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                onClick={() => startBooking(svc)}
              >
                Book
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* full booking dialog (single submit) }
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Request a Service</div>
              <button
                className="text-slate-400 hover:text-slate-200"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form className="space-y-5" onSubmit={submitBooking}>
              {/* Service + datetime + vehicle }
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-sm mb-1">Service *</div>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                  >
                    <option value="">Select a service</option>
                    {services?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-sm mb-1">Preferred date & time *</div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    step="60"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-sm mb-1">Pick a vehicle (optional)</div>
                  <select
                    value={vehicleId}
                    onChange={(e) =>
                      setVehicleId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                  >
                    <option value="">No vehicle</option>
                    {vehicles?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({v.brand})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Contact }
              <div>
                <div className="text-sm font-medium mb-2">Your contact</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-sm mb-1">First Name</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">Last Name *</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-sm mb-1">Email *</div>
                    <input
                      type="email"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-sm mb-1">Phone</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* Address }
              <div>
                <div className="text-sm font-medium mb-2">Service address</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className="text-sm mb-1">Address Line 1 *</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-sm mb-1">Address Line 2</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">City *</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">State</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={stateUS}
                      onChange={(e) => setStateUS(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">Postal Code</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">Country</div>
                    <input
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* Notes }
              <label className="block">
                <div className="text-sm mb-1">Notes (optional)</div>
                <textarea
                  rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              {formErr && <div className="text-red-400 text-sm">{formErr}</div>}
              {msg && <div className="text-green-400 text-sm">{msg}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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


// src/pages/Services.tsx
import { useEffect, useMemo, useState } from "react";
import { getJSON } from "@/services/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import BookingForm from "@/components/BookingForm";

type ServiceSummary = {
  id: number;
  slug: string;   // e.g. "test-drive", "delivery", "oil-change"
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

  // booking modal
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

  if (loading) return <div className="p-6">Loading services…</div>;
  if (err) return <div className="p-6 text-red-400">{err}</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        {!canBook && <div className="text-sm text-slate-400">Sign in to book a service.</div>}
      </header>

      {!services?.length && <div className="text-slate-400">No services available.</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((svc) => (
          <article
            key={svc.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <h2 className="text-lg font-medium">{svc.name}</h2>
            <p className="text-sm opacity-80 mt-1">
              {svc.durationMinutes} min · {fmtCurrency(svc.basePrice)}
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs uppercase tracking-wide text-slate-400">#{svc.slug}</span>
              <button
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                onClick={() => startBooking(svc)}
              >
                Book
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Booking modal — uses conditional UI inside BookingForm */}
      {open && selectedService && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Request: {selectedService.name}</div>
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
                // After booking, send user to their dashboard (role-aware)
                const target =
                  role === "ADMIN" ? "/app/admin" :
                  role === "AGENT" ? "/app/agent" :
                  "/app/user";
                nav(target);
              }}
            />
          </div>
        </div>
      )}
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

