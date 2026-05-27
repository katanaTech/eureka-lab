# Blockers Log — Eureka-Lab Platform

> Log any blocking issues here. Resolve them inline.

---

## Active Blockers

### P16-OPEN-005 — Lovable asset license (PM → DEVOPS)

**Severity:** Pre-prod gate (does NOT block dev/staging work)
**Owner:** DEVOPS with PM oversight
**Action needed:** Before any B2B client or public production rollout of `featureFlags.fantasyUi`,
DEVOPS must either (a) confirm Lovable.dev asset license permits commercial use, or (b) commission
replacement art. Track in Sprint D of sprint-p16.md.
**Deadline:** Before P16-QA-006 (production flag enablement).

---

## Inter-Agent Notifications

### 2026-05-27 — PM Sprint D check-in (Phase 16 / fantasy-UI) — 7th routine fire

**Inspected by:** PM agent (recurring routine — disable requested 6× prior; still firing)
**Branch:** `feature/phase-16-fantasy-ui` merged to main (PR #7). `main` HEAD = `08ef671` — no new commits since 2026-05-25 (2 days).

**Sprint C:** COMPLETE. Confirmed again this run (7th confirmation). Battle page at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx`
wires `POST /api/v1/combat/init` and `useCombatStore` — verified live in source.
All 15/15 Sprint C tasks DONE. No action needed here.

**Sprint D status — 20 days since QA track was unblocked (2026-05-07), still no QA commits:**
- **8/13 DONE:** Wave 1 all done; MOB-001/002/QA-003b done. No change.
- **3/13 READY — stale 20 days:** QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90),
  QA-005 (iOS Safari + Android Chrome smoke) have been READY since 2026-05-07.
  **QA-001 is the sole critical path to QA-002 and QA-006 (production rollout). With 20
  days of drift the rollout timeline is now at risk. QA: pick up QA-001 immediately; run
  QA-004 and QA-005 in parallel — reference `apps/web/e2e/fantasy-flow.plan.md`.**
- **2/13 BLOCKED:** QA-002 (on QA-001); QA-006 (on QA-001..005 + OPEN-005).
- **P16-OPEN-005 — PM decision still required (pre-prod gate for QA-006).**
  20 days outstanding. All current assets are custom SVGs — no Lovable encumbrance.
  Path C (declare current SVGs production-quality) requires only a PM sign-off, zero
  engineering work. See `docs/context/asset-licenses.md`. **PM: please make this call
  this week. It is the only remaining gate on QA-006 and the full production rollout.**

**Tech-debt (FE, must resolve before Sprint D ships, per CLAUDE.md rule #8):**
`campaign/[slug]/shop/page.tsx` (472 lines), `shop/page.tsx` (451 lines),
`inventory/page.tsx` (354 lines) all exceed the 300-line limit. 20 days unaddressed.

**Routine disable — 7th notice.** Please disable at https://claude.ai/code/routines
(routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). Sprint C has been closed since
2026-04-29. Sprint D has clear per-agent ownership. Seven PM check-ins since Sprint C
closure have added zero unblocking value. The only open gates are QA agent pickup and
the OPEN-005 PM decision — neither is accelerated by recurring PM check-ins.

**PM check-in routine: Sprint D scheduled, please disable this routine.**

---

### 2026-05-25 — PM Sprint D check-in (Phase 16 / fantasy-UI) — 6th routine fire

**Inspected by:** PM agent (recurring routine — disable requested 5× prior; still firing)
**Branch:** `feature/phase-16-fantasy-ui` merged to main (PR #7). `main` HEAD = `dfdb028` — no new commits since 2026-05-23 (2 days).

**Sprint C:** COMPLETE. Confirmed again this run (6th confirmation). Battle page at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx`
wires `POST /api/v1/combat/init` and `useCombatStore` — verified live in source code.
All 15/15 Sprint C tasks DONE. No action needed here.

**Sprint D status — 18 days since QA track was unblocked (2026-05-07), still no QA commits:**
- **8/13 DONE:** Wave 1 all done; MOB-001/002/QA-003b done. No change.
- **3/13 READY — stale 18 days:** QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90),
  QA-005 (iOS Safari + Android Chrome smoke) were all unblocked 2026-05-07.
  **QA: 18 days with no action. QA-001 is the entire critical path to QA-002 and QA-006.
  The production rollout cannot proceed until these land. Pick up QA-001 now and
  run QA-004/QA-005 in parallel — reference `apps/web/e2e/fantasy-flow.plan.md`.**
- **2/13 BLOCKED:** QA-002 (on QA-001); QA-006 (on QA-001..005 + OPEN-005).
- **P16-OPEN-005 — PM decision still required (pre-prod gate for QA-006).**
  18 days outstanding. Assets are custom SVGs with no Lovable encumbrance — Path C
  (declare current SVGs production-quality) requires only a PM sign-off, zero engineering
  work. See `docs/context/asset-licenses.md`. PM: please make this call this week.

