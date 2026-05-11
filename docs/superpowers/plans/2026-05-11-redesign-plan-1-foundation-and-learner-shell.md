# Eureka Lab Redesign — Plan 1 of N: Foundation + Learner Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut a new branch off main, revert the Phase 16 merge while preserving salvaged backend/state/component work, install the reference's visual language, and stand up the first three routes (Welcome → Character Create → Dashboard) so a user can sign up, create a character, and see the Realm Map.

**Architecture:** Next.js 14 App Router app with `next-intl`/`next-pwa`/Firebase auth retained. After this plan, the new branch contains: (1) salvaged backend modules + Zustand stores + fantasy components, (2) parked R3F components in `_future_r3f/`, (3) reference design tokens merged into `globals.css` + `tailwind.config.ts`, (4) reference data files (`game.ts`, `quiz.ts`, `academy.ts`), (5) a `useGame()` adapter wrapping our Zustand stores, (6) working `/`, `/character`, `/dashboard` routes.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui (kept for adult-facing pages), Zustand, TanStack Query, Firebase Auth + Firestore, next-intl, next-pwa, Cinzel + Inter + Amiri fonts.

**Spec:** [docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md](../specs/2026-05-09-redesign-from-reference-design.md)
**Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island`

**Out of scope (covered by Plan 2+):** Campaign + Battle pages, Shop + Inventory + Victory, Auth pages re-skin, Adult-facing re-skin, Backend hybrid combat validation, i18n re-key, E2E suite rewrite.

---

## Pre-flight

This plan executes on a fresh worktree branched from `main`. The user's current main has uncommitted changes (lockfile, assets, planning docs) — those need to be set aside before starting.

- [ ] **Pre-flight Step 1: Confirm working tree is clean**

Run: `git status --short`
Expected: No output (clean tree). If there are uncommitted changes, ask the user whether to stash, commit to a branch, or discard. Do NOT proceed until clean.

- [ ] **Pre-flight Step 2: Confirm latest main**

Run: `git checkout main && git pull --ff-only`
Expected: Already up to date OR fast-forward to latest. Verify `git rev-parse HEAD` matches `58c9f25`.

- [ ] **Pre-flight Step 3: Verify reference project is reachable**

Run: `ls "C:\Eureka-lab-app\Dev\ai-adventure-island\src\components\game"`
Expected: Lists `AiTutorChat.tsx GameButton.tsx KpBadge.tsx Logo.tsx NavLink.tsx Scene.tsx`.

---

## Phase 0 — Branch setup, salvage, revert

The salvage list is in spec §4.1. The discard list is in spec §4.2. The revert command is in spec §4.3.

### Task 0.1: Create the salvage branch and cherry-pick salvage paths

**Files:** none new — git operations only.

- [ ] **Step 1: Create salvage branch**

```bash
git checkout -b salvage/phase-16
```

Expected: `Switched to a new branch 'salvage/phase-16'`.

- [ ] **Step 2: Create an empty salvage commit as anchor**

```bash
git commit --allow-empty -m "salvage(phase-16): anchor commit for cherry-pick chain"
```

Expected: One empty commit.

- [ ] **Step 3: Tag the salvage paths in a manifest file for reproducibility**

Create `salvage-manifest.txt` at repo root with the exact paths from spec §4.1. Used by the cherry-pick step below.

```text
apps/api/src/modules/inventory
apps/api/src/modules/users/character
packages/shared-types/src/phase16.types.ts
apps/web/src/components/game/fantasy
apps/web/src/stores/combat-store.ts
apps/web/src/stores/inventory-store.ts
apps/web/src/stores/agent-store.ts
apps/web/src/stores/ai-assistant-store.ts
apps/web/src/stores/workflow-store.ts
apps/web/src/stores/project-store.ts
apps/web/src/stores/auth-store.ts
apps/web/src/stores/gamification-store.ts
apps/web/src/stores/ui-store.ts
apps/web/public/assets/game
apps/web/src/messages/en.json
apps/web/src/messages/fr.json
apps/web/src/messages/ar.json
```

- [ ] **Step 4: Restore each salvage path from main@58c9f25 into the salvage branch**

```bash
# We're already at main (= 58c9f25 = HEAD on salvage/phase-16). Files are already present.
# This step is a no-op for the salvage branch — files already exist here.
# The salvage branch's job is to hold the salvageable file *content* as of 58c9f25,
# so we can cherry-pick it back onto the redesign branch after the revert deletes them.
echo "Salvage branch holds 58c9f25 state; nothing to restore."
```

- [ ] **Step 5: Commit the salvage manifest**

```bash
git add salvage-manifest.txt
git commit -m "salvage(phase-16): manifest of paths preserved for redesign branch"
```

Expected: One commit on `salvage/phase-16` with `salvage-manifest.txt` added. Branch HEAD includes both the manifest AND all the salvaged files at their 58c9f25 state (because the branch was cut from 58c9f25).

- [ ] **Step 6: Note the salvage commit SHA for later**

Run: `git rev-parse HEAD`
Record this SHA. We'll reference it as `<SALVAGE_SHA>` below.

---

### Task 0.2: Create the redesign branch and revert the Phase 16 merge

**Files:** none new — git operations only.

- [ ] **Step 1: Switch back to main**

```bash
git checkout main
```

Expected: `Switched to branch 'main'`. `git status` shows clean tree.

- [ ] **Step 2: Cut the redesign branch from main**

```bash
git checkout -b redesign/v2-from-reference
```

Expected: `Switched to a new branch 'redesign/v2-from-reference'`.

- [ ] **Step 3: Revert the Phase 16 merge commit**

```bash
git revert -m 1 58c9f25 --no-edit
```

Expected: One revert commit added. If conflicts surface (they shouldn't for a `-m 1` revert of a merge), abort with `git revert --abort` and escalate to the user — do not auto-resolve.

- [ ] **Step 4: Verify the revert removed the expected paths**

```bash
ls apps/web/src/app/\(game\) 2>&1
ls apps/web/src/app/\(mobile\) 2>&1
ls apps/web/src/hooks/useUiMode.ts 2>&1
```

Expected: All three return "No such file or directory" (the revert deleted them).

- [ ] **Step 5: Verify pre-Phase-16 work IS restored**

```bash
ls apps/web/src/components/game/GameProvider.tsx
ls apps/web/src/stores/game-store.ts
ls apps/api/src/modules/combat
```

Expected: All three exist (these are Phase 15 artifacts that pre-date the reverted merge).

- [ ] **Step 6: Verify salvage paths are GONE (will be restored next task)**

```bash
ls apps/web/src/components/game/fantasy 2>&1
ls apps/api/src/modules/inventory 2>&1
ls packages/shared-types/src/phase16.types.ts 2>&1
```

Expected: All return "No such file or directory" (these were added in the reverted merge).

---

### Task 0.3: Cherry-pick the salvage commit onto the redesign branch

**Files:** none new — git operations only. The cherry-pick restores all the salvageable paths.

- [ ] **Step 1: Cherry-pick the salvage anchor**

```bash
git cherry-pick <SALVAGE_SHA>  # the SHA recorded in Task 0.1 Step 6
```

If this fails (anchor was empty), instead **rebuild the salvage** by directly checking out the paths from `58c9f25`:

```bash
git checkout 58c9f25 -- \
  apps/api/src/modules/inventory \
  apps/api/src/modules/users/character \
  packages/shared-types/src/phase16.types.ts \
  apps/web/src/components/game/fantasy \
  apps/web/src/stores/combat-store.ts \
  apps/web/src/stores/inventory-store.ts \
  apps/web/src/stores/agent-store.ts \
  apps/web/src/stores/ai-assistant-store.ts \
  apps/web/src/stores/workflow-store.ts \
  apps/web/src/stores/project-store.ts \
  apps/web/src/stores/auth-store.ts \
  apps/web/src/stores/gamification-store.ts \
  apps/web/src/stores/ui-store.ts \
  apps/web/public/assets/game \
  apps/web/src/messages/en.json \
  apps/web/src/messages/fr.json \
  apps/web/src/messages/ar.json
```

- [ ] **Step 2: Verify salvage paths are restored**

```bash
ls apps/web/src/components/game/fantasy/Scene.tsx
ls apps/api/src/modules/inventory/inventory.module.ts
ls packages/shared-types/src/phase16.types.ts
ls apps/web/src/stores/inventory-store.ts
```

Expected: All exist.

- [ ] **Step 3: Commit the salvage restoration**

```bash
git add -A
git commit -m "salvage(phase-16): restore backend modules, stores, fantasy components, types, assets, i18n

