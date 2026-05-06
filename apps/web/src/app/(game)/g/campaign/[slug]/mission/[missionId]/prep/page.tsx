'use client';

/**
 * Mission prep page — warm-up quiz before entering battle.
 * Shows 3 multiple-choice questions, awards KP, and lets the player navigate
 * to battle or back to the Academy.
 *
 * Route: /g/campaign/[slug]/mission/[missionId]/prep
 * Sub-components are in ./prep-panels.tsx (CLAUDE.md rule #8 — 300 line limit).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Swords } from 'lucide-react';
import { toast } from 'sonner';
import {
  ZONE_BY_CAMPAIGN_SLUG,
  REALM_NAME_BY_ZONE,
  type ZoneId,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';
import {
  PLACEHOLDER_PREP_QUIZZES,
  type MissionPrepQuiz,
  type PrepQuizQuestion,
} from '../../../prepare/lesson-data';
import { QuestionCard, ResultsPanel, KpComparison, NoQuizFallback } from './prep-panels';

// ── Static mission metadata ───────────────────────────────────────────────────

/** Display titles keyed by mission ID, mirroring PLACEHOLDER_MISSIONS in campaign detail. */
const MISSION_TITLE: Record<string, string> = {
  'lib-1': 'Prompt Basics',    'lib-2': 'Context Mastery',
  'lib-3': 'Hallucination Hunt', 'lib-boss': 'Babble Whisperer',
  'forge-1': 'Trigger & Action', 'forge-2': 'Multi-Step Chains',
  'forge-3': 'Error Handling',   'forge-boss': 'Babble Drone',
  'cit-1': 'Code Reading',    'cit-2': 'Bug Squashing',
  'cit-3': 'Feature Building', 'cit-boss': 'Babble Glitch',
  'aca-1': 'Agent Persona',   'aca-2': 'Memory Design',
  'aca-3': 'Tool Integration', 'aca-boss': 'Babble Wraith',
};

/** Short descriptions keyed by mission ID. */
const MISSION_DESCRIPTION: Record<string, string> = {
  'lib-1': 'Learn to craft your first clear, effective AI prompt.',
  'lib-2': 'Provide rich context to shape AI responses.',
  'lib-3': 'Train your eye to spot AI confabulations.',
  'lib-boss': 'Face the guardian of the Isle of Whispers.',
  'forge-1': 'Build your first AI workflow with a trigger and an action.',
  'forge-2': 'Link multiple AI steps together.',
  'forge-3': 'Design workflows that handle unexpected outputs.',
  'forge-boss': 'Battle the Forge of Echoes guardian.',
  'cit-1': 'Understand AI-generated code.',
  'cit-2': 'Use AI as a debugger.',
  'cit-3': 'Guide AI to extend an existing mini-app.',
  'cit-boss': 'Confront the corrupted guardian of the Citadel.',
  'aca-1': 'Define a personality and purpose for your AI agent.',
  'aca-2': 'Give your agent persistent context.',
  'aca-3': 'Connect your agent to external tools.',
  'aca-boss': 'Face the wraith that haunts the Academy.',
};

// ── Phase type ────────────────────────────────────────────────────────────────

/** Prep quiz display phase. */
type PrepPhase = 'quiz' | 'results';

// ── Main page ─────────────────────────────────────────────────────────────────

/**
 * Mission prep page.
 * Resolves slug → ZoneId and missionId → quiz data, then renders a
 * warm-up quiz followed by a results/navigation panel.
 *
 * @returns The full-screen prep page, or null while redirecting
 */
