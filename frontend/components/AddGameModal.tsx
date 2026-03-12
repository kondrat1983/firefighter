'use client';

import { useState } from 'react';
import { X, Search, Gamepad2, ExternalLink, Loader2 } from 'lucide-react';

export interface CustomGame {
  id: string;
  name: string;
  app_id: string;
  platform: string;
  added_at: number;
  phase: 'initializing' | 'scanning' | 'monitoring';
  health_score: number;
  signals_today: number;
  active_alerts: number;
  // Real data from backend (populated when available)
  review_count?: number;
  review_score?: string;
  issue_breakdown?: Record<string, number>;
  from_backend?: boolean;
}

interface Props {
  onAdd: (game: CustomGame) => void;
  onClose: () => void;
}

function parseSteamInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/app\/(\d+)/);
  return match ? match[1] : null;
}

const PLATFORMS = ['Steam', 'Epic Games', 'PlayStation', 'Xbox', 'Nintendo'];

export default function AddGameModal({ onAdd, onClose }: Props) {
  const [name, setName]           = useState('');
  const [appInput, setAppInput]   = useState('');
  const [platform, setPlatform]   = useState('Steam');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Game name is required.'); return; }

    let appId = '';
    if (platform === 'Steam') {
      const parsed = parseSteamInput(appInput);
      if (!parsed) { setError('Enter a valid Steam App ID or store URL.'); return; }
      appId = parsed;
    } else {
      appId = appInput.trim() || `custom_${Date.now()}`;
    }

    setLoading(true);
    setLoadingMsg('Connecting to Firefighter backend…');

    let backendData: any = null;

    if (platform === 'Steam') {
      // 1) Try the local Firefighter backend first
      try {
        setLoadingMsg('Fetching Steam reviews…');
        const res = await fetch('/api/games/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), app_id: parseInt(appId) }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          backendData = await res.json();
          if (backendData.status !== 'ok') backendData = null;
          else setLoadingMsg('Processing reviews…');
        }
      } catch {
        backendData = null;
      }

      // 2) Fallback: hit Steam's public review API directly from the browser
      if (!backendData) {
        try {
          setLoadingMsg('Fetching from Steam…');
          const steamRes = await fetch(
            `https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=0&purchase_type=all&language=all`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (steamRes.ok) {
            const steamJson = await steamRes.json();
            const qs = steamJson?.query_summary;
            if (qs && qs.total_reviews > 0) {
              const posPct = qs.total_positive / qs.total_reviews;
              backendData = {
                status: 'ok',
                health_score: Math.max(40, Math.min(99, Math.round(posPct * 100))),
                review_count: qs.total_reviews,
                review_score: qs.review_score_desc,
                signals_today: Math.min(999, Math.floor(qs.total_reviews / 500)),
                alerts_found: 0,
                issue_breakdown: {},
              };
              setLoadingMsg('Processing Steam data…');
            }
          }
        } catch {
          // CORS or network error — fall through to demo animation
          backendData = null;
        }
      }
    }

    const newGame: CustomGame = {
      id:             `custom_${Date.now()}`,
      name:           name.trim(),
      app_id:         appId,
      platform,
      added_at:       Date.now(),
      phase:          backendData ? 'monitoring' : 'initializing',
      health_score:   backendData?.health_score ?? 0,
      signals_today:  backendData?.signals_today ?? 0,
      active_alerts:  backendData?.alerts_found  ?? 0,
      review_count:   backendData?.review_count,
      review_score:   backendData?.review_score,
      issue_breakdown: backendData?.issue_breakdown,
      from_backend:   !!backendData,
    };

    setLoading(false);
    onAdd(newGame);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      {/* Panel */}
      <div className="relative w-full max-w-md mission-control-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Add Game to Monitoring
          </h2>
          {!loading && (
            <button
              onClick={onClose}
              className="text-foreground-muted hover:text-foreground transition-colors p-1 rounded hover:bg-background-tertiary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-foreground-secondary">{loadingMsg}</p>
            <div className="w-full h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Game name */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                Game Name <span className="text-risk-high">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Hollow Knight"
                autoFocus
                className="w-full bg-background-tertiary border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                Platform
              </label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                      platform === p
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-background-tertiary text-foreground-secondary hover:border-primary/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* App ID / URL */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                {platform === 'Steam' ? (
                  <span>
                    Steam App ID or Store URL
                    <a
                      href="https://store.steampowered.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-primary inline-flex items-center gap-0.5 hover:text-primary-light"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                ) : (
                  'Store URL or Identifier (optional)'
                )}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type="text"
                  value={appInput}
                  onChange={e => setAppInput(e.target.value)}
                  placeholder={
                    platform === 'Steam'
                      ? '2868840  or  store.steampowered.com/app/2868840'
                      : 'Optional identifier'
                  }
                  className="w-full bg-background-tertiary border border-border rounded pl-9 pr-3 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
              {platform === 'Steam' && (
                <p className="text-[10px] text-foreground-muted mt-1">
                  Find the App ID in the Steam store URL: store.steampowered.com/app/<span className="text-primary font-mono">APP_ID</span>/
                </p>
              )}
            </div>

            {/* What gets monitored */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-foreground-secondary leading-relaxed">
                <span className="text-primary font-medium">What we'll monitor: </span>
                Steam reviews · Reddit threads · Community sentiment · Crash & bug reports
              </p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded border border-border text-sm text-foreground-secondary hover:text-foreground hover:border-primary/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded font-medium text-sm transition-colors"
              >
                Start Monitoring
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
