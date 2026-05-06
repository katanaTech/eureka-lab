# Implementation Plan — Eureka-Lab Platform

> This is the living implementation plan. Update it as phases complete.
> For task-level detail, see `planning/task-board.md`.

---

## Overall Progress

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Monorepo & Infrastructure | DONE |
| 2 | Core Setup (Tailwind, i18n, PWA, Firebase, Logger) | DONE |
| 3 | Auth & Roles | DONE |
| 4 | Level 1: AI Conversation | DONE |
| 5 | Polish & Deploy (CI/CD, Sentry, Playwright, Vercel/Railway) | DONE |
| 6 | Gamification (XP, badges, streaks, achievements) | DONE |
| 7 | Payments & Freemium (Stripe integration) | DONE |
| 8 | Teacher / Classroom (B2B) | DONE |
| 9 | Level 2: Workflow Automation | DONE |
| 10 | Level 3: Vibe Coding (Monaco Editor) | DONE |
| 11 | Level 4: Buddy Agents | DONE |
| 12 | Notifications (push + scheduler) | DONE |
| 13 | Mobile PWA (dedicated /m/ routes + hooks) | DONE |
| 14 | 3D Game Shell (routes, store, GPU detection) | DONE |
| 15 | AI Zombie Combat (backend done; R3F frontend deferred → Phase 16) | BACKEND DONE |
| 16 | Gamified UI Redesign — Cinematic Fantasy | IN PROGRESS (Sprint A) |

---

## Phase 15 — 3D Game Content (Current)

**Branch:** `feature/phase-15-3d-game`

**Goal:** Bring the game shell to life with actual 3D rendering — world map, zones, character, mission effects.

**Exit Criteria:**
- [ ] 3D rendering library chosen and integrated (Three.js via R3F recommended)
- [ ] World map renders as interactive 3D scene with zone nodes
- [ ] At least one zone has a themed 3D environment
- [ ] Character page shows 3D model with idle animation
- [ ] Mission completion triggers particle/camera effect
- [ ] Mobile GPU fallback to 2D works correctly via gpu-detector.ts
- [ ] Bundle size for 3D libs is within acceptable range (lazy loaded)
- [ ] Build passes with no TypeScript errors

**Tasks:** See GAME3D-001 through COMBAT-FLOW-005 (26 total tasks across 6 parts) in task-board.md

### Phase 15 Exit Criteria

**Shared Types**
- [ ] BattleType, ZombieType, CombatPhase, QuizQuestion, BattleConfig in shared-types

**Backend**
- [ ] 32 questions written (8 per zone, 3 difficulty tiers, varied correct indices)
- [ ] POST /combat/init returns battle config with shuffled questions
- [ ] POST /combat/:battleId/complete awards XP + checks badges
- [ ] POST /combat/certificate generates SVG, uploads to Firebase Storage
- [ ] Combat tests passing

**Frontend — Desktop**
- [ ] combat-store.ts state machine covers all CombatPhase transitions
- [ ] /g/battle/[battleId] renders CombatArena (R3F, turn-based)
- [ ] All 5 zombie types render (4 zones + overlord) with idle/attack/death animations
- [ ] All 4 career attack effects visible
- [ ] QuestionCard: question + 4 options + 15-second countdown
- [ ] Intro / Victory / Defeat screens complete
- [ ] /g/victory certificate: child name, date, zone badges, download + share

**Frontend — Mobile**
- [ ] /m/battle/[battleId] renders MobileCombatView (2D CSS, no R3F)
- [ ] QuestionCard shared between desktop and mobile unchanged

**Game Flow**
- [ ] Mission complete → minion battle triggered
- [ ] All zone missions done → guardian battle triggered
- [ ] All 4 guardians defeated → overlord available on world map
- [ ] Guardian victory correctly unlocks next island
- [ ] Overlord victory → /g/victory with child's name

**Quality**
- [ ] pnpm build passes — zero TypeScript errors
- [ ] No child PII in any combat API path
- [ ] GPU low-quality: reduced particles, no shadows in combat arena

---

## Phase 16 — Gamified UI Redesign (Scheduled)

