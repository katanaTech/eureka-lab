'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Sword, ShoppingBag, Brain, Sparkles, Shield, Zap, CheckCircle2, Lock, Swords } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';
import { KpBadge } from '@/components/game/KpBadge';
import { SHOP_ABILITIES, SHOP_WEAPONS } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';

const worldBg = '/assets/game/world-map.jpg';

const ICONS = { sword: Swords, spark: Sparkles, brain: Brain, shield: Shield, zap: Zap } as const;

/**
 * Global Bazaar — standalone shop page. Same catalog and same buy/equip
 * flow as the Forge tab inside PrepareForMission, just without the
 * Lessons/Videos/AI-Tutor neighbours.
 */
export default function ShopPage() {
  const router = useRouter();
  const game = useGame();

  if (!game.character) return null;

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Realm Map
            </button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto mt-8 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-accent">GLOBAL BAZAAR</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            <ShoppingBag className="inline h-8 w-8 mb-2" /> The Forge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm">
            Spend Knowledge Points to unlock new abilities and weapons. Stronger gear means harder
            zombies fall faster.
          </p>
        </section>

        {/* Abilities */}
        <section className="max-w-5xl mx-auto mt-8">
          <h2 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
            <Swords className="h-5 w-5" /> Abilities
          </h2>
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
        </section>

        {/* Weapons */}
        <section className="max-w-5xl mx-auto mt-8 pb-12">
          <h2 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
            <Sword className="h-5 w-5" /> Knowledge Weapons
          </h2>
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
        </section>
      </main>
    </Scene>
  );
}
