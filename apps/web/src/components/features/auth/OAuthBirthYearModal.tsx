'use client';

import { useState } from 'react';
import { GameButton } from '@eureka-lab/ui';

const CURRENT_YEAR = new Date().getFullYear();

interface OAuthBirthYearModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Submit handler — receives the chosen birth year. */
  onSubmit: (birthYear: number) => Promise<void> | void;
  /** Cancel handler — closes the modal without completing signup. */
  onCancel: () => void;
}

/**
 * Modal shown after a Google OAuth signInWithPopup when the user has no
 * Firestore profile yet. Collects birthYear so the backend can derive
 * the role. Used by the Welcome page's handleGoogle flow (Plan 3b B.3).
 *
 * Under-13 ages route to the COPPA pipeline; the modal itself just
 * collects and submits — error handling and the under-13 pivot live on
 * the caller side.
 */
export function OAuthBirthYearModal({ open, onSubmit, onCancel }: OAuthBirthYearModalProps) {
  const [birthYear, setBirthYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const yearNum = Number(birthYear);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > CURRENT_YEAR) {
      setError('Year of birth looks odd.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(yearNum);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-birthyear-title"
    >
      <div className="panel rune-ring max-w-md w-full mx-4 p-6 sm:p-8 animate-fade-in-up">
        <h2 id="oauth-birthyear-title" className="font-display text-2xl text-glow-primary text-center">
          One last rune, hero
        </h2>
        <p className="text-sm text-muted-foreground text-center mt-2">
          We need your year of birth to forge the right kind of legend for you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-[11px] font-display tracking-[0.3em] uppercase text-primary/80 mb-1.5">
              Year of Birth
            </span>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder={`${CURRENT_YEAR - 14}`}
              min={1900}
              max={CURRENT_YEAR}
              required
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-input border border-border/70 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <GameButton type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting} className="flex-1">
              Cancel
            </GameButton>
            <GameButton type="submit" variant="primary" size="sm" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '...' : 'Forge Identity'}
            </GameButton>
          </div>
        </form>
      </div>
    </div>
  );
}
