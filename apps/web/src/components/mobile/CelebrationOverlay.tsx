'use client';

import { type FC, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

/** Celebration event types */
export type CelebrationType =
  | 'badge_unlocked'
  | 'module_completed'
  | 'streak_milestone'
  | 'level_up';

interface CelebrationOverlayProps {
  /** Type of celebration to show */
  type: CelebrationType;
  /** Primary text (e.g., badge name, module title) */
  title: string;
  /** Secondary text (e.g., description) */
  subtitle?: string;
  /** Emoji icon to display */
  emoji?: string;
  /** XP bonus amount to show */
  xpBonus?: number;
  /** Callback when celebration is dismissed */
  onDismiss: () => void;
}

/** Single confetti particle state */
interface ConfettiParticle {
  /** Unique key */
  id: number;
  /** Horizontal position (0-100%) */
  left: number;
  /** Fall duration (seconds) */
  duration: number;
  /** Animation delay (seconds) */
  delay: number;
  /** Particle color */
  color: string;
  /** Particle size (px) */
  size: number;
}

/** Available confetti colors */
const CONFETTI_COLORS = [
  'bg-primary',
  'bg-yellow-400',
  'bg-pink-400',
  'bg-green-400',
  'bg-blue-400',
  'bg-orange-400',
  'bg-purple-400',
];

/**
 * Generate confetti particles with random positions.
 * @param count - Number of particles to generate
 * @returns Array of confetti particle configs
 */
function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 0.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? 'bg-primary',
    size: 6 + Math.random() * 6,
  }));
}

/**
 * Full-screen celebration overlay for gamification milestones.
 * Shows confetti, an emoji icon, title, subtitle, and XP bonus.
 * CSS-only animations for zero bundle cost.
 *
 * @param type - Celebration type (badge, module, streak, level)
 * @param title - Primary celebration text
 * @param subtitle - Secondary description text
 * @param emoji - Emoji icon to display
 * @param xpBonus - XP bonus amount
 * @param onDismiss - Callback when dismissed
 */
export const CelebrationOverlay: FC<CelebrationOverlayProps> = ({
  type,
  title,
  subtitle,
  emoji = '🎉',
  xpBonus,
  onDismiss,
}) => {
  const [confetti] = useState(() => generateConfetti(30));
  const [visible, setVisible] = useState(true);
  const { heavy } = useHapticFeedback();

  /** Trigger haptic on mount */
  useEffect(() => {
    heavy();
  }, [heavy]);

  /** Auto-dismiss after 4 seconds */
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  /** Handle tap to dismiss early */
  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss();
  }, [onDismiss]);

  if (!visible) return null;

  /** Background gradient based on type */
  const bgClass: Record<CelebrationType, string> = {
    badge_unlocked: 'from-yellow-500/20 to-transparent',
    module_completed: 'from-primary/20 to-transparent',
    streak_milestone: 'from-orange-500/20 to-transparent',
    level_up: 'from-purple-500/20 to-transparent',
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={handleDismiss}
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b backdrop-blur-sm',
        bgClass[type],
      )} />

      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className={cn('absolute top-0 rounded-full', p.color)}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-8 text-center animate-in zoom-in-50 duration-500">
        {/* Emoji icon */}
        <span
          className="text-6xl"
          style={{ animation: 'badge-reveal 0.6s ease-out forwards' }}
        >
          {emoji}
        </span>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}

        {/* XP bonus */}
        {xpBonus && xpBonus > 0 && (
          <span className="mt-1 rounded-full bg-primary/10 px-4 py-1 text-lg font-bold text-primary">
            +{xpBonus} XP
          </span>
        )}

        {/* Tap to dismiss */}
        <p className="mt-4 text-xs text-muted-foreground/50">
          Tap anywhere to continue
        </p>
      </div>

      {/* CSS keyframes injected via style tag */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes badge-reveal {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
