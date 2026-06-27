# Task Board — Eureka-Lab Platform

> **Status values:** `TODO` | `IN_PROGRESS` | `DONE`
> Single-agent (Claude Code) linear workflow.
> Last verified against codebase: 2026-03-07

---

## PHASE 1 — Monorepo & Infrastructure (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P1-001 | Initialize pnpm workspace + Turborepo | DONE | Root config, workspace definition, turbo.json |
| P1-002 | Scaffold apps/api (NestJS + Fastify) | DONE | Health endpoint at /api/v1/health, Jest test passing |
| P1-003 | Scaffold apps/web (Next.js 14 App Router) | DONE | Base app with App Router, builds successfully |
| P1-004 | Create packages/shared-types | DONE | UserRole, PlanType, ModuleStatus, FeatureFlags, etc. |
| P1-005 | Create packages/ui | DONE | Scaffold ready for shadcn/ui extensions |
| P1-006 | Create packages/ai-prompts | DONE | Safety preamble + level-specific system prompts |
| P1-007 | Prettier configuration | DONE | Shared .prettierrc at root |
| P1-008 | Verify full monorepo build | DONE | `pnpm build` — 5/5 packages built, 0 errors |

---

## PHASE 2 — Core Setup (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S1-001 | Tailwind + shadcn/ui + base theme | DONE | Tailwind v4, PostCSS, shadcn Button/Skeleton/Spinner, globals.css design tokens |
| S1-002 | next-intl: en/fr/ar + RTL support | DONE | 3 locale files, request config, RTL dir on html, Providers wrapper |
| S1-003 | PWA manifest.json | DONE | manifest.json in public/, icons placeholder |
| S1-004 | Firebase Admin SDK (backend) | DONE | FirebaseService with Firestore/Auth/Storage, global module |
| S1-005 | Pino logger service | DONE | nestjs-pino with pino-pretty dev, redacted auth headers |
| S1-006 | Global exception filter + error DTOs | DONE | AllExceptionsFilter matching api-contracts.md error format |
| S1-007 | Request validation pipe | DONE | class-validator with whitelist + transform, custom error format |
| S1-008 | Zustand + TanStack Query setup | DONE | auth-store, ui-store, QueryClient provider |
| S1-009 | Base layout (navbar, sidebar, responsive) | DONE | Navbar + Sidebar with mobile toggle, RTL support |
| S1-010 | Vitest config (frontend) | DONE | vitest.config.ts, jsdom, @testing-library/react |
| S1-011 | Jest config (backend) | DONE | jest.config.js configured, health test passing |

---

## PHASE 3 — Auth & Roles (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S2-001 | Firebase Auth middleware (JWT) | DONE | FirebaseAuthGuard verifies Bearer token, attaches AuthenticatedUser to request |
| S2-002 | Auth endpoints (signup, login, refresh) | DONE | AuthController + AuthService + DTOs, UsersRepository for Firestore CRUD |
| S2-003 | Role guard (child/parent/teacher/admin) | DONE | RolesGuard + @Roles decorator using Reflector |
| S2-004 | Parental consent + add-child flow | DONE | Age 8-16 enforcement, max 5 children per parent, auto-consent under COPPA |
| S2-005 | Firestore security rules | DONE | users/progress/moderation-logs/ai-interactions rules with deny-all default |
| S2-006 | Sign up / Login pages (frontend) | DONE | LoginForm (email + Google OAuth) + SignupForm, (auth) route group |
| S2-007 | Auth context + useAuth hook | DONE | onAuthStateChanged listener, syncs with backend via authApi.getMe |
| S2-008 | Protected route wrapper | DONE | ProtectedRoute with role enforcement, redirect to /login |
| S2-009 | Parent dashboard skeleton | DONE | Children list grid, add child button, empty state |

---

