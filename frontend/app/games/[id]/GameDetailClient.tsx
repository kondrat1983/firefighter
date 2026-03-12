'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Flame, XCircle, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { demoFetch } from '@/lib/demoFetch';

interface GameDetail {
  id: number;
  name: string;
  health_score: number;
  active_alerts: number;
  signals_today: number;
  monitoring_active: boolean;
  steam_store_url?: string;
  steam_summary?: {
    total_reviews?: number;
    total_positive?: number;
    total_negative?: number;
    positive_ratio?: number;
    score_desc?: string;
    review_count?: number;
    app_id?: number;
  };
  issue_breakdown?: Record<string, number>;
  alerts?: AlertSummary[];
}

interface AlertSummary {
  id: number;
  type: string;
  title: string;
  confidence: number;
  mention_count: number;
  triggered_at: number;
  status: string;
  total_relevance?: number;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  crash:        { icon: '💥', color: 'text-red-400',    bg: 'bg-red-400/10' },
  connectivity: { icon: '🌐', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  performance:  { icon: '⚡', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  exploit:      { icon: '⚠️', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  progression:  { icon: '🚧', color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  sentiment:    { icon: '💬', color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  bug:          { icon: '🐛', color: 'text-green-400',  bg: 'bg-green-400/10' },
  general:      { icon: '📊', color: 'text-gray-400',   bg: 'bg-gray-400/10' },
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
      <span className="text-xl font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

function formatRelative(unix: number): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    demoFetch<GameDetail>(`/api/games/${params.id}`)
      .then((data: GameDetail) => {
        if ('error' in data) setError((data as any).error);
        else setGame(data);
      })
      .catch(() => setError('Could not load game data'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Flame className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="mission-control-panel text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Link href="/" className="text-primary flex items-center gap-2 justify-center">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const healthColor = game.health_score >= 90 ? 'text-green-400' : game.health_score >= 70 ? 'text-yellow-400' : 'text-red-400';
  const alertsByType = (game.alerts ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  const totalIssues = Object.values(game.issue_breakdown ?? {}).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary-light mb-4 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-shadow mb-1">{game.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${game.monitoring_active ? 'text-green-400' : 'text-gray-500'}`}>
                ● {game.monitoring_active ? 'ONLINE' : 'OFFLINE'}
              </span>
              {game.steam_store_url && (
                <a href={game.steam_store_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  <ExternalLink className="h-3 w-3" /> Steam Store
                </a>
              )}
            </div>
          </div>
          <HealthRing score={game.health_score} />
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-primary">{game.active_alerts}</div>
          <div className="text-xs text-foreground-muted mt-1">Active Alerts</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-foreground">{game.signals_today}</div>
          <div className="text-xs text-foreground-muted mt-1">Signals Today</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className={`text-2xl font-bold ${healthColor}`}>{game.health_score}%</div>
          <div className="text-xs text-foreground-muted mt-1">Health Score</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-foreground">
            {game.steam_summary?.review_count ?? '—'}
          </div>
          <div className="text-xs text-foreground-muted mt-1">Steam Reviews</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — alerts list */}
        <div className="xl:col-span-2 space-y-6">

          {/* Active Alerts */}
          <div className="mission-control-panel">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-new" />
              Active Alerts
              <span className="text-sm font-normal text-foreground-muted">({game.alerts?.length ?? 0})</span>
            </h2>
            {(game.alerts ?? []).length === 0 ? (
              <p className="text-foreground-muted text-sm">No alerts detected — all clear ✅</p>
            ) : (
              <div className="space-y-3">
                {(game.alerts ?? []).map(alert => {
                  const tc = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.general;
                  return (
                    <div key={alert.id} className={`rounded-lg border border-border p-3 ${tc.bg} hover:border-primary/50 transition-all`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{tc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-xs font-semibold uppercase ${tc.color}`}>{alert.type}</span>
                            <span className="text-xs text-foreground-muted">#{alert.id}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              alert.status === 'new' ? 'bg-status-new text-white' :
                              alert.status === 'investigating' ? 'bg-status-investigating text-white' :
                              'bg-status-confirmed text-white'
                            }`}>{alert.status.toUpperCase()}</span>
                          </div>
                          <div className="text-sm font-medium text-foreground mb-1">{alert.title}</div>
                          <div className="flex items-center gap-3 text-xs text-foreground-secondary flex-wrap">
                            <span>{alert.mention_count} reports</span>
                            <span className={`font-medium ${
                              alert.confidence > 0.8 ? 'text-risk-low' :
                              alert.confidence > 0.6 ? 'text-risk-medium' : 'text-risk-high'
                            }`}>{Math.round(alert.confidence * 100)}% confidence</span>
                            <span suppressHydrationWarning>{formatRelative(alert.triggered_at)}</span>
                          </div>
                        </div>
                        <Link
                          href={`/alerts/${alert.id}`}
                          className="flex-shrink-0 text-xs text-primary hover:text-primary-light whitespace-nowrap"
                        >
                          Investigate →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Issue Breakdown from Steam */}
          {totalIssues > 0 && (
            <div className="mission-control-panel">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-risk-medium" />
                Issue Breakdown
                <span className="text-sm font-normal text-foreground-muted">(Steam reviews)</span>
              </h2>
              <div className="space-y-3">
                {Object.entries(game.issue_breakdown ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const tc = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
                    const pct = Math.round((count / totalIssues) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <span>{tc.icon}</span>
                            <span className="capitalize text-foreground">{type}</span>
                          </span>
                          <span className={`font-mono text-xs ${tc.color}`}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${tc.color.replace('text-', 'bg-')}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right — steam stats */}
        <div className="space-y-6">
          {/* Steam Stats */}
          {game.steam_summary && Object.keys(game.steam_summary).length > 0 && (
            <div className="mission-control-panel">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                🎮 Steam Stats
              </h2>
              <div className="space-y-3">
                {game.steam_summary.score_desc && (
                  <div className="text-center py-2 rounded bg-background-tertiary">
                    <div className="text-sm font-semibold text-foreground">{game.steam_summary.score_desc}</div>
                    <div className="text-xs text-foreground-muted">Overall rating</div>
                  </div>
                )}
                {game.steam_summary.positive_ratio != null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-secondary">Positive</span>
                      <span className="text-green-400 font-mono">
                        {Math.round(game.steam_summary.positive_ratio * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.round((game.steam_summary.positive_ratio ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background-tertiary rounded p-2 text-center">
                    <div className="font-mono text-foreground">{(game.steam_summary.total_reviews ?? 0).toLocaleString()}</div>
                    <div className="text-foreground-muted">Total</div>
                  </div>
                  <div className="bg-background-tertiary rounded p-2 text-center">
                    <div className="font-mono text-red-400">{(game.steam_summary.total_negative ?? 0).toLocaleString()}</div>
                    <div className="text-foreground-muted">Negative</div>
                  </div>
                </div>
                {game.steam_store_url && (
                  <a
                    href={`${game.steam_store_url}#app_${game.steam_summary.app_id}_reviews`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" /> View all reviews on Steam
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Alert type summary */}
          {Object.keys(alertsByType).length > 0 && (
            <div className="mission-control-panel">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Alert Types
              </h2>
              <div className="space-y-2">
                {Object.entries(alertsByType).map(([type, count]) => {
                  const tc = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{tc.icon}</span>
                        <span className={`capitalize ${tc.color}`}>{type}</span>
                      </span>
                      <span className="font-mono text-foreground-secondary">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
