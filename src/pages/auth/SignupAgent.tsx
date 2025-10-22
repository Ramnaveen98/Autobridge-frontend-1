import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupAgent() {
  const nav = useNavigate();
  const { signupAgent } = useAuth();
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", phone:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const onChange = (k:string, v:string)=> setForm(s=>({...s,[k]:v}));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr(null); setMsg(null);
    try { await signupAgent(form); setMsg("Application submitted. Please wait for admin approval."); }
    catch (e:any) { setErr(e?.response?.data?.error || "Agent signup failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h2 className="text-xl font-semibold mb-4">Agent application</h2>
      <form className="space-y-3" onSubmit={submit}>
        {["firstName","lastName","email","password","phone"].map(k=>(
          <div key={k}>
            <label className="label">{k}</label>
            <input className="input" type={k==="password"?"password":"text"} value={(form as any)[k]} onChange={e=>onChange(k, e.target.value)} />
          </div>
        ))}
        {err && <div className="text-red-400 text-sm">{err}</div>}
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={loading}>{loading?"Submitting…":"Submit"}</button>
          <button type="button" className="btn-outline flex-1" onClick={()=>nav("/")}>Back</button>
        </div>
      </form>
    </div>
  );
}