## PHASE 4 — Level 1: AI Conversation (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-001 | AI Gateway service (Claude API, abstracted) | DONE | AiGatewayService with Anthropic SDK, safety preamble injection, mock mode, prompt scoring |
| S3-002 | Content moderation (input + output filters) | DONE | ContentModerationService: harmful/adult/PII/jailbreak detection |
| S3-003 | Token budget enforcement | DONE | UsageTrackerService: daily prompt limits per plan (20/100/unlimited), Firestore tracking |
| S3-004 | Moderation logging service | DONE | ModerationLogService: persists flagged content to Firestore moderation-logs |
| S3-005 | Level 1 module API endpoints | DONE | ModulesController (GET /modules, GET /modules/:id), 8 Level 1 modules |
| S3-006 | Progress tracking service | DONE | ProgressService: activity completion, XP awards, module status, sequential unlocking |
| S3-007 | Prompt editor component | DONE | PromptEditor with textarea, optional context, streaming display, char counter |
| S3-008 | Module list + detail pages | DONE | ModuleList grid, ModuleCard, ModuleDetail with activity progression |
| S3-009 | AI response streaming (SSE) | DONE | SSE endpoint in AiController, async generator on frontend via streamPrompt() |
| S3-010 | Prompt quality score display | DONE | PromptScoreDisplay with progress bar, percentage, color-coded labels, tokens counter |

---

## PHASE 5 — Polish & Deploy (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-001 | CI/CD pipeline (GitHub Actions) | DONE | 4-stage pipeline: lint → test-api + test-web → build, pnpm caching |
| S4-002 | Environment variable documentation | DONE | docs/context/env-variables.md + .env.example for both apps |
| S4-003 | E2E tests (Playwright) | DONE | playwright.config.ts, smoke tests (page load, forms, 404, accessibility) |
| S4-004 | Error boundary components | DONE | ErrorBoundary class component, global error.tsx, custom not-found.tsx |
| S4-005 | Loading states + skeleton screens | DONE | Skeleton, Spinner components, dashboard loading.tsx |
| S4-006 | Vercel deployment config | DONE | vercel.json with monorepo build, security headers, API cache-control |
| S4-007 | Railway deployment config (backend) | DONE | Multi-stage Dockerfile, railway.json with healthcheck, .dockerignore |
| S4-008 | Sentry error monitoring | DONE | lib/sentry.ts with initSentry, captureError, setSentryUser |
| S4-009 | Performance optimization | DONE | poweredByHeader off, compress on, optimizePackageImports, image formats |
| S4-010 | Accessibility audit | DONE | VisuallyHidden component, ARIA labels throughout, form label associations |

---

## PHASE 6 — Gamification (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| GAM-001 | Badge definitions + award logic (backend) | DONE | badge-definitions.ts, BadgeService, StreakService in gamification module |
| GAM-002 | Gamification controller + endpoints | DONE | GamificationController: leaderboard, activity history, badge endpoints |
| GAM-003 | XP bar component | DONE | XpBar.tsx — animated progress bar with level display |
| GAM-004 | Streak counter component | DONE | StreakCounter.tsx — daily streak tracking |
| GAM-005 | Badge card + grid components | DONE | BadgeCard.tsx, BadgeGrid.tsx, badge-catalog.ts |
| GAM-006 | Badge unlock toast notification | DONE | BadgeUnlockToast.tsx — in-app celebration on badge earn |
| GAM-007 | Activity calendar heatmap | DONE | ActivityCalendar.tsx — GitHub-style contribution heatmap |
| GAM-008 | Level badge component | DONE | LevelBadge.tsx — per-level visual indicator |
| GAM-009 | Achievements page | DONE | /dashboard/achievements page with full badge grid + stats |
| GAM-010 | Gamification Zustand store | DONE | gamification-store.ts — client-side XP/badge/streak state |

---

## PHASE 7 — Payments & Freemium (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PAY-001 | Stripe infrastructure service | DONE | stripe.service.ts + stripe.module.ts in infrastructure layer |
| PAY-002 | Payments module (backend) | DONE | PaymentsController, PaymentsService, checkout + portal DTOs |
| PAY-003 | Pricing card component | DONE | PricingCard.tsx — plan comparison with feature list |
| PAY-004 | Subscription card + upgrade banner | DONE | SubscriptionCard.tsx, UpgradeBanner.tsx |
| PAY-005 | Pricing page | DONE | /dashboard/pricing page |
| PAY-006 | Checkout success + cancel pages | DONE | /dashboard/checkout/success and /cancel pages |