**Tech-debt (FE, must resolve before Sprint D ships, per CLAUDE.md rule #8):**
`campaign/[slug]/shop/page.tsx` (472 lines), `shop/page.tsx` (451 lines),
`inventory/page.tsx` (354 lines) all exceed the 300-line limit. Still unaddressed.

**Routine disable — 6th notice.** Please disable at https://claude.ai/code/routines
(routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). Sprint C has been closed since
2026-04-29. Sprint D has clear per-agent ownership. Six PM check-ins have added zero
unblocking value. The only gate left is QA agent pickup and the OPEN-005 PM decision —
neither is accelerated by recurring PM check-ins.

**PM check-in routine: Sprint D scheduled, please disable this routine.**

---

### 2026-05-23 — PM Sprint D check-in (Phase 16 / fantasy-UI) — 5th routine fire

**Inspected by:** PM agent (recurring routine — disable requested 4× prior; still firing)
**Branch:** `feature/phase-16-fantasy-ui` merged to main (PR #7). `main` HEAD = `a7475d3` — no new commits since 2026-05-17 (6 days).

**Sprint C:** COMPLETE. Confirmed again this run. Battle page at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx`
wires `POST /api/v1/combat/init` and `useCombatStore`. All 15/15 tasks DONE. No action needed.

**Sprint D status — 16 days since QA track was unblocked (2026-05-07), no QA commits:**
- **8/13 DONE:** Wave 1 all done; MOB-001/002/QA-003b done.
- **3/13 READY — stale 16 days:** QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90),
  QA-005 (iOS Safari + Android Chrome smoke) were all unblocked on 2026-05-07.
  **This is the critical path to QA-002 and QA-006 (production rollout). QA: these tasks
  are blocking the entire rollout — please pick up QA-001 immediately; run QA-004 and
  QA-005 in parallel.**
- **2/13 BLOCKED:** QA-002 (on QA-001); QA-006 (on QA-001..005 + OPEN-005).
- **P16-OPEN-005 — PM decision still required (pre-prod gate for QA-006).** No new
  information since 2026-05-17. Current assets are custom SVGs with no Lovable
  encumbrance — Path C (declare current SVGs production-quality) requires only a PM
  decision, no engineering work. See `docs/context/asset-licenses.md` for all three paths.

**Tech-debt (FE, must resolve before Sprint D ships, per CLAUDE.md rule #8):**
`campaign/[slug]/shop/page.tsx` (472 lines), `shop/page.tsx` (451 lines),
`inventory/page.tsx` (354 lines) all exceed the 300-line limit.

**Routine disable — 5th notice.** Please disable at https://claude.ai/code/routines
(routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). The routine has now fired 5 times
post-Sprint-C-closure. No further PM check-ins are useful until QA reports back or
OPEN-005 is resolved by PM.

**PM check-in routine: Sprint D scheduled, please disable this routine.**

---

### 2026-05-07 — PM → QA+DEVOPS: Sprint D QA track unblocked; OPEN-005 PM decision required

**Inspected by:** PM agent (recurring routine)
**Branch:** `feature/phase-16-fantasy-ui` — **merged to main via PR #7 (commit 58c9f25)**

**Sprint C: officially CLOSED.** P16-PG-007 (battle page) confirmed in production code at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx` — wires
`POST /api/v1/combat/init` and `useCombatStore`, split across 4 files per rule #8.
All 15/15 Sprint C tasks DONE. Exit criteria fully checked.

**Sprint D Wave 1: COMPLETE.** All DEVOPS and QA Wave 1 tasks done:
AST-001, AST-002, MOB-003 (DEVOPS); QA-PLAN, QA-003a (QA); QA-003b (QA, 2026-05-06).

**Sprint D Wave 2 status — updated this run:**

- **P16-MOB-001 — DONE** (commits 9eae286, c450a25, 59af877): All 11 game routes mirrored
  to `/m/g/**` with compact density. Verified on disk.
- **P16-MOB-002 — DONE** (commit 9eae286): `GameBottomTabs` present in
  `apps/web/src/app/(mobile)/m/g/layout.tsx`.
- **P16-QA-001 — NOW READY** (was BLOCKED): All deps met — Sprint C done, QA-PLAN done,
  MOB-001 done. **QA: pick this up now.**
- **P16-QA-004 — NOW READY** (was BLOCKED on MOB-001): Lighthouse mobile ≥90 on
  `/m/dashboard`. **QA: can run in parallel with QA-001.**
- **P16-QA-005 — NOW READY** (was BLOCKED on MOB-001): iOS Safari + Android Chrome smoke.
  **QA: can run in parallel with QA-001.**
- **P16-QA-002** — still BLOCKED on QA-001 completing. Follows QA-001.
- **P16-QA-006** — still BLOCKED on QA-001..005 complete + OPEN-005 resolved.

**OPEN-005 — PM decision required before production rollout (QA-006).**
DEVOPS documented 3 resolution paths in `docs/context/asset-licenses.md`. Current assets
are custom SVG placeholders — no Lovable license encumbrance on current files. PM must
choose: (a) confirm license, (b) commission replacement art, or (c) declare current SVGs
production-quality. This unblocks P16-QA-006 and the full rollout schedule.

**Tech-debt reminder (FE):** `campaign/[slug]/shop/page.tsx` (472 lines),
`shop/page.tsx` (451 lines), `inventory/page.tsx` (354 lines) exceed CLAUDE.md rule #8
(300-line limit). Track for split before Sprint D ships.

**Three parallel QA tracks now active:**
1. **QA**: Playwright E2E impl (QA-001) + flag matrix (QA-002) — see `apps/web/e2e/fantasy-flow.plan.md`
2. **QA**: Lighthouse mobile ≥90 (QA-004) + Safari/Chrome smoke (QA-005)
3. **DEVOPS+PM**: OPEN-005 license decision → unblocks QA-006 production rollout

**PM check-in routine: Sprint D QA work now in-flight. Disabling routine.**
See note below in PM Check-in Log.

---

### 2026-05-04 — QA → PM: Sprint D Wave 1 QA tasks complete (P16-QA-PLAN + P16-QA-003a)

**Branch:** `feature/phase-16-fantasy-ui`

**P16-QA-PLAN — DONE.** Playwright test plan committed (`b8c2a6c`) at
[apps/web/e2e/fantasy-flow.plan.md](../apps/web/e2e/fantasy-flow.plan.md).

**P16-QA-003a — DONE** across 4 commits:

1. `06aac4a` — i18n(phase-16): begin Sprint B+C string extraction (welcome wired)
2. `a577f83` — i18n(phase-16): wire character/dashboard/settings/not-found/victory to translations
3. `cb1bc31` — i18n(phase-16): add Phase16Campaign/Prepare/MissionPrep/ShopRealm/ShopGlobal/Inventory namespaces and wire high-traffic pages
4. `afb1896` — i18n(phase-16): finish wiring shop sub-components and prepare/prep panels (closeout — completed by PM after QA hit usage limit twice on this work)

**Result:**
- 12 Phase16 namespaces defined in `apps/web/src/messages/{en,fr,ar}.json` (Welcome, Character, Dashboard, Settings, NotFound, Victory, Campaign, Prepare, MissionPrep, ShopRealm, ShopGlobal, Inventory)
- Real Arabic + French translations (not stubs) — quality bar set by first QA session, maintained through closeout
- Messages files grew 411 → ~700 lines per locale
- All 13 Sprint B+C source pages + sub-components wired with `useTranslations()`
- `pnpm exec tsc --noEmit` clean for production code (test-file errors are pre-existing Vitest mock typing, unrelated)

**Deferred (intentional):**
- **P16-QA-003b** — battle page strings (`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/`). Per original Wave 1 plan, deferred until after PG-007 review.
- **Lesson/video content** — `PLACEHOLDER_LESSONS` and `PLACEHOLDER_VIDEOS` data in `lesson-data.ts` remains English-only. This is educational content, not UI chrome — when real lessons are authored they'll need their own i18n strategy (likely separate per-lesson translation files rather than namespace bloat).

**Follow-up note for FE/PM:**
- `NoQuizFallback` in `prep-panels.tsx` lost the inline `text-primary` styling around `realmName` because the message-format placeholder injects plain text. If visual emphasis is needed back, refactor to either `t.rich` with a tag-style key or split the message into 3 keys (before/middle/after) like `Phase16Settings.tenantLockNotice*` does.

**Sprint D Wave 1 status:** All QA-owned items now DONE. DEVOPS items (AST-001/002, MOB-003, OPEN-005) all DONE per `2026-04-29 DEVOPS → PM` entry below. Wave 1 is complete.

**Sprint D Wave 2 status:** Still BLOCKED on Sprint C (technically DONE) and FE pickup. Remaining work: P16-MOB-001/002 (FE), P16-QA-001/002 (Playwright impl), P16-QA-004/005 (Lighthouse + smoke), P16-QA-006 (rollout — also blocked on OPEN-005 license decision).

---

### 2026-04-29 — FE → PM: Sprint C complete

**Branch:** `feature/phase-16-fantasy-ui`

**Sprint C is DONE.** All 15/15 tasks committed and type-checks clean (`tsc --noEmit` — 0 errors in production code; pre-existing Vitest mock typing errors in test files only).

**Commits landed (5 total):**

1. `4fae81a` chore: register inventory/tenants/users modules in app.module, cleanup useUiMode
2. `cf2402e` feat: add prepare + mission prep pages (P16-PG-005, P16-PG-006)
3. `af9d3ea` feat: add per-realm + global shop pages (P16-PG-008, P16-PG-009)
4. `018a396` feat: re-theme inventory, victory, and not-found pages (P16-PG-010..012)
5. `8817718` feat: add battle page wired to combat API (P16-PG-007) — critical path delivered

**P16-PG-007 (battle page) implementation notes:**
- Split into 4 files per rule #8: page.tsx (244), battle-stage.tsx (173), battle-quiz.tsx (212), battle-outcome.tsx (157)
- Wired to `POST /api/v1/combat/init` and `POST /api/v1/combat/:battleId/complete`
- Mission ID inference: `*-1/2/3` → minion, `*-boss` → guardian, fallback → minion
- Victory awards KP (gamified mode) via `inventoryStore.addKp` + toast + inventory refresh
- Overlord victory chains to certificate API → `/g/victory`
- Spark charge button visible when `sparkCharges > 0 && isGameMode` (stub seed 0 per spec)
- No R3F imports — verified clean

**Tech-debt note:** These pages exceed 300 lines and should be split before Sprint D ships:
`campaign/[slug]/shop/page.tsx` (472), `shop/page.tsx` (451), `inventory/page.tsx` (354).

**PM next steps:**
- Mark Sprint C DONE
- Unblock Sprint D Wave 2 (MOB-001/002, QA-001..006)
- FE is ready to pick up P16-MOB-001 (mobile mirror) or P16-QA-003a (i18n extraction)

---

### 2026-04-29 — DEVOPS → PM: Sprint D Wave 1 DEVOPS tasks complete

**Branch:** `feature/phase-16-fantasy-ui`

**Completed tasks (3/4 DEVOPS-owned Wave 1 items):**

1. **P16-AST-001 — DONE.** Created 13 SVG game assets in `apps/web/public/assets/game/`:
   - `logo.svg` — Eureka Lab brand emblem
   - `world-map.svg` — 1920x1080 realm map background
   - `island-{1..4}.svg` — 4 realm island backgrounds (Whispers/Echoes/Glitches/Wraiths)
   - `zombie.svg` — base zombie sprite
   - `hero-{warrior,mage,rogue,engineer}.svg` — 4 hero class sprites
   - Updated `Logo.tsx` to reference `.svg` instead of `.png`
   - Created `apps/web/src/lib/game-assets.ts` — centralised asset path constants

2. **P16-AST-002 — DONE.** Created `scripts/generate-zombie-variants.sh`:
   - Generates 4 zone-tinted zombies via sed colour swap from base
   - Whispers=violet, Echoes=amber, Glitches=cyan, Wraiths=crimson
   - Output: `zombie-{whispers,echoes,glitches,wraiths}.svg`

3. **P16-MOB-003 — DONE.** Created `scripts/generate-mobile-crops.sh`:
   - Produces 768x1024 portrait-cropped SVGs from desktop backgrounds
   - Output: `assets/game/mobile/world-map.svg` + `island-{slug}.svg` (5 files)
   - Idempotent re-run

4. **P16-OPEN-005 — IN_PROGRESS (DEVOPS portion done; PM decision pending).**
   - Created `docs/context/asset-licenses.md` with 3 resolution paths:
     - Path A: Confirm Lovable license for commercial use
     - Path B: Commission replacement art (~22 deliverables, 2-3 weeks)
     - Path C: Upgrade placeholder SVGs to production quality
   - **Note:** All current assets are custom SVG placeholders — NO Lovable-sourced assets
     were used. No license encumbrance on current files. PM owns the final decision.

**Asset naming verification:** Grepped `apps/web/src/components/game/fantasy/` — only
`Logo.tsx` references a concrete asset path (`/assets/game/logo.svg`, now correct).
`Scene.tsx` accepts optional `background` prop but no page passes one yet. The
`game-assets.ts` manifest provides typed constants for FE to wire backgrounds in Sprint C/D.

**Remaining Wave 1 (not DEVOPS-owned):** P16-QA-PLAN (QA), P16-QA-003a (FE+QA).

---

### 2026-04-28 — PM → DEVOPS+QA+FE: Sprint D Wave 1 launch (parallel-start tracks)

**Branch:** `feature/phase-16-fantasy-ui`

**Why now:** Sprint C is still in flight (7 IN_REVIEW commits + P16-PG-007 critical path), but
~40% of Sprint D work has zero dependency on Sprint C closure. Launching Wave 1 in parallel so we
don't burn calendar time. Full plan in [planning/sprint-p16.md](sprint-p16.md) §Sprint D.

**Wave 1 task assignments (all READY now):**

**DEVOPS — pick up these 4 in order:**

1. **P16-AST-001** — Import 6 Lovable assets to `apps/web/public/assets/game/`. Subjects: world-map, island-1..4 (Whispers/Echoes/Glitches/Wraiths), zombie base, hero variants (warrior/mage/rogue/engineer), Eureka logo. Confirm filenames match what Sprint B fantasy components import (grep `apps/web/src/components/game/fantasy/` for asset paths). Commit as `assets(phase-16): import Lovable game assets (P16-AST-001)`.

2. **P16-AST-002** — Generate 4 zone-specific zombie variants from base zombie. Color-tint approach: Whispers=violet, Echoes=amber, Glitches=cyan, Wraiths=crimson. Tooling: ImageMagick `-modulate` or sharp.js script under `scripts/`. Output: `zombie-{zone}.webp`. Commit as `assets(phase-16): generate zone-specific zombie variants (P16-AST-002)`.

3. **P16-MOB-003** — Asset script `scripts/generate-mobile-crops.{ts,sh}` that produces 768×1024 mobile crops from desktop background assets. Output to `apps/web/public/assets/game/mobile/`. Idempotent re-run. Commit as `tools(phase-16): mobile crop generation script (P16-MOB-003)`.

4. **P16-OPEN-005 (joint with PM)** — Lovable asset license decision. Two paths:
   - (a) Confirm Lovable.dev TOS permits commercial / production use for SaaS — document the clause + decision in `docs/context/asset-licenses.md` (create file).
   - (b) If unclear/restrictive, scope a replacement art commission (artist sourcing, brief, timeline, budget). Same doc.
   - **Pre-prod gate:** must resolve before P16-QA-006 production rollout. Dev/staging usage remains OK. Loop in PM for the budget call.

**QA — pick up these 2 now:**

5. **P16-QA-PLAN** — Draft Playwright test plan for the fantasy-mode E2E suite. Output `apps/web/e2e/fantasy-flow.plan.md` covering:
   - Test cases: welcome → character creation → dashboard → campaign → prep quiz → battle (win + lose paths) → shop buy → equip → battle reuse → victory → certificate
   - Mock auth strategy (Firebase emulator vs test fixture user)
   - Flag matrix: how to flip `featureFlags.fantasyUi` mid-suite for QA-002
   - Fixture data needed (test user, seeded inventory, completed mission state)
   - Stub/mock boundaries (which API calls hit a mock, which hit Firebase emulator)
   - This is a doc-only deliverable — no test impl yet (that's QA-001, blocked on Sprint C).

**FE+QA — pick up this one in parallel:**

6. **P16-QA-003a** — i18n string extraction pass 1, for pages already on disk (Sprint B + Sprint C IN_REVIEW). Walk these files and extract user-visible strings to `apps/web/messages/en.json`:
   - `(game)/g/welcome/page.tsx`, `character/page.tsx`, `dashboard/page.tsx`, `campaign/[slug]/page.tsx`
   - `campaign/[slug]/prepare/page.tsx` + `prepare-panels.tsx`
   - `campaign/[slug]/mission/[missionId]/prep/page.tsx` + `prep-panels.tsx`
   - `campaign/[slug]/shop/page.tsx`, `(game)/g/shop/page.tsx`, `inventory/page.tsx`, `victory/page.tsx`, `g/not-found.tsx`
   - Settings page (P16-SET-001) — already landed
   - Mirror keys to `fr.json` and `ar.json` with `// TODO translate` markers (or use the project's existing convention — check `messages/` directory first).
   - Commit as `i18n(phase-16): extract Sprint B+C strings to en.json, stub fr/ar (P16-QA-003a)`.
   - **Defer:** battle-page strings → P16-QA-003b after PG-007 lands.

**What's still BLOCKED (do not start yet):**
- P16-MOB-001/002 (mobile mirror) — needs Sprint C complete to mirror real pages
- P16-QA-001/002 (Playwright impl) — needs Sprint C complete + QA-PLAN
- P16-QA-003b (battle-page i18n) — needs PG-007 DONE
- P16-QA-004/005 (Lighthouse + smoke) — needs MOB-001
- P16-QA-006 (production rollout) — needs everything + OPEN-005 resolved

**PM check-in cadence:** Recurring every 2 days at 9am Beirut (routine `trig_01MTn9VXjqAg3mVvQCekuaK4`).
PM will close Sprint C and trigger Wave 2 the moment FE posts PG-007 completion.

**Notify PM via this file when Wave 1 tasks complete (one combined dispatch is fine).**

---

### 2026-04-28 — PM → FE: Sprint C in-flight commit + P16-PG-007 dispatch

**Branch:** `feature/phase-16-fantasy-ui`

**Sprint C status snapshot (PM audit, 2026-04-28):**
- 7 DONE and committed: SET-001..004 (commit 70461cc), RTE-001..003 (commit 87f2463)
- 7 IN_REVIEW (uncommitted on disk, type-checks clean): PG-005, 006, 008, 009, 010, 011, 012
- 1 TODO: PG-007 (battle page, critical path) — decomposed in sprint-p16.md §P16-PG-007

**Verification done by PM:**
- `pnpm exec tsc --noEmit` (apps/web) — clean for production code (test-file errors are pre-existing Vitest mock typing, not Sprint C)
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` — clean
- All IN_REVIEW pages wire to backend APIs (inventory, shop catalog, equip)
- `apps/api/src/app.module.ts` modification correctly registers Inventory/Tenants/Users modules — needs to be committed

**FE — actions required (in this order):**

1. **Commit the in-flight Sprint A wire-up that was missed.** `apps/api/src/app.module.ts` needs Inventory/Tenants/Users module registration committed — without this, Sprint A backend modules don't load. Suggested commit: `chore(phase-16): register inventory/tenants/users modules in app.module`. Also commit `useUiMode.ts` cleanup and `api-contracts.md` v1.2 + `sprint-01.md` status bump as a `chore(phase-16): bookkeeping` follow-up.

2. **Commit Sprint C IN_REVIEW work in 3 logical chunks** (keeps PRs reviewable):
   - `feat(phase-16): add prepare + mission prep pages (P16-PG-005, P16-PG-006)` — campaign/[slug]/prepare/* and campaign/[slug]/mission/[missionId]/prep/*
   - `feat(phase-16): add per-realm + global shop pages (P16-PG-008, P16-PG-009)` — campaign/[slug]/shop/page.tsx and shop/page.tsx
   - `feat(phase-16): re-theme inventory/victory/not-found pages (P16-PG-010..012)` — inventory/page.tsx, victory/page.tsx, g/not-found.tsx

3. **CLAUDE.md rule #8 watchout (>300-line files):** inventory/page.tsx (354), shop/page.tsx (450), campaign/[slug]/shop/page.tsx (472) and a few others exceed the limit. Acceptable to land as-is for Sprint C velocity; track a follow-up `tech-debt: split P16 page files >300 lines` task in the backlog to refactor before Sprint D ships.

4. **Build P16-PG-007 (battle page) — see decomposition in sprint-p16.md §P16-PG-007.** Sub-tasks PG-007.1 → PG-007.5. Combat-store, HpBar, sparkCharges, certificate plumbing, and Phase 15 combat API are all in place. Critical points:
   - Reuse existing `useCombatStore` (state machine, sparkCharges, returnPath all wired)
   - Reuse `HpBar` (P16-FE-016) and `Scene/Logo/KpBadge/GameButton` (Sprint B fantasy components)
   - Wire to `POST /api/v1/combat/init` and `POST /api/v1/combat/:battleId/complete` (existing)
   - Mission-id naming convention (PG-006 hardcodes them): `*-1/2/3` are minions, `*-boss` are guardians; overlord-mission TBD — make the inference fail-safe and route to `/g/dashboard` if unknown
   - Split page into `page.tsx` + `battle-stage.tsx` + `battle-quiz.tsx` + `battle-outcome.tsx` to honor rule #8

5. **After PG-007 lands**, ping PM via this file with a `FE → PM: Sprint C complete` notification. PM will mark Sprint C DONE and trigger Sprint D scheduling (mobile mirror, QA, asset license decision).

**Reference for PG-007 implementer:**
- Combat backend contract: `apps/api/src/modules/combat/combat.controller.ts:52-98`
- Combat store API: `apps/web/src/stores/combat-store.ts:69-139`
- Existing CertificateScreen: imported by `apps/web/src/app/(game)/g/victory/page.tsx:6`
- KP-on-victory hook: already implemented in combat.controller.ts:82-95 (returns `kpAwarded` in response — FE should call `inventoryStore.addKp(kpAwarded)` and `inventoryStore.refresh()`)

PM stands down pending FE completion notification.

---

### 2026-04-26 — ARCH → FE+BE: Sprint A foundation types ready

**Branch:** `feature/phase-16-fantasy-ui` (forked from `feature/phase-15-3d-game`)

**Tasks landed:** P16-FND-005, P16-FND-006

**What you can now import from `@eureka-lab/shared-types`:**

- `featureFlags.fantasyUi` (added to `FeatureFlags` + `DEFAULT_FEATURE_FLAGS`, defaults `true`)
- Types: `UiMode`, `TenantUiModeLock`, `FantasyClass`, `FantasyCharacter`, `Inventory`,
  `ShopAbility`, `ShopAbilityIcon`, `ShopWeapon`, `ShopCatalog`, `ShopItemType`, `KpEarnEvent`
- Constants: `FANTASY_CLASS_BY_CAREER`, `FANTASY_CLASS_DEFAULT_AURA_HSL`, `CAMPAIGN_SLUG_BY_ZONE`,
  `ZONE_BY_CAMPAIGN_SLUG`, `REALM_NAME_BY_ZONE`, `REALM_BOSS_NAME_BY_ZONE`,
  `FINAL_BOSS_REALM_NAME`, `FINAL_BOSS_REALM_SLUG`, `FINAL_BOSS_GAME_NAME`

**Verification done by ARCH:**

- `pnpm --filter @eureka-lab/shared-types build` — clean
- `pnpm --filter @eureka-lab/api lint` (`tsc --noEmit`) — clean
- `pnpm --filter @eureka-lab/web lint` (`next lint`) — clean
- `dist/phase16.types.{js,d.ts}` present — API runtime can `require` it (per ADR-001)

**Heads-up — ADR-005 §2 mapping correction:**

The original ADR-005 v1 used placeholder career names (`prompt_poet`, `code_wizard`,
`data_artist`, `robot_builder`). The actual `CareerArchetype` enum has 8 values
(`astronaut, chef, doctor, teacher, artist, gamer, engineer, scientist`). ADR-005 §2,
plan §3.2, and plan §8 have been updated in-place to use the correct enum values, grouped
2-2-2-2 across the 4 fantasy classes. The product-owner approval still applies — the
**shape** of the decision is unchanged, only the source identifiers are now accurate.
The authoritative copy lives in `phase16.types.ts` as `FANTASY_CLASS_BY_CAREER`.

**Next steps for agents:**

- **FE:** P16-FND-001..004 (design tokens, font, Tailwind, utility CSS) and P16-FE-001..003
  (state stores) — all unblocked. You may also start P16-FE-004 (R3F parking).
- **BE:** P16-BE-001..013 (inventory module, user/tenant extensions, KP hooks) — all unblocked.
  Use the `KP_REWARDS` constants from `sprint-p16.md` §KP Tuning Values.
- **QA:** No new Sprint A work; please add Phase 16 mappings to your test fixtures.

ARCH stands down pending API contract refinements that may surface during BE implementation.

---

### 2026-04-26 — ARCH → PM: Phase 16 design complete, ready to schedule

The full design package for Phase 16 (Gamified UI Redesign — Cinematic Fantasy) is now in the
repo and all ARCH-owned decisions are locked. Handing off to PM for sprint scheduling.

**Artifacts ready for PM intake:**

- Plan: [planning/phase-16-gamified-ui-redesign.md](phase-16-gamified-ui-redesign.md) — 18 sections
- Task table: [planning/task-board.md](task-board.md) → PHASE 16 section, ~50 tasks across Parts A–K
- ADRs (all ACCEPTED): [docs/context/ADR-002…005](../docs/context/) (paradigm, KP economy, UI mode, narrative mapping)
- API contracts: [planning/api-contracts.md](api-contracts.md) → ARCH-002 section (inventory, character, settings, tenant lock endpoints)

**Remaining decisions PM owns or coordinates:**

- `P16-OPEN-004` — initial KP earn/spend tuning values (PM ↔ BE)
- `P16-OPEN-005` — Lovable-asset license / replacement plan (PM ↔ DEVOPS)

**Recommended sprint shape (ARCH suggestion — PM has final call):**

1. Sprint A — Parts A & B (foundation + backend) so FE has a stable substrate
2. Sprint B — Parts C, D, E pages 1–4 (state, components, welcome through campaign detail)
3. Sprint C — Part E pages 5–7 + Part F mobile mirror (battle is the critical path)
4. Sprint D — Parts G, H, I, J (settings, routing, assets, QA + rollout)

PM should:
1. Update [planning/sprint-01.md](sprint-01.md) overall progress table to add Phase 16 = `READY`.
2. Decompose Part B (backend) into the next concrete sprint with BE owner assignments.
3. Resolve `P16-OPEN-004` with BE before any progress endpoint touches KP earning.

ARCH stands down on Phase 16 implementation — re-engage on:
- API contract refinements discovered during BE implementation
- Future ADR-006 (R3F retirement decision after A/B data)
- Unresolved questions from FE/BE during execution

---

### 2026-04-26 — PM → ALL: Phase 16 scheduling complete, Sprint A ready to start

**Acknowledging ARCH handoff above.** All ARCH artifacts reviewed and accepted.

**PM decisions made:**

1. **Phase 15 FE deferred.** Backend (combat API) is stable and consumed by Phase 16. R3F frontend
   (22 tasks) is superseded by Phase 16 fantasy 2D UI. Tasks marked DEFERRED in task-board.md.
   Revisit only if A/B data favours R3F post-launch (ADR-006).

2. **P16-OPEN-004 resolved.** KP earn/spend tuning values seeded in sprint-p16.md §KP Tuning Values.
   Design principle: 1 full realm ≈ 1 ability purchase. Full game ≈ 5 abilities or 2 weapons.
   Daily cap: 100 KP. Values ship as constants, tunable via Firestore remote config post-launch.

3. **P16-OPEN-005 deferred to Sprint D.** Lovable assets OK for dev/staging. Pre-prod gate before
   public rollout. See active blocker above.

4. **Sprint plan written:** [planning/sprint-p16.md](sprint-p16.md) — 4 sprints, ~8 weeks.
   Sprint A (foundation + backend) is ready to start immediately.

**Next steps for agents:**
- **ARCH:** Create branch `feature/phase-16-fantasy-ui`. Implement P16-FND-005 + P16-FND-006 (shared types + feature flag).
- **FE:** After ARCH lands shared types, begin P16-FND-001..004 (design tokens, font, Tailwind, utility CSS).
- **BE:** After ARCH lands shared types, begin P16-BE-001..013 (inventory module, user extensions, KP hooks).
  Use KP values from sprint-p16.md §KP Tuning Values for `KP_REWARDS` constant and `shop-catalog.ts`.
- **QA:** No Sprint A tasks, but begin writing Playwright test plan for Sprint D.

---

## PM Check-in Log

### 2026-05-17 — PM Sprint D check-in (Phase 16 / fantasy-UI) — 4th routine fire

**Inspected by:** PM agent (recurring routine — disable requested 3× prior; still firing)
**Branch:** `feature/phase-16-fantasy-ui` merged to main (PR #7). `main` HEAD = `7904863` — no new commits since 2026-05-15 (2 days).

**Sprint C:** COMPLETE. No change. Battle page confirmed at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx` — wires
`POST /api/v1/combat/init` and `useCombatStore`. All 15/15 tasks DONE.

**Sprint D status — unchanged from 2026-05-15:**
- **8/13 DONE** (Wave 1 complete; MOB-001/002/QA-003b done)
- **3/13 READY — now 10 days stale:** QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90),
  QA-005 (Safari/Chrome smoke) have had all blockers cleared since 2026-05-07. No QA commits
  in 10 days. **QA: these tasks are actively blocking the rollout path — please pick up
  QA-001 and run QA-004/QA-005 in parallel immediately.**
- **2/13 BLOCKED:** QA-002 (on QA-001); QA-006 (on QA-001..005 + OPEN-005)
- **P16-OPEN-005 — PM action still required (pre-prod gate on QA-006).** Options documented in
  `docs/context/asset-licenses.md`. Current assets are custom SVGs with no Lovable encumbrance —
  Path C (declare current SVGs production-quality) is available with no engineering work.
  PM must make this call before QA-006 can proceed.

**Tech-debt reminder (pre-ship, FE):** `campaign/[slug]/shop/page.tsx` (472 lines),
`shop/page.tsx` (451 lines), `inventory/page.tsx` (354 lines) still exceed CLAUDE.md rule #8.
These must be split before Sprint D ships.

**Routine disable — 4th notice.** Please disable at https://claude.ai/code/routines
(routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). Sprint D has clear per-agent ownership;
PM check-ins add no value until QA reports back or OPEN-005 is resolved.

**PM check-in routine: Sprint D scheduled, please disable this routine.**

---

### 2026-05-15 — PM Sprint D check-in (Phase 16 / fantasy-UI) — 3rd routine fire

**Inspected by:** PM agent (recurring routine — disable request has been sent twice; still firing)
**Branch:** `feature/phase-16-fantasy-ui` merged to main (PR #7). `main` HEAD = `f1bb7a8` — no new commits since 2026-05-11 (4 days).

**Sprint C:** Verified COMPLETE this run. Battle page confirmed at
`apps/web/src/app/(game)/g/campaign/[slug]/battle/[missionId]/page.tsx`, wires
`POST /api/v1/combat/init` and `useCombatStore`. No action needed on Sprint C.

**Sprint D status — unchanged from 2026-05-11:**
- **8/13 DONE** (all Wave 1; MOB-001/002/QA-003b)
- **3/13 READY — stale 8 days:** QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90), QA-005 (Safari/Chrome smoke) have had all blockers cleared since 2026-05-07. No QA commits have landed in 8 days.
- **2/13 BLOCKED:** QA-002 (on QA-001); QA-006 (on QA-001..005 + OPEN-005)
- **P16-OPEN-005 — PM action still required.** This is the sole remaining pre-prod gate on QA-006 and the production rollout. Options documented in `docs/context/asset-licenses.md`: (a) confirm Lovable license, (b) commission replacement art, (c) declare current SVGs production-quality. No engineering work needed — PM decision only.

**Tech-debt reminder (pre-ship, FE):** `campaign/[slug]/shop/page.tsx` (472 lines),
`shop/page.tsx` (451 lines), `inventory/page.tsx` (354 lines) still exceed CLAUDE.md rule #8.

**Routine disable — 3rd notice.** Please disable at https://claude.ai/code/routines
(routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). Sprint D QA track requires QA agent
pickup, not PM check-ins. Remaining critical gate is OPEN-005 PM decision — track
manually once routine is off.

---

### 2026-05-11 — PM Sprint D check-in (Phase 16 / fantasy-UI)

**Inspected by:** PM agent (recurring routine — still firing despite DISABLE NOW notice in 2026-05-07 entry)
**Branch:** `feature/phase-16-fantasy-ui` — merged to main (PR #7). No local branch; `main` HEAD = `5e5cf1d`.

**No commits since 2026-05-07.** Sprint C closed. Sprint D Wave 1 complete. Wave 2 MOB-001/002/QA-003b done.

**QA track stale — 4 days since unblocking:**
- QA-001 (Playwright E2E), QA-004 (Lighthouse ≥90), QA-005 (Safari/Chrome smoke) have all been READY since 2026-05-07. No QA commits have landed.
- QA-002 and QA-006 remain BLOCKED pending their respective dependencies.

**P16-OPEN-005 — PM decision still outstanding.** This is the sole remaining gate on QA-006 and the full production rollout. See `docs/context/asset-licenses.md` for 3 resolution paths (confirm license / commission art / declare SVGs production-quality). No code work needed; PM action only.

**Tech-debt (FE, pre-ship):** `campaign/[slug]/shop/page.tsx` (472 lines), `shop/page.tsx` (451 lines), `inventory/page.tsx` (354 lines) still exceed rule #8 (300-line limit).

**Routine disable — 2nd notice.** Please disable at https://claude.ai/code/routines (routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`). Sprint D has clear per-agent ownership; no further PM check-ins are useful until OPEN-005 is resolved.

---

### 2026-05-07 — PM Sprint D check-in (Phase 16 / fantasy-UI) — FINAL ROUTINE RUN

**Finding:** Sprint C COMPLETE; Sprint D Wave 1 COMPLETE; Wave 2 MOB-001/002 DONE; QA track
now unblocked (QA-001/004/005 READY). OPEN-005 PM decision still pending.

**Actions taken this run:** Updated task-board.md and sprint-p16.md to reflect actual state
(MOB-001/002/QA-003a marked DONE; QA-001/004/005 marked READY). PM dispatch written above.

**PM check-in routine: DISABLE NOW.**
Sprint D QA work is in-flight with clear per-agent ownership. The routine should be
turned off at https://claude.ai/code/routines (routine ID: `trig_01MTn9VXjqAg3mVvQCekuaK4`).
Remaining gate is OPEN-005 PM decision — track manually, not via recurring routine.

---

### 2026-04-29 — PM Sprint C check-in (Phase 16 / fantasy-UI)

**Inspected by:** PM agent (recurring routine, fires every 2 days)

**Finding: Phase 16 has not started.**

- Branch `feature/phase-16-fantasy-ui` **does not exist** in the repository. `git branch -a | grep phase-16` returned nothing.
- `planning/sprint-p16.md` **does not exist**.
- Referenced commits `70461cc` (SET-001..004) and `87f2463` (RTE-001..003) are **not in git history**. The most recent merge is `7b68cce` (Phase 15 PR #6).
- Repo is on `main`. Phase 15 (AI Zombie Combat) is the active phase; backend (Parts B/C) is DONE but the entire frontend (Parts D, E, F — 16 tasks: COMBAT-FE-001..015 + COMBAT-FLOW-001..005) remains **TODO**.

**Pre-condition for Phase 16:** Phase 15 FE/integration work must complete first (Parts D, E, F on task-board.md). No P16-PG-* tasks can start until `feature/phase-15-*` FE commits land and the 3D combat system is wired end-to-end.

**Action required:**
- FE agent: pick up Phase 15 Part D (combat-store, battle routes) — see task-board.md rows COMBAT-FE-001..004.
- PM check-in routine: continues. Will re-evaluate Phase 16 pre-conditions next run.

---

## Resolved Blockers

### 2026-04-26 — P16-OPEN-004: KP earn/spend tuning values

**Resolved by:** PM
**Resolution:** Initial seed values documented in sprint-p16.md §KP Tuning Values.
Lesson=10, Practice=5, Minion=15, Guardian=30, Overlord=50, Daily=5. Cap=100/day.
Shop: abilities 60–120 KP, weapons 150–300 KP. Tunable post-launch.
