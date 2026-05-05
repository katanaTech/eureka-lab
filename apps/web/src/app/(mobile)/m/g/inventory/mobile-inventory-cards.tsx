'use client';

/**
 * Mobile inventory card sub-components — compact display for owned items.
 * Used exclusively by the mobile inventory page.
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

// ── MobileInventoryAbilityCard ──────────────────────────────────────────────

interface InventoryAbilityCardProps {
  ability: ShopAbility;
  damageLabel: string;
  cooldownLabel: string;
}

/**
 * Compact owned ability card for mobile inventory.
 *
 * @param props - Ability data with pre-translated labels
 * @returns A compact styled ability card (no buy button)
 */
export function MobileInventoryAbilityCard({ ability, damageLabel, cooldownLabel }: InventoryAbilityCardProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-card/60 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
        {ABILITY_ICON_MAP[ability.icon]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs uppercase tracking-wider text-foreground">{ability.name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{ability.description}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
          <span className="rounded border border-primary/30 px-1 py-0.5 text-primary/80">{damageLabel}</span>
          {ability.cooldown > 0 && (
            <span className="rounded border border-muted-foreground/30 px-1 py-0.5 text-muted-foreground">{cooldownLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MobileInventoryWeaponCard ───────────────────────────────────────────────

interface InventoryWeaponCardProps {
  weapon: ShopWeapon;
  equipped: boolean;
  isEquipping: boolean;
  onEquip: () => void;
  onUnequip: () => void;
  equippedBadge: string;
  bonusLabel: string;
  equipLabel: string;
  equippingLabel: string;
  unequipLabel: string;
  unequippingLabel: string;
}

/**
 * Compact owned weapon card for mobile inventory with equip controls.
 *
 * @param props - Weapon data with pre-translated labels and equip callbacks
 * @returns A compact styled weapon card with equip/unequip button
 */
export function MobileInventoryWeaponCard({
  weapon, equipped, isEquipping, onEquip, onUnequip,
  equippedBadge, bonusLabel, equipLabel, equippingLabel, unequipLabel, unequippingLabel,
}: InventoryWeaponCardProps) {
  return (
    <div className={[
      'rounded-lg border p-3 transition-all',
      equipped ? 'border-accent/50 bg-accent/5' : 'border-primary/20 bg-card/60',
    ].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Sword className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-xs uppercase tracking-wider text-foreground">{weapon.name}</p>
            {equipped && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-1 py-0.5 text-[8px] text-accent tracking-wider">{equippedBadge}</span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{weapon.description}</p>
          <span className="mt-1 inline-block rounded border border-primary/30 px-1 py-0.5 text-[9px] text-primary/80">{bonusLabel}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        {equipped ? (
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
