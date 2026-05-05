'use client';

/**
 * Mobile inventory page — compact fantasy-themed view of owned items.
 * Mirrors desktop /g/inventory with /m/g/ navigation links.
 *
 * @returns The mobile inventory management screen
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sword, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ShopAbility,
  type ShopWeapon,
  type ShopCatalog,
  type Inventory,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';
import { MobileInventoryAbilityCard, MobileInventoryWeaponCard } from './mobile-inventory-cards';

export default function MobileInventoryPage() {
  const t = useTranslations('Phase16Inventory');
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const { kp, totalKpEarned, ownedAbilityIds, ownedWeaponIds, equippedWeaponId, equipWeapon, setInventory } = useInventoryStore();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/inventory').then(async (res) => { if (!res.ok) throw new Error(); return res.json() as Promise<Inventory>; }),
      fetch('/api/v1/shop/catalog').then(async (res) => { if (!res.ok) throw new Error(); return res.json() as Promise<ShopCatalog>; }),
    ])
      .then(([inv, cat]) => { setInventory(inv); setCatalog(cat); })
      .catch(() => toast.error(t('loadFailed')))
      .finally(() => setIsLoading(false));
  }, [setInventory, t]);

  /** @param weaponId - Weapon to equip or null to unequip */
  const handleEquip = useCallback(async (weaponId: string | null) => {
    setEquippingId(weaponId ?? 'unequip');
    equipWeapon(weaponId);
    try {
      const res = await fetch('/api/v1/inventory/equip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weaponId }) });
      if (!res.ok) throw new Error();
      setInventory(await res.json());
      toast.success(weaponId ? t('equipped') : t('unequipped'));
    } catch {
      toast.error(t('equipFailed'));
      fetch('/api/v1/inventory').then((r) => r.json()).then((inv: Inventory) => setInventory(inv)).catch(() => null);
    } finally { setEquippingId(null); }
  }, [equipWeapon, setInventory, t]);

  const ownedAbilities: ShopAbility[] = (catalog?.abilities ?? []).filter((a) => ownedAbilityIds.includes(a.id));
  const ownedWeapons: ShopWeapon[] = (catalog?.weapons ?? []).filter((w) => ownedWeaponIds.includes(w.id));
  const equippedWeapon = ownedWeapons.find((w) => w.id === equippedWeaponId) ?? null;

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <Link href="/m/g/dashboard">
            <GameButton variant="ghost" size="sm">{t('backDashboard')}</GameButton>
          </Link>
        </div>
      </header>

      <div className="mt-6 text-center">
        <Package className="mx-auto h-6 w-6 text-accent mb-1" aria-hidden />
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">{t('heading')}</h1>
        <p className="mt-1 text-xs text-muted-foreground tracking-wider">{t('subheading')}</p>
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label={t('loadingAria')} />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* KP Balance */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('kpHeading')}</p>
                <p className="mt-0.5 font-display text-2xl text-glow-gold">
                  {kp} <span className="text-xs text-muted-foreground">{t('kpUnit')}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{t('kpLifetime')}</p>
                <p className="font-display text-base text-accent/80">{totalKpEarned}</p>
              </div>
            </div>
          </div>

          {/* Equipped weapon */}
          <section aria-labelledby="equipped-heading">
            <h2 id="equipped-heading" className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('equippedHeading')}
            </h2>
            {equippedWeapon ? (
              <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <Sword className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="font-display text-xs uppercase tracking-wider text-foreground">{equippedWeapon.name}</p>
                    <span className="text-[9px] rounded border border-primary/30 px-1 py-0.5 text-primary/80">
                      {t('weaponBonus', { bonus: equippedWeapon.bonusDamage })}
                    </span>
                  </div>
                </div>
                <GameButton variant="ghost" size="sm" onClick={() => handleEquip(null)} disabled={equippingId !== null}>
                  {equippingId === 'unequip' ? t('unequipping') : t('unequip')}
                </GameButton>
              </div>
            ) : (
              <div className="rounded-lg border border-primary/10 bg-card/40 p-3 text-xs text-muted-foreground/60 italic">
                {t('noEquipped')}
              </div>
            )}
          </section>

          {/* Owned abilities */}
          <section aria-labelledby="abilities-heading">
            <h2 id="abilities-heading" className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('abilitiesHeading', { count: ownedAbilities.length })}
            </h2>
            {ownedAbilities.length === 0 ? (
              <div className="rounded-lg border border-primary/10 bg-card/40 p-3 text-xs text-muted-foreground/60 italic">
                {t('noAbilities')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ownedAbilities.map((ability) => (
                  <MobileInventoryAbilityCard key={ability.id} ability={ability}
                    damageLabel={t('abilityDamage', { min: ability.damage[0], max: ability.damage[1] })}
                    cooldownLabel={t('abilityCooldown', { cooldown: ability.cooldown })} />
                ))}
              </div>
            )}
          </section>

          {/* Owned weapons */}
          <section aria-labelledby="weapons-heading">
            <h2 id="weapons-heading" className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('weaponsHeading', { count: ownedWeapons.length })}
            </h2>
            {ownedWeapons.length === 0 ? (
              <div className="rounded-lg border border-primary/10 bg-card/40 p-3 text-xs text-muted-foreground/60 italic">
                {t('noWeapons')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ownedWeapons.map((weapon) => (
                  <MobileInventoryWeaponCard key={weapon.id} weapon={weapon}
                    equipped={equippedWeaponId === weapon.id} isEquipping={equippingId === weapon.id}
                    onEquip={() => handleEquip(weapon.id)} onUnequip={() => handleEquip(null)}
                    equippedBadge={t('equippedBadge')} bonusLabel={t('weaponBonus', { bonus: weapon.bonusDamage })}
                    equipLabel={t('equip')} equippingLabel={t('equipping')}
                    unequipLabel={t('unequip')} unequippingLabel={t('unequipping')} />
                ))}
              </div>
            )}
          </section>

          {/* Shop link */}
          <div className="flex justify-center pt-1">
            <Link href="/m/g/shop">
              <GameButton variant="ghost" size="sm">{t('visitBazaar')}</GameButton>
            </Link>
          </div>
        </div>
      )}
    </Scene>
  );
}
