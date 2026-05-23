
import React from 'react';
import { useDispatch } from 'react-redux';
import { selectAlert } from '../../store/alertSlice';
import SeverityBadge from './SeverityBadge';

const TYPE_ICONS = { flood:'🌊',fire:'🔥',earthquake:'🏚️',medical:'🏥',violence:'⚠️',landslide:'⛰️',cyclone:'🌀',accident:'🚗',unknown:'🆘' };
const SEV_COLOR  = { critical:'#ff4757',high:'#ff8c42',medium:'#ffd700',low:'#00d4aa' };

export default function AlertFeed({ alerts, loading, selected }) {
  const dispatch = useDispatch();
  if (loading && !alerts.length) return <div style={{padding:20,textAlign:'center',color:'#5a6580',fontSize:13}}>Loading alerts...</div>;

  return (
    <div style={{flex:1,overflowY:'auto',padding:8}}>
      {alerts.map(a => (
        <div key={a._id} onClick={() => dispatch(selectAlert(a))}
          style={{
            background: selected?._id === a._id ? '#1e2535' : '#161b28',
            border: `1px solid ${selected?._id === a._id ? '#ff4757' : '#2a3347'}`,
            borderLeft: `3px solid ${SEV_COLOR[a.severity] || '#5a6580'}`,
            borderRadius:8, padding:10, marginBottom:6, cursor:'pointer',
            transition:'all .2s',
          }}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,display:'flex',gap:5,alignItems:'center'}}>
              {TYPE_ICONS[a.emergencyType] || '🆘'}
              {(a.emergencyType||'unknown').charAt(0).toUpperCase()+(a.emergencyType||'unknown').slice(1)}
            </div>
            <SeverityBadge severity={a.severity} />
          </div>
          <div style={{fontSize:12,color:'#9aa5bf',lineHeight:1.5,marginBottom:6,
            overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
            {a.cleanedText || a.originalText}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,color:'#5a6580'}}>
              📍 {a.locationText || a.address || 'Location unknown'}
              {a.verified && <span style={{color:'#00d4aa',marginLeft:4}}>✓</span>}
            </span>
            <span style={{fontSize:10,color:'#5a6580',fontFamily:'monospace'}}>
              Score: {a.urgencyScore}
            </span>
          </div>
          <div style={{height:2,background:'#2a3347',borderRadius:2,marginTop:6}}>
            <div style={{height:'100%',width:`${a.urgencyScore}%`,background:SEV_COLOR[a.severity],borderRadius:2,transition:'width .5s'}} />
          </div>
        </div>
      ))}
      {!loading && alerts.length === 0 && (
        <div style={{textAlign:'center',padding:30,color:'#5a6580',fontSize:13}}>No alerts match the current filter.</div>
      )}
    </div>
  );
}