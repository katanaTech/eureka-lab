# Redesign — Adopt `ai-adventure-island` as the canonical UI for Eureka Lab

> **Status:** Draft for user review
> **Date:** 2026-05-09
> **Branch:** `redesign/v2-from-reference` (to be cut from `main` at `58c9f25`)
> **Supersedes:** Phase 16 sprint plan (`planning/sprint-p16.md`), ADR-002…005 marked historical

---

## 1. Problem statement

The Phase 16 multi-agent effort produced a parallel `/g/*` "game mode" bolted onto the existing
Eureka Lab app. The intended outcome was a **whole-app visual redesign** matching the reference
project at `C:\Eureka-lab-app\Dev\ai-adventure-island`. The actual outcome is two apps glued by a
feature flag, with real bugs (re-login on entering game mode, multiple "home" buttons, broken
shop/settings flows, ~38 failing E2E tests across chromium/mobile-chrome).

The user has decided to **revert Phase 16, salvage the reusable backend pieces, and redesign the
existing app in place** so the reference's visual language and page structure cover the entire
learner experience and the adult-facing pages too.

## 2. Goals

1. The Eureka Lab app (`apps/web`) adopts the reference's design tokens, components, page
   structure, navigation flow, and game loop — fantasy app-wide.
2. Single Firebase auth. Single concept of "Home" (`/dashboard` for authenticated, `/` for
   anonymous). Logout is the only action that returns to the landing page.
3. Existing platform plumbing is preserved: Next.js 14 App Router, `next-intl` (en/fr/ar with
   RTL), `next-pwa`, Firebase Auth + Firestore + Storage, Stripe checkout, parental consent flow,
   classroom/teacher routes.
4. Existing Eureka curriculum (Levels 1–4, lessons, modules) is framed as the reference's
   campaigns and missions — no new lesson authoring required for V1.
5. No more `/g/*` parallel routes. No more `/m/*` mobile mirror routes. No more
   `featureFlags.fantasyUi` — fantasy is the only mode.

## 3. Non-goals

- Rebuild infrastructure (auth, i18n, PWA, deploy, Stripe).
- Build the **3D game mode** in this phase. R3F is paused, not killed (see §11). The 3D
  zombie-combat experience remains the long-term product vision but is out of scope here.
- Maintain backwards compatibility with `/g/*` URLs beyond a single bulk redirect to
  `/dashboard`.
- Author new mission narratives, quiz banks, or boss encounters. V1 reuses what exists.
- Mirror routes for mobile. The reference's responsive treatment is sufficient for V1.
- Preserve `featureFlags.fantasyUi`, `tenants.uiModeLock`, `UiModeResolver`, or any
  multi-mode UI scaffolding.

## 4. Salvage and revert plan

### 4.1 Salvage list (cherry-pick to `salvage/phase-16` BEFORE the revert lands)

**Backend (cherry-pick from current main):**
- `apps/api/src/modules/inventory/**` — Firestore-backed KP/shop/equip module (added in P16).
- `apps/api/src/modules/users/character/**` — character get/put endpoints (added in P16).
- *Note:* `apps/api/src/modules/combat/**` is **NOT** on the salvage list — it's a Phase 15
  module that predates the merge being reverted, so it survives the `git revert -m 1 58c9f25`
  unchanged.

**Shared types (keep):**
- `packages/shared-types/src/phase16.types.ts` → rename to `gameplay.types.ts`. Drop UI-mode
  related types (`UiMode`, `TenantUiModeLock`). Keep `FantasyClass`, `FantasyCharacter`,
  `Inventory`, `ShopAbility`, `ShopWeapon`, `KpEarnEvent`, and the campaign/zone mappings.

**Frontend (keep):**
- `apps/web/src/components/game/fantasy/**` — all 7 components (Scene, Logo, GameButton, KpBadge,
  AiTutorChat, NavLink, HpBar). They are direct ports of the reference and ready to use.
- `apps/web/src/stores/{combat-store,inventory-store,auth-store,ai-assistant-store,workflow-store,project-store,agent-store,gamification-store,ui-store}.ts`
  — predate Phase 16 or wire to Phase 15 combat backend.
- `apps/web/public/assets/game/**` — placeholder SVGs. Replace with reference's `.jpg` art when
  porting `data/game.ts` (reference uses `.jpg`).
- `apps/web/src/messages/{en,fr,ar}.json` Phase16 namespaces — re-key to new page paths.

