"""
Shared utilities for all collectors.
Handles rate limiting, retries, and anti-blocking measures.
"""
import asyncio
import random
import logging
from typing import List, Optional, Callable, Any
from functools import wraps

logger = logging.getLogger(__name__)

# A pool of realistic browser User-Agents to rotate through
_USER_AGENTS: List[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
]


def random_user_agent() -> str:
    """Return a random browser User-Agent string."""
    return random.choice(_USER_AGENTS)


async def random_delay(min_sec: float = 0.8, max_sec: float = 2.5) -> None:
    """
    Sleep for a random duration to avoid looking like a bot.
    Call between requests to the same host.
    """
    delay = random.uniform(min_sec, max_sec)
    await asyncio.sleep(delay)


class RateLimiter:
    """
    Simple token-bucket rate limiter.
    Ensures we never exceed `max_calls` per `period` seconds.
    """

    def __init__(self, max_calls: int, period: float = 1.0):
        self.max_calls = max_calls
        self.period = period
        self._calls: List[float] = []
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = asyncio.get_event_loop().time()
            # Drop timestamps outside the current window
            self._calls = [t for t in self._calls if now - t < self.period]
            if len(self._calls) >= self.max_calls:
                # Wait until the oldest call falls out of the window
                sleep_for = self.period - (now - self._calls[0])
                if sleep_for > 0:
                    await asyncio.sleep(sleep_for)
            self._calls.append(asyncio.get_event_loop().time())


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    retry_on: tuple = (Exception,),
):
    """
    Async decorator: retry on failure with exponential backoff + jitter.

    Usage:
        @with_retry(max_retries=4, base_delay=2.0)
        async def fetch(...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Optional[Exception] = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except retry_on as exc:
                    last_exc = exc
                    if attempt == max_retries - 1:
                        break
                    delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                    logger.warning(
                        f"{func.__name__} attempt {attempt + 1}/{max_retries} failed: {exc}. "
                        f"Retrying in {delay:.1f}s"
                    )
                    await asyncio.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper
    return decorator


def handle_rate_limit_header(headers: dict) -> Optional[float]:
    """
    Parse Retry-After header if present and return seconds to wait.
    Returns None if header is absent.
    """
    retry_after = headers.get("Retry-After") or headers.get("retry-after")
    if retry_after:
        try:
            return float(retry_after)
        except ValueError:
            pass
    return None
