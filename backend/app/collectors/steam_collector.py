"""
Steam Data Collector for Firefighter.
Uses Steam's public web APIs — no API key required.

Sources:
  - Store Reviews API:  https://store.steampowered.com/appreviews/{appid}
  - App Details API:    https://store.steampowered.com/api/appdetails?appids={appid}
  - SteamSpy API:       https://steamspy.com/api.php (community stats, no key needed)

Rate limiting: Steam doesn't publish official limits, but ~1 req/sec per IP
is considered safe. We stay at ~0.5 req/sec to be conservative.
"""
import asyncio
import logging
import os
from typing import Dict, List, Optional

import aiohttp

from .utils import RateLimiter, random_delay, with_retry, random_user_agent

logger = logging.getLogger(__name__)

# ~30 requests/minute — conservative for unauthenticated Steam endpoints
_rate_limiter = RateLimiter(max_calls=30, period=60.0)

# Known Steam App IDs for common games.
# Add more as needed: https://store.steampowered.com/search/ → URL contains appid
STEAM_APP_IDS: Dict[str, int] = {
    "Disney Dreamlight Valley": 1401590,
    "Fortnite": 1665460,
    "Among Us": 945360,
    "Overwatch 2": 2357570,
    "Grand Theft Auto V": 271590,
    "Minecraft": 1672970,
    "Apex Legends": 1172470,
    "Valorant": 1843240,
    "Cyberpunk 2077": 1091500,
    "Counter-Strike 2": 730,
    "Dota 2": 570,
    "Team Fortress 2": 440,
    "Left 4 Dead 2": 550,
    "Elden Ring": 1245620,
    "Baldur's Gate 3": 1086940,
    "Palworld": 1623730,
    "Helldivers 2": 553850,
}

# Ordered classifiers — first match wins.
# Covers technical bugs AND sentiment/design/exploit signals per the MVP spec.
_CLASSIFIERS = [
    ("crash",       ["crash", "freeze", "ctd", "black screen", "won't launch", "doesn't start", "force close"]),
    ("connectivity",["server", "connection", "online", "disconnect", "matchmaking", "multiplayer", "can't connect", "login"]),
    ("performance", ["fps", "frame", "stutter", "lag", "optimization", "performance", "slow", "unplayable"]),
    ("exploit",     ["exploit", "dupe", "duplication", "infinite", "cheat", "hack", "broken economy", "pay to win", "p2w"]),
    ("progression", ["quest", "mission", "objective", "npc", "story", "can't complete", "can't finish",
                     "stuck on", "blocked", "can't progress", "item missing", "won't spawn",
                     "interaction", "trigger", "broke my", "broke the"]),
    ("sentiment",   ["terrible", "awful", "worst", "disappointed", "waste", "money", "greed", "greedy",
                     "unfair", "pay to win", "microtransaction", "event", "frustrated", "impossible",
                     "unclear", "confusing", "don't understand", "makes no sense", "bad design",
                     "too hard", "unbalanced", "nerf", "buff"]),
    ("bug",         ["bug", "glitch", "broken", "issue", "error", "not working", "doesn't work",
                     "can't", "unable", "won't", "missing", "disappeared", "corrupted", "lost"]),
]


def _classify_review(text: str) -> str:
    t = text.lower()
    for issue_type, keywords in _CLASSIFIERS:
        if any(k in t for k in keywords):
            return issue_type
    return "general"


def _relevance_score(text: str) -> int:
    """Score a review's relevance as a QA signal. Min 1 for any negative review."""
    t = text.lower()
    score = 1
    for _, keywords in _CLASSIFIERS:
        score += sum(1 for kw in keywords if kw in t)
    return score