export default function MissionPrepPage() {
  const params = useParams<{ slug: string; missionId: string }>();
  const router = useRouter();

  const slug = params.slug ?? '';
  const missionId = params.missionId ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  useEffect(() => {
    if (!zoneId) router.replace('/g/dashboard');
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const missionTitle = MISSION_TITLE[missionId] ?? missionId;
  const missionDesc = MISSION_DESCRIPTION[missionId] ?? '';
  const quiz: MissionPrepQuiz | undefined = PLACEHOLDER_PREP_QUIZZES[missionId];

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Header */}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <Link href={`/g/campaign/${slug}`}>
            <GameButton variant="ghost" size="sm">← {realmName}</GameButton>
          </Link>
        </div>
      </header>

      {/* Mission info */}
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <p className="text-xs text-muted-foreground tracking-wider uppercase mb-2">{realmName}</p>
        <h1 className="font-display text-3xl uppercase tracking-widest text-glow-primary">
          {missionTitle}
        </h1>
        {missionDesc && (
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{missionDesc}</p>
        )}
      </div>

      {/* Quiz or fallback */}
      <div className="mx-auto mt-8 max-w-3xl">
        {quiz ? (
          <PrepQuizFlow quiz={quiz} slug={slug} missionId={missionId} />
        ) : (
          <NoQuizFallback slug={slug} missionId={missionId} realmName={realmName} />
        )}
      </div>
    </Scene>
  );
}

// ── PrepQuizFlow ──────────────────────────────────────────────────────────────

interface PrepQuizFlowProps {
  /** Prep quiz data for this mission */
  quiz: MissionPrepQuiz;
  /** Campaign URL slug */
  slug: string;
  /** Mission identifier */
  missionId: string;
}

/**
 * State machine for the 3-question prep quiz.
 * Handles answer selection, submission, KP award, and phase transition.
 *
 * @param props.quiz - Quiz questions and KP configuration
 * @param props.slug - Campaign URL slug
 * @param props.missionId - Mission identifier
 * @returns The quiz form or the results panel
 */
function PrepQuizFlow({ quiz, slug, missionId }: PrepQuizFlowProps) {
  const addKp = useInventoryStore((s) => s.addKp);
  const totalKpEarned = useInventoryStore((s) => s.totalKpEarned);

  const [picks, setPicks] = useState<(number | null)[]>([null, null, null]);
  const [phase, setPhase] = useState<PrepPhase>('quiz');
  const [correctCount, setCorrectCount] = useState(0);

  /**
   * Record the player's option choice for a question.
   *
   * @param qIdx - Question index (0-2)
   * @param optIdx - Option index (0-3)
   */
  function handlePick(qIdx: number, optIdx: number) {
    setPicks((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }

  /** Submit all answers, award KP, and transition to results phase. */
  function handleSubmit() {
    const correct = quiz.questions.filter((q, i) => picks[i] === q.correct).length;
    setCorrectCount(correct);
    const earned = correct * quiz.kpPerCorrect;
    if (earned > 0) {
      addKp(earned);
      toast.success(`+${earned} KP earned!`);
    }
    setPhase('results');
  }

  if (phase === 'results') {
    return (
      <ResultsPanel
        questions={quiz.questions}
        picks={picks}
        correctCount={correctCount}
        kpPerCorrect={quiz.kpPerCorrect}
        heroKp={totalKpEarned}
        slug={slug}
        missionId={missionId}
      />
    );
  }

  const allAnswered = picks.every((p) => p !== null);

  return (
    <div>
      {/* KP comparison */}
      <KpComparison heroKp={totalKpEarned} />

      <p className="mb-5 text-sm text-muted-foreground text-center">
        Answer all 3 warm-up questions to earn up to{' '}
        <span className="text-primary font-semibold">
          {quiz.kpPerCorrect * 3} KP
        </span>{' '}
        before battle.
      </p>

      {/* Questions */}
      <div className="flex flex-col gap-6">
        {quiz.questions.map((q: PrepQuizQuestion, qIdx: number) => (
          <QuestionCard
            key={q.id}
            question={q}
            questionNumber={qIdx + 1}
            picked={picks[qIdx]}
            onPick={(optIdx) => handlePick(qIdx, optIdx)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-4 w-4" aria-hidden />
            Open Academy
          </GameButton>
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {picks.filter((p) => p !== null).length}/3 answered
          </p>
          <GameButton
            variant="primary"
            size="md"
            disabled={!allAnswered}
            onClick={handleSubmit}
          >
            <Swords className="h-4 w-4" aria-hidden />
            Submit & Review
          </GameButton>
        </div>
      </div>
    </div>
  );
}
