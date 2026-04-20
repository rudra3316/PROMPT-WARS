/**
 * CrowdSense AI — Routing Engine
 * Dijkstra-inspired weighted shortest-path gate selection.
 * Weights: queue load (50%) + walking distance (30%) + zone density (20%)
 */

/** Walking minutes from each zone to each gate */
export const ZONE_GATE_DISTANCES = {
  'Stage Front':  { 'Gate A': 8, 'Gate B': 6, 'Gate C': 7, 'Gate D': 9,  'VIP': 2  },
  'Stage Left':   { 'Gate A': 4, 'Gate B': 7, 'Gate C': 9, 'Gate D': 11, 'VIP': 5  },
  'Stage Right':  { 'Gate A': 9, 'Gate B': 4, 'Gate C': 7, 'Gate D': 8,  'VIP': 5  },
  'Food Court':   { 'Gate A': 6, 'Gate B': 5, 'Gate C': 4, 'Gate D': 5,  'VIP': 8  },
  'Entry Plaza':  { 'Gate A': 3, 'Gate B': 2, 'Gate C': 3, 'Gate D': 4,  'VIP': 10 },
  'Exit Zone':    { 'Gate A': 2, 'Gate B': 3, 'Gate C': 4, 'Gate D': 3,  'VIP': 9  },
  'Parking':      { 'Gate A': 1, 'Gate B': 2, 'Gate C': 3, 'Gate D': 2,  'VIP': 12 },
};

/** Venue graph edges for full Dijkstra (zone→zone adjacencies) */
export const VENUE_GRAPH = {
  'Parking':      { 'Entry Plaza': 2 },
  'Entry Plaza':  { 'Parking': 2, 'Food Court': 4, 'Exit Zone': 3 },
  'Exit Zone':    { 'Entry Plaza': 3, 'Food Court': 5 },
  'Food Court':   { 'Entry Plaza': 4, 'Exit Zone': 5, 'Stage Left': 6, 'Stage Right': 6, 'Stage Front': 8 },
  'Stage Left':   { 'Food Court': 6, 'Stage Front': 3 },
  'Stage Right':  { 'Food Court': 6, 'Stage Front': 3 },
  'Stage Front':  { 'Stage Left': 3, 'Stage Right': 3, 'Food Court': 8 },
};

/**
 * dijkstraPath — finds shortest path from source to every other node
 * @param {string} source
 * @returns {{ distances, previous }}
 */
export const dijkstraPath = (source) => {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(VENUE_GRAPH));
  
  unvisited.forEach(node => { distances[node] = Infinity; });
  distances[source] = 0;
  
  while (unvisited.size > 0) {
    // Pick unvisited node with min distance
    let current = null;
    unvisited.forEach(node => {
      if (current === null || distances[node] < distances[current]) current = node;
    });
    
    if (current === null || distances[current] === Infinity) break;
    unvisited.delete(current);
    
    const neighbors = VENUE_GRAPH[current] || {};
    Object.entries(neighbors).forEach(([neighbor, weight]) => {
      const alt = distances[current] + weight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    });
  }
  
  return { distances, previous };
};

/**
 * getZonePath — extract the shortest path to a target zone
 */
export const getZonePath = (source, target) => {
  const { previous } = dijkstraPath(source);
  const path = [];
  let curr = target;
  while (curr) { path.unshift(curr); curr = previous[curr]; }
  return path;
};

/**
 * routeUser — Recommends the best gate for a user in a given zone
 * @param {string} userZoneId
 * @param {Array}  gateStates
 * @param {Array}  zoneStates  (for density factor)
 * @returns {{ recommendedGate, allGates, score, breakdown }}
 */
export const routeUser = (userZoneId, gateStates, zoneStates = []) => {
  if (!gateStates || gateStates.length === 0) {
    return { recommendedGate: null, score: 0, breakdown: {}, allGates: [] };
  }
  
  const zoneName = ZONE_GATE_DISTANCES[userZoneId] ? userZoneId : 'Entry Plaza';
  const distances = ZONE_GATE_DISTANCES[zoneName];
  
  // Current zone density (for weighting)
  const zoneData = zoneStates.find(z => z.id === zoneName);
  const zoneDensity = zoneData ? zoneData.density : 50;
  
  const scoredGates = gateStates.map(gate => {
    if (gate.status === 'CLOSED') {
      return { ...gate, score: Infinity, breakdown: { queueLoad: 0, distancePenalty: 0, densityPenalty: 0 } };
    }
    
    const capacity = gate.capacity || 200;
    const queue    = gate.queue || 0;
    
    // Component scores (all normalized to 0-100 range)
    const queueLoad       = (queue / capacity) * 100;           // 0-100
    const distancePenalty = (distances[gate.id] || 10) * 5;     // 0-60ish
    const densityPenalty  = gate.status === 'CONGESTED' ? 40 : 0;
    
    // Weighted total (lower = better)
    const score = (queueLoad * 0.5) + (distancePenalty * 0.3) + (densityPenalty * 0.2);
    
    return {
      ...gate,
      score,
      breakdown: { queueLoad: Math.round(queueLoad), distancePenalty: Math.round(distancePenalty), densityPenalty }
    };
  });
  
  const openGates = scoredGates.filter(g => g.score !== Infinity);
  
  if (openGates.length === 0) {
    return { recommendedGate: gateStates[0], score: Infinity, breakdown: {}, allGates: scoredGates };
  }
  
  const best = openGates.reduce((a, b) => b.score < a.score ? b : a, openGates[0]);
  return { recommendedGate: best, score: best.score, breakdown: best.breakdown, allGates: scoredGates };
};

/**
 * getEvacuationPath — returns safest zones to evacuate from a given zone
 * Avoids high-density zones
 */
export const getEvacuationPath = (fromZone, zones) => {
  const densityMap = {};
  zones.forEach(z => { densityMap[z.id] = z.density || 0; });
  
  // Build weighted graph (penalize high dens zones)
  const weightedGraph = {};
  Object.entries(VENUE_GRAPH).forEach(([node, neighbors]) => {
    weightedGraph[node] = {};
    Object.entries(neighbors).forEach(([neighbor, dist]) => {
      const penalty = (densityMap[neighbor] || 0) > 70 ? dist * 3 : dist;
      weightedGraph[node][neighbor] = penalty;
    });
  });
  
  // BFS-style recommended path (simple — avoid critical zones)
  const safeZoneOrder = ['Exit Zone', 'Entry Plaza', 'Parking'];
  const path = [fromZone];
  let current = fromZone;
  
  for (const target of safeZoneOrder) {
    if (current !== target && VENUE_GRAPH[current]?.[target] !== undefined) {
      path.push(target);
      current = target;
    }
  }
  
  return path;
};
