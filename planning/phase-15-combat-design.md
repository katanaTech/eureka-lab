# Phase 15 — AI Zombie Combat System: Design Specification

> **Status:** Planning complete — ready to implement
> **Last updated:** 2026-03-07
> **Branch:** `feature/phase-15-3d-game`

---

## 1. Concept Summary

Between every learning step and between every island, the player faces **Anti-AI Zombies** — cartoon
toon-style enemies that want to stop children from learning AI. Defeat them using AI knowledge to
unlock the next mission or island. The further the player progresses, the harder the zombies get.
Defeating the final Anti-AI Overlord earns a personalised achievement certificate.

This is a **gate model**: every zombie must be defeated to proceed. Retry is unlimited with no
progress penalty — learning data is never lost.

---

## 2. Narrative

> "The Anti-AI Zombies have invaded the knowledge archipelago. They fear a world where children
> build with AI instead of just consuming it. Each island is guarded by a Zombie Guardian. Your
> weapon: AI knowledge. Your mission: defeat every zombie, claim every island, and face the
> Anti-AI Overlord."

---

## 3. Combat Architecture

### Q4 Answer: New Route (Recommended & Decided)

**Combat lives at `/g/battle/[battleId]`** — a dedicated route, not an overlay.

**Why:**
- Only one R3F canvas active at a time (performance, no canvas-on-canvas layering)
- Clean state machine — battle is self-contained, fully route-driven
- Consistent with existing pattern: world → zone → mission → battle (all separate routes)
- Deep-linkable; parent can see "kid is in a battle"
- Back button = clear "forfeit" semantic (same as mission back button)

### Route Map

```
/g/world               World map (4 zone islands)
/g/zone/[zoneId]       Zone interior (mission portals)
/g/mission/[missionId] Learning content room
  └─ on complete ──→   /g/battle/[battleId]?type=minion   ← NEW
/g/zone/[zoneId]       (all missions done)
  └─ on complete ──→   /g/battle/[battleId]?type=guardian  ← NEW
/g/world               (all 4 zones done)
  └─ trigger ──────→   /g/battle/overlord?type=overlord    ← NEW
/g/victory             Certificate screen                   ← NEW
```

---

## 4. Battle Types

| Type | Trigger | Zombie HP | Player HP | Questions | Duration |
|------|---------|-----------|-----------|-----------|----------|
| **Minion** | After each learning module completes | 30 | 100 (carries between minions) | 5 | ~45 sec |
| **Guardian** | After ALL modules in a zone complete | 80 | Reset to 100 | 10 | ~2 min |
| **Overlord** | After ALL 4 zones complete | 200 (4 phases × 50) | Reset to 100 | 20 (5 per zone) | ~5 min |

### Player HP Carryover Rule (Minions Only)

Within a zone session, player HP carries between minion battles. This rewards consistent correct
answers. Zone entry resets to 100. If HP drops to 0 mid-zone: defeat screen + retry that battle
only. HP is restored to 50 on retry (not full, to keep tension).

---

## 5. Zombie Roster

| Zone | Zombie Name | Visual Theme | Color Palette | Attack Name | Dialogue |
|------|------------|--------------|---------------|-------------|---------|
| Library (L1) | **Misinformation Mole** | Goggle-eyed, holds fake scrolls | Indigo-dark, red eyes | "Fake News Blast" | "Your prompts are WORTHLESS!" |
| Forge (L2) | **Lazy Bot** | Rusty sagging robot | Amber-dark, flickering panel | "Glitch Wave" | "Automation is DANGEROUS!" |
| Citadel (L3) | **Bug Monster** | Glitchy pixelated blob, jitters | Emerald-dark, static flicker | "Code Crash" | "All code leads to CHAOS!" |
| Academy (L4) | **Memory Eraser** | Ghost with eraser-shaped arms | Violet-dark, transparent body | "Mind Wipe" | "Agents will DESTROY you!" |
| **Final Boss** | **Anti-AI Overlord** | Giant, 4 heads (one per zombie type) | All 4 zone colors, glowing | "Reality Distortion Field" | "NO CHILD SHALL LEARN AI!" |

