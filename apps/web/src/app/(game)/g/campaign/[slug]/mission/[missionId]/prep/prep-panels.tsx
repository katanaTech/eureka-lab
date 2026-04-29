'use client';

/**
 * Sub-components for the Mission Prep page.
 * Extracted to keep page.tsx under 300 lines (CLAUDE.md rule #8).
 * Includes: QuestionCard, ResultsPanel, NoQuizFallback.
 */

import Link from 'next/link';
import { Swords, BookOpen } from 'lucide-react';
import { GameButton } from '@/components/game/fantasy';
import { cn } from '@/lib/utils';
import type { PrepQuizQuestion } from '../../../prepare/lesson-data';

// ── QuestionCard ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  /** The question to render */
  question: PrepQuizQuestion;
  /** 1-based display number */
  questionNumber: number;
  /** Currently selected option index, or null if unanswered */
  picked: number | null;
  /** Callback when a player selects an option */
  onPick: (optIdx: number) => void;
}

/**
 * Single multiple-choice question card within the prep quiz.
 *
 * @param props.question - Question data
 * @param props.questionNumber - 1-based display number
 * @param props.picked - Currently selected option index or null
 * @param props.onPick - Selection callback
 * @returns A card with 4 option buttons
 */
export function QuestionCard({ question, questionNumber, picked, onPick }: QuestionCardProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-5">
      <p className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-2">
        Question {questionNumber}
      </p>
      <p className="text-sm font-semibold mb-4">{question.text}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onPick(idx)}
            aria-pressed={picked === idx}
            className={cn(
              'rounded-lg border px-4 py-2 text-left text-xs transition-all',
              picked === idx
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ResultsPanel ──────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  /** All three quiz questions */
  questions: PrepQuizQuestion[];
  /** Player's picked option per question (index 0-3 or null) */
  picks: (number | null)[];
  /** Number of questions answered correctly */
  correctCount: number;
  /** KP awarded per correct answer */
  kpPerCorrect: number;
  /** Hero's total lifetime KP used for the comparison panel */
  heroKp: number;
  /** Campaign URL slug */
  slug: string;
  /** Mission identifier */
  missionId: string;
}

/**
 * Results view shown after the player submits the prep quiz.
 * Displays per-question feedback and navigation to battle or Academy.
 *
 * @param props.questions - The three quiz questions
 * @param props.picks - Player's selected options
 * @param props.correctCount - Number of correct answers
 * @param props.kpPerCorrect - KP per correct answer
 * @param props.heroKp - Lifetime KP for comparison panel
 * @param props.slug - Campaign URL slug
 * @param props.missionId - Mission identifier
 * @returns Results panel with breakdown and footer navigation
 */
export function ResultsPanel({
  questions,
  picks,
  correctCount,
  kpPerCorrect,
  heroKp,
  slug,
  missionId,
}: ResultsPanelProps) {
  const earned = correctCount * kpPerCorrect;

  return (
    <div>
      {/* Score summary */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 text-center">
        <p className="font-display text-4xl text-glow-primary">{correctCount}/3</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {earned > 0 ? `+${earned} KP earned` : 'No KP this time — keep training!'}
        </p>
      </div>

      {/* KP comparison */}
      <KpComparison heroKp={heroKp} />

      {/* Per-question breakdown */}
      <div className="flex flex-col gap-4 mb-8">
        {questions.map((q, i) => {
          const isCorrect = picks[i] === q.correct;
          return (
            <div
              key={q.id}
              className={cn(
                'rounded-xl border p-4',
                isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
              )}
            >
              <p className="text-xs font-semibold mb-1 flex items-center gap-2">
                <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                {q.text}
              </p>
              {!isCorrect && picks[i] !== null && (
                <p className="text-xs text-muted-foreground mb-1">
                  Your answer:{' '}
                  <span className="text-red-400">{q.options[picks[i] as number]}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Correct: <span className="text-emerald-400">{q.options[q.correct]}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground italic">{q.explain}</p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-4 w-4" aria-hidden />
            Open Academy
          </GameButton>
        </Link>
        <Link href={`/g/campaign/${slug}/battle/${missionId}`}>
          <GameButton variant={correctCount === 3 ? 'gold' : 'primary'} size="md">
            <Swords className="h-4 w-4" aria-hidden />
            Begin Battle
          </GameButton>
        </Link>
      </div>
    </div>
  );
}

// ── KpComparison ─────────────────────────────────────────────────────────────

interface KpComparisonProps {
  /** Hero's lifetime KP total */
  heroKp: number;
}

/**
 * Panel comparing the hero's lifetime KP to the current enemy strength rating.
 *
 * @param props.heroKp - Hero's total lifetime KP
 * @returns A two-column comparison card
 */
export function KpComparison({ heroKp }: KpComparisonProps) {
  const stars = heroKp >= 50 ? '★★★' : heroKp >= 20 ? '★★☆' : '★☆☆';

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-card/60 px-5 py-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Your KP (lifetime)
        </p>
        <p className="font-display text-2xl text-primary">{heroKp}</p>
      </div>
      <div className="text-center px-4">
        <p className="text-xs text-muted-foreground">vs</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Enemy Strength
        </p>
        <p className="font-display text-2xl text-amber-400">{stars}</p>
      </div>
    </div>
  );
}

// ── NoQuizFallback ────────────────────────────────────────────────────────────

interface NoQuizFallbackProps {
  /** Campaign URL slug */
  slug: string;
  /** Mission identifier */
  missionId: string;
  /** Human-readable realm name */
  realmName: string;
}

/**
 * Shown when no prep quiz exists for the given missionId.
 * Provides direct navigation to battle and the Academy.
 *
 * @param props.slug - Campaign URL slug
 * @param props.missionId - Mission identifier
 * @param props.realmName - Human-readable realm name
 * @returns A minimal fallback panel with navigation buttons
 */
export function NoQuizFallback({ slug, missionId, realmName }: NoQuizFallbackProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-8 text-center">
      <p className="text-sm text-muted-foreground mb-6">
        No warm-up quiz available for this mission yet. Jump straight into battle or visit the{' '}
        <span className="text-primary">{realmName}</span> Academy to prepare.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href={`/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-4 w-4" aria-hidden />
            Open Academy
          </GameButton>
        </Link>
        <Link href={`/g/campaign/${slug}/battle/${missionId}`}>
          <GameButton variant="primary" size="md">
            <Swords className="h-4 w-4" aria-hidden />
            Begin Battle
          </GameButton>
        </Link>
      </div>
    </div>
  );
}
