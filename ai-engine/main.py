"""
CrowdSense AI — FastAPI Main Application
Provides REST endpoints for the AI microservice:
  POST /density      — DBSCAN density estimation
  POST /predict-queue — Wait time prediction
  POST /evacuation-route — Dijkstra evacuation path
  GET  /health       — Service health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict

from models.dbscan_model import estimate_density_dbscan, get_hotspots
from models.queue_predictor import predict_all_gates, find_optimal_gate
from models.evacuation import get_evacuation_route

# ── FastAPI App ───────────────────────────────────────
app = FastAPI(
    title="CrowdSense AI Engine",
    description="AI microservice for real-time crowd density, queue prediction, and evacuation routing.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ───────────────────────────────────

class Coordinate(BaseModel):
    lat: float
    lng: float

class DensityRequest(BaseModel):
    coordinates: List[Coordinate]

class Gate(BaseModel):
    id: str
    queue: int
    capacity: int
    status: str

class QueueRequest(BaseModel):
    gates: List[Gate]
    user_zone: Optional[str] = "Entry Plaza"

class EvacuationRequest(BaseModel):
    from_zone: str
    zone_densities: Dict[str, float]

# ── Routes ────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CrowdSense AI Engine v2.0"}


@app.post("/density")
def estimate_density(req: DensityRequest):
    """
    Estimates crowd density per zone using DBSCAN clustering.
    Input: list of GPS coordinates.
    Output: per-zone density scores (0-100) + hotspot list.
    """
    try:
        coords = [{"lat": c.lat, "lng": c.lng} for c in req.coordinates]
        zones = estimate_density_dbscan(coords)
        hotspots = get_hotspots(zones, threshold=75.0)

        return {
            "success": True,
            "zones": zones,
            "hotspots": hotspots,
            "total_coordinates": len(coords),
            "critical_count": len([z for z in zones if z["density"] > 85]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-queue")
def predict_queue(req: QueueRequest):
    """
    Predicts wait times for all gates and recommends the optimal gate.
    """
    ZONE_DISTANCES = {
        "Stage Front":  {"Gate A": 8, "Gate B": 6, "Gate C": 7, "Gate D": 9, "VIP": 2},
        "Stage Left":   {"Gate A": 4, "Gate B": 7, "Gate C": 9, "Gate D": 11, "VIP": 5},
        "Stage Right":  {"Gate A": 9, "Gate B": 4, "Gate C": 7, "Gate D": 8, "VIP": 5},
        "Food Court":   {"Gate A": 6, "Gate B": 5, "Gate C": 4, "Gate D": 5, "VIP": 8},
        "Entry Plaza":  {"Gate A": 3, "Gate B": 2, "Gate C": 3, "Gate D": 4, "VIP": 10},
        "Exit Zone":    {"Gate A": 2, "Gate B": 3, "Gate C": 4, "Gate D": 3, "VIP": 9},
        "Parking":      {"Gate A": 1, "Gate B": 2, "Gate C": 3, "Gate D": 2, "VIP": 12},
    }

    try:
        gates_raw = [g.dict() for g in req.gates]
        gates_enriched = predict_all_gates(gates_raw)

        best_gate = find_optimal_gate(
            gates=gates_raw,
            user_zone=req.user_zone,
            distance_matrix=ZONE_DISTANCES
        )

        return {
            "success": True,
            "gates": gates_enriched,
            "recommendation": best_gate,
            "user_zone": req.user_zone,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evacuation-route")
def evacuation_route(req: EvacuationRequest):
    """
    Computes safest Dijkstra evacuation path from a zone,
    penalizing high-density areas.
    """
    try:
        result = get_evacuation_route(
            from_zone=req.from_zone,
            zone_densities=req.zone_densities,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
