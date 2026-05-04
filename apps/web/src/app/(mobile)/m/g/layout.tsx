import type { ReactNode } from 'react';
import { Cinzel } from 'next/font/google';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { GameBottomTabs } from '@/components/mobile/GameBottomTabs';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-cinzel',
});

/**
 * Layout for mobile game routes — (mobile)/m/g/*.
 * Mirrors the desktop (game) layout with:
 * - ProtectedRoute guard
 * - Cinzel font variable
 * - GameBottomTabs (hidden on auth/onboarding routes)
 * - Bottom padding to clear the fixed tab bar
 *
 * @param children - Page content from Next.js App Router
 * @returns Mobile game layout wrapper
 */
export default function MobileGameLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className={cinzel.variable}>
        {children}
        <GameBottomTabs />
      </div>
    </ProtectedRoute>
  );
}
