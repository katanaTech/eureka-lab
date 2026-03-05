'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Slim mobile header — 48px tall with app name, streak indicator, and notification bell.
 * Replaces the desktop Navbar on mobile routes.
 * @param className - Additional CSS classes
 */
export const MobileHeader: FC<MobileHeaderProps> = ({ className }) => {
  const t = useTranslations('Common');
  const { user } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background px-4',
        className,
      )}
    >
      {/* App name */}
      <a href="/m" className="text-lg font-bold tracking-tight text-foreground">
        {t('appName')}
      </a>

      {/* Center — streak indicator */}
      {user && (
        <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
          <Flame className="h-4 w-4" aria-hidden="true" />
          <span aria-label={`${user.streak ?? 0} day streak`}>
            {user.streak ?? 0}
          </span>
        </div>
      )}

      {/* Right — notification bell */}
      <a
        href="/m/profile"
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Notifications and profile"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </a>
    </header>
  );
};
