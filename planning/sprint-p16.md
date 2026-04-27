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

| Task ID | Description | Owner | Depends On | Est |
|---------|-------------|-------|------------|-----|
| P16-PG-005 | /g/campaign/[slug]/prepare page (boss preview) | FE | PG-004 | M |
| P16-PG-006 | /g/campaign/[slug]/mission/[missionId]/prep page | FE | PG-004 | M |
| P16-PG-007 | /g/campaign/[slug]/battle/[missionId] page (wire to Phase 15 combat API) | FE | PG-006 | XL |
| P16-PG-008 | /g/campaign/[slug]/shop page (per-realm) | FE | FE-001, PG-004 | M |
| P16-PG-009 | /g/shop page (global) | FE | PG-008 | S |
| P16-PG-010 | /g/inventory page re-theme | FE | FE-001 | M |
| P16-PG-011 | /g/victory + /g/not-found re-theme | FE | PG-003 | S |
| P16-PG-012 | /g/not-found.tsx re-theme | FE | FND-001 | S |
| P16-SET-001 | Settings page: UI mode toggle (B2C) | FE | FE-002 | M |
| P16-SET-002 | Tenant admin: default mode + lock toggle | FE+BE | BE-008 | M |
| P16-SET-003 | Hide settings toggle when tenant locked | FE | SET-002 | S |
| P16-SET-004 | Mode toggle disabled during combat / AI stream | FE | FE-002 | S |
| P16-RTE-001 | next.config redirects (legacy → new routes) | FE | PG-003 | S |
| P16-RTE-002 | (game) layout: flag-gated new vs legacy render | FE | FE-004 | M |
| P16-RTE-003 | Dynamic import _legacy_r3f for tree-shaking | FE | RTE-002 | M |

**Sprint C exit criteria:**
- [ ] Full gameplay loop: welcome → character → dashboard → campaign → prepare → lesson → battle (win/lose) → shop → equip → battle again
- [ ] KP earned on lesson/battle completion in gamified mode
- [ ] KP spent in shop; purchased ability usable in next battle
- [ ] Settings toggle switches mode without data loss
- [ ] Tenant lock prevents user override
- [ ] Legacy route redirects work (/g/world → /g/dashboard etc.)
- [ ] P16-PG-007 (battle) confirmed working against Phase 15 combat API

**Size:** ~15 tasks. PG-007 (battle page) is the XL critical-path item.

---

## Sprint D — Mobile Mirror, Assets, QA, Rollout (Week 7–8)

**Goal:** Mobile parity, full QA suite, production-ready.

### Sprint D Tasks

| Task ID | Description | Owner | Depends On | Est |
|---------|-------------|-------|------------|-----|
| P16-MOB-001 | Mirror all 11 game routes to /m/* with density=compact | FE | Sprint C | L |
| P16-MOB-002 | Mobile bottom-tab bar in game mode | FE | MOB-001 | M |
| P16-MOB-003 | Asset script: generate mobile crops | DEVOPS | — | S |
| P16-AST-001 | Import Lovable assets to public/assets/game/ | DEVOPS | — | S |
| P16-AST-002 | Generate 4 zone-specific zombie variants | DEVOPS | AST-001 | S |
| P16-QA-001 | Playwright: fantasy-mode E2E (full flow) | QA | Sprint C | L |
| P16-QA-002 | Playwright: flag matrix (fantasyUi true/false) | QA | QA-001 | M |
| P16-QA-003 | i18n: extract all new strings to en.json; stub fr/ar | FE+QA | Sprint C | M |
| P16-QA-004 | Lighthouse mobile >= 90 perf for /m/dashboard | QA | MOB-001 | M |
| P16-QA-005 | iOS Safari + Android Chrome smoke tests | QA | MOB-001 | M |
| P16-QA-006 | Production rollout: 5% → 25% → 100% over 2 weeks | DEVOPS | All above | — |
| P16-OPEN-005 | Lovable asset license / replacement decision | PM+DEVOPS | — | — |

**Sprint D exit criteria:**
- [ ] All mobile routes functional; bottom-tab nav works
- [ ] Playwright passes in both flag states
- [ ] All new strings in en.json; fr.json/ar.json have TODO stubs
- [ ] Lighthouse mobile >= 90
- [ ] Safari + Chrome smoke pass
- [ ] Asset license resolved OR replacement art commissioned
- [ ] Feature flag enabled at 5% in production

**Size:** ~12 tasks. Mobile (FE) and QA work can parallelize.

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

*Sprint plan v1.0 — PM agent — 2026-04-26*
