import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../App";
import cfg from "../../config";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const { data } = await axios.post(`${cfg.API_URL}/api/auth/login`, form);
      login(data.token, data.user);
      navigate("/");
    } catch (ex) {
      setErr(ex.response?.data?.error || "Login failed.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  minHeight:"100vh", background:"var(--bg-900)", padding:16 }}>
      <div className="card" style={{ width:"100%", maxWidth:400, padding:36 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🚨</div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:"var(--text-100)" }}>ResQLink</h1>
          <p style={{ color:"var(--text-300)", fontSize:"0.85rem", marginTop:4 }}>
            Emergency Response Platform
          </p>
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:"0.8rem", color:"var(--text-300)", marginBottom:4, display:"block" }}>
              Email
            </label>
            <input className="input" type="email" required placeholder="responder@agency.org"
              value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize:"0.8rem", color:"var(--text-300)", marginBottom:4, display:"block" }}>
              Password
            </label>
            <input className="input" type="password" required placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))} />
          </div>

          {err && (
            <div style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)",
                          borderRadius:"var(--radius-sm)", padding:"8px 12px",
                          color:"var(--red)", fontSize:"0.8rem" }}>
              {err}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy}
            style={{ marginTop:8, justifyContent:"center", padding:"10px" }}>
            {busy ? <span className="spinner" style={{ width:16,height:16 }} /> : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)",
                      textAlign: "center", fontSize: "0.8rem", color: "var(--text-500)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--blue)", fontWeight: 500 }}>
            Create Account
          </Link>
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center", fontSize: "0.78rem" }}
              onClick={() => navigate("/")}>
              View Public Dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}