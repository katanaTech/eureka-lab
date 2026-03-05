'use client';

import { type FC, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PromptEditor } from './PromptEditor';
import { WorkflowBuilder } from './WorkflowBuilder';
import { CodeEditor } from './CodeEditor';
import { AgentBuilder } from './AgentBuilder';
import { progressApi, type ModuleDetailResponse, type ModuleActivity } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ModuleDetailProps {
  /** Full module data from the API */
  module: ModuleDetailResponse;
}

/**
 * Module detail view — shows objectives, activities, and prompt editor.
 * This is the main learning interface where children interact with AI.
 *
 * @param module - Full module data
 */
export const ModuleDetail: FC<ModuleDetailProps> = ({ module: mod }) => {
  const t = useTranslations('Learn');

  const [currentActivity, setCurrentActivity] = useState(
    mod.progress?.currentActivity ?? 0,
  );
  const [completedActivities, setCompletedActivities] = useState<number[]>(
    mod.progress?.completedActivities ?? [],
  );
  const [xpEarned, setXpEarned] = useState(0);
  const [moduleCompleted, setModuleCompleted] = useState(
    mod.status === 'completed',
  );

  const activity = mod.activities[currentActivity] as ModuleActivity | undefined;

  /**
   * Handle completing the current activity.
   */
  const handleCompleteActivity = useCallback(async () => {
    try {
      const result = await progressApi.completeActivity(mod.id, {
        activityIndex: currentActivity,
      });

      setCompletedActivities((prev) => [...prev, currentActivity]);
      setXpEarned((prev) => prev + result.xpAwarded);

      if (result.moduleCompleted) {
        setModuleCompleted(true);
      } else if (currentActivity < mod.activities.length - 1) {
        setCurrentActivity((prev) => prev + 1);
      }
    } catch {
      /* Error handling — show notification in future sprint */
    }
  }, [currentActivity, mod.id, mod.activities.length]);

  /**
   * Handle AI response completion (from PromptEditor).
   */
  const handlePromptComplete = useCallback(
    async (score: number, _tokensUsed: number) => {
      if (activity?.type === 'prompt_exercise') {
        try {
          await progressApi.completeActivity(mod.id, {
            activityIndex: currentActivity,
            score,
          });
          setCompletedActivities((prev) => [...prev, currentActivity]);
          setXpEarned((prev) => prev + (activity?.xpReward ?? 0));
        } catch {
          /* Error handling */
        }
      }
    },
    [activity, currentActivity, mod.id],
  );

  /**
   * Shared handler for exercise completion (workflow, code, agent).
   * Marks the activity as complete and awards XP.
   */
  const handleExerciseComplete = useCallback(async () => {
    try {
      const result = await progressApi.completeActivity(mod.id, {
        activityIndex: currentActivity,
      });

      setCompletedActivities((prev) => [...prev, currentActivity]);
      setXpEarned((prev) => prev + result.xpAwarded);

      if (result.moduleCompleted) {
        setModuleCompleted(true);
      } else if (currentActivity < mod.activities.length - 1) {
        setCurrentActivity((prev) => prev + 1);
      }
    } catch {
      /* Error handling — show notification in future sprint */
    }
  }, [currentActivity, mod.id, mod.activities.length]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Module header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t('levelTitle', { level: mod.level })}
          </span>
          {moduleCompleted && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {t('completed')}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{mod.title}</h1>
        <p className="mt-1 text-muted-foreground">{mod.description}</p>
      </div>

      {/* Objectives */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Learning Objectives
        </h2>
        <ul className="mt-2 space-y-1">
          {mod.objectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 text-primary">✓</span>
              {obj}
            </li>
          ))}
        </ul>
      </div>

      {/* Activity progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Activity {Math.min(currentActivity + 1, mod.activities.length)} of{' '}
            {mod.activities.length}
          </span>
          {xpEarned > 0 && <span>+{xpEarned} XP earned</span>}
        </div>
        <div className="flex gap-1">
          {mod.activities.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                completedActivities.includes(i)
                  ? 'bg-green-500'
                  : i === currentActivity
                    ? 'bg-primary'
                    : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      {/* Current activity */}
      {activity && !moduleCompleted && (
        <div className="space-y-4 rounded-lg border border-border p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {activity.title}
              </h2>
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                {activity.type.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {activity.description}
            </p>
          </div>

          {/* Render appropriate interface based on activity type */}
          {activity.type === 'agent_exercise' ? (
            <AgentBuilder
              moduleId={mod.id}
              activityIndex={currentActivity}
              onComplete={handleExerciseComplete}
            />
          ) : activity.type === 'code_exercise' ? (
            <CodeEditor
              moduleId={mod.id}
              activityIndex={currentActivity}
              onComplete={handleExerciseComplete}
            />
          ) : activity.type === 'workflow_exercise' ? (
            <WorkflowBuilder
              moduleId={mod.id}
              activityIndex={currentActivity}
              onComplete={handleExerciseComplete}
            />
          ) : activity.type === 'prompt_exercise' ? (
            <PromptEditor
              moduleId={mod.id}
              onComplete={handlePromptComplete}
            />
          ) : activity.type === 'lesson' ? (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/30 p-4 text-sm text-muted-foreground">
                Lesson content will be loaded here in a future sprint.
                For now, read the description above and proceed.
              </div>
              <Button size="sm" onClick={handleCompleteActivity}>
                Mark as Complete
              </Button>
            </div>
          ) : activity.type === 'reflection' ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder="Write your reflection here..."
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Reflection input"
              />
              <Button size="sm" onClick={handleCompleteActivity}>
                Submit Reflection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/30 p-4 text-sm text-muted-foreground">
                Quiz interface will be implemented in a future sprint.
              </div>
              <Button size="sm" onClick={handleCompleteActivity}>
                Complete Quiz
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Module completion message */}
      {moduleCompleted && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <h2 className="text-xl font-bold text-green-700 dark:text-green-300">
            Module Complete!
          </h2>
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Great job! You earned {xpEarned} XP. Keep going to the next module!
          </p>
          <Button className="mt-4" size="sm" onClick={() => window.history.back()}>
            {t('back') ?? 'Back to Modules'}
          </Button>
        </div>
      )}
    </div>
  );
};
