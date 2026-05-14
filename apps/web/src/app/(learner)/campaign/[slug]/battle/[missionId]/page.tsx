'use client';

import { useEffect, useMemo, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Wand2, Sparkles, ShieldAlert, Shield, Swords, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CAMPAIGNS, CLASSES } from '@/data/game';
import { pickQuestion, type QuizQuestion } from '@/data/quiz';
import {
  ENEMY_STRENGTH, getKnowledgeAdvantage,
  SHOP_ABILITIES, SHOP_WEAPONS,
} from '@/data/academy';
import { useGame } from '@/state/game-context';
import { BASE_ABILITIES, type Ability, type LogEntry, rand } from './_battle-config';
import { HpBar, BattleStage } from './_battle-stage';
import { BattleQuiz } from './_battle-quiz';
import { BattleOutcome } from './_battle-outcome';

/**
 * Turn-based 2D battle screen. Direct port of ai-adventure-island's Battle.tsx,
 * split across 4 sibling files per CLAUDE.md rule #8. All combat state is local
 * React useState — combat-store stays salvaged for the future 3D phase but is
 * not wired here.
 *
 * Reward on victory: optimistic-local mission.xp credit via useGame().addKnowledge.
 * Backend hybrid validation (POST /combat/:battleId/complete with play log) is
 * an explicit Plan 3 deliverable (spec §5.6, task P3-07).
 */
