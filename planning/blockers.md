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

## Resolved Blockers

### 2026-04-26 — P16-OPEN-004: KP earn/spend tuning values

**Resolved by:** PM
**Resolution:** Initial seed values documented in sprint-p16.md §KP Tuning Values.
Lesson=10, Practice=5, Minion=15, Guardian=30, Overlord=50, Daily=5. Cap=100/day.
Shop: abilities 60–120 KP, weapons 150–300 KP. Tunable post-launch.
