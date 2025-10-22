/*import { useEffect, useMemo, useState } from "react";
import { postJSON, getJSON } from "@/services/client";

type Service = {
  id: number;
  name: string;
  slug: string; // e.g. "test-drive", "delivery", "oil-change"
  durationMinutes?: number | null;
  price?: number | null;
};

type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
};

export default function BookingForm({
  service,
  onClose,
  onSuccess,
}: {
  service: Service;
  onClose?: () => void;
  onSuccess?: (requestId: number) => void;
}) {
  // when true → show inventory select; otherwise manual car fields
  const isInventoryService = useMemo(
    () => ["test-drive", "delivery"].includes(service.slug.toLowerCase()),
    [service.slug]
  );

  // inventory + selection
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | "">("");

  // manual car fields (for non-inventory services)
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [vin, setVin] = useState("");

  // contact + address
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("USA");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load inventory **only** for Test Drive / Delivery
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isInventoryService) return;
      setLoadingVehicles(true);
      try {
        // adjust endpoint name to your backend; this is common
        const data = await getJSON<Vehicle[]>("/api/v1/vehicles/available");
        if (!alive) return;
        setVehicles(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setVehicles([]);
      } finally {
        if (alive) setLoadingVehicles(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [isInventoryService]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build payload expected by your backend CreateRequest DTO
      const payload: any = {
        serviceId: service.id,
        // contact
        firstName,
        lastName,
        email,
        phone,
        // address
        addressLine1: addr1,
        addressLine2: addr2 || null,
        city,
        state,
        postalCode: postal,
        country,
        notes: notes || null,
      };

      if (isInventoryService) {
        // require a vehicle from inventory
        if (!vehicleId) {
          setSubmitting(false);
          setError("Please select a vehicle from inventory.");
          return;
        }
        payload.vehicleId = Number(vehicleId);
      } else {
        // take manual car info; let backend store as request snapshot
        payload.vehicle = {
          make,
          model,
          year: year ? Number(year) : null,
          vin: vin || null,
        };
      }

      const res = await postJSON<{ id: number }>("/api/v1/requests", payload);
      onSuccess?.(res?.id ?? 0);
      onClose?.();
    } catch (err: any) {
      setError(err?.message || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {isInventoryService ? (
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Pick a vehicle</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded bg-slate-900 border border-slate-700 p-2"
          >
            <option value="">Select a vehicle…</option>
            {loadingVehicles ? (
              <option disabled>Loading…</option>
            ) : vehicles.length === 0 ? (
              <option disabled>No vehicles available</option>
            ) : (
              vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} {v.vin ? `— ${v.vin}` : ""}
                </option>
              ))
            )}
          </select>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-slate-300">Make *</label>
              <input
                className="w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Model *</label>
              <input
                className="w-full rounded bg-slate-900 border border-slate-700 p-2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Year</label>
              <input
                className="w-full rounded bg-slate-900 border border-slate-700 p-2"
                type="number"
                min={1980}
                max={2099}
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-300">VIN (optional)</label>
            <input
              className="w-full rounded bg-slate-900 border border-slate-700 p-2"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-300">First Name</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={firstName} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Last Name *</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={lastName} onChange={(e) => setLast(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-300">Email *</label>
        <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm text-slate-300">Phone</label>
        <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <label className="text-sm text-slate-300">Address Line 1 *</label>
        <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={addr1} onChange={(e) => setAddr1(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm text-slate-300">Address Line 2</label>
        <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={addr2} onChange={(e) => setAddr2(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-300">City *</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-slate-300">State</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Postal Code</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={postal} onChange={(e) => setPostal(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-300">Country</label>
          <input className="w-full rounded bg-slate-900 border border-slate-700 p-2" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Notes</label>
          <textarea className="w-full rounded bg-slate-900 border border-slate-700 p-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
        >
          {submitting ? "Booking…" : "Book"}
        </button>
        <button type="button" className="px-3 py-2 rounded bg-slate-800" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
*/

import { useEffect, useMemo, useState } from "react";
import { getJSON, postJSON } from "@/services/client";

type ServiceSlim = { id: number; name: string; slug: string };

type VehicleSummary = {
  id: number;
  title?: string | null;
  brand?: string | null;
  name?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
};

