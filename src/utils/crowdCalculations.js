/**
 * CrowdSense AI — crowdCalculations utils
 * Pure helper functions used by simulation and UI components.
 */

export const calculateWaitTime = (queueLength, processRate = 12) => {
  return Math.ceil(queueLength / processRate);
};

export const getDensityLevel = (score) => {
  if (score < 40) return 'low';
  if (score < 65) return 'moderate';
  if (score <= 85) return 'high';
  return 'critical';
};

export const getStatusColor = (densityScore) => {
  const level = getDensityLevel(densityScore);
  switch (level) {
    case 'low':      return '#10B981';
    case 'moderate': return '#3B82F6';
    case 'high':     return '#F59E0B';
    case 'critical': return '#EF4444';
    default:         return '#10B981';
  }
};

/**
 * aggregateZoneDensity — assigns coordinates to zones by nearest center
 * Returns a map of zone_id → density score (0-100)
 */
export const aggregateZoneDensity = (coordinates, bounds) => {
  const zones = {
    'Stage Front': 0, 'Stage Left': 0, 'Stage Right': 0,
    'Food Court': 0, 'Entry Plaza': 0, 'Exit Zone': 0,
  };

  if (!coordinates || coordinates.length === 0) return zones;

  const latSpan = bounds.maxLat - bounds.minLat;
  const lngSpan = bounds.maxLng - bounds.minLng;

  coordinates.forEach(c => {
    const relLat = (c.lat - bounds.minLat) / latSpan;
    const relLng = (c.lng - bounds.minLng) / lngSpan;

    if (relLat > 0.6) {
      if (relLng < 0.33)      zones['Stage Left']++;
      else if (relLng > 0.66) zones['Stage Right']++;
      else                    zones['Stage Front']++;
    } else if (relLat > 0.3) {
      zones['Food Court']++;
    } else {
      if (relLng < 0.5) zones['Entry Plaza']++;
      else              zones['Exit Zone']++;
    }
  });

  const MAX_PER_ZONE = 1000;
  Object.keys(zones).forEach(k => {
    zones[k] = Math.min(100, Math.ceil((zones[k] / MAX_PER_ZONE) * 100));
  });

  return zones;
};
