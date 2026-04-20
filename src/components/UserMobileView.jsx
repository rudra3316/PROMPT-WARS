import React, { useState, useEffect, useRef } from 'react';
import { routeUser } from '../services/routing';

/** QR Code SVG simulation */
const QRCode = () => {
  const [scanComplete, setScanComplete] = useState(false);
  const [scanPct, setScanPct] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPct(p => {
        if (p >= 100) { setScanComplete(true); clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }}>
      {/* QR grid simulation */}
      <svg width={160} height={160} style={{ borderRadius: 8, background: 'white', padding: 12 }}>
        {/* Corner markers */}
        {[[8,8],[112,8],[8,112]].map(([x,y], i) => (
          <g key={i}>
            <rect x={x} y={y} width={38} height={38} fill="black" rx={3} />
            <rect x={x+5} y={y+5} width={28} height={28} fill="white" rx={2} />
            <rect x={x+10} y={y+10} width={18} height={18} fill="black" rx={1} />
          </g>
        ))}
        {/* Data cells */}
        {Array.from({ length: 80 }).map((_, i) => {
          const x = 52 + (i % 8) * 10;
          const y = 8 + Math.floor(i / 8) * 10;
          if (Math.random() > 0.5) return null;
          return <rect key={i} x={x} y={y} width={8} height={8} fill="black" />;
        })}
        {/* Bottom right data */}
        {Array.from({ length: 40 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 112 + col * 10;
          const y = 50 + row * 10;
          if (y > 140 || x > 150) return null;
          if (Math.random() > 0.5) return null;
          return <rect key={`b-${i}`} x={x} y={y} width={8} height={8} fill="black" />;
        })}
      </svg>

      {/* Scan line */}
      {!scanComplete && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
          boxShadow: '0 0 10px #3B82F6',
          top: `${scanPct}%`,
          transition: 'top 0.05s linear',
        }} />
      )}

      {/* Success overlay */}
      {scanComplete && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(16,185,129,0.9)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderRadius: 8,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ fontSize: 12, color: 'white', fontWeight: 700, marginTop: 6 }}>Verified</div>
        </div>
      )}
    </div>
  );
};

const TABS = ['Entry', 'Map', 'Navigate', 'Alerts'];
const TAB_ICONS = { Entry: '🎫', Map: '🗺️', Navigate: '🧭', Alerts: '🔔' };

const UserMobileView = ({ crowdData }) => {
  const [activeTab, setActiveTab] = useState('Entry');
  const [selectedZone, setSelectedZone] = useState('Entry Plaza');

  const routing = routeUser(selectedZone, crowdData.gates || [], crowdData.zones || []);
  const { recommendedGate, allGates } = routing;

  const alertCount = crowdData.alerts?.filter(a => a.type === 'CRITICAL' || a.type === 'WARNING').length || 0;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      padding: '32px 20px', minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.08) 0%, transparent 60%)',
    }}>
      {/* Phone frame */}
      <div style={{
        width: 390, maxWidth: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 44,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '10px solid #0A0A0A',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 780,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          padding: '14px 24px 8px',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
          background: 'var(--bg-surface)',
        }}>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div style={{
            width: 100, height: 24, background: '#0A0A0A',
            borderRadius: 12, margin: '0 auto',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          }} />
          <span>📶 🔋 94%</span>
        </div>

        {/* App bar */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            CrowdSense<span style={{ color: 'var(--accent-blue)' }}>.ai</span>
          </h1>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 22 }}>🔔</div>
            {alertCount > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, background: 'var(--accent-red)',
                borderRadius: '50%', fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
                {alertCount}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px' }}>
          
          {/* ENTRY TAB */}
          {activeTab === 'Entry' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your Ticket</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                Scan at entry gate for access
              </p>

              <QRCode />

              <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  #CS-2026-RUDRA-A4F2
                </div>
              </div>

              {recommendedGate && (
                <div style={{
                  padding: '16px 18px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 16, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ✦ Recommended Entry
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{recommendedGate.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        ~{recommendedGate.waitMinutes || Math.ceil(recommendedGate.queue / 12)} min wait
                        · Queue: {recommendedGate.queue}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: 'var(--accent-green)',
                        background: 'rgba(16,185,129,0.15)',
                        padding: '4px 12px', borderRadius: 20,
                      }}>
                        BEST ROUTE
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button style={{
                width: '100%', padding: '14px',
                background: 'var(--grad-blue)', border: 'none',
                borderRadius: 14, color: 'white', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', boxShadow: '0 6px 20px var(--accent-blue-glow)',
                fontFamily: 'inherit',
              }}>
                Show at Gate
              </button>
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === 'Map' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Live Venue Map</h2>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, marginBottom: 16,
              }}>
                {crowdData.zones?.map(zone => {
                  let color = '#10B981';
                  if (zone.density > 65) color = '#F59E0B';
                  if (zone.density > 85) color = '#EF4444';
                  return (
                    <div key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      style={{
                        padding: '12px', borderRadius: 10,
                        background: `rgba(${color === '#EF4444' ? '239,68,68' : color === '#F59E0B' ? '245,158,11' : '16,185,129'}, 0.1)`,
                        border: `1.5px solid ${selectedZone === zone.id ? color : color + '44'}`,
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'center',
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{Math.round(zone.density)}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{zone.id}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                padding: '12px 14px',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 12, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span className="status-dot live" />
                You are near: <strong>{selectedZone}</strong>
              </div>
            </div>
          )}

          {/* NAVIGATE TAB */}
          {activeTab === 'Navigate' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Smart Navigation</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                AI-optimized gate recommendations
              </p>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Select your zone:</div>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="input" style={{ marginBottom: 20, fontSize: 13 }}
              >
                {['Stage Front','Stage Left','Stage Right','Food Court','Entry Plaza','Exit Zone','Parking']
                  .map(z => <option key={z} value={z}>{z}</option>)}
              </select>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(allGates || []).sort((a,b) => a.score - b.score).map((gate, i) => {
                  const isBest = i === 0 && gate.score !== Infinity;
                  return (
                    <div key={gate.id} style={{
                      padding: '14px 16px',
                      background: isBest ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${isBest ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                      borderRadius: 14,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 32, height: 32,
                        background: isBest ? 'var(--accent-green)' : 'var(--border)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                      }}>
                        {i+1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                          {gate.id}
                          {isBest && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--accent-green)' }}>● BEST</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Queue: {gate.queue} · Wait: {gate.waitMinutes}min · {gate.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'Alerts' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {crowdData.alerts?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🟢</div>
                    <div>No active alerts</div>
                  </div>
                ) : (
                  [...crowdData.alerts].reverse().map(a => (
                    <div key={a.id} style={{
                      padding: '14px 16px',
                      background: a.type === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
                      border: `1px solid ${a.type === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      borderRadius: 12,
                    }}>
                      <div style={{ fontSize: 11, color: a.type === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-yellow)', fontWeight: 700, marginBottom: 4 }}>
                        {a.type === 'CRITICAL' ? '🚨' : '⚠️'} {a.type}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{a.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(12,17,32,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', padding: '10px 0 20px',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: 10, fontWeight: activeTab === tab ? 700 : 500,
                fontFamily: 'inherit', transition: 'all 0.2s',
                position: 'relative',
              }}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              <span style={{ fontSize: 20 }}>{TAB_ICONS[tab]}</span>
              {tab}
              {tab === 'Alerts' && alertCount > 0 && (
                <div style={{
                  position: 'absolute', top: 2, right: '25%',
                  width: 8, height: 8, background: 'var(--accent-red)', borderRadius: '50%',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UserMobileView);