function vehicleLabel(v: VehicleSummary) {
  const title = v.title || v.name || [v.make, v.model].filter(Boolean).join(" ");
  const brand = v.brand || v.make || "";
  const year = v.year ? `${v.year} ` : "";
  const base = title ? `${year}${title}` : `${year}${brand || `#${v.id}`}`;
  return v.vin ? `${base} — ${v.vin}` : base;
}
function normalizeList(data: any): VehicleSummary[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

// inventory detection: slug, name, or URL ?select=
function isInventoryKind(service: ServiceSlim) {
  const s = (service.slug || "").toLowerCase().replace(/^#/, "");
  const n = (service.name || "").toLowerCase();
  const urlSel = new URLSearchParams(window.location.search).get("select") || "";
  const us = urlSel.toLowerCase();
  const rx = /(test[\s-]*drive|delivery)/;
  return rx.test(s) || rx.test(n) || rx.test(us);
}

export default function BookingForm({
  service,
  onClose,
  onSuccess,
}: {
  service: ServiceSlim;
  onClose: () => void;
  onSuccess: (requestId?: number) => void;
}) {
  const isInventoryService = useMemo(() => isInventoryKind(service), [service]);

  const [scheduledLocal, setScheduledLocal] = useState("");

  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [inventoryVehicleId, setInventoryVehicleId] = useState<number | "">("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [vin, setVin] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("USA");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function fetchVehicles() {
      if (!isInventoryService) return;
      setLoadingVehicles(true);

      async function tryPath(p: string) {
        try {
          const data = await getJSON<any>(p);
          return normalizeList(data);
        } catch {
          return null;
        }
      }

      // try modern public, legacy public, then auth fallback
      let v =
        (await tryPath("/api/v1/vehicles/public")) ??
        (await tryPath("/api/v1/public/vehicles")) ??
        (await tryPath("/api/v1/vehicles"));

      if (alive) {
        setVehicles(v ?? []);
        setLoadingVehicles(false);
      }
    }
    fetchVehicles();
    return () => { alive = false; };
  }, [isInventoryService]);

  // preselect from ?vehicleId=
  useEffect(() => {
    if (!isInventoryService) return;
    const m = window.location.search.match(/[?&]vehicleId=(\d+)/i);
    const id = m ? Number(m[1]) : undefined;
    if (id && !Number.isNaN(id)) setInventoryVehicleId(id);
  }, [isInventoryService]);

  function normalizeLocalDateTime(input: string) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
    return `${input}:00`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const scheduledAt = normalizeLocalDateTime(scheduledLocal);
    if (!scheduledAt) return setErr("Please choose a valid date & time.");
    if (!lastName || !email || !address1 || !city) {
      return setErr("Fill Last Name, Email, Address Line 1, and City.");
    }

    const payload: Record<string, any> = {
      serviceId: service.id,
      scheduledAt,
      userFirstName: firstName || "N/A",
      userLastName: lastName,
      userEmail: email,
      userPhone: phone || undefined,
      addressLine1: address1,
      addressLine2: address2 || undefined,
      city,
      state: stateUS || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      notes: notes || undefined,
    };

    if (isInventoryService) {
      if (inventoryVehicleId === "") {
        return setErr("Please pick a vehicle from inventory.");
      }
      const exists = vehicles.some(v => v.id === Number(inventoryVehicleId));
      if (!exists) {
        return setErr("Selected vehicle is no longer available. Please pick again.");
      }
      payload.inventoryVehicleId = Number(inventoryVehicleId);
    } else {
      if (!make || !model || !year) {
        return setErr("Please provide vehicle Make, Model, and Year.");
      }
      payload.vehicleMake = make;
      payload.vehicleModel = model;
      payload.vehicleYear = Number(year);
      payload.vehicleVin = vin || undefined;
    }

    try {
      setSubmitting(true);
      const res = await postJSON<{ id?: number }>("/api/v1/requests", payload);
      alert("Request submitted!");
      onSuccess(res?.id);
    } catch (e: any) {
      const status = e?.response?.status ?? "ERR";
      const apiMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        `Request failed (${status})`;
      setErr(apiMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col h-[85vh]" onSubmit={submit}>
      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <div className="text-sm mb-1">Service</div>
            <input
              readOnly
              value={`${service.name} (#${service.slug})`}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="text-sm mb-1">Preferred date & time *</div>
            <input
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              step="60"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
            />
            <div className="text-xs text-slate-400 mt-1">Time is saved in your local timezone.</div>
          </label>
        </div>

        {isInventoryService ? (
          <div>
            <div className="text-sm font-medium mb-2">Pick a vehicle *</div>
            <select
              value={inventoryVehicleId}
              onChange={(e) =>
                setInventoryVehicleId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"
              disabled={loadingVehicles}
            >
              <option value="">{loadingVehicles ? "Loading…" : "Select from inventory"}</option>
              {!loadingVehicles && vehicles.length === 0 ? (
                <option value="">No vehicles available</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))
              )}
            </select>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium mb-2">Your vehicle</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="block md:col-span-2">
                <div className="text-sm mb-1">Make *</div>
                <input value={make} onChange={(e) => setMake(e.target.value)}
                       className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
              </label>
              <label className="block md:col-span-1">
                <div className="text-sm mb-1">Model *</div>
                <input value={model} onChange={(e) => setModel(e.target.value)}
                       className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
              </label>
              <label className="block md:col-span-1">
                <div className="text-sm mb-1">Year *</div>
                <input inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)}
                       className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
              </label>
              <label className="block md:col-span-4">
                <div className="text-sm mb-1">VIN (optional)</div>
                <input value={vin} onChange={(e) => setVin(e.target.value)}
                       className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
              </label>
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium mb-2">Your contact</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm mb-1">First Name</div>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">Last Name *</div>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block md:col-span-2">
              <div className="text-sm mb-1">Email *</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block md:col-span-2">
              <div className="text-sm mb-1">Phone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Service address</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <div className="text-sm mb-1">Address Line 1 *</div>
              <input value={address1} onChange={(e) => setAddress1(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block md:col-span-2">
              <div className="text-sm mb-1">Address Line 2</div>
              <input value={address2} onChange={(e) => setAddress2(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">City *</div>
              <input value={city} onChange={(e) => setCity(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">State</div>
              <input value={stateUS} onChange={(e) => setStateUS(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">Postal Code</div>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">Country</div>
              <input value={country} onChange={(e) => setCountry(e.target.value)}
                     className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
            </label>
          </div>
        </div>

        <label className="block">
          <div className="text-sm mb-1">Notes (optional)</div>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none"/>
        </label>

        {err && <div className="text-red-400 text-sm">{err}</div>}
      </div>

      <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </form>
  );
}

