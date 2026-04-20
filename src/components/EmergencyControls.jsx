import React, { useState, useRef } from 'react';
import { getEvacuationPath } from '../services/routing';

const ConfirmButton = ({ label, onConfirm, variant = 'danger', disabled = false }) => {
  const [stage, setStage] = useState(0); // 0: default, 1: confirm
  const timerRef = useRef(null);

  const handleClick = () => {
    if (stage === 0) {
      setStage(1);
      timerRef.current = setTimeout(() => setStage(0), 4000);
    } else {
      clearTimeout(timerRef.current);
      setStage(0);
      onConfirm();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      style={{
        width: '100%', justifyContent: 'center', padding: '12px',
        fontSize: 13, fontWeight: 700,
        opacity: disabled ? 0.5 : 1,
        background: stage === 1
          ? (variant === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)')
          : undefined,
        border: stage === 1 ? `2px solid ${variant === 'danger' ? 'var(--accent-red)' : 'var(--accent-yellow)'}` : 'none',
        color: stage === 1 ? (variant === 'danger' ? 'var(--accent-red)' : 'var(--accent-yellow)') : 'white',
        transition: 'all 0.2s',
      }}
      aria-pressed={stage === 1}
    >
      {stage === 1 ? `⚠️ Confirm — Are you sure?` : label}
    </button>
  );
};

const BroadcastModal = ({ onSend, onClose }) => {
  const [msg, setMsg] = useState('');
  const templates = [
    'Please move to the designated zones. Security personnel are guiding you.',
    'Gate B is now open. Please proceed to Gate B for faster entry.',
    'Emergency alert: Please remain calm and follow staff instructions.',
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 28 }}
        role="dialog" aria-modal="true" aria-labelledby="broadcast-title">
        <h2 id="broadcast-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          📢 Broadcast Message
        </h2>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quick templates:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {templates.map((t, i) => (
              <button key={i} className="btn btn-ghost btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', padding: '8px 12px' }}
                onClick={() => setMsg(t)}>
                {t.slice(0, 60)}...
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="input" rows={4} value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Enter custom message to broadcast to all attendees..."
          aria-label="Broadcast message"
          style={{ resize: 'none', marginBottom: 14 }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSend(msg); onClose(); }} disabled={!msg.trim()}>
            📤 Broadcast
          </button>
        </div>
      </div>
    </div>
  );
};

const EmergencyControls = ({ onEvacuate, onLockAll, onBroadcast, zones }) => {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [evacuating, setEvacuating] = useState(false);
  const [evacPath, setEvacPath] = useState(null);

  const handleEvacuate = () => {
    setEvacuating(true);
    const path = getEvacuationPath('Stage Front', zones || []);
    setEvacPath(path);
    onEvacuate?.();
  };

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 20 }}>🔴</span>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Emergency Controls</h2>
        {evacuating && (
          <span className="badge badge-red" style={{ marginLeft: 'auto', animation: 'pulse-ring 1.5s infinite' }}>
            ACTIVE
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ConfirmButton
          label="🚨 Trigger Evacuation"
          onConfirm={handleEvacuate}
          variant="danger"
        />
        <button
          className="btn"
          onClick={() => setShowBroadcast(true)}
          style={{
            width: '100%', justifyContent: 'center', padding: '12px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
            color: 'var(--accent-yellow)', fontWeight: 700, fontSize: 13,
          }}
        >
          📢 Broadcast Alert
        </button>
        <ConfirmButton
          label="🔒 Lock All Gates"
          onConfirm={() => onLockAll?.()}
          variant="ghost"
        />
      </div>

      {/* Evacuation path display */}
      {evacuating && evacPath && (
        <div style={{
          marginTop: 16, padding: '14px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10,
          animation: 'pulse-red 2s infinite',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            🗺️ EVACUATION ROUTE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {evacPath.map((zone, i) => (
              <React.Fragment key={zone}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  padding: '3px 8px', borderRadius: 20,
                  color: 'var(--accent-red)',
                }}>
                  {zone}
                </span>
                {i < evacPath.length - 1 && (
                  <span style={{ color: 'var(--accent-red)', fontSize: 10 }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {showBroadcast && (
        <BroadcastModal
          onSend={(msg) => { onBroadcast?.(msg); }}
          onClose={() => setShowBroadcast(false)}
        />
      )}
    </div>
  );
};

export default EmergencyControls;
