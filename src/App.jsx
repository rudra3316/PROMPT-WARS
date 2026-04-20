import React, { useState, useEffect, useCallback } from 'react';
import './styles/main.css';
import { startSimulation } from './services/simulation';
import { loginWithGoogle } from './services/firebase';
import LoadingScreen from './components/LoadingScreen';
import StatsBar from './components/StatsBar';
import VenueMap from './components/VenueMap';
import GatePanel from './components/GatePanel';
import AlertFeed from './components/AlertFeed';
import AnalyticsChart from './components/AnalyticsChart';
import GeminiInsight from './components/GeminiInsight';
import EmergencyControls from './components/EmergencyControls';
import EventSchedule from './components/EventSchedule';
import UserMobileView from './components/UserMobileView';

/* ── Sidebar Navigation Items ─────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',   icon: '⬛', label: 'Overview'         },
  { id: 'gates',      icon: '🚪', label: 'Gates'            },
  { id: 'alerts',     icon: '🔔', label: 'Alerts'           },
  { id: 'analytics',  icon: '📊', label: 'Analytics'        },
  { id: 'schedule',   icon: '📅', label: 'Schedule'         },
  { id: 'emergency',  icon: '🆘', label: 'Emergency'        },
];

/* ── Header ──────────────────────────────────────── */
const Header = ({ view, onViewChange, crowdData, isConnected }) => {
  const critCount = crowdData?.zones?.filter(z => z.density > 85).length || 0;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--header-height)',
      background: 'rgba(12,17,32,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--grad-blue)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: 'var(--shadow-glow-blue)',
        }}>
          ◎
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
            CrowdSense<span style={{ color: 'var(--accent-blue)' }}>.ai</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Event Safety System
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 12px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
        borderRadius: 20, fontSize: 11,
      }}>
        <span className="status-dot live" />
        <span style={{ color: 'var(--text-secondary)' }}>Simulation Active</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
          {crowdData?.totalAttendees?.toLocaleString() || '—'} users
        </span>
      </div>

      {critCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 20, fontSize: 11, color: 'var(--accent-red)',
          animation: 'pulse-red 2s infinite',
        }}>
          🚨 {critCount} Critical Zone{critCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* View toggles */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
        borderRadius: 10, padding: 4,
      }}>
        {[
          { id: 'admin', label: '🖥️ Admin' },
          { id: 'user',  label: '📱 User' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => onViewChange(id)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s',
              background: view === id ? 'var(--accent-blue)' : 'transparent',
              color: view === id ? 'white' : 'var(--text-secondary)',
              boxShadow: view === id ? 'var(--shadow-glow-blue)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button onClick={loginWithGoogle}
        style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12,
          background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
          fontWeight: 600, transition: 'all 0.2s',
        }}
      >
        Sign In
      </button>
    </header>
  );
};

