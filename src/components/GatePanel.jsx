import React from 'react';

const CircularProgress = ({ pct, color, size = 52 }) => {
  const r  = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
};

const getGateColor = (gate) => {
  if (gate.status === 'CLOSED')    return '#6B7280';
  if (gate.status === 'CONGESTED') return 'var(--accent-yellow)';
  if ((gate.capacityPct || 0) > 70) return 'var(--accent-orange)';
  return 'var(--accent-green)';
};

const GateCard = ({ gate, onToggle }) => {
  const pct   = gate.capacityPct || Math.round((gate.queue / gate.capacity) * 100);
  const color = getGateColor(gate);
  const isCrit = pct > 85 && gate.status !== 'CLOSED';

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        animation: isCrit ? 'flicker 2s infinite' : 'none',
        transition: 'all 0.3s',
      }}
    >
      {/* Progress Ring */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <CircularProgress pct={pct} color={color} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace',
        }}>
          {pct}%
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{gate.id}</span>
          <span className={`badge badge-${gate.status === 'OPEN' ? 'green' : gate.status === 'CONGESTED' ? 'yellow' : 'red'}`}>
            {gate.status}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Queue: <strong style={{ color: 'var(--text-primary)' }}>{gate.queue}</strong>
          &nbsp;·&nbsp;
          Wait: <strong style={{ color: 'var(--text-primary)' }}>{gate.waitMinutes ?? Math.ceil(gate.queue / 12)} min</strong>
          &nbsp;·&nbsp;
          Cap: {gate.capacity}
        </div>

        {/* Mini progress bar */}
        <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct > 80 ? 'var(--accent-red)' : pct > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)',
            borderRadius: 10,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Toggle */}
      {onToggle && (
        <button
          onClick={() => onToggle(gate.id, gate.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
          className="btn btn-sm btn-ghost"
          style={{
            color: gate.status === 'CLOSED' ? 'var(--accent-green)' : 'var(--accent-red)',
            borderColor: gate.status === 'CLOSED' ? 'var(--accent-green)' : 'var(--accent-red)',
            flexShrink: 0,
          }}
          aria-label={`${gate.status === 'CLOSED' ? 'Open' : 'Close'} ${gate.id}`}
        >
          {gate.status === 'CLOSED' ? '▶ Open' : '✕ Close'}
        </button>
      )}
    </div>
  );
};

const GatePanel = ({ gates, onToggleGate }) => {
  if (!gates?.length) return null;

  const openCount    = gates.filter(g => g.status === 'OPEN').length;
  const closedCount  = gates.filter(g => g.status === 'CLOSED').length;
  const congestCount = gates.filter(g => g.status === 'CONGESTED').length;

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Gate Control</h2>
        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
          <span className="badge badge-green">{openCount} Open</span>
          {congestCount > 0 && <span className="badge badge-yellow">{congestCount} Congested</span>}
          {closedCount  > 0 && <span className="badge badge-red">{closedCount} Closed</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gates.map(gate => (
          <GateCard key={gate.id} gate={gate} onToggle={onToggleGate} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(GatePanel);