### Zombie Visual Construction (R3F Primitives — No GLTF Required for MVP)

All zombies use `meshToonMaterial` consistent with the existing game. Built from the same primitive
approach as `PlayerCharacter.tsx` (sphere head, capsule body, etc.) with zone-specific colours and
animated via `useFrame`.

**Later upgrade path:** Replace primitive meshes with GLTF models from Meshy.ai + Mixamo animations
by swapping the component internals — no other code changes needed.

#### Misinformation Mole (Library)
- Head: sphere, dark green-gray, glowing red emissive eyes (two small spheres)
- Body: capsule, hunched (rotated forward on X axis)
- Arms: elongated boxes, holding floating fake-scroll meshes
- Idle: slow sway side to side + red eye pulse

#### Lazy Bot (Forge)
- Head: box, dented (ScaleX > ScaleZ), flickering amber panel face
- Body: barrel (cylinder, wide)
- Arms: dangling boxes, hanging loose
- Idle: random micro-jitter (suggests broken machinery)

#### Bug Monster (Citadel)
- Head: irregular bumpy sphere (noise-displaced, simulated with octahedron)
- Body: blob (merged spheres at different offsets)
- Colour flicker: emissiveIntensity oscillates rapidly (glitch effect)
- Idle: random frame-skip jitter on position.x (simulates rendering glitch)

#### Memory Eraser (Academy)
- Head: sphere, near-transparent (opacity 0.6, violet)
- Arms: two elongated box shapes (eraser form), pink tips
- Body: tapered cylinder, ghostly
- Idle: slow drift upward and back (ghostly float), opacity pulses

#### Anti-AI Overlord
- Large central body with 4 smaller "satellite heads" orbiting around it
- Each satellite = one of the 4 zombie heads above, smaller scale
- Central body: large sphere with all 4 zone colours mixed (gradient via vertex colours)
- Scale: 2× any other zombie
- Idle: slow rotation of satellite heads around central body

---

## 6. Combat Animations (useFrame — No External Dep)

| State | Player Animation | Zombie Animation |
|-------|-----------------|-----------------|
| Intro | Idle bob | Slides in from X+5, settles to position |
| Player turn | Slight forward lean (position.z -0.1) | Idle |
| Player attack (correct) | Arm lunge (position.z +0.3, then back) | Stagger backward (position.x +0.2, then back), red flash |
| Zombie attack (wrong) | Stagger back (position.z -0.3), red flash | Lunge forward (position.x -0.2, then back) |
| Victory | Jump (position.y spike) + spin | Fall: scale.y → 0, position.y → -2 |
| Defeat | Slump (position.y -0.3) | Victory flex (scale pulse) |

All animations run for ~600ms then settle. `phase` state in `combat-store.ts` gates transitions.

---

## 7. Combat Turn Flow (Turn-Based)

```
Phase: 'intro'
  Zombie entrance animation (1.5 sec)
  Dialogue bubble with zombie quote
  "FIGHT!" button appears

  → User presses FIGHT → phase: 'player_turn'

Phase: 'player_turn'
  QuestionCard renders (question + 4 options + 15-sec countdown timer)
  Timer ticks down. On timeout → treat as wrong answer.

  → Correct answer → phase: 'player_attack'
  → Wrong / timeout → phase: 'zombie_attack'

Phase: 'player_attack'
  Damage = baseDamage × speedMultiplier (faster answer = more damage)
  Player attack animation plays (600ms)
  Floating damage number over zombie: "+{damage}"
  zombieHp -= damage

  → zombieHp <= 0 → phase: 'victory'
  → else → phase: 'player_turn' (next question)

Phase: 'zombie_attack'
  Zombie attack animation plays (600ms)
  Floating damage number over player: "-{damage}"
  playerHp -= damage

  → playerHp <= 0 → phase: 'defeat'
  → else → phase: 'player_turn' (next question, same or next)

Phase: 'victory'
  Player celebrate animation
  XP awarded + badge check
  "Continue" → back to zone (next mission unlocked) OR world (next island unlocked)

Phase: 'defeat'
  Player slump animation
  "Try Again" → restart same battle (questions reshuffled, zombie HP reset, player HP: 50)
```

