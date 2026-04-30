'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sword, Brain, Zap, Shield, Sparkles, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ShopAbility,
  type ShopWeapon,
  type ShopCatalog,
  type ShopAbilityIcon,
  type Inventory,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';
import { useState } from 'react';

// ── Icon map ─────────────────────────────────────────────────────────────────

/** Maps a ShopAbilityIcon to its Lucide component. */
const ABILITY_ICON_MAP: Record<ShopAbilityIcon, React.ReactNode> = {
  sword: <Sword className="h-5 w-5" aria-hidden />,
  spark: <Sparkles className="h-5 w-5" aria-hidden />,
  brain: <Brain className="h-5 w-5" aria-hidden />,
  shield: <Shield className="h-5 w-5" aria-hidden />,
  zap: <Zap className="h-5 w-5" aria-hidden />,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Inventory page — fantasy-themed view of the player's owned abilities and weapons.
 * Fetches current inventory from the API on mount and hydrates the inventory store.
 * Shows KP balance, equipped weapon, owned abilities, and owned weapons with equip controls.
 *
 * @returns The inventory management screen
 */
export default function InventoryPage() {
  const t = useTranslations('Phase16Inventory');
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const {
    kp,
    totalKpEarned,
    ownedAbilityIds,
    ownedWeaponIds,
    equippedWeaponId,
    equipWeapon,
    setInventory,
  } = useInventoryStore();

  /** Fetch inventory and catalog on mount to hydrate store and resolve item details. */
  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      fetch('/api/v1/inventory').then(async (res) => {
        if (!res.ok) throw new Error(`Inventory fetch failed: ${res.status}`);
        return res.json() as Promise<Inventory>;
      }),
      fetch('/api/v1/shop/catalog').then(async (res) => {
        if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
        return res.json() as Promise<ShopCatalog>;
      }),
    ])
      .then(([inv, cat]) => {
        setInventory(inv);
        setCatalog(cat);
      })
      .catch(() => toast.error(t('loadFailed')))
      .finally(() => setIsLoading(false));
  }, [setInventory, t]);

  /**
   * Equip or unequip a weapon via the API.
   *
   * @param weaponId - The weapon to equip, or null to unequip
   */
  const handleEquip = useCallback(
    async (weaponId: string | null) => {
      setEquippingId(weaponId ?? 'unequip');
      equipWeapon(weaponId);

      try {
        const res = await fetch('/api/v1/inventory/equip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weaponId }),
        });

        if (!res.ok) throw new Error(`Equip failed: ${res.status}`);

        const updatedInventory = await res.json();
        setInventory(updatedInventory);
        toast.success(weaponId ? t('equipped') : t('unequipped'));
      } catch {
        toast.error(t('equipFailed'));
        fetch('/api/v1/inventory')
          .then((r) => r.json())
          .then((inv: Inventory) => setInventory(inv))
          .catch(() => null);
      } finally {
        setEquippingId(null);
      }
    },
    [equipWeapon, setInventory, t]
  );

  // Resolve item details from catalog
  const ownedAbilities: ShopAbility[] = (catalog?.abilities ?? []).filter((a) =>
    ownedAbilityIds.includes(a.id)
  );
  const ownedWeapons: ShopWeapon[] = (catalog?.weapons ?? []).filter((w) =>
    ownedWeaponIds.includes(w.id)
  );
  const equippedWeapon = ownedWeapons.find((w) => w.id === equippedWeaponId) ?? null;

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Top HUD */}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <Link href="/g/dashboard">
            <GameButton variant="ghost" size="sm">
              {t('backDashboard')}
            </GameButton>
          </Link>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <div className="mb-2 flex justify-center">
          <Package className="h-8 w-8 text-accent" aria-hidden />
        </div>
        <h1 className="font-display text-4xl uppercase tracking-widest text-glow-primary">
          {t('heading')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-wider">
          {t('subheading')}
        </p>
      </div>

      {isLoading ? (
        <div className="mx-auto mt-16 flex max-w-3xl justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
            role="status"
            aria-label={t('loadingAria')}
          />
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl space-y-8">
          {/* KP Balance panel */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('kpHeading')}
                </p>
                <p className="mt-1 font-display text-3xl text-glow-gold">
                  {kp} <span className="text-sm text-muted-foreground">{t('kpUnit')}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  {t('kpLifetime')}
                </p>
                <p className="font-display text-lg text-accent/80">{totalKpEarned}</p>
              </div>
            </div>
          </div>

          {/* Equipped weapon panel */}
          <section aria-labelledby="equipped-heading">
            <h2
              id="equipped-heading"
              className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground"
            >
              {t('equippedHeading')}
            </h2>
            {equippedWeapon ? (
              <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <Sword className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-display text-sm uppercase tracking-wider text-foreground">
                      {equippedWeapon.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{equippedWeapon.description}</p>
                    <span className="mt-1 inline-block rounded border border-primary/30 px-1.5 py-0.5 text-[10px] text-primary/80">
                      {t('weaponBonus', { bonus: equippedWeapon.bonusDamage })}
                    </span>
                  </div>
                </div>
                <GameButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEquip(null)}
                  disabled={equippingId !== null}
                  aria-label={t('unequipAria', { name: equippedWeapon.name })}
                >
                  {equippingId === 'unequip' ? t('unequipping') : t('unequip')}
                </GameButton>
              </div>
            ) : (
              <div className="rounded-xl border border-primary/10 bg-card/40 p-4 text-sm text-muted-foreground/60 italic">
                {t('noEquipped')}
              </div>
            )}
          </section>

          {/* Owned abilities */}
          <section aria-labelledby="abilities-heading">
            <h2
              id="abilities-heading"
              className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground"
            >
              {t('abilitiesHeading', { count: ownedAbilities.length })}
            </h2>
            {ownedAbilities.length === 0 ? (
              <div className="rounded-xl border border-primary/10 bg-card/40 p-4 text-sm text-muted-foreground/60 italic">
                {t('noAbilities')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ownedAbilities.map((ability) => (
                  <div
                    key={ability.id}
                    className="flex items-start gap-3 rounded-xl border border-primary/20 bg-card/60 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      {ABILITY_ICON_MAP[ability.icon]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm uppercase tracking-wider text-foreground">
                        {ability.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ability.description}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="rounded border border-primary/30 px-1.5 py-0.5 text-primary/80">
                          {t('abilityDamage', { min: ability.damage[0], max: ability.damage[1] })}
                        </span>
                        {ability.cooldown > 0 && (
                          <span className="rounded border border-muted-foreground/30 px-1.5 py-0.5 text-muted-foreground">
                            {t('abilityCooldown', { cooldown: ability.cooldown })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Owned weapons */}
          <section aria-labelledby="weapons-heading">
            <h2
              id="weapons-heading"
              className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground"
            >
              {t('weaponsHeading', { count: ownedWeapons.length })}
            </h2>
            {ownedWeapons.length === 0 ? (
              <div className="rounded-xl border border-primary/10 bg-card/40 p-4 text-sm text-muted-foreground/60 italic">
                {t('noWeapons')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ownedWeapons.map((weapon) => {
                  const isEquipped = equippedWeaponId === weapon.id;
                  const isThisEquipping = equippingId === weapon.id;
                  return (
                    <div
                      key={weapon.id}
                      className={[
                        'flex items-start gap-3 rounded-xl border p-3 transition-all',
                        isEquipped
                          ? 'border-accent/50 bg-accent/5'
                          : 'border-primary/20 bg-card/60',
                      ].join(' ')}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <Sword className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm uppercase tracking-wider text-foreground">
                            {weapon.name}
                          </p>
                          {isEquipped && (
                            <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent tracking-wider">
                              {t('equippedBadge')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {weapon.description}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="rounded border border-primary/30 px-1.5 py-0.5 text-[10px] text-primary/80">
                            {t('weaponBonus', { bonus: weapon.bonusDamage })}
                          </span>
                          {isEquipped ? (
                            <GameButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEquip(null)}
                              disabled={equippingId !== null}
                              aria-label={t('unequipAria', { name: weapon.name })}
                            >
                              {equippingId === 'unequip' ? t('unequipping') : t('unequip')}
                            </GameButton>
                          ) : (
                            <GameButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleEquip(weapon.id)}
                              disabled={equippingId !== null}
                              aria-label={t('equipAria', { name: weapon.name })}
                            >
                              {isThisEquipping ? t('equipping') : t('equip')}
                            </GameButton>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Shop link */}
          <div className="flex justify-center pt-2">
            <Link href="/g/shop">
              <GameButton variant="ghost" size="md">
                {t('visitBazaar')}
              </GameButton>
            </Link>
          </div>
        </div>
      )}
    </Scene>
  );
}