### 4.2 Discard outright (removed by the revert + intentional follow-up deletes)

**Removed by `git revert -m 1 58c9f25` automatically:**
- `apps/web/src/app/(game)/**` — entire game route group.
- `apps/web/src/app/(mobile)/**` — entire mobile mirror route group.
- `apps/web/src/hooks/useUiMode.ts`.
- All `featureFlags.fantasyUi` references — flag and call sites.
- `planning/sprint-p16.md`, `planning/phase-16-gamified-ui-redesign.md`, Phase 16 sections of
  `planning/blockers.md`, `.claude/agents/`.
- `apps/api/src/modules/tenants/uiModeLock` field.

**Restored by the revert and re-parked (NOT deleted) for the future 3D phase:**

The Phase 15 R3F components are the foundation for the planned 3D zombie-combat experience
(§11). The revert restores them to `apps/web/src/components/game/`. Because the 2D redesign
needs that namespace for the salvaged fantasy components, the R3F set must be moved aside —
preserved, not deleted.

- Move `apps/web/src/components/game/{BattlePlayer,CareerAttackEffect,CareerPicker,CharacterCustomizer,CharacterModel,CharacterPreview,CombatArena,CombatHUD,CombatScreens,DamageNumber,GameHUD,GameProvider,InventoryGrid,LearningOverlay,MissionCompleteScreen,MissionDoor,MissionRoom,MobileCombatView,PlayerCharacter,QuestionCard,WorldMap,ZombieCharacter,ZombiePortal,ZoneDecorations,ZoneInterior,ZoneIsland,ZoneNPC}.tsx`
  → `apps/web/src/components/_future_r3f/`.
- `apps/web/src/components/game/CertificateScreen.tsx` — keep in place if `victory/page.tsx`
  reuses it; otherwise move to `_future_r3f/` (it predates Phase 16 and may still be useful).
- `apps/web/src/stores/game-store.ts` — move to `_future_r3f/game-store.ts` (paused, not deleted).
- `r3f`, `three`, `@react-three/*` deps in `apps/web/package.json` — **keep installed** so the
  paused components still type-check on demand. Optionally move to `optionalDependencies` if
  bundle size is a concern; verify Next.js build does not include them when no active route
  imports them (App Router tree-shaking should handle this naturally).
- Add `apps/web/src/components/_future_r3f/README.md` documenting: what these components do,
  why they're paused, and how the 3D phase will resume from here.

**Always delete (independent of revert):**
- `apps/web/e2e/fantasy-flow.spec.ts`, `apps/web/e2e/fantasy-flag-matrix.spec.ts`,
  `apps/web/e2e/fixtures/**` — Phase 16 E2E suite (will rewrite for new routes).

### 4.3 Revert command sequence (on the new branch)

```bash
git checkout main
git pull
git checkout -b redesign/v2-from-reference

# Cherry-pick salvage onto a separate prep branch first (to avoid conflicts in the revert)
git checkout -b salvage/phase-16
# Manually copy or `git restore --source=58c9f25 -- <paths>` for each salvage path
# Commit as: "salvage(phase-16): preserve backend modules, stores, fantasy components, types"

git checkout redesign/v2-from-reference
git revert -m 1 58c9f25 --no-edit
# Resolve any conflicts; the revert removes (game)/(mobile) route groups,
# legacy_r3f, useUiMode, the flag, sprint planning files, etc.

# Cherry-pick salvage commit back in
git cherry-pick <salvage-sha>

# Push as draft PR
git push -u origin redesign/v2-from-reference
gh pr create --draft --title "redesign(v2): adopt ai-adventure-island as canonical UI" \
  --body "Reverts Phase 16 parallel /g/* universe; rebuilds in place from the reference design."
```

`main` is untouched throughout.

## 5. Architecture

### 5.1 Route map (after redesign)

