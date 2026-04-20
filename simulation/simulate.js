/**
 * CrowdSense AI — 10,000 User Simulation Script
 *
 * This script simulates up to 10,000 attendees at a real event venue.
 * It generates realistic GPS coordinates, simulates crowd movement,
 * gate queuing, and surge events — then sends data to the Node.js server.
 *
 * Usage:
 *   node simulate.js [--users=10000] [--interval=2000] [--server=http://localhost:3001]
 */

// ── Configuration ─────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace('--', '').split('='))
);

const CONFIG = {
  totalUsers:        parseInt(args.users    || '3500'),
  updateIntervalMs:  parseInt(args.interval || '2000'),
  serverUrl:         args.server || 'http://localhost:3001',
  surgeChance:       0.04,
  surgeMagnitude:    { min: 15, max: 35 },
  venueBounds: {
    minLat: 12.9700, maxLat: 12.9750,
    minLng: 77.5920, maxLng: 77.5980
  }
};

// ── Zone definitions ──────────────────────────────────
const ZONES = [
  { id: 'Stage Front',  weight: 0.25, center: { lat: 12.9738, lng: 77.5950 } },
  { id: 'Stage Left',   weight: 0.12, center: { lat: 12.9735, lng: 77.5932 } },
  { id: 'Stage Right',  weight: 0.12, center: { lat: 12.9735, lng: 77.5968 } },
  { id: 'Food Court',   weight: 0.20, center: { lat: 12.9720, lng: 77.5950 } },
  { id: 'Entry Plaza',  weight: 0.18, center: { lat: 12.9705, lng: 77.5945 } },
  { id: 'Exit Zone',    weight: 0.08, center: { lat: 12.9705, lng: 77.5960 } },
  { id: 'Parking',      weight: 0.05, center: { lat: 12.9700, lng: 77.5940 } },
];

const GATE_DEFS = [
  { id: 'Gate A', capacity: 200, queue: 45,  status: 'OPEN' },
  { id: 'Gate B', capacity: 200, queue: 110, status: 'OPEN' },
  { id: 'Gate C', capacity: 200, queue: 80,  status: 'OPEN' },
  { id: 'Gate D', capacity: 200, queue: 30,  status: 'OPEN' },
  { id: 'VIP',    capacity: 80,  queue: 8,   status: 'OPEN' },
];

// ── Helpers ───────────────────────────────────────────
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

function generateCoordinates(count) {
  const cumW = [];
  let cum = 0;
  ZONES.forEach(z => { cum += z.weight; cumW.push({ zone: z, threshold: cum }); });

  return Array.from({ length: count }, () => {
    const r = Math.random();
    const z = cumW.find(w => r <= w.threshold)?.zone || ZONES[0];
    return {
      lat: clamp(z.center.lat + (Math.random() + Math.random() + Math.random() - 1.5) * 0.0015, CONFIG.venueBounds.minLat, CONFIG.venueBounds.maxLat),
      lng: clamp(z.center.lng + (Math.random() + Math.random() + Math.random() - 1.5) * 0.0015, CONFIG.venueBounds.minLng, CONFIG.venueBounds.maxLng),
    };
  });
}

function assignToZones(coordinates) {
  const counts = {};
  ZONES.forEach(z => { counts[z.id] = 0; });
  const MAX_PER_ZONE = Math.ceil(CONFIG.totalUsers / ZONES.length) * 1.5;

  for (const c of coordinates) {
    let min = Infinity, nearest = ZONES[0].id;
    for (const z of ZONES) {
      const d = (c.lat - z.center.lat) ** 2 + (c.lng - z.center.lng) ** 2;
      if (d < min) { min = d; nearest = z.id; }
    }
    counts[nearest]++;
  }

  return ZONES.map(z => ({
    id: z.id,
    density: Math.min(100, Math.ceil((counts[z.id] / MAX_PER_ZONE) * 100)),
    count: counts[z.id],
    center: z.center,
  }));
}