Preserves work that survives the Phase 16 revert and feeds into the redesign:
- apps/api/src/modules/{inventory,users/character} backend modules
- packages/shared-types/src/phase16.types.ts (to be renamed gameplay.types.ts)
- apps/web/src/components/game/fantasy/* (to be moved to game/* in Phase 1)
- apps/web/src/stores/{inventory,combat,agent,ai-assistant,workflow,project,auth,gamification,ui}-store.ts
- apps/web/public/assets/game/* placeholder SVGs
- apps/web/src/messages/{en,fr,ar}.json (Phase16 namespaces, to be re-keyed in Plan 2+)
"
```

Expected: One salvage commit on `redesign/v2-from-reference`.

---

### Task 0.4: Verify build/tsc/lint clean after revert + salvage

**Files:** none new — verification only.

- [ ] **Step 1: Install dependencies**

```bash
pnpm install --frozen-lockfile
```

Expected: Lockfile satisfied. If unsatisfied (lockfile drifted), run `pnpm install` without `--frozen-lockfile` and verify the diff is only lockfile, then commit it separately.

- [ ] **Step 2: TypeScript check — shared-types**

```bash
pnpm --filter @eureka-lab/shared-types build
```

Expected: Clean build. `dist/` directory present.

- [ ] **Step 3: TypeScript check — API**

```bash
pnpm --filter @eureka-lab/api exec tsc --noEmit
```

Expected: Zero errors. Any error here is a blocker — investigate before continuing.

- [ ] **Step 4: TypeScript check — web**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: Zero errors in production code. Pre-existing Vitest mock-typing errors in `*.test.tsx` are acceptable (they're noted in the spec as out-of-scope).

- [ ] **Step 5: Lint check**

```bash
pnpm --filter @eureka-lab/web lint
```

Expected: Zero errors. Warnings acceptable.

- [ ] **Step 6: Push the branch as a draft PR**

```bash
git push -u origin redesign/v2-from-reference
gh pr create --draft \
  --title "redesign(v2): adopt ai-adventure-island as canonical UI" \
  --body "$(cat <<'EOF'
## Summary

- Reverts Phase 16 merge (PR #7, commit 58c9f25) that introduced the parallel `/g/*` game-mode universe.
- Re-applies salvaged work (inventory + character backend modules, stable Zustand stores, fantasy components, asset placeholders, Phase16 i18n namespaces) via the salvage commit.
- Establishes new branch as the foundation for redesigning Eureka Lab using `ai-adventure-island` as the canonical visual + behavioral source of truth.

See spec: [docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md](./docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md)

## Test plan

- [ ] `pnpm build` clean across all packages
- [ ] `pnpm exec tsc --noEmit` clean in `apps/api` and `apps/web`
- [ ] Manual smoke: app starts on `pnpm dev`, no crash on `/`
- [ ] R3F components present in `_future_r3f/` after Phase 1 (see plan)
- [ ] Welcome → Character → Dashboard flow works after Phase 2 (see plan)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Draft status. Save the URL for review tracking.

---

## Phase 1 — Foundation (R3F parking, design tokens, components, state)

### Task 1.1: Park Phase 15 R3F components to `_future_r3f/`

**Files:**
- Move: `apps/web/src/components/game/{BattlePlayer,CareerAttackEffect,CareerPicker,CharacterCustomizer,CharacterModel,CharacterPreview,CombatArena,CombatHUD,CombatScreens,DamageNumber,GameHUD,GameProvider,InventoryGrid,LearningOverlay,MissionCompleteScreen,MissionDoor,MissionRoom,MobileCombatView,PlayerCharacter,QuestionCard,WorldMap,ZombieCharacter,ZombiePortal,ZoneDecorations,ZoneInterior,ZoneIsland,ZoneNPC}.tsx` → `apps/web/src/components/_future_r3f/`
- Move: `apps/web/src/stores/game-store.ts` → `apps/web/src/stores/_future_r3f/game-store.ts`

- [ ] **Step 1: Create the parking directory**

```bash
mkdir -p apps/web/src/components/_future_r3f
mkdir -p apps/web/src/stores/_future_r3f
```

- [ ] **Step 2: Move R3F component files (use git mv to preserve history)**

```bash
cd apps/web/src/components/game
for f in BattlePlayer CareerAttackEffect CareerPicker CharacterCustomizer CharacterModel \
         CharacterPreview CombatArena CombatHUD CombatScreens DamageNumber GameHUD \
         GameProvider InventoryGrid LearningOverlay MissionCompleteScreen MissionDoor \
         MissionRoom MobileCombatView PlayerCharacter QuestionCard WorldMap \
         ZombieCharacter ZombiePortal ZoneDecorations ZoneInterior ZoneIsland ZoneNPC; do
  if [ -f "$f.tsx" ]; then git mv "$f.tsx" "../_future_r3f/$f.tsx"; fi
done
cd -
```

- [ ] **Step 3: Move R3F store**

```bash
git mv apps/web/src/stores/game-store.ts apps/web/src/stores/_future_r3f/game-store.ts
```

- [ ] **Step 4: Verify the parking moved them all**

```bash
ls apps/web/src/components/_future_r3f/ | wc -l
ls apps/web/src/components/game/ 2>&1
```

Expected: 27 files in `_future_r3f/`. `components/game/` should now contain ONLY the `fantasy/` subdir (and `CertificateScreen.tsx` if still there — keep it for now; decide in Task 1.7).

- [ ] **Step 5: Run tsc to surface broken imports**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | head -50
```

Expected: A list of "Cannot find module '@/components/game/...'" errors pointing at files that import the now-moved R3F components.

- [ ] **Step 6: Track broken imports for later cleanup**

Save the list of files with broken imports to `apps/web/scripts/r3f-import-cleanup.txt`. Examples of files likely affected:
- `apps/web/src/app/(dashboard)/learn/page.tsx` — if it references the 3D learn flow
- `apps/web/src/lib/sentry.ts` — if it imports R3F helpers
- Any test files that import the R3F components

Most of these will be deleted in Task 1.14 (feature flag cleanup) and Task 1.15 (legacy route cleanup); the import errors will resolve themselves.

- [ ] **Step 7: Commit the R3F parking**

```bash
git add -A
git commit -m "refactor: park Phase 15 R3F components to _future_r3f/

The 2D fantasy redesign supersedes the R3F-based combat for now. R3F work
is preserved for the future 3D phase per spec §11. No active route imports
from _future_r3f/ after Task 1.14 completes.
"
```

---

### Task 1.2: Write `_future_r3f/README.md`

**Files:**
- Create: `apps/web/src/components/_future_r3f/README.md`

- [ ] **Step 1: Write the README**

```markdown
# Future 3D Game Mode — Paused Components

These React Three Fiber (R3F) components were built during Phase 15 (3D zombie combat) and
were temporarily superseded by the 2D fantasy UI redesign in Plan 1.

## Why preserved, not deleted

The long-term product vision (per spec §11) is a 3D zombie-combat learning experience that
merges AI literacy with active gaming. These components are the foundation that future phase
will resume from — not greenfield code to rewrite.

## What lives here

| File | Role |
|---|---|
| `BattlePlayer.tsx` | First-person battle camera + controls |
| `CareerAttackEffect.tsx` | Visual FX for career-themed attacks |
| `CareerPicker.tsx` | 3D career selection carousel |
| `CharacterCustomizer.tsx` | Avatar customization UI |
| `CharacterModel.tsx` | Animated 3D character mesh |
| `CharacterPreview.tsx` | Lobby character preview |
| `CombatArena.tsx` | 3D battle scene root |
| `CombatHUD.tsx` | HP/MP/timer overlay |
| `CombatScreens.tsx` | Battle intro/outro screens |
| `DamageNumber.tsx` | Floating damage indicators |
| `GameHUD.tsx` | Global game UI overlay |
| `GameProvider.tsx` | R3F context provider (Three.js scene root) |
| `InventoryGrid.tsx` | Inventory grid in 3D world |
| `LearningOverlay.tsx` | Quiz overlay during 3D combat |
| `MissionCompleteScreen.tsx` | Post-mission screen |
| `MissionDoor.tsx` | Door entity in 3D world |
| `MissionRoom.tsx` | Mission interior 3D scene |
| `MobileCombatView.tsx` | Mobile-tuned combat camera |
| `PlayerCharacter.tsx` | Player avatar in 3D world |
| `QuestionCard.tsx` | 3D question prompt card |
| `WorldMap.tsx` | 3D world map overview |
| `ZombieCharacter.tsx` | Zombie enemy mesh + AI |
| `ZombiePortal.tsx` | Portal effect |
| `ZoneDecorations.tsx` | Environmental dressing |
| `ZoneInterior.tsx` | Zone-specific interior scene |
| `ZoneIsland.tsx` | Island scene |
| `ZoneNPC.tsx` | NPC entities in 3D world |

Also under `apps/web/src/stores/_future_r3f/`:
- `game-store.ts` — Zustand store for 3D world state (mission progress, position).

## Resumption path

When the 3D phase resumes (separate spec), the work begins by:

1. Choosing a route to host the 3D experience (likely `/campaign/[slug]/battle/[missionId]/3d`
   or replacing the 2D battle route entirely behind a flag).
2. Re-introducing `GameProvider` at that route only (R3F context is heavy — load lazily).
3. Wiring the 3D battle to the same backend combat API extended in Plan 4 (hybrid validation).
4. Migrating `game-store` back to `stores/` (renamed to avoid collision with future stores).

## Hard rules

- **Active 2D routes MUST NOT import from `_future_r3f/`.** If you find yourself needing
  something from here, copy it out — don't import into active code paths.
- **Do NOT delete this directory** without explicit user approval — it represents preserved
  work for a future phase.
- **Keep `three`, `@react-three/fiber`, `@react-three/drei` deps installed** in
  `apps/web/package.json`. Removing them forces a re-add when resuming the 3D phase.

## Bundle impact

`next build` should not include any of these files in the production bundle because no
active route imports them. Verify after major changes by inspecting `apps/web/.next/analyze`
output (run `ANALYZE=true pnpm --filter @eureka-lab/web build`).
```

- [ ] **Step 2: Commit the README**

```bash
git add apps/web/src/components/_future_r3f/README.md
git commit -m "docs(r3f): explain the _future_r3f parking directory and resumption path"
```

---

### Task 1.3: Delete `featureFlags.fantasyUi` from shared-types and all call sites

**Files:**
- Modify: `packages/shared-types/src/feature-flags.ts`
- Modify: any frontend file importing `DEFAULT_FEATURE_FLAGS.fantasyUi` (likely `apps/web/src/app/(dashboard)/layout.tsx` and similar)

- [ ] **Step 1: Find all call sites**

Use the Grep tool:
- Pattern: `fantasyUi`
- Output mode: `content`
- Glob: `*.ts`, `*.tsx`

Expected: References in `packages/shared-types/src/feature-flags.ts`, possibly old layouts. Record the list.

- [ ] **Step 2: Remove the flag from feature-flags.ts**

Open `packages/shared-types/src/feature-flags.ts`. Find the `FeatureFlags` interface and the `DEFAULT_FEATURE_FLAGS` constant. Remove the `fantasyUi` field from both.

- [ ] **Step 3: Update each call site**

For each file that referenced `DEFAULT_FEATURE_FLAGS.fantasyUi`:
- If the call site uses it as a conditional (e.g. `if (flags.fantasyUi)`), delete the conditional and keep only the "true" branch (since fantasy is now always on).
- If the call site forwards it to a component prop, delete the prop and inline the truthy behavior.

- [ ] **Step 4: Rebuild shared-types and re-typecheck**

```bash
pnpm --filter @eureka-lab/shared-types build
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | head -30
```

Expected: No more references to `fantasyUi`. Other errors may exist (Task 1.1 broken imports) — ignore those for now.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: drop featureFlags.fantasyUi (fantasy is the only mode now)"
```

---

### Task 1.4: Rename `phase16.types.ts` → `gameplay.types.ts` and prune UI-mode types

**Files:**
- Rename: `packages/shared-types/src/phase16.types.ts` → `packages/shared-types/src/gameplay.types.ts`
- Modify: `packages/shared-types/src/index.ts` (re-export)
- Update imports across `apps/web` and `apps/api`

- [ ] **Step 1: Rename the file**

```bash
git mv packages/shared-types/src/phase16.types.ts packages/shared-types/src/gameplay.types.ts
```

- [ ] **Step 2: Prune UI-mode types**

Open `packages/shared-types/src/gameplay.types.ts`. Delete:
- `export type UiMode = …`
- `export interface TenantUiModeLock { … }`
- Any other type whose only purpose was UI-mode switching.

Keep:
- `FantasyClass`, `FantasyCharacter`
- `Inventory`, `ShopAbility`, `ShopAbilityIcon`, `ShopWeapon`, `ShopCatalog`, `ShopItemType`
- `KpEarnEvent`
- All campaign/zone mappings (`FANTASY_CLASS_BY_CAREER`, `CAMPAIGN_SLUG_BY_ZONE`, etc.).

- [ ] **Step 3: Update the package's index.ts re-export**

In `packages/shared-types/src/index.ts`, change `export * from './phase16.types'` to `export * from './gameplay.types'`.

- [ ] **Step 4: Find import call sites**

Use the Grep tool:
- Pattern: `phase16\\.types|UiMode|TenantUiModeLock`
- Output mode: `files_with_matches`
- Glob: `**/*.{ts,tsx}`

For each match, update the import path (if any explicit `phase16.types` reference) and delete usages of `UiMode` / `TenantUiModeLock`.

- [ ] **Step 5: Rebuild shared-types**

```bash
pnpm --filter @eureka-lab/shared-types build
```

Expected: Clean build.

- [ ] **Step 6: Re-typecheck consumers**

```bash
pnpm --filter @eureka-lab/api exec tsc --noEmit
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -E "UiMode|phase16" | head -10
```

Expected: No errors mentioning `UiMode` or `phase16.types`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(types): rename phase16.types.ts → gameplay.types.ts, prune UI-mode types

UiMode and TenantUiModeLock are dead concepts post-revert (fantasy is the only mode).
Renaming reflects the durable role of these types: shared gameplay/curriculum data,
not a phase-bound experiment.
"
```