```
apps/web/src/app/
├── layout.tsx               Root: Cinzel + Inter + Amiri (RTL), Toaster, providers
├── page.tsx                 [/]                  Welcome (anonymous landing + auth)
├── (auth)/                                       Re-skinned in fantasy
│   ├── login/page.tsx       [/login]             Firebase login (fantasy form)
│   └── signup/page.tsx      [/signup]            Firebase signup + parental consent
├── (learner)/                                    Fantasy aesthetic
│   ├── layout.tsx           ProtectedRoute + GameProvider (Zustand stores)
│   ├── dashboard/page.tsx   [/dashboard]         Realm Map (4 campaigns)
│   ├── character/page.tsx   [/character]         CharacterCreate (post-signup, redirect
│                                                  here if no character exists)
│   ├── campaign/[slug]/
│   │   ├── page.tsx                              Mission list
│   │   ├── prepare/page.tsx                      Academy (lessons / videos / AI tutor)
│   │   ├── mission/[missionId]/prep/page.tsx     Warm-up quiz
│   │   └── battle/[missionId]/page.tsx           Battle (split into stage/quiz/outcome)
│   ├── inventory/page.tsx   [/inventory]         KP balance + owned + equipped
│   ├── shop/page.tsx        [/shop]              Global Bazaar (re-themed)
│   └── victory/page.tsx     [/victory]           Final-boss certificate screen
├── (admin)/                                      Re-skinned in fantasy
│   ├── parent/page.tsx      [/parent]
│   ├── teacher/page.tsx     [/teacher]
│   ├── teacher/[classroomId]/page.tsx
│   ├── settings/page.tsx    [/settings]          Profile, language, notifications (no UI mode)
│   ├── achievements/page.tsx [/achievements]
│   ├── pricing/page.tsx     [/pricing]
│   └── checkout/{success,cancel}/page.tsx
└── ~offline/page.tsx                             Re-skinned offline fallback
```

**Bulk legacy redirect** in `next.config.js`:
```js
async redirects() {
  return [
    { source: '/g/:path*', destination: '/dashboard', permanent: true },
    { source: '/m/:path*', destination: '/dashboard', permanent: true },
  ];
}
```

### 5.2 Concept mapping (Eureka curriculum ↔ reference world)

