# Super-Admin Console (Sub-project 2) — Design

> **Status:** Draft (2026-05-30)
> **Epic:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](2026-05-30-school-tenancy-b2b-epic-design.md)
> **Builds on:** [foundation](2026-05-30-school-tenancy-foundation-design.md) (sub-project 1, DONE) · [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Scope:** the **Core console** — list/create/detail/suspend schools, edit seat limit, create + list school admins. Subscription editing, key rotation, and usage analytics are **deferred** (lean on billing = sub-project 5).

---

## 1. Scope

### In scope
- `/admin` schools table (name, seats used/limit, status) + create-school.
- `/admin/schools/[id]` detail: status + suspend/reactivate, seat-limit edit, read-only subscription/secret, admin list + create-admin.
- Reusable `RoleGate` access control (super_admin here; school_admin reuse in sub-project 3).
- Two new `super_admin`-guarded backend endpoints: `PATCH /schools/:id`, `GET /schools/:id/admins`.
- `schoolsApi` typed client + `Admin` i18n namespace (en/fr/ar).
- Backend unit tests (≥80% new-code coverage).

### Out of scope (later sub-projects)
- Editing subscription tier/status, rotating `enrollmentSecret`, usage-over-time analytics → sub-project 5 (billing).
- Teacher management inside a school → sub-project 3.
- Enrollment / seat enforcement → sub-project 4.
- Email-invite credential delivery (Resend) — this slice uses super-admin-set passwords shown once.
- Editing a school's name (create-time only for now).

## 2. Access & routing

A reusable client component **`RoleGate`** (`apps/web/src/components/auth/RoleGate.tsx`):
- Props: `{ allow: UserRoleString[]; children: ReactNode }`.
- Reads `useAuth()`. While `isLoading` → render nothing. If authenticated but `role` ∉ `allow` → `router.replace(homeForRole(role))` inside a `useEffect` (repo rule: no `router.replace` during render). If allowed → render `children`.
- The `(dashboard)` layout already bounces anonymous users to `/`; `RoleGate` adds the role dimension.

Routes (both under the existing `(dashboard)` group, wrapped in `<RoleGate allow={['super_admin']}>`):
- `apps/web/src/app/(dashboard)/admin/page.tsx` — schools table (replaces the placeholder).
- `apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx` — school detail.

> Next 14.2 note: dynamic route `params` are synchronous (`params.id`), not a Promise.

## 3. Backend extensions

Two new endpoints on the existing `SchoolsController` (`@Roles('super_admin')`, already class-level):

### `PATCH /schools/:id`
- DTO `UpdateSchoolDto` (`apps/api/src/modules/schools/dto/update-school.dto.ts`): all optional —
  `status?: 'active' | 'suspended'` (`@IsOptional @IsIn(['active','suspended'])`),
  `seatLimit?: number` (`@IsOptional @IsInt @Min(0) @Max(100000)`).
- Service `updateSchool(id, dto)`: `findById` → NotFound if missing; build a partial (`status`/`seatLimit` only when present); `repo.updateSchool(id, partial)`; return the merged `School`.
- Repository `updateSchool(id, partial: Partial<Pick<School,'status'|'seatLimit'>>)`: `doc(id).update(partial)`.
- Returns the updated `School`.

### `GET /schools/:id/admins`
- Service `listSchoolAdmins(id)`: `findById` → NotFound if missing; map `school.adminUids` through `usersRepository.findByUid`, returning `{ uid, email, displayName }[]` (skip any uid that no longer resolves). Bounded by the (small) admin count.
- Returns `{ admins: SchoolAdminSummary[] }`.

New shared type (`packages/shared-types/src/index.ts`):
```ts
export interface SchoolAdminSummary { uid: string; email: string; displayName: string; }
```

Existing endpoints (create/list/get/mint-admin) are unchanged.

## 4. UI

```
/admin
 ┌─────────────────────────────────────────┐
 │ Schools                    [+ New school]│
 │ Name          Seats    Status     →      │
 │ Springfield   12/100   ● active   (row)  │  row → /admin/schools/[id]
 │ Shelbyville    0/50    ◌ suspended       │
 └─────────────────────────────────────────┘

/admin/schools/[id]
 • header: name + SchoolStatusBadge + [Suspend]/[Reactivate]
 • seats: 12 / 100   [Edit limit]
 • subscription tier/status + enrollmentSecret: read-only (managed later)
 • Admins: [email · name]…  + [+ Add admin]
```

### Components (`apps/web/src/components/features/admin/`)
- `SchoolsTable.tsx` — rows from `GET /schools`; row click → detail.
- `SchoolStatusBadge.tsx` — active/suspended pill.
- `CreateSchoolDialog.tsx` — modal mirroring `CreateClassroomDialog` (custom overlay, **inline error**). Fields: name, seatLimit, optional subscriptionTier. `onSubmit` → `schoolsApi.create`.
- `CreateSchoolAdminDialog.tsx` — fields: email, displayName, temp password. On success, renders a one-time **"share these credentials now"** panel (email + password) before closing; inline error on failure.
- `EditSeatLimitDialog.tsx` — single number field → `schoolsApi.update(id, { seatLimit })`.
- Suspend/reactivate: inline button on the detail header → `schoolsApi.update(id, { status })` with an inline confirm + inline result (no toast — Sonner is broken app-wide; see ROADMAP Stream 4).

### Pages
- `/admin` (`'use client'`, `force-dynamic`): fetch schools on mount, loading/error/empty states mirroring the teacher dashboard, `CreateSchoolDialog`.
- `/admin/schools/[id]`: fetch school + admins; render detail, dialogs, and actions; re-fetch after each mutation.

### API client (`apps/web/src/lib/api-client.ts`)
Add `schoolsApi`:
```ts
list()                          GET   /schools          -> { schools: SchoolSummary[] }
get(id)                         GET   /schools/:id       -> School
create(body)                    POST  /schools           -> School
update(id, body)                PATCH /schools/:id        -> School
listAdmins(id)                  GET   /schools/:id/admins -> { admins: SchoolAdminSummary[] }
createAdmin(id, body)           POST  /schools/:id/admins -> MintSchoolAdminResult { uid,email,displayName,role,schoolId }
```
(`create`/`update` bodies typed to the DTO shapes; reuse `SchoolSummary`/`School`/`SchoolAdminSummary` from shared-types. `createAdmin` returns the foundation's existing mint result — no password in the response; the dialog shows the password from its own form state, since the super-admin typed it. `listAdmins` returns the lighter `SchoolAdminSummary` since stored admins expose only uid/email/displayName.)

## 5. i18n, testing, DoD

- **i18n:** new `Admin` namespace in `apps/web/src/messages/{en,fr,ar}.json` (table headers, dialog labels, status words, actions, the credential-share notice).
- **Backend tests (≥80% new code):** `SchoolsService.updateSchool` (found/not-found, partial update), `SchoolsService.listSchoolAdmins` (resolve + skip-missing), controller specs for `PATCH /schools/:id` + `GET /schools/:id/admins` (delegation, guard override), `UpdateSchoolDto`.
- **Frontend verification:** `pnpm --filter @eureka-lab/web lint` clean; web `tsc` no new errors beyond the 24 known; **user-driven smoke** (hand a brief; not autonomous Playwright). Backend coverage carries the DoD numeric bar.
- **DoD checklist:** types added + shared-types rebuilt; 2 endpoints + service/repo/dto with tests; `RoleGate` gates `/admin`; both pages render with loading/empty/error states; i18n in all 3 locales; api-client typed; ROADMAP Stream 6 row updated.

## 6. File touch-list (for planning)

**Backend**
- `packages/shared-types/src/index.ts` — `SchoolAdminSummary`.
- `apps/api/src/modules/schools/dto/update-school.dto.ts` — new.
- `apps/api/src/modules/schools/schools.repository.ts` — `updateSchool`.
- `apps/api/src/modules/schools/schools.service.ts` — `updateSchool`, `listSchoolAdmins`.
- `apps/api/src/modules/schools/schools.controller.ts` — `PATCH /:id`, `GET /:id/admins`.
- Specs for each of the above.

**Frontend**
- `apps/web/src/components/auth/RoleGate.tsx` — new.
- `apps/web/src/app/(dashboard)/admin/page.tsx` — replace placeholder with table.
- `apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx` — new.
- `apps/web/src/components/features/admin/{SchoolsTable,SchoolStatusBadge,CreateSchoolDialog,CreateSchoolAdminDialog,EditSeatLimitDialog}.tsx` — new.
- `apps/web/src/lib/api-client.ts` — `schoolsApi`.
- `apps/web/src/messages/{en,fr,ar}.json` — `Admin` namespace.

**Docs**
- `ROADMAP.md` — Stream 6 sub-project 2 status.
