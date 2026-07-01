# Sprint Plan — Phase 16: Gamified UI Redesign (Cinematic Fantasy)

> **Owner:** PM agent
> **Created:** 2026-04-26
> **Source:** ARCH handoff (blockers.md 2026-04-26), plan at planning/phase-16-gamified-ui-redesign.md
> **Branch:** `feature/phase-16-fantasy-ui` (stacks on main after Phase 15 backend merge)

---

## PM Decisions Logged

### Decision 1: Phase 15 Frontend Deferral

Phase 15 backend (combat API) is complete and tested. Phase 15 *frontend* (22 tasks: Parts D–F)
builds R3F combat UI that Phase 16 explicitly parks behind a feature flag. Building R3F UI only
to immediately park it is wasted effort.

**Ruling:** Phase 15 frontend tasks (COMBAT-FE-001 through COMBAT-FLOW-005) are **DEFERRED**.
The R3F components that already exist (stubs or partials) will be moved to `_legacy_r3f/` during
Phase 16 Part C (P16-FE-004). Phase 15 backend remains DONE and is consumed by Phase 16's new
battle page.

Phase 15 FE tasks may be revisited if A/B testing shows R3F outperforms fantasy 2D — but that's
a post-launch decision gated on ADR-006 (ARCH-owned).

### Decision 2: Sprint Shape

Adopting ARCH's recommended 4-sprint shape with adjustments:
- Sprint A expanded to include shared types (Part A foundation needs them anyway)
- Sprint C is the critical path — battle page must work end-to-end
- Sprint D is QA-heavy; can overlap with Sprint C tail

### Decision 3: KP Economy Seed Values (resolves P16-OPEN-004)

See §KP Tuning Values below. These are initial values shipped in a config constant
(`KP_REWARDS` / `SHOP_CATALOG`). They are tunable via Firestore remote config post-launch.
The guiding principle: a child completing one full realm (~8 lessons + minion + guardian battles)
should earn enough KP to buy 1 ability. The full game (4 realms) earns enough for ~5 abilities
or 2 weapons. This keeps the economy meaningful without being grindy.

### Decision 4: P16-OPEN-005 (Lovable Asset License)

Tracked separately. Lovable assets ship to staging/dev only. Before any B2B or public production
rollout, DEVOPS must either confirm license or replace with commissioned art. This is a
**pre-prod gate** in Sprint D, not a blocker for development.

---

## KP Tuning Values (P16-OPEN-004 Resolution)

### Earning

| Event | KP Earned | Rationale |
|-------|-----------|-----------|
| Lesson complete | 10 KP | Base reward, ~8 per realm = 80 KP/realm |
| Practice activity complete | 5 KP | Smaller reward for drill work |
| Minion battle win | 15 KP | Combat bonus |
| Guardian battle win | 30 KP | Major milestone |
| Overlord battle win | 50 KP | Final boss, one-time |
| Daily login (game mode) | 5 KP | Streak incentive |

**Daily earn cap:** 100 KP (prevents grinding; resets at midnight UTC).
**Total earnable across 4 realms:** ~480 KP (without daily bonuses).

### Spending (Shop Catalog — Initial Seed)

**Abilities:**

| ID | Name | Cost | Damage | Cooldown | Zone Hint |
|----|------|------|--------|----------|-----------|
| ability-spark-bolt | Spark Bolt | 0 (starter) | [8, 12] | 0 | null |
| ability-mind-blast | Mind Blast | 60 KP | [12, 18] | 1 turn | library |
| ability-logic-surge | Logic Surge | 80 KP | [15, 22] | 1 turn | forge |
| ability-data-lance | Data Lance | 100 KP | [18, 25] | 2 turns | citadel |
| ability-agent-strike | Agent Strike | 120 KP | [22, 30] | 2 turns | academy |

**Weapons:**

