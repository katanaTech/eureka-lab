'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleList } from '@/components/features/learn/ModuleList';
import { modulesApi, type ModuleListItem } from '@/lib/api-client';
import { XpBar } from '@/components/features/gamification/XpBar';
import { StreakCounter } from '@/components/features/gamification/StreakCounter';
import { useGamificationStore } from '@/stores/gamification-store';
import { cn } from '@/lib/utils';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** Level tab definitions */
const LEVELS = [
  { level: 1, subtitle: 'AI Conversation & Prompt Engineering' },
  { level: 2, subtitle: 'Workflow Automation' },
  { level: 3, subtitle: 'Vibe Coding — AI-Assisted Creation' },
  { level: 4, subtitle: 'Buddy Agents — Design Your AI Companion' },
] as const;

/**
 * Learn page — displays modules with level tabs and gamification stats.
 * Fetches modules from the backend filtered by the selected level.
 */
export default function LearnPage() {
  const t = useTranslations('Learn');
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const { xp, streak } = useGamificationStore();

  /**
   * Fetch modules for the given level.
   * @param level - Learning level to fetch
   */
  const fetchModules = useCallback(async (level: number): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const data = await modulesApi.list(level);
      setModules(data.modules);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load modules';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchModules(selectedLevel);
  }, [selectedLevel, fetchModules]);

  /**
   * Handle level tab switch.
   * @param level - Level to switch to
   */
  const handleLevelChange = useCallback((level: number) => {
    setSelectedLevel(level);
  }, []);

  const currentLevel = LEVELS.find((l) => l.level === selectedLevel) ?? LEVELS[0];

  return (
    <div className="space-y-6">
      {/* Gamification stats bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <XpBar xp={xp} compact />
        </div>
        {streak && (
          <StreakCounter current={streak.current} longest={streak.longest} />
        )}
      </div>

      {/* Level tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-4" role="tablist" aria-label="Learning levels">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.level}
              type="button"
              role="tab"
              aria-selected={lvl.level === selectedLevel}
              onClick={() => handleLevelChange(lvl.level)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                lvl.level === selectedLevel
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground',
              )}
            >
              {t('levelTitle', { level: lvl.level })}
            </button>
          ))}
        </nav>
      </div>

      {/* Level header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('levelTitle', { level: selectedLevel })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {currentLevel?.subtitle}
        </p>
      </div>

      {error ? (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <ModuleList modules={modules} isLoading={isLoading} />
      )}
    </div>
  );
}
