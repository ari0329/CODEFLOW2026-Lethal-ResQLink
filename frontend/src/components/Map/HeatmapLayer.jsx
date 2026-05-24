import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import axios from "axios";
import cfg from "../../config";

// Dynamically import leaflet.heat
let HeatLayer = null;
const loadHeat = () => {
  if (!HeatLayer) {
    try {
      require("leaflet.heat");
      HeatLayer = window.L?.heatLayer;
    } catch { HeatLayer = null; }
  }
  return HeatLayer;
};

export default function HeatmapLayer({ visible }) {
  const map     = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
      return;
    }

    const createHeat = loadHeat();
    if (!createHeat) return;

    axios.get(`${cfg.API_URL}/api/analytics/heatmap`)
      .then(({ data }) => {
        if (layerRef.current) map.removeLayer(layerRef.current);
        const points = data.heatmapData
          .filter(p => p.lat && p.lng)
          .map(p => [p.lat, p.lng, p.weight || 0.5]);

        layerRef.current = createHeat(points, {
          radius: 25, blur: 20, maxZoom: 10,
          max: 1.0,
          gradient: { 0.2:"#22c55e", 0.5:"#eab308", 0.75:"#f97316", 1.0:"#ef4444" },
        }).addTo(map);
      })
      .catch(e => console.warn("Heatmap load failed:", e));

    return () => {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
  }, [map, visible]);

  return null;
}