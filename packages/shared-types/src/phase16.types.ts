/**
 * Phase 16 — Gamified UI Redesign (Cinematic Fantasy)
 *
 * Authoritative shared types for the Phase 16 fantasy mode: UI mode resolution,
 * the fantasy class system, the KP economy + inventory, and zone↔realm
 * narrative mapping.
 *
 * Decisions captured in:
 *   - docs/context/ADR-002 (gamified UI paradigm — R3F parked, fantasy 2D adopted)
 *   - docs/context/ADR-003 (KP economy & inventory data model)
 *   - docs/context/ADR-004 (UI mode resolution: user pref vs tenant lock)
 *   - docs/context/ADR-005 (narrative & class mapping)
 *
 * Type-only imports from ./index avoid runtime circular dependency.
 */

import type { CareerArchetype, ZoneId } from './index';

// ── UI Mode ─────────────────────────────────────────────────────────────────

/**
 * The two presentations of the same curriculum. Resolved server-side by
 * UiModeResolver (see ADR-004) — never trusted from the client.
 */
export type UiMode = 'normal' | 'gamified';

/**
 * Tenant-level UI-mode lock for B2B education clients.
 * When `locked === true` and `mode !== null`, all users in this tenant render
 * with the locked mode regardless of their personal preference (ADR-004 §1).
 */
export interface TenantUiModeLock {
  /** Locked-in mode, or null when no default is set */
  mode: UiMode | null;
  /** Whether the lock is active (true = users cannot override) */
  locked: boolean;
}

// ── Fantasy Class System ────────────────────────────────────────────────────

/**
 * Cinematic-fantasy character classes used in game mode.
 * Independent of {@link CareerArchetype}; mapped at character creation as a
 * suggested default and user-overridable thereafter (ADR-005 §2).
 */
export type FantasyClass = 'mage' | 'engineer' | 'rogue' | 'warrior';

/**
 * Default mapping from the existing {@link CareerArchetype} (8 values) to a
 * {@link FantasyClass} (4 values), used as the suggested class at character
 * creation. Users may override their class freely thereafter.
 *
 * Mapping rationale:
 *   - astronaut, chef     → warrior (frontier explorer / artisan precision)
 *   - doctor, teacher     → mage    (intellect / mentorship)
 *   - artist, gamer       → rogue   (creative perception / quick reflexes)
 *   - engineer, scientist → engineer (logical builder / methodical investigator)
 *
 * See ADR-005 §2 for the renaming policy.
 */
export const FANTASY_CLASS_BY_CAREER: Record<CareerArchetype, FantasyClass> = {
  astronaut: 'warrior',
  chef:      'warrior',
  doctor:    'mage',
  teacher:   'mage',
  artist:    'rogue',
  gamer:     'rogue',
  engineer:  'engineer',
  scientist: 'engineer',
};

/**
 * Default class aura colour as an HSL triplet (no `hsl()` wrapper, ready to
 * interpolate into a CSS custom property). Picked to match the cinematic
 * fantasy theme defined in ADR-002 §4 / planning/phase-16-gamified-ui-redesign.md §4.1.
 * Override per-user is allowed.
 */
export const FANTASY_CLASS_DEFAULT_AURA_HSL: Record<FantasyClass, string> = {
  mage:     '268 70% 60%',
  engineer: '42 95% 60%',
  rogue:    '310 80% 65%',
  warrior:  '0 80% 60%',
};

/**
 * The fantasy-mode character a user creates on entering game mode for the
 * first time. Persisted at `users/{uid}.character` (see ADR-005 §2 storage).
 */
export interface FantasyCharacter {
  /** Display name chosen by the player (2–30 chars) */
  name: string;
  /** Fantasy class — defaults from {@link FANTASY_CLASS_BY_CAREER}, user-overridable */
  class: FantasyClass;
  /**
   * HSL triplet (e.g. '268 70% 60%') — defaults from
   * {@link FANTASY_CLASS_DEFAULT_AURA_HSL}, user-overridable.
   */
  classColorHsl: string;
  /** Cosmetic narrative weapon name (display only — actual stats come from equipped weapon) */
  weaponName: string;
  /** ISO timestamp of character creation */
  createdAt: string;
}

// ── Zone ↔ Realm Mapping (1:1) ──────────────────────────────────────────────

/**
 * Permanent URL slugs for the `/campaign/:slug` route in game mode.
 * Once shipped these become public URLs — renaming requires an ADR plus a
 * permanent redirect (ADR-005 §4).
 */
