# B2B Sub-project 3 (School-Admin Console) — Ready to Execute — Handover

> **Created:** 2026-05-30. For the next session.
> **State at handoff:** The B2B School-Tenancy epic's **sub-projects 1 & 2 are DONE and pushed** (PRs #9, #10). **Sub-project 3 (school-admin console) is fully spec'd + planned and committed** on branch `feat/school-admin-console`. **No code from sub-project 3 has been written yet.** Your job: **execute the plan inline** (the user chose inline execution, then asked to hand off to a fresh session).

---

## TL;DR for the resuming agent

1. Read this doc, then the **plan** you're about to execute: [`docs/superpowers/plans/2026-05-30-school-tenancy-schooladmin-console-plan.md`](../plans/2026-05-30-school-tenancy-schooladmin-console-plan.md).
2. Skim the **spec**: [`docs/superpowers/specs/2026-05-30-school-tenancy-schooladmin-console-design.md`](../specs/2026-05-30-school-tenancy-schooladmin-console-design.md), and [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md) for the locked architecture.
3. Confirm you're on branch **`feat/school-admin-console`** (already created, off `feat/school-superadmin-console`).
4. Invoke the **`superpowers:executing-plans`** skill and work the 11 tasks **inline with phase checkpoints** (backend T1–T6, then frontend T7–T10, then T11). The plan is bite-sized TDD; follow it exactly.
5. When done, use **`superpowers:finishing-a-development-branch`**. The user pushes via **option 2 (push + PR)** but **only on explicit approval** — do not push unprompted.

---

## 1. Repo + branch state

- **Working dir:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Current branch:** `feat/school-admin-console` (HEAD `87c1ae7` — the plan commit).
- **Branch stack (each stacked on the previous):**
  - `feat/school-tenancy` (sub-project 1 foundation) → **PR #9**, base `redesign/v2-from-reference`.
  - `feat/school-superadmin-console` (sub-project 2) → **PR #10**, base `feat/school-tenancy`.
  - `feat/school-admin-console` (sub-project 3, THIS one) → **no PR yet**, will base on `feat/school-superadmin-console`.
- **Working tree — leave alone (do not stage/commit):**
  ```
  M .claude/settings.local.json
  M apps/web/tsconfig.tsbuildinfo
  ```
- **PR-merge ordering note:** #9 → then #10 → then this one. GitHub auto-retargets a stacked PR's base when its parent merges. Nothing to do now; just don't merge out of order.

