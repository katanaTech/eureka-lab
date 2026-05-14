'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCharacterStore } from '@/stores/character-store';
import { useInventoryStore } from '@/stores/inventory-store';

/**
 * Layout for the learner-facing routes: dashboard, character, campaign,
 * inventory, shop, victory. Single auth gate, hydrates character + inventory
 * from the backend on mount, and bounces anonymous users to / (NOT to /login —
 * the welcome page is auth).
 *
 * The character-gate redirect waits for `hasHydrated` so it does not race
 * with the in-flight `characterApi.get()` (Plan 1 review finding R2).
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hydrateCharacter = useCharacterStore((s) => s.hydrate);
  const hydrateInventory = useInventoryStore((s) => s.hydrate);
  const character = useCharacterStore((s) => s.character);
  const hasHydrated = useCharacterStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated) {
      void hydrateCharacter();
      void hydrateInventory();
    }
  }, [isAuthenticated, hydrateCharacter, hydrateInventory]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      hasHydrated &&
      character === null &&
      pathname !== '/character'
    ) {
      router.replace('/character');
    }
  }, [character, hasHydrated, isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) return null;

  return <>{children}</>;
}
