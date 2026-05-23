import React from 'react';

const SEV_COLOR = { critical: '#ff4757', high: '#ff8c42', medium: '#ffd700', low: '#00d4aa' };

export default function SeverityBadge({ severity }) {
  const color = SEV_COLOR[severity?.toLowerCase()] || '#5a6580';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: '#fff',
      backgroundColor: color
    }}>
      {severity || 'low'}
    </span>
  );
}
