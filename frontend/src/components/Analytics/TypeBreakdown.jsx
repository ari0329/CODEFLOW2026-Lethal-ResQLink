import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useSelector } from "react-redux";

Chart.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#a855f7",
                 "#06b6d4","#ec4899","#84cc16","#f59e0b","#6366f1","#64748b"];

export default function TypeBreakdown() {
  const summary = useSelector(s => s.alerts.summary);
  const byType  = summary?.byType || [];

  if (!byType.length) return <div style={{ padding:16, color:"var(--text-500)" }}>No data yet.</div>;

  const data = {
    labels:   byType.map(t => t._id?.charAt(0).toUpperCase() + t._id?.slice(1)),
    datasets: [{
      data:            byType.map(t => t.count),
      backgroundColor: PALETTE.slice(0, byType.length),
      borderColor:     "transparent",
      hoverOffset:     6,
    }],
  };

  return (
    <div style={{ position:"relative" }}>
      <Doughnut data={data} options={{
        responsive: true,
        cutout: "65%",
        plugins: {
          legend: { position:"right", labels:{ color:"#94a3b8", font:{size:11}, padding:12 } },
          tooltip: { backgroundColor:"#1e293b", titleColor:"#f1f5f9", bodyColor:"#94a3b8" },
        },
      }} />
    </div>
  );
}