import type {
  ShopAbility,
  ShopWeapon,
  ShopCatalog,
  ShopAbilityIcon,
} from '@eureka-lab/shared-types';

/**
 * Hardcoded shop catalog for abilities and weapons.
 * KP costs and damage tuning values are sourced from planning/phase-16-gamified-ui-redesign.md.
 * Server-authoritative — clients never compute cost, damage, or cooldown.
 */

const ABILITIES: ShopAbility[] = [
  {
    id: 'ability-spark-bolt',
    name: 'Spark Bolt',
    icon: 'zap' as ShopAbilityIcon,
    damage: [8, 12],
    cooldown: 0,
    cost: 0,
    description: 'Basic spark of knowledge',
    unlockHintZoneId: null,
  },
  {
    id: 'ability-mind-blast',
    name: 'Mind Blast',
    icon: 'brain' as ShopAbilityIcon,
    damage: [12, 18],
    cooldown: 1,
    cost: 60,
    description: 'Unleash a wave of understanding',
    unlockHintZoneId: 'library',
  },
  {
    id: 'ability-logic-surge',
    name: 'Logic Surge',
    icon: 'zap' as ShopAbilityIcon,
    damage: [15, 22],
    cooldown: 1,
    cost: 80,
    description: 'Channel logical energy',
    unlockHintZoneId: 'forge',
  },
  {
    id: 'ability-data-lance',
    name: 'Data Lance',
    icon: 'sword' as ShopAbilityIcon,
    damage: [18, 25],
    cooldown: 2,
    cost: 100,
    description: 'Pierce through confusion',
    unlockHintZoneId: 'citadel',
  },
  {
    id: 'ability-agent-strike',
    name: 'Agent Strike',
    icon: 'spark' as ShopAbilityIcon,
    damage: [22, 30],
    cooldown: 2,
    cost: 120,
    description: 'Command an agent assault',
    unlockHintZoneId: 'academy',
  },
];

const WEAPONS: ShopWeapon[] = [
  {
    id: 'weapon-starter-wand',
    name: 'Starter Wand',
    bonusDamage: 0,
    cost: 0,
    description: 'Your first magical tool',
    unlockHintZoneId: null,
  },
  {
    id: 'weapon-echo-staff',
    name: 'Echo Staff',
    bonusDamage: 3,
    cost: 150,
    description: 'Amplifies echoes of knowledge',
    unlockHintZoneId: 'forge',
  },
  {
    id: 'weapon-glitch-blade',
    name: 'Glitch Blade',
    bonusDamage: 5,
    cost: 200,
    description: 'Slices through errors',
    unlockHintZoneId: 'citadel',
  },
  {
    id: 'weapon-void-scepter',
    name: 'Void Scepter',
    bonusDamage: 8,
    cost: 300,
    description: 'Commands the void itself',
    unlockHintZoneId: 'academy',
  },
];

/**
 * The full shop catalog containing all purchasable abilities and weapons.
 * This is the server-authoritative source — never trust catalog data from the client.
 */
export const SHOP_CATALOG: ShopCatalog = {
  abilities: ABILITIES,
  weapons: WEAPONS,
};

/**
 * Look up a shop ability by its unique ID.
 *
 * @param id - The ability identifier (e.g. 'ability-spark-bolt')
 * @returns The matching ShopAbility, or undefined if not found
 */
export function findAbilityById(id: string): ShopAbility | undefined {
  return ABILITIES.find((a) => a.id === id);
}

/**
 * Look up a shop weapon by its unique ID.
 *
 * @param id - The weapon identifier (e.g. 'weapon-starter-wand')
 * @returns The matching ShopWeapon, or undefined if not found
 */
export function findWeaponById(id: string): ShopWeapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}
