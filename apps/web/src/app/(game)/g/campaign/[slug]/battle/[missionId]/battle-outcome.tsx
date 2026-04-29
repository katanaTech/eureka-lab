'use client';

import Link from 'next/link';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { GameButton } from '@/components/game/fantasy';

// ── VictoryPanel ─────────────────────────────────────────────────────────────

interface VictoryPanelProps {
  /** XP awarded for victory */
  xpAwarded: number;
  /** KP awarded (gamified mode only, 0 otherwise) */
  kpAwarded: number;
  /** Badge IDs unlocked */
  badgesUnlocked: string[];
  /** Whether this was an overlord battle */
  isOverlord: boolean;
  /** Campaign slug for navigation */
  slug: string;
  /** Whether in gamified mode */
  isGameMode: boolean;
  /** Called when the user wants to view the certificate (overlord only) */
  onViewCertificate: () => void;
}

/**
 * Victory outcome panel — shows rewards and navigation options.
 * For overlord victories, offers a certificate link. For minion/guardian,
 * navigates back to the campaign page.
 *
 * @param props - Victory display props
 * @returns Styled victory panel with reward summary and CTAs
 */
export function VictoryPanel({
  xpAwarded,
  kpAwarded,
  badgesUnlocked,
  isOverlord,
  slug,
  isGameMode,
  onViewCertificate,
}: VictoryPanelProps) {
  return (
    <div className="mx-auto mt-8 max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      {/* Trophy icon */}
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-yellow-400/30 to-amber-600/10 shadow-[0_0_30px_hsl(45_90%_50%/0.3)]">
          <Trophy className="h-10 w-10 text-yellow-400" aria-hidden />
        </div>
      </div>

      <h2 className="font-display text-3xl uppercase tracking-widest text-glow-gold">
        Victory!
      </h2>

      {/* Rewards */}
      <div className="mt-6 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-card/60 px-4 py-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-foreground">{xpAwarded} XP earned</span>
        </div>

        {isGameMode && kpAwarded > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-sm">
            <span className="font-display text-accent">{kpAwarded} KP</span>
            <span className="text-muted-foreground">earned</span>
          </div>
        )}

        {badgesUnlocked.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm">
            <span className="text-emerald-400">
              {badgesUnlocked.length} badge{badgesUnlocked.length > 1 ? 's' : ''} unlocked!
            </span>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isOverlord ? (
          <GameButton variant="gold" size="lg" onClick={onViewCertificate}>
            <Trophy className="h-4 w-4" aria-hidden />
            View Certificate
          </GameButton>
        ) : (
          <Link href={`/g/campaign/${slug}`}>
            <GameButton variant="primary" size="md">
              <Home className="h-4 w-4" aria-hidden />
              Back to Campaign
            </GameButton>
          </Link>
        )}

        <Link href="/g/dashboard">
          <GameButton variant="ghost" size="md">
            Realm Map
          </GameButton>
        </Link>
      </div>
    </div>
  );
}

// ── DefeatPanel ──────────────────────────────────────────────────────────────

interface DefeatPanelProps {
  /** Campaign slug for navigation */
  slug: string;
  /** Mission ID for retry link */
  missionId: string;
  /** Called when the player taps retry */
  onRetry: () => void;
}

/**
 * Defeat outcome panel — shows a retry button and an exit-to-Academy CTA.
 *
 * @param props - Defeat display props
 * @returns Styled defeat panel with retry and exit CTAs
 */
export function DefeatPanel({ slug, missionId, onRetry }: DefeatPanelProps) {
  return (
    <div className="mx-auto mt-8 max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      {/* Skull icon */}
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-red-500/20 to-red-900/10 shadow-[0_0_30px_hsl(0_70%_50%/0.2)]">
          <span className="text-4xl" aria-hidden>
            💀
          </span>
        </div>
      </div>

      <h2 className="font-display text-3xl uppercase tracking-widest text-red-400">
        Defeated
      </h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-xs mx-auto">
        The enemy was too strong this time. Study more at the Academy and try again.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <GameButton variant="primary" size="md" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try Again
        </GameButton>

        <Link href={`/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="md">
            <Home className="h-4 w-4" aria-hidden />
            Return to Academy
          </GameButton>
        </Link>
      </div>
    </div>
  );
}
