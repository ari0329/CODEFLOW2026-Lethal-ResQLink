
import React from "react";
import { useSelector } from "react-redux";

const Stat = ({ label, value, color, icon }) => (
  <div className="card" style={{ padding:"14px 16px", flex:1, minWidth:100 }}>
    <div style={{ fontSize:"1.5rem", marginBottom:4 }}>{icon}</div>
    <div style={{ fontSize:"1.6rem", fontWeight:700, color: color || "var(--text-100)" }}>
      {value ?? "—"}
    </div>
    <div style={{ fontSize:"0.72rem", color:"var(--text-300)", textTransform:"uppercase",
                  letterSpacing:".5px", marginTop:2 }}>{label}</div>
  </div>
);

export default function StatsPanel({ liveCount }) {
  const summary = useSelector(s => s.alerts.summary);

  const getCount = (arr, id) => arr?.find(x => x._id === id)?.count ?? 0;

  return (
    <div style={{ display:"flex", gap:8, padding:"10px 12px",
                  borderBottom:"1px solid var(--border)", flexWrap:"wrap" }}>
      <Stat icon="🚨" label="Total Alerts"   value={summary?.total}    color="var(--text-100)" />
      <Stat icon="🔴" label="Critical"        value={getCount(summary?.bySeverity,"critical")} color="var(--critical)" />
      <Stat icon="🟠" label="High"            value={getCount(summary?.bySeverity,"high")}     color="var(--high)" />
      <Stat icon="📡" label="Last 24h"        value={summary?.recent24h} color="var(--cyan)" />
      <Stat icon="🟢" label="Live"            value={liveCount}         color="var(--green)" />
    </div>
  );
}