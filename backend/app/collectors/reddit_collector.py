"""
Reddit Data Collector for Firefighter.
Uses asyncpraw (official Reddit OAuth API) for reliable, rate-limit-aware access.

Setup:
  1. Go to https://www.reddit.com/prefs/apps
  2. Create an app → choose "script"
  3. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT in your .env
"""
import asyncio
import os
import logging
from typing import List, Dict, Optional

import asyncpraw
import asyncpraw.exceptions

from .utils import RateLimiter, with_retry, random_delay

logger = logging.getLogger(__name__)

# Reddit allows ~100 requests/min for OAuth script apps; stay well below that.
_rate_limiter = RateLimiter(max_calls=60, period=60.0)

# Keywords that suggest a bug / live issue
_BUG_KEYWORDS = [
    "bug", "glitch", "broken", "crash", "freeze", "stuck",
    "issue", "problem", "error", "not working", "doesn't work",
    "can't", "unable", "won't", "missing", "disappeared",
    "lag", "fps", "performance", "loading", "connection",
    "kicked", "ban", "lost progress", "rollback",
]

# Game → relevant subreddits
_SUBREDDIT_MAP: Dict[str, List[str]] = {
    "Disney Dreamlight Valley": ["DisneyDreamlightValley", "DreamlightValley"],
    "Fortnite": ["FortNiteBR", "FortniteCompetitive", "FortniteCreative"],
    "Among Us": ["AmongUs"],
    "Overwatch 2": ["Overwatch", "OverwatchUniversity", "Competitiveoverwatch"],
    "Grand Theft Auto V": ["gtaonline", "GrandTheftAutoV"],
    "Minecraft": ["Minecraft", "Minecrafthelp"],
    "Apex Legends": ["apexlegends"],
    "Valorant": ["VALORANT"],
    "Call of Duty": ["modernwarfare", "CODWarzone"],
    "Cyberpunk 2077": ["cyberpunkgame"],
}


def _classify_issue(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["crash", "freeze", "close", "exit", "restart", "ctd"]):
        return "crash"
    if any(w in t for w in ["stuck", "can't progress", "quest", "mission", "objective", "story"]):
        return "progression"
    if any(w in t for w in ["connection", "server", "online", "matchmaking", "lag", "disconnect", "kicked"]):
        return "connectivity"
    if any(w in t for w in ["fps", "performance", "slow", "stutter", "frames", "low fps"]):
        return "performance"
    if any(w in t for w in ["ban", "suspended", "account", "login", "auth"]):
        return "account"
    return "bug"


