'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { InventoryGrid } from '@/components/game/InventoryGrid';
import { CAREER_OPTIONS } from '@/components/game/CareerPicker';
import type { EquipmentSlotKey, GameItem } from '@eureka-lab/shared-types';

/**
 * Inventory page — shows all earned equipment and lets the player equip items.
 * Accessible from the GameHUD "🎒 Inventory" button.
 */
export default function InventoryPage() {
  const router = useRouter();
  const {
    careerArchetype,
    characterCustomization,
    ownedItems,
    equippedItems,
    equipItem,
    completedMissionIds,
  } = useGameStore();

  const careerOption = CAREER_OPTIONS.find((c) => c.id === careerArchetype);

  function handleEquip(slot: EquipmentSlotKey, item: GameItem) {
    equipItem(slot, item);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gray-900/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{careerOption?.emoji}</span>
            <div>
              <h1 className="text-xl font-black text-white">
                {characterCustomization.name || 'Hero'}&apos;s Inventory
              </h1>
              <p className="text-sm text-gray-400">
                {ownedItems.length} items · {completedMissionIds.length} missions cleared
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Equipped slots summary */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">Currently Equipped</h2>
          <div className="grid grid-cols-5 gap-3">
            {(['head', 'body', 'weapon', 'shield', 'accessory'] as EquipmentSlotKey[]).map((slot) => {
              const item = equippedItems[slot];
              return (
                <div
                  key={slot}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-700 bg-gray-800 px-2 py-3"
                >
                  <span className="text-2xl">{item ? '⚔️' : '➕'}</span>
                  <span className="text-center text-xs font-semibold text-white leading-tight">
                    {item ? item.name : `Empty ${slot}`}
                  </span>
                  <span className="text-xs capitalize text-gray-500">{slot}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Item grid */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">All Items</h2>
          <InventoryGrid
            ownedItems={ownedItems}
            equippedItems={equippedItems}
            onEquip={handleEquip}
          />
        </div>
      </div>
    </div>
  );
}
