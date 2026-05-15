'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/stores/gamification-store';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { UserMenu } from '@/components/game/UserMenu';
import { BadgeUnlockToast } from '@/components/features/gamification/BadgeUnlockToast';

/**
 * Layout for the adult-facing routes (parent, teacher, settings, pricing,
 * achievements, checkout). Replaces the legacy Navbar+Sidebar chrome with a
 * unified fantasy header (Logo + UserMenu) inside a Scene wrapper.
 *
 * Anonymous users bounce to `/` (welcome) — not `/login`, per spec §5.5.
 * Gamification profile hydrates on auth (achievements page depends on it).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const refreshProfile = useGamificationStore((s) => s.refreshProfile);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <Scene>
      <header className="flex items-center justify-between gap-4 flex-wrap px-4 py-6 lg:px-10 lg:py-8">
        <Logo />
        <UserMenu />
      </header>
      <main className="relative px-4 pb-12 lg:px-10">{children}</main>
      <BadgeUnlockToast />
    </Scene>
  );
}
