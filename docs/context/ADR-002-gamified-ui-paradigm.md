# ADR-002: Gamified UI Paradigm — Cinematic 2D Fantasy (R3F Parked)

> **Status:** ACCEPTED
> **Date:** 2026-04-25
> **Author:** ARCH agent
> **Implements:** [planning/phase-16-gamified-ui-redesign.md](../../planning/phase-16-gamified-ui-redesign.md)
> **Supersedes (partial):** [planning/phase-15-combat-design.md](../../planning/phase-15-combat-design.md) — UI layer only; combat backend retained

---

## Context

The Eureka Lab platform offers two presentations of the same Level-1–4 curriculum:

1. **Normal mode** — clean, classroom-like, lives in `apps/web/src/app/(dashboard)/*`.
2. **Gamified mode** — currently a 3D World/Zone/Mission/Battle experience built with
   `@react-three/fiber` (R3F), shipped in Phase 15 (commit `b6208bf`, 2026-03-07). Lives in
   `apps/web/src/app/(game)/g/*`.

The Phase 15 R3F implementation works but has unmeasured UX impact. The product has accumulated a
fully-realised 2D cinematic-fantasy reference design (Vite + React + shadcn/ui, dark theme with
Cinzel display font, glassmorphic panels, glow shadows, rune ring animations, KP economy,
ability/weapon shop) at `C:\Eureka-lab-app\Dev\ai-adventure-island`.

The product owner has decided to:

- Replace the **entire** gamified-mode UI with the cinematic 2D fantasy design.
- **Park** the R3F implementation behind a feature flag for A/B comparison rather than deleting.
- Add the new gameplay loop (KP economy + shop) as a first-class backend feature.

## Decision

1. **The default rendering paradigm for `(game)` route group becomes 2D shadcn/ui cinematic
   fantasy.** The 3D R3F implementation is preserved under `apps/web/src/components/game/_legacy_r3f/`
   and is gated by `featureFlags.fantasyUi` in [packages/shared-types/src/feature-flags.ts](../../packages/shared-types/src/feature-flags.ts).

2. **`featureFlags.fantasyUi` defaults to:**
   - `true` in dev and staging environments
   - `false` in initial production (until ≥2 weeks of data inform the rollout)

3. **The Phase 15 combat backend is kept unchanged.** Specifically, the NestJS `combat` module,
   `combat-sessions/{battleId}` Firestore collection, and the `/api/v1/combat/init` and
   `/api/v1/combat/:battleId/complete` endpoints are reused by both UI variants. The "gate model"
   from Phase 15 (every zombie must be defeated to proceed) remains the gameplay rule.

4. **Two narratives coexist, mapped 1:1** through `CAMPAIGN_SLUG_BY_ZONE` in shared-types. Normal
   mode renders Zone names ("Library of Prompts", "Misinformation Mole"); game mode renders Realm
   names ("Isle of Whispers", "Babble Whisperer"). Underlying database keys are unchanged.

5. **The R3F code must remain compilable and test-passing** for as long as it lives under
   `_legacy_r3f/`. Removal requires a future ADR after A/B data justifies it.

## Consequences

**Positive**

- Lower bundle size for the dominant code path (no `three`, `@react-three/fiber`, or
  `@react-three/drei` in the critical bundle once we move legacy code to dynamic imports —
  tracked in PR #21 of the migration sequence).
- More accessible to a broader device range (no WebGL requirement; better on low-end Android,
  older iPads, kiosk devices).
- Faster iteration on creative direction — CSS/Tailwind tweaks vs. 3D primitive composition.
- Mobile path benefits significantly: 2D responsive UI maps cleanly to phone form factors.
- Preserves Phase 15 backend investment and the curriculum-aligned quiz bank.

**Negative**

- Two parallel UIs in the `(game)` route group double the QA matrix until R3F is retired.
- Asset dependency: Lovable-generated PNG/JPG backgrounds. Unclear license must be resolved
  before B2B production rollout (tracked separately as a DEVOPS issue).
- Phase 15 R3F-specific components (`CombatArena`, `ZombieCharacter`, `CombatHUD`, etc.) become
  dead-end code paths — maintained but not enhanced.
- Mode-switching mid-battle is unsafe; UI mode toggle disabled while `combatStore.phase !== 'idle'`.

**Neutral**

- Career archetypes (Prompt Poet / Code Wizard / Data Artist / Robot Builder) get a cosmetic
  "fantasy class" mapping (Mage / Engineer / Rogue / Warrior). See ADR-005.
- KP economy added; see ADR-003.

## Alternatives Considered

1. **Re-skin only — keep R3F, add fantasy CSS theme.** Rejected because the 2D layout (panel grid,
   battle log, ability dock, quiz overlay) is fundamentally not what R3F provides. Forcing both
   paradigms into one component tree creates a Frankenstein UI that's harder to maintain than two
   separate trees behind a flag.

2. **Hybrid — keep R3F world map, replace combat only.** Rejected. The new design treats the
   World/Realm view, Campaign Detail, and Battle as a coherent visual progression. Splitting
   paradigms breaks the visual story and forces awkward transitions between WebGL and DOM.

3. **Delete R3F immediately.** Rejected. Phase 15 represents recent investment, and we have no
   user data on which paradigm performs better for retention or learning outcomes. Deleting now
   destroys the only baseline we can compare against.

4. **Build the new UI as a third mode (normal / gamified / fantasy).** Rejected. Adds a third
   axis to QA, settings UX, and analytics for no clear benefit. The product owner's intent is to
   replace, not multiply.

## Acceptance Criteria

- Toggling `featureFlags.fantasyUi` in dev environment reliably round-trips between R3F UI and
  fantasy UI with no data loss in `combat-store` or `game-store`.
- Both UI variants pass the same end-to-end Playwright suite (welcome → character → dashboard →
  campaign → mission → battle → victory).
- Bundle-size delta documented at production-flag-on time; `_legacy_r3f/` code excluded from
  default chunk via dynamic import (acceptance criterion for migration PR #21).

## Open Items (Tracked for Future ADR)

- Final R3F retirement decision (ADR-006, target 2026-Q3 after ≥2 weeks of A/B data).
- Asset licensing resolution (tracked under `planning/blockers.md`).

---

*Authored 2026-04-25 by ARCH agent.*
