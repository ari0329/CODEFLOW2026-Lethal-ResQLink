import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import axios from "axios";
import cfg from "../../config";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TYPE_COLORS = {
  flood:"#3b82f6", fire:"#ef4444", earthquake:"#f97316", accident:"#eab308",
  medical:"#22c55e", violence:"#a855f7", other:"#64748b",
};

export default function TimelineChart({ days = 7 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${cfg.API_URL}/api/analytics/timeline`, { params:{ days } })
      .then(r => setData(r.data.timeline))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:32 }}><div className="spinner" /></div>;
  if (!data?.length) return <div style={{ padding:16, color:"var(--text-500)" }}>No timeline data yet.</div>;

  // Pivot by date
  const allDates = [...new Set(data.map(d => d._id.date))].sort();
  const allTypes = [...new Set(data.map(d => d._id.type))];

  const datasets = allTypes.map(type => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    data:  allDates.map(date => data.find(d => d._id.date===date && d._id.type===type)?.count || 0),
    borderColor: TYPE_COLORS[type] || "#64748b",
    backgroundColor: (TYPE_COLORS[type] || "#64748b") + "22",
    fill: false,
    tension: 0.4,
    pointRadius: 3,
  }));

  const chartData = { labels: allDates, datasets };

  return (
    <Line data={chartData} options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position:"top", labels:{ color:"#94a3b8", font:{ size:11 } } },
        tooltip: { backgroundColor:"#1e293b", titleColor:"#f1f5f9", bodyColor:"#94a3b8" },
      },
      scales: {
        x: { ticks:{ color:"#64748b", font:{size:10} }, grid:{ color:"rgba(255,255,255,.05)" } },
        y: { ticks:{ color:"#64748b", font:{size:10} }, grid:{ color:"rgba(255,255,255,.05)" }, beginAtZero:true },
      },
    }} />
  );
}