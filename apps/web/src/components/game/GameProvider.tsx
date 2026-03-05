'use client';

import { type ReactNode, Suspense, createContext, useContext, useEffect, useState } from 'react';
import { type GpuQuality, detectGpuQuality } from '@/lib/gpu-detector';

/** Context value passed to all game components */
interface GameContextValue {
  /** Detected GPU quality preset */
  quality: GpuQuality;
}

const GameContext = createContext<GameContextValue>({ quality: 'medium' });

/** Hook to access the game context (GPU quality, etc.) */
export function useGameContext(): GameContextValue {
  return useContext(GameContext);
}

interface GameProviderProps {
  /** Child game components */
  children: ReactNode;
}

/**
 * Top-level provider for the (game) route group.
 * Detects GPU quality on mount and provides it to all game components.
 * Must be dynamically imported with ssr: false in layout.tsx.
 */
export function GameProvider({ children }: GameProviderProps) {
  const [quality, setQuality] = useState<GpuQuality>('medium');

  useEffect(() => {
    detectGpuQuality().then(setQuality).catch(() => setQuality('medium'));
  }, []);

  return (
    <GameContext.Provider value={{ quality }}>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className="text-lg font-semibold text-indigo-300">Loading adventure...</p>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </GameContext.Provider>
  );
}