---

### Task 1.5: Port the reference's design tokens into `globals.css`

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Read the reference's index.css**

The full content lives at `C:\Eureka-lab-app\Dev\ai-adventure-island\src\index.css`. Already inspected during brainstorming. Key blocks: `@layer base` (HSL tokens, gradients, glows), `@layer utilities` (panel, rune-ring, scanlines, text-glow, bg-gradient, glow), and `@keyframes` (rune-spin, float-slow, pulse-glow, flicker, shimmer, fade-in-up).

- [ ] **Step 2: Read current `apps/web/src/app/globals.css`**

```bash
cat apps/web/src/app/globals.css
```

Record what's currently there. It likely contains Tailwind base + shadcn's HSL token set + a few custom utilities.

- [ ] **Step 3: Replace the `@layer base` HSL tokens**

In `apps/web/src/app/globals.css`, replace the existing `:root { --background: …; --foreground: …; … }` block with the reference's tokens (verbatim from `index.css` lines 9–74). Keep the `:root` selector. Also replace the `.dark { … }` block with the reference's `.dark` (which is identical to `:root` because the reference is always dark).

Critical tokens to land:
- `--background: 230 40% 5%`
- `--foreground: 190 60% 95%`
- `--primary: 188 95% 55%` (arcane cyan)
- `--secondary: 268 70% 55%` (mystic violet)
- `--accent: 42 95% 60%` (quest gold)
- `--destructive: 0 85% 60%`
- `--success: 145 70% 50%`
- `--radius: 0.85rem`
- All gradient vars (`--gradient-primary`, `--gradient-bg`, `--gradient-card`, `--gradient-rune`)
- All glow vars (`--glow-primary`, `--glow-secondary`, `--glow-gold`)
- `--shadow-elevated`, `--transition-smooth`

- [ ] **Step 4: Replace the body background and font declarations**

Add to `@layer base` (after the token block). **Font families use CSS variables** because
Next.js's `next/font` generates hashed font-family names; the literal `'Cinzel'` only
resolves if you also load it via `@import url(...)` (which we deliberately don't — Task 1.6
loads via `next/font`).

```css
@layer base {
  * { @apply border-border; }
  html, body, #root { @apply h-full; }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    background-image: var(--gradient-bg);
    background-attachment: fixed;
    font-family: var(--font-sans), 'Inter', system-ui, sans-serif;
  }
  h1, h2, h3, h4, .font-display {
    font-family: var(--font-display), 'Cinzel', serif;
    letter-spacing: 0.02em;
  }
  html[dir="rtl"] .font-display,
  html[dir="rtl"] h1,
  html[dir="rtl"] h2,
  html[dir="rtl"] h3,
  html[dir="rtl"] h4 {
    font-family: var(--font-arabic), 'Amiri', serif;
  }
}
```

- [ ] **Step 5: Add the utility layer**

Add to `apps/web/src/app/globals.css` (after the base layer):

```css
@layer utilities {
  .text-glow-primary { text-shadow: 0 0 20px hsl(var(--primary) / 0.7), 0 0 40px hsl(var(--primary) / 0.4); }
  .text-glow-gold    { text-shadow: 0 0 20px hsl(var(--accent) / 0.7),  0 0 40px hsl(var(--accent) / 0.4); }
  .text-glow-violet  { text-shadow: 0 0 20px hsl(var(--secondary) / 0.7), 0 0 40px hsl(var(--secondary) / 0.4); }

  .bg-gradient-primary   { background-image: var(--gradient-primary); }
  .bg-gradient-secondary { background-image: var(--gradient-secondary); }
  .bg-gradient-gold      { background-image: var(--gradient-gold); }
  .bg-gradient-card      { background-image: var(--gradient-card); }

  .glow-primary   { box-shadow: var(--glow-primary); }
  .glow-secondary { box-shadow: var(--glow-secondary); }
  .glow-gold      { box-shadow: var(--glow-gold); }

  .panel {
    background-image: var(--gradient-card);
    @apply backdrop-blur-xl border border-border/60 rounded-2xl;
    box-shadow: var(--shadow-elevated), inset 0 1px 0 hsl(var(--primary) / 0.1);
  }

  .rune-ring::before {
    content: '';
    position: absolute; inset: -2px;
    border-radius: inherit;
    background: var(--gradient-rune);
    z-index: -1;
    filter: blur(8px);
    opacity: 0.7;
    animation: rune-spin 12s linear infinite;
  }
  .rune-ring { position: relative; }

  .scanlines {
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      hsl(var(--primary) / 0.04) 3px,
      transparent 4px
    );
  }
}
```

- [ ] **Step 6: Add keyframes at the file end**

