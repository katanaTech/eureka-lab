'use client';

import { type FC, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { getQueryClient } from '@/lib/query-client';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

interface ProvidersProps {
  /** Child elements to wrap with providers */
  children: ReactNode;
  /** Locale for next-intl */
  locale: string;
  /** i18n messages */
  messages: Record<string, unknown>;
  /** IANA time zone (e.g. 'UTC') — kept stable across server/client to avoid hydration mismatches */
  timeZone: string;
}

/**
 * Client-side providers wrapper.
 * Wraps children with TanStack Query, next-intl providers, and offline banner.
 * @param children - App content
 * @param locale - Current locale code
 * @param messages - i18n messages for the locale
 * @param timeZone - IANA time zone forwarded from the server config
 */
export const Providers: FC<ProvidersProps> = ({ children, locale, messages, timeZone }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
        <OfflineBanner />
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};
