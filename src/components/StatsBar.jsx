import React, { useState, useEffect, useRef } from 'react';

/** Animates a number from prev to next */
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else prevRef.current = end;
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display.toLocaleString()}{suffix}</span>;
};

const StatCard = ({ label, value, suffix = '', sub, color, icon, trend }) => (
  <div className="glass-card" style={{ padding: '20px 24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: 10,
        background: `${color}22`,
        border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {icon}
      </div>
      {trend !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: trend > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
          background: trend > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          padding: '2px 8px', borderRadius: 20,
        }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
      <AnimatedNumber value={value} suffix={suffix} />
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

const StatsBar = ({ crowdData }) => {
  const totalAttendees  = crowdData.totalAttendees || crowdData.coordinates?.length || 0;
  const criticalZones   = crowdData.zones?.filter(z => z.density > 85).length || 0;
  const activeAlerts    = crowdData.alerts?.length || 0;
  const openGates       = crowdData.gates?.filter(g => g.status === 'OPEN').length || 0;
  const avgWait         = crowdData.gates
    ? Math.round(crowdData.gates.reduce((s, g) => s + (g.waitMinutes || 0), 0) / crowdData.gates.length)
    : 0;
  const congestedGates  = crowdData.gates?.filter(g => g.status === 'CONGESTED').length || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 24,
      animation: 'slideDown 0.4s ease',
    }}
      role="region"
      aria-label="Live Event Statistics"
    >
      <StatCard
        label="Total Attendees"
        value={totalAttendees}
        icon="👥"
        color="var(--accent-blue)"
        sub="Simulated attendees"
      />
      <StatCard
        label="Critical Zones"
        value={criticalZones}
        icon="🔴"
        color={criticalZones > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}
        sub={criticalZones > 0 ? 'Immediate attention needed' : 'All zones safe'}
        trend={criticalZones > 0 ? 12 : undefined}
      />
      <StatCard
        label="Open Gates"
        value={openGates}
        suffix={`/${crowdData.gates?.length || 5}`}
        icon="🚪"
        color={congestedGates > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'}
        sub={congestedGates > 0 ? `${congestedGates} congested` : 'All gates flowing'}
      />
      <StatCard
        label="Avg Wait Time"
        value={avgWait}
        suffix=" min"
        icon="⏱️"
        color={avgWait > 8 ? 'var(--accent-yellow)' : 'var(--accent-green)'}
        sub={`${activeAlerts} active alerts`}
      />
    </div>
  );
};

export default React.memo(StatsBar);
