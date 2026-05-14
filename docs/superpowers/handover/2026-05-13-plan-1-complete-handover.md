# Plan 1 Complete — Eureka Lab Redesign Handover

> **Created:** 2026-05-13. This is a handover doc for starting a fresh session after Plan 1 of the redesign is fully complete.
> **Trigger:** Previous session finished Plan 1 (24 commits + task board) and the user wants a clean baseline for whoever picks up next.

---

## TL;DR for the resuming agent

You are inheriting a **complete and merged-into-PR-#8 Plan 1**. Plan 1 ("Foundation + Learner Shell") of the N-plan redesign reverts the broken Phase 16 `/g/*` parallel universe and rebuilds the app in place using `ai-adventure-island` as the canonical visual/behavioral source of truth.

**Plan 1 status: DONE.** 24 commits on `redesign/v2-from-reference`, smoke test passed, code review completed, 1 Important finding landed, 4 Important findings + 5 nits deferred to Plan 2/3 with explicit tracking in `planning/redesign-task-board.md`.

**Plan 2 status: NOT STARTED.** Only high-level stubs exist (P2-01 … P2-AC) — the detailed plan still needs to be written via the `superpowers:writing-plans` skill before any subagent dispatch.

**Plan 3+ status: NOT STARTED.** Stubs only (P3-01 … P3-13).

**Resume by:**
1. Reading this doc.
2. Reading the task board: [`planning/redesign-task-board.md`](../../../planning/redesign-task-board.md) — single source of truth for cross-plan progress.
3. Reading the spec for full context: [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md) (sections 5.1, 5.6, 6, 7, 9 are most relevant for what's next).
4. Reading Plan 1 as a reference for the working pattern: [`docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md`](../plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md).
5. Then ask the user which of these they want to start with (the user has not pre-authorized any next step):
   - Write the **Plan 2** detailed plan (Campaign + Mission Prep + Battle + Inventory + Shop + Victory + carry-over review findings R2–R5).
   - Land one of the deferred **nits N1–N5** from the task board (smaller, lower-risk).
   - Mark **PR #8 ready for review** and merge to `main` before starting Plan 2.

---

## Repo + branch state

- **Working directory:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, canonical visual source of truth — DO NOT modify)
- **Current branch:** `redesign/v2-from-reference`
- **Tracking:** `origin/redesign/v2-from-reference` (up to date)
- **HEAD:** `79326c5  docs(planning): redesign task board with Plan 1 history + Plan 2/3 stubs`
- **Draft PR:** https://github.com/katanaTech/eureka-lab/pull/8 (state: OPEN, isDraft: true, base: `main`)
- **Latest PR comment:** `amoun00` "Plan 1 complete — Foundation + Learner Shell" (2026-05-13)

### Commit history on the branch (most-recent first)

```
79326c5 docs(planning): redesign task board with Plan 1 history + Plan 2/3 stubs
f56139e fix(state): cascade inventory reset through useGame().reset()             ← Review finding R1
ddf4e87 fix: smoke-test follow-ups for Phase 2 flow                                ← Tasks 2.S3 batch
804a6cd fix(auth): Welcome register uses backend signup, not client-only Firebase  ← Task 2.S2
84b9539 fix(shared-types): resolve to dist for Node, keep src for Vercel           ← Task 2.S1
57e3449 feat(dashboard): port Realm Map dashboard from reference                   ← Task 2.7
057477c feat(character): port CharacterCreate page from reference                  ← Task 2.5
77bd939 feat(learner): add (learner) route group with auth + character gate        ← Task 2.4
b7f17ed feat(auth): wire Firebase email/password + Google OAuth to Welcome page    ← Task 2.3
987b592 feat(welcome): port ai-adventure-island Welcome as new landing page        ← Task 2.2
c73da28 feat(routing): bulk redirect /g/* and /m/* -> /dashboard                   ← Task 2.1
cc1ca5f feat(404): global not-found.tsx in fantasy chrome                          ← Task 1.13
b71887a fix: clear broken imports left by R3F parking                              ← Task 1.12
3d4126b docs(handover): plan 1 mid-execution handover for session resume           ← Previous handover
be22d6c feat(state): add useGame() adapter wrapping Zustand stores                 ← Task 1.11
bbfdca3 feat(state): add character-store + characterApi/inventoryApi clients       ← Task 1.10
d19469d feat(data,assets): port ai-adventure-island game/quiz/academy data and jpg ← Tasks 1.8 + 1.9
f6dce5b refactor(components): hoist fantasy/* -> game/* (fantasy is only mode)     ← Task 1.7
8155697 feat(styles): port ai-adventure-island design tokens + Cinzel/Amiri fonts  ← Tasks 1.5 + 1.6
ebee274 refactor(types): rename phase16.types.ts → gameplay.types.ts, prune        ← Tasks 1.3 + 1.4
d853870 refactor: park Phase 15 R3F components to _future_r3f/ + add README        ← Tasks 1.1 + 1.2
a631239 fix(types): re-export phase16.types from shared-types index                ← Mid-Phase-0 fix
308c631 salvage(phase-16): restore backend modules, stores, fantasy components ... ← Task 0.3
b31694c Revert "Merge pull request #7 from katanaTech/feature/phase-16-fantasy-ui" ← Task 0.2
```