---

## PHASE 8 — Teacher / Classroom (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| B2B-001 | Classrooms backend module | DONE | ClassroomsService, ClassroomsController, create + join DTOs |
| B2B-002 | Classroom components (frontend) | DONE | ClassroomCard.tsx, CreateClassroomDialog.tsx, JoinCodeDisplay.tsx |
| B2B-003 | Student progress table | DONE | StudentProgressTable.tsx — per-student XP/module progress view |
| B2B-004 | Teacher dashboard page | DONE | /dashboard/teacher — classroom list, create classroom flow |
| B2B-005 | Classroom detail page | DONE | /dashboard/teacher/[classroomId] — student list + progress |

---

## PHASE 9 — Level 2: Workflow Automation (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| L2-001 | Workflows backend module | DONE | WorkflowsService, WorkflowsController, create + run-workflow DTOs |
| L2-002 | WorkflowBuilder component | DONE | WorkflowBuilder.tsx — visual node-based workflow editor |
| L2-003 | Workflow Zustand store | DONE | workflow-store.ts — client-side workflow state management |

---

## PHASE 10 — Level 3: Vibe Coding (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| L3-001 | Projects backend module | DONE | ProjectsService, ProjectsController, create/update/generate-code DTOs |
| L3-002 | CodeEditor component | DONE | CodeEditor.tsx — Monaco-based sandboxed code editor |
| L3-003 | Project Zustand store | DONE | project-store.ts — client-side project state management |

---

## PHASE 11 — Level 4: Buddy Agents (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| L4-001 | Agents backend module | DONE | AgentsService, AgentsController, create/update/chat-message DTOs |
| L4-002 | AgentBuilder component | DONE | AgentBuilder.tsx — visual agent persona + tool configuration |
| L4-003 | AI assistant store | DONE | ai-assistant-store.ts + agent-store.ts — client-side agent state |

---

## PHASE 12 — Notifications (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| NOT-001 | Push notification service | DONE | push.service.ts — FCM push integration |
| NOT-002 | Notification scheduler | DONE | notification-scheduler.service.ts — streak reminders, activity nudges |
| NOT-003 | Notifications controller | DONE | device registration, preference management endpoints |
| NOT-004 | usePushNotifications hook | DONE | usePushNotifications.ts — frontend permission + subscription |

---

## PHASE 13 — Mobile PWA (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| MOB-001 | Mobile route group | DONE | (mobile) route group at /m/ — separate layout for small screens |
| MOB-002 | Mobile home + learn pages | DONE | /m/, /m/learn, /m/learn/[moduleId] |
| MOB-003 | Mobile AI + progress + profile pages | DONE | /m/ai, /m/progress, /m/profile |
| MOB-004 | Mobile hooks | DONE | useMobileDetect, usePullToRefresh, useHapticFeedback, useInstallPrompt |
| MOB-005 | Offline page | DONE | /~offline — PWA offline fallback |

---

## PHASE 14 — 3D Game Shell (DONE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| GAME-001 | Game route group | DONE | (game) route group at /g/ — separate layout |
| GAME-002 | Game world + zone + mission pages | DONE | /g/, /g/world, /g/zone/[zoneId], /g/mission/[missionId] |
| GAME-003 | Character + inventory pages | DONE | /g/character, /g/inventory |
| GAME-004 | GameProvider + GameHUD components | DONE | GameProvider.tsx (context), GameHUD.tsx (in-game heads-up display) |
| GAME-005 | Game Zustand store | DONE | game-store.ts — game state (character, inventory, world progress) |
| GAME-006 | GPU detector utility | DONE | gpu-detector.ts — detects device GPU capability for 3D rendering |

---

## PHASE 15 — AI Zombie Combat System (BACKEND DONE · FRONTEND DEFERRED)

> Current branch: `feature/phase-15-3d-game`
> Full design spec: `planning/phase-15-combat-design.md`
> **PM decision 2026-04-26:** Backend complete. Frontend (Parts A, D–F) deferred — Phase 16
> replaces R3F UI with 2D cinematic fantasy. Existing R3F stubs parked in P16-FE-004.
> Revisit only if A/B data favours R3F (ADR-006, post-launch).

