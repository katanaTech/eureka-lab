# Task Board — Eureka-Lab Platform

> **All agents must read this file before starting any work session.**
> **Status values:** `TODO` | `IN_PROGRESS [AGENT_ID]` | `BLOCKED [reason]` | `REVIEW` | `DONE`

---

## SPRINT 1 — Foundation (Weeks 1–2)

### ARCH Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| ARCH-001 | Create API contract spec (OpenAPI 3.0) for auth endpoints | DONE | ARCH | OpenAPI 3.0 spec written to planning/api-contracts.md. Unblocks FE-010, FE-011, BE-010, BE-011 |
| ARCH-002 | Define Firestore security rules schema | TODO | ARCH | Needed by BE Sprint 2 |
| ARCH-003 | Create ADR-001: Frontend state management decision | TODO | ARCH | |
| ARCH-004 | Create ADR-002: AI gateway abstraction pattern | TODO | ARCH | |
| ARCH-005 | Define feature flag schema and initial flags | TODO | ARCH | Needed by FE/BE Sprint 3 |
| ARCH-006 | Document environment variables spec | TODO | ARCH | Needed by DEVOPS Sprint 1 |

### DEVOPS Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| DEV-001 | Create GitHub organisation and monorepo scaffold | DONE | DEVOPS | Scaffold complete. Unblocks DEV-002, FE-001, BE-001 |
| DEV-002 | Set up Turborepo with apps/web + apps/api workspaces | TODO | DEVOPS | Depends: DEV-001 |
| DEV-003 | Configure Vercel deployment for apps/web | TODO | DEVOPS | Depends: DEV-001 |
| DEV-004 | Configure Railway deployment for apps/api | TODO | DEVOPS | Depends: DEV-001 |
| DEV-005 | GitHub Actions: CI pipeline (lint + test + build) | TODO | DEVOPS | Depends: DEV-002 |
| DEV-006 | GitHub Actions: CD pipeline (auto-deploy on main merge) | TODO | DEVOPS | Depends: DEV-003, DEV-004 |
| DEV-007 | Set up Upstash Redis instance + env vars | TODO | DEVOPS | Needed by BE Sprint 3 |
| DEV-008 | Configure Sentry for both apps | TODO | DEVOPS | |

### BE Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| BE-001 | NestJS + Fastify project scaffold with health endpoint | DONE | BE | Scaffold + GET /health complete. Unblocks BE-002, BE-003, BE-004, BE-005, QA-002, QA-004 |
| BE-002 | Firebase Admin SDK setup + service account config | TODO | BE | Depends: BE-001 |
| BE-003 | Pino logger service (structured JSON) | TODO | BE | Depends: BE-001 |
| BE-004 | Global exception filter + error response DTOs | TODO | BE | Depends: BE-001 |
| BE-005 | Request validation pipe (class-validator + class-transformer) | TODO | BE | Depends: BE-001 |

### FE Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| FE-001 | Next.js 14 project scaffold (App Router) | DONE | FE | Scaffold complete. Unblocks FE-002, FE-003, FE-004, FE-006, QA-001 |
| FE-002 | Tailwind + shadcn/ui setup + base theme tokens | TODO | FE | Depends: FE-001 |
| FE-003 | next-intl setup: en/fr/ar locale files + RTL support | TODO | FE | Depends: FE-001 |
| FE-004 | next-pwa setup + manifest.json | TODO | FE | Depends: FE-001 |
| FE-005 | Base layout: navbar, sidebar skeleton, responsive grid | TODO | FE | Depends: FE-002 |
| FE-006 | Zustand store scaffold + TanStack Query provider | TODO | FE | Depends: FE-001 |

### QA Tasks

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| QA-001 | Set up Vitest config for apps/web | TODO | QA | Depends: FE-001 |
| QA-002 | Set up Jest config for apps/api | TODO | QA | Depends: BE-001 |
| QA-003 | Set up Playwright E2E config | TODO | QA | Depends: DEV-003 |
| QA-004 | Write smoke test: health endpoint returns 200 | TODO | QA | Depends: BE-001 |

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

*Last updated: Sprint 1 kickoff | Maintained by: PM agent*
