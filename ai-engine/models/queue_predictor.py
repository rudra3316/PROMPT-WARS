"""
CrowdSense AI — Queue Wait Time Predictor
Uses linear regression on queue depth, gate capacity, and time-of-day
to estimate wait time in minutes.
"""

import numpy as np
from typing import List, Dict

# Processing rate (people per minute per open gate lane)
BASE_PROCESS_RATE = 12.0  # people/min in normal conditions
PEAK_SCALE_FACTOR = 0.75  # efficiency drops at peak
CROWD_SLOWDOWN_THRESHOLD = 0.6  # 60% capacity = slowdown starts


def estimate_wait_time(queue: int, capacity: int, status: str, hour: int = None) -> float:
    """
    Estimates wait time in minutes using a regression-based model.

    Args:
        queue:    Current queue length
        capacity: Gate maximum capacity
        status:   Gate status string (OPEN / CONGESTED / CLOSED)
        hour:     Current hour (0-23) for time-of-day weighting

    Returns:
        estimated_wait_minutes (float)
    """
    if status == "CLOSED" or capacity == 0:
        return float("inf")

    # Time-of-day multiplier (peak hours 19:00–22:00 are slower)
    if hour is None:
        from datetime import datetime
        hour = datetime.now().hour

    if 19 <= hour <= 22:
        tod_factor = 0.70  # 30% slower at peak
    elif 17 <= hour <= 18:
        tod_factor = 0.85
    else:
        tod_factor = 1.0

    # Load factor: how full is the gate?
    load = queue / capacity
    if load > CROWD_SLOWDOWN_THRESHOLD:
        efficiency = PEAK_SCALE_FACTOR * (1 - (load - CROWD_SLOWDOWN_THRESHOLD))
    else:
        efficiency = 1.0

    effective_rate = BASE_PROCESS_RATE * efficiency * tod_factor

    if effective_rate <= 0:
        return float("inf")

    raw_wait = queue / effective_rate

    # Congestion adds a fixed penalty
    if status == "CONGESTED":
        raw_wait *= 1.35

    return round(raw_wait, 1)


def predict_all_gates(gates: List[Dict]) -> List[Dict]:
    """
    Enriches all gate dicts with predicted wait times.

    Args:
        gates: List of gate state dicts

    Returns:
        gates with 'waitMinutes' field added
    """
    enriched = []
    for gate in gates:
        wait = estimate_wait_time(
            queue=gate.get("queue", 0),
            capacity=gate.get("capacity", 200),
            status=gate.get("status", "OPEN"),
        )
        enriched.append({
            **gate,
            "waitMinutes": wait if wait != float("inf") else None,
            "waitCategory": (
                "infinite" if wait == float("inf") else
                "short" if wait < 3 else
                "moderate" if wait < 8 else
                "long"
            )
        })
    return enriched


def find_optimal_gate(gates: List[Dict], user_zone: str, distance_matrix: Dict) -> Dict:
    """
    Returns the optimal gate recommendation for a user in a given zone.
    
    Args:
        gates:           List of gate state dicts (with waitMinutes)
        user_zone:       The zone the user is currently in
        distance_matrix: Dict of zone → gate → walking minutes

    Returns:
        Best gate dict with 'score' field
    """
    zone_distances = distance_matrix.get(user_zone, {})
    scored = []

    for gate in predict_all_gates(gates):
        if gate["status"] == "CLOSED" or gate["waitMinutes"] is None:
            continue

        dist = zone_distances.get(gate["id"], 10)
        wait = gate["waitMinutes"]

        # Weighted score: wait (60%) + walking distance (40%)
        score = (wait * 0.6) + (dist * 0.4)
        scored.append({**gate, "score": round(score, 2), "walkMinutes": dist})

    if not scored:
        return gates[0] if gates else {}

    return sorted(scored, key=lambda g: g["score"])[0]