### Damage Formula

```
speedMultiplier = timeRemaining >= 10 ? 1.5 : timeRemaining >= 5 ? 1.0 : 0.75

playerDamageToZombie:
  minion:   Math.round(10 × speedMultiplier)   → range 8–15
  guardian: Math.round(9  × speedMultiplier)   → range 7–14
  overlord: Math.round(8  × speedMultiplier)   → range 6–12

zombieDamageToPlayer:
  minion:   20
  guardian: 15
  overlord: 12
```

### Overlord Multi-Phase

Every 50 HP lost = phase change. Each phase uses questions from one zone:
- Phase 1 (200–150 HP): Library questions
- Phase 2 (150–100 HP): Forge questions
- Phase 3 (100–50 HP): Citadel questions
- Phase 4 (50–0 HP): Academy questions

Visual: one satellite head "breaks off" and explodes at each phase transition.

---

## 8. Quiz Question Bank

**Format:** 4-option multiple choice. One correct answer. Timer: 15 seconds.

### Zone 1 — Library of Prompts (Prompt Engineering)

| # | Difficulty | Question | Options | Correct |
|---|-----------|---------|---------|---------|
| 1 | Minion | What makes a prompt give better answers? | Being vague / Adding context and examples / Using only emojis / Keeping it to one word | B |
| 2 | Minion | What is a "system prompt"? | A startup error / Instructions that guide AI behaviour / The Wi-Fi password / A list of bugs | B |
| 3 | Minion | If AI gives a wrong answer, what should you try first? | Give up / Refresh the page / Add more context to your prompt / Shout at the computer | C |
| 4 | Minion | Which prompt gets the best recipe? | "Food" / "Recipe please" / "Simple pasta recipe for 2 people, vegetarian" / "Make food now" | C |
| 5 | Minion | What does giving AI an example output help with? | Nothing / Showing the format and style you want / Making AI angry / Using fewer tokens | B |
| 6 | Guardian | What does "temperature" control in an AI model? | Server heat / How creative or random the response is / Font size / Connection speed | B |
| 7 | Guardian | What is "prompt injection"? | A vaccine / Tricking AI with hidden instructions / Adding images to a prompt / Sending emails | B |
| 8 | Guardian | Why should you give AI a role? ("You are a science teacher...") | It wastes tokens / It helps AI respond in the right style and expertise / It confuses AI / It is mandatory | B |

### Zone 2 — Automation Forge (Workflow Automation)

| # | Difficulty | Question | Options | Correct |
|---|-----------|---------|---------|---------|
| 1 | Minion | What is a "trigger" in a workflow? | A gun part / The event that starts a workflow / A stop command / A button type | B |
| 2 | Minion | Which tool is famous for connecting apps automatically? | Microsoft Word / Zapier / Paint / Calculator | B |
| 3 | Minion | What does "if-then" logic do in a workflow? | Makes text bold / Runs different actions based on a condition / Deletes files / Plays music | B |
| 4 | Minion | What is "automation"? | Driving a car / Making tasks run by themselves / A robot dance / A school subject | B |
| 5 | Minion | What is an API? | A type of food / A way for software to talk to other software / An error message / A computer brand | B |
| 6 | Guardian | What happens when a workflow has a "loop"? | It crashes / It repeats an action multiple times / It plays music / It searches Google | B |
| 7 | Guardian | Why is testing a workflow important? | It is not important / To catch mistakes before they cause real problems / To slow it down / To add more steps | B |
| 8 | Guardian | What is a "webhook"? | A fishing technique / A real-time notification sent from one app to another / A website hook / A code error | B |

