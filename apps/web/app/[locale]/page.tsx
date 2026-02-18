import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

interface HomePageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params: { locale },
}: HomePageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Home' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

/**
 * Platform home page — landing screen for unauthenticated users.
 * Full UI built in FE-005 (base layout) and Sprint 2 auth pages.
 */
export default function HomePage(): React.ReactElement {
  const t = useTranslations('Home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-primary">{t('title')}</h1>
      <p className="mt-4 max-w-md text-center text-muted-foreground text-child-body">
        {t('subtitle')}
      </p>
    </main>
  );
}