```css
@keyframes rune-spin { to { transform: rotate(360deg); } }
@keyframes float-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes pulse-glow {
  0%,100% { filter: drop-shadow(0 0 12px hsl(var(--primary) / 0.6)); }
  50%     { filter: drop-shadow(0 0 28px hsl(var(--primary) / 0.95)); }
}
@keyframes flicker { 0%,100% { opacity: 1; } 45% { opacity: 0.85; } 55% { opacity: 1; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 7: Verify the dev server builds**

```bash
pnpm --filter @eureka-lab/web dev
```

Open http://localhost:3010. Expected: the landing page renders but probably with default colors (no Cinzel font yet — that's Task 1.6). Browser console should be clean of CSS errors. Kill dev server (Ctrl+C).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(styles): port ai-adventure-island design tokens to globals.css

HSL token palette (cyan/violet/gold/crimson/green), gradients, glows,
panel/rune-ring/scanlines utilities, and animation keyframes. Cinzel display
font for LTR + Amiri for RTL. Body background uses radial gradient.
"
```

---

### Task 1.6: Port Tailwind config extensions + add Cinzel/Amiri fonts

**Files:**
- Modify: `apps/web/tailwind.config.ts` (or `.js`)
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Inspect current Tailwind config**

```bash
cat apps/web/tailwind.config.ts 2>/dev/null || cat apps/web/tailwind.config.js
```

- [ ] **Step 2: Merge font families**

In the Tailwind config's `theme.extend`, add or update:

```ts
fontFamily: {
  display: ['var(--font-display)', 'Cinzel', 'serif'],
  sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  arabic: ['var(--font-arabic)', 'Amiri', 'serif'],
},
```

- [ ] **Step 3: Merge keyframes**

Append to `theme.extend.keyframes` (verbatim from reference `tailwind.config.ts` lines 71–107):

```ts
"float-slow": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
"pulse-glow": {
  "0%,100%": { filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))" },
  "50%":     { filter: "drop-shadow(0 0 28px hsl(var(--primary) / 0.95))" },
},
"fade-in-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
"flicker":    { "0%,100%": { opacity: "1" }, "45%": { opacity: "0.85" }, "55%": { opacity: "1" } },
"shake": {
  "0%,100%": { transform: "translateX(0)" },
  "20%":     { transform: "translateX(-10px) rotate(-2deg)" },
  "40%":     { transform: "translateX(10px) rotate(2deg)" },
  "60%":     { transform: "translateX(-8px)" },
  "80%":     { transform: "translateX(8px)" },
},
"hit-flash": {
  "0%,100%": { filter: "brightness(1)" },
  "50%":     { filter: "brightness(2.4) hue-rotate(-20deg) drop-shadow(0 0 25px hsl(var(--destructive)))" },
},
"slash": {
  "0%":   { opacity: "0", transform: "scale(0.4) rotate(-30deg)" },
  "40%":  { opacity: "1", transform: "scale(1.1) rotate(0deg)" },
  "100%": { opacity: "0", transform: "scale(1.4) rotate(20deg)" },
},
"damage-pop": {
  "0%":   { opacity: "0", transform: "translateY(0) scale(0.6)" },
  "30%":  { opacity: "1", transform: "translateY(-30px) scale(1.2)" },
  "100%": { opacity: "0", transform: "translateY(-70px) scale(1)" },
},
"victory-burst": {
  "0%":   { opacity: "0", transform: "scale(0.5)" },
  "60%":  { opacity: "1", transform: "scale(1.1)" },
  "100%": { opacity: "1", transform: "scale(1)" },
},
```

- [ ] **Step 4: Merge animations**

Append to `theme.extend.animation`:

```ts
"float-slow":    "float-slow 5s ease-in-out infinite",
"pulse-glow":    "pulse-glow 2.5s ease-in-out infinite",
"fade-in-up":    "fade-in-up 0.6s ease-out both",
"flicker":       "flicker 4s ease-in-out infinite",
"shake":         "shake 0.45s ease-in-out",
"hit-flash":     "hit-flash 0.4s ease-out",
"slash":         "slash 0.5s ease-out forwards",
"damage-pop":    "damage-pop 0.9s ease-out forwards",
"victory-burst": "victory-burst 0.6s cubic-bezier(0.2,1.4,0.4,1) both",
```

- [ ] **Step 5: Add Cinzel + Amiri via next/font in root layout**

Edit `apps/web/src/app/layout.tsx`. Above the existing `Inter` import, add:

```ts
import { Inter, Cinzel, Amiri } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
});
```

Then update the `<body>` className to include all three font variables:

```tsx
<body className={`${inter.variable} ${cinzel.variable} ${amiri.variable} font-sans antialiased`}>
```

- [ ] **Step 6: Verify**

```bash
pnpm --filter @eureka-lab/web dev
```

Open http://localhost:3010. Open browser devtools → Elements → inspect `<html>`. Expected: `class` on body contains `--font-display`, `--font-sans`, `--font-arabic`. Headings on the page (if any) render in Cinzel.

Kill dev server.

- [ ] **Step 7: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/src/app/layout.tsx
git commit -m "feat(styles): add Cinzel + Amiri fonts, merge reference Tailwind extensions