**Branch:** `feature/phase-16-fantasy-ui`
**Sprint plan:** [planning/sprint-p16.md](sprint-p16.md)
**Duration:** 4 sprints, ~8 weeks

**Goal:** Replace entire gamified mode UI with 2D cinematic dark-fantasy design. Add KP economy +
ability/weapon shop. Park R3F behind feature flag for A/B testing. Reuse Phase 15 combat backend.

**Sprints:**
- **A (Wk 1–2):** Foundation (design tokens, shared types, feature flag) + Backend (inventory, KP, settings, tenants)
- **B (Wk 3–4):** FE state + ported components + Welcome → Character → Dashboard → Campaign pages
- **C (Wk 5–6):** Battle page (critical path) + Shop + Settings + Routing
- **D (Wk 7–8):** Mobile mirror + Playwright QA + i18n stubs + Production rollout

**Tasks:** See Phase 16 section in task-board.md (~50 tasks across Parts A–K).

---

## Next Up — After Phase 16

These are the highest-priority gaps identified in the codebase audit (2026-03-07):

### Critical (ship-blocking)
1. **Stripe webhooks** (STRIPE-001) — `subscription.updated` and `payment_failed` not handled. Subscription lifecycle is broken without this.
2. **Production env vars** (DEPLOY-001) — Stripe, FCM, Sentry keys not confirmed in Railway/Vercel prod environments.
3. **COPPA compliance review** (COPPA-001) — New data paths (classrooms, notifications, game progress) need audit before any real child data flows through them.

### High Priority
4. **Test coverage** (QA-001) — Phases 6–14 modules need test suites to reach 80% coverage. Payments, classrooms, agents, projects are under-tested.
5. **i18n audit** (I18N-001) — Components added in Phases 6–14 likely missing French and Arabic translations.
6. **Security audit** (SEC-001) — New endpoints need verification: auth guards, userId filters on all queries, moderation on all AI paths.

### Medium Priority
7. **Accessibility pass** (A11Y-001) — Teacher, achievements, pricing, and game pages need keyboard nav + ARIA review.
8. **Bundle/performance** (PERF-001) — Monaco Editor + 3D libraries are heavy. Lazy loading strategy needed.

---

## Architecture Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | Turborepo + pnpm workspaces | Build caching, workspace hoisting |
| Frontend framework | Next.js 14 App Router | SSR, file-based routing, Vercel-native |
| Backend framework | NestJS + Fastify adapter | DI, modularity, performance |
| Auth | Firebase Authentication | Google OAuth, email/password, admin SDK on backend |
| Database | Firestore | Real-time, child-safe rules, no SQL schema overhead |
| AI provider | Anthropic Claude API (abstracted) | Safety focus, API quality |
| Payments | Stripe | Industry standard, webhook ecosystem |
| Push notifications | Firebase Cloud Messaging (FCM) | Already using Firebase stack |
| State management | Zustand (client) + TanStack Query (server) | Lightweight, composable |
| i18n | next-intl | App Router native, RTL support |
| Styling | Tailwind CSS v4 + shadcn/ui | Rapid iteration, accessible primitives |
| 3D engine | React Three Fiber + drei | Already integrated, consistent with game shell |
| Combat style | Turn-based | Age-appropriate (8-16), easier to implement, works on mobile |
| Combat location | Dedicated route /g/battle/[battleId] | Single R3F canvas, clean state machine, no overlay complexity |
| Combat questions | Pre-written quiz bank per zone | Consistent quality, no AI API cost per battle, COPPA safe |
| Zombie art | R3F primitives + meshToonMaterial | Consistent with existing game, no GLTF required for MVP |
| Mobile combat | 2D CSS fallback at /m/battle | R3F too heavy for low-end mobile, QuestionCard reused |
| Final reward | Named certificate (SVG → Firebase Storage) | Tangible, shareable, motivating for kids and parents |
| Deploy (FE) | Vercel | Next.js-native, edge functions |
| Deploy (BE) | Railway → GCP Cloud Run | Simple MVP, scalable path |

---

*Last updated: 2026-04-26 | Phase 15 backend done, FE deferred. Phase 16 scheduled across 4 sprints.*
