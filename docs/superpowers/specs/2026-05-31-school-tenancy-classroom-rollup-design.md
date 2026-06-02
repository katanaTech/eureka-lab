# Classroom→School Rollup, Roster Assignment & Teacher Management — Design (Sub-project 4b)

> **Status:** Approved (2026-05-31)
> **Epic:** [School Tenancy (B2B)](2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Prior slices (DONE):** [foundation](2026-05-30-school-tenancy-foundation-design.md) · [super-admin console](2026-05-30-school-tenancy-superadmin-console-design.md) · [school-admin console](2026-05-30-school-tenancy-schooladmin-console-design.md) · [student enrollment (4a)](2026-05-31-school-tenancy-student-enrollment-design.md)

---

## 1. Why & scope

Sub-project 4 was split during 4a brainstorming. **4a (DONE)** delivered seated student enrollment + COPPA. **4b (this spec)** connects those students to classrooms and rolls classrooms up to the school:

- Classrooms carry a `schoolId` (denormalized, ADR-008 hybrid-tenancy pattern), stamped at creation.
- A **teacher assigns** 4a-provisioned students from their school roster into their own classes.
- The **school admin** sees a read-only rollup of the school's classrooms.
- The existing self-join-by-code flow becomes **tenant-safe**.

Today: `ClassroomDocument` is owned by `teacherId` with no `schoolId`; students join via `POST /classrooms/join` (any `child` + any code); 4a students are `child` users with a `schoolId` but no path into a class.

## 2. Locked decisions (this session)

1. **Teacher assigns from the school roster** (no code-typing for young students). Self-join by code is not the school path; it stays for B2C and is hardened (see §5).
2. **School admin is read-only** for classrooms in 4b (oversight, not management). No admin-side class creation.
3. **Super-admin usage views are out of scope** — the sub-project-2 spec deferred usage-over-time analytics to sub-project 5 (billing). "Classrooms roll up to school" is satisfied by the school-admin rollup.

## 3. Architecture

A denormalized `schoolId` on `ClassroomDocument` makes a school's classrooms an O(1) query (mirrors `users.schoolId`), rather than fanning out teacher→classrooms. Work lands in the existing `classrooms` module (teacher assignment + roster + join hardening + create-stamp) and the `schools` module (admin rollup endpoint), with no new module.

## 4. Data model (shared-types)

- `ClassroomDocument.schoolId?: string` — set when a teacher who has a `schoolId` creates a class; absent for B2C classrooms.
- `SchoolClassroomSummary { id: string; name: string; teacherName: string; studentCount: number }` — for the admin rollup.
- The teacher's assignment picker reuses `SchoolStudentSummary` (from 4a).

## 5. Endpoints

### `POST /classrooms/:id/students` (`@Roles('teacher')`)
Body `AssignStudentsDto { studentIds: string[] }` (non-empty, each a string). Flow:
1. Load the classroom; verify `teacherId === caller` (else `403`/`404`, matching the module's existing `getOwnedClassroom`).
2. For each `studentId`: load the user; require `role === 'child'`, `active !== false`, and `schoolId === classroom.schoolId` (else `400 STUDENT_NOT_IN_SCHOOL`). A classroom with no `schoolId` (B2C) rejects roster assignment with `400 NOT_A_SCHOOL_CLASSROOM`.
3. Enforce `studentIds.length + current ≤ maxStudents` (`400 CLASSROOM_FULL`).
4. Add each student (`studentIds` arrayUnion on the class + `classroomIds` arrayUnion on each user), skipping any already enrolled.

Returns the updated `ClassroomDocument`.

### `GET /classrooms/roster` (`@Roles('teacher')`)
Returns `{ students: SchoolStudentSummary[] }` — the **active students of the caller-teacher's school** (from their token `schoolId`), so the assignment picker has candidates. Returns an empty list when the teacher has no `schoolId` (B2C). Teachers cannot call the `school_admin`-gated `listStudents`, hence this dedicated endpoint.

### `GET /schools/:id/classrooms` (`@Roles('school_admin','super_admin')` + `TenantGuard`)
Returns `{ classrooms: SchoolClassroomSummary[] }` — all classrooms with `schoolId === :id`, each resolved to its teacher's display name and student count.

### `POST /classrooms/join` (existing — hardened)
Add a tenant guard inside the service: if the matched classroom has a `schoolId`, the joining child's `schoolId` must equal it, else `403 CROSS_SCHOOL_JOIN`. Classrooms without a `schoolId` are unchanged (B2C self-join works as before).

### `POST /classrooms` (existing — stamped)
`createClassroom` now also receives the teacher's `schoolId` (from `@CurrentUser().schoolId`) and writes it onto the new doc when present.

## 6. Frontend

- **Teacher class detail** (`apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx`): an **Add students** button — rendered only when `user.schoolId` is set — opens a dialog listing the school roster (`GET /classrooms/roster`) with checkboxes; submit calls `POST /classrooms/:id/students` and refetches. The existing remove-student control is unchanged.
- **School-admin console** (`apps/web/src/app/(dashboard)/school/page.tsx`): a third tab **Classrooms** (read-only) listing `SchoolClassroomSummary` rows (name · teacher · #students) via `GET /schools/:id/classrooms`.
- `classroomsApi` gains `getRoster` + `assignStudents`; `schoolsApi` gains `listClassrooms`. New `SchoolClassrooms` i18n namespace in en/fr/ar (the Students tab uses `SchoolStudents`; reuse where natural).

## 7. Error handling

| Code | HTTP | Cause |
|---|---|---|
| `NOT_A_SCHOOL_CLASSROOM` | 400 | roster-assign to a classroom with no `schoolId` |
| `STUDENT_NOT_IN_SCHOOL` | 400 | assigned student isn't an active `child` of the class's school |
| `CLASSROOM_FULL` | 400 | assignment would exceed `maxStudents` |
| `CROSS_SCHOOL_JOIN` | 403 | join-by-code into a school class by a non-member child |
| `CLASSROOM_NOT_FOUND` / ownership | 404/403 | existing `getOwnedClassroom` semantics |

UI feedback is inline (Sonner is broken app-wide).

## 8. Testing

**Backend (TDD, classrooms + schools modules ≥80% lines):**
- `createClassroom` stamps `schoolId` when provided, omits it otherwise.
- `assignStudents`: happy path (arrayUnion on class + users, dedupes already-enrolled); rejects non-owner; rejects B2C classroom (`NOT_A_SCHOOL_CLASSROOM`); rejects a student of another school / non-child / inactive (`STUDENT_NOT_IN_SCHOOL`); enforces `maxStudents` (`CLASSROOM_FULL`).
- `getSchoolRoster` returns the teacher's school's active students; empty for a school-less teacher.
- `joinClassroom`: school classroom rejects a cross-school child (`CROSS_SCHOOL_JOIN`); same-school child joins; B2C classroom unaffected.
- `listSchoolClassrooms` resolves teacher names + student counts, scoped to `schoolId`.

**Frontend:** lint clean; web `tsc` stays at 24 pre-existing errors; user smoke (teacher assigns from roster; admin sees the rollup; cross-school join blocked).

## 9. Definition of Done

- `ClassroomDocument.schoolId` + `SchoolClassroomSummary` in shared-types (rebuilt).
- Assignment + roster + rollup endpoints with role/tenant guards, all unit-tested; join-code hardened to same-school.
- Teacher class-detail **Add students** picker (school teachers only); `/school` **Classrooms** rollup tab.
- `SchoolClassrooms` i18n in all three locales.
- api: `tsc` 0 errors, full suite green, classrooms + schools modules ≥80% coverage. web: lint clean, `tsc` still 24.
- `ROADMAP.md` Stream 6 sub-project-4b row flipped to DONE.

## 10. Out of scope (later)

Admin-side class creation/assignment; super-admin usage dashboards and usage-over-time analytics (sub-project 5); coded student self-enroll into school classes; bulk/CSV assignment; moving a student between schools; B2B billing (sub-project 5).