/* ── Sidebar ─────────────────────────────────────── */
const Sidebar = ({ activeSection, onSectionChange, alertCount }) => (
  <aside style={{
    position: 'fixed',
    top: 'var(--header-height)',
    left: 0,
    bottom: 0,
    width: 'var(--sidebar-width)',
    background: 'rgba(5,8,16,0.9)',
    borderRight: '1px solid var(--border)',
    padding: '24px 12px',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 100,
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 12 }}>
      Command Center
    </div>

    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV_ITEMS.map(({ id, icon, label }) => {
        const isActive = activeSection === id;
        const hasBadge = id === 'alerts' && alertCount > 0;

        return (
          <button key={id}
            onClick={() => onSectionChange(id)}
            className={isActive ? '' : ''}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.2s',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              position: 'relative',
              borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              textAlign: 'left', width: '100%',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {hasBadge && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                background: 'var(--accent-red)', color: 'white',
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    <div style={{ marginTop: 'auto', padding: '16px 10px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        v2.0.0-production
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
        © 2026 CrowdSense AI
      </div>
    </div>
  </aside>
);

/* ── Admin Dashboard Content ─────────────────────── */
const AdminDashboard = ({ crowdData, onGateToggle, onEvacuate, onLockAll, onBroadcast }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Row 1 */}
      <StatsBar crowdData={crowdData} />

      {/* Row 2 — 2-col layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 4fr)',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <VenueMap zones={crowdData.zones} />
          <AnalyticsChart gates={crowdData.gates} />
          <EventSchedule />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GeminiInsight crowdData={crowdData} />
          <GatePanel gates={crowdData.gates} onToggleGate={onGateToggle} />
          <EmergencyControls
            onEvacuate={onEvacuate}
            onLockAll={onLockAll}
            onBroadcast={onBroadcast}
            zones={crowdData.zones}
          />
          <div style={{ height: 360 }}>
            <AlertFeed alerts={crowdData.alerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── App Root ─────────────────────────────────────── */
function App() {
  const [view, setView] = useState('admin');
  const [activeSection, setActiveSection] = useState('overview');
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Start simulation and pipe data into state
  useEffect(() => {
    const stop = startSimulation((state) => {
      setCrowdData(prev => {
        // If prev is null (first tick), set loading to false
        if (!prev) setTimeout(() => setLoading(false), 800);
        return state;
      });
    });
    return () => stop();
  }, []);

  const handleGateToggle = useCallback((gateId, newStatus) => {
    setCrowdData(prev => ({
      ...prev,
      gates: prev.gates.map(g =>
        g.id === gateId
          ? { ...g, status: newStatus, queue: newStatus === 'CLOSED' ? 0 : g.queue, capacityPct: newStatus === 'CLOSED' ? 0 : g.capacityPct }
          : g
      )
    }));
  }, []);

  const handleEvacuate = useCallback(() => {
    // Broadcast emergency alert
    setCrowdData(prev => ({
      ...prev,
      alerts: [...(prev.alerts || []), {
        id: `evac-${Date.now()}`, ts: Date.now(),
        type: 'EMERGENCY',
        text: '🚨 EVACUATION INITIATED. All attendees please follow emergency exit signage. Security personnel are guiding you out.',
      }]
    }));
  }, []);

  const handleLockAll = useCallback(() => {
    setCrowdData(prev => ({
      ...prev,
      gates: prev.gates.map(g => ({ ...g, status: 'CLOSED', queue: 0, capacityPct: 0 }))
    }));
  }, []);

  const handleBroadcast = useCallback((msg) => {
    setCrowdData(prev => ({
      ...prev,
      alerts: [...(prev.alerts || []), {
        id: `broadcast-${Date.now()}`, ts: Date.now(),
        type: 'INFO',
        text: `📢 Broadcast: ${msg}`,
      }]
    }));
  }, []);

  if (loading || !crowdData) {
    return <LoadingScreen message="Initializing Simulation Engine..." />;
  }

  const alertCount = crowdData.alerts?.filter(a => a.type === 'CRITICAL' || a.type === 'EMERGENCY').length || 0;

  return (
    <>
      <a href="#main-content" className="sr-only skip-to-main">Skip to main content</a>

      <Header
        view={view}
        onViewChange={setView}
        crowdData={crowdData}
        isConnected={false}
      />

      {view === 'user' ? (
        <main id="main-content" style={{ marginTop: 'var(--header-height)' }}>
          <UserMobileView crowdData={crowdData} />
        </main>
      ) : (
        <>
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            alertCount={alertCount}
          />
          <main
            id="main-content"
            style={{
              marginTop: 'var(--header-height)',
              marginLeft: 'var(--sidebar-width)',
              padding: 24,
              minHeight: 'calc(100vh - var(--header-height))',
              background: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.04) 0%, transparent 50%)',
            }}
          >
            <AdminDashboard
              crowdData={crowdData}
              onGateToggle={handleGateToggle}
              onEvacuate={handleEvacuate}
              onLockAll={handleLockAll}
              onBroadcast={handleBroadcast}
            />
          </main>
        </>
      )}
    </>
  );
}

export default App;
