'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Activity, AlertTriangle } from 'lucide-react';
import type { CustomGame } from '@/components/AddGameModal';

const CUSTOM_GAMES_KEY = 'ff_custom_games';

const ISSUE_CFG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  crash:        { icon: '💥', color: 'text-red-400',    bg: 'bg-red-400/10',    label: 'Crashes' },
  connectivity: { icon: '🌐', color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Connectivity' },
  performance:  { icon: '⚡', color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Performance' },
  progression:  { icon: '🚧', color: 'text-amber-400',  bg: 'bg-amber-400/10',  label: 'Progression' },
  sentiment:    { icon: '💬', color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Sentiment' },
  bug:          { icon: '🐛', color: 'text-green-400',  bg: 'bg-green-400/10',  label: 'Bugs' },
  general:      { icon: '📊', color: 'text-gray-400',   bg: 'bg-gray-400/10',   label: 'General' },
};

function HealthRing({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 text-2xl font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

function CustomGameDetail() {
  const params   = useSearchParams();
  const router   = useRouter();
  const id       = params.get('id');
  const [game, setGame] = useState<CustomGame | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { router.push('/'); return; }
    try {
      const stored: CustomGame[] = JSON.parse(localStorage.getItem(CUSTOM_GAMES_KEY) || '[]');
      const found = stored.find(g => g.id === id);
      if (found) setGame(found);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    }
  }, [id, router]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-foreground-muted">Game not found.</p>
        <Link href="/" className="text-primary hover:text-primary-light text-sm">← Back to dashboard</Link>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isReady = game.phase === 'monitoring' || game.from_backend;
  const breakdown = game.issue_breakdown ?? {};
  const totalIssues = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const hasBreakdown = Object.keys(breakdown).length > 0 && totalIssues > 1;
  const healthColor = game.health_score >= 90 ? 'text-risk-low' : game.health_score >= 70 ? 'text-risk-medium' : 'text-risk-high';
  const steamUrl = `https://store.steampowered.com/app/${game.app_id}/`;

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header card */}
      <div className="mission-control-panel mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{game.name}</h1>
              {game.platform === 'Steam' && (
                <a
                  href={steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light transition-colors"
                  title="View on Steam"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-secondary">
              <span className={`font-medium uppercase text-xs ${
                isReady ? 'text-risk-low' : 'text-risk-medium'
              }`}>
                {isReady ? '● ONLINE' : '◌ INITIALIZING'}
              </span>
              <span>{game.platform}</span>
              {game.app_id && <span className="font-mono text-xs text-foreground-muted">App {game.app_id}</span>}
            </div>

            {/* Review summary */}
            {game.review_count !== undefined && (
              <div className="mt-3 flex items-center gap-4 flex-wrap">
                {game.review_score && (
                  <span className={`text-sm font-medium ${healthColor}`}>
                    ⭐ {game.review_score}
                  </span>
                )}
                <span className="text-sm text-foreground-secondary">
                  {game.review_count.toLocaleString()} Steam reviews analysed
                </span>
                <span className="text-sm text-foreground-secondary">
                  {game.signals_today} signals/day
                </span>
              </div>
            )}
          </div>

          {/* Health ring */}
          <div className="flex flex-col items-center gap-1">
            {isReady ? (
              <HealthRing score={game.health_score} />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <span className="text-xs text-foreground-muted">Health Score</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: <AlertTriangle className="h-4 w-4" />, label: 'Active Alerts', value: game.active_alerts ?? 0, color: game.active_alerts ? 'text-risk-high' : 'text-risk-low' },
          { icon: <Activity className="h-4 w-4" />,      label: 'Signals Today', value: game.signals_today ?? 0, color: 'text-primary' },
          { icon: <span className="text-sm">📋</span>,   label: 'Reviews',       value: game.review_count?.toLocaleString() ?? '—', color: 'text-foreground' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="mission-control-panel text-center">
            <div className={`flex items-center justify-center gap-2 mb-1 ${color}`}>
              {icon}
              <span className="text-xl font-bold">{value}</span>
            </div>
            <div className="text-xs text-foreground-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Issue breakdown */}
      {hasBreakdown ? (
        <div className="mission-control-panel mb-6">
          <h2 className="text-sm font-semibold text-foreground-secondary mb-4 uppercase tracking-wider">
            Issue Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([key, count]) => {
                const cfg = ISSUE_CFG[key] ?? { icon: '📌', color: 'text-gray-400', bg: 'bg-gray-400/10', label: key };
                const pct = Math.round((count / totalIssues) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm w-5 text-center">{cfg.icon}</span>
                    <span className={`text-xs font-medium w-24 ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cfg.bg} border ${cfg.color.replace('text-', 'border-')}`}
                        style={{ width: `${pct}%`, backgroundColor: 'currentColor' }}
                      />
                    </div>
                    <span className="text-xs text-foreground-muted w-12 text-right">{pct}% <span className="text-foreground-muted/60">({count})</span></span>
                  </div>
                );
              })}
          </div>
        </div>
      ) : isReady ? (
        <div className="mission-control-panel mb-6 text-center py-6">
          <p className="text-sm text-foreground-muted">No issue breakdown available yet.</p>
          <p className="text-xs text-foreground-muted mt-1">Run the local backend for deeper analysis.</p>
        </div>
      ) : null}

      {/* Initializing state */}
      {!isReady && (
        <div className="mission-control-panel mb-6">
          <div className="space-y-3">
            <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-1/2" />
            </div>
            <p className="text-sm text-foreground-secondary text-center">
              Scanning {game.platform} reviews & community feeds…
            </p>
            <p className="text-xs text-foreground-muted text-center">
              Start the local backend for real-time analysis
            </p>
          </div>
        </div>
      )}

      {/* Steam link */}
      {game.platform === 'Steam' && (
        <div className="flex justify-center">
          <a
            href={steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-all text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            View on Steam Store
          </a>
        </div>
      )}
    </div>
  );
}

export default function CustomGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CustomGameDetail />
    </Suspense>
  );
}
