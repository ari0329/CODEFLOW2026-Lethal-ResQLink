import L from "leaflet";

const COLORS = { critical:"#ef4444", high:"#f97316", medium:"#eab308", low:"#22c55e", default:"#64748b" };

const TYPE_EMOJI = {
  flood:"🌊", fire:"🔥", earthquake:"🏚", accident:"🚗", medical:"🏥",
  violence:"⚠️", collapse:"🏗", landslide:"⛰", storm:"🌀", missing:"🔍", trapped:"🚪", other:"📍",
};

export const createAlertIcon = (alert) => {
  const color = COLORS[alert.severityLevel] || COLORS.default;
  const emoji = TYPE_EMOJI[alert.emergencyType] || "📍";
  const isPulsing = alert.severityLevel === "critical" || alert.severityLevel === "high";

  const html = `
    <div style="
      position:relative;
      display:flex; align-items:center; justify-content:center;
      width:36px; height:36px;
      border-radius:50% 50% 50% 0;
      background:${color};
      transform:rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,.5);
      ${isPulsing ? `animation:markerPulse 1.8s infinite;` : ""}
    ">
      <span style="transform:rotate(45deg); font-size:16px; line-height:1;">${emoji}</span>
    </div>
    <style>
      @keyframes markerPulse {
        0%   { box-shadow: 0 0 0 0 ${color}88; }
        70%  { box-shadow: 0 0 0 10px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
    </style>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize:  [36, 42],
    iconAnchor:[18, 42],
    popupAnchor:[0, -44],
  });
};

export const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size  = count > 100 ? 48 : count > 20 ? 40 : 34;
  return L.divIcon({
    html: `<div style="
      width:${size}px; height:${size}px;
      background:rgba(239,68,68,.85);
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:700; font-size:${size > 40 ? 14 : 12}px;
      box-shadow:0 2px 8px rgba(239,68,68,.5);
      border:2px solid rgba(255,255,255,.3);
    ">${count}</div>`,
    className: "",
    iconSize:  [size, size],
    iconAnchor:[size/2, size/2],
  });
};