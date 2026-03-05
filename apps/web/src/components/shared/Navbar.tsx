'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavbarProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Top navigation bar with app name, nav links, and auth actions.
 * Shows login/signup when unauthenticated, logout when authenticated.
 *
 * @param className - Additional CSS classes
 */
export const Navbar: FC<NavbarProps> = ({ className }) => {
  const t = useTranslations('Nav');
  const tCommon = useTranslations('Common');
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <a href="/" className="text-xl font-bold tracking-tight text-foreground hover:text-primary">
          {tCommon('appName')}
        </a>
      </div>

      <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
        <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {t('home')}
        </a>
        <a
          href="/learn"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t('learn')}
        </a>
        {isAuthenticated && user?.role === 'parent' && (
          <a
            href="/parent"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t('dashboard')}
          </a>
        )}
      </nav>

      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              {t('logout')}
            </Button>
          </>
        ) : (
          <>
            <a href="/login">
              <Button variant="ghost" size="sm">
                {t('login')}
              </Button>
            </a>
            <a href="/signup">
              <Button variant="default" size="sm">
                {t('signup')}
              </Button>
            </a>
          </>
        )}
      </div>
    </header>
  );
};
