from fastapi import APIRouter

from app.api import games, alerts, dashboard

# Main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])