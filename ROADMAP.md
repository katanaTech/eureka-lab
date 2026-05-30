# Eureka Lab — Roadmap

> **Single canonical view of where we are and what's next.** Updated whenever a phase / plan changes state. If anything in this doc disagrees with what's in code, code wins — file an update.
>
> **Last updated:** 2026-05-29
> **Next review:** weekly (every Wednesday)
> **Maintainer:** whoever last touched a major plan

For product context (mission, 4-level curriculum, hardcoded rules), see [CLAUDE.md](CLAUDE.md). For development standards, see [`rules/{backend,frontend,devops,qa}-rules.md`](rules/).

---

## TL;DR

Eureka Lab is an AI-literacy SaaS for kids 8-16. The product shipped through Phase 14 on `main`; Phase 15 (3D combat) backend is done but frontend was reverted and parked. The current branch (`redesign/v2-from-reference`, PR #8, 65 commits ahead of `main`) is **redesigning the whole app's visual language and learner flow** to match the `ai-adventure-island` reference project. Three sub-plans of redesign work:

- **Plan 1** (foundation + learner shell): **DONE**
- **Plan 2** (campaign + combat + inventory + shop + victory): **DONE**
- **Plan 3a** (adult-page re-skin): **DONE today (2026-05-15)**
- **Plan 3b** (backend persistence + R5 COPPA follow-ups): **DONE** (2026-05-29)
- **Plan 3c** (i18n + RTL + E2E + polish): **NOT WRITTEN**

Plus a backlog of 8 HIGH-priority ship-blockers (Stripe webhooks, COPPA review, prod env vars, tests, i18n, security, a11y, perf) carried from `main` 2026-03-07 — **none addressed by the redesign branch yet**.

---

## Current branch state

| Item | Value |
|---|---|
| Branch | `redesign/v2-from-reference` |
| PR | [#8](https://github.com/katanaTech/eureka-lab/pull/8) (draft, OPEN) |
| Commits ahead of `main` | 92 |
| HEAD | `2a00a92` |
| Latest plan landed | Plan 3b (R5 + persistence) — **DONE 2026-05-29** (smoke passed) |
| Next plan | Plan 3c (polish) — **not written** |
| Last push | 2026-05-28 (Plan 3b commits unpushed pending approval) |
| TypeScript | web: 24 pre-existing test-file errors only / api: 0 errors |
| Lint | web: ✅ clean / api: untracked |
| Tests | api: 260 passing (24 suites), incl. 12 new Plan 3b unit tests |
| Open smoke | None — Plan 3b smoke passed 2026-05-29 |
| Known open bugs | none blocking; **app-wide Sonner toast failure** (Stream 4 — auth path covered by inline alert); **missing teacher signup UI** (Stream 4) |

---

## Stream 1 — Pre-redesign platform (on `main`)

Built between Phase 1 (2026-02) and Phase 14 (2026-03). The codebase that's already shipped is much larger than CLAUDE.md's "Phase 1 MVP" implies. Phase-by-phase detail is now consolidated into the table below (the legacy `planning/task-board.md` and `planning/sprint-01.md` were deleted on 2026-05-15 — content lifted here and into Stream 3).

| Phase | Scope | Status | Where |
|---|---|---|---|
| 1 | Monorepo + Turborepo + pnpm workspaces | DONE | `apps/`, `packages/`, `turbo.json` |
| 2 | Tailwind + i18n + PWA + Firebase + Pino + Zustand | DONE | `apps/web/src/app/globals.css`, `messages/{en,fr,ar}.json` |
| 3 | Auth + roles + parental consent | DONE | `apps/api/src/modules/auth/`, `apps/web/src/hooks/useAuth.ts` |
| 4 | **Level 1 — AI Conversation** (prompt literacy, 8 modules) | DONE | `apps/api/src/modules/{ai-gateway,modules-content,progress}` |
| 5 | CI/CD + Sentry + Playwright + Vercel/Railway | DONE | `.github/workflows/`, `apps/web/src/lib/sentry.ts` |
| 6 | Gamification (XP, badges, streaks, achievements) | DONE | `apps/api/src/modules/gamification/`, `apps/web/src/stores/gamification-store.ts` |
| 7 | Payments + freemium (Stripe checkout) | DONE | `apps/api/src/modules/payments/`, `apps/web/src/app/(dashboard)/pricing/` |
| 8 | Teacher / classroom (B2B) | DONE | `apps/api/src/modules/classrooms/`, `apps/web/src/app/(dashboard)/teacher/` |
| 9 | **Level 2 — Workflow Automation** | DONE | `apps/api/src/modules/workflows/`, `apps/web/src/components/features/workflows/` |
| 10 | **Level 3 — Vibe Coding** (Monaco Editor) | DONE | `apps/api/src/modules/projects/`, `CodeEditor.tsx` |
| 11 | **Level 4 — Buddy Agents** | DONE | `apps/api/src/modules/agents/`, `AgentBuilder.tsx` |
| 12 | Notifications (FCM push + scheduler) | DONE | `apps/api/src/modules/notifications/` |
| 13 | Mobile PWA (`(mobile)/` route group, `/m/*` mirror) | DONE then **REMOVED** by redesign Plan 1 (commit `9e8f046`) | spec §9.2 still open |
| 14 | 3D Game Shell (R3F routes + store + GPU detection) | DONE then **PARKED** to `apps/web/src/components/_future_r3f/` by redesign Plan 1 | spec §11 |
| 15 | 3D AI Zombie Combat (backend + frontend) | **Backend DONE; frontend (16 tasks) NEVER LANDED — parked in `_future_r3f/`** | [`planning/phase-15-combat-design.md`](planning/phase-15-combat-design.md), 549-line design |

The L2/L3/L4 curriculum is functional under `(dashboard)/learn/*` but is **not** yet wired into the redesigned campaign / mission flow that Plan 1+2 built. That integration is unplanned.

---

## Stream 2 — Active redesign work (this branch)

**Spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md). **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, canonical visual source — do not modify). **Per-plan task detail** lives inside each plan doc under `docs/superpowers/plans/` (the legacy `planning/redesign-task-board.md` was deleted on 2026-05-15 — superseded by this Stream 2 + plan-doc tables).

