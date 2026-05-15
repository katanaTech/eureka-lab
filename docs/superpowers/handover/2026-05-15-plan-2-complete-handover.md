# Plan 2 Complete — Eureka Lab Redesign Handover

> **Created:** 2026-05-15. Handover doc for starting a fresh session after Plan 2 of the redesign is fully complete + smoke-tested + pushed.
> **Trigger:** End-to-end smoke run found two real bugs ("nothing was working" from the user's side), both fixed, branch pushed, PR #8 acceptance comment posted. Clean baseline for whoever picks up Plan 3.
> **Supersedes:** [`2026-05-13-plan-1-complete-handover.md`](2026-05-13-plan-1-complete-handover.md).

---

## TL;DR for the resuming agent

You are inheriting a **complete and pushed-to-PR-#8 Plan 2**. Plan 2 ("Campaign + Combat + Inventory + Shop + Victory") completes the learner loop on top of Plan 1's foundation, closes all four Plan-1 review findings (R2/R3/R4/R5), and ships a kid age-gated signup per ADR-006 minimal slice.

**Plan 2 status: DONE.** 20 commits since Plan 1's HEAD `79326c5`, ending at `ef4752a`. Branch `redesign/v2-from-reference` is **44 commits ahead of `main`**, fully pushed to `origin/redesign/v2-from-reference`. End-to-end smoke passed: kid signup → character → dashboard → campaign → battle (won, +120 XP) → inventory → shop → victory → sign-out — **0 console errors after the two `fix(plan-2)` commits**.

**Plan 3 status: NOT STARTED.** Stubs exist in [`planning/redesign-task-board.md`](../../../planning/redesign-task-board.md) (P3-01 … P3-19) — the detailed plan still needs to be written via the `superpowers:writing-plans` skill before any subagent dispatch. Plan 3 grew by 6 ADR-006/Plan-2 carry-overs (P3-14…19) and 9 Plan-2 review-finding-style items (P2-N1…N9 in the task board).

**Resume by:**
1. Reading this doc.
2. Reading the task board: [`planning/redesign-task-board.md`](../../../planning/redesign-task-board.md) — single source of truth for cross-plan progress.
3. Reading the spec for full context: [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md) (sections 5.6, 6, 7, 9, 11 are most relevant for what's next).
4. Reading [ADR-006](../../context/ADR-006-kid-signup-flow.md) — captures the kid-signup decision, what's in/out of Plan 2 scope, and the three Plan-3 deferrals (P3-14/15/16).
5. Reading Plan 2 as a reference for the working pattern: [`docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md`](../plans/2026-05-14-redesign-plan-2-campaign-and-combat.md).
6. Then ask the user which of these to start with (no next step is pre-authorized):
   - Write the **Plan 3** detailed plan (largest scope: adult-page re-skin + R5 follow-ups + KP-credit backend + hybrid combat validation + i18n + E2E).
   - Land Plan 3 in **smaller standalone PRs** (e.g., adult-page re-skin first, then R5 COPPA, then combat validation) instead of one big plan.
   - Land the deferred **nits N1–N3** from Plan 1 (still TODO — see task board).
   - Mark **PR #8 ready for review** and merge to `main` first, then start Plan 3 from a fresh branch.

---

## Repo + branch state

- **Working directory:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, canonical visual source — DO NOT modify)
- **Current branch:** `redesign/v2-from-reference`
- **Tracking:** `origin/redesign/v2-from-reference` — **up to date** (push completed in Plan 2's G.2 step)
- **HEAD:** `ef4752a fix(plan-2): drop React.use() — Next 14 params are sync; move guard to useEffect`
- **Draft PR:** https://github.com/katanaTech/eureka-lab/pull/8 (state: OPEN, isDraft: true, base: `main`)
- **Latest PR comment:** Plan 2 acceptance comment ([#8 comment 4457212012](https://github.com/katanaTech/eureka-lab/pull/8#issuecomment-4457212012)) posted 2026-05-15.
- **Commits ahead of main:** 44 (Plan 1: 24 + standalone useAuth fix: 1 + Plan 2: 17 + smoke fixes: 2).

### Commit history since Plan 1 HEAD (`79326c5` … `ef4752a`)

```
ef4752a fix(plan-2): drop React.use() — Next 14 params are sync; move guard to useEffect   ← smoke fix
9aecec3 fix(plan-2): allow 'child' role on /auth/signup (smoke-test follow-up)             ← smoke fix
2c3e918 docs(planning): mark Plan 2 tasks DONE; add P3-14..19 follow-ups
1374623 docs(planning): add Plan 2 detailed plan + Plan 1 complete handover
34865c7 feat(auth): kid self-signup with age gate; retighten @Roles to 'child' (R5)        ← R5 closed
57f89a4 feat(auth): re-skin standalone /login and /signup in fantasy chrome                ← Phase E
2aac952 feat(victory): add /victory final-boss certificate landing page                    ← D.3
4573d47 feat(shop): add /shop standalone Global Bazaar page                                ← D.2
acb286d feat(inventory): add /inventory page with KP summary + equip toggles               ← D.1
93289bb feat(battle): port Battle.tsx as 4-file split (page + stage + quiz + outcome)      ← Phase C
c403e50 feat(campaign): port MissionPrep warm-up quiz page                                 ← B.3
07b46a0 feat(campaign): port PrepareForMission Academy hub                                 ← B.2
d2cde85 feat(campaign): port CampaignDetail mission list page                              ← B.1
9e8f046 chore(routing): delete dead (mobile) route group                                   ← A.6
08445af fix(auth): unmount guard for onAuthStateChanged callback (R4)                      ← R4 closed
7c8edac fix(state): gate (learner) layout on character hasHydrated (R2)                    ← R2 closed
4000c5f feat(state): wire useGame buy/equip to backend; add academy methods (R3)           ← R3 closed
bffb30a feat(state): add academy-progress-store for completedLessons + watchedVideos
1c94f22 feat(api-client): add inventoryApi.purchaseItem / equipWeapon / getCatalog
b485166 fix(auth): sign out on orphan Firestore profile (authApi.getMe 404)                ← pre-Plan-2 standalone
```

### Working tree state

```
M .claude/settings.local.json        ← Local-only, leave alone, don't stage
M apps/web/tsconfig.tsbuildinfo      ← tsc artifact, leave alone, don't stage
?? .claude/settings.json             ← Local hook/permissions config; check whether to stage or .gitignore
?? .playwright-mcp/                  ← Smoke-test transcripts (page snapshots + console logs); gitignore candidate
?? planning/~$reka-Lab-Strategy.docx ← Word lockfile when user has docx open; ignore
?? smoke-01-welcome-blank.png        ← Smoke-test screenshot; delete or .gitignore
?? smoke-02-battle.png               ← Smoke-test screenshot; delete or .gitignore
```

#### ⚠️ Untracked smoke-test artifacts

The smoke test in Plan 2 G.1 produced two PNG screenshots at the repo root (`smoke-01-welcome-blank.png`, `smoke-02-battle.png`) and a `.playwright-mcp/` directory full of YAML page snapshots + console logs. **None of these belong in version control.** Choose one:

1. Delete them: `Remove-Item smoke-*.png; Remove-Item -Recurse -Force .playwright-mcp/`
2. Add to `.gitignore`: append `smoke-*.png` and `.playwright-mcp/` to `.gitignore` so future smoke runs don't pollute `git status`.

The `.claude/settings.json` is new since Plan 1's handover — verify it doesn't contain anything secret before staging or gitignoring.

### Stashes (local-only, safe to drop)

```
stash@{0}: On main: phase-16-planning-edits        (snapshot — meaningless after revert)
stash@{1}: On main: phase-16-leftovers             (lockfile, assets, build artifacts, e2e specs)
stash@{2}: WIP on feature/phase-16-fantasy-ui      (the deleted Phase 16 branch)
```

Same as Plan 1 handover noted — leftover from Phase 0's salvage/revert. Drop with `git stash drop` x3 once you're confident there's nothing to recover.

---

## What's done in Plan 2

### Phase A — State + wiring fixes (7 commits, 3 review findings closed)

| ID | Task | Commit |
|---|---|---|
| A.0 | Standalone fix: orphan-session sign-out on `authApi.getMe` 404 | `b485166` |
| A.1 | `inventoryApi.purchaseItem` / `equipWeapon` / `getCatalog` | `1c94f22` |
| A.2 | `academy-progress-store` + 4 tests (in-memory) | `bffb30a` |
| A.3 | `useGame()` adapter: academy methods + backend buy/equip — **R3** | `4000c5f` |
| A.4 | `(learner)/layout.tsx` `hasHydrated` gate — **R2** | `7c8edac` |
| A.5 | `useAuth` `mountedRef` unmount guard — **R4** | `08445af` |
| A.6 | Delete dead `(mobile)/` route group (-934 LOC) | `9e8f046` |

### Phase B — Campaign + Prep page ports (3 commits)

| ID | Route | Commit |
|---|---|---|
| B.1 | `/campaign/[slug]` (CampaignDetail) | `d2cde85` |
| B.2 | `/campaign/[slug]/prepare` (PrepareForMission + `_modal.tsx`) | `07b46a0` |
| B.3 | `/campaign/[slug]/mission/[missionId]/prep` (MissionPrep) | `c403e50` |

### Phase C — Battle (4-file split per CLAUDE.md rule #8) (1 commit, 5 files)

| ID | Files | Commit |
|---|---|---|
| C.* | `page.tsx` + `_battle-config.ts` + `_battle-stage.tsx` + `_battle-quiz.tsx` + `_battle-outcome.tsx` | `93289bb` |

### Phase D — Inventory / Shop / Victory (3 commits)

| ID | Task | Commit |
|---|---|---|
| D.1 | `/inventory` page | `acb286d` |
| D.2 | `/shop` page (Global Bazaar) | `4573d47` |
| D.3 | `/victory` page (static; certificate API wiring deferred to Plan 3) | `2aac952` |

### Phase E — Standalone auth re-skin (1 commit)

| ID | Task | Commit |
|---|---|---|
| E.* | Re-skin `/login` + `/signup` in fantasy chrome (Scene + panel + rune-ring) | `57f89a4` |

### Phase F — R5 (per ADR-006, option 2 minimal slice) (1 commit, **R5 closed**)

| ID | Task | Commit |
|---|---|---|
| F.* | Welcome `birthYear` field + age-gate (13–16) + `@Roles('child')` retighten + ADR-006 | `34865c7` |

### Phase G — Acceptance + smoke (4 commits)

| ID | Task | Commit |
|---|---|---|
| G.0 | Plan 2 plan doc + Plan 1 handover doc committed | `1374623` |
| G.0 | Task board updated (Plan 2 DONE + P3-14…19 follow-ups) | `2c3e918` |
| G.1 | **Smoke fix:** backend `SignupDto` accepts `'child'` (was 400-rejecting Welcome's new flow) | `9aecec3` |
| G.1 | **Smoke fix:** dropped React `use()` on params + moved redirect to `useEffect` (Next 14, not 15) | `ef4752a` |
| G.2 | Push to origin + Plan 2 acceptance comment on PR #8 | (no commit) |

### All 4 Plan-1 review findings: CLOSED

| ID | Finding | Status | Commit |
|---|---|---|---|
| R1 | `useGame().reset()` doesn't cascade inventory reset | ✅ closed in Plan 1 | `f56139e` |
| R2 | `(learner)/layout.tsx` character-gate races | ✅ closed | `7c8edac` |
| R3 | `useGame().buyAbility/buyWeapon` optimistic-local | ✅ closed | `4000c5f` |
| R4 | `useAuth` lacks unmount guard | ✅ closed | `08445af` |
| R5 | Welcome hardcoded `'parent'`; `@Roles` broadened | ✅ closed (per ADR-006 minimal slice) | `34865c7` |

---

## Smoke test summary (Phase G.1, driven by Claude on 2026-05-15)

The user reported "from my side nothing is working" and asked Claude to run the smoke test. Two real bugs surfaced and were fixed in `9aecec3` + `ef4752a`. Below is what the full happy path looks like end-to-end on `redesign/v2-from-reference` HEAD.

| Step | Outcome |
|---|---|
| Open `/` | Welcome renders fantasy chrome; **0 errors** (favicon 404 + PWA warnings are pre-existing) |
| Fill Begin Quest tab (year 2010 = 16yo) → "Forge My Legend" | `POST /auth/signup` → **201 Created**, `GET /auth/me` → 200 |
| Auto-redirect to `/character` | CharacterCreate UI renders; pick Riven (warrior) → "Confirm Hero" |
| `PUT /users/me/character` → 200 | Auto-redirect to `/dashboard` |
| `/dashboard` | Realm Map with all 4 campaigns (Ch 1+2 unlocked, 3+4 sealed); KP badge 0/0; SmokeRider · Prompt Knight · LV 3 |
| Click "Enter Isle" Chapter 1 | `/campaign/isle-of-prompts` mission list renders 4 missions |
| Click "Begin Mission" on mission 1 | `/campaign/isle-of-prompts/battle/p1` renders battle screen, HP bars, abilities |
| Spam Quick Strike 13× | Victory in 13 hits, +120 XP credit, victory overlay |
| `/inventory`, `/shop`, `/victory` | All render, **0 errors** |
| Sign-out from dashboard | Returns to `/`; anonymous `/dashboard` → bounced to `/` |

**0 console errors** in the steady-state app after the two smoke fixes. Pre-existing warnings only (favicon 404, PWA manifest icon size, `apple-mobile-web-app-capable` deprecation, password input autocomplete suggestion).

### Smoke-discovered behavior worth noting (not bugs, but visible)

1. **KP optimistic-local clobber on full reload.** Battle awards +120 KP. SPA navigation preserves it. Browser refresh / `window.location.reload()` triggers `(learner)/layout.tsx` → `inventoryApi.getMine()` hydrate → server returns kp:0 → local 120 wiped. This is the documented `P3-N5` / `P3-17` deferral (no backend KP-credit endpoint exists).
2. **Soft-buff label always "underleveled"** because `addKp` only bumps `kp`, not `totalKpEarned`. Cosmetic; bundle with Plan 3's KP-persistence work.
3. **Lazy default inventory.** `inventoryApi.getMine()` on a fresh user returns a default with 1 starter ability + 1 starter weapon (visible on the Victory page screenshot). Backend `InventoryService.getInventory()` lazy-creates the doc — verify the defaults are intentional.

---

## Plan 3+ — what's open

### Carry-over from Plan-1 review (Nits)

| ID | Finding | Notes |
|---|---|---|
| N1 | Dashboard hardcodes `xp=320`, `xpMax=1000`, `LV 3` | Wire via gamification-store |
| N2 | Campaign-card `next/image` dims (1024×768) over-sized for ~400×176 render | Tighten dims or use `fill` |
| N3 | `character-store.setCharacter` doesn't roll back on PUT failure | Snapshot+restore in catch |
| N4 | 6+ ported pages use hardcoded English strings | Plan 3 i18n re-key (P3-08) |
| N5 | `i18n/request.ts` hardcodes `locale='en'` | Plan 3 (P3-09) |

### Carry-over from Plan-2 (P2-N1 … N9, all DEFERRED → Plan 3)

| ID | Item | Severity | Notes |
|---|---|---|---|
| P2-N1 | `AiTutorChat` doesn't accept `chapterName` prop | Nit | salvaged Phase-16 mock; chapter-specific intro is polish |
| P2-N2 | Welcome **client-trusted `role`** — backend should validate from `birthYear` | Important | ADR-006 documents the gap; pairs with COPPA pipeline |
| P2-N3 | Google OAuth path skips age gate | Important | ADR-006 polish item |
| P2-N4 | Under-13 **COPPA confirmation pipeline** (parent email + audit log) | Important | the half of ADR-006 explicitly deferred; ~1 sprint |
| P2-N5 | **Backend KP-credit endpoints** for academy + battle XP | Important | `TODO(plan-3)` markers in `useGame()` adapter + battle page |
| P2-N6 | Persistent academy progress (`completedLessons`/`watchedVideos` survive reload) | Important | `academy-progress-store` is in-memory by design |

### Plan 3+ task list (`planning/redesign-task-board.md`)

| ID | Area | Notes |
|---|---|---|
| P3-01 | Re-skin `/parent` | spec §6 recipe |
| P3-02 | Re-skin `/teacher` + `/teacher/[classroomId]` | |
| P3-03 | Re-skin `/settings` | merge `Phase16Settings` namespace |
| P3-04 | Re-skin `/pricing` | |
| P3-05 | Re-skin `/achievements` | |
| P3-06 | Re-skin `/checkout/{success,cancel}` | path decision in spec §9.1 |
| P3-07 | **Backend hybrid combat validation** (server replays play log against seeded RNG) | spec §5.6, ~1 sprint |
| P3-08 | i18n re-key (`Phase16*` → flat namespaces) across en/fr/ar | spec §7 table |
| P3-09 | Add new Plan-1/2 strings to all locale files | hunts `TODO(plan-3-i18n)` markers |
| P3-10 | RTL Arabic display font — apply Amiri to `html[dir="rtl"] .font-display` | spec §7 |
| P3-11 | E2E suite rewrite — `apps/web/e2e/learner-flow.spec.ts` (chromium + mobile-chrome) | replaces deleted Phase 16 specs |
| P3-12 | Retire `useMobileDetect` hook if responsive utilities suffice | spec §9.2 |
| P3-13 | Verify PWA + Sentry source maps post-redesign | spec §9.3, §9.4 |
| P3-14 | **R5 follow-up:** server-side `role` derivation from `birthYear` | ADR-006 / P2-N2 |
| P3-15 | **R5 follow-up:** Google OAuth age gate | ADR-006 / P2-N3 |
| P3-16 | **R5 follow-up:** under-13 COPPA confirmation pipeline (parent email + audit) | ADR-006 / P2-N4, ~1 sprint |
| P3-17 | Backend KP-credit endpoints for lessons / videos / battle XP | P2-N5 |
| P3-18 | Persistent academy progress (lesson/video completion across sessions) | P2-N6 |
| P3-19 | `AiTutorChat` accepts `chapterName` for chapter-specific intro | P2-N1, polish |

**Before any subagent dispatch** for Plan 3: write the detailed plan via `superpowers:writing-plans`, mirroring the structure of Plans 1 + 2. The Plan 3 scope is broad enough that the user may want it broken into 2–3 sub-plans (e.g., "Plan 3a: adult-page re-skin", "Plan 3b: R5 COPPA pipeline + KP-credit backend", "Plan 3c: i18n + E2E + polish"). Surface that decision to the user before starting.

---

## Skill state

The previous session operated under:
- **`superpowers:writing-plans`** — to author the Plan 2 plan at session start.
- **`superpowers:executing-plans`** — to drive Plans A → G inline with phase checkpoints.
- **Playwright MCP tools** — to run the smoke test (one-off override of the user's "drives the smoke test manually" preference; the user explicitly asked Claude to do it because nothing was working from their side).

**User preferences carried over:**
- **Push timing:** push when explicitly told. Do NOT push speculatively. Plan 2's push at G.2 was explicitly approved.
- **Update cadence:** brief. Report at phase boundaries — don't chatter between tasks.
- **Smoke testing:** *normally* the user drives the smoke test manually. The Plan 2 G.1 override happened because they explicitly asked. Default back to user-driven smoke for Plan 3 unless overridden again.
- **Commit/push approvals:** every push has been individually approved during the session. Continue asking before pushing.
- **Inline execution mode** with phase checkpoints worked well in Plan 2. Default to that for Plan 3 unless the user asks for subagent-driven.

---

## Gotchas the previous sessions discovered (still applicable, plus new ones)

### Carried over from Plan 1 handover (still all true)

1. **Tailwind v4, NOT v3.** No `tailwind.config.ts`. Tailwind config lives in `apps/web/src/app/globals.css` under `@theme inline { … }`.
2. **`shared-types` package needs dual-resolution exports.** `node` condition → `./dist/index.js`, default → `./src/index.ts`. If API server crashes with `SyntaxError: Unexpected token 'export'`, run `pnpm --filter @eureka-lab/shared-types build`.
3. **`useAuthStore.user` is `UserProfile`, not Firebase `User`.** `displayName` and `email` are non-nullable strings.
4. **`FantasyCharacter` backend ↔ `Character` frontend rename.** `characterApi` in `apps/web/src/lib/api-client.ts` maps both directions transparently (`color ↔ classColorHsl`).
5. **Reference project's `useGame()` API matches our adapter.** Ported reference pages compile against the adapter without changes — switch `react-router-dom` to `next/navigation`, replace asset imports with public/-relative strings, add `'use client';`.
6. **Welcome register flow needs `authApi.signup` BEFORE `signInWithEmailAndPassword`.** Calling `createUserWithEmailAndPassword` directly skips the Firestore profile creation.
7. **Sonner toaster is mounted in `app/page.tsx`** (Welcome), not in `app/layout.tsx`. If you want toasts on other top-level pages, lift it to the root layout.
8. **next-intl `getRequestConfig` MUST include `timeZone`.** Current value: `'UTC'` (placeholder). Plan 3 §7 will read from cookie/header.
9. **Pre-existing test-file errors are not our problem.** ~24 `error TS` lines in `CelebrationOverlay.test.tsx`, `useMobileDetect.test.ts`, `usePullToRefresh.test.ts`, `usePushNotifications.test.ts` predate Phase 16.
10. **Don't delete files in `_future_r3f/`.** 27 parked R3F components + README. Long-term 3D vision per spec §11.
11. **Don't modify files under `docs/superpowers/`.** Plans, specs, and handover docs are append-only artifacts (this doc is new; future agents shouldn't edit it). Update the task board (`planning/redesign-task-board.md`) instead for ongoing status.

### New from Plan 2

12. **🔥 This repo is Next.js 14.2.35, NOT Next.js 15.** The `params` argument to dynamic-route page components is **synchronous** — type it as `params: { slug: string }` and destructure directly. Do NOT use `params: Promise<…>` with `use(params)` from React. That pattern is for Next 15+ and crashes with `Error: An unsupported type was passed to use(): [object Object]` — silently in the boundary. Plan 2 shipped 4 broken pages with the wrong typing; smoke-fix `ef4752a` corrected all four. If you add new dynamic routes, use the sync form.

13. **🔥 Don't call `router.replace()` (or any state-changing action) during render.** It triggers `Cannot update a component while rendering a different component` warnings and can cascade. Wrap the redirect in `useEffect`:
    ```ts
    useEffect(() => {
      if (loadedButShouldRedirect) router.replace('/dashboard');
    }, [loadedButShouldRedirect, router]);

    if (!loaded) return null;
    if (shouldRedirect) return null;  // useEffect handles the actual nav
    ```
    Plan 2's 4 dynamic-route pages all had this anti-pattern; smoke-fix `ef4752a` fixed all four.

14. **🔥 Backend `SignupDto` now accepts `'child'`.** ADR-006 / Plan-2 F.1 sent `role: 'child'` to `/auth/signup`, but the backend DTO whitelist was `@IsIn(['parent', 'teacher'])`. Smoke-fix `9aecec3` extended it to `['parent', 'teacher', 'child']`. The role is **client-trusted** for now (P2-N2 / P3-14 — Plan 3 will derive role server-side from `birthYear`). If you tighten the DTO further, account for this.

15. **KP credit doesn't survive a full page reload.** Optimistic-local KP from battles / lessons / videos gets clobbered by the next `inventoryApi.getMine()` hydrate (server has no credit endpoint yet — P3-17). Within SPA navigation it's fine; refresh kills it. If a P3 user complains "my KP disappears," this is the cause.

16. **Smoke screenshots and `.playwright-mcp/` are gitignored candidates.** The Plan-2 G.1 smoke run dropped `smoke-01-welcome-blank.png`, `smoke-02-battle.png`, and a `.playwright-mcp/` directory of YAML page snapshots into the repo root. Decide whether to delete or `.gitignore` before Plan 3 work begins (don't accidentally commit them).

17. **`AiTutorChat` takes `{ className? }`, NOT `{ chapterName }`.** The reference's PrepareForMission passes `chapterName` to `<AiTutorChat>`, but the salvaged Phase-16 component only accepts `className`. Plan 2 dropped the prop and added a TODO marker (P2-N1 / P3-19). If you want chapter-specific tutor intros, plumb the prop through.

18. **`(game)/` and `(mobile)/` route groups are now GONE.** `(mobile)/` was deleted in `9e8f046`. `(game)/` was deleted by the Phase 16 revert in `b31694c`. If you see them anywhere, something's off.

---

## Where to find things

- **Single source of truth for cross-plan status:** [`planning/redesign-task-board.md`](../../../planning/redesign-task-board.md)
- **Plan 2 detailed plan (reference for Plan 3 structure):** [`docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md`](../plans/2026-05-14-redesign-plan-2-campaign-and-combat.md)
- **Plan 1 detailed plan:** [`docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md`](../plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md)
- **Full redesign spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md)
- **ADR-006 (kid signup decision):** [`docs/context/ADR-006-kid-signup-flow.md`](../../context/ADR-006-kid-signup-flow.md)
- **Open spec questions:** spec [§9](../specs/2026-05-09-redesign-from-reference-design.md#L381) — 5 items. #5 (kid signup) is now resolved by ADR-006; #1–#4 remain open for Plan 3.
- **Previous handover (Plan 1 complete):** [`2026-05-13-plan-1-complete-handover.md`](2026-05-13-plan-1-complete-handover.md) — for historical context only; superseded by this doc.
- **Plan 1 mid-execution handover (older):** [`2026-05-11-plan-1-handover.md`](2026-05-11-plan-1-handover.md).
- **CLAUDE.md (project rules):** [`CLAUDE.md`](../../../CLAUDE.md) — non-negotiable. Read first.
- **Pre-redesign platform phases 1–15 task board:** [`planning/task-board.md`](../../../planning/task-board.md) and [`planning/sprint-01.md`](../../../planning/sprint-01.md) — authoritative for what existed before redesign, last verified 2026-03-07.
- **Plan 2 acceptance comment on PR #8:** https://github.com/katanaTech/eureka-lab/pull/8#issuecomment-4457212012

---

## Pre-flight checks for the resuming agent

Run these before doing anything else:

```powershell
git status                              # Expect: clean working tree (modulo settings.local.json + tsbuildinfo + smoke artifacts noted above)
git log --oneline -1                    # Expect: ef4752a fix(plan-2): drop React.use() ...
git rev-list --count main..HEAD         # Expect: 44
git rev-parse --abbrev-ref HEAD         # Expect: redesign/v2-from-reference
git status -sb                          # Expect: branch is up to date with 'origin/redesign/v2-from-reference'
gh pr view 8 --json state,isDraft       # Expect: state=OPEN, isDraft=true
```

Then ask the user which of these to start with:
- Write the **Plan 3** detailed plan (largest scope; consider sub-plans).
- Land **nits N1–N3** (small standalone PRs) before Plan 3.
- Mark PR #8 **ready for review** and merge to `main` first.
- Clean up local smoke artifacts (`.playwright-mcp/`, `smoke-*.png`, `.claude/settings.json`).

---

## Final acceptance checklist for Plan 2 (all checked)

- [x] Branch `redesign/v2-from-reference` has all 20 Plan 2 commits listed above.
- [x] `pnpm exec tsc --noEmit` clean across the monorepo (24 pre-existing test-file errors only; api: 0 errors).
- [x] All 4 Plan-1 review findings resolved (R2/R3/R4/R5).
- [x] `/`, `/character`, `/dashboard`, `/campaign/[slug]`, `/campaign/[slug]/prepare`, `/campaign/[slug]/mission/[missionId]/prep`, `/campaign/[slug]/battle/[missionId]`, `/inventory`, `/shop`, `/victory`, `/login`, `/signup` all render the redesigned UI.
- [x] Full sign-up → character → dashboard → campaign → battle → victory → shop → inventory loop works end-to-end (smoke driven by Claude on 2026-05-15).
- [x] Sign-out returns to `/` and prevents re-entry to `/dashboard` while anonymous. Inventory + character + academy progress cascaded reset.
- [x] `/g/:path*` and `/m/:path*` redirect to `/dashboard` (verified Plan 1; redirects still in `next.config.js`).
- [x] `(mobile)/` route group deleted (`9e8f046`).
- [x] ADR-006 captures the kid-signup decision + 3 deferred items (P3-14/15/16).
- [x] PR #8 acceptance comment posted.
- [x] Branch pushed to origin.
- [x] Task board updated with Plan 2 statuses + 6 new P3 items + 6 P2-N* deferrals.

---

*Handover authored 2026-05-15 at the natural seam between Plan 2 (DONE + smoke-tested + pushed) and Plan 3 (UNWRITTEN). Supersedes [`2026-05-13-plan-1-complete-handover.md`](2026-05-13-plan-1-complete-handover.md).*
