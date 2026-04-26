# ADR-003: Knowledge-Points (KP) Economy & Inventory Data Model

> **Status:** ACCEPTED
> **Date:** 2026-04-25
> **Author:** ARCH agent
> **Implements:** [planning/phase-16-gamified-ui-redesign.md](../../planning/phase-16-gamified-ui-redesign.md) §7
> **Depends on:** ADR-002 (gamified UI paradigm)

---

## Context

The new fantasy gamified-mode UI introduces a gameplay loop:

```
Complete lesson  →  earn Knowledge Points (KP)
Spend KP at the Shop  →  buy abilities and weapons
Equip weapon, take ability into battle  →  more damage, new combat options
Defeat zombies  →  unlock next realm (existing Phase 15 mechanic)
```

This is **new gameplay**, not just a visual layer. KP and the shop catalog must persist
server-side so progress survives device changes, parental dashboards can audit it, and abuse
(e.g. clock manipulation to grind KP) is harder.

Two questions to resolve:

1. **Where does KP live in the data model?** Inside the user document, or in a separate
   collection?
2. **When is KP earned?** Always, or only when the user is in gamified mode?

## Decision

### 1. Storage — separate `inventories/{userId}` collection

```
inventories/{userId}
  kp: number                       (current spendable balance)
  totalKpEarned: number            (lifetime accumulator — drives soft-buff comparisons)
  ownedAbilityIds: string[]
  ownedWeaponIds: string[]
  equippedWeaponId: string | null
  updatedAt: Timestamp
```

- One document per user.
- Security: same rule pattern as `users/{userId}` — owner read/write, admin SDK on backend
  (CLAUDE.md rule #3 — `userId` filter on every query).
- Sensitive shape isolation: keeping inventory out of `users/{userId}` lets us add/remove fields
  freely (gameplay tuning) without touching the auth-critical user document.

### 2. KP Earning Rule — Mode-Conditional, Server-Computed

**KP is granted only when the user's effective UI mode at the time of completion is `gamified`.**

- "Effective mode" is computed server-side via `UiModeResolver` (see ADR-004), never trusted from
  the client.
- Existing progress endpoints (`POST /api/v1/progress/lessons/:id/complete`,
  `/api/v1/combat/:battleId/complete`, etc.) gain a hook into a new `InventoryService` that:
  1. Looks up the effective UI mode for the user.
  2. If `'gamified'`, awards KP per a `KP_REWARDS: Record<EventType, number>` table.
  3. If `'normal'`, no-ops on KP (XP and other rewards still apply unchanged).
- KP awards are **idempotent per event** (lesson ID + user ID is the unique key) — replaying a
  completion does not double-award.

### 3. Shop Catalog — Backend-Owned, Initially Hardcoded

Catalog lives in `apps/api/src/modules/inventory/shop-catalog.ts` as a typed const:

```typescript
export const SHOP_ABILITIES: ShopAbility[] = [/* ... */];
export const SHOP_WEAPONS:   ShopWeapon[]   = [/* ... */];
```

The frontend fetches via `GET /api/v1/shop/catalog`. **The frontend never decides prices or
damage values** — those are server-authoritative for tuning and anti-cheat.

If catalog tuning becomes frequent enough to warrant Firestore-backed configuration, that's a
future ADR (`shop-catalog → Firestore + admin UI`).

### 4. Purchase Atomicity

`POST /api/v1/inventory/buy` uses a Firestore transaction that:

1. Reads `inventories/{userId}` and the catalog item.
2. Validates `kp >= cost` and `itemId not in owned*`.
3. Writes the inventory with debited KP and updated ownership in a single commit.

This prevents double-spend under concurrent requests (e.g. user double-tapping the buy button).

### 5. Anti-Grind Caps

**Daily cap on KP earnable from any single source** (e.g. lesson completion: 50 KP/day, combat
victory: 200 KP/day). Tracked in a sub-collection `inventories/{userId}/dailyEarn/{YYYY-MM-DD}`
with per-source counters. This is an anti-grind safeguard, not a punishment — the gameplay rate
is tuned so a normal learner doesn't notice the cap.

Initial cap values are tuning concerns owned by PM and recorded in the catalog file with
`// TUNABLE` markers.

## Consequences

**Positive**

- Inventory document is auditable, parental-dashboard-readable, anti-cheat-compatible.
- Mode-conditional earning preserves the principle that **gamification is opt-in**: users in
  normal mode are not affected by the gameplay economy.
- Atomic purchases prevent the common F2P bug class (double-spend under network retries).
- Server-authoritative catalog enables anti-cheat and rapid tuning.

**Negative**

- Users who switch from normal to gamified mode mid-curriculum start at 0 KP. PM signed off; the
  alternative (back-grant KP for past lessons) creates a one-time KP windfall that breaks
  game-balance.
- One additional Firestore read on every progress endpoint (cached in-memory per request via the
  `UiModeResolver` to mitigate).
- Daily-cap sub-collection adds writes; mitigated by checking the cap *before* the increment
  write (avoids spurious writes if capped).

**Neutral**

- Bundle / network impact on the frontend is negligible (small inventory document, infrequent
  catalog fetch — cacheable for 1 hour via TanStack Query stale-time).

## Alternatives Considered

1. **KP inside `users/{userId}`.** Rejected. Couples gameplay state to auth state; every user-doc
   read pulls inventory data; harder to evolve without touching auth-critical fields.

2. **KP earned in both modes.** Rejected. Defeats the opt-in gamification principle — users who
   prefer normal mode still accumulate gameplay state they don't want to see.

3. **Client-computed KP, server-validated periodically.** Rejected. Makes anti-cheat hard;
   complicates parental dashboards (which need a single source of truth).

4. **Real-money / IAP-backed shop.** Out of scope; explicitly forbidden for this audience (8–16)
   under our parental-consent constraints.

## Acceptance Criteria

- Unit test asserts `KP === 0` after `progress.complete()` is called when user's effective UI
  mode is `'normal'`.
- Integration test for `POST /inventory/buy` proves transaction atomicity (concurrent buy of last
  affordable item — only one succeeds).
- Daily cap test: 11 lesson completions in a row only credit up to the daily cap.

---

*Authored 2026-04-25 by ARCH agent.*
