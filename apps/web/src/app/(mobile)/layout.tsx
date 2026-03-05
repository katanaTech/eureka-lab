'use client';

import { type ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomTabBar } from '@/components/mobile/BottomTabBar';
import { AiFab } from '@/components/mobile/AiFab';
import { AiChatOverlay } from '@/components/mobile/AiChatOverlay';
import { InstallBanner } from '@/components/mobile/InstallBanner';
import { BadgeUnlockToast } from '@/components/features/gamification/BadgeUnlockToast';
import { useGamificationStore } from '@/stores/gamification-store';
import { useAiAssistantStore } from '@/stores/ai-assistant-store';
import { useAuth } from '@/hooks/useAuth';

/**
 * Mobile layout — wraps all /m/* routes with a slim header, bottom tab bar,
 * AI assistant FAB, and route protection. Designed for touch-first mobile experience.
 * @param children - Mobile page content
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const refreshProfile = useGamificationStore((s) => s.refreshProfile);
  const setContext = useAiAssistantStore((s) => s.setContext);
  const pathname = usePathname();

  /* Initialize gamification data when user is authenticated */
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  /* Keep AI assistant context in sync with current route */
  useEffect(() => {
    setContext({ currentRoute: pathname });
  }, [pathname, setContext]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto overscroll-none px-4 pb-20 pt-4">
          {children}
        </main>
        <BottomTabBar />
        <AiFab />
        <AiChatOverlay />
        <InstallBanner />
        <BadgeUnlockToast />
      </div>
    </ProtectedRoute>
  );
}