### Working tree state

```
M .claude/settings.local.json        ← Local-only, leave alone, don't stage
M apps/web/src/hooks/useAuth.ts      ← !!! Uncommitted defensive fix, see below
M apps/web/tsconfig.tsbuildinfo      ← tsc artifact, leave alone, don't stage
?? planning/~$reka-Lab-Strategy.docx ← Word lockfile when user has docx open; ignore
```

#### ⚠️ Uncommitted defensive useAuth fix (NOT user-approved)

`apps/web/src/hooks/useAuth.ts` has an uncommitted diff that adds an automatic `signOut()` when `authApi.getMe()` returns 404 (orphan-session recovery). **The user explicitly rejected this fix during the previous session** ("Skip — just clear localStorage") because they preferred to manually clear localStorage rather than add the defensive sign-out behavior.

The diff appears to have been re-applied or never reverted after the user's "Skip" answer. Before doing anything else in the new session:

1. **Verify with the user** — do they now want this defensive fix landed, or should it be reverted?
2. If revert: `git restore apps/web/src/hooks/useAuth.ts`
3. If land: it folds naturally into Plan 2 review finding **R4** ("add unmount guard to useAuth"), so commit it as part of the R4 task in Plan 2 rather than now.

Don't commit it silently either way.

### Stashes (local-only, safe to drop after Plan 2 starts)

```
stash@{0}: On main: phase-16-planning-edits        (snapshot — meaningless after revert)
stash@{1}: On main: phase-16-leftovers             (lockfile, assets, build artifacts, e2e specs)
stash@{2}: WIP on feature/phase-16-fantasy-ui      (the deleted Phase 16 branch)
```

These are leftover from Phase 0's salvage/revert. None are needed for Plan 2. Drop them once you're confident there's nothing to recover (`git stash drop` x3).

---

## What's done in Plan 1

### Phase 0 — Branch / Salvage / Revert (4/4 tasks DONE)

| ID | Task | Commit |
|---|---|---|
| 0.1 | `salvage/phase-16` branch + manifest | (off-branch) |
| 0.2 | Cut `redesign/v2-from-reference`, revert Phase 16 merge | `b31694c` |
| 0.3 | Cherry-pick salvage paths back | `308c631` |
| 0.4 | Build/tsc/lint verified, draft PR #8 opened | `a631239` (types re-export fix) |

### Phase 1 — Foundation (13/13 tasks DONE)

| ID | Task | Commit |
|---|---|---|
| 1.1 | Park 27 R3F components → `_future_r3f/` | `d853870` |
| 1.2 | `_future_r3f/README.md` resumption path | `d853870` |
| 1.3 | Remove `featureFlags.fantasyUi` | `ebee274` |
| 1.4 | Rename `phase16.types.ts` → `gameplay.types.ts` | `ebee274` |
| 1.5 | Port reference design tokens into `globals.css` | `8155697` |
| 1.6 | Tailwind extensions + Cinzel/Amiri via `next/font` | `8155697` |
| 1.7 | Hoist `components/game/fantasy/*` → `components/game/*` | `f6dce5b` |
| 1.8 | Port `data/{game,quiz,academy}.ts` | `d19469d` |
| 1.9 | Port 11 game assets into `public/assets/game/` | `d19469d` |
| 1.10 | `character-store` + `characterApi` + `inventoryApi` | `bbfdca3` |
| 1.11 | `useGame()` adapter at `state/game-context.tsx` | `be22d6c` |
| 1.12 | Clear broken imports from R3F parking | `b71887a` |
| 1.13 | Global `not-found.tsx` in fantasy chrome | `cc1ca5f` |

