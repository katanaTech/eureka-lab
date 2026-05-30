# School-Admin Console (Sub-project 3) — Design

> **Status:** Draft (2026-05-30)
> **Epic:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](2026-05-30-school-tenancy-b2b-epic-design.md)
> **Builds on:** [foundation](2026-05-30-school-tenancy-foundation-design.md) (sub-project 1) + [super-admin console](2026-05-30-school-tenancy-superadmin-console-design.md) (sub-project 2) · [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Scope:** a school admin manages **teachers** within their own school — create, list, deactivate/reactivate. This is `TenantGuard`'s first live use. Replaces the original "Teacher signup UI" gap.

---

## 1. Scope

### In scope
- Auth profile fix: include `schoolId` in `getMe`/`login` responses.
- `/schools/:id/teachers` endpoints (create / list / set-active), `school_admin`-scoped via `TenantGuard`.
- `/school` console: teachers table + add-teacher + deactivate/reactivate.
- `active` flag on user docs; `SchoolTeacherSummary`; teacher methods on `schoolsApi`; `SchoolAdmin` i18n (en/fr/ar).
- Backend unit tests (≥80% new-code coverage).

### Out of scope (later / other sub-projects)
- Editing a teacher's email/name or resetting their password (deferred; deactivate + re-create covers the immediate need).
- Teacher → classroom rollup / seat enforcement → sub-project 4.
- Student enrollment, school-consent COPPA → sub-project 4.
- Email-invite credential delivery — this slice uses admin-set passwords shown once (consistent with sub-project 2).
- Multiple school admins management UI (a super_admin still mints admins via sub-project 2).

## 2. Auth profile fix (prerequisite)

`AuthService.login` and `AuthService.getMe` build result objects that omit `schoolId`, so a signed-in `school_admin` can't tell the frontend which school it manages. Add `schoolId: userDoc.schoolId` to both result objects (already on `UserDoc` + `UserProfile` from the foundation; the api-client `UserProfile` type already carries it). Update the auth service specs if they assert the exact result shape.

## 3. Backend — teacher management

New **`SchoolTeachersController`** in the schools module (`apps/api/src/modules/schools/school-teachers.controller.ts`), base route `/schools/:id/teachers`:

```ts
@Controller('schools/:id/teachers')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
```
`TenantGuard` (built + unit-tested in the foundation) compares `params.id` to the caller's `schoolId`; a `school_admin` may only act on their own school, `super_admin` bypasses. **This is the guard's first live wiring.**

| Method | Path | Body | Behaviour |
|---|---|---|---|
| `POST` | `/schools/:id/teachers` | `CreateTeacherDto { email, displayName, password }` | Mint a teacher: `auth.createUser` → `setCustomUserClaims({ role:'teacher', schoolId:id })` → `usersRepository.create({ role:'teacher', schoolId:id, active:true })`. Maps duplicate email → 409. Returns `{ uid, email, displayName, role, schoolId, active }`. |
| `GET` | `/schools/:id/teachers` | — | `{ teachers: SchoolTeacherSummary[] }` — users with `role=='teacher'` and `schoolId==id`. |
| `PATCH` | `/schools/:id/teachers/:teacherId` | `UpdateTeacherActiveDto { active: boolean }` | Verify the target's `schoolId==id` (else 404); `auth.updateUser(teacherId, { disabled: !active })`; `usersRepository.setActive(teacherId, active)`. Returns the updated `SchoolTeacherSummary`. |

Teachers do **not** consume student seats (seats are for `role:'child'` students).

### Service (`SchoolTeachersService`)
`createTeacher(schoolId, dto)`, `listTeachers(schoolId)`, `setTeacherActive(schoolId, teacherId, active)`. Reuses `FirebaseService`, `UsersRepository`, and (for the school-existence check) `SchoolsRepository`.

### UsersRepository additions
- `UserDoc` / `CreateUserData` gain `active?: boolean`.
- `findTeachersBySchool(schoolId): Promise<UserDoc[]>` — `where('role','==','teacher').where('schoolId','==',schoolId)`.
- `setActive(uid, active): Promise<void>` — `update({ active, updatedAt })`.

### Shared type
```ts
export interface SchoolTeacherSummary {
  uid: string;
  email: string;
  displayName: string;
  active: boolean; // defaults true when the field is absent on older docs
}
```

### DTOs
- `CreateTeacherDto` — `email` (IsEmail), `displayName` (2–50), `password` (min 8, ≥1 upper + ≥1 digit) — mirrors `CreateSchoolAdminDto`.
- `UpdateTeacherActiveDto` — `active: boolean` (`@IsBoolean`).

## 4. Frontend — `/school` console

- Replace the `/school` placeholder (`apps/web/src/app/(dashboard)/school/page.tsx`); wrap in `<RoleGate allow={['school_admin']}>`.
- Read the admin's school from `useAuth().user.schoolId` (now populated by §2). If absent, show an inline "no school linked" message (defensive; shouldn't happen for a `school_admin`).
- **Teachers table**: email · display name · active/inactive pill, with a per-row Deactivate/Reactivate button (inline `window.confirm`). An **Add Teacher** button opens a modal (email, name, temp password) that shows the credentials **once** on success (mirrors `CreateSchoolAdminDialog`). Loading / empty / error states mirror the teacher dashboard. All feedback inline.

