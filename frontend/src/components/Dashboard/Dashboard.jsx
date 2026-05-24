import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../App";
import { useSocket } from "../../hooks/useSocket";
import { useAlerts } from "../../hooks/useAlert";
import StatsPanel from "./StatsPanel";
import AlertFeed  from "./AlertFeed";
import EmergencyMap from "../Map/EmergencyMap";
import AlertDetail from "./AlertDetail";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const socket           = useSocket();
  const { alerts }       = useAlerts();
  const selected         = useSelector(s => s.alerts.selected);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect",    onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);
    return () => { socket.off("connect", onConnect); socket.off("disconnect", onDisconnect); };
  }, [socket]);

  const liveCount = alerts.filter(a => ["pending","verified","active"].includes(a.status)).length;

  return (
    <div className="layout">
      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <nav style={{ display:"flex", alignItems:"center", padding:"0 16px", height:52,
                    background:"var(--bg-800)", borderBottom:"1px solid var(--border)",
                    gap:12, flexShrink:0, zIndex:100 }}>
        <span style={{ fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.5px" }}>
          🚨 ResQLink
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:8 }}>
          <span className={`pulse pulse-${connected ? "green" : "red"}`} />
          <span style={{ fontSize:"0.72rem", color:"var(--text-300)" }}>
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <Link to="/analytics">
            <button className="btn btn-ghost" style={{ fontSize:"0.8rem" }}>📊 Analytics</button>
          </Link>
          {user && ["admin","responder"].includes(user.role) && (
            <Link to="/responder">
              <button className="btn btn-ghost" style={{ fontSize:"0.8rem" }}>🧑‍🚒 Responder</button>
            </Link>
          )}
          {user ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:"0.75rem", color:"var(--text-300)" }}>
                {user.name} · <span style={{ color:"var(--blue)" }}>{user.role}</span>
              </span>
              <button className="btn btn-ghost" style={{ fontSize:"0.75rem" }} onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-ghost" style={{ fontSize:"0.8rem" }}
                      onClick={() => navigate("/login")}>Sign In</button>
              <button className="btn btn-primary" style={{ fontSize:"0.8rem" }}
                      onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="main">
        {/* Sidebar */}
        <div className="sidebar">
          <StatsPanel liveCount={liveCount} />
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"10px 14px 6px", fontSize:"0.75rem", color:"var(--text-300)",
                          textTransform:"uppercase", letterSpacing:".5px", fontWeight:600 }}>
              Live Feed
            </div>
            <div style={{ flex:1, overflow:"hidden" }}>
              <AlertFeed />
            </div>
          </div>
        </div>

        {/* Map + detail overlay */}
        <div className="map-area">
          <EmergencyMap />
          {selected && (
            <div style={{ position:"absolute", top:12, right:12, width:340, zIndex:1000,
                          maxHeight:"calc(100vh - 80px)", overflowY:"auto" }}>
              <AlertDetail />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}