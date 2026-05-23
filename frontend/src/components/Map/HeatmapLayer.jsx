import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ alerts }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !alerts || alerts.length === 0) return;

    const points = alerts
      .filter(a => a.coordinates?.lat && a.coordinates?.lng)
      .map(a => [
        a.coordinates.lat,
        a.coordinates.lng,
        (a.urgencyScore || 50) / 100
      ]);

    let heatLayer;
    if (L.heatLayer) {
      heatLayer = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0
      }).addTo(map);
    }

    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, alerts]);

  return null;
}