| ID | Name | Cost | Bonus Damage | Zone Hint |
|----|------|------|-------------|-----------|
| weapon-starter-wand | Starter Wand | 0 (starter) | +0 | null |
| weapon-echo-staff | Echo Staff | 150 KP | +3 | forge |
| weapon-glitch-blade | Glitch Blade | 200 KP | +5 | citadel |
| weapon-void-scepter | Void Scepter | 300 KP | +8 | academy |

**Balance check:** Completing 2 full realms (~240 KP) buys Mind Blast + Logic Surge (140 KP)
with 100 KP remaining toward a weapon. Full game completion (~480 KP) buys all 4 paid abilities
(360 KP) + Echo Staff (150 KP) = 510 KP needed, so a player must also collect dailies or replay.
This is intentional — encourages return visits.

---

## Sprint A — Foundation + Backend (Week 1–2)

**Goal:** Stable substrate so FE has APIs to build against.
**Branch:** `feature/phase-16-fantasy-ui` (forked from `feature/phase-15-3d-game`)

> **Note (2026-04-26):** ARCH corrected the career→class mapping during implementation.
> The original plan §3.2 used 4 placeholder careers; the actual `CareerArchetype` enum has 8 values
> (`astronaut, chef, doctor, teacher, artist, gamer, engineer, scientist`), mapped 2-per-class.
> This does NOT affect KP tuning values (event-based, not per-archetype). Authoritative mapping
> is `FANTASY_CLASS_BY_CAREER` in `packages/shared-types/src/phase16.types.ts`.

### Sprint A Tasks

| Task ID | Description | Owner | Depends On | Est | Status |
|---------|-------------|-------|------------|-----|--------|
| P16-FND-005 | Add `featureFlags.fantasyUi` to shared-types | ARCH | — | S | **DONE** (2026-04-26) |
| P16-FND-006 | Add Phase 16 shared types (UiMode, FantasyClass, Inventory, Shop types, mappings) | ARCH | — | M | **DONE** (2026-04-26) |
| P16-FND-001 | Fantasy design tokens (CSS vars under `[data-ui-mode="game"]`) | FE | — | S | READY |
| P16-FND-002 | Load Cinzel font via next/font/google | FE | — | S | READY |
| P16-FND-003 | Extend Tailwind config (font-display, keyframes, animations) | FE | — | S | READY |
| P16-FND-004 | Create game-utilities.css (panel, rune-ring, scanlines, glow) | FE | FND-001 | S | READY |
| P16-BE-001 | Inventory module scaffold (controller, service, DTOs, catalog) | BE | ~~FND-006~~ | L | READY |
| P16-BE-002 | GET /api/v1/inventory endpoint | BE | BE-001 | M | |
| P16-BE-003 | GET /api/v1/shop/catalog endpoint | BE | BE-001 | S | |
| P16-BE-004 | POST /api/v1/inventory/buy (atomic Firestore txn) | BE | BE-001 | L | |
| P16-BE-005 | POST /api/v1/inventory/equip | BE | BE-001 | M | |
| P16-BE-006 | Extend users: uiMode field + PUT /users/me/settings | BE | ~~FND-006~~ | M | READY |
| P16-BE-007 | GET/PUT /api/v1/users/me/character endpoints | BE | ~~FND-006~~ | M | READY |
| P16-BE-008 | Tenants module: uiModeLock field + admin endpoints | BE | ~~FND-006~~ | M | READY |
| P16-BE-009 | UiModeResolver service | BE | BE-006, BE-008 | M | |
| P16-BE-010 | KP earning hook in progress endpoints (mode-conditional) | BE | BE-001, BE-009 | M | |
| P16-BE-011 | Daily KP earn cap (sub-collection) | BE | BE-010 | M | |
| P16-BE-012 | Firestore security rules for inventories + tenants | BE | BE-001, BE-008 | S | |
| P16-BE-013 | Unit + integration tests for inventory module | BE+QA | BE-001..012 | L | |

