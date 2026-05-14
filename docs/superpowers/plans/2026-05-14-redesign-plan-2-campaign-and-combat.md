# Eureka Lab Redesign — Plan 2 of N: Campaign + Combat + Inventory + Shop + Victory

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the learner loop on top of Plan 1's foundation. After this plan, a signed-in learner can pick a campaign, browse the Academy hub, take a warm-up quiz, fight a 2D turn-based battle, see a victory or defeat screen, manage inventory, buy/equip from the shop, and reach the final-boss certificate. The four review-finding fixes carried over from Plan 1 (R2 character-gate race, R3 backend-wired buy/equip, R4 useAuth unmount guard, R5 minor-account signup) land in this plan too.

**Architecture:** Five new learner pages (`campaign/[slug]`, `campaign/[slug]/prepare`, `campaign/[slug]/mission/[missionId]/prep`, `campaign/[slug]/battle/[missionId]`, `inventory`, `shop`, `victory`) plus a re-skin of the standalone `/login` and `/signup`. The battle screen is split into 4 files (page + stage + quiz + outcome) per CLAUDE.md rule #8. The `useGame()` adapter grows academy-progress methods (`completeLesson`, `watchVideo`, etc.) backed by a new in-memory `academy-progress-store`. Shop purchases route through real backend `inventoryApi.purchaseItem` / `equipWeapon` calls (resolves R3). KP awards from lessons/videos/battles remain optimistic-local for Plan 2 — server-side KP-credit + hybrid combat validation are explicit Plan 3 deliverables.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS v4 (config in `globals.css`), Zustand, TanStack Query (unused this plan), Firebase Auth + Firestore, NestJS + Fastify backend, Pino logging, Sonner toaster, lucide-react icons, Framer-style CSS keyframes (already added in Plan 1).

**Spec:** [docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md](../specs/2026-05-09-redesign-from-reference-design.md) — sections 5.1, 5.4, 5.6, 5.7, 5.8, 6, 7, 9.

**Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, canonical visual source — DO NOT modify).

**Plan-1 review findings landing here:**
- **R2** — `(learner)/layout.tsx` character-gate races with in-flight hydrate (Phase A.5).
- **R3** — `useGame().buyAbility/buyWeapon` are optimistic-local; wire to backend (Phase A.3 + A.4).
- **R4** — `useAuth` lacks unmount guard for async `onAuthStateChanged` (Phase A.6).
- **R5** — Welcome hardcodes `role:'parent'`; inventory `@Roles` broadened with TODO. **BLOCKED on user spec clarification** (Phase F.0).

**Out of scope (covered by Plan 3+):**
- Backend hybrid combat validation (server replays play log against seeded RNG) — spec §5.6 + task P3-07.
- Backend KP-credit endpoints for lesson / video / battle XP awards — Plan 2 keeps these optimistic-local with a clear deferred TODO.
- Persistent academy progress across sessions (`completedLessons`, `watchedVideos`) — in-memory only for Plan 2.
- Adult-facing pages re-skin (parent / teacher / settings / pricing / achievements / checkout).
- i18n re-key from `Phase16*` namespaces to flat namespaces; Plan 2 ships hardcoded English with `TODO(plan-3-i18n)` markers.
- RTL Arabic display font binding (Amiri to `html[dir="rtl"] .font-display`).
- E2E suite rewrite (`apps/web/e2e/learner-flow.spec.ts`).

---

## Pre-flight

This plan executes on the **existing** `redesign/v2-from-reference` branch (no new branch — Plan 2 is a continuation of Plan 1's PR #8). The branch should already be ahead of `main` by 25 commits (Plan 1's 24 + the standalone `useAuth` 404 sign-out fix).

- [ ] **Pre-flight Step 1: Confirm branch + working tree**

Run: `git status` and `git rev-parse --abbrev-ref HEAD`

Expected: branch `redesign/v2-from-reference`, working tree shows only `.claude/settings.local.json` and `apps/web/tsconfig.tsbuildinfo` as modified (both gitignored-equivalent local artifacts — leave alone). No `apps/web/src/hooks/useAuth.ts` diff (it was committed standalone before Plan 2 began).

- [ ] **Pre-flight Step 2: Confirm commit count ahead of main**

Run: `git rev-list --count main..HEAD`

Expected: `25`.

- [ ] **Pre-flight Step 3: Confirm reference project is reachable**

Run: `ls "C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages"`

Expected: lists `Battle.tsx`, `CampaignDetail.tsx`, `CharacterCreate.tsx`, `Dashboard.tsx`, `MissionPrep.tsx`, `NotFound.tsx`, `PrepareForMission.tsx`, `Welcome.tsx`. If missing, escalate — do not proceed.

- [ ] **Pre-flight Step 4: Confirm dev servers can start**

Run, in two terminals:
```powershell
pnpm --filter @eureka-lab/api dev
pnpm --filter @eureka-lab/web dev
```

Expected: API on `http://localhost:3011`, web on `http://localhost:3010`. Open the web URL — `/` should render the fantasy Welcome page from Plan 1. Kill both dev servers before continuing.

---

## Phase A — State + wiring fixes

This phase lands the four Plan-1 review-finding fixes (R2/R3/R4 — R5 deferred to Phase F) plus the new `academy-progress-store` and the missing `inventoryApi` methods. These all need to be in place before the page work in Phases B–D, because the new pages depend on them.

### Task A.1: Extend `inventoryApi` with `purchaseItem`, `equipWeapon`, `getCatalog`

**Files:**
- Modify: `apps/web/src/lib/api-client.ts:874-880` (the existing `inventoryApi` block)

The backend `InventoryController` already exposes `POST /inventory/buy`, `POST /inventory/equip`, and `GET /shop/catalog` (verified at `apps/api/src/modules/inventory/inventory.controller.ts`). The frontend `inventoryApi` only has `getMine()`. Add the three missing methods.

- [ ] **Step 1: Read the current `inventoryApi` block**

Read [apps/web/src/lib/api-client.ts](../../../apps/web/src/lib/api-client.ts) lines 871–880 to confirm shape.

- [ ] **Step 2: Add the three missing methods**

Replace the existing `inventoryApi` block (lines 873–880) with:

```ts
/* ── Inventory API ─────────────────────────────────────────────── */

/** Body shape for `POST /inventory/buy`. Mirrors the backend `PurchaseItemDto`. */
interface PurchaseItemBody {
  itemId: string;
  itemType: 'ability' | 'weapon';
}

/** Body shape for `POST /inventory/equip`. `weaponId: null` unequips. */
interface EquipWeaponBody {
  weaponId: string | null;
}

/** Inventory + shop API endpoints. */
export const inventoryApi = {
  /**
   * Fetch the authenticated user's full inventory (kp, owned items, equipped weapon).
   * @returns The Inventory document from `inventories/{uid}`.
   */
  getMine: () => request<Inventory>('/inventory'),

  /**
   * Fetch the hardcoded shop catalog (abilities + weapons).
   * @returns The full ShopCatalog the backend exposes.
   */
  getCatalog: () => request<ShopCatalog>('/shop/catalog'),

  /**
   * Purchase an ability or weapon. Backend runs an atomic Firestore transaction
   * that deducts KP, appends to the owned list, and returns the new inventory.
   * @param body - itemId + itemType ('ability' | 'weapon')
   * @returns Updated Inventory (use to call `setInventory` on the store).
   */
  purchaseItem: (body: PurchaseItemBody) =>
    request<Inventory>('/inventory/buy', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * Equip a weapon (or unequip with `weaponId: null`). Backend validates
   * ownership before mutating.
   * @param body - weaponId to equip, or null to unequip
   * @returns Updated Inventory.
   */
  equipWeapon: (body: EquipWeaponBody) =>
    request<Inventory>('/inventory/equip', { method: 'POST', body: JSON.stringify(body) }),
};
```

Add `ShopCatalog` to the `import type` block at the top of the file (currently imports `Inventory` from `@eureka-lab/shared-types` on line 35) by inserting `ShopCatalog,` next to `Inventory,`.

Add `ShopCatalog` to the `export type { … }` block at the bottom of the file (currently re-exports `Inventory` near line 968) by inserting `ShopCatalog,` next to `Inventory,`.

- [ ] **Step 3: Verify `ShopCatalog` is exported by `@eureka-lab/shared-types`**

Run the Grep tool:
- Pattern: `export.*ShopCatalog`
- Path: `packages/shared-types/src`