### Phase 2 — Welcome / Character / Dashboard (9/9 tasks DONE)

| ID | Task | Commit |
|---|---|---|
| 2.1 | Bulk redirect `/g/*` and `/m/*` → `/dashboard` | `c73da28` |
| 2.2 | Welcome page + Sonner toaster | `987b592` |
| 2.3 | Firebase email/password + Google OAuth | `b7f17ed` |
| 2.4 | `(learner)/layout.tsx` (auth + character gate) | `77bd939` |
| 2.5 | `CharacterCreate` → `(learner)/character/page.tsx` | `057477c` |
| 2.6 | Backend character endpoints verified (no-op) | — |
| 2.7 | Dashboard (Realm Map) → `(learner)/dashboard/page.tsx` | `57e3449` |
| 2.8 | E2E manual smoke test | — |
| 2.9 | PR #8 acceptance comment | — |

### Smoke-test follow-ups + review fix

| ID | Fix | Commit |
|---|---|---|
| 2.S1 | `shared-types/package.json` `node` exports condition for NestJS runtime | `84b9539` |
| 2.S2 | Welcome register calls `authApi.signup` (was Firebase-client-only) | `804a6cd` |
| 2.S3 | Register `InventoryModule`, broaden inventory `@Roles('child', 'parent')`, add next-intl `timeZone` | `ddf4e87` |
| R1 | `useGame().reset()` cascades `inventoryStore.reset()` | `f56139e` |

---

## Carry-over from Plan 1 final review (4 Important + 5 Nit, all in `planning/redesign-task-board.md`)

### Important — deferred to Plan 2

| ID | Finding | Plan 2 task ID |
|---|---|---|
| R2 | `(learner)/layout.tsx` character-gate races with in-flight hydrate | P2-R2 |
| R3 | `useGame().buyAbility/buyWeapon` are optimistic-local; JSDoc misleading | P2-R3 |
| R4 | `useAuth` lacks unmount guard for async `onAuthStateChanged` | P2-R4 |
| R5 | Welcome hardcodes `role:'parent'`; inventory `@Roles` broadened with TODO | P2-R5 |

R5 in particular needs **spec clarification** before Plan 2 can land it cleanly — the question "how should kids sign up?" is open question §9 #5 in the spec.

### Nit — tracked, take when convenient

| ID | Finding | Where |
|---|---|---|
| N1 | Dashboard hardcodes `xp=320`, `xpMax=1000`, `LV 3` | wire via gamification-store |
| N2 | Campaign-card `next/image` dims (1024×768) over-sized for rendered ~400×176 | tighten or use `fill` |
| N3 | `character-store.setCharacter` doesn't roll back on PUT failure | snapshot+restore in catch |
| N4 | 6+ ported pages use hardcoded English strings | Plan 3 i18n re-key |
| N5 | `i18n/request.ts` hardcodes `locale='en'` | Plan 3 — read from cookie/header |

N4 and N5 are explicitly **deferred by design** to Plan 3 (i18n re-key sweep). N1–N3 are unblocked and could be landed anytime as small standalone PRs/commits if the user wants quick wins.

---

## What's next — Plan 2 high-level scope

