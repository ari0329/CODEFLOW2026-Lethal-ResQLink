import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { formatDistanceToNow, format } from "date-fns";
import SeverityBadge from "./SeverityBadge";
import { selectAlert, verifyAlert } from "../../store/alertSlice";

import cfg from "../../config";

export default function AlertDetail() {
  const dispatch  = useDispatch();
 
  const alert     = useSelector(s => s.alerts.selected);
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg,  setMsg]    = useState("");

  if (!alert) return null;

  const canVerify = user && ["admin","responder"].includes(user.role);

  const doVerify = async (status) => {
    setBusy(true); setMsg("");
    try {
      await dispatch(verifyAlert({ id:alert._id, status, notes:note }));
      setMsg(`✅ Marked as ${status}`);
      setNote("");
    } catch { setMsg("❌ Action failed."); }
    finally { setBusy(false); }
  };

  const entities = alert.extractedEntities || {};

  return (
    <div className="card" style={{ padding:0, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"12px 14px", background:"var(--bg-700)",
                    borderBottom:"1px solid var(--border)", display:"flex",
                    justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <SeverityBadge level={alert.severityLevel} score={alert.severityScore} />
          <div style={{ fontSize:"0.7rem", color:"var(--text-500)", marginTop:5 }}>
            {format(new Date(alert.createdAt || Date.now()), "MMM d, yyyy HH:mm")}
            {" · "}{formatDistanceToNow(new Date(alert.createdAt||Date.now()), { addSuffix:true })}
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding:"4px 8px", fontSize:"0.75rem" }}
                onClick={() => dispatch(selectAlert(null))}>✕</button>
      </div>

      {/* Body */}
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
        {/* Original text */}
        <div>
          <div style={{ fontSize:"0.7rem", color:"var(--text-300)", marginBottom:4,
                        textTransform:"uppercase", letterSpacing:".4px" }}>Message</div>
          <p style={{ fontSize:"0.82rem", lineHeight:1.5, color:"var(--text-100)",
                      background:"var(--bg-700)", padding:"8px 10px",
                      borderRadius:"var(--radius-sm)", fontFamily:"var(--font-mono)" }}>
            {alert.originalText}
          </p>
          {alert.language && alert.language !== "en" && (
            <div style={{ fontSize:"0.7rem", color:"var(--blue)", marginTop:3 }}>
              Language: {alert.language.toUpperCase()}
              {" · "}Distress: {(alert.distressScore*100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Emergency info row */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <InfoChip icon="⚡" label="Type"   value={alert.emergencyType} />
          <InfoChip icon="🌐" label="Source" value={alert.source} />
          {alert.extractedEntities?.victimCount > 0 && (
            <InfoChip icon="👥" label="Victims" value={`~${alert.extractedEntities.victimCount}`} />
          )}
        </div>

        {/* Location */}
        {alert.location && (
          <div style={{ background:"var(--bg-700)", borderRadius:"var(--radius-sm)", padding:"8px 10px" }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-300)", marginBottom:3 }}>📌 Location</div>
            <div style={{ fontSize:"0.82rem" }}>
              {alert.location.address || [alert.location.city, alert.location.country].filter(Boolean).join(", ")}
            </div>
            {alert.location.coordinates && (
              <div style={{ fontSize:"0.7rem", color:"var(--text-500)", fontFamily:"var(--font-mono)", marginTop:2 }}>
                {alert.location.coordinates[1]?.toFixed(5)}, {alert.location.coordinates[0]?.toFixed(5)}
              </div>
            )}
          </div>
        )}

        {/* Entities */}
        {(entities.locations?.length > 0 || entities.landmarks?.length > 0) && (
          <div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-300)", marginBottom:4 }}>Extracted Entities</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {[...entities.locations||[], ...entities.landmarks||[]].map((e,i) => (
                <span key={i} style={{ fontSize:"0.72rem", background:"rgba(59,130,246,.15)",
                  color:"var(--blue)", padding:"2px 7px", borderRadius:4 }}>📍{e}</span>
              ))}
              {entities.phoneNumbers?.map((p,i) => (
                <span key={i} style={{ fontSize:"0.72rem", background:"rgba(34,197,94,.15)",
                  color:"var(--green)", padding:"2px 7px", borderRadius:4 }}>📞{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Urgency flags */}
        {alert.urgencyFlags?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {alert.urgencyFlags.map(f => (
              <span key={f} style={{ fontSize:"0.7rem", background:"rgba(239,68,68,.15)",
                color:"var(--red)", padding:"2px 7px", borderRadius:4 }}>
                ⚠️ {f.replace(/_/g," ")}
              </span>
            ))}
          </div>
        )}

        {/* Status */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:"0.7rem", color:"var(--text-300)" }}>Status:</span>
          <span style={{ fontSize:"0.75rem", fontWeight:600,
                         color: alert.status==="verified"?"var(--green)":alert.status==="fake"?"var(--red)":"var(--yellow)" }}>
            {alert.status?.toUpperCase()}
          </span>
          {alert.isFake && (
            <span style={{ fontSize:"0.7rem", color:"var(--red)" }}>⚠️ Possible fake</span>
          )}
        </div>

        {/* Responder actions */}
        {canVerify && alert.status === "pending" && (
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:10 }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-300)", marginBottom:6 }}>
              Responder Actions
            </div>
            <textarea className="input" rows={2} placeholder="Add note (optional)…"
              value={note} onChange={e => setNote(e.target.value)}
              style={{ resize:"vertical", marginBottom:8, fontFamily:"var(--font-sans)" }} />
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-success" style={{ flex:1, justifyContent:"center", fontSize:"0.78rem" }}
                      disabled={busy} onClick={() => doVerify("verified")}>
                ✓ Verify
              </button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center", fontSize:"0.78rem" }}
                      disabled={busy} onClick={() => doVerify("active")}>
                🚁 Dispatch
              </button>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:"center", fontSize:"0.78rem" }}
                      disabled={busy} onClick={() => doVerify("fake")}>
                ✕ Fake
              </button>
            </div>
            {msg && <div style={{ marginTop:6, fontSize:"0.78rem", color:"var(--green)" }}>{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const InfoChip = ({ icon, label, value }) => (
  <div style={{ background:"var(--bg-700)", borderRadius:"var(--radius-sm)",
                padding:"4px 8px", fontSize:"0.72rem", color:"var(--text-300)" }}>
    {icon} <span style={{ color:"var(--text-100)", fontWeight:500 }}>{value}</span>
  </div>
);