### Part A — World Polish (DEFERRED — superseded by Phase 16)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| GAME3D-001 | Zone environment details | DEFERRED | Superseded by Phase 16 fantasy 2D realm design |
| GAME3D-002 | Zombie spawning portal on world map | DEFERRED | Superseded by Phase 16 campaign route |
| GAME3D-003 | Battle entry flash transition | DEFERRED | Phase 16 handles battle entry in 2D |

### Part B — Shared Types (blocks all combat work)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-TYPE-001 | Add combat types to shared-types package | DONE | BattleType, ZombieType, CombatPhase, QuizQuestion, BattleConfig, COMBAT_HP_CONFIG, COMBAT_XP_REWARDS — build verified |

### Part C — Backend: Combat Module

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-BE-001 | Quiz bank (quiz-bank.ts) | DONE | 32 questions (8/zone × 4), tiers 1–2, varied correct indices 0–3, getZoneQuestions + getOverlordQuestions helpers |
| COMBAT-BE-002 | InitBattleDto + CompleteBattleDto | DONE | class-validator DTOs with enum guards and min/max on answer counts |
| COMBAT-BE-003 | CombatService | DONE | initBattle(), completeBattle() (userId guard, XP award, badge check), generateCertificate() (SVG + Firebase Storage) |
| COMBAT-BE-004 | CombatController | DONE | POST /combat/init, POST /combat/:battleId/complete, POST /combat/certificate — FirebaseAuthGuard + child role |
| COMBAT-BE-005 | CombatModule + wire into AppModule | DONE | CombatModule registered in app.module.ts |
| COMBAT-BE-006 | Certificate endpoint | DONE | Included in CombatService.generateCertificate() — SVG injection-safe, signed URL returned |
| COMBAT-BE-007 | Combat tests | DONE | 25 tests passing: quiz-bank, service (initBattle, completeBattle, generateCertificate), controller |

### Part D — Frontend: State + Routes (DEFERRED — replaced by Phase 16)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FE-001 | combat-store.ts | DEFERRED | Phase 16 builds combat-store with fantasy UI + sparkCharges (P16-FE-003) |
| COMBAT-FE-002 | /g/battle/[battleId]/page.tsx | DEFERRED | Replaced by P16-PG-007 (/g/campaign/[slug]/battle/[missionId]) |
| COMBAT-FE-003 | /g/victory/page.tsx | DEFERRED | Replaced by P16-PG-011 (re-themed victory page) |
| COMBAT-FE-004 | /m/battle/[battleId]/page.tsx | DEFERRED | Replaced by P16-MOB-001 (mobile mirror) |

### Part E — Frontend: Combat Components (DEFERRED — replaced by Phase 16 fantasy 2D)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FE-005 | ZombieCharacter.tsx | DEFERRED | R3F zombie replaced by 2D fantasy zombie in Phase 16 battle page |
| COMBAT-FE-006 | CombatArena.tsx | DEFERRED | R3F canvas replaced by 2D fantasy battle screen |
| COMBAT-FE-007 | CareerAttackEffect.tsx | DEFERRED | Replaced by fantasy-class attack effects in Phase 16 |
| COMBAT-FE-008 | CombatHUD.tsx | DEFERRED | Replaced by P16-FE-016 (HpBar) + fantasy HUD |
| COMBAT-FE-009 | QuestionCard.tsx | DEFERRED | Will be rebuilt as shared component in Phase 16 battle page |
| COMBAT-FE-010 | DamageNumber.tsx | DEFERRED | CSS damage numbers rebuilt in Phase 16 battle |
| COMBAT-FE-011 | CombatIntroScreen.tsx | DEFERRED | Replaced by fantasy battle intro in P16-PG-007 |
| COMBAT-FE-012 | CombatVictoryScreen.tsx | DEFERRED | Replaced by Phase 16 victory re-theme |
| COMBAT-FE-013 | CombatDefeatScreen.tsx | DEFERRED | Replaced by Phase 16 defeat screen |
| COMBAT-FE-014 | MobileCombatView.tsx | DEFERRED | Replaced by P16-MOB-001 mobile battle mirror |
| COMBAT-FE-015 | CertificateScreen.tsx | DEFERRED | Replaced by P16-PG-011 (re-themed certificate) |

