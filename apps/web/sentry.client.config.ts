import * as Sentry from '@sentry/nextjs';

/**
 * Initialises Sentry for the browser (client) bundle.
 * Only runs when NEXT_PUBLIC_SENTRY_DSN is present — safe to omit in local dev.
 * Called automatically by @sentry/nextjs via Next.js instrumentation.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}
