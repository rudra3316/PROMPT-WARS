import { describe, it, expect } from 'vitest';
import { calculateWaitTime, getDensityLevel, getStatusColor, aggregateZoneDensity } from '../utils/crowdCalculations';

describe('crowdCalculations', () => {
  it('calculateWaitTime returns correct minutes', () => {
    expect(calculateWaitTime(0)).toBe(0);
    expect(calculateWaitTime(12)).toBe(1);
    expect(calculateWaitTime(13)).toBe(2);
    expect(calculateWaitTime(120)).toBe(10);
  });

  it('getDensityLevel returns correct level', () => {
    expect(getDensityLevel(39)).toBe('low');
    expect(getDensityLevel(69)).toBe('high');
    expect(getDensityLevel(85)).toBe('high');
    expect(getDensityLevel(86)).toBe('critical');
    expect(getDensityLevel(100)).toBe('critical');
  });

  it('getStatusColor returns correct color hex string', () => {
    expect(getStatusColor(20)).toBe('#10B981');  // green (low)
    expect(getStatusColor(60)).toBe('#3B82F6');  // blue (moderate)
    expect(getStatusColor(80)).toBe('#F59E0B');  // yellow (high)
    expect(getStatusColor(90)).toBe('#EF4444');  // red (critical)
  });

  it('aggregateZoneDensity groups correctly', () => {
    const bounds = {
      minLat: 0, maxLat: 100,
      minLng: 0, maxLng: 100
    };
    const coords = [
      { lat: 90, lng: 20 }, // Stage Left
      { lat: 90, lng: 80 }, // Stage Right
      { lat: 90, lng: 50 }, // Stage Front
      { lat: 50, lng: 50 }, // Food Court
      { lat: 10, lng: 20 }, // Entry Plaza
      { lat: 10, lng: 80 }  // Exit Zone
    ];
    const grouped = aggregateZoneDensity(coords, bounds);
    expect(grouped['Stage Left']).toBeGreaterThan(0);
    expect(grouped['Stage Right']).toBeGreaterThan(0);
    expect(grouped['Stage Front']).toBeGreaterThan(0);
    expect(grouped['Food Court']).toBeGreaterThan(0);
    expect(grouped['Entry Plaza']).toBeGreaterThan(0);
    expect(grouped['Exit Zone']).toBeGreaterThan(0);
  });
});