| Plan | Scope | Status | Plan doc |
|---|---|---|---|
| 1 | Foundation + Learner Shell (revert, salvage, design tokens, Welcome / Character / Dashboard) | **DONE** | [plan-1](docs/superpowers/plans/2026-05-11-redesign-plan-1-foundation-and-learner-shell.md) |
| 2 | Learner loop completion (campaign, prepare, mission-prep, battle, inventory, shop, victory) | **DONE** | [plan-2](docs/superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md) |
| 3a | Adult-facing pages re-skin (parent / teacher / settings / pricing / achievements / checkout) | **DONE** | [plan-3a](docs/superpowers/plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md) |
| 3b | R5 follow-ups (P3-14/15/16) + learner persistence (P3-17/18). Combat validation P3-07 split out. | **DONE** (code complete 2026-05-29; QA smoke passed 2026-05-29; 2 bug-fix commits `1df4c3f` + `2a00a92` verified) | [plan-3b](docs/superpowers/plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md) |
| 3c | Platform polish (i18n re-key, RTL fonts, E2E rewrite, PWA/Sentry, feature-component re-skin) | **NOT WRITTEN** | — |
| 3-combat | P3-07 hybrid combat validation (split out of 3b; not blocking ship) | **NOT WRITTEN** | — |

### Plan 3b scope (DONE 2026-05-29 — code complete + QA smoke passed)

