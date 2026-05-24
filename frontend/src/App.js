import React, { createContext, useContext, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Dashboard    from "./components/Dashboard/Dashboard";
import Login        from "./components/Auth/Login";
import Signup       from "./components/Auth/Signup";
import AnalyticsPage  from "./components/Analytics/AnalyticsPage";
import ResponderPanel from "./components/Responder/ResponderPanel";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import cfg from "./config";

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function App() {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("rq_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rq_token");
    if (!token) { setLoading(false); return; }
    axios.get(`${cfg.API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setUser(r.data.user))
      .catch(() => { localStorage.removeItem("rq_token"); localStorage.removeItem("rq_user"); })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("rq_token", token);
    localStorage.setItem("rq_user",  JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem("rq_token");
    localStorage.removeItem("rq_user");
    setUser(null);
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f172a" }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  );

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login"  element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={
          <ProtectedRoute roles={["admin","analyst","responder","ngo"]}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/responder" element={
          <ProtectedRoute roles={["admin","responder"]}>
            <ResponderPanel />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthCtx.Provider>
  );
}