'use client';

import { type FC } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, BookOpen, Sparkles, BarChart3, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/** Tab definition for bottom navigation */
interface TabItem {
  /** Translation key within Mobile namespace */
  key: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: typeof Home;
  /** Roles that can see this tab (empty = all) */
  roles: string[];
}

const TABS: TabItem[] = [
  { key: 'tabHome', href: '/m', icon: Home, roles: [] },
  { key: 'tabLearn', href: '/m/learn', icon: BookOpen, roles: ['child', 'parent'] },
  { key: 'tabAiLab', href: '/m/ai', icon: Sparkles, roles: ['child'] },
  { key: 'tabProgress', href: '/m/progress', icon: BarChart3, roles: ['child', 'parent', 'teacher'] },
  { key: 'tabProfile', href: '/m/profile', icon: User, roles: [] },
];

/**
 * Mobile bottom tab navigation bar — fixed at the bottom of the screen.
 * Shows role-appropriate tabs with active state highlighting.
 * Includes safe-area padding for iOS notch/home indicator.
 */
export const BottomTabBar: FC = () => {
  const pathname = usePathname();
  const t = useTranslations('Mobile');
  const { user } = useAuth();
  const userRole = user?.role ?? 'child';

  /** Filter tabs by user role */
  const visibleTabs = TABS.filter(
    (tab) => tab.roles.length === 0 || tab.roles.includes(userRole),
  );

  /**
   * Determine if a tab is active based on the current pathname.
   * @param href - Tab route path
   * @returns True if the tab matches the current route
   */
  function isActive(href: string): boolean {
    if (href === '/m') {
      return pathname === '/m';
    }
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-background pb-safe"
      aria-label="Mobile navigation"
    >
      {visibleTabs.map(({ key, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <a
            key={key}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 transition-transform',
                active && 'scale-110',
              )}
              aria-hidden="true"
            />
            <span>{t(key)}</span>
          </a>
        );
      })}
    </nav>
  );
};
