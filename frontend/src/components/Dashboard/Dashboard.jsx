import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAlerts } from '../../hooks/useAlert';
import { useSocket } from '../../hooks/useSocket';
import AlertFeed from './AlertFeed';
import EmergencyMap from '../Map/EmergencyMap';
import SeverityBadge from './SeverityBadge';

const FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export default function Dashboard() {
  const { alerts, loading, selected } = useAlerts();
  useSocket();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = alerts.filter(a => {
    const matchSev  = filter === 'all' || a.severity === filter;
    const matchText = !search || 
      (a.cleanedText || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.locationText || '').toLowerCase().includes(search.toLowerCase());
    return matchSev && matchText;
  });

  const counts = {
    total:    alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    active:   alerts.filter(a => a.status !== 'resolved').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 20px', borderBottom: '1px solid #21262d',
        background: '#0d1117', flexShrink: 0
      }}>
        <span style={{ fontSize: '24px' }}>🆘</span>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#e6edf3' }}>ResQLink</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#8b949e' }}>Emergency Response Platform</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
          {[
            { label: 'Total',    value: counts.total,    color: '#8b949e' },
            { label: 'Critical', value: counts.critical, color: '#ff4757' },
            { label: 'Active',   value: counts.active,   color: '#ffd700' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: '8px', padding: '4px 12px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#8b949e' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#1a2a1a', border: '1px solid #238636',
            borderRadius: '20px', padding: '4px 12px',
            fontSize: '12px', color: '#3fb950'
          }}>● Live</span>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{
              background: 'none', border: '1px solid #30363d', borderRadius: '6px',
              padding: '4px 10px', fontSize: '12px', color: '#8b949e', cursor: 'pointer'
            }}
          >Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar — alert feed */}
        <div style={{
          width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #21262d', background: '#0d1117'
        }}>
          {/* Search + filter */}
          <div style={{ padding: '12px', borderBottom: '1px solid #21262d' }}>
            <input
              style={{
                width: '100%', background: '#161b22', border: '1px solid #30363d',
                borderRadius: '6px', padding: '8px 12px', fontSize: '13px',
                color: '#e6edf3', outline: 'none', boxSizing: 'border-box', marginBottom: '8px'
              }}
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? '#21262d' : 'none',
                  border: `1px solid ${filter === f ? '#58a6ff' : '#30363d'}`,
                  borderRadius: '4px', padding: '3px 8px',
                  fontSize: '11px', color: filter === f ? '#58a6ff' : '#8b949e',
                  cursor: 'pointer', textTransform: 'capitalize'
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Alert list */}
          <AlertFeed alerts={filtered} loading={loading} selected={selected} />
        </div>

        {/* Right — map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <EmergencyMap alerts={filtered} selected={selected} />

          {/* Selected alert detail overlay */}
          {selected && (
            <div style={{
              position: 'absolute', bottom: '20px', right: '20px',
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: '10px', padding: '16px', width: '280px',
              zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <SeverityBadge severity={selected.severity} />
                <span style={{ fontSize: '11px', color: '#8b949e' }}>Score: {selected.urgencyScore}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#e6edf3' }}>
                {(selected.emergencyType || 'unknown').toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5, marginBottom: '8px' }}>
                {(selected.cleanedText || '').slice(0, 150)}...
              </div>
              <div style={{ fontSize: '11px', color: '#58a6ff' }}>
                📍 {selected.locationText || selected.address || 'Location unknown'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}