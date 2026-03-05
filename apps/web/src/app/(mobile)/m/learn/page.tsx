'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SwipeableTabs } from '@/components/mobile/SwipeableTabs';
import { MobileModuleCard } from '@/components/mobile/MobileModuleCard';
import { Spinner } from '@/components/ui/spinner';
import { modulesApi } from '@/lib/api-client';
import type { ModuleListItem } from '@/lib/api-client';
import type { LearningLevel } from '@eureka-lab/shared-types';

/**
 * Mobile learn page — shows all 4 learning levels as swipeable tabs.
 * Each tab contains a vertical list of module cards.
 */
export default function MobileLearnPage() {
  const t = useTranslations('Learn');
  const [activeTab, setActiveTab] = useState(0);
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    try {
      const res = await modulesApi.list();
      setModules(res.modules);
    } catch {
      /* Graceful degradation */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const tabs = [
    { key: 'level-1', label: `${t('levelLabel')} 1` },
    { key: 'level-2', label: `${t('levelLabel')} 2` },
    { key: 'level-3', label: `${t('levelLabel')} 3` },
    { key: 'level-4', label: `${t('levelLabel')} 4` },
  ];

  /**
   * Filter modules by learning level.
   * @param level - The learning level (1-4)
   * @returns Modules matching the specified level
   */
  function getModulesForLevel(level: LearningLevel): ModuleListItem[] {
    return modules.filter((m) => m.level === level);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>

      <SwipeableTabs tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab}>
        {([1, 2, 3, 4] as LearningLevel[]).map((level) => {
          const levelModules = getModulesForLevel(level);
          return (
            <div key={level} className="flex flex-col gap-2 py-3">
              {levelModules.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('noModules')}
                </p>
              ) : (
                levelModules.map((mod) => (
                  <MobileModuleCard key={mod.id} module={mod} />
                ))
              )}
            </div>
          );
        })}
      </SwipeableTabs>
    </div>
  );
}
