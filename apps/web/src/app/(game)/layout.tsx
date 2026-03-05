import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

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
 * Wraps all /g/* routes with ProtectedRoute (redirects to /login if unauthenticated)
 * and GameProvider (client-only GPU detection + game context).
 * Does NOT include <html>/<body> — those are provided by the root layout.
 */
export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <ProtectedRoute>
      <GameProvider>{children}</GameProvider>
    </ProtectedRoute>
  );
}
