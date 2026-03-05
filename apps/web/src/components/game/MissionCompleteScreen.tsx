'use client';

import { useEffect, useState } from 'react';
import type { MissionReward } from '@eureka-lab/shared-types';

interface MissionCompleteScreenProps {
  /** Reward data to display */
  reward: MissionReward;
  /** Called after the reveal animation finishes */
  onDismiss: () => void;
}

/**
 * Full-screen overlay shown after a mission is completed.
 * Celebrates with an animated XP counter and optional item reveal.
 * Uses CSS animations only — no external animation library.
 */
export function MissionCompleteScreen({ reward, onDismiss }: MissionCompleteScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'xp' | 'item' | 'done'>('enter');
  const [displayedXp, setDisplayedXp] = useState(0);

  useEffect(() => {
    // Phase 1: entrance animation
    const t1 = setTimeout(() => setPhase('xp'), 600);
    return () => clearTimeout(t1);
  }, []);

  // Animate XP counter
  useEffect(() => {
    if (phase !== 'xp') return;
    let start = 0;
    const step = Math.ceil(reward.xp / 30);
    const interval = setInterval(() => {
      start = Math.min(start + step, reward.xp);
      setDisplayedXp(start);
      if (start >= reward.xp) {
        clearInterval(interval);
        setTimeout(() => setPhase(reward.item ? 'item' : 'done'), 500);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [phase, reward.xp, reward.item]);

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 transition-all duration-500',
        'bg-gray-950/95 backdrop-blur-sm',
        phase === 'enter' ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
      ].join(' ')}
      style={{ transform: phase === 'enter' ? 'scale(0.95)' : 'scale(1)' }}
    >
      {/* Confetti particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-3 w-3 rounded-sm animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'][i % 5],
              animationDelay: `${Math.random() * 1}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Mission complete badge */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="text-6xl animate-bounce">⚔️</div>
        <h1 className="text-4xl font-black tracking-tight text-white">Mission Complete!</h1>
      </div>

      {/* XP reward */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-gray-400 text-sm uppercase tracking-widest">XP Earned</p>
        <p className="text-6xl font-black text-yellow-400">+{displayedXp}</p>
      </div>

      {/* Badge reward */}
      {reward.badgeId && (
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 text-center">
          <p className="text-xs text-yellow-400 uppercase tracking-widest">Badge Unlocked!</p>
          <p className="mt-1 text-lg font-bold text-white">🏆 {reward.badgeId}</p>
        </div>
      )}

      {/* Equipment item reveal */}
      {phase === 'item' && reward.item && (
        <div
          className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-8 py-4 text-center"
          style={{ animation: 'fadeInUp 0.5s ease-out' }}
        >
          <p className="text-xs text-indigo-400 uppercase tracking-widest">Equipment Reward!</p>
          <p className="mt-1 text-2xl">⚔️</p>
          <p className="mt-1 text-lg font-bold text-white">{reward.item.name}</p>
          <p className="text-xs text-gray-400 capitalize">{reward.item.rarity} · {reward.item.slot}</p>
        </div>
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 rounded-2xl bg-indigo-600 px-10 py-3 text-base font-black text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition"
      >
        Continue →
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