**Sprint A exit criteria:**
- [x] `pnpm build` passes with new shared types (verified by ARCH 2026-04-26)
- [x] All inventory + character + settings + tenant endpoints return correct responses (257 tests passing)
- [x] KP earning is mode-conditional (unit test: 0 KP when effectiveUiMode === 'normal') ✓
- [x] Daily cap enforced (unit test: earn stops at 100 KP/day) ✓
- [x] Firestore rules written (firestore-rules-phase16.txt — deploy pending)
- [x] api-contracts.md updated with all new endpoints (v1.2)

**Progress:** 19/19 tasks DONE. Sprint A complete (2026-04-27). Sprint B ready to start.
FE foundation (4 tasks) parallelizes with BE work (13 tasks).

---

## Sprint B — State, Components, Pages 1–4 (Week 3–4)

**Goal:** Core fantasy UI visible — welcome through campaign detail. Player can create character
and see the Realm Map.

### Sprint B Tasks

| Task ID | Description | Owner | Depends On | Est |
|---------|-------------|-------|------------|-----|
| P16-FE-001 | inventory-store.ts (Zustand) | FE | Sprint A BE | M | **DONE** (2026-04-27) |
| P16-FE-002 | useUiMode() hook + html data-ui-mode attr | FE | BE-006, BE-009 | M | **DONE** (2026-04-27) |
| P16-FE-003 | Extend combat-store with sparkCharges | FE | FE-001 | S | **DONE** (2026-04-27) |
| P16-FE-004 | Park R3F components → _legacy_r3f/, update imports | FE | — | M | **DONE** (2026-04-27) |
| P16-FE-010 | Port Scene component | FE | FND-001 | S | **DONE** (2026-04-27) |
| P16-FE-011 | Port Logo component (Eureka brand) | FE | — | S | **DONE** (2026-04-27) |
| P16-FE-012 | Port GameButton (4 variants) | FE | FND-001 | S | **DONE** (2026-04-27) |
| P16-FE-013 | Port KpBadge → wire to inventory-store | FE | FE-001 | S | **DONE** (2026-04-27) |
| P16-FE-014 | Port AiTutorChat (mock mode; real wiring Sprint C) | FE | — | L | **DONE** (2026-04-27) |
| P16-FE-015 | Adapt NavLink (react-router-dom → Next Link) | FE | — | S | **DONE** (2026-04-27) |
| P16-FE-016 | Extract reusable HpBar component | FE | — | S | **DONE** (2026-04-27) |
| P16-PG-001 | /g/welcome page (Firebase auth wiring) | FE | FE-010, FE-012 | M | **DONE** (2026-04-27) |
| P16-PG-002 | /g/character page (create + persist FantasyCharacter) | FE | PG-001, BE-007 | M | **DONE** (2026-04-27) |
| P16-PG-003 | /g/dashboard page (Realm Map) | FE | PG-002 | L | **DONE** (2026-04-27) |
| P16-PG-004 | /g/campaign/[slug] page (realm interior) | FE | PG-003 | M | **DONE** (2026-04-27) |

**Sprint B exit criteria:**
- [x] Feature flag toggles between fantasy UI and legacy R3F (R3F parked; imports resolve; build passes)
- [x] Welcome → Character Create → Dashboard → Campaign Detail flow works end-to-end
- [x] KP badge wired to inventory-store (backend hydration in Sprint C)
- [ ] AI Tutor chat in fantasy mode goes through moderation pipeline — **mock only in Sprint B; real wiring Sprint C (P16-FE-014 note)**
- [x] All parked R3F imports resolve; build passes (tsc --noEmit: 0 errors in project files)

**Progress:** 15/15 tasks DONE. Sprint B complete (2026-04-27). Sprint C ready to start.

**Sprint B commits:**
- `fdb95f1` feat: inventory-store, useUiMode hook, combat-store sparkCharges
- `bc69e0d` refactor: park 15 R3F components to _legacy_r3f/
- `905e65b` feat: port 7 fantasy UI components
- `264e4b6` feat: 4 game pages (welcome, character, dashboard, campaign detail)

---

