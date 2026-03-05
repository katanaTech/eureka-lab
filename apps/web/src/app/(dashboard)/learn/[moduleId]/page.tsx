'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ModuleDetail } from '@/components/features/learn/ModuleDetail';
import { modulesApi, type ModuleDetailResponse } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

/** Force dynamic rendering — uses Firebase auth and dynamic params */
export const dynamic = 'force-dynamic';

/**
 * Module detail page — shows full module content with activities.
 * Fetches module data from the backend using the moduleId route param.
 */
export default function ModuleDetailPage() {
  const params = useParams<{ moduleId: string }>();
  const router = useRouter();
  const t = useTranslations('Common');
  const [moduleData, setModuleData] = useState<ModuleDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    /**
     * Fetch the module detail from the backend API.
     */
    async function fetchModule(): Promise<void> {
      if (!params.moduleId) return;
      try {
        const data = await modulesApi.getById(params.moduleId);
        if (!cancelled) {
          setModuleData(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load module';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchModule();
    return () => { cancelled = true; };
  }, [params.moduleId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-destructive" role="alert">
          {error || 'Module not found'}
        </p>
        <Button variant="outline" onClick={() => router.push('/learn')}>
          {t('back')}
        </Button>
      </div>
    );
  }

  return <ModuleDetail module={moduleData} />;
}
