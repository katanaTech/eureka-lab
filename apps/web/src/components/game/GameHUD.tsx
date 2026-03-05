'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { CAREER_OPTIONS } from './CareerPicker';

interface GameHUDProps {
  /** XP value to display (passed from gamification store) */
  xp: number;
  /** Streak count to display */
  streak: number;
  /** Level number (1–6) */
  level: number;
  /** Whether the user is inside a zone (shows back button) */
  showBackButton?: boolean;
  /** Back button action */
  onBack?: () => void;
}

/**
 * Heads-up display overlay rendered on top of the 3D canvas via absolute positioning.
 * Shows XP bar, streak, level, career identity, and navigation shortcuts.
 */
export function GameHUD({ xp, streak, level, showBackButton = false, onBack }: GameHUDProps) {
  const router = useRouter();
  const { careerArchetype, characterCustomization, completedMissionIds } = useGameStore();
  const careerOption = CAREER_OPTIONS.find((c) => c.id === careerArchetype);

  // XP per level thresholds (simplified)
  const xpForNextLevel = level * 500;
  const xpProgress = Math.min((xp % xpForNextLevel) / xpForNextLevel, 1);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-4 p-4">
        {/* Character identity */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-2 backdrop-blur-sm">
          <span className="text-2xl" role="img" aria-label={careerOption?.name}>
            {careerOption?.emoji ?? '🎮'}
          </span>
          <div>
            <p className="text-sm font-bold text-white leading-none">
              {characterCustomization.name || 'Hero'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Level {level} {careerOption?.name}</p>
          </div>
        </div>

        {/* Center — XP bar */}
        <div className="flex flex-1 max-w-xs flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{xp.toLocaleString()} XP</span>
            <span>Lv {level + 1}: {(xpForNextLevel).toLocaleString()} XP</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Right — streak + missions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-gray-900/80 px-3 py-2 backdrop-blur-sm">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-orange-400">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-gray-900/80 px-3 py-2 backdrop-blur-sm">
            <span className="text-lg">⚔️</span>
            <span className="text-sm font-bold text-white">{completedMissionIds.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom bar — navigation */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-gray-800/80"
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push('/g/inventory')}
          className="rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-gray-800/80"
        >
          🎒 Inventory
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-gray-400 backdrop-blur-sm hover:bg-gray-800/80"
        >
          📊 Classic Mode
        </button>
      </div>
    </div>
  );
}
