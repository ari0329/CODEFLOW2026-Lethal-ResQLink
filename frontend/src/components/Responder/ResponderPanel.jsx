import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import SeverityBadge from "../Dashboard/SeverityBadge";
import ActionLog from "./ActionLog";
import cfg from "../../config";

export default function ResponderPanel() {
  const [myAlerts, setMyAlerts] = useState([]);
  const [tab, setTab] = useState("assigned");
  const [loading, setLoad] = useState(true);
  const token = localStorage.getItem("rq_token");

  useEffect(() => {
    axios.get(`${cfg.API_URL}/api/responders/my-alerts`,
      { headers: { Authorization:`Bearer ${token}` } })
      .then(r => setMyAlerts(r.data.alerts || []))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [token]);

  const resolve = async (id) => {
    await axios.patch(`${cfg.API_URL}/api/alerts/${id}/verify`,
      { status:"resolved", notes:"Resolved by responder" },
      { headers: { Authorization:`Bearer ${token}` } });
    setMyAlerts(prev => prev.filter(a => a._id !== id));
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-900)" }}>
      <div style={{ background:"var(--bg-800)", borderBottom:"1px solid var(--border)",
                    padding:"0 24px", height:52, display:"flex", alignItems:"center", gap:16 }}>
        <Link to="/" style={{ color:"var(--text-300)", fontSize:"0.85rem" }}>← Dashboard</Link>
        <span style={{ fontWeight:700, fontSize:"1rem" }}>🧑‍🚒 Responder Panel</span>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, padding:"0 24px",
                    borderBottom:"1px solid var(--border)", background:"var(--bg-800)" }}>
        {["assigned","audit"].map(t => (
          <button key={t} onClick={() => setTab(t)} className="btn"
            style={{ borderRadius:0, padding:"12px 18px", fontSize:"0.82rem",
                     background:"transparent", borderBottom: tab===t ? "2px solid var(--blue)" : "2px solid transparent",
                     color: tab===t ? "var(--text-100)" : "var(--text-500)" }}>
            {t === "assigned" ? "🚨 My Alerts" : "📋 Audit Log"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:"24px auto", padding:"0 16px" }}>
        {tab === "assigned" && (
          loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:48 }}><div className="spinner" /></div>
          ) : myAlerts.length === 0 ? (
            <div className="card" style={{ padding:32, textAlign:"center", color:"var(--text-500)" }}>
              No alerts currently assigned to you.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {myAlerts.map(alert => (
                <div key={alert._id} className="card"
                  style={{ padding:"14px 16px", borderLeft:`3px solid var(--${alert.severityLevel})` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <SeverityBadge level={alert.severityLevel} score={alert.severityScore} />
                    <span style={{ fontSize:"0.72rem", color:"var(--text-500)" }}>
                      {formatDistanceToNow(new Date(alert.createdAt||Date.now()), { addSuffix:true })}
                    </span>
                  </div>
                  <p style={{ fontSize:"0.85rem", marginBottom:10, lineHeight:1.45, color:"var(--text-100)" }}>
                    {alert.originalText?.substring(0, 200)}
                  </p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:"0.75rem", color:"var(--text-300)" }}>
                      {alert.emergencyType} · {alert.location?.city || "No location"} · {alert.source}
                    </div>
                    <button className="btn btn-success" style={{ fontSize:"0.75rem" }}
                            onClick={() => resolve(alert._id)}>
                      ✓ Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === "audit" && (
          <div className="card" style={{ overflow:"hidden" }}>
            <ActionLog />
          </div>
        )}
      </div>
    </div>
  );
}