class RedditCollector:
    """
    Collects bug/complaint signals from Reddit using asyncpraw.
    Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET env vars.
    Falls back to unauthenticated read-only access if credentials are missing
    (lower rate limits, ~10 req/min).
    """

    def __init__(self):
        self._reddit: Optional[asyncpraw.Reddit] = None
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        user_agent = os.getenv("REDDIT_USER_AGENT", "Firefighter QA Bot v1.0 by /u/firefighter_bot")

        if client_id and client_secret:
            self._reddit = asyncpraw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
            )
            logger.info("Reddit: using OAuth (authenticated)")
        else:
            # Read-only mode — no credentials needed but rate-limited to ~10 req/min
            self._reddit = asyncpraw.Reddit(
                client_id="",
                client_secret="",
                user_agent=user_agent,
            )
            logger.warning(
                "Reddit: REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set. "
                "Running in anonymous mode (very low rate limits)."
            )

    async def close(self) -> None:
        if self._reddit:
            await self._reddit.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()

    @with_retry(max_retries=3, base_delay=2.0)
    async def _fetch_subreddit_posts(self, subreddit_name: str, limit: int = 50) -> List[Dict]:
        """Fetch recent posts from a single subreddit."""
        await _rate_limiter.acquire()

        try:
            subreddit = await self._reddit.subreddit(subreddit_name)
            posts = []
            async for submission in subreddit.new(limit=limit):
                posts.append({
                    "id": submission.id,
                    "title": submission.title,
                    "selftext": submission.selftext or "",
                    "score": submission.score,
                    "upvote_ratio": submission.upvote_ratio,
                    "num_comments": submission.num_comments,
                    "created_utc": submission.created_utc,
                    "author": str(submission.author) if submission.author else "[deleted]",
                    "url": submission.url,
                    "permalink": f"https://reddit.com{submission.permalink}",
                    "subreddit": subreddit_name,
                    "flair": submission.link_flair_text,
                })

            await random_delay(0.5, 1.5)
            logger.info(f"Reddit: fetched {len(posts)} posts from r/{subreddit_name}")
            return posts

        except asyncpraw.exceptions.RedditAPIException as e:
            logger.error(f"Reddit API error for r/{subreddit_name}: {e}")
            return []
        except Exception as e:
            logger.error(f"Reddit: unexpected error for r/{subreddit_name}: {e}")
            raise  # let @with_retry handle it

    def _score_post(self, post: Dict, game_keywords: List[str]) -> Dict:
        """Add relevance/bug scores and issue classification to a post."""
        text = (post["title"] + " " + post["selftext"]).lower()
        bug_score = sum(1 for kw in _BUG_KEYWORDS if kw in text)
        game_score = sum(1 for kw in game_keywords if kw in text)
        return {
            **post,
            "bug_score": bug_score,
            "game_score": game_score,
            "relevance_score": bug_score * 2 + game_score,
            "issue_type": _classify_issue(text),
        }

    async def collect_subreddit_posts(self, subreddit: str, limit: int = 25) -> List[Dict]:
        """Public helper: fetch posts from one subreddit (no scoring)."""
        return await self._fetch_subreddit_posts(subreddit, limit)

    async def collect_game_signals(
        self, game_name: str, game_aliases: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Collect and score bug-related signals for a specific game
        across all mapped subreddits.
        """
        subreddits = _SUBREDDIT_MAP.get(game_name, [])
        if not subreddits:
            logger.warning(f"Reddit: no subreddit mapping for '{game_name}'")
            return []

        game_keywords = [game_name.lower()] + [a.lower() for a in (game_aliases or [])]

        all_posts: List[Dict] = []
        for sr in subreddits:
            posts = await self._fetch_subreddit_posts(sr, limit=50)
            scored = [self._score_post(p, game_keywords) for p in posts]
            # Keep only posts with at least one bug signal
            relevant = [p for p in scored if p["bug_score"] > 0 or p["game_score"] > 0]
            all_posts.extend(relevant)

        # Sort by bug relevance, then recency
        all_posts.sort(
            key=lambda p: (p["bug_score"], p["created_utc"]),
            reverse=True,
        )

        logger.info(f"Reddit: {len(all_posts)} relevant signals for '{game_name}'")
        return all_posts

    async def search_game_issues(self, game_name: str, query: str = "", limit: int = 25) -> List[Dict]:
        """
        Full-text search across Reddit for a specific game + optional query.
        More targeted than subreddit browsing.
        """
        await _rate_limiter.acquire()
        search_query = f"{game_name} {query} bug OR crash OR issue OR error".strip()

        try:
            results = []
            async for submission in self._reddit.subreddit("all").search(
                search_query, sort="new", time_filter="week", limit=limit
            ):
                results.append({
                    "id": submission.id,
                    "title": submission.title,
                    "selftext": submission.selftext or "",
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "created_utc": submission.created_utc,
                    "author": str(submission.author) if submission.author else "[deleted]",
                    "permalink": f"https://reddit.com{submission.permalink}",
                    "subreddit": submission.subreddit.display_name,
                    "issue_type": _classify_issue(submission.title + " " + (submission.selftext or "")),
                })

            await random_delay(0.5, 1.5)
            logger.info(f"Reddit search: {len(results)} results for '{search_query}'")
            return results

        except Exception as e:
            logger.error(f"Reddit search error: {e}")
            return []


# ---------------------------------------------------------------------------
# Quick demo / manual test
# ---------------------------------------------------------------------------
async def _demo():
    print("🔥 Testing Reddit Collector (asyncpraw)...")
    async with RedditCollector() as collector:
        signals = await collector.collect_game_signals("Fortnite")
        print(f"✅ {len(signals)} signals for Fortnite")
        for p in signals[:3]:
            print(f"  [{p['issue_type']}] {p['title'][:70]}  (bug={p['bug_score']})")


if __name__ == "__main__":
    asyncio.run(_demo())