| ID | Item | Severity | In plan | Status |
|---|---|---|---|---|
| P3-14 | Server-side `role` derivation from `birthYear` (R5 follow-up) | Important | Phase A | CODE DONE (ADR-007; +6 unit tests) |
| P3-15 | Google OAuth age gate (R5 follow-up) | Important | Phase B | CODE DONE (`OAuthBirthYearModal` + `/auth/complete-oauth-signup`) |
| P3-16 | Under-13 COPPA confirmation pipeline (parent email + audit log) | Important, ~1 sprint | Phase C | CODE DONE (`email` + `coppa` modules; +6 unit tests) |
| P3-17 | Backend KP-credit endpoints (lessons / videos / battle XP) | Important | Phase D | CODE DONE (`POST /inventory/credit-kp` idempotent) |
| P3-18 | Persistent academy progress (`completedLessons` / `watchedVideos` across sessions) | Important | Phase E | CODE DONE (`academy-progress` module + Firestore-backed store) |

P3a-N7 (role-aware post-auth router) was **fixed ahead of Plan 3b** in commit `1cf9efc` — it blocked Plan 3a adult smoke, so it shipped immediately. P3-07 (combat validation) was **split out** of Plan 3b into its own future plan (`3-combat` row above) — not ship-blocking.

### Plan 3c proposed scope (when written)

| ID | Item | Severity |
|---|---|---|
| P3-08 | i18n re-key `Phase16*` → flat namespaces (en/fr/ar) | Important |
| P3-09 | New Plan-1/2/3a strings in all locale files (resolves `TODO(plan-3-i18n)` markers) | Important |
| P3-10 | RTL Arabic display font — apply Amiri to `html[dir="rtl"] .font-display` | Important |
| P3-11 | E2E suite rewrite (`apps/web/e2e/learner-flow.spec.ts`, chromium + mobile-chrome) | Important |
| P3-12 | Retire `useMobileDetect` hook (orphaned after Plan 3a deleted `MobileRedirect`) | Nit |
| P3-13 | Verify PWA + Sentry source maps post-redesign | Important |
| P3-19 | `AiTutorChat` accepts `chapterName` for chapter-specific intro | Nit |
| P3a-N1 | Inner feature-component re-skin (`PricingCard`, `BadgeGrid`, `XpBar`, `StreakCounter`, `ActivityCalendar`, `LevelBadge`, `JoinCodeDisplay`, `StudentProgressTable`, `SubscriptionCard`, `ClassroomCard`, `CreateClassroomDialog`) | Nit |
| P3a-N3 | `(dashboard)/learn/page.tsx` + `[moduleId]/page.tsx` re-skin or redirect | Important |
| P3a-N4 | Prune `ui-store.sidebarOpen` / `toggleSidebar` (dead state) | Nit |

---

## Stream 3 — Pre-redesign HIGH ship-blockers (NOT addressed in redesign branch)

Originally listed in the (now-deleted) `planning/sprint-01.md` "Next Up — After Phase 15" backlog. Logged 2026-03-07 — none have been worked on since. **These block any production release.**

| ID | Item | Priority |
|---|---|---|
| STRIPE-001 | Stripe webhook handler for `subscription.updated` + `payment_failed`. Subscription lifecycle is broken without it. | Critical |
| COPPA-001 | Compliance review for new data paths (classrooms, notifications, game progress). Plan 3b's P3-16 covers a slice; broader audit unowned. | Critical |
| DEPLOY-001 | Production env var setup (Stripe / FCM / Sentry keys not confirmed in Railway/Vercel prod) | Critical |
| QA-001 | Test coverage to 80%+ for Phases 6-15 modules (payments, classrooms, agents, projects, combat) | High |
| I18N-001 | French + Arabic coverage for Phases 6-14 components (overlaps with Plan 3c P3-08/09) | High |
| SEC-001 | Security audit on new endpoints (auth guards, userId filters, moderation on all AI paths) | High |
| A11Y-001 | Keyboard nav + ARIA review for teacher / achievements / pricing / game pages | Medium |
| PERF-001 | Bundle analysis + code splitting for Monaco Editor + R3F libs | Medium |

---

## Stream 4 — Architectural gaps with no plan

