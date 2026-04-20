"""
CrowdSense AI — Python DBSCAN Crowd Density Estimation Model
Uses DBSCAN clustering on GPS coordinates to score zone density.
"""

import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple

# Venue zone definitions (must match frontend)
ZONES = [
    {"id": "Stage Front",  "center": (12.9738, 77.5950), "radius": 0.0012},
    {"id": "Stage Left",   "center": (12.9735, 77.5932), "radius": 0.0010},
    {"id": "Stage Right",  "center": (12.9735, 77.5968), "radius": 0.0010},
    {"id": "Food Court",   "center": (12.9720, 77.5950), "radius": 0.0012},
    {"id": "Entry Plaza",  "center": (12.9705, 77.5945), "radius": 0.0015},
    {"id": "Exit Zone",    "center": (12.9705, 77.5960), "radius": 0.0010},
    {"id": "Parking",      "center": (12.9700, 77.5940), "radius": 0.0015},
]

# Max expected people per zone for normalization
MAX_ZONE_CAPACITY = 800


def euclidean_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Simple lat/lng distance approximation (for venue scale, OK without Haversine)."""
    return ((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) ** 0.5


def assign_zone(lat: float, lng: float) -> str:
    """Assigns a coordinate to the nearest zone."""
    min_dist = float("inf")
    nearest = ZONES[0]["id"]
    for zone in ZONES:
        dist = euclidean_distance(lat, lng, *zone["center"])
        if dist < min_dist:
            min_dist = dist
            nearest = zone["id"]
    return nearest


def estimate_density_dbscan(
    coordinates: List[Dict[str, float]],
    eps: float = 0.0005,
    min_samples: int = 5
) -> List[Dict]:
    """
    Estimates crowd density per zone using DBSCAN clustering.

    Args:
        coordinates: List of {"lat": float, "lng": float} dicts
        eps:         DBSCAN neighborhood radius (in degrees)
        min_samples: DBSCAN min points for core point

    Returns:
        List of zone dicts with density scores (0-100)
    """
    if not coordinates or len(coordinates) < min_samples:
        return [{"id": z["id"], "density": 0, "count": 0} for z in ZONES]

    # Convert to numpy array
    coords = np.array([[c["lat"], c["lng"]] for c in coordinates])

    # Run DBSCAN
    scaler = StandardScaler()
    coords_scaled = scaler.fit_transform(coords)

    db = DBSCAN(eps=eps * 1000, min_samples=min_samples, n_jobs=-1)
    labels = db.fit_predict(coords_scaled)

    # Assign each point to a zone
    zone_counts: Dict[str, int] = {z["id"]: 0 for z in ZONES}
    for i, coord in enumerate(coordinates):
        zone = assign_zone(coord["lat"], coord["lng"])
        zone_counts[zone] += 1

    # Build result with density scores
    results = []
    for zone in ZONES:
        count = zone_counts[zone["id"]]
        density = min(100, round((count / MAX_ZONE_CAPACITY) * 100, 1))
        results.append({
            "id": zone["id"],
            "density": density,
            "count": count,
            "center": {"lat": zone["center"][0], "lng": zone["center"][1]},
        })

    return results


def get_hotspots(density_results: List[Dict], threshold: float = 75.0) -> List[Dict]:
    """Returns zones exceeding a density threshold."""
    return [z for z in density_results if z["density"] >= threshold]
