'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Play, ShoppingBag, Check, Lock, Sword,
  Brain, Zap, Shield, Sparkles, CheckCircle2, Swords,
} from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';
import { KpBadge } from '@/components/game/KpBadge';
import { AiTutorChat } from '@/components/game/AiTutorChat';
import { CAMPAIGNS } from '@/data/game';
import { LESSONS, VIDEOS, SHOP_ABILITIES, SHOP_WEAPONS } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';
import { Modal, EmptyState } from './_modal';

const ICONS = { sword: Sword, spark: Sparkles, brain: Brain, shield: Shield, zap: Zap } as const;

type Tab = 'lessons' | 'videos' | 'tutor' | 'shop';

/**
 * Academy hub — Lessons / Shorts / AI Tutor / Forge tabs for one campaign.
 * Lesson + video completions credit KP through useGame() (optimistic-local;
 * Plan 3 will add backend persistence). Shop tab buy/equip route through
 * real backend `inventoryApi.purchaseItem` / `equipWeapon`.
 */
export default function PreparePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const game = useGame();
  const [tab, setTab] = useState<Tab>('lessons');
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [lessonAnswer, setLessonAnswer] = useState<number | null>(null);
  const [openVideo, setOpenVideo] = useState<string | null>(null);

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);

  useEffect(() => {
    if (game.character && !campaign) router.replace('/dashboard');
  }, [game.character, campaign, router]);

  if (!game.character) return null;
  if (!campaign) return null;

  const lessons = LESSONS.filter((l) => l.chapterSlug === campaign.slug);
  const videos = VIDEOS.filter((v) => v.chapterSlug === campaign.slug);

  const lesson = lessons.find((l) => l.id === openLesson) ?? null;
  const video = videos.find((v) => v.id === openVideo) ?? null;

  const submitLesson = () => {
    if (!lesson || lessonAnswer === null) return;
    const correct = lessonAnswer === lesson.check.correct;
    if (correct) {
      game.completeLesson(lesson.id, lesson.kp);
      toast.success(`Lesson complete! +${lesson.kp} KP`);
    } else {
      toast(`Almost! ${lesson.check.explain}`);
    }
    setOpenLesson(null);
    setLessonAnswer(null);
  };

  const claimVideo = () => {
    if (!video) return;
    if (game.watchedVideos.includes(video.id)) {
      toast('Already watched.');
    } else {
      game.watchVideo(video.id, video.kp);
      toast.success(`Video watched! +${video.kp} KP`);
    }
    setOpenVideo(null);
  };

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'videos', label: 'Shorts', icon: Play },
    { id: 'tutor', label: 'AI Tutor', icon: Brain },
    { id: 'shop', label: 'Forge', icon: ShoppingBag },
  ];

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

        <section className="max-w-5xl mx-auto mt-8 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-accent">PREPARE FOR MISSION</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            {campaign.name} Academy
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm sm:text-base">
            Train your hero before battle. Complete lessons, watch shorts, chat with the AI Tutor,
            and visit the Forge to spend Knowledge Points on new abilities and weapons.
          </p>
        </section>

        {/* Tabs */}
        <nav className="max-w-5xl mx-auto mt-6 flex flex-wrap gap-2 justify-center">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'panel px-4 py-2 text-xs tracking-[0.3em] uppercase flex items-center gap-2 transition-all',
                  active ? 'border-primary text-primary text-glow-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </nav>

        <section className="max-w-5xl mx-auto mt-6 pb-10">
          {tab === 'lessons' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {lessons.length === 0 && <EmptyState text="No lessons for this chapter yet." />}
              {lessons.map((l) => {
                const done = game.completedLessons.includes(l.id);
                return (
                  <article key={l.id} className="panel p-5 flex flex-col gap-2 hover:border-primary/60 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" aria-hidden>{l.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-lg text-glow-primary leading-tight">{l.title}</h3>
                        <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                          {l.minutes} min · +{l.kp} KP {done && '· Completed'}
                        </div>
                      </div>
                      {done && <CheckCircle2 className="h-5 w-5 text-success" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{l.intro}</p>
                    <GameButton
                      variant={done ? 'ghost' : 'primary'}
                      size="sm"
                      className="mt-2 self-start"
                      onClick={() => { setOpenLesson(l.id); setLessonAnswer(null); }}
                    >
                      {done ? 'Review' : 'Start Lesson'}
                    </GameButton>
                  </article>
                );
              })}
            </div>
          )}

          {tab === 'videos' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {videos.length === 0 && <EmptyState text="No shorts yet for this chapter." />}
              {videos.map((v) => {
                const done = game.watchedVideos.includes(v.id);
                return (
                  <article key={v.id} className="panel p-0 overflow-hidden hover:border-accent/60 transition-all">
                    <div className="relative h-32 bg-gradient-to-br from-accent/30 via-primary/20 to-background flex items-center justify-center">
                      <Play className="h-12 w-12 text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.7)]" />
                      <span className="absolute bottom-2 right-2 text-[10px] panel px-2 py-0.5">{v.duration}</span>
                      {done && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-success" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-base text-glow-primary">{v.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{v.blurb}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] tracking-[0.25em] uppercase text-accent">+{v.kp} KP</span>
                        <GameButton size="sm" variant={done ? 'ghost' : 'gold'} onClick={() => setOpenVideo(v.id)}>
                          {done ? 'Rewatch' : 'Watch'}
                        </GameButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {tab === 'tutor' && (
            <div className="max-w-2xl mx-auto">
              {/* TODO(plan-3): wire chapter-specific intro once AiTutorChat supports it. */}
              <AiTutorChat />
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                Ask the AI Tutor about {campaign.name} — prompts, workflows, code, or agents.
              </p>
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
                  <Swords className="h-5 w-5" /> Abilities
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SHOP_ABILITIES.map((a) => {
                    const owned = game.ownedAbilities.includes(a.id);
                    const Icon = ICONS[a.icon];
                    const canAfford = game.knowledgePoints >= a.cost;
                    return (
                      <article key={a.id} className="panel p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-accent" />
                          <h4 className="font-display text-base text-glow-primary flex-1">{a.name}</h4>
                          {owned && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                        <div className="text-[10px] text-muted-foreground">
                          {a.damage[0]}–{a.damage[1]} dmg · CD {a.cooldown}
                        </div>
                        <GameButton
                          variant={owned ? 'ghost' : canAfford ? 'primary' : 'ghost'}
                          size="sm"
                          disabled={owned || !canAfford}
                          onClick={() => {
                            if (game.buyAbility(a.id, a.cost)) toast.success(`${a.name} unlocked!`);
                            else toast(`Need ${a.cost - game.knowledgePoints} more KP.`);
                          }}
                          className="mt-1"
                        >
                          {owned ? 'Owned' : canAfford ? `Buy · ${a.cost} KP` : `Locked · ${a.cost} KP`}
                          {!owned && !canAfford && <Lock className="h-3.5 w-3.5" />}
                        </GameButton>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
                  <Sword className="h-5 w-5" /> Knowledge Weapons
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {SHOP_WEAPONS.map((w) => {
                    const owned = game.ownedWeapons.includes(w.id);
                    const equipped = game.equippedWeapon === w.id;
                    const canAfford = game.knowledgePoints >= w.cost;
                    return (
                      <article key={w.id} className={cn('panel p-4 flex flex-col gap-2', equipped && 'border-accent')}>
                        <h4 className="font-display text-base text-glow-primary">{w.name}</h4>
                        <p className="text-xs text-muted-foreground flex-1">{w.description}</p>
                        <div className="text-[10px] text-accent">+{w.bonusDamage} damage</div>
                        {owned ? (
                          <GameButton
                            variant={equipped ? 'gold' : 'ghost'}
                            size="sm"
                            onClick={() => game.equipWeapon(equipped ? null : w.id)}
                          >
                            {equipped ? 'Equipped' : 'Equip'}
                          </GameButton>
                        ) : (
                          <GameButton
                            variant={canAfford ? 'primary' : 'ghost'}
                            size="sm"
                            disabled={!canAfford}
                            onClick={() => {
                              if (game.buyWeapon(w.id, w.cost)) toast.success(`${w.name} forged!`);
                              else toast(`Need ${w.cost - game.knowledgePoints} more KP.`);
                            }}
                          >
                            {canAfford ? `Buy · ${w.cost} KP` : `Locked · ${w.cost} KP`}
                          </GameButton>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Lesson modal */}
        {lesson && (
          <Modal onClose={() => { setOpenLesson(null); setLessonAnswer(null); }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{lesson.emoji}</span>
              <div>
                <h3 className="font-display text-2xl text-glow-primary">{lesson.title}</h3>
                <div className="text-[10px] tracking-[0.3em] uppercase text-accent">+{lesson.kp} KP on completion</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{lesson.intro}</p>
            <div className="mt-4 space-y-2 text-sm">
              {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="mt-5 panel p-4 border-accent/40">
              <div className="text-[10px] tracking-[0.3em] uppercase text-accent mb-2">Quick Check</div>
              <p className="font-display text-base">{lesson.check.q}</p>
              <div className="grid gap-2 mt-3">
                {lesson.check.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setLessonAnswer(i)}
                    className={cn(
                      'panel text-left p-2.5 text-sm hover:border-primary/60',
                      lessonAnswer === i && 'border-primary text-primary'
                    )}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <GameButton variant="ghost" size="sm" onClick={() => { setOpenLesson(null); setLessonAnswer(null); }}>
                Close
              </GameButton>
              <GameButton variant="primary" size="sm" disabled={lessonAnswer === null} onClick={submitLesson}>
                <Check className="h-4 w-4" /> Submit
              </GameButton>
            </div>
          </Modal>
        )}

        {/* Video modal */}
        {video && (
          <Modal onClose={() => setOpenVideo(null)}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-glow-primary">{video.title}</h3>
              <span className="text-[10px] panel px-2 py-1">{video.duration}</span>
            </div>
            <div className="mt-4 aspect-video bg-gradient-to-br from-accent/30 via-primary/20 to-background rounded-lg flex flex-col items-center justify-center p-6">
              <Play className="h-14 w-14 text-accent mb-3" />
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Mock playback</p>
              <ul className="text-sm text-center space-y-1 max-w-md">
                {video.captions.map((c, i) => <li key={i}>› {c}</li>)}
              </ul>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <GameButton variant="ghost" size="sm" onClick={() => setOpenVideo(null)}>Close</GameButton>
              <GameButton variant="gold" size="sm" onClick={claimVideo}>
                <Check className="h-4 w-4" /> Done watching · +{video.kp} KP
              </GameButton>
            </div>
          </Modal>
        )}
      </main>
    </Scene>
  );
}