Defined in spec [§5.1](../specs/2026-05-09-redesign-from-reference-design.md#L137). Stub task list in `planning/redesign-task-board.md`:

| ID | Area | Notes |
|---|---|---|
| P2-01 | `/campaign/[slug]` mission list (port `CampaignDetail.tsx`) | |
| P2-02 | `/campaign/[slug]/prepare` Academy hub (lessons/videos/AI Tutor) | hook to existing `learn` content |
| P2-03 | `/campaign/[slug]/mission/[missionId]/prep` warmup quiz | |
| P2-04 | `/campaign/[slug]/battle/[missionId]` combat (4 files: page/stage/quiz/outcome) | wire `combat-store` |
| P2-05 | `/inventory` page | |
| P2-06 | `/shop` page (Global Bazaar re-skin) | wire `inventoryApi.buy/equip` |
| P2-07 | `/victory` page | |
| P2-08 | Re-skin standalone `/login` and `/signup` | Welcome covers MVP path already |
| P2-R2 | Fix character-gate race | review finding R2 |
| P2-R3 | Wire `buyAbility/buyWeapon` to backend | review finding R3 |
| P2-R4 | Unmount guard for `useAuth` | review finding R4 (folds in the uncommitted diff if user approves) |
| P2-R5 | Minor-account signup + retighten inventory `@Roles` | review finding R5 — needs spec clarification |
| P2-AC | Plan 2 acceptance smoke run | |

**Before any subagent dispatch** for Plan 2: write the detailed plan via `superpowers:writing-plans`, mirroring the structure of Plan 1.

---

## Skill state

The previous session operated under:
- **`superpowers:subagent-driven-development`** — per-task batching dispatched to general-purpose subagents.
- **`superpowers:code-reviewer`** — used once at the end of Plan 1.

**User preferences carried over from previous sessions:**
- **Push timing:** push when explicitly told. Do NOT push speculatively — even when a PR auto-updates.
- **Update cadence:** brief. Report at phase boundaries (Phase 1 done, Phase 2 done) — don't chatter between tasks.
- **Smoke testing:** the user drives the smoke test manually. Don't auto-spawn Playwright or curl loops for happy-path verification.
- **Commit/push approvals:** every push has been individually approved during the session. Continue asking before pushing.

---

## Gotchas the previous sessions discovered (still applicable)

1. **Tailwind v4, NOT v3.** No `tailwind.config.ts`. Tailwind config lives in `apps/web/src/app/globals.css` under `@theme inline { … }`. When adding fonts/keyframes/colors, edit globals.css.

2. **`shared-types` package needs dual-resolution exports.** Vercel/Next.js build resolves to `./src/index.ts` (raw TS, transpiled in-bundle); NestJS runtime needs `./dist/index.js` (compiled CJS). The current `packages/shared-types/package.json` has:
   ```json
   "main": "./dist/index.js",
   "types": "./src/index.ts",
   "exports": {
     ".": {
       "types": "./src/index.ts",
       "node": "./dist/index.js",
       "default": "./src/index.ts"
     }
   }
   ```
   If you add a new type to `shared-types` and the API server crashes with `SyntaxError: Unexpected token 'export'`, rebuild: `pnpm --filter @eureka-lab/shared-types build`.

3. **`useAuthStore.user` is `UserProfile` (from `@eureka-lab/shared-types`), not Firebase `User`.** `displayName` and `email` are non-nullable strings on `UserProfile`. The `useGame()` adapter's `?? 'Hero'` / `?? ''` fallbacks are defensive but never trigger.

4. **`FantasyCharacter` backend ↔ `Character` frontend rename.** Backend: `{ name, class, classColorHsl, weaponName, createdAt }`. Frontend: `{ name, class, color, weaponName }`. `characterApi` in `apps/web/src/lib/api-client.ts` maps both directions transparently (`color ↔ classColorHsl`).

5. **Reference project's `useGame()` API matches our adapter.** Ported reference pages should compile against the adapter without changes — switch `react-router-dom` to `next/navigation`, replace asset imports with public/-relative strings, add `'use client';`.

6. **Welcome register flow needs `authApi.signup` BEFORE `signInWithEmailAndPassword`.** Calling `createUserWithEmailAndPassword` directly skips the Firestore profile creation. Plan 2's `/login` and `/signup` standalone pages already follow this pattern via `SignupForm.tsx` — match it.

7. **Sonner toaster is mounted in `app/page.tsx` (Welcome)**, not in `app/layout.tsx`. If you want toasts on other top-level pages, lift it to the root layout. (Reference does the same — `Welcome.tsx` owns the toaster.)

8. **Inventory `@Roles` is temporarily broadened to `['child', 'parent']`.** Per `apps/api/src/modules/inventory/inventory.controller.ts:33-36`, this is a TODO that re-tightens to `'child'` once Plan 2's P2-R5 minor-account signup lands. Don't broaden further; do retighten in P2-R5.

9. **next-intl `getRequestConfig` MUST include `timeZone`.** Without it, every `OfflineBanner` render logs `IntlError: ENVIRONMENT_FALLBACK` to the console. Current value: `'UTC'` (placeholder). Plan 3 §7 will read from cookie/header.

10. **Pre-existing test-file errors are not our problem.** ~79 lines of vitest Mock typing errors in `CelebrationOverlay.test.tsx`, `useMobileDetect.test.ts`, `usePullToRefresh.test.ts`, `usePushNotifications.test.ts` exist on this branch and predate Phase 16. Leave them alone. Plan 1/2 acceptance doesn't require them to pass. Plan 3 §11 (E2E rewrite) addresses test infra holistically.

11. **Don't delete files in `_future_r3f/`.** 27 parked R3F components + README. Long-term 3D vision is preserved by spec §11.

12. **Don't modify files under `docs/superpowers/`.** Plans, specs, and handover docs are append-only artifacts. Update the task board (`planning/redesign-task-board.md`) instead for ongoing status.

13. **`(game)/` and `(mobile)/` route groups should be GONE.** They were Phase 16. If they exist, the revert didn't catch them — investigate.

---

## Where to find things

- **Single source of truth for cross-plan status:** [`planning/redesign-task-board.md`](../../../planning/redesign-task-board.md)
- **Plan 1 detailed plan (reference for Plan 2/3 structure):** [`docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md`](../plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md)
- **Full redesign spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md)
- **Open spec questions:** spec [§9](../specs/2026-05-09-redesign-from-reference-design.md#L381) — 5 items, most relevant for Plan 2 is #5 (kid signup role).
- **Previous handover (Plan 1 mid-execution):** [`2026-05-11-plan-1-handover.md`](2026-05-11-plan-1-handover.md) — for historical context only; superseded by this doc.
- **CLAUDE.md (project rules):** [`CLAUDE.md`](../../../CLAUDE.md) — non-negotiable. Read first.
- **Pre-redesign platform phases 1–15 task board:** [`planning/task-board.md`](../../../planning/task-board.md) and [`planning/sprint-01.md`](../../../planning/sprint-01.md) — authoritative for what existed before redesign, last verified 2026-03-07.

---

## Pre-flight checks for the resuming agent

Run these before doing anything else:

```powershell
git status                              # Expect: redesign/v2-from-reference, useAuth.ts dirty (see warning above)
git log --oneline -1                    # Expect: 79326c5 docs(planning): redesign task board ...
git log --oneline main..HEAD | wc -l    # Expect: 24
gh pr view 8 --json state,isDraft       # Expect: state=OPEN, isDraft=true
```

Then ask the user which of these to start with:
- Write the **Plan 2** detailed plan (largest scope, kicks off active dev again).
- Land **nits N1–N3** (small wins, no plan needed).
- Mark PR #8 **ready for review** and merge to `main` first.
- Address the **uncommitted useAuth diff** (revert or roll into P2-R4).

---

## Final acceptance checklist for Plan 1 (all checked)

- [x] Branch `redesign/v2-from-reference` has all 24 commits listed above.
- [x] `pnpm build` and `pnpm exec tsc --noEmit` clean across the monorepo (pre-existing test errors only).
- [x] `apps/web/src/components/_future_r3f/` has 27+ R3F components + README.
- [x] No active route imports from `_future_r3f/`.
- [x] `globals.css` contains reference design tokens. Cinzel + Inter + Amiri loaded via next/font.
- [x] `/`, `/character`, `/dashboard` render the reference design.
- [x] Full sign-up → character → dashboard flow works end-to-end on dev server (smoke test passed).
- [x] Sign-out returns to `/` and prevents re-entry to `/dashboard` while anonymous. Inventory + character cascaded reset.
- [x] `/g/:path*` and `/m/:path*` redirect to `/dashboard`.
- [x] PR #8 acceptance comment posted.
- [x] Final code review completed; findings tracked in task board with severity + deferral status.

---

*Handover authored 2026-05-13 at the natural seam between Plan 1 (DONE) and Plan 2 (UNWRITTEN). Supersedes [`2026-05-11-plan-1-handover.md`](2026-05-11-plan-1-handover.md).*
