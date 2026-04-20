/**
 * CrowdSense AI — Advanced Simulation Engine
 * Simulates up to 10,000 users with realistic crowd behavior:
 * - GPS coordinate drift with zone affinity
 * - Gate arrival/departure queuing
 * - Crowd surge events
 * - Emergency scenarios
 */

export const CONFIG = {
  totalUsers: 3500,           // Total simulated attendees
  updateIntervalMs: 2000,     // How often state ticks
  surgeChance: 0.04,          // Probability of a crowd surge per tick
  surgeMagnitude: { min: 15, max: 35 },
  gateCapacity: 200,
  gateProcessRate: { min: 8, max: 18 },
  gateArrivalRate: { min: 2, max: 14 },
  venueBounds: {
    minLat: 12.9700, maxLat: 12.9750,
    minLng: 77.5920, maxLng: 77.5980
  }
};

/** Zone definitions with geographic centers and weights */
export const ZONES = [
  { id: 'Stage Front',  weight: 0.25, center: { lat: 12.9738, lng: 77.5950 } },
  { id: 'Stage Left',   weight: 0.12, center: { lat: 12.9735, lng: 77.5932 } },
  { id: 'Stage Right',  weight: 0.12, center: { lat: 12.9735, lng: 77.5968 } },
  { id: 'Food Court',   weight: 0.20, center: { lat: 12.9720, lng: 77.5950 } },
  { id: 'Entry Plaza',  weight: 0.18, center: { lat: 12.9705, lng: 77.5945 } },
  { id: 'Exit Zone',    weight: 0.08, center: { lat: 12.9705, lng: 77.5960 } },
  { id: 'Parking',      weight: 0.05, center: { lat: 12.9700, lng: 77.5940 } },
];

export const GATE_DEFINITIONS = [
  { id: 'Gate A', capacity: 200, queue: 45,  status: 'OPEN', lat: 12.9700, lng: 77.5930 },
  { id: 'Gate B', capacity: 200, queue: 110, status: 'OPEN', lat: 12.9700, lng: 77.5945 },
  { id: 'Gate C', capacity: 200, queue: 80,  status: 'OPEN', lat: 12.9700, lng: 77.5958 },
  { id: 'Gate D', capacity: 200, queue: 30,  status: 'OPEN', lat: 12.9700, lng: 77.5970 },
  { id: 'VIP',    capacity: 80,  queue: 8,   status: 'OPEN', lat: 12.9748, lng: 77.5950 },
];

/**
 * Generates realistic GPS coordinates distributed across zones
 * using weighted zone selection + Gaussian spread around zone centers.
 */
export const generateVenueCoordinates = (count) => {
  const coords = [];
  const cumulativeWeights = [];
  let cumulative = 0;
  
  ZONES.forEach(z => {
    cumulative += z.weight;
    cumulativeWeights.push({ zone: z, threshold: cumulative });
  });
  
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const targetZone = cumulativeWeights.find(w => r <= w.threshold)?.zone || ZONES[0];
    
    // Gaussian-ish spread: sum of 3 randoms gives bell curve
    const spreadLat = (Math.random() + Math.random() + Math.random() - 1.5) * 0.0015;
    const spreadLng = (Math.random() + Math.random() + Math.random() - 1.5) * 0.0015;
    
    const lat = Math.min(CONFIG.venueBounds.maxLat, Math.max(CONFIG.venueBounds.minLat, targetZone.center.lat + spreadLat));
    const lng = Math.min(CONFIG.venueBounds.maxLng, Math.max(CONFIG.venueBounds.minLng, targetZone.center.lng + spreadLng));
    
    coords.push({ lat, lng });
  }
  return coords;
};

/**
 * Assigns each coordinate to a zone using squared distance
 */
export const assignToZones = (coordinates) => {
  const zoneCounts = {};
  ZONES.forEach(z => { zoneCounts[z.id] = 0; });
  
  coordinates.forEach(c => {
    let minDist = Infinity;
    let nearestZone = ZONES[0].id;
    
    ZONES.forEach(z => {
      const dlat = c.lat - z.center.lat;
      const dlng = c.lng - z.center.lng;
      const dist = dlat * dlat + dlng * dlng;
      if (dist < minDist) { minDist = dist; nearestZone = z.id; }
    });
    
    zoneCounts[nearestZone]++;
  });
  
  // Convert to density (0-100) using expected max per zone
  const MAX_PER_ZONE = Math.ceil(CONFIG.totalUsers / ZONES.length) * 1.5;
  return ZONES.map(z => ({
    id: z.id,
    density: Math.min(100, Math.ceil((zoneCounts[z.id] / MAX_PER_ZONE) * 100)),
    count: zoneCounts[z.id],
    center: z.center,
  }));
};

/**
 * Tick function — pure, returns next simulation state
 */
