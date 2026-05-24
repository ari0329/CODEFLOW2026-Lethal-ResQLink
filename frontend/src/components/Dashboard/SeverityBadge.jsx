import React from "react";

const ICONS = { critical:"🔴", high:"🟠", medium:"🟡", low:"🟢" };

export default function SeverityBadge({ level, score }) {
  return (
    <span className={`badge badge-${level}`}>
      {ICONS[level] || "⚪"} {level?.toUpperCase()}
      {score != null && <span style={{ opacity:.7, marginLeft:3 }}>·{score}</span>}
    </span>
  );
}