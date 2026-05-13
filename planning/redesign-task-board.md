# Redesign Task Board — `ai-adventure-island` Adoption

> **Status values:** `TODO` | `IN_PROGRESS` | `DONE` | `DEFERRED`
> **Branch:** [`redesign/v2-from-reference`](https://github.com/katanaTech/eureka-lab/pull/8) (draft PR #8)
> **Spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md)
> **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island`
> **Supersedes:** Phase 16 sprint (`planning/sprint-p16.md` — removed by revert). Original platform phases 1–15 ([`task-board.md`](task-board.md), [`sprint-01.md`](sprint-01.md)) remain authoritative for the pre-Phase-16 product baseline.
> **Last verified:** 2026-05-13

---

## At-a-glance progress

| Plan | Scope | Status | Plan doc |
|---|---|---|---|
| 1 | Foundation + Learner Shell (revert, salvage, design tokens, Welcome / Character / Dashboard) | **DONE** | [plan-1](../docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md) |
| 2 | Learner loop completion (campaign, prepare, mission-prep, battle, inventory, shop, victory) | TODO | not yet written |
| 3+ | Adult-facing re-skin, backend hybrid combat validation, i18n re-key, RTL fonts, E2E rewrite | TODO | not yet written |

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

## Plan 2 — Learner loop completion (TODO — plan not yet written)

High-level scope from spec [§5.1](../docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md#L137). Tasks below are placeholders; write the detailed plan via `superpowers:writing-plans` before starting.

| ID | Area | Status | Notes |
|---|---|---|---|
| P2-01 | `/campaign/[slug]` mission list page (port `CampaignDetail.tsx`) | TODO | |
| P2-02 | `/campaign/[slug]/prepare` Academy hub (lessons/videos/AI Tutor) | TODO | hook to existing `learn` content |
| P2-03 | `/campaign/[slug]/mission/[missionId]/prep` warmup quiz | TODO | |
| P2-04 | `/campaign/[slug]/battle/[missionId]` combat (split 4 files: page/stage/quiz/outcome) | TODO | wire `combat-store` |
| P2-05 | `/inventory` page | TODO | |
| P2-06 | `/shop` page (Global Bazaar re-skin) | TODO | wire `inventoryApi.buy/equip` |
| P2-07 | `/victory` page | TODO | |
| P2-08 | Re-skin standalone `/login` and `/signup` | TODO | Welcome covers MVP path |
| P2-R2 | Fix `(learner)/layout.tsx` character-gate race (review finding R2) | TODO | |
| P2-R3 | Wire `useGame().buyAbility/buyWeapon` to backend (review finding R3) | TODO | |
| P2-R4 | Add unmount guard to `useAuth` (review finding R4) | TODO | |
| P2-R5 | Minor-account signup flow + retighten inventory `@Roles` to `'child'` (review finding R5) | TODO | needs spec clarification |
| P2-AC | Updated Plan 2 acceptance smoke run | TODO | |

---

## Plan 3+ — Adult re-skin, infra, validation (TODO — plan not yet written)

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
f56139e fix(state): cascade inventory reset through useGame().reset()
ddf4e87 fix: smoke-test follow-ups for Phase 2 flow
804a6cd fix(auth): Welcome register uses backend signup, not client-only Firebase
84b9539 fix(shared-types): resolve to dist for Node, keep src for Vercel
57e3449 feat(dashboard): port Realm Map dashboard from reference
057477c feat(character): port CharacterCreate page from reference
77bd939 feat(learner): add (learner) route group with auth + character gate
```

Full history: `git log --oneline main..HEAD` on `redesign/v2-from-reference`.
