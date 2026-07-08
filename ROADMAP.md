# Eureka Lab — Roadmap

> **Single canonical view of where we are and what's next.** Updated whenever a phase / plan changes state. If anything in this doc disagrees with what's in code, code wins — file an update.
>
> **Last updated:** 2026-07-08
> **Next review:** weekly (every Wednesday)
> **Maintainer:** whoever last touched a major plan

For product context (mission, 4-level curriculum, hardcoded rules), see [CLAUDE.md](CLAUDE.md). For development standards, see [`rules/{backend,frontend,devops,qa}-rules.md`](rules/).

---

## TL;DR

Eureka Lab is an AI-literacy SaaS for kids 8-16. The product shipped through Phase 14 on `main`; Phase 15 (3D combat) backend is done but frontend was reverted and parked. Starting from a reference-project redesign (Stream 2, now DONE) the current branch (`feat/school-b2b-usage-analytics`, PR #16, 202 commits ahead of `main`) went on to deliver the full B2B school-tenancy epic (Stream 6, sub-projects 1–5b, **DONE 2026-06-06**). A 2026-07-08 audit confirmed both the B2C learner product and the B2B school product are code-complete, tested, and building cleanly — **see "Current branch state" below**.

Redesign sub-plans (Stream 2):
- **Plan 1** (foundation + learner shell): **DONE**
- **Plan 2** (campaign + combat + inventory + shop + victory): **DONE**
- **Plan 3a** (adult-page re-skin): **DONE** (2026-05-15)
- **Plan 3b** (backend persistence + R5 COPPA follow-ups): **DONE** (2026-05-29)
- **Plan 3c** (i18n + RTL + E2E + polish): **NOT WRITTEN** — folded into the post-landing sequence below

**Not shipping yet.** Decided sequence as of 2026-07-08 (see Stream 7): (1) marketing landing app (own workspace app, ported from the `ai-adventure-island` reference) → (2) i18n translation update (fr/ar) → (3) test coverage → (4) commit hygiene. The 8 HIGH-priority ship-blockers (Stream 3: Stripe webhooks, COPPA review, prod env vars, tests, i18n, security, a11y, perf) are **deliberately pushed forward** until after this sequence.

---

## Current branch state

| Item | Value |
|---|---|
| Branch | `feat/school-b2b-usage-analytics` (this is the real production line — see note below) |
| PR | [#16](https://github.com/katanaTech/eureka-lab/pull/16) (OPEN, checks passing) |
| Commits ahead of `main` | 202 |
| HEAD | `3b0e87c` |
| Latest plan landed | B2B 5b (super-admin usage analytics) — **DONE 2026-06-06**, epic delivered |
| Next up | Marketing landing app (Stream 7, NEW) → i18n update → test coverage → commit hygiene. Ship-blockers (Stream 3) deliberately pushed forward — **not shipping yet**. |
| Full audit | 2026-07-08 — backend 42/42 suites (419/419 tests), web unit 12/12 files (88/88 tests), e2e auth-flows 21/21 runnable (6 skipped, need creds), full `pnpm build` 5/5 tasks clean. B2C + B2B both confirmed code-complete and working. |
| TypeScript / Lint | web: ✅ clean / api: ✅ (see audit above) |
| Known open bugs | none blocking; **app-wide Sonner toast failure** (Stream 4 — auth path covered by inline alert); a `.gitignore` bug means `apps/web/public/{sw.js,fallback-*.js}` dirty on every build (PWA patterns are anchored to a repo-root `public/` that doesn't exist — real one is `apps/web/public/`) |

**`main` vs this branch (resolved 2026-07-08):** PR #7 "Phase 16 fantasy UI" merged into `main`, then was reverted almost immediately on the line that became this branch, which built an independent redesign (Stream 2) + the B2B epic (Stream 6) instead. `main` kept building on the *reverted* architecture independently (still received "Phase 16 Sprint C" commits through 2026-07-07) and has no bearing on this work — treat it as a separate, abandoned line for all purposes on this branch.

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
| STRIPE-001 | Stripe webhook handler for `subscription.updated` + `payment_failed`. **Update 2026-06-03:** the consumer handlers + signature verification are **code-complete and tested** (`apps/api/src/modules/payments/`; confirmed during B2B 5a, which rides the same webhook). The real remainder is **prod webhook-secret verification** (`STRIPE_WEBHOOK_SECRET` in the live env) — folds into `DEPLOY-001`, not a code blocker. | Critical |
| COPPA-001 | Compliance review for new data paths (classrooms, notifications, game progress). Plan 3b's P3-16 covers a slice; broader audit unowned. | Critical |
| DEPLOY-001 | Production env var setup (Stripe / FCM / Sentry keys not confirmed in Railway/Vercel prod). **Update 2026-06-06:** 5b adds the first Firestore composite index (`infrastructure/firebase/firestore.indexes.json` — `users`: schoolId+role+lastActiveDate); deploy with `firebase deploy --only firestore:indexes` or the active-students count in the super-admin analytics errors until the index is live. | Critical |
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
| 1 | Tenancy + role foundation (`schools` collection, `super_admin`/`school_admin` roles, `schoolId`, seeded super-admin, super-admin backend, `TenantGuard`, tests — **no UI**) | **DONE** (`feat/school-tenancy`, 2026-05-30; api 30 suites/288 tests, new code ~91% cov) | [foundation](docs/superpowers/specs/2026-05-30-school-tenancy-foundation-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-foundation-plan.md) |
| 2 | Super-admin console (Core: list/create/detail/suspend schools, edit seat limit, create + list school admins; subscription/key editing + usage deferred to sub-project 5) | **DONE** (`feat/school-superadmin-console`, 2026-05-30; api 30 suites/295 tests, schools module ~92% cov) | [console](docs/superpowers/specs/2026-05-30-school-tenancy-superadmin-console-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-superadmin-console-plan.md) |
| 3 | School-admin console (manage teachers: create / list / deactivate-reactivate; TenantGuard's first live route) | **DONE** (`feat/school-admin-console`, 2026-05-30) | [console](docs/superpowers/specs/2026-05-30-school-tenancy-schooladmin-console-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-schooladmin-console-plan.md) |
| 4a | School student enrollment + seat enforcement + school-consent COPPA (username/synthetic-email login, transactional seats, per-student under-13 audit) | **DONE** (`feat/school-student-enrollment`, 2026-05-31; api 35 suites/339 tests, schools module ~93% cov) | [enrollment](docs/superpowers/specs/2026-05-31-school-tenancy-student-enrollment-design.md) · [plan](docs/superpowers/plans/2026-05-31-school-tenancy-student-enrollment-plan.md) |
| 4b | Classroom→school rollup (read-only school-admin tab) + teacher roster assignment + roster source + same-school join hardening; classroom `schoolId` stamping (super-admin usage views deferred to 5) | **DONE** (`feat/school-classroom-rollup`, 2026-06-02; api 37 suites/363 tests, classrooms ~95% / schools ~92% cov) | [rollup](docs/superpowers/specs/2026-05-31-school-tenancy-classroom-rollup-design.md) · [plan](docs/superpowers/plans/2026-05-31-school-tenancy-classroom-rollup-plan.md) |
| 5a | B2B subscriptions / billing — per-seat on `seatLimit`, super-admin invoice-collected setup + school-admin Customer Portal, seatLimit-change proration, webhook status sync (status tracked, never auto-locks). **Key rotation + super-admin usage analytics deferred to a future 5b.** | **DONE** (`feat/school-b2b-billing`, 2026-06-03; api 40 suites/409 tests, school-billing service ~93% cov) | [billing](docs/superpowers/specs/2026-06-02-school-tenancy-billing-design.md) · [plan](docs/superpowers/plans/2026-06-02-school-tenancy-billing-plan.md) |
| 5b | Super-admin usage analytics — platform overview tiles + enriched schools table (seat utilization, roster counts, billing-status mix, active students); current-state, on-demand `count()` aggregation, no time-series. **Secret-key rotation deferred again** (still no feature consumes a school key). | **DONE** (`feat/school-b2b-usage-analytics`, 2026-06-06; api 42 suites/419 tests, school-analytics service 100% cov) | [analytics](docs/superpowers/specs/2026-06-03-school-tenancy-usage-analytics-design.md) · [plan](docs/superpowers/plans/2026-06-03-school-tenancy-usage-analytics-plan.md) |

**B2B epic delivered (2026-06-06).** Sub-projects 1–5b are DONE. The only parked item is **secret-key rotation**, awaiting a feature that actually consumes a school key (e.g. coded student self-enroll or an SSO/roster-sync API) — revisit then.

---

## Stream 7 — Post-B2B sequence: Landing app → i18n → test coverage → commit hygiene (NEW 2026-07-08)

With B2C and B2B both confirmed working (2026-07-08 audit — see "Current branch state"), work continues in this explicit order before touching the Stream 3 ship-blockers. **Not shipping yet** — this is polish/completeness work, decided directly with the user.

| # | Item | Status | Plan / spec |
|---|---|---|---|
| 1 | Marketing landing app (`apps/landing`, new workspace app) — imports `Landing.tsx` from the `ai-adventure-island-new` reference (separate repo, not a workspace member), promotes `GameButton`/`Logo`/theme tokens from `apps/web` into `packages/ui` so both apps share one design system, CTAs link to `apps/web` via `NEXT_PUBLIC_APP_URL`. Includes an explicit run-and-compare pass against the Lovable reference before calling it done. | **IN PROGRESS** (worktree `.worktrees/landing-app`, branch `feat/landing-app`, subagent-driven execution) | [design](docs/superpowers/specs/2026-07-07-landing-app-scaffold-design.md) · [plan](docs/superpowers/plans/2026-07-07-landing-app-scaffold-and-import.md) |
| 2 | i18n translation update — French + Arabic coverage (overlaps Stream 3 I18N-001 and Stream 2 Plan 3c P3-08/09) | **NOT STARTED** — plan when we get here | — |
| 3 | Test coverage — Phases 6–15 modules toward 80%+ (Stream 3 QA-001), broader E2E beyond the auth-flows slice added 2026-07-08 | **NOT STARTED** — plan when we get here | — |
| 4 | Commit hygiene — fix the `.gitignore` PWA-path bug (see "Current branch state"), review `planning/api-contracts.md` staleness (Stream 5) | **NOT STARTED** — plan when we get here | — |

**After this sequence:** return to Stream 3 (ship-blockers) before any production release.

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