Expected: a hit in `packages/shared-types/src/gameplay.types.ts` (or `phase16.types.ts` if rename hasn't propagated). If it isn't exported, add `export type { ShopCatalog }` to `packages/shared-types/src/index.ts` and rebuild:

```powershell
pnpm --filter @eureka-lab/shared-types build
```

- [ ] **Step 4: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "api-client" -SimpleMatch | Select-Object -First 20
```

Expected: no new errors (pre-existing test-file errors are OK per Plan 1 gotcha #10).

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/lib/api-client.ts packages/shared-types/src/index.ts
git commit -m "feat(api-client): add inventoryApi.purchaseItem / equipWeapon / getCatalog

Backend endpoints already exist on InventoryController; frontend only had
getMine(). Wiring these unlocks real shop buy/equip in Plan 2 (resolves R3
optimistic-local issue from Plan 1 review).
"
```

---

### Task A.2: Create `academy-progress-store` (in-memory Zustand)

**Files:**
- Create: `apps/web/src/stores/academy-progress-store.ts`
- Create: `apps/web/src/stores/academy-progress-store.test.ts`

In-memory only — no localStorage, no backend (per spec §5.4 "no localStorage mirror" and the explicit Plan 2 scope decision that backend academy-progress persistence is Plan 3+ work). Page reload clears completed-lesson and watched-video state. KP earned from lessons/videos still flows through `useGame().addKnowledge` (which is `useInventoryStore.addKp`) — that side stays optimistic-local until Plan 3 ships a backend KP-credit endpoint.

- [ ] **Step 1: Write the test first**

Create `apps/web/src/stores/academy-progress-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademyProgressStore } from './academy-progress-store';

describe('academy-progress-store', () => {
  beforeEach(() => useAcademyProgressStore.getState().reset());

  it('starts with empty arrays', () => {
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual([]);
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual([]);
  });

  it('completeLesson adds id to the list (idempotent)', () => {
    useAcademyProgressStore.getState().completeLesson('lesson-prompts-1');
    useAcademyProgressStore.getState().completeLesson('lesson-prompts-1');
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual(['lesson-prompts-1']);
  });

  it('watchVideo adds id to the list (idempotent)', () => {
    useAcademyProgressStore.getState().watchVideo('vid-prompts-1');
    useAcademyProgressStore.getState().watchVideo('vid-prompts-1');
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual(['vid-prompts-1']);
  });

  it('reset clears both lists', () => {
    useAcademyProgressStore.getState().completeLesson('a');
    useAcademyProgressStore.getState().watchVideo('b');
    useAcademyProgressStore.getState().reset();
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual([]);
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```powershell
pnpm --filter @eureka-lab/web exec vitest run src/stores/academy-progress-store.test.ts
```

Expected: FAIL — `Cannot find module './academy-progress-store'`.

- [ ] **Step 3: Implement the store**

Create `apps/web/src/stores/academy-progress-store.ts`:

```ts
'use client';

import { create } from 'zustand';

/**
 * In-memory academy progress: which lessons the user has completed and which
 * mock videos they've watched in this session. NOT persisted — page reload
 * resets to empty. Backend persistence is a Plan 3 deliverable.
 */
interface AcademyProgressState {
  completedLessonIds: string[];
  watchedVideoIds: string[];
  /** Mark a lesson as completed (idempotent). */
  completeLesson: (lessonId: string) => void;
  /** Mark a video as watched (idempotent). */
  watchVideo: (videoId: string) => void;
  /** Clear both lists — typically called on logout. */
  reset: () => void;
}

export const useAcademyProgressStore = create<AcademyProgressState>((set, get) => ({
  completedLessonIds: [],
  watchedVideoIds: [],
  completeLesson: (lessonId) => {
    if (get().completedLessonIds.includes(lessonId)) return;
    set({ completedLessonIds: [...get().completedLessonIds, lessonId] });
  },
  watchVideo: (videoId) => {
    if (get().watchedVideoIds.includes(videoId)) return;
    set({ watchedVideoIds: [...get().watchedVideoIds, videoId] });
  },
  reset: () => set({ completedLessonIds: [], watchedVideoIds: [] }),
}));
```

- [ ] **Step 4: Run the test — expect it to pass**

```powershell
pnpm --filter @eureka-lab/web exec vitest run src/stores/academy-progress-store.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/stores/academy-progress-store.ts apps/web/src/stores/academy-progress-store.test.ts
git commit -m "feat(state): add academy-progress-store for completedLessons + watchedVideos

In-memory only (no localStorage, no backend). Backend persistence of academy
progress + KP-credit flow is a Plan 3 deliverable; Plan 2 keeps lesson/video
state transient so the Academy hub UI can light up green checkmarks within
a single session.
"
```

---

### Task A.3: Wire `useGame()` adapter — academy methods + backend-backed buy/equip

**Files:**
- Modify: `apps/web/src/state/game-context.tsx` (the entire file — re-shape the adapter)

This task does two things at once because they share the same surface area:
1. Add the 4 academy methods (`completeLesson`, `watchVideo`, `completedLessons`, `watchedVideos`) so PrepareForMission can paste in unchanged.
2. Convert `buyAbility`, `buyWeapon`, `equipWeapon` from optimistic-local to backend-backed via `inventoryApi.purchaseItem` / `equipWeapon` (resolves Plan 1 review finding **R3**).

The functions stay synchronous-returning-boolean to preserve the reference's call sites (`if (game.buyAbility(id, cost)) toast.success(...)`). The backend call happens fire-and-forget; the optimistic-local mutation runs first and the hydrate that follows reconciles authoritative state.

- [ ] **Step 1: Update the imports + interfaces**

Open `apps/web/src/state/game-context.tsx`. Add imports near the top:

```ts
import { inventoryApi } from '@/lib/api-client';
import { useAcademyProgressStore } from '@/stores/academy-progress-store';
```

- [ ] **Step 2: Extend `GameStateView`**

Inside the `interface GameStateView` block, add two new fields:

```ts
/** Lesson IDs the user has completed in this session. */
completedLessons: string[];
/** Video IDs the user has watched in this session. */
watchedVideos: string[];
```

- [ ] **Step 3: Extend `GameStateActions`**

Inside the `interface GameStateActions` block, add two new methods:

```ts
/**
 * Mark a lesson as completed and credit KP optimistically.
 * Backend persistence is deferred to Plan 3 — KP delta will not survive
 * a hydrate from `inventoryApi.getMine()` until then.
 */
completeLesson: (lessonId: string, kp: number) => void;
/**
 * Mark a video as watched and credit KP optimistically.
 * Same Plan 3 caveat as completeLesson.
 */
watchVideo: (videoId: string, kp: number) => void;
```

Update the JSDoc on the existing `buyAbility` and `buyWeapon` to remove the "optimistic-local" misdirection — replace with:

```ts
/**
 * Buy an ability if the user can afford it. Issues a backend
 * `POST /inventory/buy` then re-hydrates from `inventoryApi.getMine()`.
 * The optimistic-local mutation runs first so the UI updates immediately.
 *
 * @returns true when the user now owns the ability (already-owned counts).
 */
buyAbility: (id: string, cost: number) => boolean;
/**
 * Buy a weapon if the user can afford it. Issues a backend
 * `POST /inventory/buy`. Auto-equips the first weapon owned via
 * a follow-up `POST /inventory/equip`.
 *
 * @returns true when the user now owns the weapon.
 */
buyWeapon: (id: string, cost: number) => boolean;
/**
 * Equip a weapon (or unequip with `null`). Issues a backend
 * `POST /inventory/equip` after the optimistic-local update.
 */
equipWeapon: (id: string | null) => void;
```

- [ ] **Step 4: Wire the new state into the hook return**

Replace the body of `useGame()` so the `// View` and `// Actions` blocks read like this. Show the full new function so an executing engineer can paste it cleanly:

```ts
export function useGame(): GameStateView & GameStateActions {
  const authUser = useAuthStore((s) => s.user);
  const inv = useInventoryStore();
  const character = useCharacterStore((s) => s.character);
  const setCharacterStore = useCharacterStore((s) => s.setCharacter);
  const resetCharacter = useCharacterStore((s) => s.reset);
  const resetInventory = useInventoryStore((s) => s.reset);
  const academy = useAcademyProgressStore();
  const resetAcademy = useAcademyProgressStore((s) => s.reset);
  const { logout } = useAuth();

  const userView = authUser
    ? { username: authUser.displayName ?? authUser.email ?? 'Hero', email: authUser.email ?? '' }
    : null;

  /**
   * Fire-and-forget backend hydrate after a mutation. Swallows errors so a
   * transient network failure doesn't trigger an unhandled rejection.
   */
  const hydrateInventoryFireAndForget = () => {
    void inv.hydrate().catch(() => { /* offline tolerance */ });
  };

  return {
    // ── View ─────────────────────────────────────────────
    user: userView,
    character,
    knowledgePoints: inv.kp,
    totalKnowledgeEarned: inv.totalKpEarned,
    ownedAbilities: inv.ownedAbilityIds,
    ownedWeapons: inv.ownedWeaponIds,
    equippedWeapon: inv.equippedWeaponId,
    completedLessons: academy.completedLessonIds,
    watchedVideos: academy.watchedVideoIds,

    // ── Actions ──────────────────────────────────────────
    setCharacter: (c) => { void setCharacterStore(c); },
    addKnowledge: (amount) => inv.addKp(amount),
    spendKnowledge: (amount) => {
      if (inv.kp < amount) return false;
      inv.spendKp(amount);
      return true;
    },
    completeLesson: (lessonId, kp) => {
      if (academy.completedLessonIds.includes(lessonId)) return;
      academy.completeLesson(lessonId);
      inv.addKp(kp);
      // TODO(plan-3): POST /api/v1/academy/lesson-complete to persist server-side.
    },
    watchVideo: (videoId, kp) => {
      if (academy.watchedVideoIds.includes(videoId)) return;
      academy.watchVideo(videoId);
      inv.addKp(kp);
      // TODO(plan-3): POST /api/v1/academy/video-watched to persist server-side.
    },
    buyAbility: (id, cost) => {
      if (inv.ownedAbilityIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      // Optimistic-local first so the UI updates immediately.
      inv.spendKp(cost);
      inv.addAbility(id);
      // Authoritative server mutation + reconciling hydrate.
      void inventoryApi
        .purchaseItem({ itemId: id, itemType: 'ability' })
        .then((updated) => inv.setInventory(updated))
        .catch(() => hydrateInventoryFireAndForget());
      return true;
    },
    buyWeapon: (id, cost) => {
      if (inv.ownedWeaponIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      const shouldAutoEquip = inv.equippedWeaponId === null;
      inv.spendKp(cost);
      inv.addWeapon(id);
      if (shouldAutoEquip) inv.equipWeapon(id);
      void inventoryApi
        .purchaseItem({ itemId: id, itemType: 'weapon' })
        .then((updated) => inv.setInventory(updated))
        .then(() => {
          if (shouldAutoEquip) {
            return inventoryApi
              .equipWeapon({ weaponId: id })
              .then((updated) => inv.setInventory(updated));
          }
          return undefined;
        })
        .catch(() => hydrateInventoryFireAndForget());
      return true;
    },
    equipWeapon: (id) => {
      inv.equipWeapon(id);
      void inventoryApi
        .equipWeapon({ weaponId: id })
        .then((updated) => inv.setInventory(updated))
        .catch(() => hydrateInventoryFireAndForget());
    },
    reset: async () => {
      // Reset local snapshots BEFORE Firebase signOut so a fast re-login
      // can't briefly see the previous user's KP / character / academy state.
      resetCharacter();
      resetInventory();
      resetAcademy();
      await logout();
    },
  };
}
```

- [ ] **Step 5: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "game-context" -SimpleMatch | Select-Object -First 20
```

Expected: no errors in `game-context.tsx`.

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src/state/game-context.tsx
git commit -m "feat(state): wire useGame buy/equip to backend; add academy methods (R3)

Resolves Plan 1 review finding R3 — buyAbility/buyWeapon/equipWeapon now
call inventoryApi.purchaseItem and inventoryApi.equipWeapon after the
optimistic-local mutation, then reconcile by setting the authoritative
Inventory the backend returns. Fire-and-forget; UI does not block.

Adds completeLesson/watchVideo + completedLessons/watchedVideos backed
by the new academy-progress-store so PrepareForMission can paste in
from the reference unchanged. Backend persistence of academy progress
and KP-credit are explicit Plan 3 deliverables (TODO markers added).
"
```

---

### Task A.4: Fix `(learner)/layout.tsx` character-gate race (R2)

**Files:**
- Modify: `apps/web/src/app/(learner)/layout.tsx`
- Modify: `apps/web/src/stores/character-store.ts` — add `hasHydrated: boolean` flag

The current race: on first render after auth resolves, `character === null` because `hydrate()` hasn't completed. The redirect effect bounces the user to `/character` even when they have a character. Fix: add a `hasHydrated` flag the layout waits for before evaluating the gate.

- [ ] **Step 1: Add `hasHydrated` to the character store**

Open `apps/web/src/stores/character-store.ts`. Add a new field to the state interface:

```ts
/** True after the first hydrate() resolves (success or 404). */
hasHydrated: boolean;
```

In `initialState` block, add `hasHydrated: false,`. (Note: the current file uses inline state in `create()` — see Step 2 for the full replacement.)

Update `hydrate()` to set the flag:

```ts
hydrate: async () => {
  set({ isLoading: true });
  try {
    const c = await characterApi.get();
    set({ character: c });
  } catch {
    /* 404 is expected when the user has not created a character yet. */
  } finally {
    set({ isLoading: false, hasHydrated: true });
  }
},
```

Update `reset()` so logout clears the flag (so the next user's hydrate can re-arm the gate):

```ts
reset: () => set({ character: null, isLoading: false, hasHydrated: false }),
```

Also update `setCharacter` to flip `hasHydrated: true` (since a freshly-PUT character is just as "hydrated" as a fetched one, and PUT happens during signup before the first hydrate fires):

```ts
setCharacter: async (c) => {
  set({ character: c, isLoading: true, hasHydrated: true });
  try {
    await characterApi.put(c);
  } finally {
    set({ isLoading: false });
  }
},
```

Show the full updated file so the executor can paste cleanly:

```ts
'use client';

import { create } from 'zustand';
import { characterApi } from '@/lib/api-client';
import type { CharacterClass } from '@/data/game';

/** Character shape persisted server-side. Single source of truth for this type. */
export interface Character {
  /** Display name chosen by the player */
  name: string;
  /** Fantasy class (warrior, mage, rogue, engineer) */
  class: CharacterClass;
  /** HSL token string, e.g. "188 95% 60%" */
  color: string;
  /** Cosmetic narrative weapon name (display only) */
  weaponName: string;
}

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  /** True after the first hydrate() resolves (success or 404). Prevents the
   *  (learner)/layout.tsx character-gate from racing with in-flight hydrate. */
  hasHydrated: boolean;
  setCharacter: (c: Character) => Promise<void>;
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  isLoading: false,
  hasHydrated: false,

  setCharacter: async (c) => {
    set({ character: c, isLoading: true, hasHydrated: true });
    try {
      await characterApi.put(c);
    } finally {
      set({ isLoading: false });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const c = await characterApi.get();
      set({ character: c });
    } catch {
      /* 404 is expected when the user has not created a character yet. */
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },

  reset: () => set({ character: null, isLoading: false, hasHydrated: false }),
}));
```

- [ ] **Step 2: Update the existing character-store test for the new flag**

Open `apps/web/src/stores/character-store.test.ts`. Add three new test cases:

```ts
it('starts with hasHydrated=false', () => {
  expect(useCharacterStore.getState().hasHydrated).toBe(false);
});

it('setCharacter flips hasHydrated to true', async () => {
  await useCharacterStore.getState().setCharacter({
    name: 'Riven', class: 'warrior', color: '188 95% 60%', weaponName: 'Runeblade',
  });
  expect(useCharacterStore.getState().hasHydrated).toBe(true);
});

it('reset clears hasHydrated', async () => {
  await useCharacterStore.getState().setCharacter({
    name: 'X', class: 'mage', color: '0 0% 0%', weaponName: 'Y',
  });
  useCharacterStore.getState().reset();
  expect(useCharacterStore.getState().hasHydrated).toBe(false);
});
```

- [ ] **Step 3: Run the character-store tests**

```powershell
pnpm --filter @eureka-lab/web exec vitest run src/stores/character-store.test.ts
```

Expected: PASS (existing 3 + new 3 = 6 tests).

- [ ] **Step 4: Update `(learner)/layout.tsx` to wait for hasHydrated**

Open `apps/web/src/app/(learner)/layout.tsx`. Replace the entire file with:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCharacterStore } from '@/stores/character-store';
import { useInventoryStore } from '@/stores/inventory-store';

/**
 * Layout for the learner-facing routes: dashboard, character, campaign,
 * inventory, shop, victory. Single auth gate, hydrates character + inventory
 * from the backend on mount, and bounces anonymous users to / (NOT to /login —
 * the welcome page is auth).
 *
 * The character-gate redirect waits for `hasHydrated` so it does not race
 * with the in-flight `characterApi.get()` (Plan 1 review finding R2).
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hydrateCharacter = useCharacterStore((s) => s.hydrate);
  const hydrateInventory = useInventoryStore((s) => s.hydrate);
  const character = useCharacterStore((s) => s.character);
  const hasHydrated = useCharacterStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated) {
      void hydrateCharacter();
      void hydrateInventory();
    }
  }, [isAuthenticated, hydrateCharacter, hydrateInventory]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      hasHydrated &&
      character === null &&
      pathname !== '/character'
    ) {
      router.replace('/character');
    }
  }, [character, hasHydrated, isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) return null;

  return <>{children}</>;
}
```

- [ ] **Step 5: Manually verify the race is gone**

Start the dev servers (`pnpm --filter @eureka-lab/api dev` and `pnpm --filter @eureka-lab/web dev`). Sign in as an existing user with a character. Navigate to `/dashboard`. Watch the network tab — the `GET /users/me/character` request should resolve before any `/character` redirect fires. The dashboard should render without flicker.

Kill dev servers.

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src/stores/character-store.ts apps/web/src/stores/character-store.test.ts apps/web/src/app/\(learner\)/layout.tsx
git commit -m "fix(state): gate (learner) layout on character hasHydrated (R2)

Resolves Plan 1 review finding R2 — (learner)/layout.tsx redirect was
firing before characterApi.get() resolved, briefly bouncing existing
users to /character. Adds hasHydrated to character-store so the gate
only evaluates after the first hydrate completes (success or 404).
"
```

---

### Task A.5: Add unmount guard to `useAuth` (R4)

**Files:**
- Modify: `apps/web/src/hooks/useAuth.ts`

Current bug: `onAuthStateChanged` callback is `async`. If the hook unmounts mid-flight (route change during the in-flight `authApi.getMe()`), the trailing `setUser` / `clearUser` runs on an unmounted store consumer. React 18's strict-mode double-mount makes this firing twice in dev. Fix: track a `mountedRef` and skip state mutations after unmount.

- [ ] **Step 1: Update useAuth**

Open `apps/web/src/hooks/useAuth.ts`. Replace the file with:

```ts
'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook that manages Firebase auth state and syncs with the backend.
 * Listens for auth state changes, fetches the enriched profile from
 * the backend, and stores it in the Zustand auth store.
 *
 * Gracefully handles missing Firebase config (returns unauthenticated state).
 *
 * Mount-safety: an internal `mountedRef` skips setUser/clearUser after the
 * hook unmounts so an in-flight authApi.getMe() can't update an unmounted
 * consumer. Resolves Plan 1 review finding R4.
 *
 * @returns Auth state and actions
 */
export function useAuth() {
  const { user, isLoading, setUser, clearUser } = useAuthStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    /* If Firebase is not configured, mark as loaded and unauthenticated */
    if (!auth) {
      clearUser();
      return () => {
        mountedRef.current = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authApi.getMe();
          if (!mountedRef.current) return;
          setUser(profile);
        } catch (err) {
          if (!mountedRef.current) return;
          clearUser();
          // Orphan Firebase session (auth user exists but Firestore profile
          // doesn't): sign out so subsequent reloads don't replay the 404.
          // Network errors leave the session intact so a transient blip
          // doesn't log a legitimate user out.
          if (err instanceof ApiError && err.statusCode === 404 && auth) {
            await signOut(auth).catch(() => {});
          }
        }
      } else {
        if (!mountedRef.current) return;
        clearUser();
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [setUser, clearUser]);

  /**
   * Sign out from both Firebase and the backend.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort server logout */
    }
    if (auth) {
      await signOut(auth);
    }
    clearUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
```

- [ ] **Step 2: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "useAuth" -SimpleMatch | Select-Object -First 10
```

Expected: no errors in `useAuth.ts`.

- [ ] **Step 3: Commit**

```powershell
git add apps/web/src/hooks/useAuth.ts
git commit -m "fix(auth): unmount guard for onAuthStateChanged callback (R4)

Resolves Plan 1 review finding R4 — async callback inside
onAuthStateChanged was firing setUser/clearUser after the hook had
unmounted (most visible under React 18 strict-mode double-mount).
Tracks an mountedRef and short-circuits state updates after unmount.
"
```

---

### Task A.6: Delete the dead `(mobile)/` route group

**Files:**
- Delete: `apps/web/src/app/(mobile)/` (entire directory tree)

Plan 1 task 2.1 added a bulk redirect (`/m/:path*` → `/dashboard`) so the routes are dead — Next.js redirects fire before the route handler renders. The file tree still has them, dead-code-shaped. Spec §4.2 lists `app/(mobile)/**` for "removed by `git revert -m 1 58c9f25` automatically" but the revert didn't catch them because they predate the Phase 16 merge. Plan 1 gotcha #13 calls this out explicitly.

- [ ] **Step 1: Confirm the redirect is in place**

Open `apps/web/next.config.js`. Confirm the `redirects()` block contains:

```js
{ source: '/m/:path*', destination: '/dashboard', permanent: true },
```

If the redirect is missing, do not proceed — the old routes would become reachable again. Escalate to the user.

- [ ] **Step 2: Inspect what's in `(mobile)/`**

Run the Glob tool with pattern `apps/web/src/app/(mobile)/**/*` to list files. Expected: `layout.tsx`, `m/page.tsx`, `m/learn/page.tsx`, `m/learn/[moduleId]/page.tsx`, `m/ai/page.tsx`, `m/progress/page.tsx`, `m/profile/page.tsx`.

- [ ] **Step 3: Confirm no active route imports `(mobile)/`**

Run the Grep tool:
- Pattern: `from ['\"]@/app/\\(mobile\\)`
- Path: `apps/web/src`

Expected: no matches. (Route-group folders aren't normally imported from elsewhere; if there are matches, escalate.)

Also check for non-`@/`-relative imports:

Grep:
- Pattern: `app/\\(mobile\\)`
- Path: `apps/web/src`

Expected: no matches outside the `(mobile)/` folder itself.

- [ ] **Step 4: Delete the folder**

```powershell
Remove-Item -Recurse -Force apps/web/src/app/(mobile)
```

Confirm:

```powershell
Test-Path apps/web/src/app/(mobile)
```

Expected: `False`.

- [ ] **Step 5: Typecheck + build**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "mobile" -SimpleMatch | Select-Object -First 10
pnpm --filter @eureka-lab/web build 2>&1 | Select-String -Pattern "error" -SimpleMatch | Select-Object -First 20
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```powershell
git add -A apps/web/src/app
git commit -m "chore(routing): delete dead (mobile) route group

Phase 1 redirected /m/:path* -> /dashboard so these route handlers were
already unreachable. Spec §4.2 expected the Phase 16 revert to clean
this up but the routes predate that merge. Mentioned in Plan 1 handover
gotcha #13.
"
```

---

## Phase B — Campaign + Prep pages

The three reference pages (`CampaignDetail.tsx`, `PrepareForMission.tsx`, `MissionPrep.tsx`) port over with three mechanical adapter changes per file:

1. `import { Navigate, useNavigate, useParams } from "react-router-dom"` → use Next.js `useRouter`/`useParams`/conditional redirect via `router.replace`.
2. Asset imports (`import zombie from "@/assets/zombie.png"`) → public-folder string (`const zombie = '/assets/game/zombie.png'`).
3. Add `'use client';` directive at the top.
4. The `(learner)/layout.tsx` already auth-gates — drop the `if (!user) return <Navigate to="/" replace />` and `if (!character) return <Navigate to="/create" replace />` guards from each page (the layout owns them now).

A 5th change for components that need to render BEFORE the layout's hydrate completes: defensively `return null` if `character === null` (matches the `dashboard/page.tsx` pattern from Plan 1 task 2.7).

### Task B.1: Port `CampaignDetail.tsx` → `(learner)/campaign/[slug]/page.tsx`

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/page.tsx`

Reference source: `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\CampaignDetail.tsx`. Read the full file (already inspected in plan-writing — see the file directly when implementing).

- [ ] **Step 1: Create the directory + file**

```powershell
New-Item -ItemType Directory -Force apps/web/src/app/(learner)/campaign
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]"
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/(learner)/campaign/[slug]/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import Image from 'next/image';
import { ArrowLeft, Skull, Star, Crown, Swords, Brain, ShieldAlert } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CAMPAIGNS, CLASSES, type Mission } from '@/data/game';
import { ENEMY_STRENGTH, getKnowledgeAdvantage } from '@/data/academy';
import { useGame } from '@/state/game-context';

