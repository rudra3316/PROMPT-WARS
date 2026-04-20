import React, { useMemo } from 'react';

const VENUE_LAYOUT = {
  zones: [
    { id: 'Stage Front',  label: 'Stage\nFront',  col: 2, row: 1, span: 2 },
    { id: 'Stage Left',   label: 'Stage\nLeft',   col: 1, row: 1, span: 1 },
    { id: 'Stage Right',  label: 'Stage\nRight',  col: 4, row: 1, span: 1 },
    { id: 'Food Court',   label: 'Food\nCourt',   col: 2, row: 2, span: 2 },
    { id: 'Entry Plaza',  label: 'Entry\nPlaza',  col: 1, row: 3, span: 2 },
    { id: 'Exit Zone',    label: 'Exit\nZone',    col: 3, row: 3, span: 2 },
    { id: 'Parking',      label: 'Parking',       col: 2, row: 4, span: 2 },
  ],
  cols: 4, rows: 4,
};

const getDensityStyle = (density) => {
  if (density > 85) return { bg: 'rgba(239,68,68,0.25)',   border: '#EF4444', glow: 'rgba(239,68,68,0.5)',   text: '#EF4444', label: 'CRITICAL' };
  if (density > 65) return { bg: 'rgba(245,158,11,0.2)',   border: '#F59E0B', glow: 'rgba(245,158,11,0.35)', text: '#F59E0B', label: 'HIGH' };
  if (density > 40) return { bg: 'rgba(59,130,246,0.15)',  border: '#3B82F6', glow: 'rgba(59,130,246,0.25)', text: '#60A5FA', label: 'MODERATE' };
  return            { bg: 'rgba(16,185,129,0.12)',  border: '#10B981', glow: 'rgba(16,185,129,0.2)',  text: '#10B981', label: 'SAFE' };
};

const Legend = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    {[
      { label: 'Safe (0–40%)',     color: '#10B981' },
      { label: 'Moderate (40–65%)',color: '#3B82F6' },
      { label: 'High (65–85%)',    color: '#F59E0B' },
      { label: 'Critical (85%+)', color: '#EF4444' },
    ].map(({ label, color }) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.8 }} />
        {label}
      </div>
    ))}
  </div>
);

const VenueMap = ({ zones }) => {
  const densityMap = useMemo(() => {
    const map = {};
    (zones || []).forEach(z => { map[z.id] = z.density || 0; });
    return map;
  }, [zones]);

  const totalPeople = useMemo(() =>
    (zones || []).reduce((s, z) => s + (z.count || 0), 0),
    [zones]
  );

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Venue Density Map</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalPeople.toLocaleString()} people across {VENUE_LAYOUT.zones.length} zones
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
          <span className="status-dot live" />
          Live Feed
        </div>
      </div>

      {/* Grid Map */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${VENUE_LAYOUT.cols}, 1fr)`,
        gridTemplateRows: `repeat(${VENUE_LAYOUT.rows}, 90px)`,
        gap: 8,
        marginBottom: 20,
        padding: 16,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        {VENUE_LAYOUT.zones.map(zone => {
          const density = densityMap[zone.id] || 0;
          const style   = getDensityStyle(density);
          const isCrit  = density > 85;

          return (
            <div
              key={zone.id}
              style={{
                gridColumn: `${zone.col} / span ${zone.span}`,
                gridRow: `${zone.row}`,
                background: style.bg,
                border: `1.5px solid ${style.border}`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 8, textAlign: 'center',
                transition: 'all 0.5s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: isCrit ? 'flicker 1.5s infinite' : 'none',
                boxShadow: isCrit ? `0 0 16px ${style.glow}` : 'none',
                cursor: 'default',
              }}
              role="img"
              aria-label={`${zone.id}: ${density}% density`}
              title={`${zone.id}: ${Math.round(density)}% (${style.label})`}
            >
              {/* Density fill bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${density}%`, background: `${style.border}18`,
                borderRadius: '0 0 8px 8px',
                transition: 'height 0.8s ease',
                pointerEvents: 'none',
              }} />

              <div style={{ fontSize: 10, fontWeight: 700, color: style.text, letterSpacing: '0.06em', textTransform: 'uppercase', zIndex: 1, whiteSpace: 'pre-line' }}>
                {zone.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: style.text, lineHeight: 1.1, zIndex: 1, marginTop: 4 }}>
                {Math.round(density)}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', zIndex: 1 }}>{style.label}</div>
            </div>
          );
        })}
      </div>

      <Legend />
    </div>
  );
};

export default React.memo(VenueMap);
