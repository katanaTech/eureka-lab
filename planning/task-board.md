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

## PHASE 15 — AI Zombie Combat System (IN PROGRESS)

> Current branch: `feature/phase-15-3d-game`
> Full design spec: `planning/phase-15-combat-design.md`

### Part A — World Polish (prerequisite)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| GAME3D-001 | Zone environment details | TODO | Floating books (library), sparks (forge), code shards (citadel), orbs (academy) — drei Float + Sparkles in ZoneInterior |
| GAME3D-002 | Zombie spawning portal on world map | TODO | Pulsing ring mesh near each island to hint at combat |
| GAME3D-003 | Battle entry flash transition | TODO | Full-screen white CSS flash overlay on navigate to /g/battle |

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

### Part D — Frontend: State + Routes

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FE-001 | combat-store.ts | TODO | Zustand state machine: CombatPhase, HP tracking, question index, damage values — see design spec §11 |
| COMBAT-FE-002 | /g/battle/[battleId]/page.tsx | TODO | Desktop route: fetches config, renders CombatArena; detects mobile → redirects to /m/battle |
| COMBAT-FE-003 | /g/victory/page.tsx | TODO | Certificate screen — Stars R3F bg + HTML certificate overlay, html2canvas download |
| COMBAT-FE-004 | /m/battle/[battleId]/page.tsx | TODO | Mobile route: renders MobileCombatView (2D CSS fallback) |

### Part E — Frontend: Combat Components

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FE-005 | ZombieCharacter.tsx | TODO | 5 zombie types built from R3F primitives + meshToonMaterial; useFrame animations: idle bob, attack lunge, stagger, death squash — see design spec §5–6 |
| COMBAT-FE-006 | CombatArena.tsx | TODO | R3F canvas: player left, zombie right; zone-coloured lighting; phase changes dispatched to combat-store |
| COMBAT-FE-007 | CareerAttackEffect.tsx | TODO | Career-specific projectile per archetype (letters/brackets/paint/mini-bot) via drei Sparkles or sphere meshes |
| COMBAT-FE-008 | CombatHUD.tsx | TODO | HP bars (player + zombie), phase label, turn indicator — pure HTML overlay on canvas |
| COMBAT-FE-009 | QuestionCard.tsx | TODO | Question text, 4 option buttons (A/B/C/D), 15-sec countdown timer, correct/wrong feedback — shared between 3D and mobile |
| COMBAT-FE-010 | DamageNumber.tsx | TODO | Floating "+{n}" / "-{n}" that rises and fades via CSS keyframes; positioned over player or zombie |
| COMBAT-FE-011 | CombatIntroScreen.tsx | TODO | Zombie slides in, dialogue bubble, name reveal, "FIGHT!" button |
| COMBAT-FE-012 | CombatVictoryScreen.tsx | TODO | Win animation, XP counter, badges earned, "Continue" button |
| COMBAT-FE-013 | CombatDefeatScreen.tsx | TODO | Lose animation, encouragement message, "Try Again" → restart same battle |
| COMBAT-FE-014 | MobileCombatView.tsx | TODO | 2D CSS: zone-emoji zombie, career-emoji player, CSS-animated attacks, HP bars, reuses QuestionCard |
| COMBAT-FE-015 | CertificateScreen.tsx | TODO | Child's name, date, "AI Literacy Champion", 4 zone badge icons, Download + Share (Web Share API) |

### Part F — Game Flow Integration

| ID | Task | Status | Notes |
|----|------|--------|-------|
| COMBAT-FLOW-001 | Minion trigger in mission/[missionId]/page.tsx | TODO | After MissionCompleteScreen dismiss → POST /combat/init { battleType:'minion' } → /g/battle/[id] |
| COMBAT-FLOW-002 | Guardian trigger in zone/[zoneId]/page.tsx | TODO | All zone missions done after minion victory → POST /combat/init { battleType:'guardian' } → /g/battle/[id] |
| COMBAT-FLOW-003 | Overlord trigger in world/page.tsx | TODO | All 4 guardians defeated → Overlord banner → POST /combat/init { battleType:'overlord' } → /g/battle/[id] |
| COMBAT-FLOW-004 | Zone unlock on guardian victory | TODO | Guardian victory → next island unlocked in game-store + world page re-renders |
| COMBAT-FLOW-005 | Overlord victory → /g/victory | TODO | Navigate to certificate screen, pass childName from auth store |

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

*Last updated: 2026-03-07 | Phases 1–14 complete. Phase 15 (AI Zombie Combat) in progress — 26 tasks across 6 parts.*
