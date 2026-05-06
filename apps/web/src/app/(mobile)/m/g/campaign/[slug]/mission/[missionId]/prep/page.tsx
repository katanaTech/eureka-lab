'use client';

/**
 * Mobile mission prep page — warm-up quiz before battle.
 * Mirrors desktop prep page with compact layout and /m/g/ navigation.
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
} from '@/app/(game)/g/campaign/[slug]/prepare/lesson-data';
import {
  QuestionCard,
  MobileResultsPanel,
  MobileNoQuizFallback,
} from './mobile-prep-panels';

/** Display titles keyed by mission ID. */
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

type PrepPhase = 'quiz' | 'results';

/**
 * Mobile mission prep page. Compact quiz layout with /m/g/ navigation.
 *
 * @returns The mobile prep quiz page
 */
export default function MobileMissionPrepPage() {
  const params = useParams<{ slug: string; missionId: string }>();
  const router = useRouter();

  const slug = params.slug ?? '';
  const missionId = params.missionId ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  useEffect(() => {
    if (!zoneId) router.replace('/m/g/dashboard');
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const missionTitle = MISSION_TITLE[missionId] ?? missionId;
  const missionDesc = MISSION_DESCRIPTION[missionId] ?? '';
  const quiz: MissionPrepQuiz | undefined = PLACEHOLDER_PREP_QUIZZES[missionId];

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <Link href={`/m/g/campaign/${slug}`}>
            <GameButton variant="ghost" size="sm">← {realmName}</GameButton>
          </Link>
        </div>
      </header>

      <div className="mt-6 text-center">
        <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">{realmName}</p>
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">{missionTitle}</h1>
        {missionDesc && <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">{missionDesc}</p>}
      </div>

      <div className="mt-5">
        {quiz ? (
          <MobilePrepQuizFlow quiz={quiz} slug={slug} missionId={missionId} />
        ) : (
          <MobileNoQuizFallback slug={slug} missionId={missionId} realmName={realmName} />
        )}
      </div>
    </Scene>
  );
}

// ── MobilePrepQuizFlow ──────────────────────────────────────────────────────

interface PrepQuizFlowProps {
  quiz: MissionPrepQuiz;
  slug: string;
  missionId: string;
}

/**
 * Quiz flow state machine for mobile prep quiz.
 *
 * @param props - Quiz flow props
 * @returns Quiz form or results panel
 */
function MobilePrepQuizFlow({ quiz, slug, missionId }: PrepQuizFlowProps) {
  const addKp = useInventoryStore((s) => s.addKp);
  const totalKpEarned = useInventoryStore((s) => s.totalKpEarned);

  const [picks, setPicks] = useState<(number | null)[]>([null, null, null]);
  const [phase, setPhase] = useState<PrepPhase>('quiz');
  const [correctCount, setCorrectCount] = useState(0);

  /** @param qIdx - Question index @param optIdx - Option index */
  function handlePick(qIdx: number, optIdx: number) {
    setPicks((prev) => { const next = [...prev]; next[qIdx] = optIdx; return next; });
  }

  /** Submit answers and transition to results. */
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
      <MobileResultsPanel
        questions={quiz.questions} picks={picks} correctCount={correctCount}
        kpPerCorrect={quiz.kpPerCorrect} heroKp={totalKpEarned}
        slug={slug} missionId={missionId}
      />
    );
  }

  const allAnswered = picks.every((p) => p !== null);

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground text-center">
        Answer all 3 warm-up questions to earn up to{' '}
        <span className="text-primary font-semibold">{quiz.kpPerCorrect * 3} KP</span> before battle.
      </p>
      <div className="flex flex-col gap-4">
        {quiz.questions.map((q: PrepQuizQuestion, qIdx: number) => (
          <QuestionCard key={q.id} question={q} questionNumber={qIdx + 1}
            picked={picks[qIdx]} onPick={(optIdx) => handlePick(qIdx, optIdx)} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/m/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Open Academy
          </GameButton>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground">{picks.filter((p) => p !== null).length}/3</p>
          <GameButton variant="primary" size="sm" disabled={!allAnswered} onClick={handleSubmit}>
            <Swords className="h-3.5 w-3.5" aria-hidden />
            Submit
          </GameButton>
        </div>
      </div>
    </div>
  );
}
