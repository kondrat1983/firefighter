'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Copy, Flame, Clock, CheckCircle, Search, XCircle } from 'lucide-react';
import { demoFetch } from '@/lib/demoFetch';

interface Evidence {
  source: string;
  content: string;
  timestamp: number;  // unix
  url: string;
  review_id?: string;
  playtime_hours?: number;
  helpful?: number;
}

interface TimelineItem {
  time: number;  // unix
  event: string;
  source: string;
}

interface AlertDetail {
  id: number;
  type: string;
  title: string;
  game: string;
  game_app_id?: number;
  confidence: number;
  mention_count: number;
  source_count: number;
  sources: string[];
  triggered_at: number;  // unix
  earliest_at?: number;
  status: string;
  total_relevance?: number;
  evidence: Evidence[];
  timeline: TimelineItem[];
  ai_summary: string;
  suggested_investigations: string[];
  steam_store_url?: string;
}

function formatUnix(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

function formatUnixTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(unix: number): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  const days = Math.round(diff / 86400);
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  crash:        { icon: '💥', color: 'text-red-400' },
  connectivity: { icon: '🌐', color: 'text-yellow-400' },
  performance:  { icon: '⚡', color: 'text-orange-400' },
  exploit:      { icon: '⚠️', color: 'text-purple-400' },
  progression:  { icon: '🚧', color: 'text-amber-400' },
  sentiment:    { icon: '💬', color: 'text-blue-400' },
  bug:          { icon: '🐛', color: 'text-green-400' },
  general:      { icon: '📊', color: 'text-gray-400' },
};

const SOURCE_DOT: Record<string, string> = {
  steam:   'bg-blue-500',
  reddit:  'bg-orange-500',
  twitter: 'bg-sky-500',
  system:  'bg-primary',
};

