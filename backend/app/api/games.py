from fastapi import APIRouter
from typing import List

router = APIRouter()

@router.get("/")
async def list_games():
    """List all monitored games."""
    return {"games": []}

@router.post("/")
async def create_game():
    """Add a new game to monitor."""
    return {"message": "Game creation endpoint - to be implemented"}

@router.get("/{game_id}")
async def get_game(game_id: int):
    """Get specific game details."""
    return {"game_id": game_id, "message": "Game details endpoint - to be implemented"}

@router.put("/{game_id}")
async def update_game(game_id: int):
    """Update game configuration."""
    return {"game_id": game_id, "message": "Game update endpoint - to be implemented"}

@router.delete("/{game_id}")
async def delete_game(game_id: int):
    """Remove game from monitoring."""
    return {"game_id": game_id, "message": "Game deletion endpoint - to be implemented"}

@router.get("/{game_id}/health")
async def get_game_health(game_id: int):
    """Get current health metrics for a game."""
    return {
        "game_id": game_id,
        "health": {
            "overall_score": 85,
            "crash_risk": 12,
            "progression_risk": 8,
            "exploit_risk": 3,
            "connectivity_risk": 15,
            "sentiment_score": 72
        }
    }