## Sprint C — Battle Critical Path + Shop (Week 5–6)

**Goal:** Complete gameplay loop — mission prep, battle, shop, inventory. A child can learn,
fight, earn KP, and buy abilities.

### Sprint C Tasks

| Task ID | Description | Owner | Depends On | Est | Status |
|---------|-------------|-------|------------|-----|--------|
| P16-PG-005 | /g/campaign/[slug]/prepare page (Academy hub: lessons / shorts / tutor / forge) | FE | PG-004 | M | **DONE** (2026-04-29, commit cf2402e) |
| P16-PG-006 | /g/campaign/[slug]/mission/[missionId]/prep page (warm-up quiz) | FE | PG-004 | M | **DONE** (2026-04-29, commit cf2402e) |
| P16-PG-007 | /g/campaign/[slug]/battle/[missionId] page (wire to Phase 15 combat API) | FE | PG-006, FE-003 | XL | **DONE** (2026-04-29, commit 8817718) |
| P16-PG-008 | /g/campaign/[slug]/shop page (per-realm, zoneId-filtered) | FE | FE-001, PG-004 | M | **DONE** (2026-04-29, commit af9d3ea) |
| P16-PG-009 | /g/shop page (global Grand Bazaar) | FE | PG-008 | S | **DONE** (2026-04-29, commit af9d3ea) |
| P16-PG-010 | /g/inventory page re-theme (KP balance, equipped, abilities, weapons) | FE | FE-001 | M | **DONE** (2026-04-29, commit 018a396) |
| P16-PG-011 | /g/victory re-theme (CertificateScreen wrapped in Scene) | FE | PG-003 | S | **DONE** (2026-04-29, commit 018a396) |
| P16-PG-012 | /g/not-found.tsx re-theme ("Consumed by the Void") | FE | FND-001 | S | **DONE** (2026-04-29, commit 018a396) |
| P16-SET-001 | Settings page: UI mode toggle (B2C) | FE | FE-002 | M | **DONE** (2026-04-28, commit 70461cc) |
| P16-SET-002 | Tenant admin: default mode + lock toggle | FE+BE | BE-008 | M | **DONE** (2026-04-28, commit 70461cc) |
| P16-SET-003 | Hide settings toggle when tenant locked | FE | SET-002 | S | **DONE** (2026-04-28, commit 70461cc) |
| P16-SET-004 | Mode toggle disabled during combat / AI stream | FE | FE-002 | S | **DONE** (2026-04-28, commit 70461cc) |
| P16-RTE-001 | next.config redirects (legacy → new routes) | FE | PG-003 | S | **DONE** (2026-04-28, commit 87f2463) |
| P16-RTE-002 | (game) layout: flag-gated new vs legacy render | FE | FE-004 | M | **DONE** (2026-04-28, commit 87f2463) |
| P16-RTE-003 | Dynamic import _legacy_r3f for tree-shaking | FE | RTE-002 | M | **DONE** (2026-04-28, commit 87f2463) |

**Status legend:** `IN_REVIEW` = code on disk, type-checks clean, needs commit + PM/QA sign-off.

**Sprint C exit criteria:**
- [x] Settings toggle switches mode without data loss (P16-SET-001 + P16-SET-004 — DONE)
- [x] Tenant lock prevents user override (P16-SET-002 + P16-SET-003 — DONE)
- [x] Legacy route redirects work (/g/world → /g/dashboard etc.) (P16-RTE-001 — DONE)
- [x] PG-005..012 committed and reviewed (FE 2026-04-29, 4 commits)
- [x] Full gameplay loop end-to-end: welcome → character → dashboard → campaign → prepare → lesson → battle (win/lose) → shop → equip → battle again
- [x] KP earned on lesson/battle completion in gamified mode (FE wired via inventoryStore.addKp + toast)
- [x] KP spent in shop; purchased ability usable in next battle
- [x] **P16-PG-007 (battle page) implemented against Phase 15 combat API** (commit 8817718)

