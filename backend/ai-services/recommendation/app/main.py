import logging
import numpy as np
from fastapi import FastAPI, HTTPException
import joblib
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Recommendation Service", version="1.0.0")

_model = None
_model_path = os.path.join(os.path.dirname(__file__), "model.pkl")

def get_model():
    global _model
    if _model is None and os.path.exists(_model_path):
        logger.info(f"Loading model from {_model_path}")
        _model = joblib.load(_model_path)
        logger.info("Model loaded")
    return _model

def compute_priority_score(complaint: dict) -> float:
    urgency = complaint.get("urgency_score", 0.5)
    citizen_count = complaint.get("citizen_count", 1)
    days_open = complaint.get("days_open", 1)

    norm_urgency = urgency
    norm_count = min(citizen_count / 100, 1.0)
    norm_days = min(days_open / 90, 1.0)

    score = (
        0.35 * norm_urgency +
        0.35 * norm_count +
        0.30 * norm_days
    )
    return round(min(score * 1.2, 1.0), 3)

def get_priority_label(score: float) -> str:
    if score >= 0.8:
        return "critical"
    elif score >= 0.6:
        return "high"
    elif score >= 0.4:
        return "medium"
    else:
        return "low"

def generate_reason(complaint: dict, score: float) -> str:
    parts = []
    if complaint.get("urgency_score", 0) > 0.7:
        parts.append("High urgency score")
    if complaint.get("citizen_count", 0) > 5:
        parts.append(f"Multiple citizens affected ({complaint['citizen_count']})")
    if complaint.get("days_open", 0) > 30:
        parts.append(f"Long unresolved duration ({complaint['days_open']} days)")
    category = complaint.get("category", "")
    if category:
        parts.append(f"Category: {category}")
    return "; ".join(parts) if parts else "Standard priority"

@app.post("/rank")
async def rank(body: dict):
    try:
        complaints = body.get("complaints", [])
        ward_priorities = body.get("ward_priorities")

        if not complaints:
            return {"ranked_complaints": [], "model_version": "heuristic-v1", "feature_importance": {}}

        ranked = []
        for c in complaints:
            score = compute_priority_score(c)
            ranked.append({
                "id": c.get("id"),
                "priority_score": score,
                "priority_label": get_priority_label(score),
                "reason": generate_reason(c, score),
            })

        ranked.sort(key=lambda x: x["priority_score"], reverse=True)

        return {
            "ranked_complaints": ranked,
            "model_version": "heuristic-v1",
            "feature_importance": {
                "citizen_count": 0.35,
                "days_open": 0.30,
                "urgency_score": 0.35,
            },
        }
    except Exception as e:
        logger.exception("Ranking failed")
        raise HTTPException(status_code=500, detail={
            "error": {"code": "RANKING_FAILED", "message": str(e), "details": {}}
        })

@app.get("/health")
async def health():
    return {"status": "ok", "model": "heuristic-v1", "device": "cpu"}