
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import SeverityBadge from '../Dashboard/SeverityBadge';

const SEV_COLOR = { critical:'#ff4757', high:'#ff8c42', medium:'#ffd700', low:'#00d4aa' };
const TYPE_ICONS = { flood:'🌊',fire:'🔥',earthquake:'🏚️',medical:'🏥',violence:'⚠️',landslide:'⛰️',cyclone:'🌀',accident:'🚗',unknown:'🆘' };

function makeIcon(severity, isSelected) {
  const color = SEV_COLOR[severity] || '#9aa5bf';
  const size  = isSelected ? 36 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" fill="${color}" fill-opacity="0.25" />
      <circle cx="20" cy="20" r="10" fill="${color}" />
      ${isSelected ? `<circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>` : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

export default function AlertPin({ alert, isSelected, onClick }) {
  const { coordinates, emergencyType, severity, urgencyScore, locationText, address, victimCount, cleanedText, verified } = alert;

  return (
    <Marker
      position={[coordinates.lat, coordinates.lng]}
      icon={makeIcon(severity, isSelected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      <Popup maxWidth={280}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",padding:4}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontSize:22}}>{TYPE_ICONS[emergencyType]||'🆘'}</span>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{(emergencyType||'unknown').toUpperCase()}</div>
              <SeverityBadge severity={severity} />
            </div>
          </div>
          <div style={{fontSize:12,color:'#555',marginBottom:6,lineHeight:1.5}}>
            {(cleanedText||'').slice(0,120)}{(cleanedText||'').length>120?'...':''}
          </div>
          {[
            ['📍', locationText || address || '—'],
            ['👥', victimCount ? `~${victimCount} affected` : 'Unknown'],
            ['📊', `Urgency: ${urgencyScore}/100`],
            ['✅', verified ? 'AI Verified' : 'Pending Verification'],
          ].map(([icon,val])=>(
            <div key={icon} style={{fontSize:11,display:'flex',gap:6,marginBottom:3}}>
              <span>{icon}</span><span>{val}</span>
            </div>
          ))}
        </div>
      </Popup>
    </Marker>
  );
}