### Part F — Game Flow Integration (DEFERRED — replaced by Phase 16 routing)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FLOW-001 | Minion trigger in mission page | DEFERRED | Phase 16 campaign route handles battle triggers |
| COMBAT-FLOW-002 | Guardian trigger in zone page | DEFERRED | Phase 16 campaign/prepare page handles guardian flow |
| COMBAT-FLOW-003 | Overlord trigger in world page | DEFERRED | Phase 16 dashboard page handles overlord flow |
| COMBAT-FLOW-004 | Zone unlock on guardian victory | DEFERRED | Phase 16 dashboard handles realm unlocking |
| COMBAT-FLOW-005 | Overlord victory → /g/victory | DEFERRED | Phase 16 victory page handles this |

---

## PHASE 16 — Gamified UI Redesign (Cinematic Fantasy)

> **Plan:** [planning/phase-16-gamified-ui-redesign.md](phase-16-gamified-ui-redesign.md)
> **Sprint plan:** [planning/sprint-p16.md](sprint-p16.md) — 4 sprints, 8 weeks estimated
> **ADRs:** ADR-002 (paradigm), ADR-003 (KP economy), ADR-004 (UI mode), ADR-005 (narrative mapping)
> **Branch:** `feature/phase-16-fantasy-ui`
> **Status:** IN PROGRESS — Sprint C DONE (2026-04-29); Sprint D in progress.
> **Sprint C progress:** 15/15 DONE.
> **Sprint D progress:** 10/13 DONE (MOB-001/002/003, AST-001/002, QA-PLAN, QA-003a, QA-003b, OPEN-005 closed 2026-06-27) · 3 READY (QA-001/004/005) · BLOCKED (QA-002 on QA-001, QA-006 on QA completion) · QA-006 OPEN-005 gate cleared.

### Part A — Foundation (Design Tokens, Flag, Shared Types)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-FND-001 | Add fantasy design tokens (CSS vars under `[data-ui-mode="game"]`) to globals.css | DONE | FE 2026-04-27 |
| P16-FND-002 | Load Cinzel display font via next/font/google in `(game)/layout.tsx` | DONE | FE 2026-04-27 |
| P16-FND-003 | Extend Tailwind config: `font-display`, fantasy keyframes, animations | DONE | FE 2026-04-27 |
| P16-FND-004 | Create `apps/web/src/styles/game-utilities.css` (panel, rune-ring, scanlines, glow utilities) | DONE | FE 2026-04-27 |
| P16-FND-005 | Add `featureFlags.fantasyUi` to packages/shared-types | DONE | ARCH 2026-04-26 — `fantasyUi: boolean` added to `FeatureFlags` + `DEFAULT_FEATURE_FLAGS` (default `true`); shared-types built |
| P16-FND-006 | Add Phase 16 shared types: `UiMode`, `FantasyClass`, mappings, `Inventory`, `ShopAbility`, `ShopWeapon` | DONE | ARCH 2026-04-26 — new file `packages/shared-types/src/phase16.types.ts`, re-exported from index; ADR-005 §2 corrected to 8-archetype mapping; API + web both lint clean |

