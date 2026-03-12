from celery import Celery
from celery.schedules import crontab
import structlog

from app.config import settings

logger = structlog.get_logger()

# Create Celery app
celery_app = Celery(
    "firefighter",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.collector_worker",
        "app.workers.processor_worker", 
        "app.workers.alert_worker"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        "app.workers.collector_worker.*": {"queue": "collection"},
        "app.workers.processor_worker.*": {"queue": "processing"},
        "app.workers.alert_worker.*": {"queue": "alerts"},
    },
    
    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Task configuration
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task expiration
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,      # 10 minutes
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        # Data collection tasks
        "collect-reddit-signals": {
            "task": "app.workers.collector_worker.collect_reddit_signals",
            "schedule": 300.0,  # Every 5 minutes
        },
        "collect-steam-reviews": {
            "task": "app.workers.collector_worker.collect_steam_reviews",
            "schedule": 900.0,  # Every 15 minutes
        },
        "collect-twitter-signals": {
            "task": "app.workers.collector_worker.collect_twitter_signals",
            "schedule": 120.0,  # Every 2 minutes
        },
        
        # Processing tasks
        "normalize-signals": {
            "task": "app.workers.processor_worker.normalize_signals",
            "schedule": 60.0,  # Every minute
        },
        "generate-embeddings": {
            "task": "app.workers.processor_worker.generate_embeddings",
            "schedule": 120.0,  # Every 2 minutes
        },
        "update-clusters": {
            "task": "app.workers.processor_worker.update_clusters",
            "schedule": 300.0,  # Every 5 minutes
        },
        "classify-clusters": {
            "task": "app.workers.processor_worker.classify_clusters",
            "schedule": 600.0,  # Every 10 minutes
        },
        
        # Alert tasks
        "evaluate-alerts": {
            "task": "app.workers.alert_worker.evaluate_alerts",
            "schedule": 60.0,  # Every minute
        },
        "update-game-health": {
            "task": "app.workers.alert_worker.update_game_health",
            "schedule": 300.0,  # Every 5 minutes
        },
        
        # Cleanup tasks
        "cleanup-old-data": {
            "task": "app.workers.processor_worker.cleanup_old_data",
            "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
        }
    }
)

@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery setup."""
    logger.info(f"Request: {self.request!r}")
    return "Celery is working!"