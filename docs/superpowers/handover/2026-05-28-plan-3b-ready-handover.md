# Plan 3a Complete + Plan 3b Ready — Eureka Lab Redesign Handover

> **Created:** 2026-05-28. Handover for starting a fresh session to **execute Plan 3b** (R5 follow-ups + learner persistence).
> **Trigger:** Plan 3a (adult-page re-skin) is DONE, smoke-tested by the user, and pushed. Plan 3b is **written, committed, pushed — but NOT executed**. The planning landscape was also consolidated into a single `ROADMAP.md` this session.
> **Supersedes:** [`2026-05-15-plan-2-complete-handover.md`](2026-05-15-plan-2-complete-handover.md) (for resume purposes; that doc remains accurate for everything up to Plan 2).

---

## TL;DR for the resuming agent

You are inheriting a branch where **Plans 1, 2, and 3a are DONE** and **Plan 3b is written and ready to execute**. Your job is to execute Plan 3b task-by-task.

**Resume by:**
1. Reading this doc.
2. Reading [`ROADMAP.md`](../../../ROADMAP.md) at the repo root — the **new single source of truth** for all planning (replaced the old `planning/task-board.md` + `planning/redesign-task-board.md`, which were deleted on 2026-05-15).
3. Reading the plan you're about to execute: [`docs/superpowers/plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md`](../plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md).
4. Invoking the **`superpowers:executing-plans`** skill (inline mode — the user's established preference) OR **`superpowers:subagent-driven-development`** if the user asks for it. Confirm which with the user first — Plan 3b is large (~40 tasks across 6 phases) and the user was offered both at write time but deferred the choice to execution start.
5. Running Plan 3b's Pre-flight section (5 steps) before touching any task.

**Do not start executing without confirming the execution mode with the user.**

---

## Repo + branch state

- **Working directory:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` (Vite + React, canonical visual source — DO NOT modify; mostly irrelevant for Plan 3b which is backend-heavy)
- **Current branch:** `redesign/v2-from-reference`
- **Tracking:** `origin/redesign/v2-from-reference` — **up to date** (all pushed)
- **HEAD:** `0228842 docs(superpowers): add Plan 3b detailed plan (R5 follow-ups + persistence)`
- **Draft PR:** https://github.com/katanaTech/eureka-lab/pull/8 (state: OPEN, isDraft: true, base: `main`)
- **Commits ahead of main:** 68

### Working tree (leave alone)

```
 M .claude/settings.local.json      ← local-only, gitignored-equivalent, don't stage
 M apps/web/tsconfig.tsbuildinfo     ← tsc artifact, don't stage
```

### Baseline health (verify these are unchanged before/after each task)

- `pnpm --filter @eureka-lab/web exec tsc --noEmit` → **24 errors** (all pre-existing test-file errors in `CelebrationOverlay.test.tsx`, `useMobileDetect.test.ts`, `usePullToRefresh.test.ts`, `usePushNotifications.test.ts` — predate the redesign).
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0 errors**.
- `pnpm --filter @eureka-lab/web lint` → **clean** ("No ESLint warnings or errors"). This was achieved this session by fixing P3a-N5/N6; keep it clean.

---

## What happened this session (2026-05-27 → 2026-05-28)

Starting from the Plan 2 complete state (`ef4752a`, 44 ahead of main), this session did:

1. **Plan 2 housekeeping** — gitignored smoke artifacts + per-machine Claude settings; committed the Plan 2 handover doc. (`dcebf0e`, `4197be5`)
2. **Plan 3a — adult-page re-skin (DONE).** Wrote + executed the full plan. 12 commits: `UserMenu` component, `(dashboard)/layout.tsx` fantasy chrome, deleted legacy `Navbar`/`Sidebar`/`ProtectedRoute`/`MobileRedirect`, re-skinned all 8 adult pages (`/parent`, `/teacher`, `/teacher/[classroomId]`, `/settings`, `/pricing`, `/achievements`, `/checkout/success`, `/checkout/cancel`). Plan doc: [`2026-05-15-redesign-plan-3a-adult-pages-reskin.md`](../plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md).
3. **Nit fixes (DONE)** — N1 (dashboard xp/level wired to gamification-store), N2 (campaign-card `next/image` fill+sizes), N3 (character-store rollback on PUT failure), P3a-N5 (renamed `useAbility`→`triggerAbility` to clear a rules-of-hooks lint error), P3a-N6 (escaped apostrophe). After these, **web lint is fully clean for the first time since Plan 2.**
4. **Planning consolidation (DONE)** — created [`ROADMAP.md`](../../../ROADMAP.md) at repo root as the single canonical planning doc. **Deleted** 5 stale `planning/` files: `bugs.md`, `blockers.md`, `sprint-01.md`, `task-board.md`, `redesign-task-board.md`. Kept `api-contracts.md` (OpenAPI ref) + `phase-15-combat-design.md` (3D resumption ref). Fixed inbound links in CLAUDE.md, `rules/qa-rules.md`, `api-contracts.md`. (`cb93b0d`)
5. **P3a-N7 role-aware routing fix (DONE)** — discovered during Plan 3a smoke: parents/teachers logging in were bounced through `/character` (Forge My Legend) because every post-auth redirect hardcoded `/dashboard`. Added `homeForRole()` helper in [`apps/web/src/lib/auth-redirects.ts`](../../../apps/web/src/lib/auth-redirects.ts) and fixed 5 sites (Welcome useEffect/login/Google-OAuth, SignupForm, `(learner)/layout.tsx`). (`1cf9efc`)
6. **Plan 3b written (DONE, NOT executed)** — the plan this handover hands off. (`0228842`)

### Plan 3a smoke test — PASSED (user-driven, 2026-05-28)

The user ran the Plan 3a Phase C.1 smoke manually and **confirmed it passed**. All 8 adult routes render in fantasy chrome; role-aware routing works (parent → `/parent`, teacher → `/teacher`); sign-out returns to `/`; anonymous visits bounce to `/`. **Plan 3a is fully accepted — no follow-up `fix(plan-3a):` commits needed.**

> Note: teacher accounts have no signup UI yet (backend accepts `role: 'teacher'` but nothing sends it). For smoke, teachers are created via a direct API call:
> ```powershell
> $body = @{ email="teacher@example.com"; password="Smoke1234"; displayName="Smoke Teacher"; role="teacher" } | ConvertTo-Json
> Invoke-RestMethod -Uri "http://localhost:3011/api/v1/auth/signup" -Method POST -ContentType "application/json" -Body $body
> ```
> **⚠️ Plan 3b Phase A changes the signup contract** — after A.1, `/auth/signup` takes `birthYear` not `role`, and teachers can no longer be created this way. If you need a fresh teacher account mid-Plan-3b, create it BEFORE executing Phase A, or seed it directly in Firestore. "Teacher signup UI" remains an open ROADMAP Stream 4 gap.

---

## What Plan 3b does (the work to execute)

**Plan 3b = R5 follow-ups + learner persistence.** Resolves **P3-14, P3-15, P3-16, P3-17, P3-18**. Six phases:

| Phase | Scope | Resolves | Notes |
|---|---|---|---|
| A | Server-side role derivation from `birthYear` | P3-14 | Drops client-trusted `role` from `SignupDto`; server computes role; +unit tests |
| B | Google OAuth age gate | P3-15 | `OAuthBirthYearModal` + `POST /auth/complete-oauth-signup` |
| C | Under-13 COPPA confirmation pipeline | P3-16 | **Biggest phase (~12 tasks).** New `email` (Resend) + `coppa` modules; pending-account → parent email → confirm → audit log; `/confirm-parent/[token]` page |
| D | KP-credit endpoints | P3-17 | Exposes the already-implemented `InventoryService.awardKp` via `POST /inventory/credit-kp` + idempotency; wires lesson/video/battle |
| E | Persistent academy progress | P3-18 | New `academy-progress` backend module + Firestore-backed store (replaces in-memory) |
| F | Smoke + ROADMAP update + ADR-007 | — | User-driven smoke; mark Plan 3b DONE; write ADR-007 |

**New backend modules Plan 3b creates:** `apps/api/src/modules/{email,coppa,academy-progress}/`.

**New dependency:** Plan 3b C.2 runs `pnpm --filter @eureka-lab/api add resend`. The `EmailService` falls back to console-log when `RESEND_API_KEY` is unset, so the COPPA flow works end-to-end in local dev without a Resend account.

**Explicitly deferred (NOT in Plan 3b):** P3-07 hybrid combat validation — gets its own plan when anti-cheat pressure shows up. Combat already functions optimistically.

---

## Critical gotchas for Plan 3b specifically

1. **🔥 Phase E.1 edits `packages/shared-types`.** After adding the `AcademyProgress` type, you MUST run `pnpm --filter @eureka-lab/shared-types build` or the NestJS runtime crashes with `SyntaxError: Unexpected token 'export'`. The plan includes this step — don't skip it.

2. **🔥 Phase A changes a public contract.** `SignupDto` goes from `{ email, password, displayName, role }` to `{ email, password, displayName, birthYear }`. The frontend `authApi.signup` type AND its two callers (Welcome `page.tsx`, `SignupForm.tsx`) must all change together (Tasks A.4, A.5) or the build breaks. Plan sequences these correctly.

3. **`homeForRole()` already exists** at `apps/web/src/lib/auth-redirects.ts` (added this session for P3a-N7). Plan 3b reuses it in A.5 and B.3 — don't recreate it.

4. **`InventoryService.awardKp(userId, event)` already exists** with daily-cap enforcement (`apps/api/src/modules/inventory/inventory.service.ts:213`). Plan 3b D.1 just wraps it with idempotency + a controller endpoint. `KP_REWARDS` and `DAILY_KP_CAP` live in `apps/api/src/modules/inventory/kp-rewards.ts`.

5. **`useGame()` has explicit `TODO(plan-3)` markers** at the lesson/video persistence sites (`apps/web/src/state/game-context.tsx:135,141`). Plan 3b D.2 + E.4 replace those. Grep for `TODO(plan-3)` to confirm you got them all.

6. **COPPA flow does NOT store the kid's password** (design decision made during plan self-review). The under-13 form doesn't collect a password; at parent-confirmation the backend creates the account with a random password + generates a Firebase reset link (logged server-side). The kid sets their real password via "Forgot password?" on first login. This is a known UX rough edge flagged in Plan 3b F.1 Step 5 — a follow-up plan can email the reset link directly.

7. **Plan 3b C.7 + A.3 add Jest tests.** Run `pnpm --filter @eureka-lab/api test` after those phases. The existing spec files use specific mock variable names (`firebaseAuthMock`, `usersRepositoryMock`) — read the existing `auth.service.spec.ts` `beforeEach` and match them, as the plan notes.

---

## Carried-over gotchas (still true, from prior handovers)

1. **This repo is Next.js 14.2.35, NOT 15.** Dynamic-route `params` are **synchronous** — type as `params: { token: string }`, destructure directly. Do NOT use `params: Promise<…>` + `use()`. (Plan 3b C.6's `/confirm-parent/[token]` page follows the sync form.)
2. **Don't call `router.replace()` during render** — wrap in `useEffect`. (Plan 3b's modals/pages follow this.)
3. **Tailwind v4, NOT v3.** No `tailwind.config.ts`; config lives in `apps/web/src/app/globals.css` under `@theme inline`.
4. **`shared-types` needs dual-resolution exports** — `node` condition → `./dist/index.js`. Rebuild after editing (see gotcha #1 above).
5. **`useAuthStore.user` is `UserProfile`** (has `role`, `displayName`, `email` as non-nullable strings), not Firebase `User`.
6. **Sonner toaster is mounted in `app/page.tsx`** (Welcome), not the root layout.
7. **Don't modify files under `docs/superpowers/`** — plans, specs, handovers are append-only. Record ongoing status in `ROADMAP.md` instead. (This handover is new; future agents shouldn't edit it.)
8. **Don't delete `_future_r3f/`** — 27 parked R3F components for the future 3D phase (ROADMAP §long-term).

---

## User preferences (carried over — confirmed this session)

- **Push timing:** push only when explicitly told. Every push this session was individually approved. Continue asking.
- **Update cadence:** brief. Report at phase boundaries, not between every task.
- **Smoke testing:** **user-driven.** The user runs smoke manually (they ran Plan 3a's and confirmed it passed). Do NOT auto-run Playwright smoke unless explicitly asked. Plan 3b Phase F.1 is written as a user-driven checklist.
- **Commit granularity:** one commit per task (the plans are structured this way). Conventional-commit style (`feat(scope):`, `fix(scope):`, `docs(...)`, `test(...)`, `chore(...)`).
- **Execution mode:** inline with phase checkpoints worked well for Plans 2 + 3a. Default to that unless the user asks for subagent-driven. **Confirm at start** because Plan 3b is large.
- **Commit message footer:** `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

---

## Pre-flight (run before executing Plan 3b — also in the plan itself)

```powershell
git status -sb                              # Expect: branch up to date with origin, only settings.local.json + tsbuildinfo modified
git rev-parse --abbrev-ref HEAD             # Expect: redesign/v2-from-reference
git log --oneline -1                        # Expect: 0228842 docs(superpowers): add Plan 3b detailed plan ...
git rev-list --count main..HEAD             # Expect: 68
gh pr view 8 --json state,isDraft           # Expect: state=OPEN, isDraft=true
ls infrastructure/firebase/firestore.rules  # Expect: exists (Plan 3b adds 3 new Firestore collections)
```

Then confirm baseline error counts (web tsc 24, api tsc 0, web lint clean) per the "Baseline health" section above, and confirm dev servers start (web 3010, api 3011).

---

## Where to find things

- **Canonical planning entry point:** [`ROADMAP.md`](../../../ROADMAP.md) (repo root) — 5 streams: pre-redesign phases, redesign plans, ship-blockers, architectural gaps, planning hygiene.
- **Plan to execute:** [`docs/superpowers/plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md`](../plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md)
- **Plan 3a (reference for the re-skin pattern + smoke):** [`2026-05-15-redesign-plan-3a-adult-pages-reskin.md`](../plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md)
- **ADR-006 (kid signup decision — Plan 3b ships its deferred slice):** [`docs/context/ADR-006-kid-signup-flow.md`](../../context/ADR-006-kid-signup-flow.md)
- **Redesign spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md)
- **Env vars (Plan 3b C.1 documents RESEND_API_KEY here):** [`docs/context/env-variables.md`](../../context/env-variables.md)
- **CLAUDE.md (project rules — read first):** [`CLAUDE.md`](../../../CLAUDE.md)
- **Phase-15 combat design (for the deferred P3-07 + future 3D):** [`planning/phase-15-combat-design.md`](../../../planning/phase-15-combat-design.md)

---

## After Plan 3b

Per ROADMAP Stream 2, what remains:
- **Plan 3c (polish)** — i18n re-key (P3-08/09), Arabic font (P3-10), E2E rewrite (P3-11), retire `useMobileDetect` (P3-12), PWA/Sentry verify (P3-13), `AiTutorChat.chapterName` (P3-19), feature-component re-skin (P3a-N1), hardcoded English (P3a-N2), `(dashboard)/learn/*` decision (P3a-N3), `ui-store.sidebarOpen` prune (P3a-N4). NOT written.
- **Plan TBD** — P3-07 hybrid combat validation. NOT written.
- **ROADMAP Stream 3 ship-blockers** — Stripe webhooks, broader COPPA audit, prod env vars, test coverage, security/a11y/perf. Untouched; block production launch.
- **Teacher signup UI** — ROADMAP Stream 4 gap; ~3-5 tasks; could fold into Plan 3c.

---

*Handover authored 2026-05-28 at the seam between Plan 3a (DONE + smoke-passed + pushed) and Plan 3b (WRITTEN + pushed + UNEXECUTED). Supersedes [`2026-05-15-plan-2-complete-handover.md`](2026-05-15-plan-2-complete-handover.md) for resume purposes.*
