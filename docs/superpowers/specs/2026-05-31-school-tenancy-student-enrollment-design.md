# School Student Enrollment, Seats & COPPA Consent — Design (Sub-project 4a)

> **Status:** Approved (2026-05-31)
> **Epic:** [School Tenancy (B2B)](2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Prior slices (DONE):** [foundation](2026-05-30-school-tenancy-foundation-design.md) · [super-admin console](2026-05-30-school-tenancy-superadmin-console-design.md) · [school-admin console](2026-05-30-school-tenancy-schooladmin-console-design.md)

---

## 1. Why & scope

Epic sub-project 4 ("Seat/license enforcement + rollup + enrollment + school-consent COPPA") is larger than slices 1–3, so it is **split**:

- **4a (this spec):** student enrollment + seat enforcement + school-consent COPPA — the compliance-critical core of provisioning a *seated* student account.
- **4b (later cycle):** classroom→school rollup (`schoolId` on classrooms, assigning students to classes), school/super-admin usage views, teacher-side roster management.

A school student is a `child` user carrying the school's `schoolId` and consuming a license seat. Today no such provisioning path exists: children come only from parent `addChild`, 13–16 self-signup, or the COPPA parent-email pipeline — and there is **no student login mechanism** (parent-created children are minted with only a `displayName`). 4a establishes both.

## 2. Locked decisions (this session)

1. **Direct provisioning, admin-only.** A `school_admin` creates/deactivates students in the `/school` console. No student self-signup; no teacher-side provisioning in 4a.
2. **Username + password login via a synthetic, non-routable email.** The Firebase account's email is `<username>@<loginCode>.students.local`. Students never see it.
3. **Deterministic login resolution via a school login code.** Each school has a short 6-char `loginCode`. Usernames are unique **within a school**. Student sign-in takes `schoolCode + username + password`; the frontend rebuilds the synthetic email and calls Firebase directly — no new backend auth endpoint, no username-enumeration surface.
4. **School-consent COPPA, per student.** Provisioning an under-13 student requires an attestation checkbox and writes a `schoolConsentAuditLog` row. 13+ needs no attestation.
5. **Seats = active students.** Provisioning reserves a seat (blocked at `seatLimit`); deactivating frees it; reactivating re-checks the limit. `seatsUsed` is adjusted transactionally on the school doc.

## 3. Architecture

A new `SchoolStudentsService` + `SchoolStudentsController` in `apps/api/src/modules/schools/` — same shape as the slice-3 `SchoolTeachers*` pair. Base route `/schools/:id/students`, guarded by `FirebaseAuthGuard + RolesGuard + TenantGuard`, `@Roles('school_admin', 'super_admin')` (TenantGuard scopes a `school_admin` to their own `:id`; `super_admin` bypasses). No new module.

## 4. Data model (shared-types)

- `School.loginCode: string` — 6-char code (reuses the classroom join-code charset/generator: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, ambiguity-free). Generated on school creation going forward; **lazily backfilled** for existing slice-1/2 schools the first time students are managed (inside the seat transaction — no separate migration script).
- `UserDoc` gains `username?: string`. (`schoolId`, `active`, `birthYear` already exist.) The doc's `email` field stores the synthetic email.
- `SchoolStudentSummary { uid: string; username: string; displayName: string; active: boolean }` — no PII beyond username.
- New collection `schoolConsentAuditLog/{autoId}`: `{ studentUid, schoolId, adminUid, username, birthYear, attestedAt }` (ISO `attestedAt`).

## 5. Synthetic-email helper (shared, pure)

`synthesizeStudentEmail(loginCode: string, username: string): string` → `` `${username.toLowerCase()}@${loginCode.toLowerCase()}.students.local` ``. Pure, deterministic, used by **both** backend provisioning and frontend student login so the two never drift. Unit-tested directly.

## 6. Endpoints

### `POST /schools/:id/students`
Body `CreateStudentDto { displayName, username, password, birthYear, consentAttested }`.
- `username`: 3–20 chars, `^[a-z0-9]+$` (lowercased), so it composes into a valid email local-part.
- `password`: min 8, **no uppercase/number complexity requirement** (kid-friendly; admin-distributed) — deliberately simpler than the teacher-mint rule.
- `birthYear`: 4-digit; `age = currentYear - birthYear`.
- `consentAttested`: boolean.

Flow:
1. Verify school exists (`SchoolsRepository.findById`) → else `404 SCHOOL_NOT_FOUND`.
2. If `age < 13` and `!consentAttested` → `400 CONSENT_REQUIRED`.
3. **Seat transaction** over `schools/{id}`: read `seatsUsed`/`seatLimit`; if `seatsUsed >= seatLimit` → `409 SEAT_LIMIT_REACHED`; else increment `seatsUsed` (reserve) and set `loginCode` if missing.
4. Create Firebase user with `email = synthesizeStudentEmail(loginCode, username)`, the supplied password, and `displayName`. Duplicate email → `409 USERNAME_TAKEN`. **On any failure here, compensate** (decrement `seatsUsed`).
5. `setCustomUserClaims(uid, { role: 'child', schoolId })`; `usersRepository.create(uid, { email: synthetic, displayName, role: 'child', schoolId, username, birthYear, active: true })`.
6. If `age < 13`, write a `schoolConsentAuditLog` row.

Returns `SchoolStudentSummary`.

### `GET /schools/:id/students`
Returns `{ students: SchoolStudentSummary[], loginCode: string, seatsUsed: number, seatLimit: number }` — the table plus the header's code + seat usage.

### `PATCH /schools/:id/students/:studentId`
Body `{ active: boolean }`. Verifies the target is a `child` with this `schoolId` (else `404 STUDENT_NOT_FOUND`). Deactivate = Firebase `disabled:true` + `active:false` + **seat decrement** (transaction). Reactivate = re-check seat limit (`409 SEAT_LIMIT_REACHED` if full) then `disabled:false` + `active:true` + seat increment. Returns the updated `SchoolStudentSummary`.

## 7. Frontend

- **`/school` console — Students section** (alongside Teachers): header shows the school `loginCode` and a `Seats: {used} / {limit}` indicator; `StudentsTable` (username · name · active pill · per-row toggle); `AddStudentDialog` (name, username, password, birthYear; a conditional **under-13 consent checkbox** that appears once the entered birthYear implies age < 13 and gates submit; inline errors for `SEAT_LIMIT_REACHED` / `USERNAME_TAKEN` / `CONSENT_REQUIRED`). Auto-closes on success (the admin set the password; the code lives in the header).
- **Student sign-in** entry on the login page: `schoolCode + username + password` → `synthesizeStudentEmail` → Firebase `signInWithEmailAndPassword` → existing `getMe` / `homeForRole` (`child` → learner shell). No backend change.
- `schoolsApi` student methods (`listStudents`, `createStudent`, `setStudentActive`).
- `SchoolStudents` i18n namespace in en/fr/ar.

## 8. Error handling

| Code | HTTP | Cause |
|---|---|---|
| `SCHOOL_NOT_FOUND` | 404 | unknown `:id` |
| `CONSENT_REQUIRED` | 400 | under-13 without `consentAttested` |
| `SEAT_LIMIT_REACHED` | 409 | provision/reactivate at `seatLimit` |
| `USERNAME_TAKEN` | 409 | synthetic email already exists in this school |
| `STUDENT_NOT_FOUND` | 404 | PATCH target not a `child` of this school |

All UI feedback is inline (Sonner is broken app-wide).

## 9. Testing

**Backend (TDD, schools module ≥80% lines):**
- `SchoolStudentsService`: provision happy path (seat reserve + claims + user doc + audit row for under-13); under-13 without consent → 400; 13+ no consent/no audit; seat limit reached → 409; duplicate username → 409 + **seat released** (compensation); deactivate frees a seat; reactivate re-checks limit (409 when full) and re-increments; cross-school / non-child target → 404; lazy `loginCode` generation when absent.
- `SchoolStudentsController`: 3-guard override (`FirebaseAuthGuard`, `RolesGuard`, `TenantGuard`); delegates create/list/setActive; list envelope shape.
- Repository additions: `findStudentsBySchool`, the seat transaction helper, `loginCode` generation/uniqueness.
- `synthesizeStudentEmail` pure-function unit test (shared-types or a shared util).

**Frontend:** lint clean; web `tsc` stays at 24 pre-existing errors; user-driven smoke (provision a student → log in as that student via the school code → deactivate frees a seat → reactivate; seat-limit and under-13-consent paths; cross-tenant `:id` → 403).

## 10. Definition of Done

- `loginCode` on `School` (+ lazy backfill), `username` on `UserDoc`, `SchoolStudentSummary`, `schoolConsentAuditLog` — shared-types rebuilt.
- 3 endpoints with `TenantGuard` + `@Roles('school_admin','super_admin')`, all unit-tested; seat accounting transactional and concurrency-safe; under-13 consent enforced + audited.
- `/school` Students section functional (loading/empty/error/seat-limit/consent states); student sign-in works end-to-end.
- `SchoolStudents` i18n in all three locales.
- api: `tsc` 0 errors, full suite green, schools module ≥80% coverage. web: lint clean, `tsc` still 24.
- `ROADMAP.md` Stream 6 sub-project-4 row updated to reflect 4a DONE / 4b pending.

## 11. Out of scope (4b or later)

Classroom→school rollup and class assignment; school/super-admin usage dashboards; teacher-side roster management; coded student self-enroll; bulk/CSV roster import; student credential **re**-issue / password reset (admin re-provisions or a later slice adds it); B2B billing tie-in (sub-project 5).
