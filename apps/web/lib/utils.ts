import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts correctly.
 * Use this everywhere instead of raw string concatenation.
 *
 * @param inputs - Class names or conditional class name objects
 * @returns Merged, deduplicated class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a locale-aware human-readable format.
 *
 * @param isoString - ISO 8601 date string
 * @param locale - BCP 47 locale string (e.g. 'en', 'fr', 'ar')
 * @returns Formatted date string
 */
export function formatDate(isoString: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString));
}

/**
 * Truncates a string to a maximum length with an ellipsis.
 *
 * @param text - The string to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
