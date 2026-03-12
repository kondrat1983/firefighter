'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Flame, Lock, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'ff_demo_access';
const CORRECT_PASSWORD = 'firefighter2026';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null); // null = loading
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUnlocked(stored === 'true');
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError('Wrong password. Try again.');
      setInput('');
      setTimeout(() => setError(''), 3000);
    }
  }

  // Still checking localStorage
  if (unlocked === null) return null;

  // App unlocked — render normally
  if (unlocked) return <>{children}</>;

  // Lock screen
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-shadow mb-1">Firefighter</h1>
          <p className="text-sm text-foreground-muted">Demo access · QA Feedback</p>
        </div>

        {/* Card */}
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

            {error && (
              <p className="text-xs text-red-400 -mt-1">{error}</p>
            )}

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
