'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MobileActivityView } from '@/components/mobile/MobileActivityView';
import { modulesApi, progressApi } from '@/lib/api-client';
import type { ModuleDetailResponse } from '@/lib/api-client';

/**
 * Mobile module detail page — full-screen activity view with swipe navigation.
 * Renders activities optimized for touch interaction.
 */
export default function MobileModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('Learn');

  const moduleId = params.moduleId as string;
  const [moduleData, setModuleData] = useState<ModuleDetailResponse | null>(null);
  const [activeActivity, setActiveActivity] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchModule = useCallback(async () => {
    try {
      const data = await modulesApi.getById(moduleId);
      setModuleData(data);
      setActiveActivity(data.progress?.currentActivity ?? 0);
      setCompletedActivities(data.progress?.completedActivities ?? []);
    } catch {
      /* Graceful degradation */
    } finally {
      setIsLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  /**
   * Handle activity completion — calls backend and updates local state.
   * @param activityIndex - Index of the completed activity
   */
  const handleComplete = useCallback(async (activityIndex: number) => {
    try {
      await progressApi.completeActivity(moduleId, { activityIndex });
      setCompletedActivities((prev) => [...prev, activityIndex]);
    } catch {
      /* Graceful degradation */
    }
  }, [moduleId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-foreground">{t('moduleNotFound')}</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => router.back()}>
          {t('goBack')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">{moduleData.title}</h1>
          <p className="text-xs text-muted-foreground">
            {completedActivities.length}/{moduleData.activities.length} {t('activitiesComplete')}
          </p>
        </div>
        {completedActivities.length === moduleData.activities.length && (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-500" aria-hidden="true" />
        )}
      </div>

      {/* Activity view */}
      <MobileActivityView
        moduleId={moduleId}
        activities={moduleData.activities}
        activeIndex={activeActivity}
        onActivityChange={setActiveActivity}
        completedActivities={completedActivities}
      />
    </div>
  );
}
