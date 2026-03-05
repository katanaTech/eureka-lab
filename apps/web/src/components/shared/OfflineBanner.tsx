'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { DEFAULT_FEATURE_FLAGS } from '@eureka-lab/shared-types';

/**
 * Banner displayed at the top of the page when the device is offline.
 * Controlled by the enableOfflineMode feature flag.
 * Renders nothing when online or when the feature flag is disabled.
 */
export const OfflineBanner: FC = () => {
  const isOnline = useOnlineStatus();
  const t = useTranslations('Offline');

  /* Feature flag gate */
  if (!DEFAULT_FEATURE_FLAGS.enableOfflineMode) {
    return null;
  }

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t('bannerMessage')}</span>
    </div>
  );
};
