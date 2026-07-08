'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Skull, Star, Crown, Swords, Brain, ShieldAlert } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';
import { KpBadge } from '@/components/game/KpBadge';
import { CAMPAIGNS, CLASSES, type Mission } from '@/data/game';
import { ENEMY_STRENGTH, getKnowledgeAdvantage } from '@/data/academy';
import { useGame } from '@/state/game-context';

const zombie = '/assets/game/zombie.png';

const diffStyles: Record<Mission['difficulty'], string> = {
  easy: 'text-success border-success/40',
  medium: 'text-primary border-primary/40',
  hard: 'text-accent border-accent/40',
  elite: 'text-destructive border-destructive/50',
};

/**
 * Mission list for one campaign — header HUD, hero strip, mission cards with
 * difficulty + enemy-strength + outlook badges, and a "Open Academy" entry.
 *
 * Auth + character gating handled by `(learner)/layout.tsx`. We still defensively
 * return null if `character` is briefly absent (between hydrate and layout redirect).
 */
export default function CampaignPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { character, totalKnowledgeEarned } = useGame();

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);

  useEffect(() => {
    if (character && !campaign) router.replace('/dashboard');
  }, [character, campaign, router]);

  if (!character) return null;
  if (!campaign) return null;

  const klass = CLASSES.find((c) => c.id === character.class);
  if (!klass) return null;

  return (
    <Scene background={campaign.image}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> World Map
            </button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto mt-10 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-primary/80">{campaign.subtitle}</p>
          <h1 className="font-display text-4xl sm:text-6xl text-glow-primary mt-2">{campaign.name}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm sm:text-base">{campaign.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-3 panel px-5 py-3">
              <Skull className="h-5 w-5 text-destructive" />
              <div className="text-left">
                <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Final Boss</div>
                <div className="font-display text-lg text-glow-primary">{campaign.bossName}</div>
              </div>
            </div>
            <GameButton variant="gold" size="md" onClick={() => router.push(`/campaign/${campaign.slug}/prepare`)}>
              <Brain className="h-4 w-4" /> Open Academy
            </GameButton>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mt-10 grid gap-4">
          {campaign.missions.map((m, i) => {
            const isBoss = m.difficulty === 'elite';
            const enemyStrength = ENEMY_STRENGTH[m.id] ?? 100;
            const adv = getKnowledgeAdvantage(totalKnowledgeEarned, enemyStrength);
            const outlookTone =
              adv.label === 'underleveled' ? 'text-destructive' :
              adv.label === 'matched' ? 'text-accent' :
              'text-success';
            return (
              <article
                key={m.id}
                className="panel p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-in-up hover:border-primary/60 transition-all"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center overflow-hidden">
                    {isBoss ? (
                      <Crown className="h-10 w-10 text-destructive animate-pulse-glow" />
                    ) : (
                      <Image
                        src={zombie}
                        alt=""
                        width={80}
                        height={80}
                        className="h-20 w-20 object-contain animate-float-slow"
                      />
                    )}
                  </div>
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground text-xs font-display flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.7)]">
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-xl text-glow-primary">{m.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-[0.25em] uppercase ${diffStyles[m.difficulty]}`}>
                      {m.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-accent" /> {m.xp} XP</span>
                    <span className="flex items-center gap-1.5"><Swords className="h-3.5 w-3.5 text-primary" /> {m.zombieCount} foes</span>
                    <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Strength {enemyStrength}</span>
                    <span className={`flex items-center gap-1.5 ${outlookTone}`}>
                      <Brain className="h-3.5 w-3.5" /> {adv.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-44">
                  <GameButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/campaign/${campaign.slug}/mission/${m.id}/prep`)}
                  >
                    <Brain className="h-4 w-4" /> Prepare for Mission
                  </GameButton>
                  <GameButton
                    variant={isBoss ? 'gold' : 'primary'}
                    size="sm"
                    onClick={() => router.push(`/campaign/${campaign.slug}/battle/${m.id}`)}
                  >
                    {isBoss ? 'Challenge Boss' : 'Begin Mission'}
                  </GameButton>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </Scene>
  );
}
