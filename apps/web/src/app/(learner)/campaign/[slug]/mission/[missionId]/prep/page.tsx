'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Brain, Check, ShieldAlert, Sparkles, Swords, Trophy } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CAMPAIGNS } from '@/data/game';
import { MISSION_PREPS, ENEMY_STRENGTH, getKnowledgeAdvantage } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';

/**
 * Mission warm-up quiz. Each correct answer credits KP optimistically through
 * useGame().addKnowledge. Backend persistence of mission-prep KP is a Plan 3
 * deliverable (see useGame adapter TODO markers).
 */
export default function MissionPrepPage({
  params,
}: { params: Promise<{ slug: string; missionId: string }> }) {
  const { slug, missionId } = use(params);
  const router = useRouter();
  const game = useGame();
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!game.character) return null;

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);
  const mission = campaign?.missions.find((m) => m.id === missionId);
  if (!campaign || !mission) {
    router.replace('/dashboard');
    return null;
  }

  const prep = MISSION_PREPS[mission.id];
  const enemyStrength = ENEMY_STRENGTH[mission.id] ?? 100;
  const adv = getKnowledgeAdvantage(game.totalKnowledgeEarned, enemyStrength);

  const submit = () => {
    if (!prep) return;
    let correct = 0;
    prep.questions.forEach((q, i) => { if (picks[i] === q.correct) correct++; });
    const kp = correct * prep.kpPerCorrect;
    if (kp > 0) game.addKnowledge(kp);
    setEarned(kp);
    setSubmitted(true);
    if (kp > 0) toast.success(`+${kp} KP earned!`);
  };

  const advLabel = {
    underleveled: { text: 'Underleveled — visit the Academy first!', tone: 'text-destructive', Icon: ShieldAlert },
    matched: { text: 'Match — risky but possible.', tone: 'text-accent', Icon: Swords },
    ready: { text: 'Ready — you have the edge!', tone: 'text-success', Icon: Sparkles },
    overpowered: { text: 'Overpowered — easy victory ahead.', tone: 'text-success text-glow-primary', Icon: Trophy },
  }[adv.label];
  const AdvIcon = advLabel.Icon;

  return (
    <Scene background={campaign.image}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push(`/campaign/${campaign.slug}`)}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Mission List
            </button>
          </div>
        </header>

        <section className="max-w-3xl mx-auto mt-8 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-accent">PREP QUIZ</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">{mission.title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{prep?.intro ?? mission.description}</p>
        </section>

        {/* Strength compare */}
        <section className="max-w-3xl mx-auto mt-6 grid sm:grid-cols-3 gap-3">
          <div className="panel p-4 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Hero KP (lifetime)</div>
            <div className="font-display text-3xl text-glow-primary mt-1">{game.totalKnowledgeEarned}</div>
          </div>
          <div className="panel p-4 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Enemy Strength</div>
            <div className="font-display text-3xl text-destructive mt-1">{enemyStrength}</div>
          </div>
          <div className={cn('panel p-4 text-center flex flex-col items-center justify-center', advLabel.tone)}>
            <AdvIcon className="h-5 w-5" />
            <div className="text-[10px] tracking-[0.3em] uppercase mt-1">Outlook</div>
            <div className="text-sm mt-1">{advLabel.text}</div>
          </div>
        </section>

        {/* Questions */}
        {prep && (
          <section className="max-w-3xl mx-auto mt-6 panel p-5 sm:p-6">
            <h3 className="font-display text-lg text-glow-primary flex items-center gap-2">
              <Brain className="h-4 w-4" /> Sample Questions ({prep.questions.length})
            </h3>
            <div className="text-[10px] tracking-[0.3em] uppercase text-accent mt-1">
              +{prep.kpPerCorrect} KP per correct answer
            </div>

            <div className="mt-4 space-y-5">
              {prep.questions.map((q, qi) => (
                <div key={qi}>
                  <p className="font-display text-base">{qi + 1}. {q.q}</p>
                  <div className="grid gap-2 mt-2">
                    {q.options.map((opt, oi) => {
                      const chosen = picks[qi] === oi;
                      const correct = submitted && oi === q.correct;
                      const wrong = submitted && chosen && oi !== q.correct;
                      return (
                        <button
                          key={oi}
                          disabled={submitted}
                          onClick={() => setPicks((p) => ({ ...p, [qi]: oi }))}
                          className={cn(
                            'panel text-left p-2.5 text-sm transition-all',
                            chosen && !submitted && 'border-primary text-primary',
                            correct && 'border-success text-success',
                            wrong && 'border-destructive text-destructive',
                            submitted && !chosen && !correct && 'opacity-60'
                          )}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <p className="text-xs text-muted-foreground mt-1.5">💡 {q.hint}</p>
                  )}
                </div>
              ))}
            </div>

            {!submitted ? (
              <div className="mt-5 flex justify-end">
                <GameButton
                  variant="primary"
                  size="md"
                  disabled={Object.keys(picks).length !== prep.questions.length}
                  onClick={submit}
                >
                  <Check className="h-4 w-4" /> Submit Answers
                </GameButton>
              </div>
            ) : (
              <div className="mt-5 panel p-4 border-accent/40 text-center">
                <p className="font-display text-lg text-glow-gold">+{earned} KP earned!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can retake other lessons in the Academy to gain more.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Footer actions */}
        <section className="max-w-3xl mx-auto mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <GameButton variant="ghost" size="md" onClick={() => router.push(`/campaign/${campaign.slug}/prepare`)}>
            <Brain className="h-4 w-4" /> Open Academy
          </GameButton>
          <GameButton variant="gold" size="md" onClick={() => router.push(`/campaign/${campaign.slug}/battle/${mission.id}`)}>
            <Swords className="h-4 w-4" /> Begin Battle
          </GameButton>
        </section>
      </main>
    </Scene>
  );
}
