'use client';

/**
 * Mobile shop card sub-components for global and realm shop pages.
 * Compact styling for touch-first mobile experience.
 */

import { Sword, Sparkles, Brain, Shield, Zap } from 'lucide-react';
import type { ShopAbility, ShopWeapon, ShopAbilityIcon } from '@eureka-lab/shared-types';
import { GameButton } from '@/components/game/fantasy';

/** Maps a ShopAbilityIcon to its Lucide component. */
const ABILITY_ICON_MAP: Record<ShopAbilityIcon, React.ReactNode> = {
  sword: <Sword className="h-4 w-4" aria-hidden />,
  spark: <Sparkles className="h-4 w-4" aria-hidden />,
  brain: <Brain className="h-4 w-4" aria-hidden />,
  shield: <Shield className="h-4 w-4" aria-hidden />,
  zap: <Zap className="h-4 w-4" aria-hidden />,
};

// ── MobileAbilityCard ───────────────────────────────────────────────────────

interface MobileAbilityCardProps {
  ability: ShopAbility;
  owned: boolean;
  canAfford: boolean;
  isBuying: boolean;
  onBuy: () => void;
  kpCost: string;
  ownedLabel: string;
  buyLabel: string;
  buyingLabel: string;
  damageLabel: string;
  cooldownLabel: string;
}

/**
 * Compact ability card for mobile shop pages.
 *
 * @param props - Ability card props with pre-translated labels
 * @returns A compact styled ability card
 */
export function MobileAbilityCard({
  ability, owned, canAfford, isBuying, onBuy,
  kpCost, ownedLabel, buyLabel, buyingLabel, damageLabel, cooldownLabel,
}: MobileAbilityCardProps) {
  return (
    <div className={[
      'rounded-lg border p-3 transition-all',
      owned ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-primary/20 bg-card/60',
    ].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          {ABILITY_ICON_MAP[ability.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xs uppercase tracking-wider text-foreground">{ability.name}</h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{ability.description}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
            <span className="rounded border border-primary/30 px-1 py-0.5 text-primary/80">{damageLabel}</span>
            {ability.cooldown > 0 && (
              <span className="rounded border border-muted-foreground/30 px-1 py-0.5 text-muted-foreground">{cooldownLabel}</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display text-xs text-accent">{kpCost}</span>
        {owned ? (
          <span className="text-[10px] font-semibold text-emerald-400">{ownedLabel}</span>
        ) : (
          <GameButton variant="gold" size="sm" onClick={onBuy} disabled={!canAfford || isBuying}>
            {isBuying ? buyingLabel : buyLabel}
          </GameButton>
        )}
      </div>
    </div>
  );
}

// ── MobileWeaponCard ────────────────────────────────────────────────────────

interface MobileWeaponCardProps {
  weapon: ShopWeapon;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  isBuying: boolean;
  isEquipping: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  kpCost: string;
  equippedBadge: string;
  bonusLabel: string;
  buyLabel: string;
  buyingLabel: string;
  equipLabel: string;
  equippingLabel: string;
  unequipLabel: string;
  unequippingLabel: string;
}

/**
 * Compact weapon card for mobile shop pages.
 *
 * @param props - Weapon card props with pre-translated labels
 * @returns A compact styled weapon card
 */
export function MobileWeaponCard({
  weapon, owned, equipped, canAfford, isBuying, isEquipping,
  onBuy, onEquip, onUnequip,
  kpCost, equippedBadge, bonusLabel,
  buyLabel, buyingLabel, equipLabel, equippingLabel, unequipLabel, unequippingLabel,
}: MobileWeaponCardProps) {
  return (
    <div className={[
      'rounded-lg border p-3 transition-all',
      equipped ? 'border-accent/60 bg-accent/5'
        : owned ? 'border-emerald-500/40 bg-emerald-500/5'
        : 'border-primary/20 bg-card/60',
    ].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Sword className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-xs uppercase tracking-wider text-foreground">{weapon.name}</h3>
            {equipped && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-1 py-0.5 text-[8px] text-accent tracking-wider">{equippedBadge}</span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{weapon.description}</p>
          <span className="mt-1 inline-block rounded border border-primary/30 px-1 py-0.5 text-[9px] text-primary/80">{bonusLabel}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display text-xs text-accent">{kpCost}</span>
        {!owned ? (
          <GameButton variant="gold" size="sm" onClick={onBuy} disabled={!canAfford || isBuying}>
            {isBuying ? buyingLabel : buyLabel}
          </GameButton>
        ) : equipped ? (
          <GameButton variant="ghost" size="sm" onClick={onUnequip} disabled={isEquipping}>
            {isEquipping ? unequippingLabel : unequipLabel}
          </GameButton>
        ) : (
          <GameButton variant="primary" size="sm" onClick={onEquip} disabled={isEquipping}>
            {isEquipping ? equippingLabel : equipLabel}
          </GameButton>
        )}
      </div>
    </div>
  );
}