class SteamCollector:
    """
    Collects bug-related reviews and community signals from Steam.
    No API key required — uses Steam's public JSON endpoints.
    """

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            headers={"User-Agent": random_user_agent()}
        )
        return self

    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()

    def _require_session(self):
        if not self._session:
            raise RuntimeError("Use 'async with SteamCollector()' context manager.")

    @with_retry(max_retries=3, base_delay=2.0)
    async def get_recent_reviews(
        self,
        app_id: int,
        num_per_page: int = 20,
        day_range: int = 7,
    ) -> List[Dict]:
        """
        Fetch recent negative reviews via Steam Reviews API.
        Covers all signal types: crashes, bugs, progression blockers,
        sentiment spikes, exploit reports, and design complaints.
        Results sorted by relevance_score descending.
        """
        self._require_session()
        await _rate_limiter.acquire()

        url = f"https://store.steampowered.com/appreviews/{app_id}"
        params = {
            "json": 1,
            "filter": "recent",
            "language": "english",
            "day_range": day_range,
            "num_per_page": num_per_page,
            "purchase_type": "all",
            "review_type": "negative",  # focus on complaints
        }

        try:
            async with self._session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 429:
                    retry_after = float(resp.headers.get("Retry-After", 30))
                    logger.warning(f"Steam rate limited, waiting {retry_after}s")
                    await asyncio.sleep(retry_after)
                    raise RuntimeError("Rate limited, retry")

                if resp.status != 200:
                    logger.error(f"Steam reviews API error: HTTP {resp.status} for appid {app_id}")
                    return []

                data = await resp.json(content_type=None)

                if data.get("success") != 1:
                    logger.warning(f"Steam API returned success=0 for appid {app_id}")
                    return []

                reviews = []
                for r in data.get("reviews", []):
                    text = r.get("review", "")
                    if not text.strip():
                        continue
                    reviews.append({
                        "id": r.get("recommendationid"),
                        "author_steamid": r.get("author", {}).get("steamid"),
                        "playtime_hours": round(r.get("author", {}).get("playtime_forever", 0) / 60, 1),
                        "text": text,
                        "voted_up": r.get("voted_up", False),
                        "votes_up": r.get("votes_up", 0),
                        "votes_funny": r.get("votes_funny", 0),
                        "created_utc": r.get("timestamp_created"),
                        "updated_utc": r.get("timestamp_updated"),
                        "received_for_free": r.get("received_for_free", False),
                        "written_during_early_access": r.get("written_during_early_access", False),
                        "app_id": app_id,
                        "relevance_score": _relevance_score(text),
                        "issue_type": _classify_review(text),
                        "source": "steam_review",
                    })

                # Sort by relevance — most actionable signals first
                reviews.sort(key=lambda r: r["relevance_score"], reverse=True)
                await random_delay(1.0, 2.5)
                logger.info(f"Steam: {len(reviews)} reviews for appid {app_id}")
                return reviews

        except asyncio.TimeoutError:
            logger.error(f"Steam: timeout fetching reviews for appid {app_id}")
            raise

    @with_retry(max_retries=2, base_delay=1.0)
    async def get_app_details(self, app_id: int) -> Optional[Dict]:
        """
        Fetch basic app metadata (name, description, genres, release date).
        Useful for enriching game context.
        """
        self._require_session()
        await _rate_limiter.acquire()

        url = "https://store.steampowered.com/api/appdetails"
        params = {"appids": app_id, "filters": "basic,release_date,genres"}

        try:
            async with self._session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json(content_type=None)
                app_data = data.get(str(app_id), {})
                if not app_data.get("success"):
                    return None

                info = app_data.get("data", {})
                await random_delay(0.5, 1.5)
                return {
                    "app_id": app_id,
                    "name": info.get("name"),
                    "short_description": info.get("short_description"),
                    "release_date": info.get("release_date", {}).get("date"),
                    "genres": [g["description"] for g in info.get("genres", [])],
                    "developers": info.get("developers", []),
                    "publishers": info.get("publishers", []),
                }
        except Exception as e:
            logger.error(f"Steam: error fetching app details for {app_id}: {e}")
            return None

    @with_retry(max_retries=2, base_delay=1.0)
    async def get_review_summary(self, app_id: int) -> Optional[Dict]:
        """
        Get aggregate review stats (total reviews, positive ratio, etc.)
        to feed into the health score calculation.
        """
        self._require_session()
        await _rate_limiter.acquire()

        url = f"https://store.steampowered.com/appreviews/{app_id}"
        params = {"json": 1, "num_per_page": 0, "language": "all"}

        try:
            async with self._session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json(content_type=None)
                if data.get("success") != 1:
                    return None

                summary = data.get("query_summary", {})
                await random_delay(0.5, 1.0)
                return {
                    "app_id": app_id,
                    "total_reviews": summary.get("total_reviews", 0),
                    "total_positive": summary.get("total_positive", 0),
                    "total_negative": summary.get("total_negative", 0),
                    "review_score": summary.get("review_score", 0),       # 0-9
                    "review_score_desc": summary.get("review_score_desc", ""),
                    "positive_ratio": (
                        summary["total_positive"] / summary["total_reviews"]
                        if summary.get("total_reviews", 0) > 0 else None
                    ),
                }
        except Exception as e:
            logger.error(f"Steam: error fetching review summary for {app_id}: {e}")
            return None

    async def collect_game_signals(
        self, game_name: str, day_range: int = 7
    ) -> List[Dict]:
        """
        High-level method: collect bug signals for a game by name.
        Returns empty list if the game isn't in STEAM_APP_IDS.
        """
        app_id = STEAM_APP_IDS.get(game_name)
        if not app_id:
            logger.warning(f"Steam: no App ID mapping for '{game_name}'")
            return []

        reviews = await self.get_recent_reviews(app_id, num_per_page=50, day_range=day_range)
        # Attach game name for downstream consumers
        for r in reviews:
            r["game"] = game_name
        return reviews


# ---------------------------------------------------------------------------
# Quick demo / manual test
# ---------------------------------------------------------------------------
async def _demo():
    print("🎮 Testing Steam Collector...")
    async with SteamCollector() as collector:
        # App details
        details = await collector.get_app_details(STEAM_APP_IDS["Cyberpunk 2077"])
        if details:
            print(f"  App: {details['name']} — {details['release_date']}")

        # Review summary
        summary = await collector.get_review_summary(STEAM_APP_IDS["Cyberpunk 2077"])
        if summary:
            ratio = summary.get("positive_ratio") or 0
            print(f"  Reviews: {summary['total_reviews']} total, {ratio:.0%} positive")
            print(f"  Score: {summary['review_score_desc']}")

        # Recent bug reviews
        signals = await collector.collect_game_signals("Cyberpunk 2077", day_range=30)
        print(f"  Bug signals (last 30 days): {len(signals)}")
        for s in signals[:3]:
            print(f"    [{s['issue_type']}] {s['text'][:80]}...")


if __name__ == "__main__":
    asyncio.run(_demo())
