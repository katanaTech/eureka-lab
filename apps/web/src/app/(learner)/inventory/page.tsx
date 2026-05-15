'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Sword, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { SHOP_ABILITIES, SHOP_WEAPONS } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';

const worldBg = '/assets/game/world-map.jpg';

/**
 * Inventory page — shows KP balance summary, owned abilities, and owned
 * weapons with equip toggles. Backed by `useGame()` adapter so all state
 * mutations route through real backend calls (Plan 1 R3 fix).
 */
export default function InventoryPage() {
  const router = useRouter();
  const {
    character,
    knowledgePoints,
    totalKnowledgeEarned,
    ownedAbilities,
    ownedWeapons,
    equippedWeapon,
    equipWeapon,
  } = useGame();

  if (!character) return null;

  const ownedAbilityCatalog = SHOP_ABILITIES.filter((a) => ownedAbilities.includes(a.id));
  const ownedWeaponCatalog = SHOP_WEAPONS.filter((w) => ownedWeapons.includes(w.id));

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
          <p className="text-xs tracking-[0.5em] text-primary/80">INVENTORY</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            <Package className="inline h-8 w-8 mb-2" /> Hero&apos;s Vault
          </h1>
        </section>

        {/* KP summary */}
        <section className="max-w-5xl mx-auto mt-8 grid sm:grid-cols-2 gap-3">
          <div className="panel p-5 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Spendable KP</div>
            <div className="font-display text-4xl text-glow-primary mt-1">{knowledgePoints}</div>
          </div>
          <div className="panel p-5 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Lifetime KP earned</div>
            <div className="font-display text-4xl text-glow-gold mt-1">{totalKnowledgeEarned}</div>
          </div>
        </section>

        {/* Owned abilities */}
        <section className="max-w-5xl mx-auto mt-8">
          <h2 className="font-display text-xl text-glow-primary flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5" /> Abilities
          </h2>
          {ownedAbilityCatalog.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-muted-foreground">
              No abilities yet. Visit the Forge to buy your first.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ownedAbilityCatalog.map((a) => (
                <article key={a.id} className="panel p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    <h3 className="font-display text-base text-glow-primary flex-1">{a.name}</h3>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {a.damage[0]}–{a.damage[1]} dmg · CD {a.cooldown}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Owned weapons */}
        <section className="max-w-5xl mx-auto mt-8 pb-12">
          <h2 className="font-display text-xl text-glow-primary flex items-center gap-2 mb-3">
            <Sword className="h-5 w-5" /> Knowledge Weapons
          </h2>
          {ownedWeaponCatalog.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-muted-foreground">
              No weapons yet. Visit the Bazaar to forge your first.
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {ownedWeaponCatalog.map((w) => {
                const equipped = equippedWeapon === w.id;
                return (
                  <article key={w.id} className={cn('panel p-4 flex flex-col gap-2', equipped && 'border-accent')}>
                    <h3 className="font-display text-base text-glow-primary">{w.name}</h3>
                    <p className="text-xs text-muted-foreground flex-1">{w.description}</p>
                    <div className="text-[10px] text-accent">+{w.bonusDamage} damage</div>
                    <GameButton
                      variant={equipped ? 'gold' : 'ghost'}
                      size="sm"
                      onClick={() => equipWeapon(equipped ? null : w.id)}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </GameButton>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </Scene>
  );
}
