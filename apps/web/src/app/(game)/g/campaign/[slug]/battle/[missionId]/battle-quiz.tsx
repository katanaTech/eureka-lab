'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GameButton } from '@/components/game/fantasy';
import { Zap } from 'lucide-react';
import type { QuizQuestion } from '@eureka-lab/shared-types';

// ── Constants ────────────────────────────────────────────────────────────────

/** Seconds per question */
const QUESTION_TIMER = 15;

/** Animation delay after answer before advancing (ms) */
export const ATTACK_ANIMATION_MS = 600;

// ── Option labels ────────────────────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

// ── QuestionCard ─────────────────────────────────────────────────────────────

interface BattleQuizProps {
  /** The current quiz question */
  question: QuizQuestion;
  /** 1-based question number for display */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Whether spark charge ability is available */
  sparkChargesAvailable: number;
  /** Whether we're in gamified mode (show spark button) */
  isGameMode: boolean;
  /** Called when the player selects an answer */
  onAnswer: (answerIndex: number, timeRemaining: number) => void;
  /** Called when the player uses a spark charge */
  onUseSparkCharge: () => void;
}

/**
 * Battle quiz card — displays one question with 4 options and a countdown timer.
 * Auto-submits on timeout. Shows spark charge button in gamified mode.
 *
 * @param props - Quiz card props
 * @returns Interactive question card with timer
 */
export function BattleQuiz({
  question,
  questionNumber,
  totalQuestions,
  sparkChargesAvailable,
  isGameMode,
  onAnswer,
  onUseSparkCharge,
}: BattleQuizProps) {
  const t = useTranslations('Phase16Battle');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Clear the running timer interval. */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset state when question changes
  useEffect(() => {
    setTimeLeft(QUESTION_TIMER);
    setSelectedIndex(null);
    setIsLocked(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [question.id, clearTimer]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0 && !isLocked) {
      setIsLocked(true);
      onAnswer(-1, 0);
    }
  }, [timeLeft, isLocked, onAnswer]);

  /**
   * Handle option selection.
   *
   * @param index - The selected option index (0-3)
   */
  function handleSelect(index: number) {
    if (isLocked) return;
    setSelectedIndex(index);
    setIsLocked(true);
    clearTimer();
    onAnswer(index, timeLeft);
  }

  const timerPct = (timeLeft / QUESTION_TIMER) * 100;

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      {/* Header: question number + timer */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t('questionProgress', { current: questionNumber, total: totalQuestions })}
        </span>
        <div className="flex items-center gap-2">
          {/* Spark charge button */}
          {isGameMode && sparkChargesAvailable > 0 && !isLocked && (
            <GameButton
              variant="gold"
              size="sm"
              onClick={onUseSparkCharge}
              aria-label={t('sparkChargeAria', { count: sparkChargesAvailable })}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {t('sparkChargeLabel', { count: sparkChargesAvailable })}
            </GameButton>
          )}
          {/* Timer */}
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-1000 ease-linear',
                  timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span
              className={cn(
                'font-display text-sm tabular-nums',
                timeLeft > 5 ? 'text-foreground' : 'text-red-400'
              )}
            >
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Question text */}
      <div className="rounded-xl border border-primary/20 bg-card/80 p-5">
        <p className="text-base font-medium leading-relaxed text-foreground">
          {question.text}
        </p>
      </div>

      {/* Answer options */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.correctIndex;
          const showResult = isLocked;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isLocked}
              aria-label={`Option ${OPTION_LETTERS[idx]}: ${option}`}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all',
                !showResult && !isSelected && 'border-primary/20 bg-card/60 hover:border-primary/40 hover:bg-card/80',
                !showResult && isSelected && 'border-primary bg-primary/10',
                showResult && isCorrect && 'border-green-500/60 bg-green-500/10',
                showResult && isSelected && !isCorrect && 'border-red-500/60 bg-red-500/10',
                showResult && !isSelected && !isCorrect && 'border-primary/10 opacity-50'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                  showResult && isCorrect
                    ? 'bg-green-500/20 text-green-400'
                    : showResult && isSelected
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {OPTION_LETTERS[idx]}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after lock) */}
      {isLocked && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-lg border border-primary/10 bg-card/40 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{t('explanationPrefix')}</span>{' '}
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
