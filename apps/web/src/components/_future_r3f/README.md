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
| `CertificateScreen.tsx` | End-of-realm certificate (if present) |

Also under `apps/web/src/stores/_future_r3f/`:
- `game-store.ts` — Zustand store for 3D world state (mission progress, position).

## Resumption path

When the 3D phase resumes (separate spec), the work begins by:

1. Choosing a route to host the 3D experience (likely `/campaign/[slug]/battle/[missionId]/3d`
   or replacing the 2D battle route entirely behind a flag).
2. Re-introducing `GameProvider` at that route only (R3F context is heavy — load lazily).
3. Wiring the 3D battle to the same backend combat API extended in a later plan
   (hybrid client-computes / backend-validates).
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
