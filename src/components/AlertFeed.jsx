import React, { useRef, useEffect } from 'react';

const ALERT_CONFIG = {
  CRITICAL:  { icon: '🚨', color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   label: 'CRITICAL' },
  WARNING:   { icon: '⚠️',  color: 'var(--accent-yellow)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: 'WARNING'  },
  INFO:      { icon: 'ℹ️',  color: 'var(--accent-blue)',   bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',  label: 'INFO'     },
  EMERGENCY: { icon: '🆘',  color: 'var(--accent-red)',    bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)',   label: 'EMERGENCY'},
  SAFE:      { icon: '✅',  color: 'var(--accent-green)',  bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  label: 'ALL CLEAR'},
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)  return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff/60)}m ago`;
};

const AlertItem = ({ alert, index }) => {
  const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.INFO;

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '12px 14px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      animation: `alert-in 0.35s ease ${index * 0.05}s both`,
      transition: 'all 0.3s',
    }}>
      <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }} aria-hidden="true">
        {cfg.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span className="badge" style={{
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
            fontSize: 9, letterSpacing: '0.08em',
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {timeAgo(alert.ts || alert.id)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {alert.text}
        </p>
      </div>
    </div>
  );
};

const AlertFeed = ({ alerts }) => {
  const listRef = useRef(null);
  const sorted  = [...(alerts || [])].sort((a, b) => (b.ts || b.id) - (a.ts || a.id)).slice(0, 15);
  const critCount = sorted.filter(a => a.type === 'CRITICAL' || a.type === 'EMERGENCY').length;

  // Auto-scroll to top when new alert arrives
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [alerts?.length]);

  return (
    <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Live Alerts</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {critCount > 0 && (
            <span className="badge badge-red" style={{ animation: 'pulse-ring 1.5s infinite' }}>
              {critCount} Critical
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sorted.length} events</span>
        </div>
      </div>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Live alert feed"
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}
      >
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14 }}>All clear — No active alerts</div>
          </div>
        ) : (
          sorted.map((alert, i) => <AlertItem key={alert.id} alert={alert} index={i} />)
        )}
      </div>
    </div>
  );
};

export default React.memo(AlertFeed);
