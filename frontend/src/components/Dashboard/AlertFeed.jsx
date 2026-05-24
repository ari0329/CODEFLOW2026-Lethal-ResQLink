import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from "date-fns";
import SeverityBadge from "./SeverityBadge";
import { selectAlert, setFilters, fetchAlerts } from "../../store/alertSlice";
import { useAlerts } from "../../hooks/useAlert";

const TYPE_ICONS = {
  flood:"🌊", fire:"🔥", earthquake:"🏚", accident:"🚗", medical:"🏥",
  violence:"⚠️", collapse:"🏗", landslide:"⛰", storm:"🌀",
  missing:"🔍", trapped:"🚪", other:"📍",
};

const SRC_ICONS = { twitter:"🐦", facebook:"👥", telegram:"✈️", whatsapp:"💬",
                    reddit:"🤖", news:"📰", email:"📧", sms:"📱", manual:"✏️", api:"⚡" };

export default function AlertFeed() {
  const dispatch   = useDispatch();
  const { alerts, loading, filters, updateFilters } = useAlerts();
  const [search, setSearch] = useState("");

  const filtered = alerts.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      return a.originalText?.toLowerCase().includes(q) ||
             a.location?.city?.toLowerCase().includes(q) ||
             a.emergencyType?.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Toolbar */}
      <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--border)",
                    display:"flex", flexDirection:"column", gap:8 }}>
        <input className="input" placeholder="🔍 Search alerts…" value={search}
               onChange={e => setSearch(e.target.value)} />
        <div style={{ display:"flex", gap:6 }}>
          <select className="input" style={{ flex:1 }} value={filters.severity}
                  onChange={e => { updateFilters({ severity:e.target.value }); dispatch(fetchAlerts({ ...filters, severity:e.target.value })); }}>
            <option value="">All Severity</option>
            {["critical","high","medium","low"].map(s =>
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select className="input" style={{ flex:1 }} value={filters.type}
                  onChange={e => { updateFilters({ type:e.target.value }); dispatch(fetchAlerts({ ...filters, type:e.target.value })); }}>
            <option value="">All Types</option>
            {["flood","fire","earthquake","accident","medical","violence","collapse","landslide","storm","missing","trapped"].map(t =>
              <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {loading && !filtered.length ? (
          <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--text-500)" }}>
            No alerts match current filters
          </div>
        ) : (
          filtered.map(alert => <AlertCard key={alert._id} alert={alert} />)
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const dispatch = useDispatch();
  const selected = useSelector(s => s.alerts.selected);
  const isSelected = selected?._id === alert._id;

  const age = formatDistanceToNow(new Date(alert.createdAt || Date.now()), { addSuffix:true });

  return (
    <div onClick={() => dispatch(selectAlert(alert))}
      style={{
        padding:"12px 14px",
        borderBottom:"1px solid var(--border)",
        cursor:"pointer",
        background: isSelected ? "var(--bg-700)" : "transparent",
        transition:"background .15s",
        borderLeft: `3px solid var(--${alert.severityLevel})`,
      }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <SeverityBadge level={alert.severityLevel} score={alert.severityScore} />
        <span style={{ fontSize:"0.7rem", color:"var(--text-500)" }}>{age}</span>
      </div>

      {/* Text */}
      <p style={{ fontSize:"0.82rem", color:"var(--text-100)", lineHeight:1.45, marginBottom:7,
                  display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
        {alert.originalText}
      </p>

      {/* Footer row */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <span style={{ fontSize:"0.72rem", background:"var(--bg-700)", padding:"2px 7px",
                       borderRadius:4, color:"var(--text-300)" }}>
          {TYPE_ICONS[alert.emergencyType] || "📍"} {alert.emergencyType}
        </span>
        {alert.location?.city && (
          <span style={{ fontSize:"0.72rem", color:"var(--text-500)" }}>
            📌 {alert.location.city}{alert.location.country ? `, ${alert.location.country}` : ""}
          </span>
        )}
        <span style={{ fontSize:"0.72rem", color:"var(--text-500)", marginLeft:"auto" }}>
          {SRC_ICONS[alert.source] || "🔗"} {alert.source}
        </span>
        {alert.status === "verified" && (
          <span style={{ fontSize:"0.65rem", background:"rgba(34,197,94,.15)",
                         color:"var(--green)", padding:"1px 6px", borderRadius:4 }}>✓ verified</span>
        )}
        {alert.language && alert.language !== "en" && (
          <span style={{ fontSize:"0.65rem", background:"rgba(59,130,246,.15)",
                         color:"var(--blue)", padding:"1px 6px", borderRadius:4 }}>
            {alert.language.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}