export default function AlertDetailsPage({ params }: { params: { id: string } }) {
  const [alert, setAlert]     = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [action, setAction]   = useState<'confirm' | 'false_alarm' | 'investigating'>('confirm');
  const [copied, setCopied]   = useState<number | null>(null);

  useEffect(() => {
    const id = params.id;
    demoFetch<AlertDetail>(`/api/alerts/${id}`)
      .then((data: AlertDetail) => {
        if ('error' in data) {
          setError((data as any).error);
        } else {
          setAlert(data);
        }
      })
      .catch(() => setError('Could not load alert data'))
      .finally(() => setLoading(false));
  }, [params.id]);

  function copyStep(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-10 w-10 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-foreground-secondary">Loading alert details…</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="mission-control-panel text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Alert not found</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:text-primary-light flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.general;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl ${typeConf.color}`}>{typeConf.icon}</span>
              <h1 className="text-3xl font-bold text-shadow">Alert #{alert.id}</h1>
            </div>
            <p className="text-foreground-secondary">
              {alert.type.toUpperCase()} &bull; {alert.game}
            </p>
            <p className="text-xs text-foreground-muted mt-1 font-mono" suppressHydrationWarning>
              Triggered {formatRelative(alert.triggered_at)} &nbsp;&bull;&nbsp; {formatUnix(alert.triggered_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`status-indicator ${
              alert.status === 'new'          ? 'bg-status-new' :
              alert.status === 'investigating' ? 'bg-status-investigating' :
              'bg-status-confirmed'
            } text-white`}>
              {alert.status.toUpperCase()}
            </span>
            <span className="text-sm text-foreground-secondary">
              {Math.round(alert.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="xl:col-span-2 space-y-6">

          {/* AI Summary */}
          <div className="mission-control-panel">
            <h2 className="text-xl font-bold mb-4">🤖 AI Analysis</h2>
            <div className="bg-background-tertiary rounded p-4 mb-4">
              <h3 className={`font-semibold mb-2 ${typeConf.color}`}>{alert.title}</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">{alert.ai_summary}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
              <span>{alert.mention_count} Steam reviews</span>
              <span>{alert.source_count} source{alert.source_count !== 1 ? 's' : ''}</span>
              {alert.total_relevance != null && (
                <span>Signal strength: <span className="text-primary font-mono">{alert.total_relevance}</span></span>
              )}
              {alert.steam_store_url && (
                <a
                  href={alert.steam_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" /> View on Steam
                </a>
              )}
            </div>
          </div>

          {/* Investigation Steps */}
          <div className="mission-control-panel">
            <h2 className="text-xl font-bold mb-4">🔍 Suggested Investigation Steps</h2>
            <div className="space-y-3">
              {alert.suggested_investigations.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-sm text-foreground">{step}</div>
                  <button
                    onClick={() => copyStep(step, idx)}
                    className="text-xs text-foreground-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy step"
                  >
                    {copied === idx ? <CheckCircle className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence — real Steam reviews */}
          <div className="mission-control-panel">
            <h2 className="text-xl font-bold mb-4">
              📋 Evidence &amp; Player Reports
              <span className="text-sm font-normal text-foreground-muted ml-2">(Steam Reviews)</span>
            </h2>
            <div className="space-y-4">
              {alert.evidence.map((ev, idx) => (
                <div key={idx} className="bg-background-tertiary rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${SOURCE_DOT[ev.source] ?? 'bg-gray-500'}`} />
                      <span className="text-sm font-medium text-foreground capitalize">{ev.source}</span>
                      {ev.playtime_hours != null && ev.playtime_hours > 0 && (
                        <span className="text-xs text-foreground-muted">
                          {ev.playtime_hours.toFixed(0)}h played
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs text-foreground-muted font-mono"
                        suppressHydrationWarning
                      >
                        {formatRelative(ev.timestamp)}
                      </span>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                        title="View Steam reviews"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-2 leading-relaxed">
                    &ldquo;{ev.content.trim()}&rdquo;
                  </p>
                  {ev.helpful != null && ev.helpful > 0 && (
                    <div className="text-xs text-foreground-muted">
                      🎯 Relevance score: <span className="text-primary">{ev.helpful}</span>
                    </div>
                  )}
                </div>
              ))}
              {alert.evidence.length === 0 && (
                <p className="text-sm text-foreground-muted italic">
                  Steam cache is still warming up — check back in a moment.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">

          {/* Detection Timeline */}
          <div className="mission-control-panel">
            <h2 className="text-lg font-bold mb-4">⏱️ Detection Timeline</h2>
            <div className="space-y-3">
              {alert.timeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 text-xs font-mono text-foreground-secondary w-14"
                    suppressHydrationWarning
                  >
                    {formatUnixTime(item.time)}
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${SOURCE_DOT[item.source] ?? 'bg-gray-500'}`} />
                  <div className="flex-1 text-xs text-foreground">{item.event}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QA Actions */}
          <div className="mission-control-panel">
            <h2 className="text-lg font-bold mb-4">⚡ QA Actions</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Investigation Result
                </label>
                <select
                  value={action}
                  onChange={e => setAction(e.target.value as any)}
                  className="w-full bg-background-tertiary border border-border rounded px-3 py-2 text-sm text-foreground"
                >
                  <option value="confirm">✅ Confirmed Issue</option>
                  <option value="investigating">🔍 Needs Investigation</option>
                  <option value="false_alarm">❌ False Alarm</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Notes &amp; Comments
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Add your investigation notes here…"
                  className="w-full bg-background-tertiary border border-border rounded px-3 py-2 text-sm text-foreground resize-none"
                  rows={4}
                />
              </div>
              <button className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition-colors">
                Submit Feedback
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-xs text-foreground-secondary space-y-1">
                <div>Alert ID: #{alert.id}</div>
                <div>Game: {alert.game}</div>
                <div>Classification: {alert.type.toUpperCase()}</div>
                <div>Confidence: {Math.round(alert.confidence * 100)}%</div>
                <div>Reports: {alert.mention_count}</div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          {alert.steam_store_url && (
            <div className="mission-control-panel">
              <h2 className="text-lg font-bold mb-3">🔗 Quick Links</h2>
              <div className="space-y-2">
                <a
                  href={alert.steam_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Steam Store — {alert.game}
                </a>
                <a
                  href={`${alert.steam_store_url}#app_${alert.game_app_id}_reviews`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Steam Reviews Section
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