| Eureka concept | Reference concept | Visual artifact |
|---|---|---|
| Level 1 — AI Conversation | Campaign 1 — Isle of Prompts | Cyan-tinted island card |
| Level 2 — Workflow Automation | Campaign 2 — Forge of Workflows | Gold-tinted island card |
| Level 3 — Vibe Coding | Campaign 3 — Vibe Codex | Green-tinted island card |
| Level 4 — Buddy Agents | Campaign 4 — Agent Sanctum | Violet-tinted island card |
| Module (set of lessons) | (none — flatten) | — |
| Lesson | Mission (one battle) | Mission card on campaign page |
| Practice activity | (mapped onto mission's `prepare` Academy) | Lesson/video/AI-tutor cards |
| Final assessment | Boss mission (`*-boss`) | Boss banner + elite difficulty |
| Career archetype (8 enum) | Character class (4) — 2 careers per class | Character creation carousel |

**Decision:** flatten Module → Mission directly (1 lesson = 1 mission). For V1 we don't need a
"module" intermediate level on the Realm Map.

### 5.3 Visual language

Verbatim port of reference's `src/index.css` plus `tailwind.config.ts` extensions:

- **Background:** `--background: 230 40% 5%` (deep night blue), `--gradient-bg` radial.
- **Primary (cyan):** `188 95% 55%` for action buttons, links, glows.
- **Secondary (violet):** `268 70% 55%` for chapter accents.
- **Accent (gold):** `42 95% 60%` for KP, victory, special abilities.
- **Destructive (crimson):** `0 85% 60%` for damage, errors, danger states.
- **Success (green):** `145 70% 50%` for ready states, victories.
- **Display font:** Cinzel (Latin) + Amiri or Reem Kufi (Arabic).
- **Body font:** Inter (already wired in Eureka root layout).
- **Utilities:** `panel`, `rune-ring`, `scanlines`, `text-glow-{primary,gold,violet}`,
  `bg-gradient-{primary,secondary,gold,card}`, `glow-{primary,secondary,gold}`.
- **Keyframes:** `flicker`, `float-slow`, `pulse-glow`, `shake`, `hit-flash`, `slash`,
  `damage-pop`, `victory-burst`, `fade-in-up`, `rune-spin`, `shimmer`.

### 5.4 State model

Replace reference's `GameContext` with our existing Zustand stores plus one new store:

| Store | Source | Role |
|---|---|---|
| `auth-store` | Existing (Firebase) | Replaces reference `setUser({username, email})` mock |
| `inventory-store` | Salvaged | KP, ownedAbilities, ownedWeapons, equippedWeapon |
| `combat-store` | Salvaged | Battle state machine (HP, phase, questions, animations) |
| `character-store` | **New (~50 LOC)** | name, class, color, weaponName — persisted to Firestore via `PUT /api/v1/users/me/character` |
| `gamification-store` | Existing | Lifetime XP, badges, streaks |
| `ai-assistant-store` | Existing | AI Tutor chat state |

**Persistence:**
- KP, character, inventory → Firestore (multi-device sync).
- Local Zustand caches hydrate from server on auth, write-through on mutations.
- No `localStorage` mirror — drop the reference's `STORAGE_KEY = "ai-quest-state-v2"` pattern.

### 5.5 Auth flow

The Welcome page (`/`) renders the reference's two-tab "Begin Quest / Return Hero" form. Submit
handlers wrap Firebase Auth:

```tsx
// signup
await createUserWithEmailAndPassword(auth, email, password);
await updateProfile(user, { displayName: heroName });
// → triggers parental-consent gate if user_age < 13 (existing flow)

// login
await signInWithEmailAndPassword(auth, email, password);
```

Below the email form, add a `<GameButton variant="ghost">` for "Sign in with Google" using
`signInWithPopup(auth, googleProvider)`.

After auth: redirect to `/character` if no character exists, else `/dashboard`. Anonymous user
visiting any `(learner)` or `(admin)` route is redirected to `/` (not `/login`).

### 5.6 Combat trust model — hybrid

Per user decision, combat is **client-computes / backend-validates**:

1. Battle init: client calls `POST /api/v1/combat/init` with `{ campaignSlug, missionId }`. Server
   returns `{ battleId, zombieType, playerMaxHp, zombieMaxHp, questions, seed }` and stamps a
   start time.
2. Combat runs entirely client-side using `combat-store`. Each turn updates HP locally.
3. On victory or defeat, client calls
   `POST /api/v1/combat/:battleId/complete` with the full play log
   `{ events: [{ turn, action, damage, timeRemaining, ... }], outcome, finalPlayerHp,
   finalZombieHp }`.
4. Server replays the log against the seeded RNG and validates: was the outcome reachable from
   the questions seen? Did damage values fall in legal ranges? Did the timer respect bounds?
5. If valid: write XP/KP/badges. If invalid: log a moderation event, return 422 with no rewards.

This is a backend change beyond what the inventory/combat module does today (which trusts the
client outcome). The combat module's `complete` endpoint must be extended to accept the play
log and validate it server-side before writing rewards. Implementation cost is ~1 sprint of
backend work and ships as part of the redesign — there is no client-trust fallback.

### 5.7 Component port plan

**Already on disk (verbatim ports of reference, located at
`apps/web/src/components/game/fantasy/`):**

- `Scene.tsx`, `Logo.tsx`, `GameButton.tsx`, `KpBadge.tsx`, `AiTutorChat.tsx`, `NavLink.tsx`,
  `HpBar.tsx`.

These get cherry-picked back from the salvage commit. **Order of operations:**

1. Cherry-pick the salvage commit (re-introduces `components/game/fantasy/`).
2. Move the Phase 15 R3F components in `components/game/` → `components/_future_r3f/` per §4.2
   (parked, not deleted).
3. Move `components/game/fantasy/*` → `components/game/*` (drop the `fantasy/` subdir since
   fantasy is the only active 2D mode).
4. Update all imports across the codebase. Verify no active route imports anything from
   `_future_r3f/` (build should not pull three.js into the bundle).

**To be ported as new files:**

- `apps/web/src/data/game.ts` — `CLASSES`, `CAMPAIGNS`, `Mission`, `Campaign` (verbatim).
- `apps/web/src/data/quiz.ts` — fallback question bank.
- `apps/web/src/data/academy.ts` — `ENEMY_STRENGTH`, `getKnowledgeAdvantage`,
  `SHOP_ABILITIES`, `SHOP_WEAPONS`.
- `apps/web/src/state/game-context.tsx` — thin wrapper that pulls all six Zustand stores into a
  single `useGame()` hook matching the reference's API surface (so reference page code can be
  pasted in unchanged).

### 5.8 Page port plan

For each reference page, build the corresponding Next.js page at the route shown in §5.1. Each
page is a "use client" component (most rely on Zustand + Framer-style animations).

