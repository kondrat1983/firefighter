#!/usr/bin/env python3
"""
Firefighter Demo Backend
Простая версия без dependencies для демонстрации
"""
import json
import time
import random
import ssl
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
from typing import List, Dict

# macOS Python 3.x often lacks system SSL certs — use unverified context for demo.
# In production (FastAPI + aiohttp) this is handled via certifi.
_SSL_CTX = ssl._create_unverified_context()

# ---------------------------------------------------------------------------
# Steam App ID mapping (public API, no key needed)
# ---------------------------------------------------------------------------
STEAM_APP_IDS = {
    "Disney Dreamlight Valley": 1401590,
    "Fortnite": 1665460,
    "Among Us": 945360,
    "Overwatch 2": 2357570,
    "Grand Theft Auto V": 271590,
    "Cyberpunk 2077": 1091500,
    "Apex Legends": 1172470,
    "Elden Ring": 1245620,
    "Helldivers 2": 553850,
    "Palworld": 1623730,
}

# Cache: app_id -> {"reviews": [...], "summary": {...}, "fetched_at": float}
_steam_cache: Dict[int, dict] = {}
_steam_lock = threading.Lock()
STEAM_CACHE_TTL = 300  # 5 minutes

# Keyword sets per issue type. Order matters — first match wins.
_CLASSIFIERS = [
    ("crash",       ["crash", "freeze", "ctd", "black screen", "won't launch", "doesn't start", "force close", "game closed"]),
    ("connectivity",["server", "connection", "online", "disconnect", "matchmaking", "multiplayer", "can't connect", "login"]),
    ("performance", ["fps", "frame", "stutter", "lag", "optimization", "performance", "slow", "unplayable"]),
    ("exploit",     ["exploit", "dupe", "duplication", "infinite", "cheat", "hack", "broken economy", "pay to win", "p2w"]),
    ("progression", ["quest", "mission", "objective", "npc", "story", "can't complete", "can't finish",
                     "stuck on", "blocked", "can't progress", "item missing", "won't spawn",
                     "interaction", "trigger", "broke my", "broke the"]),
    ("sentiment",   ["terrible", "awful", "worst", "disappointed", "waste", "money", "greed", "greedy",
                     "unfair", "pay to win", "microtransaction", "event", "frustrated", "impossible",
                     "unclear", "confusing", "don't understand", "makes no sense", "bad design",
                     "too hard", "too easy", "unbalanced", "nerf", "buff", "broken balance"]),
    ("bug",         ["bug", "glitch", "broken", "issue", "error", "not working", "doesn't work",
                     "can't", "unable", "won't", "missing", "disappeared", "corrupted", "lost"]),
]


def _classify_steam(text: str) -> str:
    t = text.lower()
    for issue_type, keywords in _CLASSIFIERS:
        if any(k in t for k in keywords):
            return issue_type
    return "general"


def _relevance_score(text: str) -> int:
    """
    Score a review's relevance as a QA signal.
    Higher = more actionable. Minimum 1 for any negative review.
    """
    t = text.lower()
    score = 1  # base score — every negative review is worth something
    for _, keywords in _CLASSIFIERS:
        score += sum(1 for kw in keywords if kw in t)
    return score


def _fetch_steam_raw(app_id: int, num_per_page: int = 20) -> dict:
    url = (
        f"https://store.steampowered.com/appreviews/{app_id}"
        f"?json=1&filter=recent&language=english"
        f"&num_per_page={num_per_page}&review_type=negative&purchase_type=all"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; FirefighterBot/1.0)"})
        with urllib.request.urlopen(req, timeout=10, context=_SSL_CTX) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[Steam] reviews fetch error appid={app_id}: {e}")
        return {}


def _fetch_steam_summary_raw(app_id: int) -> dict:
    url = f"https://store.steampowered.com/appreviews/{app_id}?json=1&num_per_page=0&language=all"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; FirefighterBot/1.0)"})
        with urllib.request.urlopen(req, timeout=10, context=_SSL_CTX) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[Steam] summary fetch error appid={app_id}: {e}")
        return {}


