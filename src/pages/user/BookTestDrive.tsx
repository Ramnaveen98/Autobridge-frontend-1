import { useEffect, useState } from "react";
import { catalogApi, Car } from "@/services/catalog";
import { reqApi } from "@/services/requests";

export default function BookTestDrive() {
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<number|"">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(()=>{ catalogApi.cars().then(setCars); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!carId || !date || !time) { setMsg("Please fill all fields"); return; }
    await reqApi.bookTestDrive({ carId: Number(carId), preferredDate: date, preferredTime: time });
    setMsg("Requested! Check status in My Requests.");
  };

  return (
    <div className="max-w-xl card p-6">
      <h2 className="text-xl font-semibold mb-4">Book a Test Drive</h2>
      <form className="space-y-3" onSubmit={submit}>
        <div>
          <label className="label">Car</label>
          <select className="input" value={carId} onChange={e=>setCarId(Number(e.target.value))}>
            <option value="">Select a car</option>
            {cars.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Preferred Date</label>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Preferred Time</label>
          <input className="input" type="time" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
        <button className="btn-primary">Submit</button>
      </form>
    </div>
  );
}
