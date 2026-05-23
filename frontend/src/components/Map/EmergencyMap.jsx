
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useDispatch } from 'react-redux';
import { selectAlert } from '../../store/alertSlice';
import AlertPin from './AlertPin';
import HeatmapLayer from './HeatmapLayer';
import config from '../../config';
import 'leaflet/dist/leaflet.css';


function MapController({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected?.coordinates?.lat && selected?.coordinates?.lng) {
      map.flyTo([selected.coordinates.lat, selected.coordinates.lng], 12, { duration: 1 });
    }
  }, [selected, map]);
  return null;
}

export default function EmergencyMap({ alerts, selected }) {
  const dispatch = useDispatch();
  const withCoords = alerts.filter(a => a.coordinates?.lat && a.coordinates?.lng);

  return (
    <MapContainer
      center={config.MAP_CENTER}
      zoom={config.MAP_ZOOM}
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />
      <HeatmapLayer alerts={withCoords} />
      {withCoords.map(alert => (
        <AlertPin
          key={alert._id}
          alert={alert}
          isSelected={selected?._id === alert._id}
          onClick={() => dispatch(selectAlert(alert))}
        />
      ))}
      <MapController selected={selected} />
    </MapContainer>
  );
}