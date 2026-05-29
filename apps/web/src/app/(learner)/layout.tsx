'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCharacterStore } from '@/stores/character-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useAcademyProgressStore } from '@/stores/academy-progress-store';
import { homeForRole } from '@/lib/auth-redirects';

/**
 * Layout for the learner-facing routes: dashboard, character, campaign,
 * inventory, shop, victory. Single auth gate, hydrates character + inventory
 * from the backend on mount, and bounces anonymous users to / (NOT to /login —
 * the welcome page is auth).
 *
 * Non-`child` roles (parent / teacher / admin) bounce out of the learner
 * shell entirely — they have no character and should not see the character
 * forge or campaign loop. Resolves Plan 3a smoke finding P3a-N7.
 *
 * The character-gate redirect waits for `hasHydrated` so it does not race
 * with the in-flight `characterApi.get()` (Plan 1 review finding R2).
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hydrateCharacter = useCharacterStore((s) => s.hydrate);
  const hydrateInventory = useInventoryStore((s) => s.hydrate);
  const hydrateAcademy = useAcademyProgressStore((s) => s.hydrate);
  const character = useCharacterStore((s) => s.character);
  const hasHydrated = useCharacterStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated) {
      void hydrateCharacter();
      void hydrateInventory();
      void hydrateAcademy();
    }
  }, [isAuthenticated, hydrateCharacter, hydrateInventory, hydrateAcademy]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  // Bounce adults out before the character-gate fires — they don't have a
  // character and shouldn't be forced through Forge My Legend.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'child') {
      router.replace(homeForRole(user.role));
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role === 'child' &&
      hasHydrated &&
      character === null &&
      pathname !== '/character'
    ) {
      router.replace('/character');
    }
  }, [character, hasHydrated, isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading || !isAuthenticated) return null;
  // Non-child roles are mid-redirect; render nothing to avoid a flash of /dashboard.
  if (user && user.role !== 'child') return null;

  return <>{children}</>;
}