### Zone 3 — Code Citadel (Vibe Coding)

| # | Difficulty | Question | Options | Correct |
|---|-----------|---------|---------|---------|
| 1 | Minion | What is a "function" in code? | A math subject / A reusable block of code that does one job / A keyboard type / A website | B |
| 2 | Minion | What is a "bug" in programming? | A real insect / An error in the code / A feature request / Slow internet | B |
| 3 | Minion | What does "variable" mean in code? | A type of weather / A named box that stores a value / A coding language / A computer mouse | B |
| 4 | Minion | What language is used to style websites? | Python / CSS / SQL / Java | B |
| 5 | Minion | What does AI-assisted coding help with? | Nothing / Writing code faster and explaining errors / Designing logos / Sending emails | B |
| 6 | Guardian | What is a "loop" in code? | A circular shape / Instructions that repeat multiple times / A type of error / A musical note | B |
| 7 | Guardian | What does "debugging" mean? | Adding bugs / Finding and fixing errors in code / Writing new code / Deleting files | B |
| 8 | Guardian | What is an "array"? | A weapon / A list of values stored together / A design tool / A website menu | B |

### Zone 4 — Agent Academy (Buddy Agents)

| # | Difficulty | Question | Options | Correct |
|---|-----------|---------|---------|---------|
| 1 | Minion | What is an "AI agent"? | A human assistant / An AI that can plan and take actions toward a goal / A chatbot that only answers / A search engine | B |
| 2 | Minion | What is "memory" in an AI agent? | Computer RAM / Information the agent stores for future use / A backup file / A type of prompt | B |
| 3 | Minion | What does "tool use" mean for an AI agent? | Using a hammer / Connecting the agent to external systems like search or files / Writing code / Drawing | B |
| 4 | Minion | What is "persona" in an AI agent? | A superhero name / The character, tone and identity the agent adopts / A computer setting / A bug type | B |
| 5 | Minion | Why do agents need "goals"? | They do not need goals / Goals guide what the agent tries to accomplish / Goals make agents slower / Goals are decoration | B |
| 6 | Guardian | What is a "multi-agent system"? | One very smart AI / Multiple AI agents working together on different parts of a task / A broken agent / A human team | B |
| 7 | Guardian | What does "context window" limit? | Screen brightness / How much information the agent can consider at once / The language used / Connection speed | B |
| 8 | Guardian | What makes an AI agent different from a simple chatbot? | Nothing / Agents can plan, use tools, and complete multi-step tasks / Agents cannot talk / Chatbots are always better | B |

> **Note on answer variety:** When writing the actual `quiz-bank.ts` code, rotate correct index
> across A/B/C/D. The planning doc uses B for clarity; the implementation should vary this.

---

## 9. Career Archetype Attack Skins

Each career archetype has a visual skin on the player attack animation:

| Career | Attack Visual (useFrame) |
|--------|-------------------------|
| Prompt Poet | Glowing text letters shoot from player toward zombie |
| Code Wizard | Green code brackets fly as projectiles |
| Data Artist | Coloured paint splash arc |
| Robot Builder | Small sphere "mini-bot" rolls across arena and punches zombie |

Implemented as a particle burst from player position toward zombie position using `drei/Sparkles`
or basic sphere meshes with velocity via `useFrame`. Keyed off `careerArchetype` from `game-store`.

---

## 10. Backend: Combat Module

### New Endpoints

```
POST /api/v1/combat/init
  Auth: required (child role)
  Body: InitBattleDto { missionId?, zoneId, battleType: BattleType }
  Returns: BattleConfig { battleId, zombieType, zombieName, zombieDialogue,
                          playerMaxHp, zombieMaxHp, questions: QuizQuestion[] }
  Side effect: creates battle record in Firestore (combat-sessions/{battleId})

POST /api/v1/combat/:battleId/complete
  Auth: required (child role)
  Body: CompleteBattleDto { outcome: 'victory' | 'defeat', correctAnswers, totalQuestions }
  Returns: { xpAwarded, badgesUnlocked: BadgeType[], nextUnlockedMissionId? }
  Side effect: awards XP via ProgressService, checks badges via BadgeService,
               marks battle complete in Firestore
```