Cinzel for LTR display headings, Amiri for RTL Arabic, Inter for body.
Adds reference keyframes (flicker, slash, damage-pop, victory-burst, etc.)
and matching utility classes. Font variables wired via next/font/google.
"
```

---

### Task 1.7: Move `components/game/fantasy/*` → `components/game/*`

**Files:**
- Move: `apps/web/src/components/game/fantasy/{Scene,Logo,GameButton,KpBadge,AiTutorChat,NavLink,HpBar}.tsx` → `apps/web/src/components/game/`

- [ ] **Step 1: Verify the salvaged components exist**

```bash
ls apps/web/src/components/game/fantasy/
```

Expected: 7 files (Scene, Logo, GameButton, KpBadge, AiTutorChat, NavLink, HpBar).

- [ ] **Step 2: Check what's at the destination**

```bash
ls apps/web/src/components/game/
```

Expected after Task 1.1: only `fantasy/` and possibly `CertificateScreen.tsx`. **Decision on CertificateScreen.tsx:** Move it to `_future_r3f/` since the new Victory page (Plan 2) will be rebuilt from scratch using fantasy components. Run:

```bash
if [ -f apps/web/src/components/game/CertificateScreen.tsx ]; then
  git mv apps/web/src/components/game/CertificateScreen.tsx \
         apps/web/src/components/_future_r3f/CertificateScreen.tsx
fi
```

- [ ] **Step 3: Move the 7 fantasy components up one level**

```bash
cd apps/web/src/components/game
for f in Scene Logo GameButton KpBadge AiTutorChat NavLink HpBar; do
  git mv fantasy/$f.tsx $f.tsx
done
rmdir fantasy
cd -
```

- [ ] **Step 4: Find imports referencing the old `/fantasy/` path**

Use the Grep tool:
- Pattern: `components/game/fantasy`
- Output mode: `files_with_matches`

- [ ] **Step 5: Update imports**

For each match, edit the file and change `@/components/game/fantasy/Foo` → `@/components/game/Foo`.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | head -30
```

Expected: No errors about `components/game/fantasy`. Other pre-existing errors are OK.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(components): hoist fantasy/* → game/* (fantasy is the only mode)

The fantasy/ subdir was a Phase 16 hedge for a dual-mode UI. Post-revert,
fantasy is the only 2D mode, so the subdir is removed. R3F's CertificateScreen
moves to _future_r3f/ to be rebuilt fresh in Plan 2.
"
```

---

### Task 1.8: Port reference data files (`game.ts`, `quiz.ts`, `academy.ts`)

**Files:**
- Create: `apps/web/src/data/game.ts`
- Create: `apps/web/src/data/quiz.ts`
- Create: `apps/web/src/data/academy.ts`

- [ ] **Step 1: Create the data directory**

```bash
mkdir -p apps/web/src/data
```

- [ ] **Step 2: Port `game.ts` verbatim**

Copy from `C:\Eureka-lab-app\Dev\ai-adventure-island\src\data\game.ts` to `apps/web/src/data/game.ts`. **Change the asset imports** from:

```ts
import warrior from "@/assets/hero-warrior.jpg";
// ... etc
```

to (Next.js convention — public folder paths):

```ts
const warrior = "/assets/game/hero-warrior.jpg";
const mage = "/assets/game/hero-mage.jpg";
const rogue = "/assets/game/hero-rogue.jpg";
const engineer = "/assets/game/hero-engineer.jpg";
const island1 = "/assets/game/island-1.jpg";
const island2 = "/assets/game/island-2.jpg";
const island3 = "/assets/game/island-3.jpg";
const island4 = "/assets/game/island-4.jpg";
```

Replace `CharacterClass` import from `@/state/GameContext` with one from local types (Task 1.10 will create `@/state/game-context.tsx` exporting it). For now define inline at the top of `game.ts`:

```ts
export type CharacterClass = "warrior" | "mage" | "rogue" | "engineer";
```

- [ ] **Step 3: Port `quiz.ts`**

The reference's `data/quiz.ts` is unknown until inspected. Read it from
`C:\Eureka-lab-app\Dev\ai-adventure-island\src\data\quiz.ts` and copy verbatim to
`apps/web/src/data/quiz.ts`. No asset imports to fix. Export shape:

```ts
export interface QuizQuestion { q: string; options: string[]; correct: number; explain: string }
export function pickQuestion(seen: Set<string>): QuizQuestion { … }
```

- [ ] **Step 4: Port `academy.ts`**

Read from `C:\Eureka-lab-app\Dev\ai-adventure-island\src\data\academy.ts`. Copy to
`apps/web/src/data/academy.ts` verbatim. Verify exports: `ENEMY_STRENGTH`,
`getKnowledgeAdvantage`, `SHOP_ABILITIES`, `SHOP_WEAPONS`, `ShopAbility`, `ShopWeapon`.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -E "data/(game|quiz|academy)" | head -10
```

Expected: No errors in the new files.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/data
git commit -m "feat(data): port ai-adventure-island game/quiz/academy data files

- game.ts: 4 character classes, 4 campaigns, ~16 missions (asset paths
  rewritten to Next.js public/ convention)
- quiz.ts: fallback AI riddle question bank for battle quiz mechanic
- academy.ts: enemy strength table, knowledge-advantage soft-buff formula,
  shop catalog (abilities + weapons)
"
```

---

### Task 1.9: Port reference assets from `ai-adventure-island/public` + `src/assets`

**Files:**
- Create: `apps/web/public/assets/game/{logo,world-map,zombie,hero-warrior,hero-mage,hero-rogue,hero-engineer,island-1,island-2,island-3,island-4}.jpg` (or `.png`)

- [ ] **Step 1: Inspect reference assets**

```bash
ls "C:\Eureka-lab-app\Dev\ai-adventure-island\src\assets" 2>&1
ls "C:\Eureka-lab-app\Dev\ai-adventure-island\public" 2>&1
```

Expected: Hero `.jpg` files, island `.jpg` files, `world-map.jpg`, `zombie.png`, `logo.png`.

- [ ] **Step 2: Copy assets to public/assets/game/**

```bash
mkdir -p apps/web/public/assets/game
cp "C:\Eureka-lab-app\Dev\ai-adventure-island\src\assets\"*.jpg apps/web/public/assets/game/
cp "C:\Eureka-lab-app\Dev\ai-adventure-island\src\assets\zombie.png" apps/web/public/assets/game/
cp "C:\Eureka-lab-app\Dev\ai-adventure-island\src\assets\logo.png" apps/web/public/assets/game/
```

- [ ] **Step 3: Verify all referenced files exist**

```bash
for f in hero-warrior.jpg hero-mage.jpg hero-rogue.jpg hero-engineer.jpg \
         island-1.jpg island-2.jpg island-3.jpg island-4.jpg \
         world-map.jpg zombie.png logo.png; do
  if [ ! -f "apps/web/public/assets/game/$f" ]; then echo "MISSING: $f"; fi
done
```

Expected: No "MISSING" output.

- [ ] **Step 4: Replace placeholder SVGs (salvaged from Phase 16) with the real JPGs**

The salvage step restored placeholder SVGs. The real JPGs supersede them. Delete the placeholders:

```bash
rm -f apps/web/public/assets/game/*.svg
rm -rf apps/web/public/assets/game/mobile  # phase 16 mobile crops, regenerable
```

- [ ] **Step 5: Update Logo.tsx to reference the new logo path**

Open `apps/web/src/components/game/Logo.tsx`. Change the `logo` import — it likely imports from `@/assets/logo.png` (reference convention). Switch to:

```tsx
const logoSrc = "/assets/game/logo.png";
// remove the `import logo from …` line
// change <img src={logo} … /> to <img src={logoSrc} … />
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/public/assets/game/ apps/web/src/components/game/Logo.tsx
git commit -m "feat(assets): import reference jpg artwork, drop phase-16 svg placeholders

Replaces Phase 16's hand-rolled SVG placeholders with the canonical jpg art
from ai-adventure-island/src/assets. Logo.tsx switched to public/-relative
path per Next.js convention.
"
```

---

### Task 1.10: Create `stores/character-store.ts` + extend `inventory-store` if needed

**Files:**
- Create: `apps/web/src/stores/character-store.ts`
- Create: `apps/web/src/stores/character-store.test.ts`
- Possibly modify: `apps/web/src/stores/inventory-store.ts` (verify `addAbility`/`addWeapon` exist)
- Possibly modify: `apps/web/src/lib/api-client.ts` (add `characterApi`)

This task lands first so the `useGame()` adapter in Task 1.11 has a complete dependency
graph (no broken imports between commits). The `Character` type lives **in this file** to
avoid a circular dependency with the future `state/game-context.tsx`.

- [ ] **Step 1: Verify inventory-store actions**

Open `apps/web/src/stores/inventory-store.ts`. Confirm the store exposes:
- `kp: number`
- `totalKpEarned: number`
- `ownedAbilityIds: string[]`
- `ownedWeaponIds: string[]`
- `equippedWeaponId: string | null`
- `addKp(amount: number): void`
- `spendKp(amount: number): void`
- `addAbility(id: string): void`
- `addWeapon(id: string): void`
- `equipWeapon(id: string | null): void`
- `hydrate(): Promise<void>` (calls backend `GET /api/v1/inventory`)

The salvaged file may have differently-named actions (e.g. `purchaseAbility` instead of
`addAbility`). If so, **rename to match the names used in the adapter (Task 1.11)** —
don't add wrapper functions. Update any other call sites in the same commit.

- [ ] **Step 2: Write the character-store test first**

Create `apps/web/src/stores/character-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  characterApi: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { useCharacterStore } from './character-store';

describe('character-store', () => {
  beforeEach(() => useCharacterStore.getState().reset());

  it('starts with null character', () => {
    expect(useCharacterStore.getState().character).toBeNull();
  });

  it('setCharacter writes to local state', async () => {
    await useCharacterStore.getState().setCharacter({
      name: 'Riven',
      class: 'warrior',
      color: '188 95% 60%',
      weaponName: 'Runeblade',
    });
    expect(useCharacterStore.getState().character?.name).toBe('Riven');
    expect(useCharacterStore.getState().character?.class).toBe('warrior');
  });

  it('reset clears the character', async () => {
    await useCharacterStore.getState().setCharacter({
      name: 'Test', class: 'mage', color: '0 0% 0%', weaponName: 'X',
    });
    useCharacterStore.getState().reset();
    expect(useCharacterStore.getState().character).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
pnpm --filter @eureka-lab/web exec vitest run src/stores/character-store.test.ts
```

Expected: FAIL — `Cannot find module './character-store'`.

- [ ] **Step 4: Implement the store**

Create `apps/web/src/stores/character-store.ts`:

```ts
'use client';

import { create } from 'zustand';
import { characterApi } from '@/lib/api-client';
import type { CharacterClass } from '@/data/game';

/** Character shape persisted server-side. Single source of truth for this type. */
export interface Character {
  name: string;
  class: CharacterClass;
  color: string;          // hsl token string, e.g. "188 95% 60%"
  weaponName: string;
}

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  /** Persist character to backend AND local state. */
  setCharacter: (c: Character) => Promise<void>;
  /** Hydrate from the backend on auth. No-op if no character exists yet. */
  hydrate: () => Promise<void>;
  /** Clear local state (e.g. on logout). */
  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  isLoading: false,

  setCharacter: async (c) => {
    set({ character: c, isLoading: true });
    try {
      await characterApi.put(c);
    } finally {
      set({ isLoading: false });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const c = await characterApi.get();
      set({ character: c });
    } catch {
      // 404 expected when user hasn't created a character yet.
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ character: null, isLoading: false }),
}));
```

- [ ] **Step 5: Add the API client method**

Open `apps/web/src/lib/api-client.ts`. If `characterApi` is not already exported, add it.
Use whatever HTTP pattern the rest of the file uses; the sketch below assumes a shared
`api` axios instance with auth interceptor.

```ts
import type { Character } from '@/stores/character-store';

export const characterApi = {
  /** GET /api/v1/users/me/character — 404 means no character yet. */
  async get(): Promise<Character> {
    const res = await api.get<Character>('/api/v1/users/me/character');
    return res.data;
  },
  /** PUT /api/v1/users/me/character — upsert. */
  async put(c: Character): Promise<void> {
    await api.put('/api/v1/users/me/character', c);
  },
};
```

- [ ] **Step 6: Re-run the test to verify it passes**

```bash
pnpm --filter @eureka-lab/web exec vitest run src/stores/character-store.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 7: Typecheck the whole project**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: No new errors. Pre-existing test-file errors acceptable.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/stores/character-store.ts \
        apps/web/src/stores/character-store.test.ts \
        apps/web/src/stores/inventory-store.ts \
        apps/web/src/lib/api-client.ts
git commit -m "feat(state): add character-store + characterApi client

Firestore-backed character (name/class/color/weaponName) with optimistic local
updates and hydrate-on-auth. Character type defined here (single source of truth)
to avoid circular dependency with the upcoming useGame() adapter.
"
```

---

### Task 1.11: Create `state/game-context.tsx` adapter

**Files:**
- Create: `apps/web/src/state/game-context.tsx`

This is the **adapter shim** that lets reference page code (which calls `useGame()`) work
against our Zustand stores. It composes `useAuthStore`, `useInventoryStore`, and
`useCharacterStore` (Task 1.10) into the surface the reference uses. The `Character` type
is imported from `stores/character-store.ts` (single source of truth, no circular dep).

- [ ] **Step 1: Create the adapter**

```tsx
'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useCharacterStore, type Character } from '@/stores/character-store';
import { useAuth } from '@/hooks/useAuth';

export type { Character };

