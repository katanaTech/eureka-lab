'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useMobileDetect } from '@/hooks/useMobileDetect';

/**
 * Smart PWA install banner that appears after the 2nd visit.
 * Shows as a bottom sheet on mobile, inline on desktop.
 * Dismissible for 7 days.
 * Auto-hides if already installed (standalone mode detected).
 */
export const InstallBanner: FC = () => {
  const t = useTranslations('Install');
  const { canInstall, install, dismiss } = useInstallPrompt();
  const { isPwa } = useMobileDetect();

  /* Don't show if already installed or can't install */
  if (isPwa || !canInstall) return null;

  /**
   * Handle install button click.
   */
  async function handleInstall(): Promise<void> {
    await install();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-lg border-t border-border bg-card px-4 pb-safe pt-4 shadow-lg sm:mb-4 sm:rounded-xl sm:border sm:shadow-xl">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Download className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t('title')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('description')}</p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismiss}
            aria-label={t('dismiss')}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t('installButton')}
          </Button>
          <Button
            onClick={dismiss}
            variant="ghost"
            size="sm"
          >
            {t('maybeLater')}
          </Button>
        </div>
      </div>
    </div>
  );
};