export const tickSimulation = (currentState) => {
  const nextState = { ...currentState, tick: (currentState.tick || 0) + 1 };
  
  // 1. Drift coordinates (small random walk per user)
  nextState.coordinates = nextState.coordinates.map(c => ({
    lat: Math.max(CONFIG.venueBounds.minLat, Math.min(CONFIG.venueBounds.maxLat,
      c.lat + (Math.random() - 0.5) * 0.00008)),
    lng: Math.max(CONFIG.venueBounds.minLng, Math.min(CONFIG.venueBounds.maxLng,
      c.lng + (Math.random() - 0.5) * 0.00008)),
  }));
  
  // 2. Re-assign zones
  nextState.zones = assignToZones(nextState.coordinates);
  
  // 3. Apply random crowd surge
  if (Math.random() < CONFIG.surgeChance) {
    const randomZone = nextState.zones[Math.floor(Math.random() * nextState.zones.length)];
    const delta = CONFIG.surgeMagnitude.min + Math.random() * (CONFIG.surgeMagnitude.max - CONFIG.surgeMagnitude.min);
    randomZone.density = Math.min(100, randomZone.density + delta);
    
    // Push surge coordinates toward that zone
    const surgeCount = Math.floor(CONFIG.totalUsers * 0.05);
    const surgeZoneDef = ZONES.find(z => z.id === randomZone.id);
    if (surgeZoneDef) {
      for (let i = 0; i < surgeCount; i++) {
        const idx = Math.floor(Math.random() * nextState.coordinates.length);
        nextState.coordinates[idx] = {
          lat: surgeZoneDef.center.lat + (Math.random() - 0.5) * 0.001,
          lng: surgeZoneDef.center.lng + (Math.random() - 0.5) * 0.001,
        };
      }
    }
  }
  
  // 4. Update gate queues
  let anyCongest = false;
  let anyCriticalZone = nextState.zones.some(z => z.density > 85);
  
  nextState.gates = nextState.gates.map(gate => {
    if (gate.status === 'CLOSED') return gate;
    
    const arrivalRate = CONFIG.gateArrivalRate.min + Math.random() * (CONFIG.gateArrivalRate.max - CONFIG.gateArrivalRate.min);
    const processRate = CONFIG.gateProcessRate.min + Math.random() * (CONFIG.gateProcessRate.max - CONFIG.gateProcessRate.min);
    const newQueue = Math.max(0, Math.round(gate.queue + arrivalRate - processRate));
    const capacityPct = (newQueue / gate.capacity) * 100;
    
    if (capacityPct > 70) anyCongest = true;
    
    return {
      ...gate,
      queue: newQueue,
      status: capacityPct > 80 ? 'CONGESTED' : 'OPEN',
      capacityPct: Math.min(100, Math.round(capacityPct)),
      waitMinutes: Math.ceil(newQueue / 12),
    };
  });
  
  // 5. Generate timestamped alerts (accumulate)
  const now = Date.now();
  const prevAlerts = nextState.alerts || [];
  const newAlerts = [...prevAlerts];
  
  const hasCriticalAlertRecently = newAlerts.some(a => a.type === 'CRITICAL' && now - a.ts < 12000);
  const hasCongestAlertRecently  = newAlerts.some(a => a.type === 'WARNING' && now - a.ts < 10000);
  
  if (anyCriticalZone && !hasCriticalAlertRecently) {
    const zone = nextState.zones.find(z => z.density > 85);
    newAlerts.push({ id: `a-${now}`, ts: now, type: 'CRITICAL', text: `Critical density in ${zone?.id}. Rerouting traffic.` });
  }
  if (anyCongest && !hasCongestAlertRecently) {
    const cGate = nextState.gates.find(g => g.status === 'CONGESTED');
    newAlerts.push({ id: `a-${now+1}`, ts: now+1, type: 'WARNING', text: `${cGate?.id || 'A gate'} is congested. Consider diverting to alternate entry.` });
  }
  
  nextState.alerts = newAlerts.slice(-30); // Keep last 30
  nextState.totalAttendees = CONFIG.totalUsers;
  nextState.timestamp = now;
  
  return nextState;
};

/**
 * startSimulation — starts the interval and returns a stop fn
 * @param {Function} onTick - Called every tick with the new state
 */
export const startSimulation = (onTick) => {
  let state = {
    coordinates: generateVenueCoordinates(CONFIG.totalUsers),
    gates: GATE_DEFINITIONS.map(g => ({ ...g, capacityPct: Math.round((g.queue / g.capacity)*100), waitMinutes: Math.ceil(g.queue/12) })),
    zones: [],
    alerts: [],
    tick: 0,
    totalAttendees: CONFIG.totalUsers,
    timestamp: Date.now(),
  };
  
  // Run first tick immediately
  state = tickSimulation(state);
  onTick({ ...state });
  
  const intervalId = setInterval(() => {
    state = tickSimulation(state);
    onTick({ ...state });
  }, CONFIG.updateIntervalMs);
  
  return () => clearInterval(intervalId);
};
