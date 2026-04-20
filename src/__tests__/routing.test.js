/**
 * routing.test.js — Tests for the Dijkstra routing engine
 */
import { describe, it, expect } from 'vitest';
import { routeUser, dijkstraPath, getEvacuationPath } from '../services/routing';

const sampleGates = [
  { id: 'Gate A', capacity: 200, queue: 45,  status: 'OPEN' },
  { id: 'Gate B', capacity: 200, queue: 110, status: 'OPEN' },
  { id: 'Gate C', capacity: 200, queue: 80,  status: 'OPEN' },
  { id: 'Gate D', capacity: 200, queue: 30,  status: 'OPEN' },
  { id: 'VIP',    capacity: 80,  queue: 8,   status: 'OPEN' },
];

describe('Routing Engine', () => {
  it('recommends a gate for a user in Stage Front', () => {
    const result = routeUser('Stage Front', sampleGates);
    expect(result.recommendedGate).toBeTruthy();
    expect(result.recommendedGate.id).toBeDefined();
    expect(result.score).toBeLessThan(Infinity);
  });

  it('falls back to Entry Plaza for an unknown zone', () => {
    const result = routeUser('Unknown Zone', sampleGates);
    expect(result.recommendedGate).toBeTruthy();
  });

  it('returns Infinity score for all-closed gates', () => {
    const closed = sampleGates.map(g => ({ ...g, status: 'CLOSED' }));
    const result = routeUser('Food Court', closed);
    expect(result.score).toBe(Infinity);
  });

  it('dijkstraPath returns distances from source', () => {
    const { distances } = dijkstraPath('Entry Plaza');
    expect(distances['Exit Zone']).toBeDefined();
    expect(distances['Exit Zone']).toBeLessThan(Infinity);
    expect(distances['Stage Front']).toBeGreaterThan(distances['Exit Zone']);
  });

  it('getEvacuationPath returns a valid path array', () => {
    const zones = [{ id: 'Stage Front', density: 90 }, { id: 'Food Court', density: 30 }];
    const path = getEvacuationPath('Stage Front', zones);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toBe('Stage Front');
  });
});