### Firestore Schema (new collection)

```
combat-sessions/{battleId}
  userId: string
  zoneId: ZoneId
  battleType: BattleType
  zombieType: ZombieType
  outcome: 'victory' | 'defeat' | 'in_progress'
  correctAnswers: number
  totalQuestions: number
  startedAt: Timestamp
  completedAt: Timestamp | null
  xpAwarded: number
```

### File Structure

```
apps/api/src/modules/combat/
  combat.module.ts
  combat.controller.ts
  combat.service.ts
  quiz-bank.ts              ← 32 questions (8 per zone × 4 zones)
  dto/
    init-battle.dto.ts
    complete-battle.dto.ts
  combat.controller.spec.ts
  combat.service.spec.ts
```

---

## 11. Frontend: Combat Components

### File Structure

```
apps/web/src/
  app/(game)/
    g/
      battle/
        [battleId]/
          page.tsx          ← Fetches battle config, renders CombatArena
      victory/
        page.tsx            ← Certificate screen (final boss only)
  components/game/combat/
    CombatArena.tsx         ← R3F canvas: player + zombie facing each other
    ZombieCharacter.tsx     ← 4 zombie types as primitive toon meshes
    CombatHUD.tsx           ← HP bars (player + zombie), phase label
    QuestionCard.tsx        ← Question text, 4 option buttons, countdown timer
    DamageNumber.tsx        ← Floating "+15" / "-20" with rise+fade animation
    CombatIntroScreen.tsx   ← Zombie entrance, dialogue bubble, FIGHT button
    CombatVictoryScreen.tsx ← Win state: XP earned, badges, continue button
    CombatDefeatScreen.tsx  ← Lose state: encouragement, retry button
    CareerAttackEffect.tsx  ← Career-specific projectile from player to zombie
    CertificateScreen.tsx   ← Overlord victory certificate with child's name
  stores/
    combat-store.ts         ← Zustand state machine for battle
  app/(mobile)/
    m/
      battle/
        [battleId]/
          page.tsx          ← 2D mobile fallback
  components/mobile/
    MobileCombatView.tsx    ← 2D sprite CSS-animated battle (reuses QuestionCard)
```

### combat-store.ts State Shape

```typescript
type CombatPhase =
  | 'idle'           // no battle active
  | 'intro'          // zombie entrance animation
  | 'player_turn'    // question shown, awaiting answer
  | 'player_attack'  // correct answer → player attack animation
  | 'zombie_attack'  // wrong/timeout → zombie attack animation
  | 'victory'
  | 'defeat';

interface CombatState {
  battleId: string | null;
  battleType: BattleType;
  zombieType: ZombieType;
  zombieName: string;
  zombieDialogue: string;
  phase: CombatPhase;
  playerHp: number;
  playerMaxHp: number;
  zombieHp: number;
  zombieMaxHp: number;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  lastAnswerCorrect: boolean | null;
  lastDamageDealt: number;
  lastDamageTaken: number;
  // actions
  loadBattle: (config: BattleConfig) => void;
  startFight: () => void;               // intro → player_turn
  submitAnswer: (index: number, timeRemaining: number) => void;
  advanceAfterAnimation: () => void;    // called after animation completes
  retryBattle: () => void;
  resetCombat: () => void;
}
```

---

## 12. New Shared Types Required

Add to `packages/shared-types/src/game.types.ts`:

```typescript
export type BattleType = 'minion' | 'guardian' | 'overlord';

export type ZombieType =
  | 'misinformation_mole'
  | 'lazy_bot'
  | 'bug_monster'
  | 'memory_eraser'
  | 'overlord';

export type CombatPhase =
  | 'idle' | 'intro' | 'player_turn'
  | 'player_attack' | 'zombie_attack'
  | 'victory' | 'defeat';

export interface QuizQuestion {
  id: string;
  zoneId: ZoneId;
  text: string;
  options: [string, string, string, string]; // exactly 4
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficultyTier: 1 | 2 | 3; // 1=minion, 2=guardian, 3=overlord
}

export interface BattleConfig {
  battleId: string;
  battleType: BattleType;
  zombieType: ZombieType;
  zombieName: string;
  zombieDialogue: string;
  playerMaxHp: number;
  zombieMaxHp: number;
  questions: QuizQuestion[];
}
```

---

## 13. Game Flow Integration (Trigger Points)

### Trigger 1: After Mission Complete (Minion)

`apps/web/src/app/(game)/g/mission/[missionId]/page.tsx`
- `handleMissionComplete` currently calls `completeMission` then shows `MissionCompleteScreen`
- **Change:** After `MissionCompleteScreen` dismiss → `POST /combat/init` → navigate to
  `/g/battle/{battleId}?returnTo=/g/zone/{zoneId}`

### Trigger 2: Guardian (All Zone Missions Done)

`apps/web/src/app/(game)/g/zone/[zoneId]/page.tsx`
- After battle victory for the last minion in a zone → detect all missions complete
- Auto-trigger: `POST /combat/init { battleType: 'guardian', zoneId }` → navigate to battle
- On guardian victory → unlock next island

### Trigger 3: Overlord (All 4 Zones Done)

`apps/web/src/app/(game)/g/world/page.tsx`
- Detect when all 4 zones have completed guardian battles
- Show "ALL ISLANDS CLAIMED — Face the Anti-AI Overlord" banner
- Button → `POST /combat/init { battleType: 'overlord' }` → navigate to battle
- On overlord victory → `/g/victory` (certificate)

---

## 14. Certificate Screen (Final Victory)

**Route:** `/g/victory`

**Visual:**
- Dark starfield background (reuse `<Stars>` from R3F)
- HTML overlay with certificate panel
- Shows: child's name, date, "AI Literacy Champion" title, 4 zone badges earned
- "Download Certificate" button → PNG export via `html2canvas`
- "Share" button → Web Share API (mobile)

**Backend:**
- `POST /api/v1/combat/certificate` → generates SVG, uploads to Firebase Storage
- Returns signed URL, valid 24 hours

---

## 15. Mobile 2D Fallback

**Route:** `/m/battle/[battleId]`

**Design:**
- Full CSS, no R3F canvas
- Zombie = static SVG/emoji illustration (zone-themed)
- Player = career emoji
- HP bars: styled divs with CSS transitions
- Attack effect: CSS `@keyframes` shake + flash
- `QuestionCard` component is fully reused from 3D version (it is pure HTML)
- Layout: vertical stack (zombie top, question bottom)

---

## 16. Environment Polish (Complement to Combat)

Minor additions to make the existing 3D world feel richer before combat launches:

| Item | Where | Implementation |
|------|-------|----------------|
| Floating books | ZoneInterior (library) | 3–5 small box meshes with `<Float>` from drei |
| Forge sparks | ZoneInterior (forge) | `<Sparkles>` from drei, amber colour |
| Code symbols | ZoneInterior (citadel) | Floating `<Html>` text shards with `<Float>` |
| Floating orbs | ZoneInterior (academy) | Already partially done in MissionRoom, bring to zone |
| Zombie spawning portal | World map | Ring portal mesh near each island (pulsing) |
| Battle entry flash | Route transition | Full-screen white flash CSS overlay on navigate to battle |

---

## 17. Open Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Turn-based vs real-time | Turn-based |
| Question source | Pre-written quiz bank (Option A) |
| Art style | Cartoon/toon (meshToonMaterial) |
| Combat location | New route `/g/battle/[battleId]` |
| Gate model | All zombie types gate progression |
| Final victory reward | Named certificate |
| Mobile | 2D CSS sprite fallback at `/m/battle/[battleId]` |

---

*Phase 15 combat design — v1.0 — 2026-03-07*
