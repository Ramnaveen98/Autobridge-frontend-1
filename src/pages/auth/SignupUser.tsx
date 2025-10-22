import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupUser() {
  const nav = useNavigate();
  const { signupUser } = useAuth();
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", phone:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const onChange = (k:string, v:string)=> setForm(s=>({...s,[k]:v}));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr(null);
    try { await signupUser(form); nav("/login"); }
    catch (e:any) { setErr(e?.response?.data?.error || "Signup failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="max-w-md mx-auto card p-6">
      <h2 className="text-xl font-semibold mb-4">Sign up (User)</h2>
      <form className="space-y-3" onSubmit={submit}>
        {["firstName","lastName","email","password","phone"].map(k=>(
          <div key={k}>
            <label className="label">{k}</label>
            <input className="input" type={k==="password"?"password":"text"} value={(form as any)[k]} onChange={e=>onChange(k, e.target.value)} />
          </div>
        ))}
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>{loading?"Creating…":"Create account"}</button>
      </form>
    </div>
  );
}
