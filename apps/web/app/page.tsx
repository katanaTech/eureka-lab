import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n-config';

/**
 * Root page — redirects to the default locale.
 * All real content lives under app/[locale]/.
 */
export default function RootPage(): never {
  redirect(`/${defaultLocale}`);
}
