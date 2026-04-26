# ADR-005: Narrative & Class Mapping (Normal ↔ Game Modes)

> **Status:** ACCEPTED
> **Date:** 2026-04-25 (proposed) → 2026-04-26 (accepted)
> **Confirmed by:** Product owner — all proposed mappings, slugs, and "Babble" boss names
> approved without modification
> **Author:** ARCH agent
> **Implements:** [planning/phase-16-gamified-ui-redesign.md](../../planning/phase-16-gamified-ui-redesign.md) §3
> **Depends on:** ADR-002

---

## Context

The Eureka Lab curriculum is divided into 4 zones (one per learning level), each with a themed
"Anti-AI Zombie" boss tied to the pedagogy of that zone. The new gamified mode introduces a
parallel cinematic-fantasy narrative: 4 realms with "Babble Zombies" plus an Anti-AI Overlord.

Similarly, the existing **Career Archetype** identity (Prompt Poet, Code Wizard, Data Artist,
Robot Builder) continues to anchor the user's identity in normal mode and learning analytics. The
new gamified UI introduces a complementary **Fantasy Class** identity (Mage, Engineer, Rogue,
Warrior) for the cinematic experience.

Both narratives must coexist permanently:

- A single user has one career archetype AND one fantasy class.
- The user sees only one narrative at a time, determined by their effective UI mode (ADR-004).
- The mappings must be stable — once a child picks Mage in game mode, switching modes back and
  forth must show consistent identity.

## Decision

### 1. Zone ↔ Realm Mapping (Stable, 1:1)

| ZoneId (db) | Normal Mode Zone Name | Realm Slug (URL) | Realm Name | Boss (Normal) | Boss (Game) |
|---|---|---|---|---|---|
| `library` | Library of Prompts | `whispers` | Isle of Whispers | Misinformation Mole | **Babble Whisperer** |
| `forge` | Automation Forge | `echoes` | Forge of Echoes | Lazy Bot | **Babble Drone** |
| `citadel` | Code Citadel | `glitches` | Citadel of Glitches | Bug Monster | **Babble Glitch** |
| `academy` | Agent Academy | `wraiths` | Academy of Wraiths | Memory Eraser | **Babble Wraith** |
| `void` (final-boss synthetic id) | (none) | `void` | The Void Throne | — | **Anti-AI Overlord** |

- `ZoneId` remains the canonical database identifier.
- `Realm Slug` is the URL segment (`/campaign/:slug`) — **public, immutable after launch**.
- Renaming the user-facing strings is allowed; the slug is not.

### 2. Career Archetype ↔ Fantasy Class Mapping (Default; user-overridable)

> **Correction posted 2026-04-26 during P16-FND-006 implementation:** the mapping below
> corresponds to the actual `CareerArchetype` enum (`packages/shared-types/src/index.ts` —
> 8 values) rather than the placeholder names used in the v1 draft. The product-owner
> approval still applies — the *shape* of the decision (default mapping, user override)
> is unchanged; only the source identifiers are now accurate. Mapping rationale is
> grouped in pairs to balance class distribution (2-2-2-2).

| CareerArchetype (db) | Default FantasyClass | Class Aura HSL | Rationale |
|---|---|---|---|
| `astronaut` | `warrior` | `0 80% 60%` (red) | Frontier explorer / brave |
| `chef` | `warrior` | `0 80% 60%` (red) | Heat / artisan precision |
| `doctor` | `mage` | `268 70% 60%` (violet) | Intellect / healing wisdom |
| `teacher` | `mage` | `268 70% 60%` (violet) | Mentorship / guidance |
| `artist` | `rogue` | `310 80% 65%` (magenta) | Creative perception |
| `gamer` | `rogue` | `310 80% 65%` (magenta) | Quick reflexes / agile |
| `engineer` | `engineer` | `42 95% 60%` (gold) | Logical builder (1:1) |
| `scientist` | `engineer` | `42 95% 60%` (gold) | Methodical investigator |

- **Default at character creation only.** When a user enters game mode for the first time, their
  fantasy class is pre-selected based on their career archetype. They may override.
- Career archetype and fantasy class are stored independently:
  - `users/{userId}.careerArchetype: CareerArchetype`
  - `users/{userId}.character.class: FantasyClass`
- After initial setup, changing one does **not** propagate to the other.

### 3. Implementation — Single Source of Truth

Both mappings live in `packages/shared-types/src/game.types.ts`:

```typescript
export const CAMPAIGN_SLUG_BY_ZONE: Record<ZoneId, string> = { /* ... */ };
export const ZONE_BY_CAMPAIGN_SLUG: Record<string, ZoneId> = /* derived */;

export const REALM_NAME_BY_ZONE: Record<ZoneId, string> = { /* ... */ };
export const ZOMBIE_GAME_NAME_BY_ZONE: Record<ZoneId, string> = { /* ... */ };

export const FANTASY_CLASS_BY_CAREER: Record<CareerArchetype, FantasyClass> = { /* ... */ };
export const CAREER_BY_FANTASY_CLASS: Record<FantasyClass, CareerArchetype> = /* derived */;
```

- Frontend imports these for routing, page titles, and character-creation defaults.
- Backend imports these for redirect resolution and audit logs.
- A single change in this file is the only way to alter the mapping.

### 4. Renaming Policy

- **Realm name and zombie name** (user-facing strings): renameable any time without migration.
  Updates to `REALM_NAME_BY_ZONE` ship like any string change.
- **Realm slug** (URL): renaming requires:
  1. ARCH approval and a new ADR.
  2. A `next.config.js` redirect from old → new slug, kept indefinitely.
  3. Notification to BE for any analytics tags or stored slugs.
- **CareerArchetype and FantasyClass enums**: renaming requires a database migration. Strongly
  discouraged after launch.

## Consequences

**Positive**

- Stable URLs and database keys regardless of narrative renames.
- 1:1 mapping prevents content drift (a learner is on the same lesson regardless of the words
  they see).
- Frontend rendering is purely a presentation concern — no business-logic branching on mode for
  curriculum.

**Negative**

- Two sets of names to maintain and translate (when i18n lands).
- A user who picks Mage by override and later changes career archetype to `code_wizard` may be
  confused that their fantasy class doesn't auto-switch. Mitigation: when the career archetype
  changes, show a one-time prompt: "Your hero class is **Mage**. Update to **Engineer** to match
  your new path? [Keep / Update]".

**Neutral**

- Analytics queries on zone-level performance work the same in both modes (group by `ZoneId`).

## Confirmation Log

- 2026-04-26 — Product owner accepted all three proposed sub-decisions (realm slugs, Babble boss
  names, career→class mapping) verbatim. No further open items. Mappings are now locked per the
  Renaming Policy in §4.

## Alternatives Considered

1. **One narrative only (gamified replaces normal entirely).** Rejected per product direction —
   normal mode must remain available, especially for B2B classroom contexts.

2. **No fantasy class — reuse career archetype name in fantasy mode.** Rejected — career
   archetypes do not visually fit the cinematic dark-fantasy aesthetic ("Prompt Poet Warrior"
   reads as parody).

3. **Computed-only mapping with no user override.** Rejected — children value cosmetic agency.
   Allowing override at creation time is low-cost and high-engagement.

4. **Mapping by content tag (a lesson tagged "needs-mage" maps to Mage class bonuses).**
   Rejected as scope creep. KP economy provides the tuning surface; class is purely cosmetic
   identity for v1.

---

*Authored 2026-04-25 by ARCH agent.*
