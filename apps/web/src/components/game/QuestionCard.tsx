'use client';

import type { QuizQuestion } from '@eureka-lab/shared-types';

interface QuestionCardProps {
  /** The current quiz question to display */
  question: QuizQuestion;
  /** 1-based question number for the progress label */
  questionNumber: number;
  /** Total number of questions in this battle */
  totalQuestions: number;
  /** Seconds remaining on the countdown (0–15) */
  timeRemaining: number;
  /** Index of the option selected by the player, or null if unanswered */
  selectedAnswer: number | null;
  /**
   * Called when the player selects an option.
   * Ignored if `selectedAnswer` is already set (prevents double submission).
   *
   * @param index - Option index 0–3
   */
  onAnswer: (index: number) => void;
  /**
   * Compact mode — smaller padding and font sizes for mobile viewports.
   * Defaults to false.
   */
  compact?: boolean;
}

/**
 * Question card used in both the desktop 3D battle and the mobile 2D battle.
 * Shows the question text, four labelled option buttons (A–D), a countdown timer,
 * and a question-counter. Buttons disable after the first selection.
 *
 * @param question - The current quiz question
 * @param questionNumber - 1-based question index for display
 * @param totalQuestions - Total questions in this battle (for "Q n/total" label)
 * @param timeRemaining - Seconds left on the 15-second timer
 * @param selectedAnswer - Index of the chosen option, or null
 * @param onAnswer - Callback fired when the player taps an option
 * @param compact - Use mobile-optimised (smaller) sizing
 */
export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  selectedAnswer,
  onAnswer,
  compact = false,
}: QuestionCardProps) {
  const px = compact ? 'px-4 pb-4' : 'px-6 pb-6';
  const questionPad = compact ? 'p-3' : 'p-4';
  const questionText = compact ? 'text-sm' : 'text-base';
  const btnPad = compact ? 'p-2.5 text-xs' : 'p-3 text-sm';

  return (
    <div className={px}>
      {/* Counter + countdown row */}
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs text-gray-500">
          Q{questionNumber}/{totalQuestions}
        </p>
        <p
          className={`font-mono font-bold text-sm ${
            timeRemaining <= 5 ? 'animate-pulse text-red-400' : 'text-yellow-400'
          }`}
        >
          {timeRemaining}s
        </p>
      </div>

      {/* Question text */}
      <div className={`mb-3 rounded-2xl border border-white/10 bg-gray-900 ${questionPad}`}>
        <p className={`font-semibold leading-snug text-white ${questionText}`}>
          {question.text}
        </p>
      </div>

      {/* Option buttons — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          let style =
            'border-white/10 bg-gray-800 text-white hover:border-indigo-500 hover:bg-gray-700 active:bg-gray-700';
          if (selectedAnswer !== null) {
            style =
              selectedAnswer === i
                ? 'border-indigo-500 bg-indigo-900/50 text-white'
                : 'cursor-not-allowed border-white/5 bg-gray-900 text-gray-600';
          }
          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={selectedAnswer !== null}
              aria-pressed={selectedAnswer === i}
              className={`rounded-xl border text-left font-medium transition-all ${btnPad} ${style}`}
            >
              <span className="mr-2 text-gray-500">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