const zombie = '/assets/game/zombie.png';

const diffStyles: Record<Mission['difficulty'], string> = {
  easy: 'text-success border-success/40',
  medium: 'text-primary border-primary/40',
  hard: 'text-accent border-accent/40',
  elite: 'text-destructive border-destructive/50',
};

/**
 * Mission list for one campaign — header HUD, hero strip, mission cards with
 * difficulty + enemy-strength + outlook badges, and a "Open Academy" entry.
 *
 * Auth + character gating handled by `(learner)/layout.tsx`. We still defensively
 * return null if `character` is briefly absent (between hydrate and layout redirect).
 */
export default function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { character, totalKnowledgeEarned } = useGame();

  if (!character) return null;

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);
  if (!campaign) {
    router.replace('/dashboard');
    return null;
  }

  const klass = CLASSES.find((c) => c.id === character.class);
  if (!klass) return null;

  return (
    <Scene background={campaign.image}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> World Map
            </button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto mt-10 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-primary/80">{campaign.subtitle}</p>
          <h1 className="font-display text-4xl sm:text-6xl text-glow-primary mt-2">{campaign.name}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-sm sm:text-base">{campaign.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-3 panel px-5 py-3">
              <Skull className="h-5 w-5 text-destructive" />
              <div className="text-left">
                <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Final Boss</div>
                <div className="font-display text-lg text-glow-primary">{campaign.bossName}</div>
              </div>
            </div>
            <GameButton variant="gold" size="md" onClick={() => router.push(`/campaign/${campaign.slug}/prepare`)}>
              <Brain className="h-4 w-4" /> Open Academy
            </GameButton>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mt-10 grid gap-4">
          {campaign.missions.map((m, i) => {
            const isBoss = m.difficulty === 'elite';
            const enemyStrength = ENEMY_STRENGTH[m.id] ?? 100;
            const adv = getKnowledgeAdvantage(totalKnowledgeEarned, enemyStrength);
            const outlookTone =
              adv.label === 'underleveled' ? 'text-destructive' :
              adv.label === 'matched' ? 'text-accent' :
              'text-success';
            return (
              <article
                key={m.id}
                className="panel p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-in-up hover:border-primary/60 transition-all"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center overflow-hidden">
                    {isBoss ? (
                      <Crown className="h-10 w-10 text-destructive animate-pulse-glow" />
                    ) : (
                      <Image
                        src={zombie}
                        alt=""
                        width={80}
                        height={80}
                        className="h-20 w-20 object-contain animate-float-slow"
                      />
                    )}
                  </div>
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground text-xs font-display flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.7)]">
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-xl text-glow-primary">{m.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-[0.25em] uppercase ${diffStyles[m.difficulty]}`}>
                      {m.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-accent" /> {m.xp} XP</span>
                    <span className="flex items-center gap-1.5"><Swords className="h-3.5 w-3.5 text-primary" /> {m.zombieCount} foes</span>
                    <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Strength {enemyStrength}</span>
                    <span className={`flex items-center gap-1.5 ${outlookTone}`}>
                      <Brain className="h-3.5 w-3.5" /> {adv.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-44">
                  <GameButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/campaign/${campaign.slug}/mission/${m.id}/prep`)}
                  >
                    <Brain className="h-4 w-4" /> Prepare for Mission
                  </GameButton>
                  <GameButton
                    variant={isBoss ? 'gold' : 'primary'}
                    size="sm"
                    onClick={() => router.push(`/campaign/${campaign.slug}/battle/${m.id}`)}
                  >
                    {isBoss ? 'Challenge Boss' : 'Begin Mission'}
                  </GameButton>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "campaign" -SimpleMatch | Select-Object -First 10
```

Expected: no errors in the new file.

- [ ] **Step 4: Smoke verify**

Start dev servers. Sign in, hit `/dashboard`, click any unlocked campaign card → should land on `/campaign/<slug>` and render the mission list. The "Open Academy" and "Prepare for Mission" buttons go to placeholder routes that 404 until Tasks B.2 + B.3 land. That's expected.

Kill dev servers.

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/src/app/(learner)/campaign"
git commit -m "feat(campaign): port CampaignDetail mission list page

Direct port of ai-adventure-island/src/pages/CampaignDetail.tsx with
Next.js adapter changes: useNavigate -> useRouter, useParams -> use(params),
img -> next/image, asset imports -> public/-relative strings, dropped the
explicit user/character guards (handled by (learner)/layout.tsx).
"
```

---

### Task B.2: Port `PrepareForMission.tsx` → `(learner)/campaign/[slug]/prepare/page.tsx`

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/prepare/page.tsx`

Reference source: `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\PrepareForMission.tsx`. Same adapter pattern as B.1 + the inline `Modal` and `EmptyState` helper components stay in the file (they're page-private and small enough not to extract).

This page is the largest port in the plan — ~360 LOC for the reference. Keep within CLAUDE.md rule #8 (300-line limit) by extracting `Modal` and `EmptyState` into sibling files.

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/prepare"
```

- [ ] **Step 2: Extract `Modal` to a sibling file**

Create `apps/web/src/app/(learner)/campaign/[slug]/prepare/_modal.tsx`:

```tsx
'use client';

/**
 * Page-private overlay used by PrepareForMission for lesson + video deep-dives.
 * Backdrop click closes; clicks on the panel itself stop propagation.
 */
export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="panel max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Page-private empty-state placeholder for the lessons / videos tabs.
 */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="panel p-8 text-center text-sm text-muted-foreground col-span-full">
      {text}
    </div>
  );
}
```

The leading `_` keeps Next.js's App Router from treating it as a route segment (the convention is `_private/`; `_modal.tsx` works the same — Next.js skips files starting with `_`).

- [ ] **Step 3: Write the page**

Create `apps/web/src/app/(learner)/campaign/[slug]/prepare/page.tsx`. The reference's PrepareForMission.tsx file is the source — copy verbatim, then apply the adapter rules:

1. `'use client';` at the top.
2. Replace `import { Navigate, useNavigate, useParams } from "react-router-dom"` with:
   ```ts
   import { useRouter } from 'next/navigation';
   import { use } from 'react';
   ```
3. Replace `const { slug } = useParams();` and `const navigate = useNavigate();` with:
   ```ts
   const { slug } = use(params);
   const router = useRouter();
   ```
4. Page signature: `export default function PreparePage({ params }: { params: Promise<{ slug: string }> })`.
5. Replace `navigate(...)` with `router.push(...)`.
6. Replace `import { Modal } from … (inline at bottom)` with `import { Modal, EmptyState } from './_modal';` and delete the inline definitions.
7. Drop the auth/character/campaign guards at the top (lines 33–36 of the reference) — `(learner)/layout.tsx` handles auth and character gates; for the missing-campaign case, redirect via `router.replace('/dashboard')`.
8. Defensively `return null` while `character` is briefly null.
9. Update import paths — `useGame` lives at `@/state/game-context` (NOT `GameContext`).
10. Cast a single icon-typing wart: the reference's `tabs` array uses `typeof BookOpen` for the icon type — that compiles fine in our TS setup, leave it.

The full file is ~330 LOC after the `Modal` extraction. If TypeScript emits `react/no-unescaped-entities` lint warnings on smart quotes inside intro strings, leave them — they're in user-facing copy and don't break compilation.

- [ ] **Step 4: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "prepare" -SimpleMatch | Select-Object -First 20
```

Expected: no errors.

- [ ] **Step 5: Smoke verify**

Dev servers up. Sign in, navigate `/dashboard` → campaign card → "Open Academy" / "Prepare". Confirm the 4 tabs render (Lessons, Shorts, AI Tutor, Forge). Click a lesson — modal opens. Submit a correct answer — toast `Lesson complete! +XX KP` shows, lesson is marked complete (green checkmark), KP balance in the top HUD increases. Buy a shop ability — backend POST `/inventory/buy` should be visible in the network tab; KP balance reconciles. Equip a weapon — backend POST `/inventory/equip` should fire.

Kill dev servers.

- [ ] **Step 6: Commit**

```powershell
git add "apps/web/src/app/(learner)/campaign/[slug]/prepare"
git commit -m "feat(campaign): port PrepareForMission Academy hub

Direct port of ai-adventure-island/src/pages/PrepareForMission.tsx with
Next.js adapter changes (router, public-asset paths, async params, 'use client').
Extracts Modal + EmptyState into sibling _modal.tsx so the page file stays
under the CLAUDE.md 300-LOC limit. Lesson/video completions credit KP
optimistically through useGame().completeLesson / watchVideo. Shop tab buys
and equips route through real inventoryApi calls (Plan 1 R3 fix in flight).
"
```

---

### Task B.3: Port `MissionPrep.tsx` → `(learner)/campaign/[slug]/mission/[missionId]/prep/page.tsx`

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/mission/[missionId]/prep/page.tsx`

Reference: `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\MissionPrep.tsx` (~170 LOC, no helper extractions needed).

- [ ] **Step 1: Create the directory tree**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/mission"
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/mission/[missionId]"
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/mission/[missionId]/prep"
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/(learner)/campaign/[slug]/mission/[missionId]/prep/page.tsx`. Apply the same adapter rules as B.2:

- `'use client';`
- `import { useRouter } from 'next/navigation';` + `import { use } from 'react';`
- `export default function MissionPrepPage({ params }: { params: Promise<{ slug: string; missionId: string }> })`
- `const { slug, missionId } = use(params);`
- Drop auth/character/campaign guards from reference lines 22–26; defensively `return null` if `character` is briefly null and `router.replace('/dashboard')` if `campaign || mission` is missing.
- Replace `useGame` import path with `@/state/game-context`.

The full file is ~165 LOC. The page already uses `addKnowledge` (which exists on the adapter from Plan 1) — no new useGame methods needed.

- [ ] **Step 3: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "mission/" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

- [ ] **Step 4: Smoke verify**

Dev servers. Navigate `/campaign/<slug>` → click "Prepare for Mission" on any mission → MissionPrep renders. Answer questions → Submit → KP earned toast + KP balance updates in the top HUD. The "Begin Battle" button at the bottom navigates to `/campaign/<slug>/battle/<id>` (will 404 until Phase C lands).

Kill dev servers.

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/src/app/(learner)/campaign/[slug]/mission"
git commit -m "feat(campaign): port MissionPrep warm-up quiz page

Direct port of ai-adventure-island/src/pages/MissionPrep.tsx with the
same Next.js adapter rules (async params, router, dropped guards now
owned by (learner)/layout.tsx). KP credits optimistic via existing
useGame().addKnowledge.
"
```

---

## Phase C — Battle (4-file split per CLAUDE.md rule #8)

The reference `Battle.tsx` is ~550 LOC including the inline `HpBar` helper. CLAUDE.md rule #8 caps files at 300 LOC, so Plan 2 splits the battle into:

- `page.tsx` — route entry, guards, top-level state, and orchestration (calls into the 3 helpers).
- `_battle-stage.tsx` — HP bars + battlefield visual (hero ↔ enemy + slash/damage overlays).
- `_battle-quiz.tsx` — AI Riddle modal overlay.
- `_battle-outcome.tsx` — victory/defeat overlay.

A 5th file holds the constants and `Ability` type:

- `_battle-config.ts` — `BASE_ABILITIES`, `Ability`, `LogEntry` types, `rand` helper.

The `_` prefix keeps these out of Next.js routing.

### Task C.1: Create the battle config file

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-config.ts`

- [ ] **Step 1: Create the directory tree**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/battle"
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]"
```

- [ ] **Step 2: Write the config module**

Create `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-config.ts`:

```ts
import { Sparkles, Shield, Swords, Zap } from 'lucide-react';

/** A single ability the hero can use during battle. */
export interface Ability {
  id: string;
  name: string;
  icon: typeof Swords;
  /** Inclusive damage range [min, max]. */
  damage: [number, number];
  /** Turns until reuse; 0 = always available. */
  cooldown: number;
  variant: 'primary' | 'gold' | 'ghost' | 'danger';
  description: string;
  /** True if the ability requires a Spark charge to fire (earned via AI Riddle). */
  special?: boolean;
}

/** A single line in the battle log. */
export interface LogEntry {
  id: number;
  text: string;
  tone: 'player' | 'enemy' | 'system' | 'crit';
}

/** Always-available core abilities every hero has. Shop-bought abilities are appended. */
export const BASE_ABILITIES: Ability[] = [
  { id: 'strike', name: 'Quick Strike', icon: Swords, damage: [10, 18], cooldown: 0, variant: 'primary', description: 'Reliable basic attack.' },
  { id: 'focus', name: 'Focus Stance', icon: Shield, damage: [4, 8], cooldown: 2, variant: 'ghost', description: 'Steady hit, recover 8 HP.' },
  { id: 'surge', name: 'Token Surge', icon: Zap, damage: [18, 28], cooldown: 3, variant: 'gold', description: 'Heavy burst attack.' },
  { id: 'spark', name: 'Spark Strike ✦', icon: Sparkles, damage: [40, 60], cooldown: 0, variant: 'danger', description: 'Special — needs a quiz charge.', special: true },
];

/** Inclusive integer in [min, max]. */
export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

- [ ] **Step 3: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "battle-config" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

- [ ] **Step 4: No commit yet** — this file is half of a 5-file unit. Commit after the page assembles in Task C.5.

---

### Task C.2: Create the battle-stage component

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-stage.tsx`

- [ ] **Step 1: Write the stage component**

Create `_battle-stage.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const zombie = '/assets/game/zombie.png';

interface HpBarProps {
  name: string;
  sub: string;
  hp: number;
  max: number;
  pct: number;
  color?: string;
  tone: 'hero' | 'enemy';
  isBoss?: boolean;
}

/** Hero or enemy HP bar with name + subtitle + colored fill. */
export function HpBar({ name, sub, hp, max, pct, color, tone, isBoss }: HpBarProps) {
  return (
    <div className={cn('panel p-3 sm:p-4', tone === 'enemy' && 'text-right')}>
      <div className={cn('flex items-center gap-2', tone === 'enemy' && 'flex-row-reverse')}>
        <Heart className={cn('h-4 w-4', tone === 'hero' ? 'text-primary' : 'text-destructive')} />
        <div className={cn(tone === 'enemy' && 'text-right')}>
          <div className="font-display text-sm sm:text-base text-glow-primary leading-tight">{name}</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="mt-2 h-3 rounded-full bg-background border border-border/60 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            tone === 'hero' ? 'bg-gradient-primary' : isBoss ? 'bg-gradient-to-r from-destructive to-accent' : 'bg-destructive'
          )}
          style={{
            width: `${pct}%`,
            ...(tone === 'hero' && color ? { background: `linear-gradient(90deg, hsl(${color}), hsl(var(--primary)))` } : {}),
          }}
        />
      </div>
      <div className={cn('mt-1 text-[11px] text-muted-foreground', tone === 'enemy' && 'text-right')}>
        {hp} / {max} HP
      </div>
    </div>
  );
}

interface BattleStageProps {
  heroImage: string;
  heroName: string;
  heroColor: string;
  heroAnim: string;
  heroDmg: { id: number; v: number } | null;
  enemyAnim: string;
  enemyDmg: { id: number; v: number; crit: boolean } | null;
  showSlash: boolean;
  isBoss: boolean;
  turn: 'hero' | 'enemy';
  outcome: 'win' | 'lose' | null;
}

/**
 * Battlefield: hero portrait on the left, VS marker centered, enemy portrait
 * on the right. Floating damage numbers appear on hits; slash effect appears
 * on player attack.
 */
export function BattleStage({
  heroImage, heroName, heroColor, heroAnim, heroDmg,
  enemyAnim, enemyDmg, showSlash, isBoss, turn, outcome,
}: BattleStageProps) {
  return (
    <section className="relative max-w-6xl w-full mx-auto mt-6 flex-1 flex items-end justify-between gap-6 min-h-[280px] sm:min-h-[340px]">
      {/* Hero side */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            'relative h-40 w-40 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 shadow-[0_0_40px_hsl(var(--primary)/0.5)]',
            heroAnim
          )}
          style={{ borderColor: `hsl(${heroColor})` }}
        >
          <Image src={heroImage} alt={heroName} width={208} height={208} className="w-full h-full object-cover" />
          {heroDmg && (
            <span
              key={heroDmg.id}
              className="absolute inset-x-0 -top-2 text-center font-display text-2xl text-destructive animate-damage-pop"
            >
              -{heroDmg.v}
            </span>
          )}
        </div>
        <div className="mt-3 text-[10px] tracking-[0.3em] uppercase text-primary/80">Your Hero</div>
      </div>

      {/* VS marker */}
      <div className="hidden sm:flex flex-col items-center text-center">
        <div className="font-display text-5xl text-glow-primary animate-flicker">VS</div>
        <div className={cn(
          'mt-2 text-[10px] tracking-[0.3em] uppercase',
          turn === 'hero' ? 'text-primary' : 'text-destructive'
        )}>
          {outcome ? '—' : turn === 'hero' ? 'Your Turn' : 'Enemy Turn'}
        </div>
      </div>

      {/* Enemy side */}
      <div className="relative flex flex-col items-center">
        <div className={cn('relative', enemyAnim, isBoss && 'scale-125')}>
          <Image
            src={zombie}
            alt="Zombie"
            width={208}
            height={208}
            className={cn(
              'h-40 w-40 sm:h-52 sm:w-52 object-contain drop-shadow-[0_0_25px_hsl(var(--destructive)/0.6)]',
              !enemyAnim && 'animate-float-slow'
            )}
          />
          {showSlash && (
            <Sparkles className="absolute inset-0 m-auto h-32 w-32 text-accent animate-slash" />
          )}
          {enemyDmg && (
            <span
              key={enemyDmg.id}
              className={cn(
                'absolute inset-x-0 -top-2 text-center font-display animate-damage-pop',
                enemyDmg.crit ? 'text-3xl text-accent text-glow-gold' : 'text-2xl text-primary text-glow-primary'
              )}
            >
              -{enemyDmg.v}{enemyDmg.crit && '!'}
            </span>
          )}
        </div>
        <div className="mt-3 text-[10px] tracking-[0.3em] uppercase text-destructive/80">
          {isBoss ? 'Final Boss' : 'Foe'}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "battle-stage" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

- [ ] **Step 3: No commit yet.**

---

### Task C.3: Create the battle-quiz overlay

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-quiz.tsx`

- [ ] **Step 1: Write the quiz component**

Create `_battle-quiz.tsx`:

```tsx
'use client';

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/data/quiz';

interface BattleQuizProps {
  quiz: QuizQuestion;
  picked: number | null;
  onPick: (idx: number) => void;
}

/**
 * Mid-battle "AI Riddle" overlay. Answer correctly to charge a Spark.
 * Renders nothing if `quiz` is null — caller controls mount.
 */
export function BattleQuiz({ quiz, picked, onPick }: BattleQuizProps) {
  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up">
      <div className="panel max-w-xl w-full p-6 sm:p-8 rune-ring">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-accent">
          <Brain className="h-4 w-4" /> AI Riddle
        </div>
        <h3 className="font-display text-2xl text-glow-primary mt-2">{quiz.q}</h3>
        <div className="mt-5 grid gap-2">
          {quiz.options.map((opt, i) => {
            const chosen = picked === i;
            const isCorrect = picked !== null && i === quiz.correct;
            const isWrong = chosen && i !== quiz.correct;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                disabled={picked !== null}
                className={cn(
                  'panel text-left p-3 text-sm hover:border-primary/60 transition-all',
                  isCorrect && 'border-success text-success',
                  isWrong && 'border-destructive text-destructive',
                  picked !== null && !isCorrect && !isWrong && 'opacity-50'
                )}
              >
                <span className="font-display text-xs text-muted-foreground mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className="mt-4 text-xs text-muted-foreground">
            {picked === quiz.correct ? '✦ ' : ''}{quiz.explain}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + no commit yet.**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "battle-quiz" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

---

### Task C.4: Create the battle-outcome overlay

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-outcome.tsx`

- [ ] **Step 1: Write the outcome component**

Create `_battle-outcome.tsx`:

```tsx
'use client';

import { Crown, Heart, Trophy } from 'lucide-react';
import { GameButton } from '@/components/game/GameButton';

interface BattleOutcomeProps {
  outcome: 'win' | 'lose';
  isBoss: boolean;
  campaignSlug: string;
  bossName: string;
  missionXp: number;
  onMissionList: () => void;
  onContinue: () => void;
}

/**
 * Post-battle overlay. Win → trophy + XP earned + (if boss) chapter cleared
 * banner. Lose → encouragement to try again. Continue button reloads the
 * page to reset combat state without leaving the route.
 */
export function BattleOutcome({
  outcome, isBoss, campaignSlug, bossName, missionXp, onMissionList, onContinue,
}: BattleOutcomeProps) {
  // campaignSlug is part of props for symmetry with the navigation handlers
  // even though it's not consumed here directly.
  void campaignSlug;
  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="panel max-w-md w-full p-8 text-center animate-victory-burst rune-ring">
        {outcome === 'win' ? (
          <>
            <Trophy className="h-14 w-14 mx-auto text-accent animate-pulse-glow" />
            <h2 className="font-display text-4xl text-glow-gold mt-3">Victory!</h2>
            <p className="text-muted-foreground mt-2">
              You defeated {isBoss ? bossName : 'the Babble Zombie'} and earned{' '}
              <span className="text-accent">{missionXp} XP</span>.
            </p>
            {isBoss && (
              <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                <Crown className="h-3.5 w-3.5" /> Chapter cleared!
              </p>
            )}
          </>
        ) : (
          <>
            <Heart className="h-14 w-14 mx-auto text-destructive" />
            <h2 className="font-display text-4xl text-destructive mt-3">Defeated</h2>
            <p className="text-muted-foreground mt-2">
              The zombie holds the path. Sharpen your prompts and try again.
            </p>
          </>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <GameButton variant="ghost" size="md" onClick={onMissionList}>
            Mission List
          </GameButton>
          <GameButton variant={outcome === 'win' ? 'gold' : 'primary'} size="md" onClick={onContinue}>
            {outcome === 'win' ? 'Continue' : 'Retry'}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + no commit yet.**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "battle-outcome" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

---

### Task C.5: Create the battle page entry + commit the 5-file unit

**Files:**
- Create: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/page.tsx`

This is the route entry. It owns the entire battle state machine (all the `useState` from the reference) and renders the 3 child components for stage/quiz/outcome. The reference is ~340 LOC after the helper extractions; the page should land at ~300.

- [ ] **Step 1: Write the page**

Create `page.tsx`. Source: reference `Battle.tsx`. Apply the standard adapter rules + the helper-extraction wiring:

1. `'use client';` at the top.
2. Imports:
   ```ts
   import { useEffect, useMemo, useRef, useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { use } from 'react';
   import { ArrowLeft, Brain, Wand2, Sparkles, ShieldAlert } from 'lucide-react';
   import { toast } from 'sonner';
   import { cn } from '@/lib/utils';
   import { Scene } from '@/components/game/Scene';
   import { Logo } from '@/components/game/Logo';
   import { GameButton } from '@/components/game/GameButton';
   import { KpBadge } from '@/components/game/KpBadge';
   import { CAMPAIGNS, CLASSES } from '@/data/game';
   import { pickQuestion, type QuizQuestion } from '@/data/quiz';
   import {
     ENEMY_STRENGTH, getKnowledgeAdvantage,
     SHOP_ABILITIES, SHOP_WEAPONS,
   } from '@/data/academy';
   import { useGame } from '@/state/game-context';
   import { BASE_ABILITIES, type Ability, type LogEntry, rand } from './_battle-config';
   import { HpBar, BattleStage } from './_battle-stage';
   import { BattleQuiz } from './_battle-quiz';
   import { BattleOutcome } from './_battle-outcome';
   ```
3. Page signature:
   ```ts
   export default function BattlePage({ params }: { params: Promise<{ slug: string; missionId: string }> }) {
     const { slug, missionId } = use(params);
     const router = useRouter();
     // ... rest of the body
   }
   ```
4. Replace `useNavigate` calls with `router.push(...)`. Replace the `window.location.reload()` continue-button with `router.refresh()` (Next.js equivalent that re-runs server components without a full page reload). For the lose-retry case where local state needs to truly reset, `router.refresh()` is fine because all combat state is in `useState` and the component re-mounts on refresh.
5. Drop the user/character/campaign/mission guards from the reference (lines 219–221). Replace with:
   ```ts
   const campaign = CAMPAIGNS.find((c) => c.slug === slug);
   const mission = campaign?.missions.find((m) => m.id === missionId);
   const klass = character ? CLASSES.find((c) => c.id === character.class) : undefined;
   const isBoss = mission?.difficulty === 'elite';
   // ... AFTER all hooks:
   if (!character) return null;
   if (!campaign || !mission || !klass) {
     router.replace('/dashboard');
     return null;
   }
   ```
6. Replace the inline `<HpBar>` JSX (lines 248–268 of reference) with the imported `<HpBar>` from `_battle-stage.tsx`.
7. Replace the inline battlefield JSX (lines 270–335 of reference) with `<BattleStage … />`.
8. Replace the inline AI Riddle modal (lines 432–470 of reference) with `<BattleQuiz quiz={quiz} picked={picked} onPick={answerQuiz} />` — show only when `quiz` is non-null.
9. Replace the inline outcome overlay (lines 472–511 of reference) with `<BattleOutcome … />` — show only when `outcome` is non-null.
10. **Reward awarding (new):** in the `useEffect` that detects `enemyHp <= 0`, after `setOutcome("win")`, call:
    ```ts
    addKnowledge(mission.xp); // optimistic-local KP credit
    // TODO(plan-3): POST /api/v1/combat/:battleId/complete with the play log for
    //               server-side validation (spec §5.6 + task P3-07).
    ```
    Pull `addKnowledge` from `useGame()` at the top of the component.
11. The `klass.image` is consumed by `BattleStage` as `heroImage` — pass it through.
12. Page-private `useState` from the reference (heroHp, enemyHp, turn, cooldowns, log, heroAnim, enemyAnim, enemyDmg, heroDmg, showSlash, sparkCharges, quiz, seenQuiz, picked, outcome) all stay inline in `page.tsx`.

If the resulting page is over 300 LOC, look for non-essential JSX to inline-wrap or move into the helpers. Do NOT compress logic into clever one-liners — readability beats line count.

- [ ] **Step 2: Typecheck**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "battle/\[missionId\]" -SimpleMatch | Select-Object -First 20
```

Expected: no errors.

- [ ] **Step 3: Smoke verify**

Dev servers up. From a campaign mission card → "Begin Mission" → battle screen renders. Use Quick Strike → enemy HP drops, log records the hit, enemy turn fires, hero HP drops. Use Focus Stance → hero HP recovers 8. Open AI Riddle → answer correctly → Spark Strike unlocks (✦ icon glows). Use Spark Strike → big damage. Bring enemy HP to 0 → victory overlay. Confirm KP balance increased by `mission.xp`. Click "Mission List" → returns to `/campaign/<slug>`.

Repeat for an `elite` mission (boss) — overlay shows "Chapter cleared!" banner.

Kill dev servers.

- [ ] **Step 4: Commit the full 5-file unit**

```powershell
git add "apps/web/src/app/(learner)/campaign/[slug]/battle"
git commit -m "feat(battle): port Battle.tsx as 4-file split (page + stage + quiz + outcome)

Direct port of ai-adventure-island/src/pages/Battle.tsx. Per CLAUDE.md
rule #8 (300 LOC limit) the ~550-LOC reference is split into:

  page.tsx          - route entry, state machine, orchestration
  _battle-stage.tsx - HP bars + battlefield + slash/damage overlays
  _battle-quiz.tsx  - AI Riddle overlay (mid-battle)
  _battle-outcome.tsx - victory/defeat overlay
  _battle-config.ts - BASE_ABILITIES, Ability type, LogEntry, rand()

On victory, awards mission.xp KP optimistically via useGame().addKnowledge.
Backend validation of the play log is an explicit Plan 3 deliverable
(spec §5.6, task P3-07) — TODO marker added.
"
```

---

## Phase D — Inventory + Shop + Victory

Three smaller pages. The shop reuses the same buy/equip flow already wired in Phases A.1–A.3 + B.2.

### Task D.1: Create `/inventory` page

**Files:**
- Create: `apps/web/src/app/(learner)/inventory/page.tsx`

The reference project has no separate Inventory page (the Academy hub's Forge tab serves both buy and own/equip). Per spec §5.1, our route map adds a standalone `/inventory` for "KP balance + owned + equipped". Build it from scratch using the same fantasy chrome as Dashboard/Campaign.

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/inventory"
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/(learner)/inventory/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Sword, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { SHOP_ABILITIES, SHOP_WEAPONS } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';

const worldBg = '/assets/game/world-map.jpg';

/**
 * Inventory page — shows KP balance summary, owned abilities, and owned
 * weapons with equip toggles. Backed by `useGame()` adapter so all state
 * mutations route through real backend calls (Plan 1 R3 fix).
 */
export default function InventoryPage() {
  const router = useRouter();
  const {
    character,
    knowledgePoints,
    totalKnowledgeEarned,
    ownedAbilities,
    ownedWeapons,
    equippedWeapon,
    equipWeapon,
  } = useGame();

  if (!character) return null;

  const ownedAbilityCatalog = SHOP_ABILITIES.filter((a) => ownedAbilities.includes(a.id));
  const ownedWeaponCatalog = SHOP_WEAPONS.filter((w) => ownedWeapons.includes(w.id));

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Realm Map
            </button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto mt-8 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-primary/80">INVENTORY</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            <Package className="inline h-8 w-8 mb-2" /> Hero's Vault
          </h1>
        </section>

        {/* KP summary */}
        <section className="max-w-5xl mx-auto mt-8 grid sm:grid-cols-2 gap-3">
          <div className="panel p-5 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Spendable KP</div>
            <div className="font-display text-4xl text-glow-primary mt-1">{knowledgePoints}</div>
          </div>
          <div className="panel p-5 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Lifetime KP earned</div>
            <div className="font-display text-4xl text-glow-gold mt-1">{totalKnowledgeEarned}</div>
          </div>
        </section>

        {/* Owned abilities */}
        <section className="max-w-5xl mx-auto mt-8">
          <h2 className="font-display text-xl text-glow-primary flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5" /> Abilities
          </h2>
          {ownedAbilityCatalog.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-muted-foreground">
              No abilities yet. Visit the Forge to buy your first.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ownedAbilityCatalog.map((a) => (
                <article key={a.id} className="panel p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    <h3 className="font-display text-base text-glow-primary flex-1">{a.name}</h3>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {a.damage[0]}–{a.damage[1]} dmg · CD {a.cooldown}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Owned weapons */}
        <section className="max-w-5xl mx-auto mt-8 pb-12">
          <h2 className="font-display text-xl text-glow-primary flex items-center gap-2 mb-3">
            <Sword className="h-5 w-5" /> Knowledge Weapons
          </h2>
          {ownedWeaponCatalog.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-muted-foreground">
              No weapons yet. Visit the Bazaar to forge your first.
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {ownedWeaponCatalog.map((w) => {
                const equipped = equippedWeapon === w.id;
                return (
                  <article key={w.id} className={cn('panel p-4 flex flex-col gap-2', equipped && 'border-accent')}>
                    <h3 className="font-display text-base text-glow-primary">{w.name}</h3>
                    <p className="text-xs text-muted-foreground flex-1">{w.description}</p>
                    <div className="text-[10px] text-accent">+{w.bonusDamage} damage</div>
                    <GameButton
                      variant={equipped ? 'gold' : 'ghost'}
                      size="sm"
                      onClick={() => equipWeapon(equipped ? null : w.id)}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </GameButton>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck + smoke**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "inventory" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

Dev servers. Visit `/inventory` (after buying at least one ability + weapon in the Academy). Owned items should render. Click Equip on a non-equipped weapon — backend POST `/inventory/equip` fires; the chip flips to "Equipped" and the previously-equipped weapon (if any) becomes "Equip"-able again.

Kill dev servers.

- [ ] **Step 4: Commit**

```powershell
git add "apps/web/src/app/(learner)/inventory"
git commit -m "feat(inventory): add /inventory page with KP summary + equip toggles

New page (no reference equivalent) built from the same fantasy chrome as
the dashboard/campaign pages. Owned abilities and weapons render from the
inventory-store, equip toggles route through useGame().equipWeapon -> real
inventoryApi.equipWeapon (Plan 1 R3 fix).
"
```

---

### Task D.2: Create `/shop` page (Global Bazaar)

**Files:**
- Create: `apps/web/src/app/(learner)/shop/page.tsx`

The reference's shop is a tab inside PrepareForMission. Per spec §5.1, our route map exposes a standalone `/shop` "Global Bazaar" — same catalog, accessible without picking a campaign first. Reuse the buy/equip logic from B.2's shop tab.

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/shop"
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/(learner)/shop/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Sword, ShoppingBag, Brain, Sparkles, Shield, Zap, CheckCircle2, Lock, Swords } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { SHOP_ABILITIES, SHOP_WEAPONS } from '@/data/academy';
import { useGame } from '@/state/game-context';
import { cn } from '@/lib/utils';

const worldBg = '/assets/game/world-map.jpg';

const ICONS = { sword: Sword, spark: Sparkles, brain: Brain, shield: Shield, zap: Zap } as const;

/**
 * Global Bazaar — standalone shop page. Same catalog and same buy/equip
 * flow as the Forge tab inside PrepareForMission, just without the
 * Lessons/Videos/AI-Tutor neighbours.
 */
export default function ShopPage() {
  const router = useRouter();
  const game = useGame();

  if (!game.character) return null;

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3">
            <KpBadge />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Realm Map
            </button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto mt-8 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-accent">GLOBAL BAZAAR</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            <ShoppingBag className="inline h-8 w-8 mb-2" /> The Forge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm">
            Spend Knowledge Points to unlock new abilities and weapons. Stronger gear means harder
            zombies fall faster.
          </p>
        </section>

        {/* Abilities */}
        <section className="max-w-5xl mx-auto mt-8">
          <h2 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
            <Swords className="h-5 w-5" /> Abilities
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SHOP_ABILITIES.map((a) => {
              const owned = game.ownedAbilities.includes(a.id);
              const Icon = ICONS[a.icon];
              const canAfford = game.knowledgePoints >= a.cost;
              return (
                <article key={a.id} className="panel p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-accent" />
                    <h4 className="font-display text-base text-glow-primary flex-1">{a.name}</h4>
                    {owned && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <div className="text-[10px] text-muted-foreground">
                    {a.damage[0]}–{a.damage[1]} dmg · CD {a.cooldown}
                  </div>
                  <GameButton
                    variant={owned ? 'ghost' : canAfford ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={owned || !canAfford}
                    onClick={() => {
                      if (game.buyAbility(a.id, a.cost)) toast.success(`${a.name} unlocked!`);
                      else toast(`Need ${a.cost - game.knowledgePoints} more KP.`);
                    }}
                    className="mt-1"
                  >
                    {owned ? 'Owned' : canAfford ? `Buy · ${a.cost} KP` : `Locked · ${a.cost} KP`}
                    {!owned && !canAfford && <Lock className="h-3.5 w-3.5" />}
                  </GameButton>
                </article>
              );
            })}
          </div>
        </section>

        {/* Weapons */}
        <section className="max-w-5xl mx-auto mt-8 pb-12">
          <h2 className="font-display text-xl text-glow-gold flex items-center gap-2 mb-3">
            <Sword className="h-5 w-5" /> Knowledge Weapons
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {SHOP_WEAPONS.map((w) => {
              const owned = game.ownedWeapons.includes(w.id);
              const equipped = game.equippedWeapon === w.id;
              const canAfford = game.knowledgePoints >= w.cost;
              return (
                <article key={w.id} className={cn('panel p-4 flex flex-col gap-2', equipped && 'border-accent')}>
                  <h4 className="font-display text-base text-glow-primary">{w.name}</h4>
                  <p className="text-xs text-muted-foreground flex-1">{w.description}</p>
                  <div className="text-[10px] text-accent">+{w.bonusDamage} damage</div>
                  {owned ? (
                    <GameButton
                      variant={equipped ? 'gold' : 'ghost'}
                      size="sm"
                      onClick={() => game.equipWeapon(equipped ? null : w.id)}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </GameButton>
                  ) : (
                    <GameButton
                      variant={canAfford ? 'primary' : 'ghost'}
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => {
                        if (game.buyWeapon(w.id, w.cost)) toast.success(`${w.name} forged!`);
                        else toast(`Need ${w.cost - game.knowledgePoints} more KP.`);
                      }}
                    >
                      {canAfford ? `Buy · ${w.cost} KP` : `Locked · ${w.cost} KP`}
                    </GameButton>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck + smoke**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "shop" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

Dev servers. Visit `/shop`. Verify catalog renders, buy a not-yet-owned weapon, watch backend network calls (`POST /inventory/buy` then `POST /inventory/equip` if first weapon). Equip toggle works. Insufficient-KP buttons stay disabled.

Kill dev servers.

- [ ] **Step 4: Commit**

```powershell
git add "apps/web/src/app/(learner)/shop"
git commit -m "feat(shop): add /shop standalone Global Bazaar page

New top-level shop reachable from the dashboard (no campaign required).
Same catalog (SHOP_ABILITIES + SHOP_WEAPONS) and same useGame() buy/equip
flow as PrepareForMission's Forge tab — backend-backed via inventoryApi.
"
```

---

### Task D.3: Create `/victory` page

**Files:**
- Create: `apps/web/src/app/(learner)/victory/page.tsx`

Reference has no Victory route — the post-battle overlay handles per-mission wins. Per spec §5.1 + §5.7, our route map adds a standalone `/victory` "final-boss certificate screen" — separate from the per-mission outcome overlay. For Plan 2, ship a minimal page: hero strip + "All Four Isles Conquered" headline + character chip + KP totals + a "Return to the Realm Map" button. Backend certificate generation already exists (`combatApi.generateCertificate` in the API client) but is not wired here — that's a Plan 3 polish task.

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Force "apps/web/src/app/(learner)/victory"
```

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/(learner)/victory/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Crown, Sparkles, Star, Trophy } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CLASSES } from '@/data/game';
import { useGame } from '@/state/game-context';

const worldBg = '/assets/game/world-map.jpg';

/**
 * Victory page — shown after the player clears the final-boss mission of
 * Campaign 4 (Agent Sanctum). Static page for Plan 2; certificate generation
 * (combatApi.generateCertificate) is a Plan 3 polish task.
 */
export default function VictoryPage() {
  const router = useRouter();
  const { character, totalKnowledgeEarned, ownedAbilities, ownedWeapons } = useGame();

  if (!character) return null;
  const klass = CLASSES.find((c) => c.id === character.class);
  if (!klass) return null;

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8 flex flex-col">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <KpBadge />
        </header>

        <section className="max-w-3xl mx-auto mt-12 text-center animate-victory-burst panel p-8 sm:p-12 rune-ring flex-1 flex flex-col items-center justify-center">
          <Trophy className="h-20 w-20 text-accent animate-pulse-glow" />
          <p className="text-xs tracking-[0.5em] text-accent mt-4">FOUR ISLES CONQUERED</p>
          <h1 className="font-display text-4xl sm:text-6xl text-glow-gold mt-3">
            Champion of the Realm
          </h1>

          <div className="flex items-center gap-4 mt-8 panel px-5 py-3">
            <Image
              src={klass.image}
              alt={character.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover border-2"
              style={{ borderColor: `hsl(${character.color})` }}
            />
            <div className="text-left">
              <div className="font-display text-xl text-glow-primary">{character.name}</div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                <Crown className="inline h-3 w-3" /> {klass.title}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-md">
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3 w-3 text-accent" /> KP
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{totalKnowledgeEarned}</div>
            </div>
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" /> Abilities
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{ownedAbilities.length}</div>
            </div>
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Crown className="h-3 w-3 text-accent" /> Weapons
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{ownedWeapons.length}</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground max-w-lg mt-8">
            You taught the AI, sharpened your prompts, and forged tools that defeated the
            Voidmind itself. The realm is safe — for now.
          </p>

          <GameButton variant="gold" size="lg" className="mt-8" onClick={() => router.push('/dashboard')}>
            Return to the Realm Map
          </GameButton>
        </section>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck + smoke**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "victory" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

Dev servers. Manually navigate to `/victory` (no auto-trigger yet — Plan 3 will wire the boss-mission victory to redirect here). Page should render with hero stats and "Return to the Realm Map" button.

Kill dev servers.

- [ ] **Step 4: Commit**

```powershell
git add "apps/web/src/app/(learner)/victory"
git commit -m "feat(victory): add /victory final-boss certificate landing page

Static page for Plan 2 — hero summary + KP totals + 'Return to Realm Map'
button. Auto-redirect on boss-mission victory and combatApi.generateCertificate
wiring are Plan 3 polish tasks.
"
```

---

## Phase E — Standalone `/login` and `/signup` re-skin

The Welcome page (`/`) covers the MVP auth path with two-tab "Begin Quest / Return Hero" form. Plan 2 P2-08 re-skins the standalone `/login` and `/signup` pages so direct links to those routes don't drop the user into the pre-redesign shadcn forms. Light touch: keep the existing `LoginForm` / `SignupForm` components (they handle Firebase wiring) but wrap them in the fantasy chrome.

### Task E.1: Re-skin `/login`

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

The existing page just renders `<LoginForm />` centered. Wrap it in `<Scene>` + `<Logo />` + a panel.

- [ ] **Step 1: Inspect the existing LoginForm**

Run: read `apps/web/src/components/features/auth/LoginForm.tsx` to confirm its layout. Expected: a `<form>` with email + password + submit button, using shadcn primitives.

- [ ] **Step 2: Update the page wrapper**

Replace `apps/web/src/app/(auth)/login/page.tsx` with:

```tsx
import { LoginForm } from '@/components/features/auth/LoginForm';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import Link from 'next/link';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Standalone Login page. Re-skinned in fantasy chrome — the LoginForm
 * itself stays unchanged (still handles Firebase wiring + redirect).
 * Welcome (`/`) covers the MVP path; this page exists for direct links.
 */
export default function LoginPage() {
  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel max-w-md w-full p-6 sm:p-8 rune-ring animate-fade-in-up">
          <h1 className="font-display text-3xl text-glow-primary text-center">Return Hero</h1>
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground text-center mt-2">
            Sign in to continue your quest
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            New to the realm?{' '}
            <Link href="/signup" className="text-primary hover:text-glow-primary">
              Begin your quest
            </Link>
          </p>
        </div>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck + smoke**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "login" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

Dev servers. Navigate `/login` directly. Page should render the LoginForm inside fantasy chrome; submit should still log in successfully. Kill dev servers.

- [ ] **Step 4: Commit**

```powershell
git add "apps/web/src/app/(auth)/login/page.tsx"
git commit -m "feat(auth): re-skin /login in fantasy chrome (Scene + panel)

LoginForm itself unchanged — Firebase wiring + redirect logic preserved.
Standalone /login is the deep-link entry; Welcome (/) remains the MVP
two-tab auth surface.
"
```

---

### Task E.2: Re-skin `/signup`

**Files:**
- Modify: `apps/web/src/app/(auth)/signup/page.tsx`

Same pattern as E.1.

- [ ] **Step 1: Update the page wrapper**

Replace `apps/web/src/app/(auth)/signup/page.tsx` with:

```tsx
import { SignupForm } from '@/components/features/auth/SignupForm';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import Link from 'next/link';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Standalone Signup page for parent account creation. Re-skinned in fantasy
 * chrome; SignupForm itself unchanged (Firebase + parental-consent flow).
 * Welcome (`/`) covers the MVP path; this page exists for direct links.
 */
export default function SignupPage() {
  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel max-w-md w-full p-6 sm:p-8 rune-ring animate-fade-in-up">
          <h1 className="font-display text-3xl text-glow-primary text-center">Begin Quest</h1>
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground text-center mt-2">
            Forge your hero account
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Returning hero?{' '}
            <Link href="/login" className="text-primary hover:text-glow-primary">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 2: Typecheck + smoke**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | Select-String -Pattern "signup" -SimpleMatch | Select-Object -First 10
```

Expected: no errors.

Dev servers. Navigate `/signup` directly. Should render SignupForm inside fantasy chrome. Submit should create an account and redirect appropriately. Kill dev servers.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(auth)/signup/page.tsx"
git commit -m "feat(auth): re-skin /signup in fantasy chrome (Scene + panel)

SignupForm itself unchanged — Firebase + parental-consent flow preserved.
Companion to the /login re-skin in the previous commit.
"
```

---

## Phase F — Review finding R5: minor-account signup + retighten roles

### Task F.0: BLOCKED — user spec clarification required

**Files:** none yet.

R5 is the only Plan-1 carry-over that **cannot be implemented without a product decision**. The spec [§9 question #5](../specs/2026-05-09-redesign-from-reference-design.md#L381) asks: "Welcome page role: how should kids sign up (today hardcoded to `'parent'`)?". Until this is answered, the inventory `@Roles` decorator stays broadened to `['child', 'parent']` and the Welcome register flow stays hardcoded to `role:'parent'`.

**The plan does not progress R5 past this gate.** When the executing engineer reaches Phase F, they MUST stop and ask the user to pick from one (or sketch their own):

1. **Parent-creates-child flow.** Parent signs up at `/signup`, then from the dashboard / settings clicks "Add a young hero" → opens a child-account creation form (uses existing `authApi.addChild`). Child logs in with their own credentials. Welcome's "Begin Quest" tab becomes parent-signup only; a separate "Add hero" link in the Welcome dropdown handles child onboarding under a parent. **Pro:** matches existing parental-consent flow; no schema changes. **Con:** two-step onboarding; parent must complete signup first.
2. **Self-signup with age gate.** Welcome's "Begin Quest" tab adds a birthYear field. If `currentYear - birthYear < 13`, signup creates a `child` role account directly (still requires parent email for COPPA consent — confirmation email sent before activation). **Pro:** single-step onboarding for kids ≥ 13; familiar UX. **Con:** under-13 flow needs parent-confirmation pipeline (Stripe, email service, audit log).
3. **Single role for V1.** Defer the parent/child distinction entirely. Everyone is `child` for V1; parent dashboards stay accessible to anyone (with a follow-up TODO to harden post-launch). **Pro:** unblocks Plan 2 immediately. **Con:** weakens compliance story; flag as known gap in spec.

After the user picks, write a short ADR (`docs/context/ADR-NNN-kid-signup-flow.md`) capturing the choice + reasoning, then proceed with F.1 + F.2.

- [ ] **Step 1: Stop the plan and ask the user**

Surface the three options above as an `AskUserQuestion`. **DO NOT pick a default.** R5 is a product / compliance decision; the engineer cannot.

- [ ] **Step 2: Write the ADR**

After the user picks, create `docs/context/ADR-006-kid-signup-flow.md` (use the next available ADR number — verify with `Glob: docs/context/ADR-*.md`). Capture: chosen option, rejected options + why, schema impact, pages touched, follow-up debt.

---

### Task F.1: Implement the chosen R5 flow

**Files:** dependent on F.0 outcome — **DO NOT GUESS**. The executor MUST come back to writing-plans (or do a brief mid-execution refinement) once F.0 lands. As placeholders for the most-likely options:

- **If option 1 (parent-creates-child):** modify Welcome `Welcome.tsx` to remove the `role:'parent'` hardcode, add an "Add young hero" surface in the dashboard or settings page, wire to `authApi.addChild`. Update the layout's character-gate behavior so child accounts don't need a parent character.
- **If option 2 (self-signup with age gate):** add `birthYear` field to Welcome's register form, branch role assignment in `authApi.signup`, add COPPA-confirmation email flow in the API.
- **If option 3 (single role for V1):** change the `signup` body in Welcome from `role:'parent'` to `role:'child'`, mark the parent-dashboard pages as accessible to all roles temporarily, document in the ADR.

Once implemented, retighten the inventory controller:

```ts
// apps/api/src/modules/inventory/inventory.controller.ts
@Roles('child') // remove the temporary 'parent' broadening from Plan 1
```

- [ ] **Step 1: Implement per F.0 decision** (steps depend on choice)

- [ ] **Step 2: Retighten `@Roles('child')` on `InventoryController`**

```ts
// apps/api/src/modules/inventory/inventory.controller.ts:36
@Roles('child')
```

Remove the `// TODO(plan-2)` comment block above it.

- [ ] **Step 3: Smoke test** the full flow per the chosen option.

- [ ] **Step 4: Commit**

```powershell
# Specific files depend on F.0 outcome
git add <relevant files> docs/context/ADR-006-kid-signup-flow.md
git commit -m "feat(auth): implement R5 minor-account signup (ADR-006) + retighten @Roles

Resolves Plan 1 review finding R5. Per ADR-006 (option N), <one-sentence
description of the chosen flow>. Inventory @Roles tightened back to
'child' now that the signup path produces child accounts.
"
```

---

## Phase G — Acceptance smoke + PR update

### Task G.1: End-to-end manual smoke test

- [ ] **Step 1: Start both dev servers**

```powershell
pnpm --filter @eureka-lab/api dev
pnpm --filter @eureka-lab/web dev
```

- [ ] **Step 2: Run the full happy-path flow**

In an incognito browser:

1. Visit `http://localhost:3010/` — Welcome page renders.
2. Register a new account on the "Begin Quest" tab (or the F.1-chosen flow).
3. Verify redirect to `/character` (no character yet).
4. Pick a class, name, color, weapon → submit.
5. Verify redirect to `/dashboard` — Realm Map renders with 4 campaigns.
6. Click a campaign card → `/campaign/<slug>` mission list renders.
7. Click "Open Academy" → `/campaign/<slug>/prepare` renders. Cycle through all 4 tabs (Lessons, Shorts, AI Tutor, Forge).
8. Complete a lesson → KP balance updates in HUD; lesson shows green checkmark.
9. Watch a video (mock) → KP balance updates.
10. In the Forge tab, buy an ability → confirm `POST /inventory/buy` in network tab; KP deducted; ability appears as "Owned".
11. Buy a weapon → confirm `POST /inventory/buy` + `POST /inventory/equip` (auto-equip first weapon).
12. Back to `/campaign/<slug>` → click "Prepare for Mission" on a mission → MissionPrep renders. Answer questions correctly → KP earned.
13. Click "Begin Battle" → battle screen renders. Use abilities to defeat the enemy. Open AI Riddle → answer correctly → Spark Strike charges.
14. Win → outcome overlay shows Victory + XP; KP balance increased by `mission.xp`.
15. Click "Mission List" → returns to campaign page.
16. From dashboard, navigate `/inventory` → owned items render.
17. From dashboard, navigate `/shop` → catalog renders, can buy.
18. From dashboard, navigate `/victory` → certificate page renders.
19. Sign out from dashboard → returns to `/`. Try to navigate to `/dashboard` directly → bounced to `/`.
20. Re-login → goes straight to `/dashboard` (no character-create detour).

- [ ] **Step 3: Note any bugs**

Capture each in a `## Smoke-test follow-ups` section in `planning/redesign-task-board.md` under Plan 2 — same pattern as Plan 1's 2.S1–2.S3. Common things to check:

- TypeScript errors hidden by the test-file pre-existing noise.
- Console warnings (next-intl `IntlError`, React hydration mismatches, key warnings).
- Network calls that 404 or 500 on real backend (not just on stubbed routes).
- Visual glitches in the battle screen at narrow widths (< 480px).

Land each follow-up as a separate `fix(...)` commit before declaring Plan 2 done.

- [ ] **Step 4: Kill dev servers.**

---

### Task G.2: Update task board + push PR comment

**Files:**
- Modify: `planning/redesign-task-board.md`

- [ ] **Step 1: Mark all Plan 2 tasks DONE in the board**

Open `planning/redesign-task-board.md`. For each P2-* row in the "Plan 2 — Learner loop completion" table, change `TODO` → `DONE` and add the SHA of the commit that landed it. Add a "Plan 2 review findings" section mirroring Plan 1's structure.

If R5 ended up partially deferred (e.g., chose option 1 but full child-onboarding UI is bigger than expected), mark P2-R5 as `IN_PROGRESS` or `DEFERRED → Plan 3` with a note instead of `DONE`.

- [ ] **Step 2: Update the at-a-glance progress table**

```markdown
| 2 | Learner loop completion (campaign, prepare, mission-prep, battle, inventory, shop, victory) | **DONE** | [plan-2](../docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md) |
```

- [ ] **Step 3: Commit the board update**

```powershell
git add planning/redesign-task-board.md
git commit -m "docs(planning): mark Plan 2 tasks DONE on the redesign task board"
```

- [ ] **Step 4: Push the branch (ASK FIRST)**

Per Plan 1 user-preference carry-over: every push needs explicit user approval. Surface this:

```
Plan 2 is complete locally — N new commits since the last push (commit
list: …). Want me to push to origin/redesign/v2-from-reference?
```

If approved:

```powershell
git push
```

- [ ] **Step 5: Post a Plan 2 acceptance comment on PR #8**

After push completes:

```powershell
gh pr comment 8 --body @'
Plan 2 complete — Learner loop finished.

**What landed:**
- Campaign mission list (`/campaign/[slug]`)
- Academy hub (`/campaign/[slug]/prepare`) with Lessons / Shorts / AI Tutor / Forge tabs
- Mission warm-up quiz (`/campaign/[slug]/mission/[missionId]/prep`)
- Turn-based 2D battle (`/campaign/[slug]/battle/[missionId]`) — 4-file split per CLAUDE.md rule #8
- Standalone Inventory + Shop + Victory pages
- Re-skinned standalone /login + /signup

**Plan-1 review findings closed:**
- R2 — character-gate race (hasHydrated flag in character-store)
- R3 — buy/equip wired to backend inventoryApi
- R4 — useAuth unmount guard
- R5 — minor-account signup per ADR-006; @Roles tightened to 'child'

**Deferred to Plan 3:**
- Backend hybrid combat validation (spec §5.6, P3-07)
- Backend KP-credit endpoints for academy + battle rewards
- Persistent academy progress across sessions
- Adult-facing pages re-skin
- i18n re-key + RTL Arabic font binding
- E2E suite rewrite

Smoke test passed end-to-end (Welcome → Character → Dashboard → Campaign → Prepare → Mission Prep → Battle → Victory → Shop → Equip → re-Battle). PR remains draft until Plan 3 lands.
'@
```

If F.1 ended up partial / deferred, edit the comment accordingly before sending.

---

## Self-review checklist (writing-plans skill)

Before declaring this plan ready for execution, the plan author runs this once:

- [ ] **Spec coverage:** every spec §5.1 route in the redesign route map (other than the adult-facing pages, which are Plan 3) maps to a task in this plan.
- [ ] **Spec coverage:** spec §5.7 component port plan items not already done in Plan 1 are covered (battle.tsx splits in Phase C; nothing else outstanding for Plan 2).
- [ ] **Spec coverage:** all 4 Plan-1 review findings (R2, R3, R4, R5) have a Phase A or F task.
- [ ] **Placeholder scan:** no "TBD", "implement later", "fill in details", "add appropriate error handling", or "similar to Task N" placeholders. The R5 implementation is the only intentional gap and is explicitly gated on a user decision (F.0).
- [ ] **Type consistency:** `inventoryApi.purchaseItem` body shape (`{itemId, itemType: 'ability' | 'weapon'}`) matches the backend `PurchaseItemDto`. `equipWeapon` body matches `{weaponId: string | null}` per the backend `EquipWeaponDto`.
- [ ] **Type consistency:** `useGame()` adapter return shape exposes `completedLessons` / `watchedVideos` (consumed in PrepareForMission task B.2) — no rename drift.
- [ ] **Type consistency:** Battle's `_battle-config.ts` exports `BASE_ABILITIES`, `Ability`, `LogEntry`, `rand` — all referenced by `page.tsx` task C.5.
- [ ] **Type consistency:** Character store's `hasHydrated` flag is read by `(learner)/layout.tsx` (task A.4) — both files updated in the same task batch so types stay in sync.

---

## Where to find things

- **Spec:** [docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md](../specs/2026-05-09-redesign-from-reference-design.md)
- **Plan 1 (foundation reference):** [docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md](2026-05-11-redesign-plan-1-foundation-and-learner-shell.md)
- **Task board (cross-plan status):** [planning/redesign-task-board.md](../../../planning/redesign-task-board.md)
- **Plan 1 handover (state at session start):** [docs/superpowers/handover/2026-05-13-plan-1-complete-handover.md](../handover/2026-05-13-plan-1-complete-handover.md)
- **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, DO NOT modify)
- **CLAUDE.md (non-negotiable rules):** [CLAUDE.md](../../../CLAUDE.md)

---

*Plan 2 authored 2026-05-14 atop completed Plan 1. Mirrors Plan 1's structure (pre-flight + numbered phases + tasks with TDD-shaped steps + commits). Phase F is intentionally gated on a user decision — do not auto-pick a kid-signup flow.*
