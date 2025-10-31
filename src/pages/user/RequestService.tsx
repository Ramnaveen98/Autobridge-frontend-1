// src/pages/user/RequestService.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { catalogApi, ServiceDto as Service } from "@/services/catalog";
import { reqApi } from "@/services/requests";
import { getJSON } from "@/services/client";

type Vehicle = { id: number; title: string };

function splitScheduledAt(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  if (!m) return { date: "", time: "" };
  return { date: m[1], time: m[2] };
}

/** Vehicle is only needed for Test Drive or Delivery */
function isVehicleRequired(service?: Service | null): boolean {
  if (!service) return false;
  const name =
    (service as any)?.name ||
    (service as any)?.serviceName ||
    "";
  const n = String(name).toLowerCase();
  return /\btest\s*drive\b/.test(n) || /\bdeliver(y|)\b/.test(n);
}

export default function RequestService() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  // service + schedule
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // vehicle
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | "">("");

  // contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");

  // address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity]                 = useState("");
  const [stateUS, setStateUS]           = useState("");
  const [postalCode, setPostalCode]     = useState("");
  const [country, setCountry]           = useState("USA");

  // optional
  const [note, setNote] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [errTop, setErrTop] = useState<string | null>(null);
  const [okTop, setOkTop] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from query params
  useEffect(() => {
    const svcId = params.get("serviceId");
    const scheduledAt = params.get("scheduledAt");
    const notes = params.get("notes");
    const vId = params.get("inventoryVehicleId");

    if (svcId) setServiceId(Number(svcId));
    if (scheduledAt) {
      const sp = splitScheduledAt(scheduledAt);
      if (sp.date) setDate(sp.date);
      if (sp.time) setTime(sp.time);
    }
    if (notes) setNote(notes);
    if (vId) setVehicleId(Number(vId));
  }, [params]);

  // Load services + public vehicles
  useEffect(() => {
    catalogApi.services().then(setServices).catch(() => setServices([]));
    (async () => {
      try {
        const page = await getJSON<any>("/api/v1/public/vehicles", {
          params: { page: 0, size: 200, sort: "createdAt,DESC" },
        });
        const list: Vehicle[] = (page?.content ?? page ?? []).map((v: any) => ({
          id: v.id,
          title: v.title || `${v.brand ?? ""} ${v.model ?? ""}`.trim() || `#${v.id}`,
        }));
        setVehicles(list);
      } catch {
        setVehicles([]);
      }
    })();
  }, []);

  // Which service is picked
  const selectedService = useMemo(
    () => (serviceId ? services.find((s) => s.id === Number(serviceId)) ?? null : null),
    [serviceId, services]
  );
  const vehicleNeeded = isVehicleRequired(selectedService);

  // If the user switches from a service that needs a car to one that doesn't, clear car
  useEffect(() => {
    if (!vehicleNeeded && vehicleId !== "") setVehicleId("");
  }, [vehicleNeeded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simple validators
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const phoneOk = phone.trim().length > 0; // required per your ask
  const zipOk = postalCode.trim().length > 0;

  // Build client-side validation errors (everything required except Note)
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!serviceId) e.serviceId = "Please select a service.";
    if (!date) e.date = "Please choose a date.";
    if (!time) e.time = "Please choose a time.";

    // vehicle only when needed
    if (vehicleNeeded && !vehicleId) e.vehicleId = "Please pick a vehicle.";

    if (!firstName.trim()) e.firstName = "Enter your first name.";
    if (!lastName.trim()) e.lastName = "Enter your last name.";
    if (!emailOk) e.email = "Enter a valid email address.";
    if (!phoneOk) e.phone = "Enter your phone number.";

    if (!addressLine1.trim()) e.addressLine1 = "Enter address line 1.";
    if (!addressLine2.trim()) e.addressLine2 = "Enter address line 2.";
    if (!city.trim()) e.city = "Enter your city.";
    if (!stateUS.trim()) e.stateUS = "Enter your state.";
    if (!zipOk) e.postalCode = "Enter your postal/ZIP code.";
    if (!country.trim()) e.country = "Enter your country.";
    return e;
  }

  const scheduledAt = useMemo(
    () => (date && time ? `${date}T${time.length === 5 ? time + ":00" : time}` : null),
    [date, time]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrTop(null);
    setOkTop(null);

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setErrTop("Please fill the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        serviceId: Number(serviceId),
        scheduledAt: scheduledAt!, // validated above

        userFirstName: firstName.trim(),
        userLastName: lastName.trim(),
        userEmail: email.trim(),
        userPhone: phone.trim(),

        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: stateUS.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),

        notes: note || undefined,
      };

      // Only include vehicleId when required (Test Drive / Delivery)
      if (vehicleNeeded && vehicleId) {
        payload.inventoryVehicleId = Number(vehicleId);
      }

      await reqApi.create(payload);
      setOkTop("Service requested! Redirecting to My Requests…");
      setTimeout(() => nav("/user/requests"), 900);
    } catch (e: any) {
      const apiMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Submission failed";
      setErrTop(apiMsg);
    } finally {
      setSubmitting(false);
    }
  }

  // small helpers
  const clsInput = (bad?: boolean) =>
    `input ${bad ? "border-red-600 focus:ring-red-500" : ""}`;
  const Msg = ({ id, text }: { id: string; text?: string }) =>
    text ? <p id={id} className="mt-1 text-xs text-red-400">{text}</p> : null;

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto card p-6">
        <h2 className="text-xl font-semibold mb-4">Request a Service</h2>

        {errTop && <div className="mb-3 text-red-400 text-sm">{errTop}</div>}
        {okTop && <div className="mb-3 text-emerald-400 text-sm">{okTop}</div>}

        <form className="space-y-5" onSubmit={submit} noValidate>
          {/* Service */}
          <div>
            <label className="label">Service <span className="text-red-400">*</span></label>
            <select
              className={clsInput(!!errors.serviceId)}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
              aria-invalid={!!errors.serviceId}
              aria-describedby={errors.serviceId ? "e-service" : undefined}
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{(s as any).name ?? (s as any).serviceName}</option>
              ))}
            </select>
            <Msg id="e-service" text={errors.serviceId} />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred date <span className="text-red-400">*</span></label>
              <input
                className={clsInput(!!errors.date)}
                type="date"
                value={date}
                onChange={(e)=>setDate(e.target.value)}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "e-date" : undefined}
              />
              <Msg id="e-date" text={errors.date} />
            </div>
            <div>
              <label className="label">Preferred time <span className="text-red-400">*</span></label>
              <input
                className={clsInput(!!errors.time)}
                type="time"
                value={time}
                onChange={(e)=>setTime(e.target.value)}
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? "e-time" : undefined}
              />
              <Msg id="e-time" text={errors.time} />
            </div>
          </div>

          {/* Vehicle (only when required) */}
          {vehicleNeeded && (
            <div>
              <label className="label">Pick a vehicle <span className="text-red-400">*</span></label>
              <select
                className={clsInput(!!errors.vehicleId)}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
                aria-invalid={!!errors.vehicleId}
                aria-describedby={errors.vehicleId ? "e-veh" : undefined}
                required
              >
                <option value="">Select from inventory</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
              <Msg id="e-veh" text={errors.vehicleId} />
            </div>
          )}

          {/* Contact */}
          <div>
            <div className="text-sm mb-2 text-slate-300">Your contact</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">First Name <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.firstName)}
                  value={firstName}
                  onChange={(e)=>setFirstName(e.target.value)}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "e-fn" : undefined}
                />
                <Msg id="e-fn" text={errors.firstName} />
              </div>
              <div>
                <label className="label">Last Name <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.lastName)}
                  value={lastName}
                  onChange={(e)=>setLastName(e.target.value)}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "e-ln" : undefined}
                />
                <Msg id="e-ln" text={errors.lastName} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Email <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.email)}
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "e-email" : undefined}
                />
                <Msg id="e-email" text={errors.email} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Phone <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.phone)}
                  value={phone}
                  onChange={(e)=>setPhone(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "e-phone" : undefined}
                />
                <Msg id="e-phone" text={errors.phone} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="text-sm mb-2 text-slate-300">Service address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Address Line 1 <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.addressLine1)}
                  value={addressLine1}
                  onChange={(e)=>setAddressLine1(e.target.value)}
                  aria-invalid={!!errors.addressLine1}
                  aria-describedby={errors.addressLine1 ? "e-a1" : undefined}
                />
                <Msg id="e-a1" text={errors.addressLine1} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address Line 2 <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.addressLine2)}
                  value={addressLine2}
                  onChange={(e)=>setAddressLine2(e.target.value)}
                  aria-invalid={!!errors.addressLine2}
                  aria-describedby={errors.addressLine2 ? "e-a2" : undefined}
                />
                <Msg id="e-a2" text={errors.addressLine2} />
              </div>
              <div>
                <label className="label">City <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.city)}
                  value={city}
                  onChange={(e)=>setCity(e.target.value)}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "e-city" : undefined}
                />
                <Msg id="e-city" text={errors.city} />
              </div>
              <div>
                <label className="label">State <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.stateUS)}
                  value={stateUS}
                  onChange={(e)=>setStateUS(e.target.value)}
                  aria-invalid={!!errors.stateUS}
                  aria-describedby={errors.stateUS ? "e-state" : undefined}
                />
                <Msg id="e-state" text={errors.stateUS} />
              </div>
              <div>
                <label className="label">Postal Code <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.postalCode)}
                  value={postalCode}
                  onChange={(e)=>setPostalCode(e.target.value)}
                  aria-invalid={!!errors.postalCode}
                  aria-describedby={errors.postalCode ? "e-zip" : undefined}
                />
                <Msg id="e-zip" text={errors.postalCode} />
              </div>
              <div>
                <label className="label">Country <span className="text-red-400">*</span></label>
                <input
                  className={clsInput(!!errors.country)}
                  value={country}
                  onChange={(e)=>setCountry(e.target.value)}
                  aria-invalid={!!errors.country}
                  aria-describedby={errors.country ? "e-country" : undefined}
                />
                <Msg id="e-country" text={errors.country} />
              </div>
            </div>
          </div>

          {/* Note (optional) */}
          <div>
            <label className="label">Note (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={note}
              onChange={(e)=>setNote(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Cancel
            </button>
            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
