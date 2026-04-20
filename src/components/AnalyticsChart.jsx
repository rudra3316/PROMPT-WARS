import React, { useMemo } from 'react';

/** Pure SVG bar chart with time ticks — no dependencies */
const BarChart = ({ gates }) => {
  const maxQ = Math.max(...gates.map(g => g.queue), 50);
  const W = 100 / gates.length;

  return (
    <svg width="100%" height="120" style={{ overflow: 'visible' }} role="img" aria-label="Gate queue bar chart">
      {gates.map((gate, i) => {
        const pct = Math.max(3, (gate.queue / maxQ) * 100);
        const color = gate.status === 'CLOSED'    ? '#4B5563'
                    : gate.status === 'CONGESTED' ? '#F59E0B'
                    : gate.queue > 120            ? '#F97316'
                    : '#10B981';
        const x = i * W + W * 0.15;
        const barW = W * 0.7;
        const barH = (pct / 100) * 90;
        const y = 90 - barH;

        return (
          <g key={gate.id}>
            {/* Bar */}
            <rect
              x={`${x}%`} y={y} width={`${barW}%`} height={barH}
              fill={color} fillOpacity={0.85} rx={3}
              style={{ transition: 'all 0.5s ease' }}
            />
            {/* Value label */}
            <text x={`${x + barW/2}%`} y={y - 4} textAnchor="middle"
              fontSize={9} fill="rgba(255,255,255,0.6)" fontFamily="monospace">
              {gate.queue}
            </text>
            {/* ID label */}
            <text x={`${x + barW/2}%`} y={108} textAnchor="middle"
              fontSize={9} fill="#6B7280" fontFamily="monospace">
              {gate.id.replace('Gate ', 'G')}
            </text>
          </g>
        );
      })}
      {/* Baseline */}
      <line x1="0" x2="100%" y1="91" y2="91" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    </svg>
  );
};

const AnalyticsChart = ({ gates }) => {
  if (!gates?.length) return null;

  const totalQueue = useMemo(() => gates.reduce((s, g) => s + g.queue, 0), [gates]);
  const avgQueue   = Math.round(totalQueue / gates.length);
  const maxGate    = gates.reduce((a, b) => b.queue > a.queue ? b : a, gates[0]);
  const minGate    = gates.filter(g => g.status !== 'CLOSED').reduce((a, b) => b.queue < a.queue ? b : a, gates[0]);

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Queue Analytics</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real-time gate queue distribution</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>{totalQueue}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total in queues</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 16 }}>
        <BarChart gates={gates} />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Avg Queue',  value: avgQueue,       color: 'var(--accent-blue)' },
          { label: 'Longest',    value: `${maxGate.id} (${maxGate.queue})`, color: 'var(--accent-red)' },
          { label: 'Shortest',   value: `${minGate.id} (${minGate.queue})`, color: 'var(--accent-green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(AnalyticsChart);