### Part B — Backend (Inventory, KP, Settings, Tenants)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-BE-001 | New module `inventory/` — controller, service, DTOs, hardcoded shop catalog | DONE | BE 2026-04-27 — atomic buy txn, lazy init, starter items |
| P16-BE-002 | `GET /api/v1/inventory` endpoint | DONE | BE 2026-04-27 |
| P16-BE-003 | `GET /api/v1/shop/catalog` endpoint | DONE | BE 2026-04-27 |
| P16-BE-004 | `POST /api/v1/inventory/buy` (atomic Firestore transaction) | DONE | BE 2026-04-27 |
| P16-BE-005 | `POST /api/v1/inventory/equip` (weapon equip/unequip) | DONE | BE 2026-04-27 |
| P16-BE-006 | Extend `users` module: `uiMode` field + `PUT /users/me/settings` extension | DONE | BE 2026-04-27 — UsersController created |
| P16-BE-007 | New endpoints: `GET/PUT /api/v1/users/me/character` (FantasyCharacter) | DONE | BE 2026-04-27 |
| P16-BE-008 | New module `tenants/` — `uiModeLock` field + admin endpoints | DONE | BE 2026-04-27 |
| P16-BE-009 | `UiModeResolver` service — single source of truth for effective mode | DONE | BE 2026-04-27 — tenant lock > user pref > 'normal' |
| P16-BE-010 | Hook KP earning into existing progress endpoints (mode-conditional) | DONE | BE 2026-04-27 — progress + combat controllers inject KP |
| P16-BE-011 | Daily KP earn cap (sub-collection `inventories/{uid}/dailyEarn/{date}`) | DONE | BE 2026-04-27 — 100 KP/day |
| P16-BE-012 | Firestore security rules for `inventories/{userId}` and `tenants` updates | DONE | BE 2026-04-27 — rules in firestore-rules-phase16.txt |
| P16-BE-013 | Unit + integration tests for inventory module (atomicity, daily cap, mode-gating) | DONE | BE+QA 2026-04-27 — 41 tests, 257 total all passing |

### Part C — Frontend State & Foundation

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-FE-001 | New Zustand store `inventory-store.ts` (KP, owned items, equipped weapon) | DONE | FE 2026-04-27 |
| P16-FE-002 | New hook `useUiMode()` — reads effective mode, sets `<html data-ui-mode>` attr | DONE | FE 2026-04-27 |
| P16-FE-003 | Extend `combat-store.ts` with `sparkCharges` field for KP-economy mechanic | DONE | FE 2026-04-27 |
| P16-FE-004 | Park R3F components: move to `_legacy_r3f/`, update existing imports | DONE | FE 2026-04-27 — 15 R3F files moved, all imports updated |

### Part D — Fantasy UI Components (Ports from ai-adventure-island)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-FE-010 | Port `Scene` component — `components/game/fantasy/Scene.tsx` | DONE | FE 2026-04-27 |
| P16-FE-011 | Port `Logo` component — Eureka brand ("EUREKA LAB / QUEST FOR AI MASTERY") | DONE | FE 2026-04-27 |
| P16-FE-012 | Port `GameButton` (primary/gold/ghost/danger variants) | DONE | FE 2026-04-27 |
| P16-FE-013 | Port `KpBadge` — wired to `inventory-store` | DONE | FE 2026-04-27 |
| P16-FE-014 | Port `AiTutorChat` — mock mode (real AI gateway wiring Sprint C) | DONE | FE 2026-04-27 — no dangerouslySetInnerHTML, security notice added |
| P16-FE-015 | Adapt `NavLink` — Next.js `<Link>` + `usePathname` | DONE | FE 2026-04-27 |
| P16-FE-016 | Extract reusable `HpBar` component | DONE | FE 2026-04-27 — player/enemy variants, ARIA progressbar |

### Part E — Page Ports (App Router)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-PG-001 | `(game)/g/welcome/page.tsx` — Firebase auth (email + Google) | DONE | FE 2026-04-27 |
| P16-PG-002 | `(game)/g/character/page.tsx` — fantasy class carousel, saves to API | DONE | FE 2026-04-27 |
| P16-PG-003 | `(game)/g/dashboard/page.tsx` (Realm Map) — 4 isles, lock/unlock | DONE | FE 2026-04-27 |
| P16-PG-004 | `(game)/g/campaign/[slug]/page.tsx` — mission list with placeholders | DONE | FE 2026-04-27 |
| P16-PG-005 | `(game)/g/campaign/[slug]/prepare/page.tsx` (Academy hub: 4 tabs) | DONE | FE 2026-04-29, commit cf2402e |
| P16-PG-006 | `(game)/g/campaign/[slug]/mission/[missionId]/prep/page.tsx` (warm-up quiz, KP award) | DONE | FE 2026-04-29, commit cf2402e |
| P16-PG-007 | `(game)/g/campaign/[slug]/battle/[missionId]/page.tsx` — wire to Phase 15 combat API | DONE | FE 2026-04-29, commit 8817718. Split: page.tsx + battle-stage.tsx + battle-quiz.tsx + battle-outcome.tsx |
| P16-PG-008 | `(game)/g/campaign/[slug]/shop/page.tsx` (per-realm shop, zoneId filter) | DONE | FE 2026-04-29, commit af9d3ea |
| P16-PG-009 | `(game)/g/shop/page.tsx` (global Grand Bazaar) | DONE | FE 2026-04-29, commit af9d3ea |
| P16-PG-010 | `(game)/g/inventory/page.tsx` re-theme | DONE | FE 2026-04-29, commit 018a396 |
| P16-PG-011 | `(game)/g/victory/page.tsx` re-theme (keep existing certificate logic) | DONE | FE 2026-04-29, commit 018a396 |
| P16-PG-012 | `(game)/g/not-found.tsx` re-theme | DONE | FE 2026-04-29, commit 018a396 |

