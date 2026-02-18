import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n-config';

/**
 * next-intl server configuration.
 * Loads locale messages for the requested locale.
 */
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  if (!locales.includes(locale as Locale)) {
    return {
      messages: (await import(`./messages/en.json`)).default,
    };
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
