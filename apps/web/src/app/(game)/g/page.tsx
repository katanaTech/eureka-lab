'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';

/**
 * Game entry point.
 * Redirects to character creator if no career has been chosen yet,
 * otherwise goes straight to the world map.
 */
export default function GameEntryPage() {
  const router = useRouter();
  const careerArchetype = useGameStore((s) => s.careerArchetype);

  useEffect(() => {
    if (careerArchetype) {
      router.replace('/g/world');
    } else {
      router.replace('/g/character');
    }
  }, [careerArchetype, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}