| Reference file | New file | Adapter notes |
|---|---|---|
| `Welcome.tsx` | `apps/web/src/app/page.tsx` | Replace `useNavigate` with `next/navigation`. Replace mock `setUser` with Firebase Auth. |
| `CharacterCreate.tsx` | `apps/web/src/app/(learner)/character/page.tsx` | On submit: `PUT /api/v1/users/me/character` then `next/navigation` push to `/dashboard`. |
| `Dashboard.tsx` | `apps/web/src/app/(learner)/dashboard/page.tsx` | `useGame().reset()` becomes Firebase signOut. Replace `<img>` with `next/image`. |
| `CampaignDetail.tsx` | `apps/web/src/app/(learner)/campaign/[slug]/page.tsx` | `useParams()` becomes Next.js `params`. |
| `PrepareForMission.tsx` | `…/campaign/[slug]/prepare/page.tsx` | Hook lessons/videos to existing `learn` content; AI Tutor uses existing chat backend. |
| `MissionPrep.tsx` | `…/campaign/[slug]/mission/[missionId]/prep/page.tsx` | Pre-battle warmup quiz. |
| `Battle.tsx` | `…/campaign/[slug]/battle/[missionId]/page.tsx` | Split into 4 files (page, stage, quiz, outcome) per CLAUDE.md rule #8. Wire to `combat-store` (already salvaged). |
| `NotFound.tsx` | `apps/web/src/app/not-found.tsx` | Global 404 in fantasy chrome. |

## 6. Adult-facing pages (parent / teacher / settings / pricing / achievements)

These pages already exist on `main` pre-Phase-16 and remain functional. The redesign re-skins them
with fantasy chrome but does not change their data model or business logic.

**Re-skin recipe (same for each page):**

1. Wrap the existing page body in `<Scene>` (no background image — neutral dark gradient is fine).
2. Replace top nav with the `<Logo />` + user menu pattern from `Dashboard.tsx`.
3. Replace shadcn `<Card>` containers with `<div className="panel">…</div>`.
4. Replace shadcn `<Button>` with `<GameButton>` for primary actions; keep shadcn `<Button>` for
   tertiary controls inside dense forms.
5. Apply Cinzel headings (`font-display`) to h1/h2; body stays Inter.
6. Use `text-glow-primary` sparingly for h1 only.
7. Adjust color tokens — replace `bg-card` with `panel` utility, `text-muted-foreground` is
   already correct.

This is purely a visual pass — no logic changes — and can be parallelized across pages.

## 7. i18n

The salvaged `messages/{en,fr,ar}.json` Phase16 namespaces re-key as follows:

| Old namespace | New namespace |
|---|---|
| `Phase16Welcome` | `Welcome` |
| `Phase16Character` | `Character` |
| `Phase16Dashboard` | `Dashboard` |
| `Phase16Campaign` | `Campaign` |
| `Phase16Prepare` | `Prepare` |
| `Phase16MissionPrep` | `MissionPrep` |
| `Phase16Battle` | `Battle` |
| `Phase16ShopRealm` | `ShopRealm` |
| `Phase16ShopGlobal` | `ShopGlobal` |
| `Phase16Inventory` | `Inventory` |
| `Phase16Settings` | merge into existing `Settings` |
| `Phase16NotFound` | `NotFound` |
| `Phase16Victory` | `Victory` |

**RTL/Arabic font:** add Amiri (or Reem Kufi) via `next/font/google` and apply via
`html[dir="rtl"] { font-family: 'Amiri', serif }` for `.font-display` selectors. Cinzel does not
support Arabic.

## 8. Risks

1. **Adult-facing fantasy.** Parent and teacher dashboards in dark Cinzel chrome may feel
   off-brand for school B2B sales. We're committing to it per user decision; revisit if a
   prospect pushes back. Mitigation: keep the chrome dark+Cinzel but use Inter for dense data
   tables (Cinzel is hard to read at small sizes).
2. **RTL coverage.** Cinzel is Latin-only. Arabic needs a sister display font. Add to
   `next/font/google` config in root layout.
3. **Combat hybrid validation cost.** The "client computes, backend validates" model is more work
   than either pure approach. The combat module must be extended to accept and replay a play
   log. Plan ~1 sprint of backend work as part of this phase. The chosen model also keeps the
   backend 3D-ready (see §11).
4. **Content gap.** Reference has 16 missions across 4 campaigns; Eureka has many more lessons.
   For V1 we'll show all of them flat under each campaign. May need pagination on campaign pages
   if a level has >10 lessons.
