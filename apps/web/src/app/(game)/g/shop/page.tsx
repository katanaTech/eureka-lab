'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sword, Zap, Brain, Shield, Sparkles, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ShopAbility,
  type ShopWeapon,
  type ShopCatalog,
  type ShopAbilityIcon,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';

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
 * Global shop page — displays the full ability and weapon catalog.
 * No zone filter applied; all items are shown.
 * Handles buy and equip interactions via the inventory API.
 *
 * @returns The global shop screen
 */
export default function GlobalShopPage() {
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const {
    kp,
    ownedAbilityIds,
    ownedWeaponIds,
    equippedWeaponId,
    spendKp,
    addAbility,
    addWeapon,
    equipWeapon,
    setInventory,
  } = useInventoryStore();

  /** Fetch shop catalog on mount. */
  useEffect(() => {
    setIsLoadingCatalog(true);
    fetch('/api/v1/shop/catalog')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Shop catalog fetch failed: ${res.status}`);
        return res.json() as Promise<ShopCatalog>;
      })
      .then((data) => setCatalog(data))
      .catch(() => toast.error('Failed to load shop. Please try again.'))
      .finally(() => setIsLoadingCatalog(false));
  }, []);

  /**
   * Buy an ability or weapon from the shop.
   *
   * @param itemId - The item identifier to purchase
   * @param itemType - Whether the item is an ability or weapon
   * @param cost - KP cost for optimistic deduction
   */
  const handleBuy = useCallback(
    async (itemId: string, itemType: 'ability' | 'weapon', cost: number) => {
      if (kp < cost) {
        toast.error('Not enough KP to buy this item.');
        return;
      }

      setBuyingId(itemId);
      spendKp(cost);
      if (itemType === 'ability') {
        addAbility(itemId);
      } else {
        addWeapon(itemId);
      }

      try {
        const res = await fetch('/api/v1/inventory/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, itemType }),
        });

        if (!res.ok) throw new Error(`Buy failed: ${res.status}`);

        const updatedInventory = await res.json();
        setInventory(updatedInventory);
        toast.success('Item purchased!');
      } catch {
        toast.error('Purchase failed. Please try again.');
        fetch('/api/v1/inventory')
          .then((r) => r.json())
          .then((inv) => setInventory(inv))
          .catch(() => null);
      } finally {
        setBuyingId(null);
      }
    },
    [kp, spendKp, addAbility, addWeapon, setInventory]
  );

  /**
   * Equip or unequip a weapon.
   *
   * @param weaponId - The weapon identifier to equip, or null to unequip
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
        toast.success(weaponId ? 'Weapon equipped!' : 'Weapon unequipped.');
      } catch {
        toast.error('Equip action failed. Please try again.');
        fetch('/api/v1/inventory')
          .then((r) => r.json())
          .then((inv) => setInventory(inv))
          .catch(() => null);
      } finally {
        setEquippingId(null);
      }
    },
    [equipWeapon, setInventory]
  );

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Top HUD */}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <Link href="/g/dashboard">
            <GameButton variant="ghost" size="sm">
              ← Dashboard
            </GameButton>
          </Link>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <div className="mb-2 flex justify-center">
          <ShoppingBag className="h-8 w-8 text-accent" aria-hidden />
        </div>
        <h1 className="font-display text-4xl uppercase tracking-widest text-glow-primary">
          Grand Bazaar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-wider">
          The full arsenal of Knowledge — abilities and weapons from all realms
        </p>
      </div>

      {isLoadingCatalog ? (
        <div className="mx-auto mt-16 flex max-w-3xl justify-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
            role="status"
            aria-label="Loading shop"
          />
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl space-y-10">
          {/* Abilities section */}
          <section aria-labelledby="abilities-heading">
            <h2
              id="abilities-heading"
              className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground"
            >
              Abilities ({catalog?.abilities.length ?? 0})
            </h2>
            {(catalog?.abilities.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">
                No abilities in the catalog yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(catalog?.abilities ?? []).map((ability) => (
                  <GlobalAbilityCard
                    key={ability.id}
                    ability={ability}
                    owned={ownedAbilityIds.includes(ability.id)}
                    canAfford={kp >= ability.cost}
                    isBuying={buyingId === ability.id}
                    onBuy={() => handleBuy(ability.id, 'ability', ability.cost)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Weapons section */}
          <section aria-labelledby="weapons-heading">
            <h2
              id="weapons-heading"
              className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground"
            >
              Weapons ({catalog?.weapons.length ?? 0})
            </h2>
            {(catalog?.weapons.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">
                No weapons in the catalog yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(catalog?.weapons ?? []).map((weapon) => (
                  <GlobalWeaponCard
                    key={weapon.id}
                    weapon={weapon}
                    owned={ownedWeaponIds.includes(weapon.id)}
                    equipped={equippedWeaponId === weapon.id}
                    canAfford={kp >= weapon.cost}
                    isBuying={buyingId === weapon.id}
                    isEquipping={equippingId === weapon.id}
                    onBuy={() => handleBuy(weapon.id, 'weapon', weapon.cost)}
                    onEquip={() => handleEquip(weapon.id)}
                    onUnequip={() => handleEquip(null)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Scene>
  );
}

// ── GlobalAbilityCard sub-component ──────────────────────────────────────────

interface GlobalAbilityCardProps {
  ability: ShopAbility;
  owned: boolean;
  canAfford: boolean;
  isBuying: boolean;
  onBuy: () => void;
}

/**
 * Global shop card for a purchasable ability.
 *
 * @param props.ability - The ability data to display
 * @param props.owned - Whether the player already owns this ability
 * @param props.canAfford - Whether the player has enough KP to buy
 * @param props.isBuying - True while the buy request is in-flight
 * @param props.onBuy - Callback to trigger purchase
 * @returns A styled ability card with stats and buy button
 */
function GlobalAbilityCard({
  ability,
  owned,
  canAfford,
  isBuying,
  onBuy,
}: GlobalAbilityCardProps) {
  return (
    <div
      className={[
        'rounded-xl border p-4 transition-all',
        owned
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-primary/20 bg-card/60 hover:border-primary/40',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          {ABILITY_ICON_MAP[ability.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            {ability.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{ability.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded border border-primary/30 px-1.5 py-0.5 text-primary/80">
              DMG {ability.damage[0]}–{ability.damage[1]}
            </span>
            {ability.cooldown > 0 && (
              <span className="rounded border border-muted-foreground/30 px-1.5 py-0.5 text-muted-foreground">
                CD {ability.cooldown}t
              </span>
            )}
            {ability.unlockHintZoneId && (
              <span className="rounded border border-accent/30 px-1.5 py-0.5 text-accent/70 capitalize">
                {ability.unlockHintZoneId}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-sm text-accent">{ability.cost} KP</span>
        {owned ? (
          <span className="text-xs font-semibold text-emerald-400">Owned</span>
        ) : (
          <GameButton
            variant="gold"
            size="sm"
            onClick={onBuy}
            disabled={!canAfford || isBuying}
            aria-label={`Buy ${ability.name} for ${ability.cost} KP`}
          >
            {isBuying ? 'Buying…' : 'Buy'}
          </GameButton>
        )}
      </div>
    </div>
  );
}

// ── GlobalWeaponCard sub-component ────────────────────────────────────────────

interface GlobalWeaponCardProps {
  weapon: ShopWeapon;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  isBuying: boolean;
  isEquipping: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}

/**
 * Global shop card for a purchasable weapon with equip/unequip support.
 *
 * @param props.weapon - The weapon data to display
 * @param props.owned - Whether the player already owns this weapon
 * @param props.equipped - Whether this weapon is currently equipped
 * @param props.canAfford - Whether the player has enough KP to buy
 * @param props.isBuying - True while the buy request is in-flight
 * @param props.isEquipping - True while the equip request is in-flight
 * @param props.onBuy - Callback to trigger purchase
 * @param props.onEquip - Callback to equip the weapon
 * @param props.onUnequip - Callback to unequip the weapon
 * @returns A styled weapon card with stats, buy, and equip buttons
 */
function GlobalWeaponCard({
  weapon,
  owned,
  equipped,
  canAfford,
  isBuying,
  isEquipping,
  onBuy,
  onEquip,
  onUnequip,
}: GlobalWeaponCardProps) {
  return (
    <div
      className={[
        'rounded-xl border p-4 transition-all',
        equipped
          ? 'border-accent/60 bg-accent/5'
          : owned
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-primary/20 bg-card/60 hover:border-primary/40',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Sword className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
              {weapon.name}
            </h3>
            {equipped && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent tracking-wider">
                EQUIPPED
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{weapon.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded border border-primary/30 px-1.5 py-0.5 text-primary/80">
              +{weapon.bonusDamage} DMG
            </span>
            {weapon.unlockHintZoneId && (
              <span className="rounded border border-accent/30 px-1.5 py-0.5 text-accent/70 capitalize">
                {weapon.unlockHintZoneId}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-sm text-accent">{weapon.cost} KP</span>
        <div className="flex gap-2">
          {!owned ? (
            <GameButton
              variant="gold"
              size="sm"
              onClick={onBuy}
              disabled={!canAfford || isBuying}
              aria-label={`Buy ${weapon.name} for ${weapon.cost} KP`}
            >
              {isBuying ? 'Buying…' : 'Buy'}
            </GameButton>
          ) : equipped ? (
            <GameButton
              variant="ghost"
              size="sm"
              onClick={onUnequip}
              disabled={isEquipping}
              aria-label={`Unequip ${weapon.name}`}
            >
              {isEquipping ? 'Saving…' : 'Unequip'}
            </GameButton>
          ) : (
            <GameButton
              variant="primary"
              size="sm"
              onClick={onEquip}
              disabled={isEquipping}
              aria-label={`Equip ${weapon.name}`}
            >
              {isEquipping ? 'Equipping…' : 'Equip'}
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
}
