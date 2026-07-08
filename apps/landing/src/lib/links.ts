/**
 * Absolute URL of the apps/web product app, used for CTAs that leave the
 * marketing site (e.g. "Enter the Realm", "Begin Your Quest").
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/** Login/signup entry point in the product app. */
export const LOGIN_URL = `${APP_URL}/login`;
