import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Cinzel } from 'next/font/google';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { DEFAULT_FEATURE_FLAGS } from '@eureka-lab/shared-types';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-cinzel',
});

/**
 * Dynamic import of GameProvider with SSR disabled.
 * Three.js and WebGL require the browser environment (window, WebGLRenderingContext).
 * Rendering on the server would crash — this ensures the game only runs client-side.
 * Only loaded when `fantasyUi` feature flag is disabled (legacy 3D mode).
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
  /** Page content rendered inside the game layout */
  children: ReactNode;
}

/**
 * Layout for the (game) route group.
 * Wraps all /g/* routes with ProtectedRoute (redirects to /login if unauthenticated).
 *
 * Feature-flag gating:
 * - `fantasyUi: true`  → Phase 16 2D cinematic UI — no R3F/WebGL context needed.
 *   Children are rendered directly with the Cinzel font variable applied.
 * - `fantasyUi: false` → Legacy Phase 15 3D mode — GameProvider (Three.js/WebGL) is
 *   loaded dynamically (SSR-disabled) and wraps children.
 *
 * Does NOT include <html>/<body> — those are provided by the root layout.
 *
 * @param children - Page content provided by Next.js App Router
 * @returns JSX element wrapping children in the appropriate provider tree
 */
export default function GameLayout({ children }: GameLayoutProps) {
  const useFantasyUi = DEFAULT_FEATURE_FLAGS.fantasyUi;

  return (
    <ProtectedRoute>
      {useFantasyUi ? (
        <div className={cinzel.variable}>{children}</div>
      ) : (
        <GameProvider>
          <div className={cinzel.variable}>{children}</div>
        </GameProvider>
      )}
    </ProtectedRoute>
  );
}
