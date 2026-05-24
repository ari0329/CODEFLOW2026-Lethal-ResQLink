import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import TimelineChart from "./TimelineChart";
import TypeBreakdown from "./TypeBreakdown";
import cfg from "../../config";

export default function AnalyticsPage() {
  const summary = useSelector(s => s.alerts.summary);
  const [regions, setRegions] = useState([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    axios.get(`${cfg.API_URL}/api/analytics/regions`)
      .then(r => setRegions(r.data.regions || []))
      .catch(() => {});
  }, []);

  const getCount = (arr, id) => arr?.find(x => x._id === id)?.count ?? 0;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-900)", padding:"0 0 40px" }}>
      {/* Nav */}
      <div style={{ background:"var(--bg-800)", borderBottom:"1px solid var(--border)",
                    padding:"0 24px", height:52, display:"flex", alignItems:"center", gap:16 }}>
        <Link to="/" style={{ color:"var(--text-300)", fontSize:"0.85rem" }}>← Dashboard</Link>
        <span style={{ fontWeight:700, fontSize:"1rem" }}>📊 Analytics & Reports</span>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 16px", display:"flex",
                    flexDirection:"column", gap:20 }}>
        {/* Summary Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
          {[
            { label:"Total Alerts",  value:summary?.total,          icon:"🚨", color:"var(--text-100)" },
            { label:"Critical",      value:getCount(summary?.bySeverity,"critical"), icon:"🔴", color:"var(--critical)" },
            { label:"High",          value:getCount(summary?.bySeverity,"high"),     icon:"🟠", color:"var(--high)" },
            { label:"Verified",      value:getCount(summary?.byStatus,"verified"),   icon:"✅", color:"var(--green)" },
            { label:"Resolved",      value:getCount(summary?.byStatus,"resolved"),   icon:"🏁", color:"var(--blue)" },
            { label:"Last 24h",      value:summary?.recent24h,      icon:"📡", color:"var(--cyan)" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:"16px 18px" }}>
              <div style={{ fontSize:"1.4rem", marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:"1.8rem", fontWeight:700, color:s.color }}>{s.value ?? "—"}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-300)", textTransform:"uppercase",
                            letterSpacing:".4px", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ fontSize:"0.9rem", fontWeight:600 }}>Alert Timeline</h3>
              <select className="input" style={{ width:"auto", padding:"4px 8px", fontSize:"0.78rem" }}
                      value={days} onChange={e => setDays(+e.target.value)}>
                {[7,14,30,60,90].map(d => <option key={d} value={d}>Last {d} days</option>)}
              </select>
            </div>
            <div style={{ height:240 }}>
              <TimelineChart days={days} />
            </div>
          </div>

          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:600, marginBottom:14 }}>By Emergency Type</h3>
            <TypeBreakdown />
          </div>
        </div>

        {/* Top regions */}
        {regions.length > 0 && (
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:600, marginBottom:14 }}>Top Affected Regions</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {regions.slice(0,10).map((r, i) => (
                <div key={r._id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:24, fontSize:"0.75rem", color:"var(--text-500)", textAlign:"right" }}>
                    {i+1}.
                  </span>
                  <span style={{ flex:1, fontSize:"0.85rem" }}>{r._id || "Unknown"}</span>
                  <div style={{ flex:2, background:"var(--bg-700)", borderRadius:3, height:8, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3,
                                  background:`hsl(${Math.max(0, 120 - r.avgSeverity*1.2)}, 70%, 55%)`,
                                  width:`${Math.min(100,(r.count/regions[0].count)*100)}%` }} />
                  </div>
                  <span style={{ width:40, textAlign:"right", fontSize:"0.8rem", fontWeight:600 }}>
                    {r.count}
                  </span>
                  {r.critical > 0 && (
                    <span style={{ fontSize:"0.72rem", color:"var(--red)" }}>🔴{r.critical}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}