import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getMessages, getLocale } from 'next-intl/server';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

/** PWA-enabled metadata including manifest and Apple Web App config */
export const metadata: Metadata = {
  title: 'Eureka Lab — AI Literacy for Kids',
  description: 'Learn to be an AI builder, not just a consumer. For ages 8-16.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Eureka Lab',
  },
  formatDetection: {
    telephone: false,
  },
};

/** Theme color for the browser chrome and PWA status bar */
export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

/**
 * Root layout for the Eureka Lab web application.
 * Wraps all pages with global providers (i18n, TanStack Query).
 * @param children - Page content rendered inside this layout
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