export const CAMPAIGN_SLUG_BY_ZONE: Record<ZoneId, string> = {
  library: 'whispers',
  forge:   'echoes',
  citadel: 'glitches',
  academy: 'wraiths',
};

/** Reverse lookup: realm slug → ZoneId. Derived from {@link CAMPAIGN_SLUG_BY_ZONE}. */
export const ZONE_BY_CAMPAIGN_SLUG: Record<string, ZoneId> = Object.fromEntries(
  Object.entries(CAMPAIGN_SLUG_BY_ZONE).map(([z, s]) => [s, z as ZoneId])
);

/**
 * Player-facing realm names for game mode. Renameable per ADR-005 §4
 * without migration — only the slug is permanent.
 */
export const REALM_NAME_BY_ZONE: Record<ZoneId, string> = {
  library: 'Isle of Whispers',
  forge:   'Forge of Echoes',
  citadel: 'Citadel of Glitches',
  academy: 'Academy of Wraiths',
};

/** Game-mode boss names per zone. Renameable per ADR-005 §4 without migration. */
export const REALM_BOSS_NAME_BY_ZONE: Record<ZoneId, string> = {
  library: 'Babble Whisperer',
  forge:   'Babble Drone',
  citadel: 'Babble Glitch',
  academy: 'Babble Wraith',
};

/**
 * Final-boss display strings for game mode. The Anti-AI Overlord narrative
 * from Phase 15 carries over; the realm itself is "The Void Throne".
 */
export const FINAL_BOSS_REALM_NAME = 'The Void Throne' as const;
export const FINAL_BOSS_REALM_SLUG = 'void' as const;
export const FINAL_BOSS_GAME_NAME = 'Anti-AI Overlord' as const;

// ── KP Economy & Inventory ──────────────────────────────────────────────────

/**
 * Inventory document stored at `inventories/{userId}` (ADR-003 §1).
 * Owner read/write; backend writes via admin SDK during atomic purchases.
 */
export interface Inventory {
  /** Current spendable Knowledge-Points balance */
  kp: number;
  /** Lifetime KP earned (drives soft-buff comparisons in combat) */
  totalKpEarned: number;
  /** IDs of abilities the user has purchased */
  ownedAbilityIds: string[];
  /** IDs of weapons the user has purchased */
  ownedWeaponIds: string[];
  /** Currently equipped weapon ID, or null if unarmed */
  equippedWeaponId: string | null;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/** Visual icon variant for shop abilities (rendered in shop UI and battle ability dock). */
export type ShopAbilityIcon = 'sword' | 'spark' | 'brain' | 'shield' | 'zap';

/**
 * A purchasable combat ability (ADR-003 §3).
 * Server-authoritative — the frontend never decides damage, cooldown, or cost.
 */
export interface ShopAbility {
  /** Unique ability identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon variant rendered in shop and battle UI */
  icon: ShopAbilityIcon;
  /** [min, max] damage range applied per use (inclusive) */
  damage: readonly [number, number];
  /** Turn cooldown after use; 0 = no cooldown */
  cooldown: number;
  /** KP cost to purchase */
  cost: number;
  /** Player-facing description */
  description: string;
  /** Optional hint about which zone narratively unlocks this ability */
  unlockHintZoneId: ZoneId | null;
}

/**
 * A purchasable weapon (ADR-003 §3).
 * Equipping adds {@link ShopWeapon.bonusDamage} to all ability uses.
 */
export interface ShopWeapon {
  /** Unique weapon identifier */
  id: string;
  /** Display name */
  name: string;
  /** Flat damage bonus added to every ability use while equipped */
  bonusDamage: number;
  /** KP cost to purchase */
  cost: number;
  /** Player-facing description */
  description: string;
  /** Optional hint about which zone narratively unlocks this weapon */
  unlockHintZoneId: ZoneId | null;
}

/** Full shop catalog returned by `GET /api/v1/shop/catalog`. */
export interface ShopCatalog {
  abilities: ShopAbility[];
  weapons: ShopWeapon[];
}

/** Item-type discriminator used by `POST /api/v1/inventory/buy`. */
export type ShopItemType = 'ability' | 'weapon';

/**
 * Categories of progress events that may award KP under ADR-003 §2.
 * Actual reward values live server-side in `apps/api/src/modules/inventory/`
 * (BE territory, tunable per `planning/sprint-p16.md` §KP Tuning Values).
 */
export type KpEarnEvent =
  | 'lesson_completed'
  | 'practice_completed'
  | 'minion_defeated'
  | 'guardian_defeated'
  | 'overlord_defeated'
  | 'daily_login';
