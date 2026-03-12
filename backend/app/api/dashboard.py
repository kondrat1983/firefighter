from fastapi import APIRouter
from typing import Optional

router = APIRouter()

@router.get("/")
async def get_dashboard_data(game_id: Optional[int] = None):
    """Get main dashboard data for mission control view."""
    return {
        "game_health": {
            "overall_score": 85,
            "crash_risk": 12,
            "progression_risk": 8,
            "exploit_risk": 3,
            "connectivity_risk": 15,
            "sentiment_score": 72
        },
        "active_alerts": [
            {
                "id": 123,
                "type": "progression",
                "confidence": 0.84,
                "mention_count": 15,
                "source_count": 3,
                "triggered_at": "2026-03-06T09:25:00Z",
                "status": "new"
            }
        ],
        "patch_monitoring": {
            "active": True,
            "time_since_release": "2h 15m",
            "risk_index": 35,
            "alerts_count": 2
        },
        "signal_timeline": [
            {
                "timestamp": "2026-03-06T09:12:00Z",
                "source": "reddit",
                "event": "Bug report spike",
                "count": 5
            },
            {
                "timestamp": "2026-03-06T09:25:00Z",
                "source": "system",
                "event": "Alert triggered",
                "alert_id": 123
            }
        ]
    }

@router.get("/metrics")
async def get_system_metrics():
    """Get system-wide metrics for monitoring."""
    return {
        "collection_rate": {
            "reddit": 150,  # signals per hour
            "steam": 45,
            "twitter": 200
        },
        "processing_lag": 2.3,  # minutes
        "alert_accuracy": 0.87,  # based on feedback
        "false_positive_rate": 0.13
    }