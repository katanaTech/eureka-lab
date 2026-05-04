'use client';

/**
 * Mobile battle outcome panels with /m/g/ navigation links.
 * Mirrors desktop battle-outcome.tsx with compact layout.
 */

import Link from 'next/link';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { GameButton } from '@/components/game/fantasy';

// ── MobileVictoryPanel ──────────────────────────────────────────────────────

interface VictoryPanelProps {
  /** XP awarded for victory */
  xpAwarded: number;
  /** KP awarded (gamified mode only) */
  kpAwarded: number;
  /** Badge IDs unlocked */
  badgesUnlocked: string[];
  /** Whether this was an overlord battle */
  isOverlord: boolean;
  /** Campaign slug */
  slug: string;
  /** Whether in gamified mode */
  isGameMode: boolean;
  /** Called to view certificate (overlord only) */
  onViewCertificate: () => void;
}

/**
 * Mobile victory outcome panel with /m/g/ navigation.
 *
 * @param props - Victory display props
 * @returns Styled compact victory panel
 */
export function MobileVictoryPanel({
  xpAwarded, kpAwarded, badgesUnlocked, isOverlord, slug, isGameMode, onViewCertificate,
}: VictoryPanelProps) {
  return (
    <div className="mx-auto mt-6 max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      <div className="mb-3 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-yellow-400/30 to-amber-600/10 shadow-[0_0_30px_hsl(45_90%_50%/0.3)]">
          <Trophy className="h-8 w-8 text-yellow-400" aria-hidden />
        </div>
      </div>

      <h2 className="font-display text-2xl uppercase tracking-widest text-glow-gold">Victory!</h2>

      <div className="mt-4 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card/60 px-3 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span className="text-foreground">{xpAwarded} XP earned</span>
        </div>
        {isGameMode && kpAwarded > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs">
            <span className="font-display text-accent">{kpAwarded} KP</span>
            <span className="text-muted-foreground">earned</span>
          </div>
        )}
        {badgesUnlocked.length > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs">
            <span className="text-emerald-400">{badgesUnlocked.length} badge{badgesUnlocked.length > 1 ? 's' : ''} unlocked!</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {isOverlord ? (
          <GameButton variant="gold" size="md" onClick={onViewCertificate}>
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            View Certificate
          </GameButton>
        ) : (
          <Link href={`/m/g/campaign/${slug}`}>
            <GameButton variant="primary" size="sm">
              <Home className="h-3.5 w-3.5" aria-hidden />
              Back to Campaign
            </GameButton>
          </Link>
        )}
        <Link href="/m/g/dashboard">
          <GameButton variant="ghost" size="sm">Realm Map</GameButton>
        </Link>
      </div>
    </div>
  );
}

// ── MobileDefeatPanel ───────────────────────────────────────────────────────

interface DefeatPanelProps {
  /** Campaign slug */
  slug: string;
  /** Mission ID for retry link */
  missionId: string;
  /** Called when the player taps retry */
  onRetry: () => void;
}

/**
 * Mobile defeat outcome panel with /m/g/ navigation.
 *
 * @param props - Defeat display props
 * @returns Styled compact defeat panel
 */
export function MobileDefeatPanel({ slug, missionId, onRetry }: DefeatPanelProps) {
  return (
    <div className="mx-auto mt-6 max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      <div className="mb-3 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-red-500/20 to-red-900/10 shadow-[0_0_30px_hsl(0_70%_50%/0.2)]">
          <span className="text-3xl" aria-hidden>💀</span>
        </div>
      </div>

      <h2 className="font-display text-2xl uppercase tracking-widest text-red-400">Defeated</h2>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
        The enemy was too strong this time. Study more at the Academy and try again.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <GameButton variant="primary" size="sm" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Try Again
        </GameButton>
        <Link href={`/m/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <Home className="h-3.5 w-3.5" aria-hidden />
            Return to Academy
          </GameButton>
        </Link>
      </div>
    </div>
  );
}
