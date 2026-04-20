/**
 * CrowdSense AI — Scenario Test Runner
 * Runs predefined crowd scenarios:
 *   node scenarios.js --scenario=surge
 *   node scenarios.js --scenario=evacuation
 *   node scenarios.js --scenario=gate-closure
 */

const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace('--', '').split('='))
);
const SCENARIO = args.scenario || 'surge';
const SERVER   = args.server   || 'http://localhost:3001';

const post = async (path, body) => {
  const res = await fetch(`${SERVER}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

const patch = async (path, body) => {
  const res = await fetch(`${SERVER}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── SCENARIO: Crowd Surge ─────────────────────────────
async function runSurgeScenario() {
  console.log('🌊 Scenario: Crowd Surge in Stage Front');
  console.log('Step 1: Generating 8,000 users moving toward Stage Front...\n');

  for (let i = 0; i < 5; i++) {
    await post('/api/simulation/tick', {
      zones: [
        { id: 'Stage Front', density: 60 + i * 8, count: 500 + i * 100 },
        { id: 'Stage Left',  density: 45 + i * 4 },
        { id: 'Food Court',  density: 30 },
        { id: 'Entry Plaza', density: 20 },
      ],
      gates: [
        { id: 'Gate A', capacity: 200, queue: 60 + i * 20, status: 'OPEN', capacityPct: 30 + i * 10 },
        { id: 'Gate B', capacity: 200, queue: 80 + i * 15, status: 'OPEN', capacityPct: 40 + i * 8  },
      ],
      totalAttendees: 8000,
    });
    console.log(`  Tick ${i+1}: Stage Front density = ${60 + i * 8}%`);
    await sleep(1000);
  }

  // Trigger critical alert
  await post('/api/alerts', { type: 'CRITICAL', text: '🚨 Stage Front has reached CRITICAL density. Crowd crush risk HIGH.' });
  console.log('\n✅ Surge scenario complete. Check dashboard for alerts.');
}

// ── SCENARIO: Evacuation ──────────────────────────────
async function runEvacuationScenario() {
  console.log('🚨 Scenario: Emergency Evacuation Drill');
  console.log('Step 1: Setting all zones to high density...\n');

  await post('/api/simulation/tick', {
    zones: [
      { id: 'Stage Front',  density: 95 },
      { id: 'Stage Left',   density: 88 },
      { id: 'Stage Right',  density: 91 },
      { id: 'Food Court',   density: 75 },
      { id: 'Entry Plaza',  density: 40 },
      { id: 'Exit Zone',    density: 20 },
    ],
    totalAttendees: 10000,
    alerts: [{ id: `evac-drill-${Date.now()}`, ts: Date.now(), type: 'EMERGENCY', text: '🆘 EVACUATION DRILL INITIATED. All staff to positions.' }],
    gates: [],
  });

  await sleep(500);
  await post('/api/emergency/evacuate', {});
  console.log('🚨 Evacuation triggered!\n');

  // Gradually reduce density
  for (let i = 0; i < 4; i++) {
    await sleep(1500);
    await post('/api/simulation/tick', {
      zones: [
        { id: 'Stage Front',  density: 80 - i * 15 },
        { id: 'Stage Left',   density: 70 - i * 15 },
        { id: 'Exit Zone',    density: 40 + i * 10 },
        { id: 'Parking',      density: 20 + i * 15 },
      ],
      totalAttendees: 10000 - i * 800,
    });
    console.log(`  Evacuation progress: ${25 * (i + 1)}% cleared`);
  }

  console.log('\n✅ Evacuation scenario complete.');
}

// ── SCENARIO: Gate Closure ────────────────────────────
async function runGateClosureScenario() {
  console.log('🔒 Scenario: Gate B sudden closure (simulated security incident)');

  await patch('/api/gates/Gate B', { status: 'CLOSED' });
  console.log('Step 1: Gate B closed. Simulating redistribution...\n');

  for (let i = 0; i < 3; i++) {
    await sleep(1000);
    await post('/api/simulation/tick', {
      gates: [
        { id: 'Gate A', capacity: 200, queue: 80 + i * 30, status: 'CONGESTED', capacityPct: 40 + i * 15 },
        { id: 'Gate B', capacity: 200, queue: 0,            status: 'CLOSED',    capacityPct: 0           },
        { id: 'Gate C', capacity: 200, queue: 60 + i * 20, status: 'OPEN',      capacityPct: 30 + i * 10 },
        { id: 'Gate D', capacity: 200, queue: 70 + i * 25, status: 'OPEN',      capacityPct: 35 + i * 12 },
      ],
      totalAttendees: 5000,
    });
    await post('/api/alerts', { type: 'WARNING', text: `Gate B is CLOSED. Redirecting traffic to Gate A, C, D. Additional wait of ${3 + i} minutes.` });
    console.log(`  Tick ${i+1}: Traffic redistributed`);
  }

  console.log('\n✅ Gate closure scenario complete.');
}

// ── Run ───────────────────────────────────────────────
(async () => {
  console.log(`\n🎯 CrowdSense AI — Running scenario: ${SCENARIO.toUpperCase()}\n`);

  try {
    switch (SCENARIO) {
      case 'surge':        await runSurgeScenario();       break;
      case 'evacuation':   await runEvacuationScenario();  break;
      case 'gate-closure': await runGateClosureScenario(); break;
      default:
        console.error(`Unknown scenario: ${SCENARIO}`);
        console.error('Available: surge, evacuation, gate-closure');
    }
  } catch (err) {
    console.error('Scenario failed:', err.message);
    console.error('Make sure the server is running: cd server && npm start');
  }
})();