def get_steam_data_cached(app_id: int) -> dict:
    """Return cached Steam data, refreshing if older than STEAM_CACHE_TTL."""
    with _steam_lock:
        cached = _steam_cache.get(app_id)
        if cached and time.time() - cached["fetched_at"] < STEAM_CACHE_TTL:
            return cached

    raw = _fetch_steam_raw(app_id)
    summary_raw = _fetch_steam_summary_raw(app_id)

    reviews = []
    if raw.get("success") == 1:
        for r in raw.get("reviews", []):
            text = r.get("review", "")
            if not text.strip():
                continue
            reviews.append({
                "id": r.get("recommendationid"),
                "text": text[:300],
                "playtime_hours": round(r.get("author", {}).get("playtime_forever", 0) / 60, 1),
                "created_utc": r.get("timestamp_created"),
                "relevance_score": _relevance_score(text),
                "issue_type": _classify_steam(text),
                "source": "steam_review",
            })
    # Sort by relevance so most actionable reviews come first
    reviews.sort(key=lambda r: r["relevance_score"], reverse=True)

    summary = {}
    if summary_raw.get("success") == 1:
        qs = summary_raw.get("query_summary", {})
        total = qs.get("total_reviews", 0)
        pos = qs.get("total_positive", 0)
        summary = {
            "total_reviews": total,
            "total_positive": pos,
            "total_negative": qs.get("total_negative", 0),
            "positive_ratio": round(pos / total, 3) if total > 0 else None,
            "score_desc": qs.get("review_score_desc", ""),
        }

    result = {
        "app_id": app_id,
        "reviews": reviews,
        "summary": summary,
        "fetched_at": time.time(),
        "review_count": len(reviews),
    }
    with _steam_lock:
        _steam_cache[app_id] = result
    return result


def _prefetch_steam_background():
    """Warm the Steam cache for all known games on startup."""
    time.sleep(2)
    for game_name, app_id in STEAM_APP_IDS.items():
        try:
            data = get_steam_data_cached(app_id)
            print(f"[Steam] {game_name}: {data['review_count']} bug reviews cached")
            time.sleep(1.5)
        except Exception as e:
            print(f"[Steam] Prefetch failed for {game_name}: {e}")


# ---------------------------------------------------------------------------
# Enhanced realistic data generators
# ---------------------------------------------------------------------------
def generate_realistic_game_data():
    """Generate realistic game data with variations"""
    base_games = [
        {"name": "Disney Dreamlight Valley", "base_health": 85, "base_alerts": 3},
        {"name": "Fortnite", "base_health": 92, "base_alerts": 1}, 
        {"name": "Among Us", "base_health": 95, "base_alerts": 0},
        {"name": "Overwatch 2", "base_health": 78, "base_alerts": 2}
    ]
    
    games = []
    for i, game in enumerate(base_games):
        # Add some realistic variation
        health_variation = random.randint(-5, 5)
        alert_variation = random.choice([0, 0, 1, -1])  # Usually same, sometimes +/-1
        
        games.append({
            "id": i + 1,
            "name": game["name"],
            "health_score": max(70, min(100, game["base_health"] + health_variation)),
            "active_alerts": max(0, game["base_alerts"] + alert_variation),
            "signals_today": random.randint(100, 1000),
            "monitoring_active": i != 2,  # Among Us offline
        })
    
    return games

def generate_realistic_alerts():
    """Kept for compatibility — delegates to build_real_alerts."""
    return build_real_alerts()


