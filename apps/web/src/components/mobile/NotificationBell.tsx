'use client';

import { type FC } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Notification bell icon for mobile header.
 * Shows active/inactive state based on push subscription status.
 * Tapping navigates to profile page where notification preferences live.
 *
 * @param className - Additional CSS classes
 */
export const NotificationBell: FC<NotificationBellProps> = ({ className }) => {
  const { isSubscribed, isSupported } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const Icon = isSubscribed ? Bell : BellOff;

  return (
    <a
      href="/m/profile"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent',
        isSubscribed ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
      aria-label={isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </a>
  );
};
