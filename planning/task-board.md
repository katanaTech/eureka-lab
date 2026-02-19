# Task Board — Eureka-Lab Platform

> **All agents must read this file before starting any work session.**
> **Status values:** `TODO` | `IN_PROGRESS [AGENT_ID]` | `BLOCKED [reason]` | `REVIEW` | `DONE`

---

## SPRINT 1 — Foundation (Weeks 1–2)

### ARCH Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| ARCH-001 | Create API contract spec (OpenAPI 3.0) for auth endpoints | DONE | ARCH | OpenAPI 3.0 spec written to planning/api-contracts.md. Unblocks FE-010, FE-011, BE-010, BE-011 |
| ARCH-002 | Define Firestore security rules schema | DONE | ARCH | Written to context/firestore-schema.md. Documents 4 collections (users, progress, sessions, moderationLogs) with field types, access rules, security principles, and indexing notes. Unblocks BE-014. |
| ARCH-003 | Create ADR-001: Frontend state management decision | DONE | ARCH | Written to context/ADR-001-frontend-state.md. Decision: Zustand (client state, ≤5 stores) + TanStack Query (server state). Redux, Context for data, and SWR explicitly rejected. |
| ARCH-004 | Create ADR-002: AI gateway abstraction pattern | DONE | ARCH | Written to context/ADR-002-ai-gateway.md. AiGatewayService interface with sendMessage method documented. Safety preamble injection, token budget enforcement, audit logging all mandated in implementation rules. |
| ARCH-005 | Define feature flag schema and initial flags | TODO | ARCH | Needed by FE/BE Sprint 3 |
| ARCH-006 | Document environment variables spec | DONE | ARCH | context/env-variables.md updated with Security Rules section: NEXT_PUBLIC_ safety explanation, prohibition on prefixing secrets, per-var security classification. |

### DEVOPS Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| DEV-001 | Create GitHub organisation and monorepo scaffold | DONE | DEVOPS | Scaffold complete. Unblocks DEV-002, FE-001, BE-001 |
| DEV-002 | Set up Turborepo with apps/web + apps/api workspaces | DONE | DEVOPS | turbo.json (pipeline→tasks), pnpm-lock.yaml generated, tsconfig.json added to packages/ui + packages/ai-prompts, spurious Vue dep removed from apps/web, dev script added to apps/api. All 5 workspaces resolve; packages typecheck clean. Unblocks DEV-005 |
| DEV-003 | Configure Vercel deployment for apps/web | TODO | DEVOPS | Depends: DEV-001 |
| DEV-004 | Configure Railway deployment for apps/api | TODO | DEVOPS | Depends: DEV-001 |
| DEV-005 | GitHub Actions: CI pipeline (lint + test + build) | DONE | DEVOPS | .github/workflows/ci.yml created. Triggers on push (all branches) + PR to main. Node 20, pnpm 9, pnpm store cache keyed on pnpm-lock.yaml hash. Steps: install, lint, typecheck, test, build via turbo. |
| DEV-006 | GitHub Actions: CD pipeline (auto-deploy on main merge) | TODO | DEVOPS | Depends: DEV-003, DEV-004 |
| DEV-007 | Set up Upstash Redis instance + env vars | TODO | DEVOPS | Needed by BE Sprint 3 |
| DEV-008 | Configure Sentry for both apps | DONE | DEVOPS | apps/web/sentry.client.config.ts and apps/web/sentry.server.config.ts created (@sentry/nextjs, NEXT_PUBLIC_SENTRY_DSN guard). apps/api/src/main.ts updated: Sentry.init() from @sentry/nestjs added at top, guarded by SENTRY_DSN env var. No DSN values hardcoded. |

### BE Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| BE-001 | NestJS + Fastify project scaffold with health endpoint | DONE | BE | Scaffold + GET /health complete. Unblocks BE-002, BE-003, BE-004, BE-005, QA-002, QA-004 |
| BE-002 | Firebase Admin SDK setup + service account config | DONE | BE | FirebaseModule (@Global) + FirebaseService created at apps/api/src/infrastructure/firebase/. Exposes getFirestore(), getAuth(), getStorage() with JSDoc. Initialises once via admin.apps.length guard. Registered in AppModule. .env.example updated with FIREBASE_PRIVATE_KEY_BASE64 (primary/Railway) and FIREBASE_PRIVATE_KEY (alternative/local) options. |
| BE-003 | Pino logger service (structured JSON) | DONE | BE | LoggerService verified complete — Pino-based, JSDoc on all methods (log/error/warn/debug/verbose), no `any`, Global LoggerModule exported and registered in AppModule. Redacts sensitive fields. |
| BE-004 | Global exception filter + error response DTOs | DONE | BE | AllExceptionsFilter verified complete; registered via app.useGlobalFilters() in main.ts. ErrorResponseDto updated with class-validator decorators (@IsInt, @IsString, @IsISO8601, etc.). `path` field added to ErrorResponse interface, ErrorResponseDto, and filter response body: { statusCode, error, message, code?, errors?, timestamp, path }. |
| BE-005 | Request validation pipe (class-validator + class-transformer) | DONE | BE | ValidationPipe registered in main.ts with whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions.enableImplicitConversion: true. Inline comment explains each option. class-validator and class-transformer already in package.json dependencies. |

