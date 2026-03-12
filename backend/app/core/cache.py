import json
import redis.asyncio as aioredis
from typing import Any, Optional, Union
from datetime import timedelta
import structlog

from app.config import settings

logger = structlog.get_logger()

class RedisCache:
    """Redis cache client with async support."""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        """Connect to Redis."""
        try:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )
            # Test connection
            await self.redis.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error("Redis get failed", key=key, error=str(e))
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        expire: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """Set value in cache."""
        try:
            serialized = json.dumps(value, default=str)
            if expire:
                if isinstance(expire, timedelta):
                    expire = int(expire.total_seconds())
                await self.redis.setex(key, expire, serialized)
            else:
                await self.redis.set(key, serialized)
            return True
        except Exception as e:
            logger.error("Redis set failed", key=key, error=str(e))
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            result = await self.redis.delete(key)
            return bool(result)
        except Exception as e:
            logger.error("Redis delete failed", key=key, error=str(e))
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return bool(await self.redis.exists(key))
        except Exception as e:
            logger.error("Redis exists failed", key=key, error=str(e))
            return False
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter."""
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error("Redis increment failed", key=key, error=str(e))
            return 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for key."""
        try:
            return bool(await self.redis.expire(key, seconds))
        except Exception as e:
            logger.error("Redis expire failed", key=key, error=str(e))
            return False

# Global cache instance
cache = RedisCache()

async def get_cache() -> RedisCache:
    """Dependency to get cache instance."""
    return cache