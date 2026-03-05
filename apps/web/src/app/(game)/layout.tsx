import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

/**
 * Dynamic import of GameProvider with SSR disabled.
 * Three.js and WebGL require the browser environment (window, WebGLRenderingContext).
 * Rendering on the server would crash — this ensures the game only runs client-side.
 */
const GameProvider = dynamic(
  () => import('@/components/game/GameProvider').then((m) => m.GameProvider),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-lg font-semibold text-indigo-300">Loading adventure...</p>
        </div>
      </div>
    ),
  },
);

interface GameLayoutProps {
  children: ReactNode;
}

/**
 * Layout for the (game) route group.
 * Wraps all /g/* routes with the GameProvider (client-only, GPU detection).
 * No server-side navigation shell — the 3D HUD handles all in-game navigation.
 */
export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-gray-950 overflow-hidden">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
