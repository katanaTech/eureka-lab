/**
 * Sentry error monitoring placeholder.
 * Will be fully configured when NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * CLAUDE.md: Monitoring via Sentry (errors) + Vercel Analytics.
 */

const SENTRY_DSN = process.env['NEXT_PUBLIC_SENTRY_DSN'];

/**
 * Initialize Sentry for frontend error tracking.
 * No-op if SENTRY_DSN is not configured.
 */
export function initSentry(): void {
  if (!SENTRY_DSN) return;

  /* Sentry SDK will be installed and configured here:
   * import * as Sentry from '@sentry/nextjs';
   * Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 });
   */
}

/**
 * Capture an error in Sentry.
 *
 * @param error - Error to capture
 * @param context - Optional extra context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (!SENTRY_DSN) return;

  /* Sentry.captureException(error, { extra: context }); */
  void error;
  void context;
}

/**
 * Set the current user context in Sentry.
 *
 * @param userId - User UID
 * @param role - User role
 */
export function setSentryUser(userId: string, role: string): void {
  if (!SENTRY_DSN) return;

  /* Sentry.setUser({ id: userId, role }); */
  void userId;
  void role;
}
