'use client';

import { Zap, Globe, ChevronRight, X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-lg mission-control-panel border border-primary/30 shadow-2xl shadow-primary/10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/firefighter/logo-64.png"
            alt="Firefighter"
            className="h-12 w-auto drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">Welcome to Firefighter</h2>
            <p className="text-xs text-foreground-muted">QA Intelligence · Early Warning System</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
          Firefighter monitors community sources in real time and surfaces live issues
          before they escalate — giving your QA team an early warning system backed by
          real player reports.
        </p>

        {/* Feature bullets */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary border border-border">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center mt-0.5">
              <Zap className="h-3.5 w-3.5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Live versions only</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Data is collected exclusively from live released builds — not betas or test
                branches. What you see reflects what real players are experiencing right now.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary border border-border">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center mt-0.5">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Any game, any publisher</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Add monitoring for titles from any developer or publisher — indie, AA, or
                AAA. No SDK integration required on the game side.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background-tertiary border border-border">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center mt-0.5">
              <span className="text-sm">🎮</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Steam Reviews</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Currently ingesting Steam player reviews. Reddit threads, Twitter/X posts,
                and Discord signals are coming in the next iteration.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-foreground-muted px-1.5 py-0.5 rounded border border-border">
                  Reddit · soon
                </span>
                <span className="text-[10px] text-foreground-muted px-1.5 py-0.5 rounded border border-border">
                  Twitter/X · soon
                </span>
                <span className="text-[10px] text-foreground-muted px-1.5 py-0.5 rounded border border-border">
                  Discord · soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded font-medium text-sm transition-colors"
        >
          Got it — show me the dashboard
          <ChevronRight className="h-4 w-4" />
        </button>

        <p className="text-center text-xs text-foreground-muted mt-3">
          This is a demo build · feedback welcome
        </p>
      </div>
    </div>
  );
}
