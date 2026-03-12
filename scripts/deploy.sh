#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  Firefighter — one-command deploy to GitHub Pages
#  Usage:  ./scripts/deploy.sh [--skip-data]
#
#  What it does:
#    1. (optional) refresh demo-data JSONs from live backend
#    2. verify the Next.js static build passes
#    3. commit any changes
#    4. push → GitHub Actions picks up and deploys
# ─────────────────────────────────────────────
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$REPO_ROOT/frontend"
DEMO_DATA="$FRONTEND/public/demo-data"
BACKEND="http://localhost:8001"
SKIP_DATA=false

# ── parse args ──────────────────────────────
for arg in "$@"; do
  case $arg in --skip-data) SKIP_DATA=true ;; esac
done

echo "🔥 Firefighter deploy pipeline"
echo "────────────────────────────────"

# ── 1. refresh demo data ─────────────────────
if [ "$SKIP_DATA" = false ]; then
  echo "📦  Checking backend at $BACKEND …"
  if curl -sf "$BACKEND/api/games" > /dev/null 2>&1; then
    echo "✅  Backend reachable — refreshing demo data"
    mkdir -p "$DEMO_DATA"

    curl -sf "$BACKEND/api/alerts" > "$DEMO_DATA/alerts.json"
    curl -sf "$BACKEND/api/games"  > "$DEMO_DATA/games.json"
    curl -sf "$BACKEND/api/stats"  > "$DEMO_DATA/stats.json" 2>/dev/null || echo "{}" > "$DEMO_DATA/stats.json"

    # game details
    for id in $(python3 -c "
import json
with open('$DEMO_DATA/games.json') as f:
    d = json.load(f)
for g in d.get('games', []):
    print(g['id'])
"); do
      curl -sf "$BACKEND/api/games/$id" > "$DEMO_DATA/game_${id}.json"
    done

    # alert details
    for id in $(python3 -c "
import json
with open('$DEMO_DATA/alerts.json') as f:
    d = json.load(f)
for a in d.get('alerts', []):
    print(a['id'])
"); do
      curl -sf "$BACKEND/api/alerts/$id" > "$DEMO_DATA/alert_${id}.json"
    done

    echo "✅  Demo data refreshed ($(ls $DEMO_DATA | wc -l | tr -d ' ') files)"
  else
    echo "⚠️   Backend not running — skipping data refresh (using existing snapshots)"
  fi
else
  echo "⏭️   Skipping data refresh (--skip-data)"
fi

# ── 2. build check ───────────────────────────
echo ""
echo "🔨  Running Next.js build check …"
cd "$FRONTEND" && \
  NEXT_PUBLIC_BASE_PATH=/firefighter npm run build --silent
echo "✅  Build OK — $(ls $FRONTEND/out | wc -l | tr -d ' ') output files"

# ── 3. git commit ────────────────────────────
echo ""
echo "📝  Staging changes …"
cd "$REPO_ROOT"
git add -A

if git diff --cached --quiet; then
  echo "ℹ️   Nothing changed — skipping commit"
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  git commit -m "deploy: refresh demo data & build · $TIMESTAMP"
  echo "✅  Committed"
fi

# ── 4. push ──────────────────────────────────
echo ""
echo "🚀  Pushing to GitHub …"
git push
echo ""
echo "────────────────────────────────"
echo "✅  Done! GitHub Actions will deploy in ~1 min"
echo "🌐  https://kondrat1983.github.io/firefighter/"
