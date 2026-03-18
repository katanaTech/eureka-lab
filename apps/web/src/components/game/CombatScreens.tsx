'use client';

import { useState, useEffect } from 'react';

/** Shared prop type for all screens that need an exit callback */
interface WithExit { onExit: () => void }

interface IntroScreenProps extends WithExit {
  zombieName: string;
  zombieDialogue: string;
  playerMaxHp: number;
  zombieMaxHp: number;
  onFight: () => void;
}

/**
 * Combat intro screen — shows the zombie's entrance dialogue and the FIGHT button.
 *
 * @param zombieName - Display name of the enemy
 * @param zombieDialogue - Enemy taunt shown under the name
 * @param playerMaxHp - Player starting HP
 * @param zombieMaxHp - Enemy starting HP
 * @param onFight - Called when the player presses FIGHT
 * @param onExit - Called when the player retreats
 */
export function IntroScreen({
  zombieName,
  zombieDialogue,
  playerMaxHp,
  zombieMaxHp,
  onFight,
  onExit,
}: IntroScreenProps) {
  // Battle-entry flash: white overlay fades out on mount for a dramatic entrance
  const [flashVisible, setFlashVisible] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setFlashVisible(false), 16);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      {/* Entry flash overlay */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-50 bg-white transition-opacity duration-500 ${
          flashVisible ? 'opacity-70' : 'opacity-0'
        }`}
      />
      <div className="text-center">
        <p className="mb-4 text-8xl">🧟</p>
        <h1 className="mb-2 text-4xl font-black text-red-400">{zombieName}</h1>
        <p className="text-lg italic text-gray-300">"{zombieDialogue}"</p>
      </div>
      <div className="flex gap-10 text-center">
        <div>
          <p className="mb-1 text-xs text-gray-500">Your HP</p>
          <p className="text-3xl font-black text-green-400">{playerMaxHp}</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div>
          <p className="mb-1 text-xs text-gray-500">Enemy HP</p>
          <p className="text-3xl font-black text-red-400">{zombieMaxHp}</p>
        </div>
      </div>
      <button
        onClick={onFight}
        className="rounded-2xl bg-red-600 px-14 py-4 text-2xl font-black text-white shadow-lg shadow-red-900/50 transition-all hover:bg-red-500 active:scale-95"
      >
        FIGHT!
      </button>
      <button onClick={onExit} className="text-sm text-gray-600 underline">
        Retreat
      </button>
    </div>
  );
}

interface VictoryScreenProps extends WithExit {
  zombieName: string;
  xpAwarded: number;
}

/**
 * Post-battle victory screen — trophy, XP reward, and world navigation.
 *
 * @param zombieName - Name of the defeated enemy
 * @param xpAwarded - XP earned (0 while API call is in-flight)
 * @param onExit - Navigate back to the world map
 */
export function VictoryScreen({ zombieName, xpAwarded, onExit }: VictoryScreenProps) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-center">
      <p className="animate-bounce text-8xl">🏆</p>
      <h1 className="text-5xl font-black text-yellow-400">VICTORY!</h1>
      <p className="text-gray-300">You defeated {zombieName}!</p>
      {xpAwarded > 0 && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/20 px-8 py-3">
          <p className="text-2xl font-black text-yellow-400">+{xpAwarded} XP</p>
        </div>
      )}
      <button
        onClick={onExit}
        className="rounded-2xl bg-indigo-600 px-10 py-3 text-xl font-bold text-white transition-all hover:bg-indigo-500"
      >
        Back to World
      </button>
    </div>
  );
}

interface DefeatScreenProps extends WithExit {
  zombieName: string;
}

/**
 * Post-battle defeat screen — loss message and retry prompt.
 *
 * @param zombieName - Name of the victorious enemy
 * @param onExit - Navigate back to the world map
 */
export function DefeatScreen({ zombieName, onExit }: DefeatScreenProps) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-center">
      <p className="text-8xl">💀</p>
      <h1 className="text-5xl font-black text-red-500">DEFEATED</h1>
      <p className="text-gray-400">{zombieName} was too strong this time.</p>
      <p className="text-sm text-gray-500">Study more and try again!</p>
      <button
        onClick={onExit}
        className="rounded-2xl bg-gray-700 px-10 py-3 text-xl font-bold text-white transition-all hover:bg-gray-600"
      >
        Back to World
      </button>
    </div>
  );
}