export default function BattlePage({
  params,
}: { params: Promise<{ slug: string; missionId: string }> }) {
  const { slug, missionId } = use(params);
  const router = useRouter();
  const { character, totalKnowledgeEarned, ownedAbilities, equippedWeapon, addKnowledge } = useGame();

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);
  const mission = campaign?.missions.find((m) => m.id === missionId);
  const klass = character ? CLASSES.find((c) => c.id === character.class) : undefined;
  const isBoss = mission?.difficulty === 'elite';

  // Knowledge soft-buff
  const enemyStrength = mission ? (ENEMY_STRENGTH[mission.id] ?? 100) : 100;
  const adv = useMemo(
    () => getKnowledgeAdvantage(totalKnowledgeEarned, enemyStrength),
    [totalKnowledgeEarned, enemyStrength]
  );
  const weaponBonus = useMemo(() => {
    const w = SHOP_WEAPONS.find((x) => x.id === equippedWeapon);
    return w?.bonusDamage ?? 0;
  }, [equippedWeapon]);

  // Stats
  const heroMax = 100;
  const enemyMax = isBoss
    ? 220
    : mission?.difficulty === 'hard'
      ? 150
      : mission?.difficulty === 'medium'
        ? 110
        : 80;

  const [heroHp, setHeroHp] = useState(heroMax);
  const [enemyHp, setEnemyHp] = useState(enemyMax);
  const [turn, setTurn] = useState<'hero' | 'enemy'>('hero');
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [log, setLog] = useState<LogEntry[]>([
    { id: 0, text: `A ${isBoss ? 'BOSS' : 'wild'} ${isBoss ? campaign?.bossName ?? 'boss' : 'Babble Zombie'} blocks the path!`, tone: 'system' },
  ]);
  const [heroAnim, setHeroAnim] = useState<string>('');
  const [enemyAnim, setEnemyAnim] = useState<string>('');
  const [enemyDmg, setEnemyDmg] = useState<{ id: number; v: number; crit: boolean } | null>(null);
  const [heroDmg, setHeroDmg] = useState<{ id: number; v: number } | null>(null);
  const [showSlash, setShowSlash] = useState(false);

  const [sparkCharges, setSparkCharges] = useState(0);
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [seenQuiz] = useState(() => new Set<string>());
  const [picked, setPicked] = useState<number | null>(null);

  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null);
  const logCounter = useRef(1);
  const rewardedRef = useRef(false);

  function pushLog(text: string, tone: LogEntry['tone'] = 'system') {
    setLog((l) => [...l.slice(-5), { id: logCounter.current++, text, tone }]);
  }

  // Enemy turn
  useEffect(() => {
    if (turn !== 'enemy' || outcome) return;
    const t = setTimeout(() => {
      const dmg = rand(8, isBoss ? 22 : 14);
      const crit = Math.random() < 0.15;
      const final = crit ? Math.round(dmg * 1.6) : dmg;
      setHeroAnim('animate-shake');
      setHeroDmg({ id: Date.now(), v: final });
      setHeroHp((hp) => Math.max(0, hp - final));
      pushLog(`${isBoss ? campaign?.bossName ?? 'Boss' : 'Zombie'} bites for ${final}${crit ? ' CRIT!' : ''}`, 'enemy');
      setTimeout(() => {
        setHeroAnim('');
        setCooldowns((c) => {
          const next: Record<string, number> = {};
          for (const k of Object.keys(c)) if (c[k]! > 1) next[k] = c[k]! - 1;
          return next;
        });
        setTurn('hero');
      }, 500);
    }, 700);
    return () => clearTimeout(t);
  }, [turn, outcome, isBoss, campaign?.bossName]);

  // Outcome detection
  useEffect(() => {
    if (outcome) return;
    if (enemyHp <= 0) {
      setOutcome('win');
      pushLog(`Victory! +${mission?.xp ?? 0} XP earned.`, 'crit');
      if (mission && !rewardedRef.current) {
        rewardedRef.current = true;
        // Optimistic-local KP credit. Backend hybrid validation is Plan 3 (P3-07).
        // TODO(plan-3): POST /api/v1/combat/:battleId/complete with the play log
        //               for server-side validation (spec §5.6).
        addKnowledge(mission.xp);
      }
    } else if (heroHp <= 0) {
      setOutcome('lose');
      pushLog('You were knocked down. Try again, hero!', 'enemy');
    }
  }, [enemyHp, heroHp, outcome, mission, addKnowledge]);

  function useAbility(ability: Ability) {
    if (turn !== 'hero' || outcome) return;
    if ((cooldowns[ability.id] ?? 0) > 0) return;
    if (ability.special) {
      if (sparkCharges <= 0) {
        toast('Answer an AI Riddle to charge Spark Strike!');
        return;
      }
      setSparkCharges((s) => s - 1);
    }

    const base = rand(ability.damage[0], ability.damage[1]);
    const critChance = 0.18 + adv.critBonus;
    const crit = Math.random() < critChance;
    const raw = crit ? Math.round(base * 1.7) : base;
    const dmg = Math.max(1, Math.round(raw * adv.multiplier) + weaponBonus);

    setShowSlash(true);
    setEnemyAnim('animate-hit-flash animate-shake');
    setEnemyDmg({ id: Date.now(), v: dmg, crit });
    setEnemyHp((hp) => Math.max(0, hp - dmg));

    if (ability.id === 'focus') setHeroHp((hp) => Math.min(heroMax, hp + 8));

    pushLog(
      `${character?.name ?? 'Hero'} uses ${ability.name} → ${dmg}${crit ? ' CRIT!' : ''}`,
      crit ? 'crit' : 'player'
    );

    if (ability.cooldown > 0) {
      setCooldowns((c) => ({ ...c, [ability.id]: ability.cooldown + 1 }));
    }

    setTimeout(() => {
      setShowSlash(false);
      setEnemyAnim('');
      setTurn('enemy');
    }, 550);
  }

  function openQuiz() {
    if (turn !== 'hero' || outcome) return;
    const q = pickQuestion(seenQuiz);
    setPicked(null);
    setQuiz(q);
  }

  function answerQuiz(idx: number) {
    if (!quiz || picked !== null) return;
    setPicked(idx);
    const correct = idx === quiz.correct;
    seenQuiz.add(quiz.q);
    setTimeout(() => {
      if (correct) {
        setSparkCharges((s) => s + 1);
        pushLog('AI Riddle solved! Spark Strike charged ✦', 'crit');
      } else {
        pushLog('Wrong answer — the zombie shrugs it off.', 'enemy');
      }
      setQuiz(null);
      setPicked(null);
      // Costs your turn either way.
      setTurn('enemy');
    }, 1100);
  }

  const heroPct = (heroHp / heroMax) * 100;
  const enemyPct = (enemyHp / enemyMax) * 100;

  const abilities = useMemo<Ability[]>(() => {
    const iconMap = { sword: Swords, spark: Sparkles, brain: Brain, shield: Shield, zap: Zap } as const;
    const variantFor = (i: number): Ability['variant'] =>
      (['primary', 'gold', 'ghost', 'danger'] as const)[i % 4]!;
    const owned: Ability[] = SHOP_ABILITIES
      .filter((a) => ownedAbilities.includes(a.id))
      .map((a, i) => ({
        id: a.id,
        name: a.name,
        icon: iconMap[a.icon],
        damage: a.damage,
        cooldown: a.cooldown,
        variant: variantFor(i + 1),
        description: a.description,
      }));
    return [...BASE_ABILITIES, ...owned];
  }, [ownedAbilities]);

  // Guards AFTER all hooks so React's rules-of-hooks holds.
  if (!character) return null;
  if (!campaign || !mission || !klass) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <Scene background={campaign.image}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8 flex flex-col">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3 flex-wrap">
            <KpBadge />
            <div className={cn(
              'panel px-3 py-1.5 flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase',
              adv.label === 'underleveled' && 'border-destructive/60 text-destructive',
              adv.label === 'matched' && 'border-accent/60 text-accent',
              (adv.label === 'ready' || adv.label === 'overpowered') && 'border-success/60 text-success',
            )}>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Foe Strength {enemyStrength} · {adv.label}</span>
            </div>
            <button
              onClick={() => router.push(`/campaign/${campaign.slug}`)}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Retreat
            </button>
          </div>
        </header>

        {/* HP bars row */}
        <section className="max-w-6xl w-full mx-auto mt-6 grid grid-cols-2 gap-4">
          <HpBar
            name={character.name}
            sub={`${klass.title} · LV 3`}
            hp={heroHp}
            max={heroMax}
            pct={heroPct}
            color={character.color}
            tone="hero"
          />
          <HpBar
            name={isBoss ? campaign.bossName : 'Babble Zombie'}
            sub={isBoss ? 'BOSS' : mission.title}
            hp={enemyHp}
            max={enemyMax}
            pct={enemyPct}
            tone="enemy"
            isBoss={isBoss}
          />
        </section>

        <BattleStage
          heroImage={klass.image}
          heroName={character.name}
          heroColor={character.color}
          heroAnim={heroAnim}
          heroDmg={heroDmg}
          enemyAnim={enemyAnim}
          enemyDmg={enemyDmg}
          showSlash={showSlash}
          isBoss={!!isBoss}
          turn={turn}
          outcome={outcome}
        />

        {/* Bottom HUD */}
        <section className="max-w-6xl w-full mx-auto mt-6 grid lg:grid-cols-[1fr_320px] gap-4">
          {/* Abilities */}
          <div className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-glow-primary flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Abilities
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Spark Charges: <span className="text-accent font-display">{sparkCharges}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {abilities.map((a) => {
                const cd = cooldowns[a.id] ?? 0;
                const locked = a.special && sparkCharges <= 0;
                const disabled = turn !== 'hero' || !!outcome || cd > 0 || locked;
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => useAbility(a)}
                    disabled={disabled}
                    className={cn(
                      'relative panel p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60',
                      disabled && 'opacity-60 cursor-not-allowed hover:translate-y-0',
                      a.special && !locked && 'border-accent/60 shadow-[0_0_20px_hsl(var(--accent)/0.4)]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', a.special ? 'text-accent' : 'text-primary')} />
                      <span className="font-display text-sm">{a.name}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{a.description}</div>
                    <div className="text-[10px] mt-2 flex items-center justify-between">
                      <span className="text-primary/80">{a.damage[0]}–{a.damage[1]} dmg</span>
                      {cd > 0 ? (
                        <span className="text-destructive">CD {cd}</span>
                      ) : a.cooldown > 0 ? (
                        <span className="text-muted-foreground">CD {a.cooldown}</span>
                      ) : a.special ? (
                        <span className="text-accent">Special</span>
                      ) : (
                        <span className="text-success">Ready</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <GameButton
                variant="ghost"
                size="sm"
                onClick={openQuiz}
                disabled={turn !== 'hero' || !!outcome}
                className="flex-1"
              >
                <Brain className="h-4 w-4" /> Solve AI Riddle (charges Spark)
              </GameButton>
              <GameButton
                variant="danger"
                size="sm"
                onClick={() => router.push(`/campaign/${campaign.slug}`)}
                className="sm:w-40"
              >
                Flee
              </GameButton>
            </div>
          </div>

          {/* Battle log */}
          <div className="panel p-4 sm:p-5">
            <h3 className="font-display text-lg text-glow-primary mb-2">Battle Log</h3>
            <ul className="space-y-1.5 text-xs">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    'leading-snug',
                    entry.tone === 'player' && 'text-primary',
                    entry.tone === 'enemy' && 'text-destructive',
                    entry.tone === 'crit' && 'text-accent text-glow-gold',
                    entry.tone === 'system' && 'text-muted-foreground'
                  )}
                >
                  › {entry.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {quiz && <BattleQuiz quiz={quiz} picked={picked} onPick={answerQuiz} />}

        {outcome && (
          <BattleOutcome
            outcome={outcome}
            isBoss={!!isBoss}
            bossName={campaign.bossName}
            missionXp={mission.xp}
            onMissionList={() => router.push(`/campaign/${campaign.slug}`)}
            onContinue={() => window.location.reload()}
          />
        )}
      </main>
    </Scene>
  );
}