def build_real_alerts():
    """Generate real alerts from Steam cached reviews, grouped by (game, issue_type)."""
    from collections import defaultdict

    groups = defaultdict(list)
    for game_name, app_id in STEAM_APP_IDS.items():
        with _steam_lock:
            cached = _steam_cache.get(app_id)
        if not cached or not cached.get("reviews"):
            continue
        for review in cached["reviews"]:
            key = (game_name, app_id, review["issue_type"])
            groups[key].append(review)

    alerts = []
    alert_id = 100

    # Sort by total relevance descending so hottest issues come first
    sorted_groups = sorted(
        groups.items(),
        key=lambda x: sum(r["relevance_score"] for r in x[1]),
        reverse=True,
    )

    type_labels = {
        "crash":        "Crash reports",
        "connectivity": "Connection issues",
        "performance":  "Performance complaints",
        "exploit":      "Exploit reports",
        "progression":  "Progression blockers",
        "sentiment":    "Negative sentiment spike",
        "bug":          "Bug reports",
        "general":      "General complaints",
    }

    investigation_steps_map = {
        "crash": [
            "Reproduce crash conditions in QA environment",
            "Check crash dumps and error logs",
            "Verify recent code changes in affected area",
            "Test across different hardware configurations",
        ],
        "performance": [
            "Profile CPU/GPU usage in reported scenarios",
            "Check for recent performance regressions",
            "Analyze memory allocation patterns",
            "Test on minimum spec hardware",
        ],
        "progression": [
            "Identify specific quest/objective trigger conditions",
            "Verify game state flags and save data integrity",
            "Test progression path on all platforms",
            "Check for collision/interaction hitbox issues",
        ],
        "connectivity": [
            "Check server-side logs for connection drops",
            "Verify matchmaking service health",
            "Test with different network configurations",
            "Review recent backend changes",
        ],
        "sentiment": [
            "Analyze most common complaint themes",
            "Review monetization feedback specifically",
            "Cross-reference with recent patch notes",
            "Prioritize items with highest upvote counts",
        ],
        "exploit": [
            "Reproduce exploit conditions in isolated environment",
            "Assess impact on game economy/balance",
            "Determine patch priority and rollout plan",
            "Monitor for spread in community",
        ],
        "bug": [
            "Reproduce reported bug scenarios in QA",
            "Check bug tracker for related open issues",
            "Verify fix for similar past issues",
            "Test edge cases and corner conditions",
        ],
    }

    for (game_name, app_id, issue_type), reviews in sorted_groups:
        if len(reviews) < 2:
            continue  # Need at least 2 reports to trigger an alert

        reviews_by_relevance = sorted(reviews, key=lambda r: r["relevance_score"], reverse=True)
        top_review = reviews_by_relevance[0]
        total_relevance = sum(r["relevance_score"] for r in reviews)

        # Confidence: base 0.5 + boost per report + boost per relevance point, capped at 0.97
        confidence = min(0.97, 0.50 + len(reviews) * 0.04 + total_relevance * 0.008)

        earliest = min(r["created_utc"] for r in reviews)
        latest   = max(r["created_utc"] for r in reviews)

        store_url   = f"https://store.steampowered.com/app/{app_id}/"
        reviews_url = f"https://store.steampowered.com/app/{app_id}/#app_{app_id}_reviews"

        # Evidence: top 5 most relevant reviews
        evidence = []
        for rev in reviews_by_relevance[:5]:
            evidence.append({
                "source":         "steam",
                "content":        rev["text"][:300],
                "timestamp":      rev["created_utc"],
                "url":            reviews_url,
                "review_id":      rev["id"],
                "playtime_hours": rev["playtime_hours"],
                "helpful":        rev["relevance_score"],
            })

        # Detection timeline from actual review timestamps
        sorted_by_time = sorted(reviews, key=lambda r: r["created_utc"])
        timeline = []
        for i, r in enumerate(sorted_by_time[:3]):
            if i == 0:
                event = "First Steam review detected"
            elif i == 1:
                event = "Second report confirmed pattern"
            else:
                event = f"{len(reviews)} total reports accumulated"
            timeline.append({"time": r["created_utc"], "event": event, "source": "steam"})
        timeline.append({"time": latest, "event": "Alert threshold crossed", "source": "system"})

        title = f"{type_labels.get(issue_type, issue_type)} in {game_name}"
        clean_text = " ".join(top_review["text"].split())  # collapse whitespace
        preview = clean_text[:150]
        if len(clean_text) > 150:
            preview = preview.rsplit(" ", 1)[0] + "…"

        ai_summary = (
            f"Detected {len(reviews)} Steam reviews reporting {issue_type} issues in {game_name}. "
            f"Total signal strength: {total_relevance} (higher = more actionable). "
            f"Top report: \"{preview}\""
        )

        alert = {
            "id":                     alert_id,
            "type":                   issue_type,
            "title":                  title,
            "game":                   game_name,
            "game_app_id":            app_id,
            "confidence":             round(confidence, 2),
            "mention_count":          len(reviews),
            "source_count":           1,
            "sources":                ["steam"],
            "triggered_at":           latest,
            "earliest_at":            earliest,
            "status":                 "new" if len(reviews) >= 4 else "investigating",
            "total_relevance":        total_relevance,
            "evidence":               evidence,
            "timeline":               timeline,
            "ai_summary":             ai_summary,
            "suggested_investigations": investigation_steps_map.get(issue_type, [
                "Review reported issues",
                "Test in QA environment",
                "Check recent changes",
                "Monitor for additional reports",
            ]),
            "steam_store_url":        store_url,
        }
        alerts.append(alert)
        alert_id += 1

    return alerts

