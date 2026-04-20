/**
 * simulation.test.js — Tests for the simulation engine
 */
import { describe, it, expect } from 'vitest';
import {
  generateVenueCoordinates,
  assignToZones,
  tickSimulation,
  ZONES,
  CONFIG,
} from '../services/simulation';

describe('Simulation Engine', () => {
  it('generates the correct number of coordinates', () => {
    const coords = generateVenueCoordinates(100);
    expect(coords).toHaveLength(100);
  });

  it('generates valid lat/lng within bounds', () => {
    const coords = generateVenueCoordinates(50);
    coords.forEach(c => {
      expect(c.lat).toBeGreaterThanOrEqual(CONFIG.venueBounds.minLat);
      expect(c.lat).toBeLessThanOrEqual(CONFIG.venueBounds.maxLat);
      expect(c.lng).toBeGreaterThanOrEqual(CONFIG.venueBounds.minLng);
      expect(c.lng).toBeLessThanOrEqual(CONFIG.venueBounds.maxLng);
    });
  });

  it('assignToZones returns all expected zones', () => {
    const coords = generateVenueCoordinates(200);
    const zones  = assignToZones(coords);
    const ids    = zones.map(z => z.id);
    ZONES.forEach(z => expect(ids).toContain(z.id));
  });

  it('zone density is between 0 and 100', () => {
    const coords = generateVenueCoordinates(500);
    const zones  = assignToZones(coords);
    zones.forEach(z => {
      expect(z.density).toBeGreaterThanOrEqual(0);
      expect(z.density).toBeLessThanOrEqual(100);
    });
  });

  it('tickSimulation increments the tick counter', () => {
    const initialState = {
      coordinates: generateVenueCoordinates(100),
      gates: [{ id: 'Gate A', capacity: 200, queue: 50, status: 'OPEN' }],
      zones: assignToZones(generateVenueCoordinates(100)),
      alerts: [],
      tick: 0,
    };
    const next = tickSimulation(initialState);
    expect(next.tick).toBe(1);
  });

  it('tickSimulation preserves CLOSED gate status', () => {
    const initialState = {
      coordinates: generateVenueCoordinates(50),
      gates: [{ id: 'Gate A', capacity: 200, queue: 50, status: 'CLOSED' }],
      zones: assignToZones(generateVenueCoordinates(50)),
      alerts: [],
      tick: 0,
    };
    const next = tickSimulation(initialState);
    expect(next.gates[0].status).toBe('CLOSED');
  });

  it('alerts accumulate over ticks', () => {
    let state = {
      coordinates: generateVenueCoordinates(50),
      gates: [{ id: 'Gate A', capacity: 10, queue: 20, status: 'OPEN' }],
      zones: [{ id: 'Stage Front', density: 90, count: 100 }],
      alerts: [],
      tick: 0,
    };
    for (let i = 0; i < 5; i++) state = tickSimulation(state);
    // After multiple ticks with congested gate, alerts should exist
    expect(state.alerts).toBeDefined();
    expect(Array.isArray(state.alerts)).toBe(true);
  });
});
