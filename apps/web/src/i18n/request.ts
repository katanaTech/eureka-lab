import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl request configuration.
 * Loads locale messages based on the current locale.
 */
export default getRequestConfig(async () => {
  const locale = 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