function tickGates(gates) {
  return gates.map(g => {
    if (g.status === 'CLOSED') return g;
    const arrival = rand(3, 14);
    const process = rand(8, 18);
    const newQ = Math.max(0, Math.round(g.queue + arrival - process));
    const pct = Math.round((newQ / g.capacity) * 100);
    return {
      ...g,
      queue: newQ,
      capacityPct: Math.min(100, pct),
      waitMinutes: Math.ceil(newQ / 12),
      status: pct > 80 ? 'CONGESTED' : 'OPEN',
    };
  });
}

async function postToServer(path, body) {
  try {
    const res = await fetch(`${CONFIG.serverUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Main Loop ─────────────────────────────────────────
async function run() {
  console.log(`\n🟢 CrowdSense AI Simulation Started`);
  console.log(`👥 Users: ${CONFIG.totalUsers.toLocaleString()}`);
  console.log(`🔁 Interval: ${CONFIG.updateIntervalMs}ms`);
  console.log(`🌐 Server: ${CONFIG.serverUrl}\n`);

  let coordinates = generateCoordinates(CONFIG.totalUsers);
  let gates       = [...GATE_DEFS];
  let tick        = 0;

  const loop = setInterval(async () => {
    tick++;

    // Drift coordinates
    coordinates = coordinates.map(c => ({
      lat: clamp(c.lat + (Math.random() - 0.5) * 0.00008, CONFIG.venueBounds.minLat, CONFIG.venueBounds.maxLat),
      lng: clamp(c.lng + (Math.random() - 0.5) * 0.00008, CONFIG.venueBounds.minLng, CONFIG.venueBounds.maxLng),
    }));

    // Crowd surge
    if (Math.random() < CONFIG.surgeChance) {
      const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
      const n = Math.floor(CONFIG.totalUsers * 0.04);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * coordinates.length);
        coordinates[idx] = {
          lat: clamp(zone.center.lat + rand(-0.001, 0.001), CONFIG.venueBounds.minLat, CONFIG.venueBounds.maxLat),
          lng: clamp(zone.center.lng + rand(-0.001, 0.001), CONFIG.venueBounds.minLng, CONFIG.venueBounds.maxLng),
        };
      }
      console.log(`⚡ Tick ${tick}: Surge in ${zone.id}`);
    }

    gates = tickGates(gates);
    const zones = assignToZones(coordinates);

    // Generate alerts
    const alerts = [];
    const critZone = zones.find(z => z.density > 85);
    const congestGate = gates.find(g => g.status === 'CONGESTED');
    if (critZone)  alerts.push({ id: `a-${Date.now()}`, ts: Date.now(), type: 'CRITICAL', text: `Critical density in ${critZone.id}` });
    if (congestGate) alerts.push({ id: `a-${Date.now()+1}`, ts: Date.now()+1, type: 'WARNING', text: `${congestGate.id} is congested (wait ~${congestGate.waitMinutes}min)` });

    const payload = {
      zones,
      gates,
      alerts,
      totalAttendees: CONFIG.totalUsers,
      tick,
    };

    const ok = await postToServer('/api/simulation/tick', payload);
    if (!ok && tick === 1) {
      console.warn('⚠️  Server not reachable. Start server with: cd server && npm install && npm start');
    }

    // Log status every 10 ticks
    if (tick % 10 === 0) {
      const critCount = zones.filter(z => z.density > 85).length;
      const congestCount = gates.filter(g => g.status === 'CONGESTED').length;
      console.log(`📊 Tick ${tick} | Zones: ${zones.length} | Critical: ${critCount} | Congested Gates: ${congestCount}`);
    }
  }, CONFIG.updateIntervalMs);

  process.on('SIGINT', () => {
    clearInterval(loop);
    console.log('\n🔴 Simulation stopped.');
    process.exit(0);
  });
}

run();