### Part F — Mobile Mirror (`/m/*`)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-MOB-001 | `(mobile)/m/welcome` etc — mirror all 11 game routes with `density="compact"` | DONE | FE 2026-05-06 — 3 commits: 9591ea1 (auth+core+GameBottomTabs), c450a25 (campaign+battle), 59af877 (shop+inventory). 26 mobile route files in `apps/web/src/app/(mobile)/m/`. |
| P16-MOB-002 | Mobile bottom-tab bar in game mode: Realm Map · Battle · Shop · Inventory · Profile | DONE | FE 2026-05-06, commit 9591ea1 — `apps/web/src/components/mobile/GameBottomTabs.tsx` |
| P16-MOB-003 | Asset script: generate 768×1024 mobile crops from desktop backgrounds | DONE | DEVOPS 2026-04-29 — scripts/generate-mobile-crops.sh; 5 mobile SVGs in assets/game/mobile/ |

### Part G — UI Mode Settings

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-SET-001 | Settings page: B2C UI mode toggle (Normal / Gamified) | DONE | FE 2026-04-28, commit 70461cc |
| P16-SET-002 | Tenant admin console: Default Learning Mode + lock toggle | DONE | FE 2026-04-28, commit 70461cc |
| P16-SET-003 | Hide settings toggle when tenant locked, with informational message | DONE | FE 2026-04-28, commit 70461cc |
| P16-SET-004 | Mode toggle disabled while combat in progress / AI mid-stream | DONE | FE 2026-04-28, commit 70461cc |

### Part H — Routing & Migration

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-RTE-001 | next.config redirects: `/g/world → /g/dashboard`, `/g/zone/:id → /g/campaign/:slug`, etc. | DONE | FE 2026-04-28, commit 87f2463 |
| P16-RTE-002 | (game) layout reads featureFlag and renders new vs legacy R3F | DONE | FE 2026-04-28, commit 87f2463 |
| P16-RTE-003 | Dynamic-import the `_legacy_r3f/*` chunk so it tree-shakes when flag=false | DONE | FE 2026-04-28, commit 87f2463 |

### Part I — Assets

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-AST-001 | Import 6 Lovable assets (world-map, island-1..4, zombie, hero-warrior/mage/rogue/engineer, logo) into `apps/web/public/assets/game/` | DONE | DEVOPS 2026-04-29 — 13 SVG placeholders + game-assets.ts manifest + Logo.tsx updated to .svg |
| P16-AST-002 | Generate 4 zone-specific zombie variants (start with color-tinted base zombie) | DONE | DEVOPS 2026-04-29 — scripts/generate-zombie-variants.sh; 4 zone-tinted SVGs (violet/amber/cyan/crimson) |

