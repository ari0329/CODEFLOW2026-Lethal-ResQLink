import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import cfg from "../../config";

export default function ActionLog() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("rq_token");
    axios.get(`${cfg.API_URL}/api/responders/audit`, {
      params: { page, limit:20 },
      headers: { Authorization:`Bearer ${token}` },
    }).then(r => { setLogs(r.data.logs); setTotal(r.data.pagination.total); })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [page]);

  const ACTION_ICONS = {
    VERIFY_ALERT:"✅", DELETE_ALERT:"🗑", ASSIGN_RESPONDERS:"🧑‍🚒",
    ADD_RESPONSE_NOTE:"📝", USER_LOGIN:"🔐", USER_REGISTER:"👤",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)",
                    fontSize:"0.75rem", color:"var(--text-300)", textTransform:"uppercase",
                    letterSpacing:".4px", fontWeight:600 }}>
        Audit Log ({total})
      </div>
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:24 }}><div className="spinner" /></div>
      ) : (
        <>
          {logs.map(log => (
            <div key={log._id} style={{ padding:"9px 14px", borderBottom:"1px solid var(--border)",
                                        fontSize:"0.78rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                <span style={{ fontWeight:500 }}>
                  {ACTION_ICONS[log.action] || "•"} {log.action.replace(/_/g," ")}
                </span>
                <span style={{ color:"var(--text-500)", fontSize:"0.7rem" }}>
                  {format(new Date(log.createdAt), "MMM d HH:mm")}
                </span>
              </div>
              <div style={{ color:"var(--text-300)", fontSize:"0.72rem" }}>
                {log.actor?.name || "System"} · {log.actorRole}
                {log.ipAddress && ` · ${log.ipAddress}`}
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div style={{ display:"flex", gap:8, padding:10, justifyContent:"center" }}>
            <button className="btn btn-ghost" style={{ fontSize:"0.75rem" }}
                    disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
            <span style={{ padding:"6px 0", fontSize:"0.75rem", color:"var(--text-300)" }}>
              Page {page} / {Math.ceil(total/20)}
            </span>
            <button className="btn btn-ghost" style={{ fontSize:"0.75rem" }}
                    disabled={page>=Math.ceil(total/20)} onClick={() => setPage(p=>p+1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}