### FE Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| FE-001 | Next.js 14 project scaffold (App Router) | DONE | FE | Scaffold complete. Unblocks FE-002, FE-003, FE-004, FE-006, QA-001 |
| FE-002 | Tailwind + shadcn/ui setup + base theme tokens | DONE | FE | All shadcn CSS variables (light + dark) confirmed in globals.css; tailwind.config.ts has correct content paths, full theme extension with shadcn tokens, and tailwindcss-animate plugin; cn() utility confirmed in lib/utils.ts using clsx + tailwind-merge |
| FE-003 | next-intl setup: en/fr/ar locale files + RTL support | DONE | FE | Middleware configured for en/fr/ar with localePrefix always; isRtlLocale() helper in lib/i18n-config.ts; [locale]/layout.tsx sets dir="rtl" for Arabic via isRtlLocale(); all 3 locale files verified with matching keys (Common.loading, Common.error, Nav.home, Nav.dashboard, Auth.signIn, Auth.signOut) |
| FE-004 | next-pwa setup + manifest.json | DONE | FE | next.config.js wrapped with withPWA (dest: public, register: true, skipWaiting: true, disabled in development); public/manifest.json present with name "Eureka Lab", short_name "Eureka", theme_color "#6366f1", background_color "#ffffff", display standalone, icons at /icon-192.png + /icon-512.png; manifest linked via metadata.manifest in root layout |
| FE-005 | Base layout: navbar, sidebar skeleton, responsive grid | DONE | FE | Navbar (h-16, logo + hamburger), Sidebar (w-60, Home + Dashboard nav, active-route highlight, mobile overlay), AppShell (composes both, owns open/close state, main pt-16 md:ps-60). 'use client' on all 3. Wired into [locale]/layout.tsx wrapping children. Barrel export at components/layout/index.ts. i18n keys openMenu/closeMenu/authActions/sidebarNav added to en/fr/ar. RTL-safe (start-0, border-e, ps-60). |
| FE-006 | Zustand store scaffold + TanStack Query provider | DONE | FE | stores/auth-store.ts: typed AuthState with user (UserProfile|null), isLoading boolean, setUser and clearUser actions — zero any types, full JSDoc; Providers.tsx: QueryClientProvider wrapping children, QueryClient created via useState to prevent re-creation on re-render |

### QA Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| QA-001 | Set up Vitest config for apps/web | DONE | QA | Config verified: @vitejs/plugin-react, jsdom env, vitest.setup.ts, v8 coverage provider, 80% thresholds (lines/functions/branches). Fixed branches threshold from 75→80. |
| QA-002 | Set up Jest config for apps/api | DONE | QA | Jest config in package.json verified: moduleFileExtensions, rootDir src, .spec.ts testRegex, ts-jest, 80% thresholds. Fixed branches threshold from 75→80. Spec files valid TS with no `any`. |
| QA-003 | Set up Playwright E2E config | TODO | QA | Depends: DEV-003 |
| QA-004 | Write smoke test: health endpoint returns 200 | DONE | QA | E2E spec at test/e2e/health.e2e-spec.ts complete: NestJS+Fastify test app via app.inject(), asserts 200+{status:'ok'}+ISO timestamp, JSON content-type, and 404 for unknown routes. JSDoc added to all describe/it blocks. jest-e2e.json verified correct. |

---

## SPRINT 2 — Auth & Roles (Weeks 3–4)

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| BE-010 | Firebase Auth middleware (JWT verification) | TODO | BE | Depends: ARCH-001 |
| BE-011 | Auth module: signup, login, refresh token endpoints | TODO | BE | Depends: BE-010 |
| BE-012 | Role guard (child/parent/teacher/admin) using Firebase custom claims | TODO | BE | Depends: BE-010 |
| BE-013 | Parental consent flow: create child sub-account endpoint | TODO | BE | Depends: BE-011 |
| BE-014 | Firestore security rules: child data isolation | TODO | BE | Depends: ARCH-002 |
| BE-015 | Users collection CRUD service | TODO | BE | Depends: BE-012 |
| FE-010 | Sign up page (parent + child flows) | TODO | FE | Depends: ARCH-001 |
| FE-011 | Login page + Google OAuth button | TODO | FE | Depends: ARCH-001 |
| FE-012 | Parental consent UI flow (multi-step) | TODO | FE | Depends: FE-010 |
| FE-013 | Auth context provider + useAuth hook | TODO | FE | Depends: FE-006 |
| FE-014 | Protected route wrapper component | TODO | FE | Depends: FE-013 |
| FE-015 | Age verification gate (block <8 or >16 for child accounts) | TODO | FE | Depends: FE-012 |
| FE-016 | Basic parent dashboard skeleton | TODO | FE | Depends: FE-014 |
| QA-010 | Auth flow E2E tests (signup → verify → login) | TODO | QA | Depends: FE-012 |
| QA-011 | Role guard unit tests | TODO | QA | Depends: BE-012 |
| QA-012 | COPPA compliance test: child cannot access adult endpoints | TODO | QA | Depends: BE-013 |

