from fastapi import APIRouter
from typing import List, Optional

router = APIRouter()

@router.get("/")
async def list_alerts(status: Optional[str] = None, game_id: Optional[int] = None):
    """List alerts with optional filtering."""
    return {"alerts": [], "filters": {"status": status, "game_id": game_id}}

@router.get("/{alert_id}")
async def get_alert_details(alert_id: int):
    """Get detailed alert information with evidence."""
    return {
        "id": alert_id,
        "type": "progression",
        "status": "new",
        "confidence": 0.84,
        "mention_count": 15,
        "source_count": 3,
        "ai_summary": "Players are reporting they cannot pick up the Saucery Extract item during the Jailbreak quest, blocking progression.",
        "suggested_title": "Progression Blocker: Saucery Extract cannot be picked up during Jailbreak quest",
        "suggested_investigations": [
            "Verify interaction trigger for Saucery Extract",
            "Check quest progression state requirements",
            "Verify item spawn conditions"
        ],
        "evidence": [
            {
                "source": "reddit",
                "content": "Can't pick up the saucery extract in jailbreak quest, anyone else?",
                "timestamp": "2026-03-06T09:12:00Z",
                "url": "https://reddit.com/r/ddv/..."
            }
        ],
        "timeline": [
            {"time": "09:12", "event": "Reddit report"},
            {"time": "09:18", "event": "Steam review"},
            {"time": "09:23", "event": "Twitter spike"},
            {"time": "09:25", "event": "Alert triggered"}
        ]
    }

@router.put("/{alert_id}/status")
async def update_alert_status(alert_id: int):
    """Update alert status (investigating, confirmed, false_alarm, etc.)."""
    return {"alert_id": alert_id, "message": "Status update endpoint - to be implemented"}

@router.post("/{alert_id}/feedback")
async def submit_feedback(alert_id: int):
    """Submit human feedback on alert accuracy."""
    return {"alert_id": alert_id, "message": "Feedback submission endpoint - to be implemented"}