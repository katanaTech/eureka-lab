# Phase 16 — Gamified UI Redesign (Cinematic Fantasy)

> **Status:** Plan v1.0 — awaiting PM scheduling and BE/FE/DEVOPS sign-off
> **Authored by:** ARCH agent
> **Date:** 2026-04-25
> **Branch (proposed):** `feature/phase-16-fantasy-ui`
> **Source design:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Lovable.dev–generated reference)

---

## 1. Concept Summary

Replace the entire **gamified mode** UI in `apps/web/src/app/(game)/*` with a 2D cinematic dark-fantasy
shadcn/ui design ported from the `ai-adventure-island` reference project. The R3F (3D) implementation
of the same flow is preserved behind a feature flag so we can A/B test 2D vs 3D before deciding what
to retire.

The **normal mode** (`(dashboard)/*`) is **unchanged**. A user-level (or, for B2B clients,
tenant-locked) `uiMode` setting determines which mode renders learning content. Both modes deliver
the same curriculum and feed the same backend; only the presentation differs.

The new gamified mode also introduces a **Knowledge-Points (KP) economy + ability/weapon shop**, an
extension of gameplay (not just visuals) that requires new backend work.

---

## 2. Decision Log (User Answers Captured 2026-04-25)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope | **(B)** Replace entire `(game)` flow end-to-end |
| 2 | R3F future | **Park behind feature flag for A/B**; do not delete |
| 3 | Backend | **Keep Eureka API**; only add backend when new UI requires it |
| 4 | Narrative | **Merge** — normal narrative kept; fantasy narrative for game mode; mapped 1:1 |
| 5 | Class system | **Both kept**; Career Archetype ↔ Fantasy Class mapped 1:1 |
| 6 | KP economy + shop | **Yes** — full new gameplay loop |
| 7 | Mobile | **Keep** `/m/*`; eventual main surface; apply new design to both `/g/*` and `/m/*` |
| 8 | Mode toggle | User-level setting for general users; tenant-level lockable for B2B clients |
| 9 | i18n | **English only v1**; defer translation |
| 10 | Assets | Use Lovable assets as-is; defer licensing |
| 11 | Routing | Adopt `/campaign/:slug` naming |
| 12 | Safety | Keep moderation pipeline intact (CLAUDE.md rule #11) |

---

## 3. Narrative & Class Mapping (1:1)

### 3.1 Zone ↔ Realm Mapping

| Level | Normal Mode (Zone) | Game Mode (Realm) | Boss (Normal) | Boss (Game) | Slug |
|-------|-------------------|-------------------|---------------|-------------|------|
| L1 | Library of Prompts | **Isle of Whispers** | Misinformation Mole | **Babble Whisperer** | `whispers` |
| L2 | Automation Forge | **Forge of Echoes** | Lazy Bot | **Babble Drone** | `echoes` |
| L3 | Code Citadel | **Citadel of Glitches** | Bug Monster | **Babble Glitch** | `glitches` |
| L4 | Agent Academy | **Academy of Wraiths** | Memory Eraser | **Babble Wraith** | `wraiths` |
| Final | (none in normal mode) | **The Void Throne** | — | **Anti-AI Overlord** (kept) | `void` |

> Slugs (column 6) are the new `/campaign/:slug` route segments. Stable identifiers — these become
> URLs, analytics tags, and database keys, so they should not change after launch.

**Implementation rule:** `ZoneId` (existing in `shared-types`) remains the canonical identifier in
the database. A new constant `CAMPAIGN_SLUG_BY_ZONE: Record<ZoneId, string>` lives in
`packages/shared-types/src/game.types.ts` and is the single source of truth for the mapping.
Frontend renders Zone names in normal mode and Realm names in game mode based on the `uiMode`
context.

### 3.2 Career Archetype ↔ Fantasy Class Mapping

> **Updated 2026-04-26 during P16-FND-006 implementation** — the mapping below uses
> the actual 8-value `CareerArchetype` enum from `packages/shared-types/src/index.ts`,
> grouped 2-2-2-2 to balance class distribution. Authoritative copy lives in
> `packages/shared-types/src/phase16.types.ts` as `FANTASY_CLASS_BY_CAREER`.

| Career Archetype (Normal) | Fantasy Class (Game) | Aura HSL | Rationale |
|---|---|---|---|
| `astronaut` | **Warrior** | `0 80% 60%` (red) | Frontier explorer / brave |
| `chef` | **Warrior** | `0 80% 60%` (red) | Heat / artisan precision |
| `doctor` | **Mage** | `268 70% 60%` (violet) | Intellect / healing wisdom |
| `teacher` | **Mage** | `268 70% 60%` (violet) | Mentorship / guidance |
| `artist` | **Rogue** | `310 80% 65%` (magenta) | Creative perception |
| `gamer` | **Rogue** | `310 80% 65%` (magenta) | Quick reflexes / agile |
| `engineer` | **Engineer** | `42 95% 60%` (gold) | Logical builder (1:1) |
| `scientist` | **Engineer** | `42 95% 60%` (gold) | Methodical investigator |

**Storage:** `users/{userId}` gains a `character` sub-object: `{ name, class, classColorHsl,
weaponName, createdAt }`. `careerArchetype` (existing field) and `class` are independent — both
persisted, both editable. Mapping above is the **default suggestion** at character-creation time;
the user can override.

---

## 4. Visual Design System (Imported from ai-adventure-island)

### 4.1 Tokens — to add to `apps/web/src/styles/globals.css` under a `[data-ui-mode="game"]` selector

```css
[data-ui-mode="game"] {
  --background: 230 40% 5%;
  --foreground: 190 60% 95%;
  --card: 230 35% 9%;
  --primary: 188 95% 55%;        /* arcane cyan */
  --primary-glow: 188 100% 70%;
  --secondary: 268 70% 55%;      /* mystic violet */
  --secondary-glow: 280 90% 70%;
  --accent: 42 95% 60%;          /* quest gold */
  --accent-glow: 42 100% 70%;
  --success: 145 70% 50%;
  --destructive: 0 85% 60%;
  --border: 200 50% 25%;
  --radius: 0.85rem;

  --gradient-primary: linear-gradient(135deg, hsl(188 95% 55%), hsl(220 90% 60%));
  --gradient-secondary: linear-gradient(135deg, hsl(268 70% 55%), hsl(310 80% 60%));
  --gradient-gold: linear-gradient(135deg, hsl(42 95% 60%), hsl(28 95% 55%));
  --gradient-bg: radial-gradient(ellipse at top, hsl(230 50% 12%) 0%, hsl(230 40% 4%) 60%);
  --gradient-card: linear-gradient(160deg, hsl(230 35% 12% / 0.85), hsl(230 40% 7% / 0.85));
  --gradient-rune: conic-gradient(from 0deg,
    hsl(188 95% 55% / 0.4), hsl(268 70% 55% / 0.4),
    hsl(42 95% 60% / 0.4), hsl(188 95% 55% / 0.4));

  --glow-primary: 0 0 30px hsl(188 100% 60% / 0.55), 0 0 60px hsl(188 100% 60% / 0.3);
  --glow-secondary: 0 0 30px hsl(280 90% 65% / 0.55), 0 0 60px hsl(280 90% 65% / 0.3);
  --glow-gold: 0 0 30px hsl(42 100% 60% / 0.55), 0 0 60px hsl(42 100% 60% / 0.3);
  --shadow-elevated: 0 20px 60px -10px hsl(230 80% 2% / 0.8);
}
```

### 4.2 Typography

- **Add:** `Cinzel` (weights 500/700/900) via `next/font/google` in `apps/web/src/app/(game)/layout.tsx`.
- Existing `Inter` remains body font.
- New utility class: `font-display` → Cinzel.

### 4.3 Tailwind Additions

Add to [apps/web/tailwind.config.js](apps/web/tailwind.config.js):

```js
fontFamily: {
  display: ['var(--font-cinzel)', 'serif'],
},
keyframes: {
  'float-slow': { /* … */ },
  'pulse-glow': { /* … */ },
  'fade-in-up': { /* … */ },
  'flicker': { /* … */ },
  'shake': { /* … */ },
  'hit-flash': { /* … */ },
  'slash': { /* … */ },
  'damage-pop': { /* … */ },
  'victory-burst': { /* … */ },
  'rune-spin': { to: { transform: 'rotate(360deg)' } },
},
animation: {
  'float-slow': 'float-slow 5s ease-in-out infinite',
  /* … 1:1 with above */
},
```

### 4.4 Reusable Utility Classes

Move to `apps/web/src/styles/game-utilities.css` (imported only when `uiMode === 'game'`):

- `.panel` — glassmorphic card with `--gradient-card` + elevated shadow
- `.rune-ring` — pseudo-element conic-gradient halo with `rune-spin` animation
- `.scanlines` — subtle CRT scanline texture
- `.text-glow-primary | .text-glow-gold | .text-glow-violet`
- `.bg-gradient-primary | .bg-gradient-secondary | .bg-gradient-gold | .bg-gradient-card`
- `.glow-primary | .glow-secondary | .glow-gold`

These match the source `ai-adventure-island/src/index.css` line-for-line.

---

## 5. Route Map

### 5.1 New Routes (Web — desktop / large tablet)

```
/g/welcome                                          ← was /g (login + sign-up entry point)
/g/character                                        ← was /g/character (replaces UI; same path)
/g/dashboard                                        ← was /g/world (Realm Map)
/g/campaign/:slug                                   ← was /g/zone/:zoneId (Realm interior)
/g/campaign/:slug/prepare                           ← NEW (knowledge brief / boss preview)
/g/campaign/:slug/mission/:missionId/prep           ← was /g/mission/:missionId (lesson + practice)
/g/campaign/:slug/battle/:missionId                 ← was /g/battle/[battleId] (combat)
/g/campaign/:slug/shop                              ← NEW (KP shop scoped to a realm)
/g/shop                                             ← NEW (global KP shop)
/g/inventory                                        ← was /g/inventory (re-themed)
/g/victory                                          ← was /g/victory (kept; re-themed)
```

### 5.2 Mobile Mirror (`/m/*`)

Each `/g/*` route gets a corresponding `/m/*` page using the **same components** with mobile-first
sizing/density tweaks. Shared components live under `components/game/fantasy/` and accept a
`density?: 'compact' | 'comfortable'` prop where appropriate.

```
/m/welcome /m/character /m/dashboard
/m/campaign/:slug /m/campaign/:slug/prepare
/m/campaign/:slug/mission/:missionId/prep
/m/campaign/:slug/battle/:missionId
/m/campaign/:slug/shop /m/shop /m/inventory /m/victory
```

> **Note:** Per user direction (Q7), mobile is the eventual primary surface. New components are
> mobile-first by default; desktop layouts apply at `lg:` and above.

### 5.3 Redirects

- Legacy redirects (in `next.config.js`): `/g/world → /g/dashboard`, `/g/zone/:zoneId →
  /g/campaign/:slug` (resolved via `CAMPAIGN_SLUG_BY_ZONE`), `/g/mission/:missionId →
  /g/campaign/:slug/mission/:missionId/prep` (resolved by looking up zone of mission), `/g/battle/:battleId
  → /g/campaign/:slug/battle/:missionId` (lookup combat-session for mission).
- These keep deep links from outside (parent dashboards, emails, sharing) functional.

---

## 6. Component Inventory (Port Plan)

### 6.1 Components to Port from `ai-adventure-island/src/components/`

Target: `apps/web/src/components/game/fantasy/`

| Source | Target | Adaptation Needed |
|---|---|---|
| `game/Scene.tsx` | `fantasy/Scene.tsx` | Remove vanilla bg-image; accept Next/Image static imports |
| `game/Logo.tsx` | `fantasy/Logo.tsx` | Replace word "AI Quest" with Eureka brand variant |
| `game/GameButton.tsx` | `fantasy/GameButton.tsx` | None (port as-is, drop Lovable tagger) |
| `game/KpBadge.tsx` | `fantasy/KpBadge.tsx` | Bind to backend KP via TanStack Query |
| `game/AiTutorChat.tsx` | `fantasy/AiTutorChat.tsx` | Wire to existing AI gateway (NestJS), apply moderation |
| `NavLink.tsx` | `fantasy/NavLink.tsx` | Switch react-router-dom → Next `<Link>` |

### 6.2 Pages to Port from `ai-adventure-island/src/pages/`

Target: `apps/web/src/app/(game)/g/...` (App Router server/client component split applied)

| Source Page | Target Route | Notes |
|---|---|---|
| `Welcome.tsx` | `(game)/g/welcome/page.tsx` | Replace localStorage user with Firebase auth flow |
| `CharacterCreate.tsx` | `(game)/g/character/page.tsx` | Persist character to `users/{uid}.character` via API |
| `Dashboard.tsx` | `(game)/g/dashboard/page.tsx` | Pull campaigns from API; lock state from progress data |
| `CampaignDetail.tsx` | `(game)/g/campaign/[slug]/page.tsx` | Resolve slug via `CAMPAIGN_SLUG_BY_ZONE` |
| `PrepareForMission.tsx` | `(game)/g/campaign/[slug]/prepare/page.tsx` | Boss preview + KP recommendation |
| `MissionPrep.tsx` | `(game)/g/campaign/[slug]/mission/[missionId]/prep/page.tsx` | Lesson content from existing modules API |
| `Battle.tsx` | `(game)/g/campaign/[slug]/battle/[missionId]/page.tsx` | **Critical:** wire to Phase 15 combat API (init/complete) |
| `NotFound.tsx` | `(game)/g/not-found.tsx` | Re-themed |

### 6.3 Existing R3F Components to Park (NOT delete — feature-flag gated)

Move from `apps/web/src/components/game/` to `apps/web/src/components/game/_legacy_r3f/`:

```
CombatArena.tsx, ZombieCharacter.tsx, CombatHUD.tsx, QuestionCard.tsx (R3F-coupled
variant), DamageNumber.tsx, CombatIntroScreen.tsx, CombatVictoryScreen.tsx,
CombatDefeatScreen.tsx, CareerAttackEffect.tsx, CertificateScreen.tsx,
PlayerCharacter.tsx, ZoneInterior.tsx, MissionRoom.tsx, WorldMap.tsx
```

Update imports from existing `(game)/g/*` pages to point at `_legacy_r3f/*`. The existing pages
remain in place but are only rendered when `featureFlags.fantasyUi === false`.

> **Parking criterion:** code must compile, tests must pass, and a manual flag flip must show the
> R3F UI in dev. This is the A/B-test substrate.

### 6.4 Shared UI Primitives Needed

Audit which shadcn/ui primitives ai-adventure-island uses but Eureka does not yet have. Likely
already present (Eureka uses shadcn). Confirm: `card`, `button`, `dialog`, `progress`, `sonner`,
`tooltip`, `tabs`, `badge`. Any missing ones are added via `pnpm dlx shadcn-ui@latest add`.

---

## 7. State & Data Architecture

### 7.1 State Migration: Context → Zustand + Backend

ai-adventure-island uses a single `GameContext` with localStorage persistence. Eureka uses Zustand
+ TanStack Query. Mapping:

| ai-adventure-island Field | Eureka Destination |
|---|---|
| `user` | Existing Firebase auth (`useAuth()` hook) |
| `character` | New `users/{uid}.character` doc field; cached in `game-store` |
| `knowledgePoints`, `totalKnowledgeEarned` | New `inventories/{uid}` doc; cached in `inventory-store` |
| `completedLessons`, `watchedVideos` | Existing progress collection (`progress/{uid}`) |
| `ownedAbilities`, `ownedWeapons`, `equippedWeapon` | New `inventories/{uid}` sub-fields; cached in `inventory-store` |

### 7.2 New Zustand Stores

- `apps/web/src/stores/inventory-store.ts` — KP balance, owned abilities/weapons, equipped weapon,
  optimistic-update actions for buy/equip
- Existing `combat-store.ts` (Phase 15) — **extended** with `sparkCharges` field for KP economy
  Spark Strike mechanic
- Existing `game-store.ts` — **extended** with `character` slice mirrored from backend

### 7.3 Backend: New Modules & Endpoints

#### Module: `inventory` (NEW)

```
apps/api/src/modules/inventory/
  inventory.module.ts
  inventory.controller.ts
  inventory.service.ts
  shop-catalog.ts                   ← hardcoded catalog (abilities + weapons)
  dto/
    purchase-item.dto.ts
    equip-weapon.dto.ts
  inventory.controller.spec.ts
  inventory.service.spec.ts
```

**Endpoints:**

```
GET  /api/v1/inventory                 → InventoryDto { kp, totalKpEarned, ownedAbilityIds,
                                                        ownedWeaponIds, equippedWeaponId }
GET  /api/v1/shop/catalog              → ShopCatalogDto { abilities: ShopAbility[], weapons: ShopWeapon[] }
POST /api/v1/inventory/buy             → Body PurchaseItemDto { itemId, itemType }
                                        ← updates inventory atomically (KP debit + ownership credit)
POST /api/v1/inventory/equip           → Body EquipWeaponDto { weaponId | null }
```

#### Module: `users` — extend (existing)

- Extend GET/PUT `/api/v1/users/me/settings` with `uiMode: 'normal' | 'gamified'`.
- Extend GET/PUT `/api/v1/users/me/character` (NEW endpoint) — returns/saves the fantasy-class character.

#### Module: `tenants` (assume exists for B2B; create skeleton if not)

- New field: `tenants/{tenantId}.uiModeLock: { mode: 'normal' | 'gamified' | null, locked: boolean }`.
- Effective UI mode = `tenant.uiModeLock.locked ? tenant.uiModeLock.mode : user.uiMode`.

#### KP earning hook — extend existing module/lesson completion

Wherever progress is awarded today (e.g. `POST /api/v1/progress/lessons/:id/complete`), award KP
**only when the user's effective uiMode === 'gamified'** at the time of completion. Inject KP
amounts via a new const `KP_REWARDS: Record<EventType, number>` in `inventory.service.ts`.

> **Migration concern:** users completing lessons in normal mode do not earn KP. If they later
> switch to game mode, they start at 0 KP. This is intentional (gameplay loop balance), but PM
> should approve.

#### Phase 15 Combat module — UNCHANGED

`/api/v1/combat/init` and `/api/v1/combat/:battleId/complete` are reused as-is by the new Battle
page. The only frontend change is which UI consumes the responses.

### 7.4 Firestore Schema Additions

```
inventories/{userId}
  kp: number
  totalKpEarned: number
  ownedAbilityIds: string[]
  ownedWeaponIds: string[]
  equippedWeaponId: string | null
  updatedAt: Timestamp

users/{userId}.character (sub-object)
  name: string
  class: 'mage' | 'engineer' | 'rogue' | 'warrior'
  classColorHsl: string
  weaponName: string                  ← cosmetic narrative weapon
  createdAt: Timestamp

users/{userId}.uiMode: 'normal' | 'gamified'    ← default 'normal'

tenants/{tenantId}.uiModeLock
  mode: 'normal' | 'gamified' | null
  locked: boolean
```

**Security rules:** `inventories/{userId}` follows the same pattern as `users/{userId}` —
user can read/write own; admin SDK on backend. Standard CLAUDE.md rule #3 (userId filter)
applies.

---

## 8. Shared Types Additions

Append to `packages/shared-types/src/game.types.ts`:

```typescript
export type UiMode = 'normal' | 'gamified';

export type FantasyClass = 'mage' | 'engineer' | 'rogue' | 'warrior';

export interface FantasyCharacter {
  name: string;
  class: FantasyClass;
  classColorHsl: string;
  weaponName: string;
  createdAt: string;
}

export interface ShopAbility {
  id: string;
  name: string;
  icon: 'sword' | 'spark' | 'brain' | 'shield' | 'zap';
  damage: [min: number, max: number];
  cooldown: number;
  cost: number;          // KP cost
  description: string;
  unlockHintZoneId: ZoneId | null;
}

export interface ShopWeapon {
  id: string;
  name: string;
  bonusDamage: number;
  cost: number;
  description: string;
  unlockHintZoneId: ZoneId | null;
}

export interface Inventory {
  kp: number;
  totalKpEarned: number;
  ownedAbilityIds: string[];
  ownedWeaponIds: string[];
  equippedWeaponId: string | null;
}

/** Single source of truth for normal↔game zone naming */
export const CAMPAIGN_SLUG_BY_ZONE: Record<ZoneId, string> = {
  library:  'whispers',
  forge:    'echoes',
  citadel:  'glitches',
  academy:  'wraiths',
};

export const ZONE_BY_CAMPAIGN_SLUG: Record<string, ZoneId> = Object.fromEntries(
  Object.entries(CAMPAIGN_SLUG_BY_ZONE).map(([z, s]) => [s, z as ZoneId])
);

export const FANTASY_CLASS_BY_CAREER: Record<CareerArchetype, FantasyClass> = {
  astronaut: 'warrior', chef:      'warrior',
  doctor:    'mage',    teacher:   'mage',
  artist:    'rogue',   gamer:     'rogue',
  engineer:  'engineer', scientist:'engineer',
};
```

> **Note:** This change touches the same package whose runtime resolution we just stabilised
> (commit revert this morning). After adding these types, run `pnpm --filter @eureka-lab/shared-types
> build` so the API picks them up at runtime. ADR-001 (see §13) will codify this dev-loop
> requirement.

---

## 9. Mode Toggle UX & Settings

### 9.1 General Users (B2C)

- Settings page (`/settings`) gains a toggle: "Learning Mode" with two cards:
  - **Normal** (clean, classroom-style)
  - **Gamified** (cinematic fantasy adventure)
- Toggling persists to `users/{uid}.uiMode` via `PUT /api/v1/users/me/settings`.
- App layout reads the value via TanStack Query and sets `<html data-ui-mode="...">` so the CSS
  variable scope in §4.1 takes effect.
- Switching mode mid-session triggers a soft refresh (router push of current route, hard reload
  of layout-level data).

### 9.2 B2B Education Clients

- Tenant admin console (`/admin/tenant`) gains a "Default Learning Mode" section:
  - Mode picker + lock toggle.
  - When locked, **users cannot override**; the `/settings` toggle is hidden and replaced with
    "Mode is set by your school administrator".
- Effective-mode resolution lives in a backend service `UiModeResolver` so it's consistent
  across web, mobile, and any future server-rendered surface.

---

## 10. Mobile Strategy

### 10.1 Responsive-First Components

All `components/game/fantasy/*` are mobile-first. Desktop tweaks via Tailwind `lg:` and above.

### 10.2 Route Mirror

Each `/g/*` page has a thin `/m/*` counterpart that imports the same component with `density="compact"`
where applicable. The existing `(mobile)` layout handles bottom-tab navigation; in game mode the
bottom tabs become: **Realm Map · Battle · Shop · Inventory · Profile**.

### 10.3 Asset Performance

- Background images served from `/public/assets/game/` via `next/image` with `priority` on the
  current view's background only.
- Provide 2 sizes: `1024×768` (desktop) and `768×1024` (mobile portrait). Vite's source assets
  are 1024×768 — generate mobile crops at import time (a one-shot `scripts/generate-game-assets.ts`).

---

## 11. R3F Parking Strategy

1. `featureFlags.fantasyUi: boolean` added to [packages/shared-types/src/feature-flags.ts](packages/shared-types/src/feature-flags.ts).
2. Default: `true` in dev and staging, `false` in initial prod release (changed via Firestore
   remote config + UI mode setting overrides).
3. `(game)` route group's root layout reads the flag at render time:
   - `flag === true` → render new fantasy UI
   - `flag === false` → render legacy R3F UI from `_legacy_r3f/`
4. The legacy R3F code stays in the bundle but tree-shakes out when the flag is statically false
   at build time — for true bundle-size A/B testing later, switch to dynamic imports gated on the
   flag.
5. **Acceptance:** flipping the flag in dev round-trips the user from new UI back to R3F UI without
   data loss (combat-store and game-store handle both UIs).

---

## 12. Migration Order (Sequenced PRs)

Each step is a self-contained, mergeable PR (~4–8 files of meaningful change), feature-flag gated
where it touches user-visible state. Branches stack on `feature/phase-16-fantasy-ui`.

| # | PR Title | Owner | Depends On | Behind Flag? |
|---|----------|-------|------------|---|
| 1 | Add fantasy design tokens, Cinzel font, Tailwind keyframes, utility CSS | FE | — | No (CSS-only) |
| 2 | Add `featureFlags.fantasyUi`, ADR-001 + ADR-002 | ARCH | — | n/a |
| 3 | Add shared types: `UiMode`, `FantasyClass`, mappings, `Inventory`, `ShopAbility`, `ShopWeapon` | ARCH | 2 | n/a |
| 4 | Backend: `inventory` module (controller, service, DTOs, catalog, tests) | BE | 3 | No (no UI consumes yet) |
| 5 | Backend: extend `users` with `uiMode` + character endpoints; tenant `uiModeLock` | BE | 3 | No |
| 6 | Backend: KP-on-completion hook (gated on effective uiMode) | BE | 4, 5 | No |
| 7 | FE: `inventory-store` + `useUiMode()` hook | FE | 4, 5 | No |
| 8 | FE: parking — move R3F components to `_legacy_r3f/`, update imports, all tests pass | FE | — | No |
| 9 | FE: Welcome page (port + Firebase auth wiring) | FE | 1, 7 | Yes |
| 10 | FE: Character creation page | FE | 9 | Yes |
| 11 | FE: Dashboard page (Realm Map) | FE | 10 | Yes |
| 12 | FE: Campaign Detail + Prepare-For-Mission pages | FE | 11 | Yes |
| 13 | FE: Mission Prep page (lesson content reuse) | FE | 12 | Yes |
| 14 | FE: Shop page (global + per-realm) | FE | 7, 11 | Yes |
| 15 | FE: Battle page (port + wire to Phase 15 combat API) | FE | 13 | Yes |
| 16 | FE: Inventory page re-theme | FE | 7 | Yes |
| 17 | FE: Victory + NotFound re-themes | FE | 11 | Yes |
| 18 | FE: Mobile mirror — `/m/*` pages | FE | 9–17 | Yes |
| 19 | FE: Settings UI mode toggle (B2C) | FE | 5, 7 | No |
| 20 | FE: Tenant admin UI mode lock (B2B) | FE | 5 | No |
| 21 | DEVOPS: feature flag plumbing in CI; staging promotion playbook | DEVOPS | 2 | n/a |
| 22 | QA: Playwright suite for end-to-end gamified flow | QA | 9–18 | Tested both flag states |
| 23 | DOCS + Asset import (Lovable JPG/PNG) | ARCH | — | n/a |
| 24 | Production rollout: enable flag for 5% → 25% → 100% over 2 weeks | DEVOPS | All above | n/a |

**Estimated calendar time:** 6–8 weeks with two FE devs in parallel after step 8 lands.

---

## 13. ADRs to Author (ARCH-owned, in `docs/context/`)

I will write these as separate files once this plan is approved by you and PM:

| ID | Title | Captures |
|---|---|---|
| **ADR-001** | shared-types runtime resolution (dist vs src) | Today's revert; forbids `main`/`default` pointing to `.ts` source |
| **ADR-002** | Gamified UI paradigm (fantasy 2D adopted; R3F parked) | Why we replaced R3F + the A/B-test commitment |
| **ADR-003** | KP economy data model & ownership | Why inventory lives in its own collection; why KP is gameplay-mode-conditional |
| **ADR-004** | UI mode resolution (user pref vs tenant lock) | The `UiModeResolver` precedence rule |
| **ADR-005** | Narrative & class mapping | Locks the zone↔realm↔boss and career↔class mappings to prevent drift |

---

## 14. Acceptance Criteria

This phase is DONE when ALL the following hold (extends CLAUDE.md §8 Definition of Done):

- [ ] All 24 PRs above merged
- [ ] Five ADRs written and committed
- [ ] `planning/api-contracts.md` updated with new inventory + character endpoints
- [ ] Feature flag `fantasyUi` toggles cleanly between new UI and legacy R3F with no data loss
- [ ] Playwright suite covers: welcome → character → dashboard → campaign → mission prep →
      battle (win) → battle (lose) → shop (buy ability) → equip weapon → battle (use bought ability)
- [ ] All new strings extracted to `locales/en.json` (Arabic/French stub files exist with same keys
      but English values, marked `// TODO: translate` per CLAUDE.md §8)
- [ ] No `console.log`, no `any`, all files <300 lines (CLAUDE.md rules #6, #8, #9)
- [ ] Backend KP-grant pipeline passes a unit test that asserts **zero KP** is granted when
      `effectiveUiMode === 'normal'` (gameplay invariant)
- [ ] All AI-tutor calls in fantasy mode go through the existing moderation pipeline (CLAUDE.md
      rule #4 + #11)
- [ ] B2B tenant lock test: a child user under a locked tenant cannot toggle UI mode in `/settings`
- [ ] Bundle size delta documented in PR #15 description; goal is <80 KB gzip increase to default
      route bundle (most fantasy CSS is layout-scoped)
- [ ] Lighthouse mobile score for `/m/dashboard` ≥ 90 performance
- [ ] Manual smoke test on iOS Safari + Android Chrome before flag enablement

---

## 15. Open Decisions (Need Confirmation Before Implementation)

| # | Question | Why It Matters | My Recommendation |
|---|---|---|---|
| 1 | Career→Class mapping in §3.2 | Locks user-facing identity; rename later requires migration | Adopt as proposed |
| 2 | Realm slugs in §3.1 (`whispers`, `echoes`, `glitches`, `wraiths`, `void`) | Become permanent URLs | Adopt as proposed |
| 3 | Should `/g/welcome` be the auth screen or do we keep `(auth)/login` and only show `/g/welcome` for in-mode landing? | Affects auth flow for first-time users entering game mode | **Keep existing `(auth)/login`**; redirect post-login to `/g/dashboard` if `uiMode === 'gamified'` |
| 4 | KP earn/spend rates (initial values) | Game-balance — too cheap = trivial; too expensive = grindy | Defer to BE PR #6 with PM input; ship with a config file we can tune from Firestore |
| 5 | Do parents see fantasy mode in the parent dashboard? | Parental UI scope | **No** — parent dashboards stay normal mode regardless of child preference |
| 6 | Existing Phase 15 certificate (final boss) — keep design? | Carryover artifact | **Keep**, re-theme card with fantasy frame |

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fantasy theme too dark/violent for younger users (8–10) | Med | High | Soften copy ("Babble Zombie" → cartoonish, no blood, no skulls outside stylized icon); user-test with cohort before flag enablement |
| Mobile performance: gradient backgrounds + glow shadows on low-end Android | Med | Med | Use `prefers-reduced-motion` to disable rune-spin & pulse-glow; CSS `containment` on panels |
| KP economy invites grinding instead of learning | Med | Med | Cap KP earn per day; require zone diversity for high-tier items |
| R3F + new fantasy code in same bundle inflates JS payload | High | Low | Dynamic import of `_legacy_r3f/*` based on flag (PR #21 task) |
| Two parallel UIs double QA cost | High | Med | Playwright matrix run with `fantasyUi=true` and `fantasyUi=false`; share most assertions |
| Lovable assets have unclear license, we ship to production | Low | High | Replace with commissioned art before public B2B rollout (track as DEVOPS issue) |
| Mode-toggle mid-session breaks ongoing combat | Low | High | Disable toggle while `combatStore.phase !== 'idle'`; show "Finish your battle first" toast |

---

## 17. Files Touched (Summary for PM Task Sizing)

**New files (~50):**
- 11 page files in `(game)/g/*` and 11 mirror in `(mobile)/m/*`
- 6 ported components in `components/game/fantasy/*`
- 2 new Zustand stores
- 1 inventory backend module (controller + service + catalog + 2 DTOs + 2 specs)
- 5 ADR markdown files
- 1 utility CSS file, 1 asset import script
- 1 updated `tailwind.config.js`, 1 updated `globals.css`, 1 updated `feature-flags.ts`,
  1 updated `game.types.ts`

**Modified files (~20):**
- API: users module (settings + character endpoints), tenants module, progress hook
- FE: settings page, layout (data-ui-mode attribute), api-client (new endpoints)
- Existing R3F components: import-path bumps to `_legacy_r3f/*`
- `next.config.js`: redirects for legacy `/g/world`, `/g/zone/*` etc.

**Moved (parked, not deleted):**
- ~14 R3F components → `_legacy_r3f/`

---

## 18. Assumptions Made by This Plan

If any are wrong, please flag — they affect specific sections:

1. The existing Phase 15 combat backend (`/api/v1/combat/init`, `/complete`) is **stable and complete**.
   The new Battle page consumes it unchanged.
2. `tenants/` collection exists or can be created; B2B accounts are already a modeled concept.
3. The existing `(auth)` flow handles email/password + OAuth; we don't need to rebuild it for fantasy mode.
4. Parent-controlled accounts can have multiple children with **independent** UI mode preferences.
5. CLAUDE.md rule #14 token budgets are unchanged by this phase (no new AI calls beyond AI Tutor, which already exists).
6. The legacy R3F UI keeps working in production for at least 60 days post-rollout for A/B observation.

---

*Phase 16 redesign — v1.0 — 2026-04-25 — ARCH agent*