### Baseline health (verify before Task 1 — this is the plan's pre-flight)
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0 errors**
- `pnpm --filter @eureka-lab/api exec jest --runInBand` → **30 suites / 295 tests pass**
- `pnpm --filter @eureka-lab/web lint` → **clean**
- `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → **24** (pre-existing test-file errors; not regressions)

---

## 2. What you're building (sub-project 3)

A **school admin** manages **teachers** in their own school. Backend adds `/schools/:id/teachers` (create / list / deactivate-reactivate), gated by **`TenantGuard`** — its **first live use** (built + unit-tested in the foundation, never wired to a route until now). Frontend adds the `/school` console (replacing the placeholder). Deactivate = Firebase `disabled:true` + an `active:false` flag on the user doc (reversible). Also a small prerequisite: **`getMe`/`login` now return `schoolId`** so the frontend knows which school the admin manages.

The 11 tasks, in order: `SchoolTeacherSummary` type (T1) → auth profile `schoolId` (T2) → users-repo `active`/`findTeachersBySchool`/`setActive` (T3) → teacher DTOs (T4) → `SchoolTeachersService` (T5) → `SchoolTeachersController` + module wiring (T6) → `schoolsApi` teacher methods (T7) → `SchoolAdmin` i18n en/fr/ar (T8) → table+dialog components (T9) → `/school` page (T10) → final verification + ROADMAP (T11).

---

## 3. Conventions & gotchas (must follow)

1. **API test command:** `pnpm --filter @eureka-lab/api exec jest --runInBand [optional/path]`. **Do NOT** use `... test -- --runInBand` — the double `--` is forwarded to jest and turns `--runInBand` into a (zero-match) test pattern. Single suite: append the spec path.
2. **API tests OOM in parallel** — always `--runInBand`. `NODE_OPTIONS=--max-old-space-size=6144` if it still OOMs.
3. **Rebuild shared-types after editing** `packages/shared-types/src/index.ts`: `pnpm --filter @eureka-lab/shared-types build`. Its `dist/` is **gitignored** — commit only `src/` (don't `git add dist`).
4. **Commit footer (every commit):** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task; conventional-commit subjects (the plan gives exact messages).
5. **Bash heredoc for commit messages** (this repo's Bash tool is bash, not PowerShell): `git commit -F - <<'EOF' … EOF`. The PowerShell `@'…'@` here-string fails in the Bash tool.
6. **Sonner toasts are broken app-wide** (deferred bug — ROADMAP Stream 4). All UI feedback in this slice is **inline** (local state), never `toast()`. The plan's components already do this.
7. **Next.js 14.2, not 15** — dynamic-route `params` are **synchronous** (`params.id`).
8. **Tailwind v4** — tokens live in `apps/web/src/app/globals.css` under `@theme inline`. Valid tokens used here: `bg-card`, `text-destructive`, `text-muted-foreground`, `border-border`, `bg-background`, `text-foreground`, `text-primary`, `ring`. `GameButton` variants are **`primary | gold | ghost | danger`** (no `secondary`).
9. **Web `tsc` has 24 pre-existing test-file errors.** Success criterion for every frontend task is the count **stays 24** (no new errors), not zero.
10. **Frontend has no unit tests in this slice** (the web test harness is shaky; E2E rewrite is a separate Plan 3c item). Frontend verification = lint + tsc + a **user-driven smoke**. The **backend carries the ≥80% coverage DoD bar** (schools module).
11. **Controller specs** must `.overrideGuard(...)` every guard the controller uses, or Nest tries to resolve guard deps and the suite fails to instantiate. T6's controller uses **three** guards — override `FirebaseAuthGuard`, `RolesGuard`, **and `TenantGuard`** (the plan's test already does this).

---

## 4. Two deviations the prior session made while executing earlier slices (FYI — same kinds may recur)

- When a plan's test code had a TS error (e.g. an over-narrow `as { … }` cast on a mock), the fix was to **add the method to the shared mock object** and assert directly. Prefer that over fighting the cast.
- When backend coverage dipped below 80% because a thin controller had no spec, the prior session **added a controller spec** (not in the plan) to meet DoD. T6 already includes a controller spec, so this should be covered — but if the final coverage check (T11 Step 2) is under 80%, add focused specs for the uncovered lines rather than waving it through.

These are judgment calls the user explicitly appreciated ("I'm stopping/adjusting, here's why" over silent drift). Announce any deviation briefly.

---

## 5. Definition of Done (from the plan / CLAUDE.md)

- `SchoolTeacherSummary` added + shared-types rebuilt; `getMe`/`login` return `schoolId`.
- 3 endpoints (`POST`/`GET` `/schools/:id/teachers`, `PATCH /schools/:id/teachers/:teacherId`) with `TenantGuard` + `@Roles('school_admin','super_admin')`, all with passing unit tests.
- `active` flag + `findTeachersBySchool` + `setActive` on `UsersRepository`, tested.
- `/school` console gated by `RoleGate allow={['school_admin']}`, functional (loading/empty/error states), inline feedback.
- `SchoolAdmin` i18n keys in **all three** locales (en/fr/ar).
- api: `tsc` 0 errors, full suite green, **schools module ≥80% coverage**. web: lint clean, `tsc` still 24.
- `ROADMAP.md` Stream 6 sub-project-3 row flipped to DONE (T11 gives the exact row text).

---

## 6. After this slice (not your job unless the user asks)

Remaining epic sub-projects (see [epic spec](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) / ROADMAP Stream 6):
- **4** — Seat/license enforcement + classroom rollup + **enrollment** (incl. school-consent COPPA path).
- **5** — B2B subscriptions / billing / secret-key rotation (intersects the open `STRIPE-001` blocker).

When sub-project 3 finishes, offer to brainstorm sub-project 4 next (the established cycle: brainstorm → spec → plan → inline execute, each on a new stacked branch).

---

## 7. User preferences (current as of 2026-05-30)

- **Push timing:** every push individually approved. **Never push without being told.** Pattern so far: finish → `finishing-a-development-branch` → user picks "push and create a PR".
- **Branching:** each sub-project gets its **own stacked branch** off the previous, with its **own PR** (keeps each PR reviewable).
- **Execution mode:** inline with phase checkpoints (worked for sub-projects 1 & 2).
- **Commit granularity:** one commit per task; conventional commits.
- **Updates:** brief; report at phase boundaries, not every task.
- **Smoke testing:** user-driven — hand them a short smoke brief rather than running Playwright autonomously.

---

## 8. Where to find things

- **Plan to execute:** [`docs/superpowers/plans/2026-05-30-school-tenancy-schooladmin-console-plan.md`](../plans/2026-05-30-school-tenancy-schooladmin-console-plan.md)
- **This slice's spec:** [`docs/superpowers/specs/2026-05-30-school-tenancy-schooladmin-console-design.md`](../specs/2026-05-30-school-tenancy-schooladmin-console-design.md)
- **Epic spec:** [`docs/superpowers/specs/2026-05-30-school-tenancy-b2b-epic-design.md`](../specs/2026-05-30-school-tenancy-b2b-epic-design.md)
- **Foundation spec/plan (sub-project 1, DONE):** [`…-foundation-design.md`](../specs/2026-05-30-school-tenancy-foundation-design.md) · [`…-foundation-plan.md`](../plans/2026-05-30-school-tenancy-foundation-plan.md)
- **Super-admin console spec/plan (sub-project 2, DONE):** [`…-superadmin-console-design.md`](../specs/2026-05-30-school-tenancy-superadmin-console-design.md) · [`…-superadmin-console-plan.md`](../plans/2026-05-30-school-tenancy-superadmin-console-plan.md)
- **ADR-008 (tenancy/roles):** [`docs/context/ADR-008-school-tenancy-and-role-hierarchy.md`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
- **Canonical state:** [`ROADMAP.md`](../../../ROADMAP.md) Stream 6.
- **Project rules (read first):** [`CLAUDE.md`](../../../CLAUDE.md).

---

*Handover authored 2026-05-30 at the seam between sub-project 3 being planned and being executed. The plan is complete and committed; the next session executes it inline.*
