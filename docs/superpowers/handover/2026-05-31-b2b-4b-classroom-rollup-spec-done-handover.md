# B2B Sub-project 4b (Classroom Rollup) — Spec Done, Plan Next — Handover

> **Created:** 2026-05-31. For the next session.
> **State at handoff:** The B2B epic's slices **1, 2, 3, and 4a are DONE and pushed** (PRs #9–#12). **Sub-project 4b is brainstormed; its spec is approved and committed.** **No plan and no code exist yet.** Your job: **write the implementation plan, then execute it** — the established cycle (spec → `writing-plans` → subagent-driven execution).

---

## TL;DR for the resuming agent

1. Read this doc, then the **approved spec**: [`docs/superpowers/specs/2026-05-31-school-tenancy-classroom-rollup-design.md`](../specs/2026-05-31-school-tenancy-classroom-rollup-design.md). It is the source of truth.
2. Skim the **epic** [`…-b2b-epic-design.md`](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) and [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md) for the locked tenancy architecture.
3. You are on branch **`feat/school-student-enrollment`** (4a, pushed, PR #12). The 4b spec is committed here (`0edeae7`). **Create a new stacked branch `feat/school-classroom-rollup` off it before Task 1.**
4. Invoke **`superpowers:writing-plans`** to turn the spec into a bite-sized TDD plan (save to `docs/superpowers/plans/2026-05-31-school-tenancy-classroom-rollup-plan.md`). Then execute with **`superpowers:subagent-driven-development`** (the user's chosen mode for 4a — fresh subagent per task, two-stage spec+quality review).
5. When done, use **`superpowers:finishing-a-development-branch`**. The user pushes via **option 2 (push + PR, base `feat/school-student-enrollment`)** but **only on explicit approval** — never push unprompted.

---

## 1. Repo + branch state

- **Working dir:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Current branch:** `feat/school-student-enrollment` (HEAD `0edeae7` — the 4b spec commit).
- **Branch stack (each stacked on the previous, own PR):**
  - `feat/school-tenancy` → **PR #9** (foundation)
  - `feat/school-superadmin-console` → **PR #10**
  - `feat/school-admin-console` → **PR #11** (manage teachers)
  - `feat/school-student-enrollment` → **PR #12** (4a: student enrollment + seats + COPPA)
  - `feat/school-classroom-rollup` (4b, THIS one) → **no branch/PR yet**, base on `feat/school-student-enrollment`.
- **Working tree — leave alone (do not stage/commit):**
  ```
  M .claude/settings.local.json
  M apps/web/tsconfig.tsbuildinfo
  ```
- **PR-merge ordering:** #9 → #10 → #11 → #12 → then 4b. GitHub auto-retargets a stacked PR's base when its parent merges.

### Baseline health (verify before Task 1 — the plan's pre-flight)
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0 errors**
- `pnpm --filter @eureka-lab/api exec jest --runInBand` → **35 suites / 340 tests pass**
- `pnpm --filter @eureka-lab/web lint` → **clean**
- `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → **24** (pre-existing test-file errors; not regressions)

---

## 2. What you're building (4b) — from the spec

Connect 4a's school students to classrooms and roll classrooms up to the school. Four capabilities:
1. **`schoolId` on `ClassroomDocument`** (denormalized, ADR-008 pattern), stamped at creation from the teacher's token claim. B2C classrooms stay `schoolId`-less.
2. **Teacher roster assignment** — `POST /classrooms/:id/students` (`@Roles('teacher')`) adds active `child` students of the **same school** to the teacher's own class (ownership + same-school + `maxStudents` enforced). Removal already exists (`DELETE /classrooms/:id/students/:studentId`).
3. **Teacher roster source** — `GET /classrooms/roster` (`@Roles('teacher')`) returns the caller-teacher's school's active students (`SchoolStudentSummary[]`) for the assignment picker. Empty for a school-less (B2C) teacher.
4. **School-admin rollup** — `GET /schools/:id/classrooms` (`@Roles('school_admin','super_admin')` + `TenantGuard`) returns `SchoolClassroomSummary[]` (name · teacher name · student count).

Plus **join-code hardening**: `POST /classrooms/join` gains a guard — if the matched classroom has a `schoolId`, the joining child's `schoolId` must match (`403 CROSS_SCHOOL_JOIN`); B2C classes unchanged.

**Frontend:** teacher class-detail (`/teacher/[classroomId]`) gets an **Add students** picker (shown only when `user.schoolId` is set); `/school` console gets a read-only **Classrooms** tab. `SchoolClassrooms` i18n en/fr/ar.

**Explicitly out of 4b:** super-admin usage views / usage-over-time analytics (→ sub-project 5), admin-side class creation, bulk/CSV, coded self-enroll into school classes.

---

## 3. Implementation pointers (read these existing files when planning)

- **Classrooms module:** `apps/api/src/modules/classrooms/{classrooms.controller,classrooms.service}.ts` (+ specs), `dto/{create-classroom,join-classroom}.dto.ts`. `ClassroomsController` uses `@UseGuards(FirebaseAuthGuard, RolesGuard)` (NO TenantGuard — it's teacher/child scoped by ownership). `ClassroomsService` has `createClassroom(teacherId, name)`, `joinClassroom(studentId, joinCode)`, `removeStudent`, `getOwnedClassroom` (ownership check), `getTeacherClassrooms`, `getClassroomDetail`.
- **Schools module (4a, the template for new tenant-scoped code):** `school-students.{service,controller}.ts` show the `TenantGuard` + `@Roles` + 3-guard-override-in-spec pattern, and how to resolve user docs to summaries. The admin-rollup endpoint (`GET /schools/:id/classrooms`) belongs on a controller in the schools module (mirror `SchoolStudentsController`), or extend an existing one — your call when planning.
- **Types:** `packages/shared-types/src/index.ts` has `ClassroomDocument` (add `schoolId?`), `ClassroomSummary`, `SchoolStudentSummary`. Add `SchoolClassroomSummary`.
- **Current-user / claims:** `@CurrentUser() user: AuthenticatedUser` carries `uid`, `role`, `schoolId` (teachers minted in slice 3 get the `schoolId` claim). `createClassroom` must thread `user.schoolId`.
- **Frontend templates:** 4a's `StudentsPanel`/`StudentsTable`/`AddStudentDialog` (`apps/web/src/components/features/school/`) and the `/school` tabbed page (`apps/web/src/app/(dashboard)/school/page.tsx`) are the patterns for the new Classrooms tab. The teacher class-detail page is `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx`; `classroomsApi` lives in `apps/web/src/lib/api-client.ts`.

---

## 4. Conventions & gotchas (must follow — carried from 4a)

1. **API test command:** `pnpm --filter @eureka-lab/api exec jest --runInBand [optional/path]`. **Never** `... test -- --runInBand` (the `--` turns `--runInBand` into a zero-match test pattern).
2. **API tests run `--runInBand`** (OOM in parallel). `NODE_OPTIONS=--max-old-space-size=6144` if needed.
3. **Rebuild shared-types after editing** `packages/shared-types/src/index.ts`: `pnpm --filter @eureka-lab/shared-types build`. `dist/` is gitignored — commit only `src/`.
4. **Commit footer (every commit):** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task; conventional subjects. Use the **Bash heredoc** form `git commit -F - <<'EOF' … EOF` (the repo's Bash tool is bash; PowerShell `@'…'@` fails).
5. **NestJS route ordering gotcha:** declare `@Get('roster')` **before** `@Get(':id')` in `ClassroomsController`, or `:id` captures `roster`. (Same for any new static route alongside a param route.)
6. **`createClassroom` signature change** ripples to its existing spec — update those tests when you add the `schoolId` param.
7. **Sonner toasts are broken app-wide** — all UI feedback is **inline** (local state), never `toast()`.
8. **Next.js 14.2** — dynamic-route `params` are **synchronous** (`params.id`).
9. **Tailwind v4** tokens in `apps/web/src/app/globals.css` `@theme inline`: `bg-card`, `text-destructive`, `text-muted-foreground`, `border-border`, `bg-background`, `text-foreground`, `text-primary`, `ring`. `GameButton` variants: **`primary | gold | ghost | danger`** (no `secondary`). The `panel` CSS class exists.
10. **Web `tsc` has 24 pre-existing test-file errors.** Success for every frontend task is the count **stays 24**, not zero.
11. **No frontend unit tests in this slice** (web harness is shaky). Frontend verification = lint + tsc + user-driven smoke. **Backend carries the ≥80% coverage bar** — now **classrooms AND schools** modules (both get new code).
12. **Controller specs** must `.overrideGuard(...)` every guard the controller uses. The schools rollup controller uses `FirebaseAuthGuard`, `RolesGuard`, `TenantGuard` (three). `ClassroomsController` uses `FirebaseAuthGuard`, `RolesGuard` (two) — override exactly those.
13. **i18n** keys in **all three** locales (en/fr/ar); validate JSON with `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"` before committing.

---

## 5. What 4a's reviews taught us (expect the same rigor)

The `superpowers:code-reviewer` subagent is thorough and will surface real issues; budget a fix round on the meaty tasks. In 4a it correctly caught: an over-narrow COPPA age check, a seat-compensation path that masked the real error, activate/deactivate idempotency, a missing audit `adminUid`, and missing WAI-ARIA tab semantics. For 4b, anticipate it probing: **tenant isolation on assignment** (the same-school check must be airtight — a student of another school must never be assignable or joinable), **ownership checks** (teacher can only touch their own class), **partial-failure handling** when updating both the class `studentIds` and each user's `classroomIds`, and **accessibility** on the new picker/tab. Apply technical rigor when triaging findings (one 4a suggestion had wrong arithmetic) — fix the genuine ones, decline precedent-consistent ones with a reason, and announce deviations briefly. The user values "I'm adjusting, here's why" over silent drift.

---

## 6. User preferences (current as of 2026-05-31)

- **Execution mode:** **subagent-driven-development** (fresh subagent per task, spec review then code-quality review, fix-and-re-review loops). Used for 4a; worked well.
- **Push timing:** every push individually approved. **Never push without being told.** Pattern: finish → `finishing-a-development-branch` → user picks "push and create a PR".
- **Branching:** each sub-project gets its **own stacked branch** off the previous, with its **own PR**.
- **Commit granularity:** one commit per task; conventional commits. Within-task review fixes are folded in via `git commit --amend` (branch unpushed) to keep tasks atomic.
- **Updates:** brief; report at phase/task boundaries.
- **Smoke testing:** user-driven — hand them a short smoke brief; they run it and report back before push.

---

## 7. After this slice

Remaining epic (see [epic spec](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) / ROADMAP Stream 6):
- **5** — B2B subscriptions / billing / secret-key rotation + super-admin usage-over-time analytics (intersects the open `STRIPE-001` blocker).

When 4b lands, offer to brainstorm sub-project 5 (the established cycle).

---

## 8. Where to find things

- **Spec to plan + execute:** [`docs/superpowers/specs/2026-05-31-school-tenancy-classroom-rollup-design.md`](../specs/2026-05-31-school-tenancy-classroom-rollup-design.md)
- **4a spec/plan (DONE, the closest template):** [`…-student-enrollment-design.md`](../specs/2026-05-31-school-tenancy-student-enrollment-design.md) · [`…-student-enrollment-plan.md`](../plans/2026-05-31-school-tenancy-student-enrollment-plan.md)
- **Epic spec:** [`…-b2b-epic-design.md`](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR-008:** [`…role-hierarchy.md`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
- **Canonical state:** [`ROADMAP.md`](../../../ROADMAP.md) Stream 6 (1–3, 4a DONE; 4b NOT WRITTEN; 5 NOT WRITTEN).
- **Project rules (read first):** [`CLAUDE.md`](../../../CLAUDE.md).

---

*Handover authored 2026-05-31 at the seam between sub-project 4b being spec'd and being planned. The spec is approved + committed; the next session runs `writing-plans` then `subagent-driven-development`.*
