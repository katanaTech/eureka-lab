/**
 * Supported locales and default locale configuration.
 * Arabic is RTL — the layout applies dir="rtl" based on this list.
 */
export const locales = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Locales that render right-to-left */
export const rtlLocales: Locale[] = ['ar'];

/**
 * Returns true if the given locale is right-to-left.
 * @param locale - The locale string to check
 * @returns Whether the locale is RTL
 */
export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
