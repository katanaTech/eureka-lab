'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Home, BookOpen, LayoutDashboard, Settings, X, Trophy, CreditCard, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Additional CSS classes */
  className?: string;
}

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: Home },
  { key: 'learn', href: '/learn', icon: BookOpen },
  { key: 'achievements', href: '/achievements', icon: Trophy },
  { key: 'dashboard', href: '/parent', icon: LayoutDashboard },
  { key: 'teacher', href: '/teacher', icon: GraduationCap },
  { key: 'pricing', href: '/pricing', icon: CreditCard },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

/**
 * Sidebar navigation — hidden on mobile unless toggled, always visible on desktop.
 * @param className - Additional CSS classes
 */
export const Sidebar: FC<SidebarProps> = ({ className }) => {
  const t = useTranslations('Nav');
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 rtl:left-auto rtl:right-0 top-0 z-50 h-full w-64 border-r rtl:border-r-0 rtl:border-l border-border bg-sidebar transition-transform md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
          className,
        )}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-bold">{t('home')}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label="Sidebar navigation">
          {NAV_ITEMS.map(({ key, href, icon: Icon }) => (
            <a
              key={key}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t(key)}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};
