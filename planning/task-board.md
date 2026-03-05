# Task Board — Eureka-Lab Platform

> **Status values:** `TODO` | `IN_PROGRESS` | `DONE`
> Single-agent workflow. No multi-agent coordination needed.

---

## PHASE 1 — Monorepo & Infrastructure (COMPLETE)

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

## PHASE 2 — Sprint 1 Core Setup (COMPLETE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S1-001 | Tailwind + shadcn/ui + base theme | DONE | Tailwind v4, PostCSS, shadcn Button component, globals.css with design tokens |
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

## PHASE 3 — Auth & Roles (Sprint 2) (COMPLETE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S2-001 | Firebase Auth middleware (JWT) | DONE | FirebaseAuthGuard verifies Bearer token, attaches AuthenticatedUser to request |
| S2-002 | Auth endpoints (signup, login, refresh) | DONE | AuthController + AuthService + DTOs per api-contracts.md, UsersRepository for Firestore CRUD |
| S2-003 | Role guard (child/parent/teacher/admin) | DONE | RolesGuard + @Roles decorator using Reflector |
| S2-004 | Parental consent + add-child flow | DONE | Age 8-16 enforcement, max 5 children per parent, auto-consent under COPPA |
| S2-005 | Firestore security rules | DONE | users/progress/moderation-logs/ai-interactions rules with deny-all default |
| S2-006 | Sign up / Login pages (frontend) | DONE | LoginForm (email + Google OAuth) + SignupForm, (auth) route group |
| S2-007 | Auth context + useAuth hook | DONE | onAuthStateChanged listener, syncs with backend via authApi.getMe |
| S2-008 | Protected route wrapper | DONE | ProtectedRoute with role enforcement, redirect to /login |
| S2-009 | Parent dashboard skeleton | DONE | Children list grid, add child button, empty state |

**Verification:** `pnpm build` 5/5 ✓ | `pnpm test` (api) 2 suites, 9 tests ✓

---

## PHASE 4 — Level 1 Core (Sprint 3) (COMPLETE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-001 | AI Gateway service (Claude API, abstracted) | DONE | AiGatewayService with Anthropic SDK, safety preamble injection, mock mode for dev, prompt scoring |
| S3-002 | Content moderation (input + output filters) | DONE | ContentModerationService: harmful/adult/PII/jailbreak pattern detection on input + output |
| S3-003 | Token budget enforcement | DONE | UsageTrackerService: daily prompt limits per plan (20/100/unlimited), Firestore subcollection tracking |
| S3-004 | Moderation logging service | DONE | ModerationLogService: persists flagged content to Firestore moderation-logs collection |
| S3-005 | Level 1 module API endpoints | DONE | ModulesController (GET /modules, GET /modules/:id), 8 Level 1 modules (5 free, 3 explorer) |
| S3-006 | Progress tracking service | DONE | ProgressService: activity completion, XP awards, module status resolution, sequential unlocking |
| S3-007 | Prompt editor component | DONE | PromptEditor with textarea, optional context, streaming response display, char counter |
| S3-008 | Module list + detail pages | DONE | ModuleList grid, ModuleCard with status badges, ModuleDetail with activity progression |
| S3-009 | AI response streaming (SSE) | DONE | SSE endpoint in AiController, async generator on frontend via streamPrompt(), real-time token display |
| S3-010 | Prompt quality score display | DONE | PromptScoreDisplay with progress bar, percentage, color-coded labels, tokens used counter |

**Verification:** `pnpm build` 5/5 ✓ | `pnpm test` (api) 4 suites, 25 tests ✓

---

## PHASE 5 — Polish & Deploy (Sprint 4) (COMPLETE)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-001 | CI/CD pipeline (GitHub Actions) | DONE | 4-stage pipeline: lint → test-api + test-web → build, pnpm caching, concurrency |
| S4-002 | Environment variable documentation | DONE | docs/context/env-variables.md + .env.example for both apps |
| S4-003 | E2E tests (Playwright) | DONE | playwright.config.ts, smoke tests (page load, forms, 404, accessibility), excluded from tsconfig |
| S4-004 | Error boundary components | DONE | ErrorBoundary class component, global error.tsx page, custom not-found.tsx |
| S4-005 | Loading states + skeleton screens | DONE | Skeleton, Spinner components, dashboard loading.tsx |
| S4-006 | Vercel deployment config | DONE | vercel.json with monorepo build, security headers, API cache-control |
| S4-007 | Railway deployment config (backend) | DONE | Multi-stage Dockerfile, railway.json with healthcheck, .dockerignore |
| S4-008 | Sentry error monitoring | DONE | Placeholder lib/sentry.ts with initSentry, captureError, setSentryUser |
| S4-009 | Performance optimization | DONE | poweredByHeader off, compress on, optimizePackageImports, image formats |
| S4-010 | Accessibility audit | DONE | VisuallyHidden component, ARIA labels throughout, form label associations |

**Verification:** `pnpm build` 5/5 ✓ | `pnpm test` (api) 4 suites, 25 tests ✓

---

## BACKLOG (Phase 2+)

| ID | Task | Phase | Priority |
|----|------|-------|----------|
| L2-001 | Level 2 Workflow Automation | 2 | HIGH |
| L3-001 | Level 3 Vibe Coding + Monaco Editor | 3 | HIGH |
| L4-001 | Level 4 Buddy Agents | 4 | MEDIUM |
| GAM-001 | Gamification (XP, badges, streaks) | 2 | HIGH |
| PAY-001 | Freemium + Stripe integration | 2 | HIGH |
| B2B-001 | Teacher dashboard | 2 | HIGH |

---

*Last updated: 2026-02-20 | Phase 5 complete — MVP Sprint 1-4 done*
