import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n-config';

/**
 * next-intl locale routing middleware.
 * Detects locale from Accept-Language header and redirects accordingly.
 * Arabic (ar) uses RTL layout — handled in [locale]/layout.tsx.
 */
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files
  // - _next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
