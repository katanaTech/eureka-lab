'use client';

import { type FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Swords, ShoppingBag, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tab definition for the mobile game bottom navigation.
 */
interface GameTab {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: typeof Map;
}

const GAME_TABS: GameTab[] = [
  { label: 'Realm Map', href: '/m/g/dashboard', icon: Map },
  { label: 'Battle', href: '/m/g/dashboard', icon: Swords },
  { label: 'Shop', href: '/m/g/shop', icon: ShoppingBag },
  { label: 'Inventory', href: '/m/g/inventory', icon: Package },
  { label: 'Profile', href: '/m/g/settings', icon: User },
];

/**
 * Mobile bottom tab navigation for game mode routes.
 * 5 tabs: Realm Map, Battle, Shop, Inventory, Profile.
 * Hidden on /welcome and /character (auth/onboarding flow).
 * Uses fantasy styling consistent with the game UI.
 *
 * @returns Fixed bottom tab bar, or null on auth routes
 */
export const GameBottomTabs: FC = () => {
  const pathname = usePathname();

  // Hide on auth/onboarding routes
  if (pathname.includes('/welcome') || pathname.includes('/character')) {
    return null;
  }

  /**
   * Determine if a tab is active based on the current pathname.
   * @param href - Tab route path
   * @returns True if the tab matches the current route
   */
  function isActive(href: string): boolean {
    if (href === '/m/g/dashboard') {
      return pathname === '/m/g/dashboard' || pathname === '/m/g';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-primary/20 bg-background/95 backdrop-blur-sm pb-safe"
      aria-label="Game navigation"
    >
      {GAME_TABS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-display uppercase tracking-wider transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 transition-all',
                active && 'scale-110 drop-shadow-[0_0_4px_hsl(var(--primary)/0.6)]',
              )}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
