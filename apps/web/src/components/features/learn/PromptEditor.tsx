'use client';

import { type FC, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { streamPrompt, type AiStreamChunk } from '@/lib/api-client';

interface PromptEditorProps {
  /** Module ID for the current module */
  moduleId: string;
  /** Maximum prompt length (default: 500) */
  maxLength?: number;
  /** Callback when the AI response completes */
  onComplete?: (score: number, tokensUsed: number) => void;
}

/**
 * Interactive prompt editor with real-time AI streaming response.
 * Children type prompts here and see the AI response stream in real time.
 * CLAUDE.md Rule 1: All AI calls go through the backend via api-client.
 *
 * @param moduleId - Current module ID
 * @param maxLength - Max characters for the prompt
 * @param onComplete - Callback when response completes
 */
export const PromptEditor: FC<PromptEditorProps> = ({
  moduleId,
  maxLength = 500,
  onComplete,
}) => {
  const t = useTranslations('Learn');

  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [promptScore, setPromptScore] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [showContext, setShowContext] = useState(false);
  const abortRef = useRef(false);

  /**
   * Submit the prompt and stream the AI response.
   */
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setError('');
    setResponse('');
    setPromptScore(null);
    setTokensUsed(null);
    abortRef.current = false;

    try {
      const stream = streamPrompt({
        moduleId,
        prompt: prompt.trim(),
        context: context.trim() || undefined,
      });

      for await (const chunk of stream) {
        if (abortRef.current) break;

        if (chunk.type === 'token' && chunk.content) {
          setResponse((prev) => prev + chunk.content);
        } else if (chunk.type === 'done') {
          setPromptScore(chunk.promptScore ?? null);
          setTokensUsed(chunk.tokensUsed ?? null);
          if (chunk.promptScore !== undefined && chunk.tokensUsed !== undefined) {
            onComplete?.(chunk.promptScore, chunk.tokensUsed);
          }
        } else if (chunk.type === 'error') {
          setError(chunk.message ?? 'An error occurred');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(message);
    } finally {
      setIsStreaming(false);
    }
  }, [prompt, context, moduleId, isStreaming, onComplete]);

  /**
   * Stop the current stream.
   */
  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Prompt input area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="prompt-input"
            className="text-sm font-medium text-foreground"
          >
            {t('submitPrompt')}
          </label>
          <span className="text-xs text-muted-foreground">
            {prompt.length}/{maxLength}
          </span>
        </div>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxLength))}
          placeholder={t('promptPlaceholder')}
          disabled={isStreaming}
          rows={4}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          aria-label="Prompt input"
        />
      </div>

      {/* Optional context toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowContext(!showContext)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showContext ? '- Hide context' : '+ Add context'}
        </button>
        {showContext && (
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, 300))}
            placeholder="Add background info to help the AI understand your needs..."
            disabled={isStreaming}
            rows={2}
            className="mt-2 w-full resize-none rounded-md border border-input bg-muted/30 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            aria-label="Context input"
          />
        )}
      </div>

      {/* Submit / Stop buttons */}
      <div className="flex gap-2">
        {isStreaming ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            aria-label="Stop streaming"
          >
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            aria-label="Submit prompt"
          >
            {t('submitPrompt')}
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* AI Response area */}
      {(response || isStreaming) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            {t('responseTitle')}
            {isStreaming && (
              <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            )}
          </h3>
          <div
            className="min-h-[100px] rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground"
            role="region"
            aria-label="AI response"
            aria-live="polite"
          >
            {response || (
              <span className="text-muted-foreground">Generating response...</span>
            )}
          </div>
        </div>
      )}

      {/* Prompt score + tokens */}
      {promptScore !== null && tokensUsed !== null && (
        <PromptScoreDisplay score={promptScore} tokensUsed={tokensUsed} />
      )}
    </div>
  );
};

/* ── Prompt Score Display (S3-010) ────────────────────────── */

interface PromptScoreDisplayProps {
  /** Score between 0 and 1 */
  score: number;
  /** Number of tokens consumed */
  tokensUsed: number;
}

/**
 * Displays the prompt quality score as a visual indicator.
 *
 * @param score - Prompt quality score (0–1)
 * @param tokensUsed - Tokens consumed by the response
 */
const PromptScoreDisplay: FC<PromptScoreDisplayProps> = ({ score, tokensUsed }) => {
  const t = useTranslations('Learn');
  const percentage = Math.round(score * 100);

  /** Determine color based on score */
  const getScoreColor = (s: number): string => {
    if (s >= 0.7) return 'text-green-600 dark:text-green-400';
    if (s >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  /** Determine label based on score */
  const getScoreLabel = (s: number): string => {
    if (s >= 0.8) return 'Excellent!';
    if (s >= 0.6) return 'Good';
    if (s >= 0.4) return 'Okay';
    return 'Needs work';
  };

  return (
    <div className="flex items-center gap-6 rounded-md border border-border bg-muted/20 p-3">
      {/* Score */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t('promptScore')}:
        </span>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
          {percentage}%
        </span>
        <span className={`text-xs ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Prompt score: ${percentage}%`}
          />
        </div>
      </div>

      {/* Tokens */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{t('tokensUsed')}:</span>
        <span className="text-sm font-medium text-foreground">{tokensUsed}</span>
      </div>
    </div>
  );
};

export { PromptScoreDisplay };
