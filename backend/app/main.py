from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import structlog

from app.config import settings
from app.core.logging import setup_logging
from app.core.cache import cache
from app.api.api import api_router

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title="Firefighter API",
    description="Bug Radar for Live Games - QA Intelligence API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint with basic API information."""
    return {
        "name": "Firefighter API",
        "version": "1.0.0",
        "description": "Bug Radar for Live Games",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "firefighter-api"
    }

@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("Firefighter API starting up...")
    # Initialize Redis connection
    await cache.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Firefighter API shutting down...")
    # Close Redis connection
    await cache.disconnect()