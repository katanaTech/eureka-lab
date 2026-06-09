# School Tenancy (B2B) — Sub-project 5b: Super-admin Usage Analytics — Design

> **Status:** Draft (2026-06-03)
> **Author:** brainstormed with the user this session.
> **Epic:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Slice:** 5b of the B2B epic. Sub-projects 1, 2, 3, 4a, 4b, 5a are DONE. This is the **final structural slice**.
> **Branch:** `feat/school-b2b-usage-analytics` (stacked off `feat/school-b2b-billing`, PR #15).

---

## 1. Why

The super-admin console (sub-project 2) shipped a Core console — list/create/suspend schools, edit seat limit, manage admins — and explicitly **deferred usage views** to a later slice. Sub-projects 4b and 5a re-parked "usage-over-time analytics." 5a delivered billing. This slice delivers the parked super-admin **usage views**: a platform operator's read-only window into how schools are actually using their seats, rosters, and the product.

## 2. Scope

**In scope** — current-state usage views for the platform super-admin, computed on demand from existing data:
- **Platform overview** (summary tiles): schools by status, seats sold vs filled + utilization, billing-status mix, total + active students.
- **Enriched schools table**: per-school utilization %, student count, active %, and a billing-status badge added to the existing super-admin schools table.
- **Metrics**: seat utilization, roster counts (students/teachers/classrooms), billing-status mix (from 5a), active-student engagement.
- **"Active" definition**: a school student whose `users/{uid}.lastActiveDate` (a `YYYY-MM-DD` string the streak service maintains on every gamified activity) is within the last **30 days**.

**Non-goals (deferred / out of scope):**
- **Time-series / historical trend charts.** No snapshot infrastructure exists (only live counters); building it is deferred. These views are point-in-time.
- **Secret-key rotation.** Still no feature consumes a school key (the reason it was dropped from 5a); deferred again until one does. After 5b this is the sole parked epic item.
- Per-student drill-down dashboards, CSV/export, new denormalized write-path counters, and any change to school-admin/teacher surfaces (super-admin only).

## 3. Locked decisions (this session)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Analytics only; key rotation deferred again.** | Rotating a key nothing reads has no value; revisit when a consuming feature exists. |
| 2 | **Current-state views, no time-series.** | No historical data exists; snapshotting is disproportionate for this slice. Honest about available data; immediately useful. |
| 3 | **All four metric sets** (seat utilization, roster counts, billing mix, active students). | The operator's core adoption + revenue-health signals. |
| 4 | **Platform overview page + enriched schools table.** | Bird's-eye aggregate plus per-school comparability. |
| 5 | **Architecture A — on-demand aggregation.** | Firestore `count()` makes live aggregation cheap; reuses existing `seatsUsed` + `subscription.status` denorm; adds no fragile write-path counters; the one un-stored metric (active students) is on-demand anyway. |
| 6 | **`seatsUsed` is the student count.** | The denormalized seat counter from 4a is the billing-metered truth; reusing it avoids a redundant count. |

## 4. Data model (no schema changes)

Reads only existing fields:
- `School`: `seatLimit`, `seatsUsed`, `status`, `subscription.status` (5a).
- `users/{uid}`: `schoolId`, `role`, `lastActiveDate` (`YYYY-MM-DD`, maintained by `gamification/streak.service.ts`).
- `classrooms`: `schoolId`.

Two new **view types** in `packages/shared-types/src/index.ts` (no persisted shape):

```ts
/** Per-school usage row for the enriched super-admin table (5b). */
export interface SchoolUsageRow {
  schoolId: string;
  name: string;
  status: SchoolStatus;
  seatLimit: number;
  seatsUsed: number;
  /** seatsUsed / seatLimit (0 when seatLimit is 0). */
  utilization: number;
  teacherCount: number;
  classroomCount: number;
  activeStudents: number;
  /** activeStudents / seatsUsed (0 when seatsUsed is 0). */
  activeRate: number;
  /** subscription.status from 5a (active|trialing|past_due|canceled|none). */
  billingStatus: string;
}

/** Platform-wide usage aggregate for the super-admin overview (5b). */
export interface PlatformUsageOverview {
  totalSchools: number;
  schoolsByStatus: { active: number; suspended: number };
  totalSeatLimit: number;
  totalSeatsUsed: number;
  /** totalSeatsUsed / totalSeatLimit (0 when no seats). */
  seatUtilization: number;
  totalStudents: number;        // sum of seatsUsed
  totalActiveStudents: number;
  /** Count of schools per subscription status, e.g. { active, trialing, past_due, canceled, none }. */
  billingStatusMix: Record<string, number>;
}
```

Rebuild shared-types after editing (`pnpm --filter @eureka-lab/shared-types build`; commit only `src/`).

## 5. Backend — `school-analytics` module

New `apps/api/src/modules/school-analytics/` (service + controller). Both endpoints super-admin-only (`@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('super_admin')`):

| Method + route | Returns |
|---|---|
| `GET /school-analytics/overview` | `PlatformUsageOverview` |
| `GET /school-analytics/schools` | `{ schools: SchoolUsageRow[] }` |

### Aggregation (respects module boundaries)

Counts live on the **owning** repositories, so the analytics service never reaches across collections directly:
- `UsersRepository.countBySchoolAndRole(schoolId, role)` — `.where('schoolId','==',schoolId).where('role','==',role).count()`.
- `UsersRepository.countActiveStudents(schoolId, sinceDate)` — `role==='child'` AND `lastActiveDate >= sinceDate` (string compare on `YYYY-MM-DD`), `.count()`.
- `ClassroomsRepository.countBySchool(schoolId)` — `.where('schoolId','==',schoolId).count()`.
- `SchoolsRepository.listAll()` (exists, bounded ≤500) supplies `seatLimit`/`seatsUsed`/`status`/`subscription.status`; `seatsUsed` is the student count.

`SchoolAnalyticsService`:
- `getSchoolRows()` — `listAll()`, then `Promise.all` over schools building each `SchoolUsageRow` (3 count queries/school: teachers, classrooms, active students). `utilization`/`activeRate` divide-by-zero-guarded (0 → 0).
- `getOverview()` — derive from the rows (or a parallel pass): sum seats/students/active, tally `schoolsByStatus` and `billingStatusMix`.
- `ACTIVE_WINDOW_DAYS = 30`; cutoff computed as a `YYYY-MM-DD` string (today − 30d).

Firestore `count()` aggregations don't read documents; every query is `schoolId`-scoped (Rule 3 tenant filter — super-admin cross-tenant access is inherent and guarded). Only **counts** leave the server — no child PII. Module imports `UsersModule` + `ClassroomsModule` + `SchoolsModule` for the repositories (verify each exports its repo; add an `exports` entry if missing — a targeted, in-scope improvement).

**Firestore composite index:** only `countActiveStudents` needs one — it combines two equality filters (`schoolId`, `role`) with a range filter (`lastActiveDate >=`), which Firestore cannot serve from single-field indexes. The teacher/classroom/student counts are equality-only (Firestore merges single-field indexes — no composite needed). No `firestore.indexes.json` exists yet (`infrastructure/firebase/` currently holds only `firestore.rules`), so **create** `infrastructure/firebase/firestore.indexes.json` with the `users` composite (`schoolId ASC, role ASC, lastActiveDate ASC`). This is an in-repo artifact; **deploying** it (`firebase deploy --only firestore:indexes`) is an ops step tracked alongside `DEPLOY-001` — until the index is live, that one query errors in prod (jest mocks + emulator are unaffected, so it's not a test blocker). If preferred at review, the fallback is an equality-only `schoolId==,role==child` count with an in-memory `lastActiveDate` filter (bounded per school, no index) — noted as an alternative, not the default.

## 6. Frontend

On the existing super-admin dashboard `apps/web/src/app/(dashboard)/admin/page.tsx` (which already renders the schools table):
- **`UsageOverview` component** (tiles) above the table — schools by status, seats sold vs filled + utilization %, total/active students, billing-status mix — from `schoolAnalyticsApi.overview()`.
- **Enriched `SchoolsTable`** — add columns: utilization %, student count (`seatsUsed`), active %, billing badge (reuse the 5a `features/billing/billingStatus.ts` helpers), joined to the existing school list by `schoolId` via `schoolAnalyticsApi.schools()`.
- New `schoolAnalyticsApi` client object (`overview()`, `schools()`) in `apps/web/src/lib/api-client.ts`, typed with the new shared-types.
- i18n keys in en/fr/ar; inline loading/error (Sonner is broken — no `toast()`); GameButton variants `primary|gold|ghost|danger`; ARIA where relevant.
- Verification: no frontend unit tests; `lint` clean + web `tsc` error count **stays 24** + user smoke.

## 7. Testing (backend carries ≥80% new-code coverage)

- `school-analytics.service.spec.ts`: per-school row math (utilization, activeRate, divide-by-zero), active-window cutoff string, multi-school overview rollup (seat sums, `schoolsByStatus`, `billingStatusMix`), empty-platform case.
- Repo `count()` method specs (`UsersRepository`, `ClassroomsRepository`): mock the Firestore `.count().get()` aggregation chain; assert the `where` clauses + the returned count mapping.
- `school-analytics.controller.spec.ts`: guard overrides; delegation.
- API tests: `pnpm --filter @eureka-lab/api exec jest --runInBand <path>`.

## 8. Performance

`Promise.all` fan-out, bounded by school count (≤500; realistically far fewer early). `count()` aggregations are cheap. A response cache (e.g. short TTL on the overview) is a documented **future** lever, not built now (YAGNI).

## 9. Deliverable

Per the epic's per-slice contract: code + tests (≥80% new-code coverage), an updated ROADMAP epic row (flip Stream 6 to add **5b DONE**; note the epic is delivered and **key rotation** remains the sole parked item, awaiting a consuming feature), and any ADR addendum if a cross-cutting decision changed (none expected — 5b stays within ADR-008). Its own stacked branch (`feat/school-b2b-usage-analytics`) and its own PR, merged after #15.