---

## SPRINT 3 — Level 1 Core (Weeks 5–7)

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| ARCH-010 | Define AI gateway interface contract | TODO | ARCH | Needed by BE-020 |
| BE-020 | AI Gateway service (Claude API integration, abstracted) | TODO | BE | Depends: ARCH-010 |
| BE-021 | Content moderation Layer 1: pre-generation prompt filter | TODO | BE | Depends: BE-020 |
| BE-022 | Content moderation Layer 2: post-generation output screen | TODO | BE | Depends: BE-020 |
| BE-023 | Moderation log service (write all AI interactions to Firestore) | TODO | BE | Depends: BE-022 |
| BE-024 | Token budget enforcement service (per-level, per-user, per-day) | TODO | BE | Depends: BE-020 |
| BE-025 | Level 1 module API endpoints (list, get, submit response) | TODO | BE | Depends: BE-022 |
| BE-026 | Progress tracking service (Firestore progress collection) | TODO | BE | Depends: BE-015 |
| FE-020 | Prompt editor component (split-pane: input left, output right) | TODO | FE | |
| FE-021 | Module list page (learning path visual) | TODO | FE | Depends: BE-025 |
| FE-022 | Module detail page + activity scaffold | TODO | FE | Depends: FE-020 |
| FE-023 | AI response streaming display (Server-Sent Events) | TODO | FE | Depends: BE-020 |
| FE-024 | Prompt quality score display component | TODO | FE | |
| FE-025 | Level 1 Module 1–5 content integration (free tier) | TODO | FE | Depends: FE-022 |
| QA-020 | AI gateway unit tests (mock Claude API) | TODO | QA | Depends: BE-020 |
| QA-021 | Moderation pipeline tests (known bad inputs) | DONE | QA | Adversarial spec written (70+ cases). Fails until BE-021/022 implemented. See bugs.md BUG-001. |
| QA-022 | Token budget enforcement tests | TODO | QA | Depends: BE-024 |

---

## SPRINT 4 — Gamification & Progress (Weeks 8–9)

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| BE-030 | XP award service (BullMQ async job) | TODO | BE | |
| BE-031 | Badge definition seed data + award logic | TODO | BE | |
| BE-032 | Streak tracking service | TODO | BE | |
| FE-030 | XP progress bar component | TODO | FE | |
| FE-031 | Badge display + unlock animation | TODO | FE | |
| FE-032 | Learning path visualiser (locked/unlocked nodes) | TODO | FE | |
| FE-033 | Daily streak indicator | TODO | FE | |

---

## SPRINT 5 — Freemium & Payments (Weeks 10–11)

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| BE-040 | Stripe integration: create subscription endpoint | TODO | BE | |
| BE-041 | Stripe webhook handler (subscription events) | TODO | BE | |
| BE-042 | Plan enforcement middleware (check user.plan before AI calls) | TODO | BE | |
| FE-040 | Pricing page (Free / Explorer / Creator tiers) | TODO | FE | |
| FE-041 | Subscription upgrade flow (Stripe Checkout) | TODO | FE | |
| FE-042 | Paywall component (graceful upgrade prompt) | TODO | FE | |

---

## SPRINT 6 — Polish & Launch (Weeks 12–13)

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| FE-050 | PWA offline mode: cache Level 1 lessons | TODO | FE | |
| FE-051 | Parent weekly email digest (trigger via Firebase Function) | TODO | FE | |
| FE-052 | Performance audit: Core Web Vitals + Lighthouse ≥90 | TODO | FE | |
| FE-053 | Accessibility audit: WCAG 2.1 AA | TODO | FE | |
| BE-050 | Moderation admin dashboard API | TODO | BE | |
| DEVOPS-010 | Production environment setup (Vercel + Railway prod) | TODO | DEVOPS | |
| DEVOPS-011 | Uptime monitoring + alerting | TODO | DEVOPS | |
| QA-050 | Full regression test suite run | TODO | QA | |
| QA-051 | Security audit: OWASP Top 10 checklist | TODO | QA | |

---

## BACKLOG (Phase 2+)

| ID | Task | Phase | Priority |
|----|------|-------|----------|
| L2-001 | Level 2 Workflow Automation module development | 2 | HIGH |
| L2-002 | Teacher dashboard (B2B) | 2 | HIGH |
| L3-001 | Monaco Editor sandboxed code environment | 3 | HIGH |
| L3-002 | Level 3 Vibe Coding modules | 3 | HIGH |
| L4-001 | Agent builder UI (JSON config form) | 4 | MEDIUM |
| L4-002 | Agent sharing + marketplace | 4 | MEDIUM |
| I18N-001 | Full Arabic RTL QA pass | 2 | HIGH |
| B2B-001 | SAML SSO implementation | 2 | HIGH |

---

*Last updated: Sprint 1 — FE-002, FE-003, FE-004, FE-005, FE-006 completed by FE agent | Maintained by: PM agent*
