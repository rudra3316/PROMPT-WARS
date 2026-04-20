"""
CrowdSense AI — Emergency Evacuation Router
Uses Dijkstra's algorithm on a venue graph to find safest exit paths.
Edges are weighted by crowd density to avoid dangerous zones.
"""

import heapq
from typing import Dict, List, Optional, Tuple

# Venue zone graph: {node: {neighbor: base_distance_minutes}}
VENUE_GRAPH = {
    "Parking":      {"Entry Plaza": 2},
    "Entry Plaza":  {"Parking": 2, "Food Court": 4, "Exit Zone": 3},
    "Exit Zone":    {"Entry Plaza": 3, "Food Court": 5},
    "Food Court":   {"Entry Plaza": 4, "Exit Zone": 5, "Stage Left": 6, "Stage Right": 6, "Stage Front": 8},
    "Stage Left":   {"Food Court": 6, "Stage Front": 3},
    "Stage Right":  {"Food Court": 6, "Stage Front": 3},
    "Stage Front":  {"Stage Left": 3, "Stage Right": 3, "Food Court": 8},
}

# Emergency exits (nodes that lead to safety)
EXIT_NODES = {"Exit Zone", "Parking", "Entry Plaza"}

DENSITY_WEIGHT_MULTIPLIER = 3.0   # High density zones are penalized this much extra
CRITICAL_THRESHOLD        = 75.0  # % density to consider "dangerous"


def build_weighted_graph(zone_densities: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    """
    Applies density-based weights to the venue graph edges.
    High-density zones get heavily penalized to route away from them.
    """
    weighted = {}
    for node, neighbors in VENUE_GRAPH.items():
        weighted[node] = {}
        for neighbor, base_dist in neighbors.items():
            density = zone_densities.get(neighbor, 0)
            if density >= CRITICAL_THRESHOLD:
                # Severe detour penalty for critical zones
                penalized_dist = base_dist * DENSITY_WEIGHT_MULTIPLIER * (1 + density / 100)
            elif density > 50:
                penalized_dist = base_dist * 1.5
            else:
                penalized_dist = base_dist
            weighted[node][neighbor] = round(penalized_dist, 2)
    return weighted


def dijkstra(graph: Dict[str, Dict[str, float]], start: str) -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    Standard Dijkstra's algorithm.
    Returns (distances, previous) maps.
    """
    distances = {node: float("inf") for node in graph}
    distances[start] = 0
    previous: Dict[str, Optional[str]] = {node: None for node in graph}
    heap = [(0, start)]

    while heap:
        curr_dist, curr_node = heapq.heappop(heap)
        if curr_dist > distances[curr_node]:
            continue

        for neighbor, weight in graph.get(curr_node, {}).items():
            alt = curr_dist + weight
            if alt < distances.get(neighbor, float("inf")):
                distances[neighbor] = alt
                previous[neighbor] = curr_node
                heapq.heappush(heap, (alt, neighbor))

    return distances, previous


def reconstruct_path(previous: Dict[str, str], target: str) -> List[str]:
    """Rebuilds the path from previous node map."""
    path = []
    node = target
    while node is not None:
        path.insert(0, node)
        node = previous.get(node)
    return path


def get_evacuation_route(
    from_zone: str,
    zone_densities: Dict[str, float]
) -> Dict:
    """
    Main function: computes the safest evacuation route from a zone.

    Args:
        from_zone:       Start zone ID
        zone_densities:  Dict of {zone_id: density_percent}

    Returns:
        {
            "path": [...],
            "total_time": float,
            "nearest_exit": str,
            "safe": bool,
            "alternatives": [...]
        }
    """
    if from_zone not in VENUE_GRAPH:
        from_zone = "Stage Front"

    weighted_graph = build_weighted_graph(zone_densities)
    distances, previous = dijkstra(weighted_graph, from_zone)

    # Find best exit
    exit_times = [(distances[ex], ex) for ex in EXIT_NODES if ex in distances]
    exit_times.sort()

    if not exit_times:
        return {"path": [from_zone], "total_time": 0, "nearest_exit": None, "safe": False}

    best_time, best_exit = exit_times[0]
    best_path = reconstruct_path(previous, best_exit)

    # Alternatives (other exits)
    alternatives = [
        {
            "path": reconstruct_path(previous, ex),
            "total_time": round(t, 1),
            "exit": ex
        }
        for t, ex in exit_times[1:]
    ]

    # Assess safety of chosen path
    density_along_path = [zone_densities.get(z, 0) for z in best_path]
    is_safe = all(d < CRITICAL_THRESHOLD for d in density_along_path)

    return {
        "path": best_path,
        "total_time": round(best_time, 1),
        "nearest_exit": best_exit,
        "safe": is_safe,
        "alternatives": alternatives,
        "densities_along_path": {z: round(zone_densities.get(z, 0), 1) for z in best_path},
    }