Discovered during the 2026-05-15 audit. None of these has an owner or a target plan.

| Gap | Description | Where surfaced |
|---|---|---|
| **L2-L4 integration with new campaign flow** | Spec §5.2 maps L1-L4 → Campaign 1-4 visually, but `(dashboard)/learn/*` (functional L2 workflows / L3 Monaco / L4 agents) is not wired into `/campaign/[slug]/prepare`. Plan 3c P3a-N3 is currently the only mention. | Spec §5.2 vs reality |
| **Mobile PWA story** | `(mobile)/` route group deleted. Spec §9.2 asks "do we rely on Tailwind responsive utilities or keep `useMobileDetect`?" Still open. | Spec §9.2 |
| **3D phase resumption** | 27 R3F components + game-store parked in `_future_r3f/`. Spec §11 says "future spec, not in scope." No date or owner. | Spec §11 |
| **Teacher signup UI** | **SUPERSEDED by Stream 6 (B2B School Tenancy epic, 2026-05-30).** Teachers will be provisioned by a school admin, not self-served. Original framing (dedicated `/auth/signup-teacher` route) is no longer the plan. | Plan 3a smoke (2026-05-15) → reframed 2026-05-30 |
| **`(dashboard)/learn/*` decision** | Pre-redesign curriculum routes still serve real content but use old shadcn styling. Inherited new fantasy chrome via the Plan 3a layout rewrite — looks mismatched. Tracked as P3a-N3 above. | Plan 3a self-audit |
| **App-wide Sonner toasts do not render** | `toast()` emitter and `<Toaster>` resolve to disconnected stores in this Next 14 build: `toast.getHistory()` returned 1 while `useSonner()` from the same import stayed empty. Three config fixes failed (client-component wrapper, `transpilePackages: ['sonner']`, webpack `resolve.alias`); a from-scratch Zustand replacement with a `globalThis`-anchored store also didn't render (deeper than a config issue). **Not blocking:** auth-form rejection (the one QA hit) is reliably visible via the inline alert added in `1df4c3f`; other toasts (login success, shop, battle, character) silently no-op but no flows break. Defer to a dedicated investigation — full evidence in [`2026-05-30-plan-3b-done-sonner-deferred-handover.md`](docs/superpowers/handover/2026-05-30-plan-3b-done-sonner-deferred-handover.md). | Plan 3b QA smoke (Bug 1 deep-dive 2026-05-30) |

**Resolved since the audit:** *Role-aware post-auth router* (parents/teachers bounced through `/character`) — fixed in commit `1cf9efc` via `homeForRole()` + 5 redirect-site updates.

---

## Stream 5 — Documentation / planning hygiene

| Item | State | Priority |
|---|---|---|
| `planning/api-contracts.md` | Documents `/auth/*` only, says signup accepts `[parent]` only (actual: `[parent, teacher, child]`). Phases 4-15 endpoints (AI, modules, progress, payments, classrooms, gamification, notifications, workflows, projects, agents, combat, inventory) undocumented. | High |
| ADRs 001-005 | Referenced by redesign spec as "marked historical" but not on disk; only ADR-006 exists | Low — back-fill when convenient |
| CLAUDE.md repo structure | Claims `docs/agents/`, `docs/planning/`, `docs/rules/` — actual paths are different (top-level `planning/`, `rules/`; no `docs/agents/`) | Low — fix CLAUDE.md or move folders |
| Bug log | Bug tracking was in `planning/bugs.md` (deleted 2026-05-15). Currently no replacement. Track open bugs in this ROADMAP's Stream 4 or open a fresh `planning/bugs.md` when one exists. | Low |

---

## Stream 6 — B2B School Tenancy (epic — NEW 2026-05-30)

A multi-tenant B2B layer on top of the existing B2C model: a platform **super-admin** manages **schools** (tenants: subscriptions, license seats, secret keys), each school's **admin** manages **teachers**, and school **students** consume license seats. Runs parallel to the existing parent → child consumer tree (separate trees; a child is in exactly one). **Supersedes** the Stream 4 "Teacher signup UI" gap. New direction — not part of the redesign branch; will live on its own branch/PR.