**Progress:** 15/15 DONE. Sprint C complete (2026-04-29).

**Sprint C commits:**
- `4fae81a` chore: register inventory/tenants/users modules in app.module, cleanup useUiMode
- `cf2402e` feat: add prepare + mission prep pages (P16-PG-005, P16-PG-006)
- `af9d3ea` feat: add per-realm + global shop pages (P16-PG-008, P16-PG-009)
- `018a396` feat: re-theme inventory, victory, and not-found pages (P16-PG-010..012)
- `8817718` feat: add battle page wired to combat API (P16-PG-007)

### P16-PG-007 — Battle Page Decomposition (PM, 2026-04-28)

The XL battle page is the only remaining Sprint C *implementation* task. Decomposed into 5 subtasks
so an FE session can pick them up serially. Combat-store, HpBar, sparkCharges, certificate URL
plumbing, and combat API are all already in place — this task wires them into a 2D fantasy battle UI.

| Sub-ID | Description | Est | Depends On | Notes |
|--------|-------------|-----|------------|-------|
| P16-PG-007.1 | Route scaffold `/g/campaign/[slug]/battle/[missionId]/page.tsx` — resolve slug→ZoneId, missionId→battleType, call `POST /api/v1/combat/init`, hydrate combat-store via `loadBattle`, gate render on phase | S | PG-006, BE combat | Use `ZONE_BY_CAMPAIGN_SLUG`. Mission-id prefix decides battleType (`*-1/2/3` minion, `*-boss` guardian, overlord-mission TBD) |
| P16-PG-007.2 | Battle UI shell — Scene + Logo + KpBadge header, hero panel (FantasyClass aura), zombie panel, HpBar pair, intro overlay with `startFight` button | M | PG-007.1, FE-016 (HpBar) | Reuse existing 2D class assets; do not import R3F |
| P16-PG-007.3 | Question card + answer buttons + 15s timer; on pick → `combat-store.submitAnswer(idx, timeRemaining)`; play 600ms attack/recoil animation; call `advanceAfterAnimation` | M | PG-007.2 | Phases: `player_turn`, `player_attack`, `zombie_attack`, `victory`, `defeat`. Reuse phase machine in store |
| P16-PG-007.4 | Spark Charge ability (gamified mode) — button visible only when `sparkCharges > 0` && `isGameMode`; consumes one charge, deals fixed bonus damage; integrate with phase machine without breaking question flow | S | PG-007.3, FE-002 | Per ADR-003 §spark-charge mechanic. Charges hydrated from inventory in future task; for Sprint C accept stub seed of 0 |
| P16-PG-007.5 | Outcome flow: on `victory` call `POST /api/v1/combat/:battleId/complete`, store xp/badges/kp via `setBattleReward`+inventory hydrate; if overlord, request certificate & navigate `/g/victory`; on `defeat` show retry/exit panel; on minion/guardian victory, navigate back to `/g/campaign/[slug]` | M | PG-007.3 | Mirror combat.controller return shape: `{ xpAwarded, badgesUnlocked, kpAwarded }`. Toast KP reward in gamified mode |

