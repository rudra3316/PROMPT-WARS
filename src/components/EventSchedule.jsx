import React, { useMemo } from 'react';

const getTime = (offsetMins) => {
  const d = new Date(Date.now() + offsetMins * 60000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ACTS = [
  { id: 1, name: 'Neon Nexus',   stage: 'Main Stage',   duration: 60, offset: -90,  genre: 'Electronic' },
  { id: 2, name: 'Cyber Sync',   stage: 'Stage Right',  duration: 45, offset: -15,  genre: 'Hip-Hop' },
  { id: 3, name: 'Echo Base',    stage: 'Food Court',   duration: 30, offset: 5,    genre: 'Ambient' },
  { id: 4, name: 'The Glitch',   stage: 'Main Stage',   duration: 75, offset: 50,   genre: 'Bass' },
  { id: 5, name: 'Synthwave DX', stage: 'Stage Left',   duration: 60, offset: 135,  genre: 'Synthwave' },
  { id: 6, name: 'DJ Horizon',   stage: 'Main Stage',   duration: 90, offset: 210,  genre: 'House' },
  { id: 7, name: 'Voltage',      stage: 'Stage Right',  duration: 45, offset: 315,  genre: 'Techno' },
];

const STATUS = (offset, duration) => {
  if (offset + duration < 0)  return 'past';
  if (offset < 0)             return 'live';
  if (offset < 30)            return 'next';
  return 'upcoming';
};

const STATUS_STYLE = {
  live:     { badge: 'badge-red',    icon: '🔴', glow: true  },
  next:     { badge: 'badge-yellow', icon: '⏭️', glow: false },
  upcoming: { badge: 'badge-blue',   icon: '🎵', glow: false },
  past:     { badge: 'badge-purple', icon: '✓',  glow: false, muted: true },
};

const EventSchedule = () => {
  const acts = useMemo(() => ACTS.map(a => ({
    ...a,
    status: STATUS(a.offset, a.duration),
    startTime: getTime(a.offset),
    endTime: getTime(a.offset + a.duration),
  })), []);

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Event Schedule</h2>
        <span style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="status-dot live" /> {acts.filter(a => a.status === 'live').length} Live Now
        </span>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
          {acts.map(act => {
            const st = STATUS_STYLE[act.status];
            return (
              <div key={act.id} style={{
                width: 180,
                padding: '14px 16px',
                background: act.status === 'past' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${act.status === 'live' ? 'rgba(239,68,68,0.4)' : act.status === 'next' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                borderRadius: 12,
                opacity: act.status === 'past' ? 0.5 : 1,
                boxShadow: st.glow ? '0 0 16px rgba(239,68,68,0.2)' : 'none',
                flexShrink: 0,
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{st.icon}</span>
                  <span className={`badge ${st.badge}`} style={{ fontSize: 9 }}>
                    {act.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: act.status === 'past' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {act.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>📍 {act.stage}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🕒 {act.startTime} – {act.endTime}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>🎧 {act.genre}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventSchedule);