5. **Existing E2E suite.** ~38 failing fantasy E2E tests will be deleted. New E2E suite
   (`apps/web/e2e/learner-flow.spec.ts`) needs to be written against the new routes.
6. **Tech-debt shedding during revert.** The revert restores some pre-Phase-15 fixtures and types
   that may now be stale. Audit during PR review.

## 9. Open questions

1. **Stripe checkout flow.** Existing `/checkout/success` and `/checkout/cancel` pages — do they
   stay at those exact paths or move under `(admin)/`? Default: keep paths, just re-skin.
2. **Mobile detection.** `useMobileDetect` hook still wired (not Phase 16). Do we use it to
   collapse the campaign grid on phones, or rely purely on Tailwind responsive breakpoints?
   Recommend: rely on responsive utilities. `useMobileDetect` becomes redundant.
3. **Service worker.** `next-pwa` may need re-registration after layout changes. Verify in CI.
4. **Sentry source maps.** Existing CI step uploads source maps. New build artifact paths after
   the redesign — verify nothing breaks.

## 10. Success criteria

- A logged-in user lands on `/dashboard` after login. Reload → still on `/dashboard`. No
  re-login prompt.
- A user clicking the "home" icon anywhere in the app goes to `/dashboard` (authenticated) or
  `/` (anonymous). The only path back to `/` while authenticated is the explicit Sign-Out
  button.
- All learner pages use the reference's visual language (Cinzel headings, panel chrome, glow
  effects). Adult-facing pages (parent, teacher, settings, pricing, achievements) use the same
  visual language with appropriate data density.
- KP earned in battle persists to Firestore and is visible on dashboard, inventory, shop.
- Buy / Equip flows work end-to-end (no disabled buttons when balance ≥ price).
- E2E suite (rewritten) passes for the welcome → character → dashboard → campaign → mission →
  battle → shop → equip → battle re-use loop on chromium and mobile-chrome.
- `pnpm build` and `pnpm exec tsc --noEmit` clean for the entire monorepo.
- `git log` after merge shows: salvage commit + revert commit + redesign commits, history
  intact.
- R3F components are present in `apps/web/src/components/_future_r3f/` with a README documenting
  resumption path. Active routes do not import from there. `next build` succeeds.

## 11. Future direction — 3D game mode (out of scope for this phase)

The long-term product vision is a **3D zombie-combat learning experience** that merges AI
literacy curriculum with active gaming: players learn AI skills (prompts, workflows, code,
agents) by fighting Babble Zombies trying to stop them from progressing through chapters and
campaigns. The 2D fantasy redesign in this spec is the **chrome and learning loop**; the 3D
combat experience is a **later phase that will replace the 2D battle screen**.

What this means for the current phase:

1. **Preserve, don't delete, the R3F work.** The Phase 15 R3F components in
   `apps/web/src/components/_future_r3f/` and `apps/web/src/stores/_future_r3f/game-store.ts`
   represent ~3 months of work — character models, combat arena, mission doors, zone interiors,
   attack effects. The future phase resumes from these, not greenfield.
2. **Keep three.js / @react-three deps installed.** Removing them would force a re-add later;
   the cost of carrying them is small (App Router tree-shakes unused code from the bundle).
3. **Design the 2D battle to be cleanly replaceable.** The 2D battle page
   (`/campaign/[slug]/battle/[missionId]`) is the seam where 3D will eventually swap in. Keep
   its public contract (props, state-store API, backend wiring) stable so the future 3D battle
   can drop in without changing the routes around it.
4. **Backend stays 3D-ready.** The hybrid combat trust model (§5.6) — backend validates a play
   log on completion — is exactly what a 3D engine needs (the engine sends a tick log, server
   validates). Designing it that way now avoids a backend rewrite later.
5. **Don't lock out 3D in CSS or routing.** Avoid layout decisions in §5.3 that hard-code "the
   battle is a 2D quiz card" — keep `battle/[missionId]` as a Scene-wrapped full-screen route
   so the future 3D canvas fills it naturally.

**A separate future spec will cover:** picking up where Phase 15 left off, the WebGL/three.js
runtime decisions, asset pipeline, mobile performance budget, and the 2D→3D swap mechanics.
That spec is **not** part of this phase's deliverables.

---

*Spec authored 2026-05-09. Implementation plan to follow via writing-plans skill.*