### Components (`apps/web/src/components/features/school/`)
- `TeachersTable.tsx` — rows + active/inactive pill + deactivate/reactivate action callback.
- `CreateTeacherDialog.tsx` — mint form + "credentials shown once" panel (same shape as `CreateSchoolAdminDialog`).

### API client (`schoolsApi` additions)
```ts
listTeachers(schoolId)                      GET   /schools/:id/teachers            -> { teachers: SchoolTeacherSummary[] }
createTeacher(schoolId, body)               POST  /schools/:id/teachers            -> { uid,email,displayName,role,schoolId,active }
setTeacherActive(schoolId, teacherId, active) PATCH /schools/:id/teachers/:teacherId -> SchoolTeacherSummary
```

### i18n
New **`SchoolAdmin`** namespace in `apps/web/src/messages/{en,fr,ar}.json` (title, table headers, active/inactive, add-teacher dialog labels, deactivate/reactivate + confirms, credential-share notice, no-school fallback).

## 5. Testing & DoD

- **Backend tests (≥80% new code):** `UsersRepository.findTeachersBySchool` + `setActive`; `SchoolTeachersService` create/list/setActive (incl. duplicate-email → 409, wrong-school teacher → 404); `SchoolTeachersController` delegation with guard overrides; `CreateTeacherDto`/`UpdateTeacherActiveDto`; auth-service spec updated for the new `schoolId` field.
- **Frontend:** `pnpm --filter @eureka-lab/web lint` clean; web `tsc` no new errors beyond the 24 known; user-driven smoke (log in as a school_admin minted in sub-project 2; add a teacher, see creds once, deactivate/reactivate; confirm a school_admin cannot reach `/admin` and a non-school_admin is redirected from `/school`; confirm cross-tenant `:id` is rejected by TenantGuard).
- **DoD:** types + shared-types rebuilt; profile returns `schoolId`; 3 endpoints + service/repo/dtos with tests; `/school` gated + functional; i18n in all 3 locales; ROADMAP Stream 6 row updated.

## 6. File touch-list (for planning)

**Backend**
- `apps/api/src/modules/auth/auth.service.ts` — add `schoolId?: string` to the local `LoginResult` interface and populate it in `login` + `getMe` results (+ spec). (The frontend `UserProfile` in shared-types already has `schoolId`.)
- `packages/shared-types/src/index.ts` — add `SchoolTeacherSummary`.
- `apps/api/src/modules/users/users.repository.ts` — `active` field, `findTeachersBySchool`, `setActive` (+ spec).
- `apps/api/src/modules/schools/dto/create-teacher.dto.ts`, `update-teacher-active.dto.ts` — new.
- `apps/api/src/modules/schools/school-teachers.service.ts` + `.spec.ts` — new.
- `apps/api/src/modules/schools/school-teachers.controller.ts` + `.spec.ts` — new.
- `apps/api/src/modules/schools/schools.module.ts` — register the new controller + service.

**Frontend**
- `apps/web/src/app/(dashboard)/school/page.tsx` — replace placeholder.
- `apps/web/src/components/features/school/{TeachersTable,CreateTeacherDialog}.tsx` — new.
- `apps/web/src/lib/api-client.ts` — teacher methods on `schoolsApi` + `SchoolTeacherSummary` import.
- `apps/web/src/messages/{en,fr,ar}.json` — `SchoolAdmin` namespace.

**Docs**
- `ROADMAP.md` — Stream 6 sub-project 3 status.
