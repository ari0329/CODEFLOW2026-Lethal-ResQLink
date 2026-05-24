import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { formatDistanceToNow } from "date-fns";
import { createAlertIcon } from "./AlertPin";
import HeatmapLayer from "./HeatmapLayer";
import SeverityBadge from "../Dashboard/SeverityBadge";
import { selectAlert } from "../../store/alertSlice";

// Auto-pan to newly selected alert
function MapFlyTo({ alert }) {
  const map = useMap();
  useEffect(() => {
    if (alert?.location?.coordinates?.length === 2) {
      const [lng, lat] = alert.location.coordinates;
      map.flyTo([lat, lng], Math.max(map.getZoom(), 10), { duration:1.2 });
    }
  }, [alert, map]);
  return null;
}

export default function EmergencyMap() {
  const dispatch  = useDispatch();
  const alerts    = useSelector(s => s.alerts.items);
  const selected  = useSelector(s => s.alerts.selected);
  const [showHeat, setShowHeat] = useState(false);
  const [filter,   setFilter]   = useState("all");  // all | critical | high | unlocated

  const mapped = alerts.filter(a => {
    if (!a.location?.coordinates?.length) return false;
    if (filter === "critical") return a.severityLevel === "critical";
    if (filter === "high")     return ["critical","high"].includes(a.severityLevel);
    return true;
  });

  const unmapped = alerts.filter(a => !a.location?.coordinates?.length);

  return (
    <div style={{ height:"100%", width:"100%", position:"relative" }}>
      {/* Map controls */}
      <div style={{ position:"absolute", top:12, left:12, zIndex:1000, display:"flex", flexDirection:"column", gap:6 }}>
        <div className="card" style={{ padding:"6px 8px", display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ fontSize:"0.65rem", color:"var(--text-300)", textTransform:"uppercase",
                        letterSpacing:".4px", marginBottom:2 }}>Filter</div>
          {["all","critical","high"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="btn btn-ghost"
              style={{ padding:"3px 8px", fontSize:"0.72rem", justifyContent:"flex-start",
                       background: filter===f ? "var(--bg-600)" : "transparent" }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setShowHeat(h => !h)}
          style={{ fontSize:"0.72rem", justifyContent:"center",
                   background: showHeat ? "rgba(234,179,8,.25)" : "var(--bg-800)",
                   border:"1px solid var(--border)" }}>
          🌡 Heatmap {showHeat ? "ON" : "OFF"}
        </button>
        <div className="card" style={{ padding:"6px 10px", fontSize:"0.7rem", color:"var(--text-300)" }}>
          📍 {mapped.length} mapped<br />
          📭 {unmapped.length} no location
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ position:"absolute", bottom:24, left:12, zIndex:1000,
                                     padding:"8px 12px", fontSize:"0.7rem" }}>
        {[["critical","#ef4444"],["high","#f97316"],["medium","#eab308"],["low","#22c55e"]].map(([l,c]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:c }} />
            <span style={{ color:"var(--text-300)", textTransform:"capitalize" }}>{l}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={[20, 0]} zoom={2}
        style={{ height:"100%", width:"100%" }}
        zoomControl={true}
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          maxZoom={19}
        />

        <HeatmapLayer visible={showHeat} />
        {selected && <MapFlyTo alert={selected} />}

        {mapped.map(alert => {
          const [lng, lat] = alert.location.coordinates;
          return (
            <Marker key={alert._id} position={[lat, lng]} icon={createAlertIcon(alert)}
              eventHandlers={{ click: () => dispatch(selectAlert(alert)) }}>
              <Popup maxWidth={280}>
                <div style={{ minWidth:220 }}>
                  <SeverityBadge level={alert.severityLevel} score={alert.severityScore} />
                  <p style={{ margin:"8px 0 6px", fontSize:"0.82rem", lineHeight:1.4,
                              color:"var(--text-100)" }}>
                    {alert.originalText?.substring(0, 160)}{alert.originalText?.length > 160 ? "…" : ""}
                  </p>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-300)" }}>
                    📡 {alert.source}
                    {" · "}{alert.emergencyType}
                    {" · "}{formatDistanceToNow(new Date(alert.createdAt||Date.now()), { addSuffix:true })}
                  </div>
                  {alert.location?.address && (
                    <div style={{ fontSize:"0.7rem", color:"var(--text-500)", marginTop:4 }}>
                      📌 {alert.location.address}
                    </div>
                  )}
                  <button className="btn btn-primary"
                    style={{ marginTop:8, width:"100%", justifyContent:"center", fontSize:"0.75rem", padding:"5px" }}
                    onClick={() => dispatch(selectAlert(alert))}>
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}