export interface GameStateView {
  user: { username: string; email: string } | null;
  character: Character | null;
  knowledgePoints: number;
  totalKnowledgeEarned: number;
  ownedAbilities: string[];
  ownedWeapons: string[];
  equippedWeapon: string | null;
}

export interface GameStateActions {
  setCharacter: (c: Character) => void;
  addKnowledge: (amount: number) => void;
  spendKnowledge: (amount: number) => boolean;
  buyAbility: (id: string, cost: number) => boolean;
  buyWeapon: (id: string, cost: number) => boolean;
  equipWeapon: (id: string | null) => void;
  reset: () => Promise<void>;
}

/**
 * Aggregated hook matching ai-adventure-island's `useGame()` API surface, backed by
 * our Zustand stores + Firebase auth. Lets ported reference page code work unchanged.
 *
 * Server persistence is handled by the stores' own actions where applicable
 * (inventory.addKp calls the backend; character.setCharacter calls PUT /users/me/character).
 */
export function useGame(): GameStateView & GameStateActions {
  const authUser = useAuthStore((s) => s.user);
  const inv = useInventoryStore();
  const character = useCharacterStore((s) => s.character);
  const setCharacterStore = useCharacterStore((s) => s.setCharacter);
  const resetCharacter = useCharacterStore((s) => s.reset);
  const { logout } = useAuth();

  const userView = authUser
    ? { username: authUser.displayName ?? authUser.email ?? 'Hero', email: authUser.email ?? '' }
    : null;

  return {
    // ── View ─────────────────────────────────────────────
    user: userView,
    character,
    knowledgePoints: inv.kp,
    totalKnowledgeEarned: inv.totalKpEarned,
    ownedAbilities: inv.ownedAbilityIds,
    ownedWeapons: inv.ownedWeaponIds,
    equippedWeapon: inv.equippedWeaponId,

    // ── Actions ──────────────────────────────────────────
    setCharacter: (c) => { void setCharacterStore(c); },
    addKnowledge: (amount) => inv.addKp(amount),
    spendKnowledge: (amount) => {
      if (inv.kp < amount) return false;
      inv.spendKp(amount);
      return true;
    },
    buyAbility: (id, cost) => {
      if (inv.ownedAbilityIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      inv.spendKp(cost);
      inv.addAbility(id);
      return true;
    },
    buyWeapon: (id, cost) => {
      if (inv.ownedWeaponIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      inv.spendKp(cost);
      inv.addWeapon(id);
      if (inv.equippedWeaponId === null) inv.equipWeapon(id);
      return true;
    },
    equipWeapon: (id) => inv.equipWeapon(id),
    reset: async () => {
      await logout();
      resetCharacter();
    },
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: Zero new errors. All `useGame()` dependencies exist now (auth-store from salvage,
inventory-store from salvage, character-store from Task 1.10).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/state/game-context.tsx
git commit -m "feat(state): add useGame() adapter wrapping Zustand stores

Exposes the ai-adventure-island GameContext API surface so ported reference
pages can call useGame() unchanged. Composes auth-store, inventory-store,
and character-store. Re-exports Character type for convenience. Firebase auth
logout cascades through useAuth().
"
```

---

### Task 1.12: Clean up broken imports from R3F removal

**Files:** various — fix-as-found.

- [ ] **Step 1: Re-run typecheck and capture all errors**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | tee /tmp/tsc-after-r3f-park.log | head -100
```

- [ ] **Step 2: Categorize each error**

For each "Cannot find module '@/components/game/*'" error, decide:
- **Source file is a Phase 16 page** (under `(game)/` or `(mobile)/`) → already deleted by the revert, error is stale. Skip.
- **Source file is a Phase 15 page** still referenced in app routes → delete the source file too (it depended on R3F that's now paused).
- **Source file is a shared utility** (e.g. `lib/`) → comment out the R3F-specific path and add a TODO referencing the future 3D phase spec.

- [ ] **Step 3: Delete dead routes**

Likely candidates (verify each before deleting):
- `apps/web/src/app/(dashboard)/learn/[moduleId]/page.tsx` — may reference R3F lessons. **Decision:** keep but stub out — the redesign reuses it (rewired in Plan 2).
- Any `apps/web/src/app/*/battle/` or `*/combat/` routes referencing R3F — delete.

- [ ] **Step 4: Re-run typecheck**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: Zero errors in production code.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: clear broken imports left by R3F parking

After moving R3F components to _future_r3f/, stale imports surface in routes
and utilities that were targeting them. Removes dead routes and stubs
shared utilities to drop R3F dependencies.
"
```

---

### Task 1.13: Add `not-found.tsx` (global 404 in fantasy chrome)

**Files:**
- Create: `apps/web/src/app/not-found.tsx`

- [ ] **Step 1: Port the reference's NotFound page**

Read `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\NotFound.tsx`. Create
`apps/web/src/app/not-found.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';

export default function NotFound() {
  return (
    <Scene>
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center">
        <Logo className="mb-10" />
        <p className="text-xs tracking-[0.5em] text-primary/80">CONSUMED BY THE VOID</p>
        <h1 className="font-display text-6xl text-glow-primary mt-3 animate-flicker">404</h1>
        <p className="max-w-md mx-auto text-muted-foreground text-sm mt-4">
          The path you sought no longer exists. The Babble Zombies must have
          erased it from the Realm.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/">
            <GameButton variant="ghost" size="md">Return to the Awakening</GameButton>
          </Link>
          <Link href="/dashboard">
            <GameButton variant="primary" size="md">Realm Map</GameButton>
          </Link>
        </div>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 2: Delete any per-route not-found.tsx that's redundant**

```bash
find apps/web/src/app -name "not-found.tsx" -not -path "apps/web/src/app/not-found.tsx"
```

Each is route-scoped; delete those that don't add scope-specific behavior.

- [ ] **Step 3: Manually verify in dev**

```bash
pnpm --filter @eureka-lab/web dev
```

Navigate to http://localhost:3010/this-does-not-exist. Expected: Fantasy 404 page renders.
Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/not-found.tsx
git commit -m "feat(404): global not-found.tsx in fantasy chrome

Replaces any route-scoped 404s with a single global handler matching the
reference's 'Consumed by the Void' page. Includes both 'Return' (anonymous)
and 'Realm Map' (authenticated) CTAs.
"
```

---

## Phase 2 — Welcome + Character Create + Dashboard

### Task 2.1: Add bulk legacy redirects to `next.config.js`

**Files:**
- Modify: `apps/web/next.config.js`

- [ ] **Step 1: Open and inspect**

```bash
cat apps/web/next.config.js
```

Current `redirects()` (per spec snapshot) redirects only `/g/world` and `/g/zone/*`.

- [ ] **Step 2: Replace with bulk redirects**

In `redirects()`, replace the existing array with:

```js
async redirects() {
  return [
    // All Phase 16 game-mode routes collapse to the dashboard.
    { source: '/g/:path*', destination: '/dashboard', permanent: true },
    // Phase 16 mobile mirror routes also collapse to dashboard (responsive UI now).
    { source: '/m/:path*', destination: '/dashboard', permanent: true },
  ];
},
```

- [ ] **Step 3: Manually verify**

```bash
pnpm --filter @eureka-lab/web dev
```

Open http://localhost:3010/g/welcome (or any /g/* URL). Expected: redirect to `/dashboard`.
At this point `/dashboard` will 404 — that's fine, it's built in Task 2.4. Just verify the
redirect happens. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add apps/web/next.config.js
git commit -m "feat(routing): bulk redirect /g/* and /m/* → /dashboard

Phase 16's parallel game-mode universe collapses into the main app routes.
The redesign keeps a single set of canonical paths; legacy /g/*  and /m/*
URLs that may have been linked externally get a permanent redirect.
"
```

---

### Task 2.2: Replace `app/page.tsx` with the Welcome page

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Read the current landing page**

```bash
cat apps/web/src/app/page.tsx
```

(The current page is the "Learn to Build with AI" marketing landing — captured in Task 0
context. It will be fully replaced.)

- [ ] **Step 2: Port the reference Welcome**

Read `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\Welcome.tsx`. Adapt for Next.js:

- Replace `import { useNavigate } from "react-router-dom"` with
  `import { useRouter } from "next/navigation"`.
- Replace `navigate(path)` with `router.push(path)`.
- Replace `import worldBg from "@/assets/world-map.jpg"` with
  `const worldBg = "/assets/game/world-map.jpg"`.
- Replace `useGame().setUser` mock with Firebase Auth calls (Task 2.3).

Place the adapted file at `apps/web/src/app/page.tsx` with `'use client';` at the top.

The auth wiring stub in this task — Task 2.3 fills it in. For now, the submit handler can
be a TODO call:

```tsx
const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  // TODO(Task 2.3): wire Firebase Auth
  toast.error('Auth not wired yet — see Task 2.3');
};
```

- [ ] **Step 3: Handle the "already authenticated" redirect**

At the top of the component (before the JSX return), use the `useAuth` hook:

```tsx
const { isAuthenticated, isLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!isLoading && isAuthenticated) router.replace('/dashboard');
}, [isAuthenticated, isLoading, router]);

if (isLoading) return null; // or a skeleton in the Scene
```

- [ ] **Step 4: Use the Sonner toaster from reference**

Check whether `sonner` is in `apps/web/package.json` deps. If not:

```bash
pnpm --filter @eureka-lab/web add sonner
```

Make sure the toaster is mounted somewhere in the root layout (one-time setup). Add to
`apps/web/src/app/layout.tsx` body, inside `<Providers>`:

```tsx
import { Toaster as SonnerToaster } from 'sonner';
// ...
<Providers …>
  {children}
  <SonnerToaster theme="dark" position="top-center" richColors />
</Providers>
```

- [ ] **Step 5: Manually verify**

```bash
pnpm --filter @eureka-lab/web dev
```

Open http://localhost:3010/. Expected:
- Full-screen `<Scene>` with world-map background.
- Cinzel "The Awakening" headline, panel form with "Begin Quest / Return Hero" tabs.
- Form fields for hero name / email / password.
- Submitting toasts "Auth not wired yet" (the stub).

Kill dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/layout.tsx apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat(welcome): port ai-adventure-island Welcome as new landing page

Replaces 'Learn to Build with AI' marketing page with the fantasy 'Awakening'
welcome. Auth-gated: redirects authenticated users to /dashboard. Submit
handler is a stub; Firebase wiring lands in next task.
"
```

---

### Task 2.3: Wire Firebase email/password auth to Welcome form

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Verify: `apps/web/src/lib/firebase.ts` exports a usable `auth`

- [ ] **Step 1: Verify Firebase client is configured**

```bash
cat apps/web/src/lib/firebase.ts
```

Expected: `auth` exported from Firebase Auth, initialized with env config. If not, follow
the existing project pattern.

- [ ] **Step 2: Write the Welcome submit handler**

Replace the TODO stub in `apps/web/src/app/page.tsx`:

```tsx
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!auth) return toast.error('Auth is not available.');

  try {
    if (mode === 'register') {
      if (!username.trim() || !email.trim() || !password) {
        return toast.error('Fill in all the runes, hero.');
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: username.trim() });
      toast.success(`Welcome to the realm, ${username.trim()}!`);
      router.push('/character');
    } else {
      if (!email.trim() || !password) {
        return toast.error('Email and password required.');
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const displayName = email.trim().split('@')[0];
      toast.success(`Welcome back, ${displayName}.`);
      // The character-store hydrates via useEffect once auth-store fires;
      // the (learner) layout decides /character vs /dashboard.
      router.push('/dashboard');
    }
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? 'Auth failed.';
    toast.error(msg);
  }
};
```

- [ ] **Step 3: Add Google OAuth button**

Below the email form, before the closing `</div>`:

```tsx
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const handleGoogle = async () => {
  if (!auth) return toast.error('Auth is not available.');
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    toast.success(`Welcome, ${cred.user.displayName ?? 'Hero'}.`);
    router.push('/character');  // (learner) layout will bounce to /dashboard if character exists
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? 'Google sign-in failed.';
    toast.error(msg);
  }
};

// ... in the JSX below the form:
<GameButton
  type="button"
  variant="ghost"
  size="lg"
  className="w-full mt-3"
  onClick={handleGoogle}
>
  Sign in with the Google Sigil
</GameButton>
```

- [ ] **Step 4: Manual verification**

```bash
pnpm --filter @eureka-lab/web dev
```

Open http://localhost:3010/:
- Click "Begin Quest" tab → fill form → submit → should create user, route to `/character` (404 for now, OK — Task 2.5 builds it).
- Click "Return Hero" tab → log in with existing user → should route to `/dashboard` (404 OK — Task 2.7 builds it).
- Click Google button → OAuth popup opens.

Inspect Firebase console — new user should appear under Authentication.

Kill dev server.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(auth): wire Firebase email/password + Google OAuth to Welcome page

Replaces reference's mock setUser with real Firebase Auth. On register:
createUserWithEmailAndPassword + updateProfile(displayName) → /character.
On login: signInWithEmailAndPassword → /dashboard. Google button uses
signInWithPopup with GoogleAuthProvider.
"
```

---

### Task 2.4: Create `(learner)` route group + layout

**Files:**
- Create: `apps/web/src/app/(learner)/layout.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "apps/web/src/app/(learner)"
```

- [ ] **Step 2: Write the layout**

Create `apps/web/src/app/(learner)/layout.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCharacterStore } from '@/stores/character-store';
import { useInventoryStore } from '@/stores/inventory-store';

/**
 * Layout for the learner-facing routes: dashboard, character, campaign, inventory,
 * shop, victory. Single auth gate, hydrates character + inventory from the backend on
 * mount, and bounces anonymous users to / (NOT to /login — the welcome page is auth).
 *
 * Does NOT include <html>/<body> — those are in the root layout.
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hydrateCharacter = useCharacterStore((s) => s.hydrate);
  const hydrateInventory = useInventoryStore((s) => s.hydrate);
  const character = useCharacterStore((s) => s.character);
  const router = useRouter();
  const pathname = usePathname();

  // ── Hydrate game state once authenticated ────────────────
  useEffect(() => {
    if (isAuthenticated) {
      void hydrateCharacter();
      void hydrateInventory();
    }
  }, [isAuthenticated, hydrateCharacter, hydrateInventory]);

  // ── Anonymous gate ───────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  // ── Character gate: routes other than /character require a character ─
  useEffect(() => {
    if (!isLoading && isAuthenticated && character === null && pathname !== '/character') {
      router.replace('/character');
    }
  }, [character, isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) return null;  // or skeleton

  return <>{children}</>;
}
```

- [ ] **Step 3: Verify inventory-store has a `hydrate` action**

```bash
grep -n "hydrate" apps/web/src/stores/inventory-store.ts
```

If not present, add it:

```ts
hydrate: async () => {
  set({ isLoading: true });
  try {
    const inv = await inventoryApi.getMine();
    set({ ...inv, isLoading: false });
  } catch {
    set({ isLoading: false });
  }
},
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: Clean. Some pages don't exist yet (`/character`, `/dashboard`) — that's not a tsc
error, those just 404 at runtime.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(learner)/layout.tsx" apps/web/src/stores/inventory-store.ts
git commit -m "feat(learner): add (learner) route group with auth + character gate

Anonymous → /. Authenticated without character → /character. Authenticated
with character → may access any learner route. Hydrates character + inventory
from backend on mount via Zustand stores.
"
```

---

### Task 2.5: Create `/character` page (port CharacterCreate from reference)

**Files:**
- Create: `apps/web/src/app/(learner)/character/page.tsx`

- [ ] **Step 1: Port the page**

Read `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\CharacterCreate.tsx`. Adapt for
Next.js and create `apps/web/src/app/(learner)/character/page.tsx`:

Adaptations:
- `'use client';` at top.
- `import { useRouter } from 'next/navigation'` (replacing react-router-dom).
- `router.push('/dashboard')` instead of `navigate('/dashboard')`.
- `router.push('/')` instead of `navigate('/')`.
- Remove the `<Navigate to="/" replace />` guard (the `(learner)/layout.tsx` handles
  anonymous gating).
- Replace `useGame()` import path with `@/state/game-context`.
- `confirm()` is now async — call `await setCharacter(c)` which persists to backend (the
  character-store handles that internally).
- Replace `<img src={klass.image} … />` with Next.js `<Image>` — but only if you have
  `width/height` from the data file (you do).

Critical: the reference uses 5 `AURAS` while the character store stores `color` as a free
HSL string. Keep the AURAS list inline in the page; pass `aura.color` to `setCharacter`.

- [ ] **Step 2: Verify manually**

```bash
pnpm --filter @eureka-lab/web dev
```

Auth flow:
1. Open http://localhost:3010/. Sign in or register (need an existing or new account).
2. After signup, you should land on /character automatically.
3. Carousel of 4 classes should be visible. Click left/right arrows.
4. Type a hero name. Click an aura chip.
5. Click "Confirm Hero". Network tab: should see `PUT /api/v1/users/me/character`.
6. After confirm → routes to /dashboard (404 OK — Task 2.7 builds it).

Kill dev server.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(learner)/character/page.tsx"
git commit -m "feat(character): port CharacterCreate page from reference

4-class carousel (warrior/mage/rogue/engineer) with 5 aura colors. On
confirm: persists to backend via character-store (PUT /api/v1/users/me/character),
toasts success, navigates to /dashboard.
"
```

---

### Task 2.6: Verify backend character endpoints

**Files:**
- Verify: `apps/api/src/modules/users/character/character.controller.ts`
- Verify: `apps/api/src/modules/users/users.module.ts` registers the controller

This is verification (the salvage commit restored these). If the endpoints don't exist,
extend the users module to add them.

- [ ] **Step 1: List the character routes**

```bash
grep -n "@Get\|@Put\|@Post" apps/api/src/modules/users/character/*.ts 2>/dev/null
```

Expected: `@Get('me/character')` and `@Put('me/character')` handlers.

- [ ] **Step 2: If missing, add them**

If the salvage didn't include character endpoints (the spec said it SHOULD), create them.
Sketch — adapt to actual NestJS conventions:

```ts
// apps/api/src/modules/users/character/character.controller.ts
@Controller('api/v1/users/me/character')
@UseGuards(FirebaseAuthGuard)
export class CharacterController {
  constructor(private readonly svc: CharacterService) {}

  @Get()
  async get(@Req() req: AuthedRequest) {
    return this.svc.get(req.user.uid);
  }

  @Put()
  async put(@Req() req: AuthedRequest, @Body() body: PutCharacterDto) {
    return this.svc.put(req.user.uid, body);
  }
}
```

Service writes to Firestore `users/{uid}` doc, `character` subfield.

- [ ] **Step 3: Add Firestore security rules for `users/{uid}.character`**

Confirm `infrastructure/firebase/firestore.rules` allows the owner to read/write the
character subfield only. If absent, add:

```text
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

- [ ] **Step 4: Run API tests**

```bash
pnpm --filter @eureka-lab/api test
```

Expected: All tests pass. If character tests don't exist, write one:

```ts
// apps/api/src/modules/users/character/character.controller.spec.ts
describe('CharacterController', () => {
  it('GET /api/v1/users/me/character returns 404 when no character exists', async () => {
    // ... setup, request, expect 404
  });
  it('PUT then GET round-trips the character payload', async () => {
    // ... PUT, then GET, expect same shape
  });
});
```

- [ ] **Step 5: Commit (if changes were needed)**

```bash
git add apps/api/src/modules/users/character infrastructure/firebase/firestore.rules
git commit -m "feat(api): character GET/PUT endpoints with Firestore-backed storage

GET /api/v1/users/me/character returns the user's character or 404.
PUT writes name/class/color/weaponName to users/{uid}.character. Owned by
the authenticated user only (rule + service-level uid check).
"
```

---

### Task 2.7: Create `/dashboard` page (Realm Map)

**Files:**
- Create: `apps/web/src/app/(learner)/dashboard/page.tsx`
- Delete: existing `apps/web/src/app/(dashboard)/learn/page.tsx` if it's a duplicate dashboard (verify first — it's the lesson list, not the home dashboard).

- [ ] **Step 1: Read the reference Dashboard**

Source: `C:\Eureka-lab-app\Dev\ai-adventure-island\src\pages\Dashboard.tsx` (already
inspected during brainstorming).

- [ ] **Step 2: Port to Next.js**

Create `apps/web/src/app/(learner)/dashboard/page.tsx`:

Adaptations:
- `'use client';`
- `import { useRouter } from 'next/navigation';` and `import Link from 'next/link';`
- `navigate(path)` → `router.push(path)`
- `useGame().reset()` → `useGame().reset()` (already wrapped Firebase signOut)
- Replace `import worldBg from "@/assets/world-map.jpg"` → `const worldBg = "/assets/game/world-map.jpg";`
- Replace `import zombie from "@/assets/zombie.png"` → `const zombie = "/assets/game/zombie.png";`
- Replace `<img src={c.image} … />` with `<Image src={c.image} … />` from `next/image`.

The reference Navigate-on-missing-character logic is now handled by `(learner)/layout.tsx`
— remove those guards from the page body.

- [ ] **Step 3: Audit the existing app/(dashboard) route group**

```bash
ls "apps/web/src/app/(dashboard)/"
```

This contains `learn`, `achievements`, `parent`, `pricing`, `settings`, `teacher`,
`checkout` — these are the adult-facing + lesson pages. They stay (re-skinning is Plan 3),
but the implicit "(dashboard)/" `/dashboard` route doesn't exist — so there's no conflict
with the new `/dashboard` page we're building under `(learner)/`.

Verify by checking the URL `/dashboard` is unclaimed:

```bash
find "apps/web/src/app" -name "page.tsx" | xargs grep -l "export default" | grep -i dashboard
```

Expected: only our new `apps/web/src/app/(learner)/dashboard/page.tsx`. If a legacy
`/dashboard/page.tsx` exists elsewhere, delete it.

- [ ] **Step 4: Manual verification**

```bash
pnpm --filter @eureka-lab/web dev
```

Full flow:
1. Open http://localhost:3010/.
2. Register or log in.
3. Should land on `/character` if no character; create one.
4. Should land on `/dashboard`. See:
   - Top HUD: Logo, KP badge, character avatar with class title + XP bar + sign-out.
   - Hero strip: "The Four Isles of AI".
   - 4 campaign cards (2 unlocked, 2 sealed per reference data).
   - Daily Skirmish panel at bottom.
5. Click Sign-Out → return to `/`. Refresh — should stay at `/` (anonymous gate).

Kill dev server.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(learner)/dashboard/page.tsx"
git commit -m "feat(dashboard): port Realm Map dashboard from reference

Top HUD with KP, character, XP, sign-out. Hero strip + 4 campaign cards
backed by data/game.ts CAMPAIGNS. Daily Skirmish panel. Clicking a campaign
routes to /campaign/[slug] (404 until Plan 2). Sign-out cascades through
useGame().reset() (Firebase signOut + character-store reset).
"
```

---

### Task 2.8: End-to-end manual smoke test

- [ ] **Step 1: Start the API**

```bash
pnpm --filter @eureka-lab/api dev
```

Expected: NestJS server starts. Watch the log for "Application started" or similar.

- [ ] **Step 2: In a separate terminal, start the web app**

```bash
pnpm --filter @eureka-lab/web dev
```

Expected: Next.js starts on http://localhost:3010 (or whichever port).

- [ ] **Step 3: Run the smoke flow**

In a browser (Chromium / Edge, freshly logged out):

1. Open http://localhost:3010/.
   - **Expect:** Welcome page with world-map background, "The Awakening", form.
2. Click "Begin Quest", fill: Hero Name "Smoke", Email `smoke+<timestamp>@example.com`,
   Password `Test123!`. Submit.
   - **Expect:** toast "Welcome to the realm, Smoke!", redirect to `/character`.
3. On `/character`: cycle classes with arrows, pick aura "Verdant", click Confirm Hero.
   - **Expect:** toast "Smoke the [Title] is ready!", PUT request in Network tab, redirect
     to `/dashboard`.
4. On `/dashboard`:
   - **Expect:** Smoke's name + class title + aura color in the top-right panel.
   - 4 campaign cards visible.
   - KP badge shows 0 KP.
5. Click the sign-out button (LogOut icon).
   - **Expect:** redirect to `/`. Cannot navigate back to `/dashboard` (gate redirects to `/`).
6. Re-login with the same credentials via "Return Hero" tab.
   - **Expect:** redirect to `/dashboard` (character already exists).
7. Try `/g/welcome`.
   - **Expect:** 301 redirect to `/dashboard`.
8. Try `/this-route-does-not-exist`.
   - **Expect:** Fantasy 404 page.

- [ ] **Step 4: Verify console & network are clean**

In browser devtools:
- Console: no red errors. Yellow warnings acceptable.
- Network: PUT to `/api/v1/users/me/character` succeeded. GET to inventory may 404 if no
  inventory exists yet — that's OK and silenced in the store.

- [ ] **Step 5: Stop servers and commit any minor fixes**

If you fixed anything during smoke test:

```bash
git add -A
git commit -m "fix: smoke-test follow-ups for Phase 2 flow"
```

---

### Task 2.9: Update the draft PR description with Phase 2 acceptance

- [ ] **Step 1: Fetch the PR number**

```bash
gh pr view --json number,url
```

- [ ] **Step 2: Append acceptance evidence**

```bash
gh pr comment --body "$(cat <<'EOF'
## Plan 1 complete

Phase 0 (revert + salvage), Phase 1 (foundation), Phase 2 (Welcome / Character / Dashboard) are done.

**Smoke test passed:**
- Register → /character → confirm hero → /dashboard
- Sign out → / → re-login → /dashboard
- /g/* → 301 → /dashboard
- /404 → fantasy 404 page

**Next:** Plan 2 (Campaign + Mission Prep + Battle) and Plan 3 (Shop + Inventory + Victory).
EOF
)"
```

- [ ] **Step 3: Mark the PR as ready-for-review if appropriate**

If the user wants to land Plan 1 standalone before continuing:

```bash
gh pr ready
```

Otherwise leave as draft and continue to Plan 2.

---

## Plan 1 acceptance checklist

- [ ] Branch `redesign/v2-from-reference` exists with: salvage commit + revert commit + ~20 redesign commits.
- [ ] `pnpm build` and `pnpm exec tsc --noEmit` clean across the monorepo.
- [ ] `apps/web/src/components/_future_r3f/` contains 27+ R3F components with a README.
- [ ] No active route imports from `_future_r3f/` (grep verified).
- [ ] `globals.css` contains reference design tokens. Cinzel + Inter + Amiri loaded via next/font.
- [ ] `/`, `/character`, `/dashboard` render the reference design.
- [ ] Full sign-up → character → dashboard flow works.
- [ ] Sign-out returns to `/` and prevents re-entry to `/dashboard` while anonymous.
- [ ] `/g/:path*` and `/m/:path*` redirect to `/dashboard`.

---

## What Plan 2 picks up

Plan 2 builds the rest of the learner loop:
- `/campaign/[slug]` (mission list page)
- `/campaign/[slug]/prepare` (Academy hub — lessons, AI tutor)
- `/campaign/[slug]/mission/[missionId]/prep` (warmup quiz)
- `/campaign/[slug]/battle/[missionId]` (combat — split into 4 files)
- `/inventory`, `/shop`, `/victory` pages
- Re-skin of `/login`, `/signup` (already minimally usable via `/`'s form)

Plan 3+ covers: adult-facing re-skin (parent/teacher/settings/pricing), backend hybrid combat validation, i18n re-key, E2E suite rewrite.
