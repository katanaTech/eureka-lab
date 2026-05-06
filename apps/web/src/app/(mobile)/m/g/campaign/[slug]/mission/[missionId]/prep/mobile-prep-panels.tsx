'use client';

/**
 * Mobile-specific prep panel components with /m/g/ navigation links.
 * QuestionCard and KpComparison are imported from desktop (no hardcoded links).
 * ResultsPanel and NoQuizFallback are re-implemented with mobile paths.
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Swords, BookOpen } from 'lucide-react';
import { GameButton } from '@/components/game/fantasy';
import { cn } from '@/lib/utils';
import type { PrepQuizQuestion } from '@/app/(game)/g/campaign/[slug]/prepare/lesson-data';

// Re-export shared components that have no hardcoded /g/ links
export { QuestionCard, KpComparison } from '@/app/(game)/g/campaign/[slug]/mission/[missionId]/prep/prep-panels';

// ── Mobile ResultsPanel ─────────────────────────────────────────────────────

interface ResultsPanelProps {
  /** All three quiz questions */
  questions: PrepQuizQuestion[];
  /** Player's picked option per question */
  picks: (number | null)[];
  /** Number of questions answered correctly */
  correctCount: number;
  /** KP awarded per correct answer */
  kpPerCorrect: number;
  /** Hero's total lifetime KP */
  heroKp: number;
  /** Campaign URL slug */
  slug: string;
  /** Mission identifier */
  missionId: string;
}

/**
 * Mobile results panel with /m/g/ navigation links.
 *
 * @param props - Results display props
 * @returns Results panel with question breakdown and mobile navigation
 */
export function MobileResultsPanel({
  questions, picks, correctCount, kpPerCorrect, heroKp, slug, missionId,
}: ResultsPanelProps) {
  const t = useTranslations('Phase16MissionPrep');
  const earned = correctCount * kpPerCorrect;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
        <p className="font-display text-3xl text-glow-primary">{t('scoreSummary', { correct: correctCount })}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {earned > 0 ? t('kpEarned', { kp: earned }) : t('noKpThisTime')}
        </p>
      </div>

      <MobileKpComparison heroKp={heroKp} />

      <div className="flex flex-col gap-3 mb-6">
        {questions.map((q, i) => {
          const isCorrect = picks[i] === q.correct;
          return (
            <div key={q.id} className={cn(
              'rounded-xl border p-3',
              isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5',
            )}>
              <p className="text-[10px] font-semibold mb-1 flex items-center gap-1.5">
                <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{isCorrect ? '✓' : '✗'}</span>
                {q.text}
              </p>
              {!isCorrect && picks[i] !== null && (
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {t('yourAnswer')}<span className="text-red-400">{q.options[picks[i] as number]}</span>
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {t('correctLabel')}<span className="text-emerald-400">{q.options[q.correct]}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground italic">{q.explain}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/m/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t('openAcademy')}
          </GameButton>
        </Link>
        <Link href={`/m/g/campaign/${slug}/battle/${missionId}`}>
          <GameButton variant={correctCount === 3 ? 'gold' : 'primary'} size="sm">
            <Swords className="h-3.5 w-3.5" aria-hidden />
            {t('beginBattle')}
          </GameButton>
        </Link>
      </div>
    </div>
  );
}

// ── Mobile KpComparison (inline to avoid require) ──────────────────────────

interface KpComparisonProps { heroKp: number }

/**
 * Compact KP comparison panel for mobile.
 * @param props.heroKp - Hero's lifetime KP total
 * @returns A comparison card
 */
function MobileKpComparison({ heroKp }: KpComparisonProps) {
  const t = useTranslations('Phase16MissionPrep');
  const stars = heroKp >= 50 ? '★★★' : heroKp >= 20 ? '★★☆' : '★☆☆';

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/20 bg-card/60 px-4 py-3">
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('kpYourLifetime')}</p>
        <p className="font-display text-xl text-primary">{heroKp}</p>
      </div>
      <div className="text-center px-3">
        <p className="text-[10px] text-muted-foreground">{t('kpVs')}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('enemyStrength')}</p>
        <p className="font-display text-xl text-amber-400">{stars}</p>
      </div>
    </div>
  );
}

// ── Mobile NoQuizFallback ───────────────────────────────────────────────────

interface NoQuizFallbackProps {
  slug: string;
  missionId: string;
  realmName: string;
}

/**
 * Fallback when no prep quiz exists — provides mobile navigation.
 *
 * @param props - Fallback props
 * @returns A minimal panel with mobile navigation
 */
export function MobileNoQuizFallback({ slug, missionId, realmName }: NoQuizFallbackProps) {
  const t = useTranslations('Phase16MissionPrep');
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-6 text-center">
      <p className="text-xs text-muted-foreground mb-4">{t('noQuizFallback', { realmName })}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href={`/m/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t('openAcademy')}
          </GameButton>
        </Link>
        <Link href={`/m/g/campaign/${slug}/battle/${missionId}`}>
          <GameButton variant="primary" size="sm">
            <Swords className="h-3.5 w-3.5" aria-hidden />
            {t('beginBattle')}
          </GameButton>
        </Link>
      </div>
    </div>
  );
}
