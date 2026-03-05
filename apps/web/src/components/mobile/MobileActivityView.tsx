'use client';

import { type FC, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { streamPrompt } from '@/lib/api-client';
import type { AiStreamChunk } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/** Activity definition from module detail */
interface Activity {
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** Activity type */
  type: string;
  /** XP reward for completing this activity */
  xpReward: number;
}

interface MobileActivityViewProps {
  /** Module ID */
  moduleId: string;
  /** List of activities */
  activities: Activity[];
  /** Currently active activity index */
  activeIndex: number;
  /** Callback to change activity */
  onActivityChange: (index: number) => void;
  /** Completed activity indices */
  completedActivities: number[];
}

/**
 * Full-screen mobile activity view optimized for touch interaction.
 * Supports swipe navigation between activities and inline prompt submission.
 *
 * @param moduleId - Current module ID
 * @param activities - List of activities in the module
 * @param activeIndex - Index of the currently displayed activity
 * @param onActivityChange - Callback when user navigates to a different activity
 * @param completedActivities - Indices of completed activities
 */
export const MobileActivityView: FC<MobileActivityViewProps> = ({
  moduleId,
  activities,
  activeIndex,
  onActivityChange,
  completedActivities,
}) => {
  const t = useTranslations('Learn');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const activity = activities[activeIndex];

  /**
   * Submit a prompt and stream the response.
   */
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setResponse('');
    setScore(null);

    try {
      const stream = streamPrompt({
        moduleId,
        prompt: prompt.trim(),
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          setResponse((prev) => prev + chunk.content);
        }
        if (chunk.type === 'done') {
          setScore(chunk.promptScore ?? null);
        }
        if (chunk.type === 'error') {
          setResponse(chunk.message ?? t('errorGeneric'));
        }
      }
    } catch {
      setResponse(t('errorGeneric'));
    } finally {
      setIsStreaming(false);
    }
  }, [prompt, isStreaming, moduleId, t]);

  if (!activity) return null;

  const isCompleted = completedActivities.includes(activeIndex);
  const isPromptActivity = activity.type === 'prompt_exercise';

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {activities.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i === activeIndex
                ? 'bg-primary'
                : completedActivities.includes(i)
                  ? 'bg-green-400'
                  : 'bg-muted',
            )}
          />
        ))}
      </div>

      {/* Activity header */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {t('activityOf', { current: activeIndex + 1, total: activities.length })}
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{activity.title}</h2>
      </div>

      {/* Activity content */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm leading-relaxed text-foreground">{activity.description}</p>
      </div>

      {/* Prompt input (for prompt exercises) */}
      {isPromptActivity && (
        <div className="flex flex-col gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('promptPlaceholder')}
            className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isStreaming}
            className="w-full"
          >
            {isStreaming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isStreaming ? t('generating') : t('submitPrompt')}
          </Button>
        </div>
      )}

      {/* AI Response */}
      {response && (
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{response}</p>
          {score !== null && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t('promptScore')}:</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500',
                )}
              >
                {score}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation arrows */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onActivityChange(activeIndex - 1)}
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          {t('previous')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onActivityChange(activeIndex + 1)}
          disabled={activeIndex === activities.length - 1}
        >
          {t('next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
