'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import WelcomeModal from './WelcomeModal';

const STORAGE_KEY      = 'ff_demo_access';
const CORRECT_PASSWORD = 'firefighter2026';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked]         = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome]   = useState(false);
  const [input, setInput]               = useState('');
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isUnlocked = stored === 'true';
    setUnlocked(isUnlocked);
    // Show welcome every time the page loads if already unlocked
    if (isUnlocked) setShowWelcome(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setShowWelcome(true); // always show on login
    } else {
      setError('Wrong password. Try again.');
      setInput('');
      setTimeout(() => setError(''), 3000);
    }
  }

  // Still hydrating
  if (unlocked === null) return null;

  // Unlocked — render app + welcome modal on every visit
  if (unlocked) {
    return (
      <>
        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
        {children}
      </>
    );
  }

  // Lock screen
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/firefighter/logo-256.png"
            alt="Firefighter"
            className="h-36 w-auto mx-auto mb-3 drop-shadow-[0_0_24px_rgba(234,88,12,0.6)] drop-shadow-[0_0_48px_rgba(14,165,233,0.3)]"
          />
          <p className="text-sm text-foreground-muted">Demo access · QA Feedback</p>
        </div>

        <div className="mission-control-panel">
          <div className="flex items-center gap-2 mb-4 text-foreground-secondary">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Enter demo password</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full bg-background-tertiary border border-border rounded px-3 py-2.5 pr-10 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-xs text-red-400 -mt-1">{error}</p>}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded font-medium text-sm transition-colors"
            >
              Enter Dashboard
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-foreground-muted mt-6">
          Firefighter · Internal Demo · v0.1
        </p>
      </div>
    </div>
  );
}
