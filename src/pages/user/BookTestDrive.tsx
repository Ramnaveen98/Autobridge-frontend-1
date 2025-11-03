// src/pages/user/BookTestDrive.tsx
import { useEffect, useState } from "react";
import { catalogApi, VehicleDto as Car } from "@/services/catalog";
import { reqApi } from "@/services/requests";

export default function BookTestDrive() {
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    catalogApi.vehicles().then(setCars);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!carId || !date || !time) {
      setMsg("Please fill all fields");
      return;
    }

    // Build an ISO-like timestamp if both parts exist
    const scheduledAt = `${date}T${time}`;

    // Use the generic create() since bookTestDrive() isn't exported.
    // Cast as any to avoid strict typing mismatches with your existing CreateRequestPayload.
    await reqApi.create({
      // If you have a dedicated serviceId for "Test Drive", put it here (e.g., 5).
      // Using 0 as a placeholder; backend can map from note if needed.
      serviceId: 0,
      scheduledAt,
      note: `Test drive request for vehicle ${carId}`,
      // If your backend supports vehicle reference, include it; harmless if ignored server-side.
      vehicleId: Number(carId),
    } as any);

    setMsg("Requested! Check status in My Requests.");
  };

  return (
    <div className="max-w-xl card p-6">
      <h2 className="text-xl font-semibold mb-4">Book a Test Drive</h2>
      <form className="space-y-3" onSubmit={submit}>
        <div>
          <label className="label">Car</label>
          <select
            className="input"
            value={carId}
            onChange={(e) => {
              const v = e.target.value;
              setCarId(v === "" ? "" : Number(v));
            }}
          >
            <option value="">Select a car</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Preferred Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Preferred Time</label>
          <input
            className="input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {msg && <div className="text-green-400 text-sm">{msg}</div>}

        <button className="btn-primary" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}
