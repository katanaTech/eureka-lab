'use client';

import type { GameItem, EquipmentSlots, EquipmentSlotKey } from '@eureka-lab/shared-types';

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string }> = {
  common:    { border: 'border-gray-500',   glow: '',                        label: 'text-gray-400' },
  rare:      { border: 'border-blue-400',   glow: 'shadow-blue-500/30',      label: 'text-blue-400' },
  epic:      { border: 'border-purple-400', glow: 'shadow-purple-500/30',    label: 'text-purple-400' },
  legendary: { border: 'border-yellow-400', glow: 'shadow-yellow-500/50',    label: 'text-yellow-400' },
};

const SLOT_EMOJIS: Record<EquipmentSlotKey, string> = {
  head:      '⛑️',
  body:      '🛡️',
  weapon:    '⚔️',
  shield:    '🛡️',
  accessory: '💎',
};

interface InventoryGridProps {
  /** All items owned by the player */
  ownedItems: GameItem[];
  /** Currently equipped items */
  equippedItems: EquipmentSlots;
  /** Called when the player clicks Equip on an item */
  onEquip: (slot: EquipmentSlotKey, item: GameItem) => void;
}

/**
 * Grid of all owned equipment items with equip button and rarity glow.
 */
export function InventoryGrid({ ownedItems, equippedItems, onEquip }: InventoryGridProps) {
  if (ownedItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
        <span className="text-5xl">🎒</span>
        <p className="text-sm">Complete missions to earn equipment!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ownedItems.map((item) => {
        const styles = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
        const isEquipped = equippedItems[item.slot]?.id === item.id;

        return (
          <div
            key={item.id}
            className={[
              'flex flex-col gap-2 rounded-2xl border-2 bg-gray-800 p-4 transition-all',
              styles.border,
              styles.glow ? `shadow-lg ${styles.glow}` : '',
              isEquipped ? 'ring-2 ring-white/30' : '',
            ].join(' ')}
          >
            {/* Icon */}
            <div className="flex items-center justify-between">
              <span className="text-3xl">{SLOT_EMOJIS[item.slot]}</span>
              <span className={`text-xs font-bold capitalize ${styles.label}`}>
                {item.rarity}
              </span>
            </div>

            {/* Name */}
            <div>
              <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
              <p className="text-xs text-gray-500 capitalize">{item.slot}</p>
            </div>

            {/* Stat boost */}
            {item.statBoost && (
              <p className="text-xs text-indigo-300">{item.statBoost}</p>
            )}

            {/* Equip button */}
            <button
              type="button"
              onClick={() => onEquip(item.slot, item)}
              disabled={isEquipped}
              className={[
                'mt-auto rounded-xl px-3 py-1.5 text-xs font-bold transition',
                isEquipped
                  ? 'bg-gray-700 text-gray-500 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500',
              ].join(' ')}
            >
              {isEquipped ? '✓ Equipped' : 'Equip'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