# Global cache for data
data_cache = {
    "last_update": 0,
    "streams": [],
    "health_metrics": {}
}

# Live streams data (mock but realistic)
def get_live_streams_data():
    """Get realistic live streams data with REAL YouTube videos"""
    
    # Реальные YouTube видео по нашим играм из дашборда
    real_streams = [
        # Disney Dreamlight Valley - популярные геймплей видео
        {
            "id": "yt_ddv_1",
            "platform": "YouTube",
            "title": "Disney Dreamlight Valley - Bug Testing & Gameplay",
            "streamer": "DaphneBelMonte",
            "viewers": random.randint(800, 2500),
            "thumbnail": "🏰",
            "status": "live",
            "game": "Disney Dreamlight Valley",
            "video_id": "gkXzeZ0KE5Q",  # DDV gameplay видео
            "embed_url": "https://www.youtube.com/embed/gkXzeZ0KE5Q?autoplay=1&mute=1"
        },
        {
            "id": "yt_ddv_2", 
            "platform": "YouTube",
            "title": "Disney Dreamlight Valley - New Update Exploration",
            "streamer": "GameWithAlyss",
            "viewers": random.randint(500, 1500),
            "thumbnail": "✨",
            "status": "live",
            "game": "Disney Dreamlight Valley",
            "video_id": "kJd8IoKdCwI",  # DDV update видео
            "embed_url": "https://www.youtube.com/embed/kJd8IoKdCwI?autoplay=1&mute=1"
        },
        
        # Fortnite - популярные стримы
        {
            "id": "yt_fortnite_1",
            "platform": "YouTube", 
            "title": "Fortnite Chapter 5 - Live Ranked Gameplay",
            "streamer": "Ninja",
            "viewers": random.randint(5000, 15000),
            "thumbnail": "⚡",
            "status": "live",
            "game": "Fortnite",
            "video_id": "V-_O7nl0Ii0",  # Fortnite gameplay
            "embed_url": "https://www.youtube.com/embed/V-_O7nl0Ii0?autoplay=1&mute=1"
        },
        {
            "id": "tw_fortnite_2",
            "platform": "Twitch",
            "title": "Fortnite Zero Build - Testing New Season", 
            "streamer": "SypherPK",
            "viewers": random.randint(2000, 8000),
            "thumbnail": "🎯",
            "status": "live",
            "game": "Fortnite",
            "video_id": "9RyPKUC8YMU",  # Fortnite zero build
            "embed_url": "https://www.youtube.com/embed/9RyPKUC8YMU?autoplay=1&mute=1"
        },
        
        # Overwatch 2 - популярные стримы
        {
            "id": "yt_ow2_1",
            "platform": "YouTube",
            "title": "Overwatch 2 - Competitive Season 13 Gameplay",
            "streamer": "KarQ", 
            "viewers": random.randint(1000, 4000),
            "thumbnail": "🎮",
            "status": "live",
            "game": "Overwatch 2",
            "video_id": "D8wWOd2nB0E",  # OW2 competitive 
            "embed_url": "https://www.youtube.com/embed/D8wWOd2nB0E?autoplay=1&mute=1"
        },
        {
            "id": "yt_ow2_2",
            "platform": "YouTube",
            "title": "Overwatch 2 - New Hero Analysis & Testing",
            "streamer": "Flats", 
            "viewers": random.randint(800, 3000),
            "thumbnail": "🛡️",
            "status": "live",
            "game": "Overwatch 2",
            "video_id": "9RyPKUC8YMU",  # OW2 hero guide
            "embed_url": "https://www.youtube.com/embed/9RyPKUC8YMU?autoplay=1&mute=1"
        },
        
        # Among Us - популярные стримы
        {
            "id": "yt_among_1",
            "platform": "YouTube",
            "title": "Among Us - Modded Lobbies & New Roles",
            "streamer": "DisguisedToast",
            "viewers": random.randint(1500, 5000), 
            "thumbnail": "🚀",
            "status": "live",
            "game": "Among Us",
            "video_id": "fJ9rUzIMcZQ",  # Among Us modded
            "embed_url": "https://www.youtube.com/embed/fJ9rUzIMcZQ?autoplay=1&mute=1"
        },
        {
            "id": "tw_among_1",
            "platform": "Twitch",
            "title": "Among Us - Hide & Seek Mod Testing", 
            "streamer": "5up",
            "viewers": random.randint(800, 2500),
            "thumbnail": "👻",
            "status": "live",
            "game": "Among Us",
            "video_id": "D8wWOd2nB0E",  # Among Us hide & seek
            "embed_url": "https://www.youtube.com/embed/D8wWOd2nB0E?autoplay=1&mute=1"
        }
    ]
    
    return real_streams


