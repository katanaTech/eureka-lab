# Redesign Task Board — `ai-adventure-island` Adoption

> **Status values:** `TODO` | `IN_PROGRESS` | `DONE` | `DEFERRED`
> **Branch:** [`redesign/v2-from-reference`](https://github.com/katanaTech/eureka-lab/pull/8) (draft PR #8)
> **Spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md)
> **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island`
> **Supersedes:** Phase 16 sprint (`planning/sprint-p16.md` — removed by revert). Original platform phases 1–15 ([`task-board.md`](task-board.md), [`sprint-01.md`](sprint-01.md)) remain authoritative for the pre-Phase-16 product baseline.
> **Last verified:** 2026-05-14

---

## At-a-glance progress

| Plan | Scope | Status | Plan doc |
|---|---|---|---|
| 1 | Foundation + Learner Shell (revert, salvage, design tokens, Welcome / Character / Dashboard) | **DONE** | [plan-1](../docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md) |
| 2 | Learner loop completion (campaign, prepare, mission-prep, battle, inventory, shop, victory) | **DONE** | [plan-2](../docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md) |
| 3+ | Adult-facing re-skin, backend hybrid combat validation, i18n re-key, RTL fonts, E2E rewrite, R5 COPPA pipeline | TODO | not yet written |

---

## Plan 1 — Foundation + Learner Shell  (DONE)

24 commits on `redesign/v2-from-reference`. Smoke-test passed. Reviewer verdict: acceptable, no blockers.

### Phase 0 — Branch / Salvage / Revert

| ID | Task | Status | Commit |
|---|---|---|---|
| 0.1 | Create `salvage/phase-16` branch + `salvage-manifest.txt` | DONE | (off-branch) |
| 0.2 | Cut `redesign/v2-from-reference`, revert Phase 16 merge | DONE | `b31694c` |
| 0.3 | Cherry-pick salvage paths back | DONE | `308c631` |
| 0.4 | Verify build/tsc/lint, open draft PR #8 | DONE | `a631239` (re-export fix) |

### Phase 1 — Foundation

| ID | Task | Status | Commit |
|---|---|---|---|
| 1.1 | Park 27 R3F components → `_future_r3f/` | DONE | `d853870` |
| 1.2 | `_future_r3f/README.md` resumption path | DONE | `d853870` |
| 1.3 | Remove `featureFlags.fantasyUi` | DONE | `ebee274` |
| 1.4 | Rename `phase16.types.ts` → `gameplay.types.ts`, prune UI-mode types | DONE | `ebee274` |
| 1.5 | Port reference design tokens into `globals.css` | DONE | `8155697` |
| 1.6 | Tailwind extensions + Cinzel/Amiri fonts via `next/font` | DONE | `8155697` |
| 1.7 | Hoist `components/game/fantasy/*` → `components/game/*` | DONE | `f6dce5b` |
| 1.8 | Port `data/{game,quiz,academy}.ts` | DONE | `d19469d` |
| 1.9 | Port 11 game assets (jpg/png) into `public/assets/game/` | DONE | `d19469d` |
| 1.10 | Create `character-store` + `characterApi` + `inventoryApi` | DONE | `bbfdca3` |
| 1.11 | `useGame()` adapter at `state/game-context.tsx` | DONE | `be22d6c` |
| 1.12 | Clear broken imports from R3F parking | DONE | `b71887a` |
| 1.13 | Global `not-found.tsx` in fantasy chrome | DONE | `cc1ca5f` |

### Phase 2 — Welcome / Character / Dashboard

| ID | Task | Status | Commit |
|---|---|---|---|
| 2.1 | Bulk redirect `/g/*` and `/m/*` → `/dashboard` | DONE | `c73da28` |
| 2.2 | Replace `app/page.tsx` with Welcome (port + Sonner toaster) | DONE | `987b592` |
| 2.3 | Wire Firebase email/password + Google OAuth | DONE | `b7f17ed` |
| 2.4 | Create `(learner)/layout.tsx` (auth + character gate) | DONE | `77bd939` |
| 2.5 | Port `CharacterCreate` → `(learner)/character/page.tsx` | DONE | `057477c` |
| 2.6 | Verify backend character endpoints | DONE | (no-op, already present) |
| 2.7 | Port `Dashboard` (Realm Map) → `(learner)/dashboard/page.tsx` | DONE | `57e3449` |
| 2.8 | End-to-end manual smoke test | DONE | — |
| 2.9 | Push branch + PR #8 acceptance comment | DONE | — |

### Smoke-test follow-ups (post-Phase-2, pre-review)

| ID | Task | Status | Commit |
|---|---|---|---|
| 2.S1 | `shared-types/package.json` `node` exports condition for NestJS runtime | DONE | `84b9539` |
| 2.S2 | Welcome register calls `authApi.signup` (was Firebase-client-only) | DONE | `804a6cd` |
| 2.S3 | Register `InventoryModule`, broaden inventory `@Roles`, add next-intl `timeZone` | DONE | `ddf4e87` |

### Plan 1 final review findings

| ID | Finding | Severity | Status | Commit / Notes |
|---|---|---|---|---|
| R1 | `useGame().reset()` doesn't cascade to `inventory-store.reset()` | Important | DONE | `f56139e` |
| R2 | `(learner)/layout.tsx` character-gate races with in-flight hydrate | Important | DEFERRED → Plan 2 | |
| R3 | `useGame().buyAbility/buyWeapon` are optimistic-local; JSDoc misleading | Important | DEFERRED → Plan 2 | |
| R4 | `useAuth` lacks unmount guard for async `onAuthStateChanged` | Important | DEFERRED → Plan 2 | predates branch |
| R5 | Welcome hardcodes `role:'parent'`; inventory `@Roles` broadened with TODO | Important | DEFERRED → Plan 2 | needs minor-account signup flow |
| N1 | Dashboard hardcodes `xp=320`, `xpMax=1000`, `LV 3` | Nit | TODO | wire via gamification-store |
| N2 | Campaign-card `next/image` dims (1024×768) over-sized for rendered ~400×176 | Nit | TODO | tighten dims or use `fill` |
| N3 | `character-store.setCharacter` doesn't roll back on PUT failure | Nit | TODO | snapshot+restore in catch |
| N4 | 6+ ported pages use hardcoded English strings | Nit (deferred-by-design) | TODO → Plan 3 | mark with `TODO(plan-3-i18n)` |
| N5 | `i18n/request.ts` hardcodes `locale='en'` | Nit | TODO → Plan 3 | read from cookie/header |

---

## Plan 2 — Learner loop completion (DONE)

15 commits on `redesign/v2-from-reference` since the Plan-1 final SHA `79326c5`. All 4 Plan-1 review findings closed. Detailed plan: [plan-2](../docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md).

### Phase A — State + wiring fixes

| ID | Task | Status | Commit |
|---|---|---|---|
| A.0 | Standalone fix: orphan-session sign-out on `authApi.getMe` 404 | DONE | `b485166` |
| A.1 | `inventoryApi.purchaseItem / equipWeapon / getCatalog` | DONE | `1c94f22` |
| A.2 | `academy-progress-store` + 4 tests | DONE | `bffb30a` |
| A.3 | `useGame()` adapter: academy methods + backend buy/equip (**R3**) | DONE | `4000c5f` |
| A.4 | `(learner)/layout.tsx` character-gate race + `hasHydrated` flag (**R2**) | DONE | `7c8edac` |
| A.5 | `useAuth` unmount guard (**R4**) | DONE | `08445af` |
| A.6 | Delete dead `(mobile)/` route group (-934 LOC) | DONE | `9e8f046` |

### Phase B — Campaign + Prep page ports

| ID | Task | Status | Commit |
|---|---|---|---|
| B.1 | `/campaign/[slug]` (port `CampaignDetail.tsx`) | DONE | `d2cde85` |
| B.2 | `/campaign/[slug]/prepare` (port `PrepareForMission.tsx` + `_modal.tsx`) | DONE | `07b46a0` |
| B.3 | `/campaign/[slug]/mission/[missionId]/prep` (port `MissionPrep.tsx`) | DONE | `c403e50` |

### Phase C — Battle (4-file split per CLAUDE.md rule #8)

| ID | Task | Status | Commit |
|---|---|---|---|
| C.1–C.5 | `page.tsx` + `_battle-config.ts` + `_battle-stage.tsx` + `_battle-quiz.tsx` + `_battle-outcome.tsx` | DONE | `93289bb` |

### Phase D — Inventory / Shop / Victory

| ID | Task | Status | Commit |
|---|---|---|---|
| D.1 | `/inventory` page | DONE | `acb286d` |
| D.2 | `/shop` page (Global Bazaar) | DONE | `4573d47` |
| D.3 | `/victory` page (static — certificate API wiring deferred to Plan 3) | DONE | `2aac952` |

### Phase E — Standalone auth pages

| ID | Task | Status | Commit |
|---|---|---|---|
| E.1+E.2 | Re-skin `/login` + `/signup` in fantasy chrome | DONE | `57f89a4` |

### Phase F — R5 (per ADR-006, option 2 minimal slice)

| ID | Task | Status | Commit |
|---|---|---|---|
| F.0 | ADR-006: kid signup flow (option 2 — self-signup with age gate) | DONE | `34865c7` |
| F.1 | Welcome `birthYear` + age gate (13–16) + `@Roles('child')` retighten (**R5**) | DONE | `34865c7` |

### Plan 2 review findings (carried into Plan 3+)

All Plan-2 work landed without an internal review pass yet — schedule one before mark PR #8 as "Ready for review." Carry-overs the implementer flagged during execution:

| ID | Finding | Severity | Status | Notes |
|---|---|---|---|---|
| P2-N1 | `AiTutorChat` doesn't accept `chapterName` prop yet | Nit | TODO → Plan 3 | salvaged Phase-16 mock; chapter-specific intro is polish |
| P2-N2 | Welcome client-trusted `role` — backend should validate from `birthYear` | Important | DEFERRED → Plan 3 | ADR-006 documents the gap; pairs with COPPA pipeline |
| P2-N3 | Google OAuth path skips the age gate entirely | Important | DEFERRED → Plan 3 | ADR-006 polish item |
| P2-N4 | Under-13 COPPA confirmation pipeline (parent email + audit log) | Important | DEFERRED → Plan 3 | the half of ADR-006 explicitly deferred |
| P2-N5 | Backend KP-credit endpoints for lesson / video / battle XP | Important | DEFERRED → Plan 3 | `TODO(plan-3)` markers in `useGame()` adapter + battle page |
| P2-N6 | Persistent academy progress (`completedLessons` / `watchedVideos` survive reload) | Important | DEFERRED → Plan 3 | `academy-progress-store` is in-memory by design |
| P2-N7 | N1 (dashboard hardcodes xp=320, LV 3) still open | Nit | TODO | Plan 1 carry-over; can land anytime |
| P2-N8 | N2 (campaign-card next/image dims) still open | Nit | TODO | Plan 1 carry-over |
| P2-N9 | N3 (character-store no rollback on PUT failure) still open | Nit | TODO | Plan 1 carry-over |

### Smoke test status

Phase G.1 (manual end-to-end smoke) is driven by the user, not auto-executed. Until the user runs it, Plan 2 acceptance is **provisional** — any regression they find lands as a `fix(plan-2):` follow-up commit before PR #8 is marked Ready for review.

---

## Plan 3+ — Adult re-skin, infra, validation, R5 follow-up (TODO — plan not yet written)

| ID | Area | Status | Notes |
|---|---|---|---|
| P3-01 | Re-skin `/parent` | TODO | spec §6 recipe |
| P3-02 | Re-skin `/teacher` + `/teacher/[classroomId]` | TODO | |
| P3-03 | Re-skin `/settings` | TODO | merge `Phase16Settings` namespace |
| P3-04 | Re-skin `/pricing` | TODO | |
| P3-05 | Re-skin `/achievements` | TODO | |
| P3-06 | Re-skin `/checkout/{success,cancel}` | TODO | path decision in spec §9.1 |
| P3-07 | Backend hybrid combat validation (server replays play-log against seeded RNG) | TODO | spec §5.6, ~1 sprint |
| P3-08 | i18n re-key (`Phase16*` → flat namespaces) across en/fr/ar | TODO | spec §7 table |
| P3-09 | Add new Plan-1/2 strings to all locale files | TODO | hunts `TODO(plan-3-i18n)` markers |
| P3-10 | RTL Arabic display font — apply Amiri to `html[dir="rtl"] .font-display` | TODO | spec §7 |
| P3-11 | E2E suite rewrite — `apps/web/e2e/learner-flow.spec.ts` (chromium + mobile-chrome) | TODO | replaces deleted Phase 16 specs |
| P3-12 | Retire `useMobileDetect` hook if responsive utilities suffice | TODO | spec §9.2 |
| P3-13 | Verify PWA + Sentry source maps post-redesign | TODO | spec §9.3, §9.4 |
| P3-14 | **R5 follow-up:** server-side `role` derivation from `birthYear` | TODO | ADR-006 / P2-N2 |
| P3-15 | **R5 follow-up:** Google OAuth age gate | TODO | ADR-006 / P2-N3 |
| P3-16 | **R5 follow-up:** under-13 COPPA confirmation pipeline (parent email + audit) | TODO | ADR-006 / P2-N4, ~1 sprint |
| P3-17 | Backend KP-credit endpoints for lessons / videos / battle XP | TODO | P2-N5; `TODO(plan-3)` markers in `useGame()` |
| P3-18 | Persistent academy progress (lesson/video completion across sessions) | TODO | P2-N6 |
| P3-19 | `AiTutorChat` accepts `chapterName` for chapter-specific intro | TODO | P2-N1, polish |

---

## Open questions (from spec [§9](../docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md#L381))

1. Stripe `/checkout/{success,cancel}` — keep paths or move under `(admin)/`?
2. `useMobileDetect` — retire in favor of responsive utilities?
3. PWA re-registration after layout changes — verify in CI.
4. Sentry source-map paths — verify build artifact paths still match.
5. Welcome page role: how should kids sign up (today hardcoded to `'parent'`)?

---

## Long-deferred — 3D game mode

`apps/web/src/components/_future_r3f/` contains 27 parked R3F components + README with resumption path. Out of scope for this redesign; the long-term 3D vision is preserved, not killed (spec [§11](../docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md#L412)).

---

## Recent commits (top of branch)

```
34865c7 feat(auth): kid self-signup with age gate; retighten @Roles to 'child' (R5)
57f89a4 feat(auth): re-skin standalone /login and /signup in fantasy chrome
2aac952 feat(victory): add /victory final-boss certificate landing page
4573d47 feat(shop): add /shop standalone Global Bazaar page
acb286d feat(inventory): add /inventory page with KP summary + equip toggles
93289bb feat(battle): port Battle.tsx as 4-file split (page + stage + quiz + outcome)
c403e50 feat(campaign): port MissionPrep warm-up quiz page
07b46a0 feat(campaign): port PrepareForMission Academy hub
d2cde85 feat(campaign): port CampaignDetail mission list page
9e8f046 chore(routing): delete dead (mobile) route group
08445af fix(auth): unmount guard for onAuthStateChanged callback (R4)
7c8edac fix(state): gate (learner) layout on character hasHydrated (R2)
4000c5f feat(state): wire useGame buy/equip to backend; add academy methods (R3)
bffb30a feat(state): add academy-progress-store for completedLessons + watchedVideos
1c94f22 feat(api-client): add inventoryApi.purchaseItem / equipWeapon / getCatalog
b485166 fix(auth): sign out on orphan Firestore profile (authApi.getMe 404)
```

Full history: `git log --oneline main..HEAD` on `redesign/v2-from-reference` (40 commits ahead).