### Part J — QA & Rollout

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-QA-PLAN | Draft Playwright test plan (cases, fixtures, mock auth) into `apps/web/e2e/fantasy-flow.plan.md` | DONE | QA 2026-04-29 — 13 suites, 50+ test cases, mock auth + API strategy, flag matrix for QA-002 |
| P16-QA-001 | Playwright suite: fantasy-mode end-to-end (welcome → character → dashboard → campaign → battle win/lose → shop → equip → battle reuse) | READY | QA — Sprint C DONE + QA-PLAN done + MOB-001 done; all blockers cleared. No implementation yet (only smoke.spec.ts exists). |
| P16-QA-002 | Playwright matrix: same flow runs with `featureFlags.fantasyUi` true and false | BLOCKED | QA — blocked on QA-001 |
| P16-QA-003a | i18n extraction pass 1 (Sprint B+C pages already on disk) | DONE | FE+QA 2026-05-04 — 4 commits: 06aac4a, a577f83, cb1bc31, afb1896. 12 Phase16 namespaces in en/fr/ar.json. All 13 Sprint B+C pages wired. |
| P16-QA-003b | i18n extraction pass 2 (battle page strings) | DONE | QA 2026-05-06 — Phase16Battle namespace added to en/fr/ar.json, 6 files wired with useTranslations |
| P16-QA-004 | Lighthouse mobile ≥90 perf for `/m/dashboard` | READY | QA — MOB-001 now DONE; Lighthouse not yet run |
| P16-QA-005 | iOS Safari + Android Chrome smoke tests before flag enablement | READY | QA — MOB-001 now DONE; smoke not yet executed |
| P16-QA-006 | Production rollout via flag: 5% → 25% → 100% over 2 weeks | BLOCKED | DEVOPS — blocked on all Wave 1+2 done & OPEN-005 resolved |

### Part K — Open Decisions Awaiting Confirmation

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P16-OPEN-001 | Confirm career→class default mapping (ADR-005 §2) | DONE | Product owner accepted 2026-04-26 — locked in ADR-005 |
| P16-OPEN-002 | Confirm realm slugs `whispers/echoes/glitches/wraiths/void` (ADR-005 §1) | DONE | Product owner accepted 2026-04-26 — locked in ADR-005 |
| P16-OPEN-003 | Confirm "Babble" boss naming | DONE | Product owner accepted 2026-04-26 — locked in ADR-005 |
| P16-OPEN-004 | KP earn/spend tuning values (initial seed) | DONE | PM resolved 2026-04-26 — see sprint-p16.md §KP Tuning Values |
| P16-OPEN-005 | Lovable-asset license / replacement plan | DONE | PM Path C accepted 2026-06-27 — all assets are custom SVGs, no Lovable content, no encumbrance. QA-006 gate cleared. |

---

## BACKLOG — Next Priorities (Post Phase 15)

| ID | Task | Phase | Priority | Notes |
|----|------|-------|----------|-------|
| QA-001 | Expand test coverage to 80%+ for all new modules | All | HIGH | Gamification, payments, classrooms, workflows, projects, agents, combat modules |
| SEC-001 | Security audit — all new endpoints | All | HIGH | Classrooms, payments, agents, projects, combat: verify auth guards + userId filters |
| I18N-001 | Audit i18n coverage for Phases 6–15 | All | HIGH | Many components post-Sprint 4 missing fr/ar translations, including all combat UI |
| A11Y-001 | Accessibility pass on new feature pages | All | MEDIUM | Teacher, achievements, pricing, game + combat pages need keyboard nav + ARIA |
| PERF-001 | Bundle analysis + code splitting for Level 2–4 + game | 2 | MEDIUM | Monaco Editor and R3F libs are heavy — lazy load strategy needed |
| STRIPE-001 | Stripe webhook handler | 2 | HIGH | subscription.updated, payment_failed events not yet handled |
| COPPA-001 | COPPA compliance review for new data paths | 2 | HIGH | Classrooms, notifications, game + combat data — verify no child PII in AI prompts |
| DEPLOY-001 | Production environment variable setup | 2 | HIGH | Stripe keys, FCM keys, Sentry DSN — not yet confirmed in Railway/Vercel production |

---

*Last updated: 2026-06-27 (PM audit) | Phases 1–14 complete. Phase 15 backend done, frontend deferred. Phase 16 Sprints A+B+C DONE. Sprint D: 10/13 DONE (MOB + AST + QA-003a/003b + OPEN-005 closed). Remaining: QA-001/002/004/005 (QA-001/004/005 READY, QA-002 BLOCKED on QA-001). QA-006 OPEN-005 gate cleared; blocked on QA completion only.*