class FirefighterAPI(BaseHTTPRequestHandler):
    """Простой HTTP сервер для демо API"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Route handling
        if parsed_path.path == '/':
            response = {
                "status": "operational",
                "service": "firefighter-demo-backend",
                "message": "🔥 Firefighter Demo API"
            }
        
        elif parsed_path.path == '/api/games':
            response = self.get_games_data()

        elif parsed_path.path.startswith('/api/games/'):
            try:
                game_id = int(parsed_path.path.split('/')[-1])
                response = self.get_game_detail(game_id)
            except (ValueError, IndexError):
                response = {"error": "Invalid game ID"}
        
        elif parsed_path.path == '/api/alerts':
            response = self.get_alerts_data()

        elif parsed_path.path.startswith('/api/alerts/'):
            try:
                alert_id = int(parsed_path.path.split('/')[-1])
                response = self.get_alert_detail(alert_id)
            except (ValueError, IndexError):
                response = {"error": "Invalid alert ID"}
        
        elif parsed_path.path == '/api/signals':
            response = self.get_signals_data()
        
        elif parsed_path.path == '/api/health':
            response = self.get_health_data()
            
        elif parsed_path.path == '/api/streams':
            response = self.get_streams_data()

        elif parsed_path.path == '/api/steam/reviews':
            params = parse_qs(parsed_path.query)
            game = params.get('game', [None])[0]
            response = self.get_steam_reviews(game)

        elif parsed_path.path == '/api/sources/status':
            response = self.get_sources_status()

        else:
            response = {"error": "Not found"}
        
        self.wfile.write(json.dumps(response).encode())
    
    def get_games_data(self):
        """Enhanced games data with realistic variations"""
        return {
            "games": generate_realistic_game_data()
        }

    def get_game_detail(self, game_id: int):
        """Full game detail: info + alerts + Steam summary."""
        games = generate_realistic_game_data()
        game = next((g for g in games if g["id"] == game_id), None)
        if not game:
            return {"error": f"Game {game_id} not found"}

        # Attach alerts for this game
        all_alerts = build_real_alerts()
        game_name = game["name"]
        game_alerts = [
            {k: v for k, v in a.items() if k not in ("evidence", "timeline", "ai_summary", "suggested_investigations")}
            for a in all_alerts if a.get("game") == game_name
        ]

        # Steam summary from cache
        app_id = STEAM_APP_IDS.get(game_name)
        steam_summary = {}
        if app_id:
            with _steam_lock:
                cached = _steam_cache.get(app_id)
            if cached:
                steam_summary = cached.get("summary", {})
                steam_summary["review_count"] = cached.get("review_count", 0)
                steam_summary["app_id"] = app_id

        # Issue breakdown from real reviews
        issue_counts: dict = {}
        if app_id:
            with _steam_lock:
                cached = _steam_cache.get(app_id)
            if cached:
                for rev in cached.get("reviews", []):
                    t = rev["issue_type"]
                    issue_counts[t] = issue_counts.get(t, 0) + 1

        return {
            **game,
            "alerts": game_alerts,
            "steam_summary": steam_summary,
            "issue_breakdown": issue_counts,
            "steam_store_url": f"https://store.steampowered.com/app/{app_id}/" if app_id else None,
        }
    
    def get_alerts_data(self):
        """Real alerts from Steam reviews — list view (no heavy evidence payload)."""
        all_alerts = build_real_alerts()
        # Strip heavy fields for list view
        summary = []
        for a in all_alerts:
            summary.append({k: v for k, v in a.items()
                            if k not in ("evidence", "timeline", "ai_summary", "suggested_investigations")})
        return {"alerts": summary[:15]}

    def get_alert_detail(self, alert_id: int):
        """Full alert detail including evidence and timeline."""
        all_alerts = build_real_alerts()
        for alert in all_alerts:
            if alert["id"] == alert_id:
                return alert
        # Fallback: return first alert if ID not found (demo friendliness)
        if all_alerts:
            return all_alerts[0]
        return {"error": f"Alert {alert_id} not found — Steam cache may still be warming up"}
    
    def get_signals_data(self):
        """Signal timeline — real Steam reviews + mock signals for other sources."""
        current_time = time.time()
        signals = []

        # Real Steam signals from cache
        game_list = list(STEAM_APP_IDS.items())
        for game_name, app_id in game_list[:4]:  # top 4 dashboard games
            with _steam_lock:
                cached = _steam_cache.get(app_id)
            if not cached:
                continue
            for review in cached.get("reviews", [])[:3]:  # up to 3 per game
                ts = review.get("created_utc")
                if not ts:
                    continue
                issue = review.get("issue_type", "general")
                severity_map = {
                    "crash":        "critical",
                    "connectivity": "high",
                    "exploit":      "high",
                    "progression":  "medium",
                    "performance":  "medium",
                    "sentiment":    "medium",
                    "bug":          "low",
                    "general":      "low",
                }
                signals.append({
                    "timestamp": ts,
                    "type": "signal",
                    "message": f"🎮 Steam [{issue.upper()}] {review['text'][:60]}…",
                    "severity": severity_map.get(issue, "low"),
                    "game_id": list(STEAM_APP_IDS.keys()).index(game_name) + 1,
                    "source": "steam",
                })

        # Pad with mock signals for other sources
        mock_messages = [
            ("🔴 Alert triggered: crash spike", "critical", "alert"),
            ("📡 Reddit: multiple bug reports", "high", "signal"),
            ("✅ Alert investigating", "medium", "update"),
            ("📊 Data collection cycle complete", "low", "collection"),
            ("📡 Steam review pattern detected", "medium", "signal"),
            ("📊 Reddit: 8 new reports processed", "low", "collection"),
        ]
        for i in range(12):
            msg, sev, typ = random.choice(mock_messages)
            signals.append({
                "timestamp": current_time - (i * random.randint(300, 1800)),
                "type": typ,
                "message": msg,
                "severity": sev,
                "game_id": random.randint(1, 4),
                "source": "system",
            })

        signals.sort(key=lambda s: s["timestamp"], reverse=True)
        return {"signals": signals[:25]}
    
    def get_streams_data(self):
        """Get live streams data"""
        return {
            "streams": get_live_streams_data()
        }

    def get_steam_reviews(self, game: str):
        """Return real Steam bug reviews for a game (or all cached games)."""
        if game:
            app_id = STEAM_APP_IDS.get(game)
            if not app_id:
                return {"error": f"Unknown game: {game}", "known_games": list(STEAM_APP_IDS.keys())}
            data = get_steam_data_cached(app_id)
            return {
                "game": game,
                "app_id": app_id,
                "reviews": data["reviews"],
                "summary": data["summary"],
                "review_count": data["review_count"],
                "fetched_at": data["fetched_at"],
            }
        # No game specified → return summary for all cached games
        result = []
        for gname, aid in STEAM_APP_IDS.items():
            with _steam_lock:
                cached = _steam_cache.get(aid)
            if cached:
                result.append({
                    "game": gname,
                    "app_id": aid,
                    "review_count": cached["review_count"],
                    "summary": cached["summary"],
                    "fetched_at": cached["fetched_at"],
                })
        return {"games": result}

    def get_sources_status(self):
        """Return live status for each data source."""
        now = time.time()

        # Steam: real data from cache
        steam_total_bugs = 0
        steam_last_fetched = None
        for app_id in STEAM_APP_IDS.values():
            with _steam_lock:
                cached = _steam_cache.get(app_id)
            if cached:
                steam_total_bugs += cached.get("review_count", 0)
                ft = cached.get("fetched_at")
                if ft and (steam_last_fetched is None or ft > steam_last_fetched):
                    steam_last_fetched = ft

        def ago(ts):
            if ts is None:
                return "never"
            diff = int(now - ts)
            if diff < 60:
                return f"{diff}s ago"
            if diff < 3600:
                return f"{diff // 60}m ago"
            return f"{diff // 3600}h ago"

        return {
            "sources": [
                {
                    "platform": "steam",
                    "name": "Steam Reviews",
                    "status": "live" if steam_last_fetched else "pending",
                    "signals_cached": steam_total_bugs,
                    "last_signal": ago(steam_last_fetched),
                    "activity": "high" if steam_total_bugs > 10 else "medium" if steam_total_bugs > 0 else "low",
                },
                {
                    "platform": "reddit",
                    "name": "Reddit",
                    "status": "pending",
                    "signals_cached": 0,
                    "last_signal": "—",
                    "activity": "offline",
                },
                {
                    "platform": "twitter",
                    "name": "Twitter / X",
                    "status": "offline",
                    "signals_cached": 0,
                    "last_signal": "—",
                    "activity": "offline",
                },
            ]
        }

    def get_health_data(self):
        """Mock health check data"""
        return {
            "status": "healthy",
            "components": {
                "reddit_collector": "operational",
                "steam_collector": "operational", 
                "twitter_collector": "operational",
                "youtube_collector": "operational",
                "ai_processor": "operational",
                "alert_engine": "operational"
            },
            "metrics": {
                "signals_processed_today": random.randint(1000, 2000),
                "alerts_triggered_today": random.randint(5, 15),
                "active_games": 4,
                "active_streams": len(get_live_streams_data()),
                "system_uptime": "2h 15m"
            }
        }


def run_demo_server():
    """Run the demo server"""
    port = 8001
    server = HTTPServer(('localhost', port), FirefighterAPI)

    # Warm Steam cache in background so first requests are fast
    threading.Thread(target=_prefetch_steam_background, daemon=True).start()
    
    print("🔥 FIREFIGHTER DEMO BACKEND")
    print("=" * 30)
    print(f"🌐 Running on: http://localhost:{port}")
    print("📊 Endpoints available:")
    print("  GET  /                - Health check")
    print("  GET  /api/games       - Games data")
    print("  GET  /api/alerts      - Alerts data")
    print("  GET  /api/signals     - Signals timeline")
    print("  GET  /api/health      - System health")
    print("")
    print("🎮 Connect your frontend to this backend!")
    print("📱 Frontend should be running on http://localhost:3000")
    print("")
    print("Press Ctrl+C to stop...")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down demo backend...")
        server.shutdown()


if __name__ == "__main__":
    run_demo_server()