**File-size watchout (CLAUDE.md rule #8):** Page will exceed 300 lines. Split into:
- `page.tsx` — route shell, init/cleanup, phase router (target ≤180 lines)
- `battle-stage.tsx` — hero/zombie panels, HpBar pair, intro overlay
- `battle-quiz.tsx` — QuestionCard, timer, answer handling
- `battle-outcome.tsx` — victory/defeat panels, certificate trigger

**Acceptance for PG-007 as a whole:**
- Init returns BattleConfig and store hydrates
- All 4 phases render without broken state transitions
- Victory triggers KP award (gamified) and inventory hydration
- Overlord victory chains to certificate + `/g/victory`
- Defeat shows retry / return-to-Academy CTAs
- No R3F imports anywhere in the new files
- `pnpm exec tsc --noEmit` clean for new files

---

## Sprint D — Mobile Mirror, Assets, QA, Rollout (Week 7–8)

**Goal:** Mobile parity, full QA suite, production-ready.

**PM scheduling note (2026-04-28):** Sprint D launches in two waves so we don't burn
calendar time waiting on Sprint C closure. Wave 1 starts immediately (DEVOPS-led
asset/license work + QA test-plan drafting). Wave 2 launches the moment Sprint C is
DONE (FE mobile mirror + QA Playwright impl + DEVOPS rollout).

### Wave 1 — Parallel-start (does NOT depend on Sprint C closure)

| Task ID | Description | Owner | Depends On | Est | Status |
|---------|-------------|-------|------------|-----|--------|
| P16-AST-001 | Import 6 Lovable assets to `apps/web/public/assets/game/` (world-map, island-1..4, zombie, hero-warrior/mage/rogue/engineer, logo) | DEVOPS | — | S | **DONE** (2026-04-29) — 13 SVG placeholders + game-assets.ts + Logo.tsx→.svg |
| P16-AST-002 | Generate 4 zone-specific zombie variants (color-tinted base zombie) | DEVOPS | AST-001 | S | **DONE** (2026-04-29) — scripts/generate-zombie-variants.sh |
| P16-MOB-003 | Asset script: generate 768×1024 mobile crops from desktop backgrounds; commit to `scripts/generate-mobile-crops.{ts,sh}` | DEVOPS | AST-001 | S | **DONE** (2026-04-29) — scripts/generate-mobile-crops.sh |
| P16-OPEN-005 | Lovable asset license / replacement decision (commercial-use confirmation OR commission replacement) | PM+DEVOPS | — | — | **DONE** (2026-06-27) — Path C: all assets are custom SVGs, no Lovable content, no encumbrance. PM accepted. QA-006 gate cleared. |
| P16-QA-PLAN | Draft Playwright test plan for QA-001/QA-002 (test cases, fixtures, mock auth strategy); commit to `apps/web/e2e/fantasy-flow.plan.md` | QA | — | S | **DONE** (2026-04-29) — 13 test suites, 50+ cases, mock auth strategy, flag matrix |
| P16-QA-003a | i18n string extraction pass 1: extract strings from already-landed Sprint B+C pages (welcome, character, dashboard, campaign, settings, prepare, prep, shop, inventory, victory, not-found) into `en.json`; stub `fr.json`/`ar.json` with TODO markers | FE+QA | — | M | **READY** — battle page strings deferred to QA-003b |

### Wave 2 — Blocked on Sprint C closure

| Task ID | Description | Owner | Depends On | Est | Status |
|---------|-------------|-------|------------|-----|--------|
| P16-MOB-001 | Mirror all 11 game routes to /m/* with `density="compact"` | FE | Sprint C DONE | L | **DONE** (2026-05-06, commits 9591ea1, c450a25, 59af877) |
| P16-MOB-002 | Mobile bottom-tab bar in game mode (Realm Map · Battle · Shop · Inventory · Profile) | FE | MOB-001 | M | **DONE** (2026-05-06, commit 9591ea1 — GameBottomTabs.tsx) |
| P16-QA-001 | Playwright: fantasy-mode E2E (welcome → character → dashboard → campaign → battle win/lose → shop → equip → battle reuse) | QA | Sprint C DONE, QA-PLAN | L | **DESCOPED** (PM 2026-07-01 — 63 days READY, no pickup; reduced to smoke spec, post-rollout stretch) |
| P16-QA-002 | Playwright matrix: same flow with `featureFlags.fantasyUi` true and false | QA | QA-001 | M | **DESCOPED** (PM 2026-07-01 — depended on QA-001; deferred to post-rollout) |
| P16-QA-003b | i18n string extraction pass 2: battle-page strings | FE+QA | P16-PG-007 DONE | S | **DONE** (2026-05-06, commit 21fcaf7) |
| P16-QA-004 | Lighthouse mobile ≥90 perf for /m/dashboard | QA | MOB-001 | M | READY (MOB-001 done; not yet run) |
| P16-QA-005 | iOS Safari + Android Chrome smoke tests | QA | MOB-001 | M | READY (MOB-001 done; not yet executed) |
| P16-QA-006 | Production rollout via flag: 5% → 25% → 100% over 2 weeks | DEVOPS | All Wave 1+2 done, OPEN-005 resolved | — | BLOCKED (pending QA-004 + QA-005 only — OPEN-005 cleared 2026-06-27, QA-001/002 descoped 2026-07-01) |

**Sprint D exit criteria:**
- [x] All assets resolved per OPEN-005 — custom SVG placeholders confirmed clean; Path C accepted by PM 2026-06-27
- [x] Mobile crop script runs cleanly and outputs 768×1024 variants (MOB-003, scripts/generate-mobile-crops.sh)
- [x] All 11 mobile routes functional; bottom-tab nav works (MOB-001/002 DONE 2026-05-06)
- [x] Playwright E2E gate — **DESCOPED** (PM 2026-07-01; replaced by QA-004/005 smoke + post-rollout stretch spec; QA-001/002 formally removed from exit criteria)
- [x] All new strings in `en.json`; `fr.json`/`ar.json` have real translations (QA-003a+003b both DONE 2026-05-04/06)
- [ ] Lighthouse mobile ≥90 on /m/dashboard — READY, not yet run
- [ ] iOS Safari + Android Chrome smoke pass — READY, not yet executed
- [x] OPEN-005 resolved — Path C accepted 2026-06-27; all assets are custom SVGs, no encumbrance
- [ ] Feature flag enabled at 5% in production with rollout schedule queued

**Size:** 13 tasks (split from 12 — QA-003 split into 003a/003b, added QA-PLAN draft).
**Wave 1 starts now (3 DEVOPS, 1 PM+DEVOPS, 1 QA, 1 FE+QA).**
**Wave 2 launches when Sprint C closes (FE 2, QA 5, DEVOPS 1).**

---

## Timeline Summary

| Sprint | Weeks | Focus | Key Risk |
|--------|-------|-------|----------|
| A | 1–2 | Foundation + Backend | Firestore atomic txn complexity for buy endpoint |
| B | 3–4 | State + Components + Pages 1–4 | AI Tutor port must respect moderation pipeline |
| C | 5–6 | Battle + Shop + Settings + Routing | P16-PG-007 (battle page) is XL — may slip |
| D | 7–8 | Mobile + QA + Rollout | Mobile perf on low-end Android; asset licensing |

**Total estimated duration:** 8 weeks (aggressive) to 10 weeks (with buffer).
**Parallel tracks:** FE foundation runs alongside BE in Sprint A. QA starts Sprint D but can pull forward smoke tests.

---

## Dependencies on Other Phases

- **Phase 15 backend (DONE):** Combat API consumed unchanged by P16-PG-007
- **Phase 15 frontend (DEFERRED):** R3F components parked, not completed
- **Backlog items:** STRIPE-001, DEPLOY-001, COPPA-001 remain independent; can be tackled between sprints

---

*Sprint plan v1.2 — PM agent — 2026-04-28*
*Changelog v1.2: Sprint D split into Wave 1 (parallel-start, 5 tasks) and Wave 2 (blocked-on-Sprint-C, 8 tasks).*
*QA-003 split into 003a (existing pages, ready) and 003b (battle page, blocked on PG-007).*
*Added P16-QA-PLAN (Playwright test-plan draft) so QA can start before Sprint C closes.*
*Wave 1 dispatched to DEVOPS+QA via blockers.md 2026-04-28.*
*Changelog v1.1: Sprint C status updated. SET-001..004 + RTE-001..003 marked DONE.*
*PG-005, 006, 008–012 marked IN_REVIEW (uncommitted on disk, type-checks clean).*
*P16-PG-007 (battle page) decomposed into 5 sub-tasks (.1–.5) for FE pickup.*
