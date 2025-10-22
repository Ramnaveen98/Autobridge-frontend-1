import { useEffect, useState } from "react";
import { profileApi, Profile as P, ProfileUpdate } from "@/services/profile";

export default function Profile() {
  const [p, setP] = useState<P | null>(null);
  const [edit, setEdit] = useState<ProfileUpdate>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(() => {
    profileApi.me().then(d => { setP(d); setEdit({ firstName:d.firstName, lastName:d.lastName, phone:d.phone }); })
      .finally(()=>setLoading(false));
  }, []);

  const save = async () => {
    setMsg(null);
    const next = await profileApi.update(edit);
    setP(next);
    setMsg("Saved!");
  };

  if (loading) return <div>Loading…</div>;
  if (!p) return <div className="text-red-400">Failed to load profile</div>;

  return (
    <div className="max-w-xl card p-6">
      <h2 className="text-xl font-semibold mb-4">My Profile</h2>
      <div className="space-y-3">
        <div>
          <div className="label">Email</div>
          <div className="text-blue-100">{p.email}</div>
        </div>
        <div>
          <label className="label">First name</label>
          <input className="input" value={edit.firstName || ""} onChange={e=>setEdit(s=>({...s, firstName:e.target.value}))} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" value={edit.lastName || ""} onChange={e=>setEdit(s=>({...s, lastName:e.target.value}))} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={edit.phone || ""} onChange={e=>setEdit(s=>({...s, phone:e.target.value}))} />
        </div>
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
        <button className="btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}
