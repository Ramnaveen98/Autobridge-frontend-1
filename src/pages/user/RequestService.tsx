// src/pages/user/RequestService.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { catalogApi, ServiceDto as Service } from "@/services/catalog";
import { reqApi } from "@/services/requests";

function splitScheduledAt(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  if (!m) return { date: "", time: "" };
  return { date: m[1], time: m[2] };
}

export default function RequestService() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  // Prefill from query params (from Services page)
  useEffect(() => {
    const svcId = params.get("serviceId");
    const scheduledAt = params.get("scheduledAt");
    const notes = params.get("notes");
    if (svcId) setServiceId(Number(svcId));
    if (scheduledAt) {
      const { date, time } = splitScheduledAt(scheduledAt);
      if (date) setDate(date);
      if (time) setTime(time);
    }
    if (notes) setNote(notes);
  }, [params]);

  useEffect(() => { catalogApi.services().then(setServices); }, []);

  // contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");  // REQUIRED
  const [email, setEmail]         = useState("");  // REQUIRED
  const [phone, setPhone]         = useState("");

  // address
  const [addressLine1, setAddressLine1] = useState(""); // REQUIRED
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity]                 = useState("");  // REQUIRED
  const [stateUS, setStateUS]           = useState("");
  const [postalCode, setPostalCode]     = useState("");
  const [country, setCountry]           = useState("USA");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inventoryVehicleId = useMemo(() => {
    const v = params.get("inventoryVehicleId");
    return v ? Number(v) : undefined;
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);

    if (!serviceId || !date || !time) {
      setErr("Please select service, date, and time.");
      return;
    }
    if (!lastName || !email || !addressLine1 || !city) {
      setErr("Please fill Last Name, Email, Address Line 1, and City.");
      return;
    }

    const scheduledAt = `${date}T${time.length === 5 ? time + ":00" : time}`;

    const payload = {
      serviceId: Number(serviceId),
      inventoryVehicleId,
      scheduledAt,

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

      notes: note || undefined
    };

    try {
      setSubmitting(true);
      await reqApi.create(payload); // Works even if backend returns 201 with empty body
      setMsg("Service requested! Redirecting to My Requests…");
      // Give the user a beat to read the message, then navigate
      setTimeout(() => nav("/user/requests"), 800);
    } catch (e: any) {
      const apiMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Submission failed";
      setErr(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl card p-6">
      <h2 className="text-xl font-semibold mb-4">Request a Service</h2>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="label">Service</label>
          <select
            className="input"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Preferred Date</label>
            <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Preferred Time</label>
            <input className="input" type="time" value={time} onChange={(e)=>setTime(e.target.value)} />
          </div>
        </div>

        {/* contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">First Name</label>
            <input className="input" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Email *</label>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e)=>setPhone(e.target.value)} />
          </div>
        </div>

        {/* address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="label">Address Line 1 *</label>
            <input className="input" value={addressLine1} onChange={(e)=>setAddressLine1(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Address Line 2</label>
            <input className="input" value={addressLine2} onChange={(e)=>setAddressLine2(e.target.value)} />
          </div>
          <div>
            <label className="label">City *</label>
            <input className="input" value={city} onChange={(e)=>setCity(e.target.value)} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={stateUS} onChange={(e)=>setStateUS(e.target.value)} />
          </div>
          <div>
            <label className="label">Postal Code</label>
            <input className="input" value={postalCode} onChange={(e)=>setPostalCode(e.target.value)} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={country} onChange={(e)=>setCountry(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <textarea className="input" rows={3} value={note} onChange={(e)=>setNote(e.target.value)} />
        </div>

        {err && <div className="text-red-400 text-sm">{err}</div>}
        {msg && <div className="text-green-400 text-sm">{msg}</div>}

        <button className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
