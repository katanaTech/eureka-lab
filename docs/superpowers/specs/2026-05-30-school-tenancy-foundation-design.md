# School Tenancy Foundation (Sub-project 1) — Design

> **Status:** Draft (2026-05-30)
> **Epic:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](2026-05-30-school-tenancy-b2b-epic-design.md)
> **ADR:** [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **This is the first, plan-ready slice.** It is **backend + seed + types + tests only** — no console UI (that's sub-project 2).

---

## 1. Scope

### In scope
- Two new roles (`super_admin`, `school_admin`) across shared types, backend guard, and `homeForRole`.
- `schools/{schoolId}` Firestore collection + `schoolId` on user docs.
- A seed script that mints the first `super_admin` out-of-band.
- A `schools` NestJS module: create school, list/read schools, mint a school's first `school_admin` — all `super_admin`-guarded.
- A reusable `TenantGuard` establishing the cross-tenant access pattern.
- Firestore security rules for `schools/{id}`.
- Unit/integration tests (≥80% new-code coverage).

### Out of scope (later sub-projects)
- Super-admin **console UI**, school edit/suspend, seat/key management UI → sub-project 2.
- School admin managing **teachers** → sub-project 3.
- **Enrollment**, seat enforcement on student creation, school-consent COPPA → sub-project 4.
- Real **billing** + secret-key rotation → sub-project 5.
- `/admin` and `/school` pages beyond a non-404 placeholder.

## 2. Roles & hierarchy

Extend `UserRole`:
```ts
export type UserRole =
  | 'child' | 'parent' | 'teacher' | 'admin'   // existing, unchanged
  | 'super_admin' | 'school_admin';            // new
```

| Role | `schoolId` | Created by | `homeForRole` |
|---|---|---|---|
| `super_admin` | none | seed script only | `/admin` |
| `school_admin` | required | a `super_admin` (this slice) | `/school` |
| `teacher` | optional (set when school-provisioned, sub-project 3) | unchanged | `/teacher` |
| `parent` / `child` | none | unchanged B2C self-signup | `/parent` / `/dashboard` |

The placeholder `admin` role is left exactly as-is (still co-mingled to `/parent` in `homeForRole`). No migration.

## 3. Data model

### `schools/{schoolId}`
| Field | Type | Notes |
|---|---|---|
| `id` | string | doc id |
| `name` | string | moderated on create (CLAUDE.md Rule 12) |
| `status` | `'active' \| 'suspended'` | suspension cascade behaviour = sub-project 2 |
| `seatLimit` | number | max student licenses |
| `seatsUsed` | number | denormalized counter; enforced/incremented in sub-project 4 |
| `adminUids` | string[] | school_admin uids |
| `subscription` | `{ tier: string; status: string; periodEnd?: number }` | simple fields now; real billing = sub-project 5 |
| `secretKeys` | `{ enrollmentSecret: string }` | generated on create; semantics/rotation = sub-project 5 |
| `createdAt` | number (epoch ms) | |
| `createdBy` | string | super_admin uid |

### User doc delta
Add optional **`schoolId?: string`** to the user document (`UserDoc` / `UserProfile`). Present on `school_admin` (and later school-provisioned teachers/students); absent for B2C and `super_admin`.

A shared type is added:
```ts
export interface School { /* fields above */ }
export interface SchoolSummary { id: string; name: string; status: string; seatLimit: number; seatsUsed: number; }
```

## 4. Super-admin bootstrap (chicken-and-egg)

New `scripts/` directory (does not exist yet) + `scripts/seed-super-admin.ts`:
- Invoked manually: `pnpm tsx scripts/seed-super-admin.ts <email>` (exact runner finalized in the plan).
- Uses the Firebase **Admin SDK** + service-account credentials (same config the API uses).
- Looks up the Firebase user by email (must already exist in Firebase Auth, or create with a temp password — decided in plan), sets custom claim `{ role: 'super_admin' }`, and upserts the Firestore user doc with `role: 'super_admin'`, no `schoolId`.
- Idempotent: re-running on the same email is a no-op/refresh.
- **No API or UI path mints `super_admin`.** This is the security boundary (ADR-008).

## 5. Backend — `schools` module

NestJS module mirroring existing module structure (`apps/api/src/modules/schools/`).

### Endpoints (all `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles('super_admin')`)
| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/schools` | `CreateSchoolDto { name, seatLimit, subscriptionTier? }` | created `School` (with generated `enrollmentSecret`) |
| `GET` | `/schools` | — | `SchoolSummary[]` |
| `GET` | `/schools/:id` | — | `School` |
| `POST` | `/schools/:id/admins` | `CreateSchoolAdminDto { email, displayName, password }` | minted school_admin `{ uid, email, displayName, role, schoolId }` |

- `CreateSchoolDto`: `name` (2–100, moderated), `seatLimit` (int ≥ 0), optional `subscriptionTier`. class-validator (CLAUDE.md Rule 10).
- `POST /schools/:id/admins` mints a Firebase user (mirrors `AuthService.addChild`): `createUser` → `setCustomUserClaims({ role:'school_admin' })` → `usersRepository.create({ role:'school_admin', schoolId })` → push uid into `schools/{id}.adminUids`.
- `seatsUsed` starts at 0; created schools have it set but enforcement is sub-project 4.

### `SchoolsRepository`
Firestore CRUD on `schools`; `createSchool`, `findById`, `listAll` (bounded), `addAdminUid`, atomic `incrementSeatsUsed(delta)` (used in sub-project 4 — added now so the pattern exists, tested).

### `TenantGuard`
A guard/util that reads the authenticated user's `schoolId` (from the Firestore profile or custom claim) and, for routes scoped to `:id`, rejects when `user.schoolId !== params.id` (with `super_admin` bypassing). **All four foundation endpoints are `super_admin`-only, so this guard has no live consumer in this slice** — it is built and **unit-tested as shared infrastructure** now (so the pattern + tests exist), and first applied to a live route in sub-projects 2–3 (school-admin-scoped reads/writes). It is **not** wired onto the super-admin-only routes here.

### Untouched
`AuthService.deriveRole`, signup, OAuth signup, parent/child/teacher paths — **zero changes**. School accounts are minted, never age-derived.

## 6. Frontend — minimal

- Extend `homeForRole()` (`apps/web/src/lib/auth-redirects.ts`): `super_admin → /admin`, `school_admin → /school`. Extend `UserRoleString` accordingly (already permissive `string`, but add explicit members).
- Add non-404 placeholder routes `/(dashboard)/admin/page.tsx` and `/(dashboard)/school/page.tsx` (or equivalent group) — a simple "console coming soon" panel so redirects resolve. Full consoles = sub-projects 2 & 3.
- No api-client `schoolsApi` needed yet (no UI calls it); added in sub-project 2. *(If trivial, a typed stub may be added — decided in plan.)*

## 7. Security & testing

### Firestore rules (`infrastructure/firebase/`)
- `schools/{id}`: write only when `request.auth.token.role == 'super_admin'`; read when `super_admin` **or** (`school_admin` and `resource.data.adminUids` contains `request.auth.uid`).
- User-doc `schoolId` writes remain server-only (Admin SDK), consistent with existing rules.

### Tests (Jest + Supertest, `--runInBand`)
- `SchoolsService`: create school (fields + generated secret + counters), mint school_admin (claims + schoolId + adminUids push), list/read.
- Guard: `@Roles('super_admin')` rejects parent/teacher/school_admin; `TenantGuard` rejects cross-tenant, allows same-tenant + super_admin.
- Repository: atomic `incrementSeatsUsed`.
- Seed script: covered by a unit test around its core helper (claim-set + doc-upsert), mocking the Admin SDK.

## 8. Acceptance criteria (DoD)

- [ ] `UserRole` + `homeForRole` + `School` types added; web + api `tsc --noEmit` clean (no new errors beyond the 24 pre-existing web test-file errors).
- [ ] `scripts/seed-super-admin.ts` mints a `super_admin` (claim + Firestore doc), idempotent.
- [ ] `schools` module: 4 endpoints, all `super_admin`-guarded; create generates `enrollmentSecret` + counters; mint-admin links `schoolId` + `adminUids`.
- [ ] `TenantGuard` enforces cross-tenant rejection.
- [ ] Firestore rules for `schools/{id}` added.
- [ ] Tests pass, ≥80% new-code coverage; api suite green under `--runInBand`.
- [ ] Placeholder `/admin` + `/school` routes resolve (no 404 on redirect).
- [ ] ROADMAP epic row updated; ADR-008 referenced.

## 9. Likely file touch-list (for planning)

- `packages/shared-types/src/index.ts` — `UserRole`, `School`, `SchoolSummary`, `UserProfile.schoolId`. Rebuild shared-types.
- `apps/api/src/modules/schools/` — module, controller, service, repository, dtos, specs (new).
- `apps/api/src/modules/users/users.repository.ts` — accept/persist `schoolId`.
- `apps/api/src/common/guards/tenant.guard.ts` — new.
- `apps/api/src/app.module.ts` — register `SchoolsModule`.
- `scripts/seed-super-admin.ts` (+ test) — new.
- `apps/web/src/lib/auth-redirects.ts` — two new role mappings.
- `apps/web/src/app/.../admin/page.tsx`, `.../school/page.tsx` — placeholders.
- `infrastructure/firebase/firestore.rules` — `schools/{id}` rules.
- `ROADMAP.md` — epic row.