**Epic spec:** [`docs/superpowers/specs/2026-05-30-school-tenancy-b2b-epic-design.md`](docs/superpowers/specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](docs/context/ADR-008-school-tenancy-and-role-hierarchy.md)

| # | Sub-project | Status | Spec |
|---|---|---|---|
| 1 | Tenancy + role foundation (`schools` collection, `super_admin`/`school_admin` roles, `schoolId`, seeded super-admin, super-admin backend, `TenantGuard`, tests — **no UI**) | **SPEC DONE — planning next** | [foundation](docs/superpowers/specs/2026-05-30-school-tenancy-foundation-design.md) |
| 2 | Super-admin console (create/suspend schools; edit subscription, seats, keys; create school admins; usage) | NOT WRITTEN | — |
| 3 | School-admin console (add/list/deactivate teachers in own school) | NOT WRITTEN | — |
| 4 | Seat/license enforcement + rollup + enrollment (incl. school-consent COPPA path) | NOT WRITTEN | — |
| 5 | B2B subscriptions / billing / key rotation (intersects `STRIPE-001`) | NOT WRITTEN | — |

---

## Recent decisions (ADRs)

| ADR | Decision | Date | File |
|---|---|---|---|
| 008 | Multi-tenant B2B school hierarchy: `super_admin`/`school_admin` roles; separate B2C/B2B trees; hybrid `schoolId`+counter tenancy; super-admin seed-only | 2026-05-30 | [ADR-008](docs/context/ADR-008-school-tenancy-and-role-hierarchy.md) |
| 007 | Server-side role derivation from `birthYear`; OAuth age-gate modal; teachers via separate flow | 2026-05-29 | [ADR-007](docs/context/ADR-007-server-side-role-derivation.md) |
| 006 | Kid signup flow: self-signup with age gate (13-16), under-13 deferred to Plan 3b COPPA pipeline | 2026-05-14 | [ADR-006](docs/context/ADR-006-kid-signup-flow.md) |
| 001-005 | Referenced but not on disk — may have been deleted in the Phase 16 revert or never written | — | — |

---

## How to use this doc

1. **Starting a new session?** Read this doc first, then the most recent handover in [`docs/superpowers/handover/`](docs/superpowers/handover/).
2. **About to start a new plan?** Add a row to Stream 2; write the plan into `docs/superpowers/plans/YYYY-MM-DD-...`; the plan doc carries its own task detail table (per-task SHAs land at execution time).
3. **Closed a ship-blocker?** Move it from Stream 3 to a "Done this sprint" log at the bottom.
4. **Discovered a gap not on this doc?** Add a row to Stream 4 (no plan yet) or Stream 5 (planning hygiene) so the next reader sees it.
5. **Updating phase status on `main`?** Update Stream 1 directly here — there's no separate task board anymore.

---

## Long-term direction (out of scope for current sprint)

**3D zombie-combat learning experience.** The product vision per spec §11 is a 3D battle layer where kids fight Babble Zombies using AI knowledge to progress through chapters. Phase 14-15 work is the foundation, parked in `_future_r3f/`. The 2D battle page at `/campaign/[slug]/battle/[missionId]` is designed to be cleanly replaceable when the 3D phase resumes. Hybrid combat trust model (client computes, server validates a play log — P3-07) is the seam that lets 3D drop in later without backend rewrites.

A separate future spec will cover the 3D resumption — picking up where Phase 15 left off, WebGL/three.js runtime decisions, asset pipeline, mobile performance budget, and the 2D→3D swap mechanics. Not part of the current sprint's deliverables.

---

*This is a living document. If a fact here is wrong or stale, the reader who notices it should fix it in the same PR they're already opening. Don't write a TODO for "update the roadmap"; just update it.*
