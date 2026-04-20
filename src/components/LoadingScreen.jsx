import React from 'react';

const LoadingScreen = ({ message = 'Initializing System...' }) => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'var(--bg-primary)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  }}>
    {/* Animated logo */}
    <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 32 }}>
      {/* Outer ring */}
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="3" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke="var(--accent-blue)" strokeWidth="3"
          strokeDasharray="226" strokeDashoffset="150"
          style={{ animation: 'spin 2s linear infinite', transformOrigin: '40px 40px' }}
        />
      </svg>
      {/* Inner ring */}
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="2" />
        <circle
          cx="40" cy="40" r="24" fill="none"
          stroke="var(--accent-green)" strokeWidth="2"
          strokeDasharray="150" strokeDashoffset="80"
          style={{ animation: 'spin 1.5s linear infinite reverse', transformOrigin: '40px 40px' }}
        />
      </svg>
      {/* Center icon */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 24, height: 24,
          background: 'var(--grad-blue)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-glow-blue)',
        }} />
      </div>
    </div>

    {/* Branding */}
    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
      CrowdSense<span style={{ color: 'var(--accent-blue)' }}>.ai</span>
    </h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
      Smart Event Safety & Navigation System
    </p>

    {/* Progress bar */}
    <div style={{ width: 240, height: 3, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        background: 'var(--grad-blue)',
        borderRadius: 10,
        animation: 'loading-bar 2s ease-in-out infinite',
      }} />
    </div>
    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12, fontFamily: 'monospace' }}>
      {message}
    </p>

    <style>{`
      @keyframes loading-bar {
        0%   { width: 0%; margin-left: 0; }
        50%  { width: 60%; margin-left: 20%; }
        100% { width: 0%; margin-left: 100%; }
      }
    `}</style>
  </div>
);

export default LoadingScreen;
