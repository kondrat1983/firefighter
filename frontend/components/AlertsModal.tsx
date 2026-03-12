'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

export interface AlertItem {
  id: number;
  type: string;
  title: string;
  confidence: number;
  mention_count: number;
  sources: string[];
  triggered_at: number;
  status: string;
  game?: string;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  crash:        { label: 'CRSH', bg: 'bg-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400' },
  progression:  { label: 'PROG', bg: 'bg-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  connectivity: { label: 'CONN', bg: 'bg-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  sentiment:    { label: 'SENT', bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
};
const defaultCfg = { label: 'ALRT', bg: 'bg-primary/20', text: 'text-primary', dot: 'bg-primary' };
const typeOf = (t: string) => TYPE_CONFIG[t?.toLowerCase()] ?? defaultCfg;

interface Props {
  alerts: AlertItem[];
  onClose: () => void;
}

export default function AlertsModal({ alerts, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mission-control-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-new flex-shrink-0" />
            All Live Alerts
            <span className="text-sm font-normal text-foreground-muted ml-1">
              {alerts.length} active
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors p-1 rounded hover:bg-background-tertiary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable alert list */}
        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          {alerts.map((alert) => {
            const cfg = typeOf(alert.type);
            return (
              <div
                key={alert.id}
                className={`alert-card hover:border-primary/50 transition-all ${alert.status === 'new' ? 'alert-glow' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`status-indicator flex-shrink-0 ${
                        alert.status === 'new'          ? 'bg-status-new' :
                        alert.status === 'investigating'? 'bg-status-investigating' :
                                                          'bg-status-confirmed'
                      } text-white`}>
                        {alert.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-foreground-secondary whitespace-nowrap">
                        #{alert.id} · {alert.type.toUpperCase()}
                      </span>
                      <div className="flex gap-1">
                        {alert.sources.map(src => (
                          <div key={src} className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            src === 'steam'   ? 'bg-blue-500' :
                            src === 'reddit'  ? 'bg-orange-500' :
                            src === 'twitter' ? 'bg-cyan-400' : 'bg-gray-500'
                          }`} title={src} />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground leading-snug mb-0.5">
                      {alert.title}
                    </div>
                    {alert.game && (
                      <div className="text-xs text-foreground-muted mb-1">{alert.game}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-foreground-secondary">
                      <span>{alert.mention_count} mentions</span>
                      <span className={`font-medium ${
                        alert.confidence > 0.8 ? 'text-risk-low' :
                        alert.confidence > 0.6 ? 'text-risk-medium' : 'text-risk-high'
                      }`}>
                        {Math.round(alert.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <div
                      className="text-xs text-foreground-muted whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      {new Date(alert.triggered_at * 1000).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <Link
                      href={`/alerts/${alert.id}`}
                      onClick={onClose}
                      className="text-xs text-primary hover:text-primary-light whitespace-nowrap"
                    >
                      Investigate →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border text-center">
          <button
            onClick={onClose}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
