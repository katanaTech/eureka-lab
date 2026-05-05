'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { type ShopCatalog } from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';
import { MobileAbilityCard, MobileWeaponCard } from './mobile-shop-cards';

/**
 * Mobile global shop page — displays full ability and weapon catalog.
 * Compact layout mirroring desktop /g/shop with /m/g/ navigation.
 *
 * @returns The mobile global shop screen
 */
export default function MobileGlobalShopPage() {
  const t = useTranslations('Phase16ShopGlobal');
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const { kp, ownedAbilityIds, ownedWeaponIds, equippedWeaponId, spendKp, addAbility, addWeapon, equipWeapon, setInventory } = useInventoryStore();

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/v1/shop/catalog')
      .then(async (res) => { if (!res.ok) throw new Error(); return res.json() as Promise<ShopCatalog>; })
      .then((data) => setCatalog(data))
      .catch(() => toast.error(t('loadFailed')))
      .finally(() => setIsLoading(false));
  }, [t]);

  /** @param itemId - Item to buy @param itemType - ability or weapon @param cost - KP cost */
  const handleBuy = useCallback(async (itemId: string, itemType: 'ability' | 'weapon', cost: number) => {
    if (kp < cost) { toast.error(t('notEnoughKp')); return; }
    setBuyingId(itemId);
    spendKp(cost);
    if (itemType === 'ability') addAbility(itemId); else addWeapon(itemId);
    try {
      const res = await fetch('/api/v1/inventory/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, itemType }) });
      if (!res.ok) throw new Error();
      setInventory(await res.json());
      toast.success(t('purchased'));
    } catch {
      toast.error(t('purchaseFailed'));
      fetch('/api/v1/inventory').then((r) => r.json()).then((inv) => setInventory(inv)).catch(() => null);
    } finally { setBuyingId(null); }
  }, [kp, spendKp, addAbility, addWeapon, setInventory, t]);

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
      fetch('/api/v1/inventory').then((r) => r.json()).then((inv) => setInventory(inv)).catch(() => null);
    } finally { setEquippingId(null); }
  }, [equipWeapon, setInventory, t]);

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
        <ShoppingBag className="mx-auto h-6 w-6 text-accent mb-1" aria-hidden />
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">{t('heading')}</h1>
        <p className="mt-1 text-xs text-muted-foreground tracking-wider">{t('subheading')}</p>
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label={t('loadingAria')} />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <section aria-labelledby="abilities-heading">
            <h2 id="abilities-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('abilitiesHeading', { count: catalog?.abilities.length ?? 0 })}
            </h2>
            <div className="flex flex-col gap-3">
              {(catalog?.abilities ?? []).map((ability) => (
                <MobileAbilityCard key={ability.id} ability={ability}
                  owned={ownedAbilityIds.includes(ability.id)} canAfford={kp >= ability.cost}
                  isBuying={buyingId === ability.id} onBuy={() => handleBuy(ability.id, 'ability', ability.cost)}
                  kpCost={t('kpCost', { cost: ability.cost })} ownedLabel={t('ownedBadge')}
                  buyLabel={t('buy')} buyingLabel={t('buying')}
                  damageLabel={t('abilityDamage', { min: ability.damage[0], max: ability.damage[1] })}
                  cooldownLabel={t('abilityCooldown', { cooldown: ability.cooldown })} />
              ))}
            </div>
          </section>

          <section aria-labelledby="weapons-heading">
            <h2 id="weapons-heading" className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('weaponsHeading', { count: catalog?.weapons.length ?? 0 })}
            </h2>
            <div className="flex flex-col gap-3">
              {(catalog?.weapons ?? []).map((weapon) => (
                <MobileWeaponCard key={weapon.id} weapon={weapon}
                  owned={ownedWeaponIds.includes(weapon.id)} equipped={equippedWeaponId === weapon.id}
                  canAfford={kp >= weapon.cost} isBuying={buyingId === weapon.id}
                  isEquipping={equippingId === weapon.id}
                  onBuy={() => handleBuy(weapon.id, 'weapon', weapon.cost)}
                  onEquip={() => handleEquip(weapon.id)} onUnequip={() => handleEquip(null)}
                  kpCost={t('kpCost', { cost: weapon.cost })} equippedBadge={t('equippedBadge')}
                  bonusLabel={t('weaponBonus', { bonus: weapon.bonusDamage })}
                  buyLabel={t('buy')} buyingLabel={t('buying')}
                  equipLabel={t('equip')} equippingLabel={t('equipping')}
                  unequipLabel={t('unequip')} unequippingLabel={t('unequipping')} />
              ))}
            </div>
          </section>
        </div>
      )}
    </Scene>
  );
}
