/**
 * Fetch helper: tries the live backend first (timeout 1.5s),
 * falls back to pre-baked static JSON files in /public/demo-data/
 */

const BACKEND = 'http://localhost:8001';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function toDemoPath(backendPath: string): string {
  // /api/games        → games.json
  // /api/games/1      → game_1.json
  // /api/alerts       → alerts.json
  // /api/alerts/100   → alert_100.json
  // /api/stats        → stats.json
  const stripped = backendPath.replace(/^\/api\//, '');
  const parts = stripped.split('/');
  if (parts.length === 1) return `${parts[0]}.json`;
  if (parts[0] === 'games')  return `game_${parts[1]}.json`;
  if (parts[0] === 'alerts') return `alert_${parts[1]}.json`;
  return `${stripped.replace('/', '_')}.json`;
}

export async function demoFetch<T = unknown>(backendPath: string): Promise<T> {
  // 1️⃣ Try live backend
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${BACKEND}${backendPath}`, { signal: controller.signal });
    clearTimeout(timer);
    if (resp.ok) return resp.json() as Promise<T>;
  } catch {
    // backend unavailable — fall through to demo data
  }

  // 2️⃣ Fall back to static demo data
  const file = toDemoPath(backendPath);
  const resp = await fetch(`${BASE_PATH}/demo-data/${file}`);
  if (!resp.ok) throw new Error(`Demo data not found: ${file}`);
  return resp.json() as Promise<T>;
}
