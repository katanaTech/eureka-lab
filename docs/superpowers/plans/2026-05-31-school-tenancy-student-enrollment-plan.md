# School Student Enrollment, Seats & COPPA — Implementation Plan (Sub-project 4a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a school admin provision seated student accounts (username + password login) in their school, enforcing license seats transactionally and a per-student school-consent COPPA path for under-13s.

**Architecture:** A new `SchoolStudentsService` + `SchoolStudentsController` in the schools module (mirrors the slice-3 `SchoolTeachers*` pair) expose `/schools/:id/students` (create / list / deactivate-reactivate) behind `TenantGuard`. Students authenticate with a non-routable synthetic email `<username>@<loginCode>.students.local` built by a shared pure helper; seats are reserved/released in a Firestore transaction on the school doc. Frontend adds a Students tab to `/school` plus a student sign-in page.

**Tech Stack:** NestJS + Firebase Admin (Jest, TDD), Next.js 14.2 App Router + next-intl + Tailwind v4 (lint/tsc + user smoke).

**Spec:** [student enrollment](../specs/2026-05-31-school-tenancy-student-enrollment-design.md) · **Epic:** [epic](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)

**Branch:** continue on `feat/school-admin-console` (stacked) **or** a fresh `feat/school-student-enrollment` off it — decide at execution handoff.

---

## Pre-flight (run once before Task 1)

- [ ] Baseline green:
  - `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
  - `pnpm --filter @eureka-lab/api exec jest --runInBand` → **32 suites / 309 tests pass**
  - `pnpm --filter @eureka-lab/web lint` → clean
  - `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → `24`

> **Conventions:** API tests `pnpm --filter @eureka-lab/api exec jest --runInBand [path]` (never `test -- --runInBand`). Rebuild shared-types after editing: `pnpm --filter @eureka-lab/shared-types build`. One commit/task, footer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (Bash heredoc `git commit -F - <<'EOF'`). Next 14.2 `params` are synchronous. UI feedback is **inline**, never `toast()`. Web `tsc` success = count stays **24**. Controller specs must `.overrideGuard()` all three guards.

---

## File Structure

**Backend**
- `packages/shared-types/src/index.ts` — `School.loginCode`, `SchoolStudentSummary`, `synthesizeStudentEmail()`.
- `apps/api/src/modules/schools/synthesize-student-email.spec.ts` — unit test for the helper (new).
- `apps/api/src/modules/users/users.repository.ts` (+ `.spec.ts`) — `username` field, `findStudentsBySchool`.
- `apps/api/src/modules/schools/schools.repository.ts` (+ `.spec.ts`) — `generateUniqueLoginCode`.
- `apps/api/src/modules/schools/dto/create-student.dto.ts`, `update-student-active.dto.ts` — new.
- `apps/api/src/modules/schools/school-students.service.ts` (+ `.spec.ts`) — new.
- `apps/api/src/modules/schools/school-students.controller.ts` (+ `.spec.ts`) — new.
- `apps/api/src/modules/schools/schools.module.ts` — register controller + service.

**Frontend**
- `apps/web/src/lib/api-client.ts` — student methods on `schoolsApi`.
- `apps/web/src/components/features/school/{StudentsTable,AddStudentDialog,StudentsPanel}.tsx` — new.
- `apps/web/src/app/(dashboard)/school/page.tsx` — add Teachers/Students tab.
- `apps/web/src/components/features/auth/StudentLoginForm.tsx`, `apps/web/src/app/(auth)/student-login/page.tsx` — new.
- `apps/web/src/components/features/auth/LoginForm.tsx` — add a link to student sign-in.
- `apps/web/src/messages/{en,fr,ar}.json` — `SchoolStudents` namespace.

**Docs:** `ROADMAP.md`.

---

## Task 1: Shared type + login-code, summary, synthetic-email helper

**Files:** Modify `packages/shared-types/src/index.ts`; Create `apps/api/src/modules/schools/synthesize-student-email.spec.ts`

- [ ] **Step 1: Add `loginCode` to `School`.** In the `School` interface, after the `seatsUsed` line (`seatsUsed: number;` and its doc comment), add:

```ts
  /** Short code students type at sign-in to resolve their school (lazily generated) */
  loginCode?: string;
```

- [ ] **Step 2: Add `SchoolStudentSummary`** directly after the `SchoolTeacherSummary` interface:

```ts
/** Resolved student row for the school-admin console */
export interface SchoolStudentSummary {
  uid: string;
  username: string;
  displayName: string;
  /** false when the student's login is disabled; defaults true on older docs */
  active: boolean;
}
```

- [ ] **Step 3: Add the pure helper** at the end of the file:

```ts
/**
 * Build the non-routable synthetic email a school student authenticates with.
 * Deterministic so backend provisioning and frontend login never drift.
 * @param loginCode - The school's short login code.
 * @param username - The student's per-school username.
 * @returns `<username>@<loginCode>.students.local` (lowercased).
 */
export function synthesizeStudentEmail(loginCode: string, username: string): string {
  return `${username.toLowerCase()}@${loginCode.toLowerCase()}.students.local`;
}
```

- [ ] **Step 4: Write the helper unit test.** Create `apps/api/src/modules/schools/synthesize-student-email.spec.ts`:

```ts
import { synthesizeStudentEmail } from '@eureka-lab/shared-types';

describe('synthesizeStudentEmail', () => {
  it('builds a lowercased non-routable email from code + username', () => {
    expect(synthesizeStudentEmail('AB12CD', 'jsmith')).toBe('jsmith@ab12cd.students.local');
  });

  it('lowercases mixed-case username and code', () => {
    expect(synthesizeStudentEmail('Ab12Cd', 'JSmith')).toBe('jsmith@ab12cd.students.local');
  });
});
```

- [ ] **Step 5: Build shared-types.**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: exits 0.

- [ ] **Step 6: Run the helper test.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/synthesize-student-email.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit.**

```bash
git add packages/shared-types/src/index.ts apps/api/src/modules/schools/synthesize-student-email.spec.ts
git commit -F - <<'EOF'
feat(shared-types): School.loginCode, SchoolStudentSummary, synthesizeStudentEmail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: UsersRepository — `username` + `findStudentsBySchool` (TDD)

**Files:** Modify `apps/api/src/modules/users/users.repository.ts` + `.spec.ts`

- [ ] **Step 1: Add the failing tests.** In `users.repository.spec.ts`, inside the top-level `describe('UsersRepository', …)`, append two new describe blocks after the existing `describe('setActive', …)` block (before the final closing `});` of the file):

```ts
  describe('create username', () => {
    it('persists username when provided', async () => {
      await repo.create('s-1', { email: 'jsmith@ab12cd.students.local', displayName: 'Jamie', role: 'child', schoolId: 'school-1', username: 'jsmith' });
      expect(mockSet.mock.calls[0][0]).toMatchObject({ username: 'jsmith', role: 'child', schoolId: 'school-1' });
    });
  });

  describe('findStudentsBySchool', () => {
    it('queries role==child AND schoolId==id and maps data', async () => {
      mockGet.mockResolvedValueOnce({ docs: [{ data: () => ({ uid: 's-1', role: 'child', schoolId: 'school-1', username: 'jsmith' }) }] });
      const result = await repo.findStudentsBySchool('school-1');
      expect(mockCollectionRef.where).toHaveBeenCalledWith('role', '==', 'child');
      expect(whereChain.where).toHaveBeenCalledWith('schoolId', '==', 'school-1');
      expect(result).toEqual([{ uid: 's-1', role: 'child', schoolId: 'school-1', username: 'jsmith' }]);
    });
  });
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts`
Expected: FAIL — `username` not accepted in `CreateUserData` / `findStudentsBySchool` not a function.

- [ ] **Step 3: Implement.** In `users.repository.ts`:

3a. Add `username?: string;` to the `UserDoc` interface (after `active?: boolean;`):
```ts
  username?: string;
```

3b. Add `username?: string;` to the `CreateUserData` interface (after `active?: boolean;`):
```ts
  username?: string;
```

3c. In `create()`, add the spread after the `active` spread:
```ts
      ...(data.username !== undefined && { username: data.username }),
```

3d. Add this method after `findTeachersBySchool` (anywhere in the class is fine):
```ts
  /**
   * Find all student (child) user docs belonging to a school.
   * @param schoolId - School tenant id.
   * @returns Student user documents.
   */
  async findStudentsBySchool(schoolId: string): Promise<UserDoc[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'child')
      .where('schoolId', '==', schoolId)
      .get();
    return snapshot.docs.map((d) => d.data() as UserDoc);
  }
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/users/users.repository.ts apps/api/src/modules/users/users.repository.spec.ts
git commit -F - <<'EOF'
feat(users): username field + findStudentsBySchool

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: SchoolsRepository — `generateUniqueLoginCode` (TDD)

**Files:** Modify `apps/api/src/modules/schools/schools.repository.ts` + `.spec.ts`

- [ ] **Step 1: Add the failing test.** In `schools.repository.spec.ts`, add a describe block (match the file's existing mock style — it mocks `firestore.collection`). Append inside the top-level describe, after the last existing test:

```ts
  describe('generateUniqueLoginCode', () => {
    it('returns a 6-char code that is not already used', async () => {
      // First candidate is unused (empty query result).
      mockWhere.mockReturnValueOnce({ limit: () => ({ get: () => Promise.resolve({ empty: true }) }) });
      const code = await repo.generateUniqueLoginCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    });
  });
```

> **Note:** match the spec file's existing mock variable names. If the existing file exposes the collection mock differently (e.g. `mockCollection.where`), adapt the `mockWhere` reference accordingly — the behaviour asserted (a `where(...).limit(1).get()` returning `{ empty: true }`) is what matters. Read the top of `schools.repository.spec.ts` first and reuse its mocks.

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: FAIL — `generateUniqueLoginCode` not a function.

- [ ] **Step 3: Implement.** In `schools.repository.ts`:

3a. Add these module-level constants after the `MAX_SCHOOLS` constant:
```ts
/** Ambiguity-free charset for login codes (mirrors classroom join codes). */
const LOGIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Login code length. */
const LOGIN_CODE_LENGTH = 6;
```

3b. Add this method to the class (after `incrementSeatsUsed`):
```ts
  /**
   * Generate a 6-char school login code not currently in use.
   * @returns A unique login code.
   * @throws Error after 10 failed attempts (astronomically unlikely).
   */
  async generateUniqueLoginCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < LOGIN_CODE_LENGTH; i++) {
        code += LOGIN_CODE_CHARS[Math.floor(Math.random() * LOGIN_CODE_CHARS.length)];
      }
      const existing = await this.firebase.firestore
        .collection(this.collection)
        .where('loginCode', '==', code)
        .limit(1)
        .get();
      if (existing.empty) return code;
    }
    throw new Error('Failed to generate a unique school login code');
  }
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: PASS (existing + 1 new).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.repository.ts apps/api/src/modules/schools/schools.repository.spec.ts
git commit -F - <<'EOF'
feat(schools): generateUniqueLoginCode on SchoolsRepository

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: Student DTOs

**Files:** Create `create-student.dto.ts` + `update-student-active.dto.ts` under `apps/api/src/modules/schools/dto/`

- [ ] **Step 1: `create-student.dto.ts`.**

```ts
import { IsString, IsNotEmpty, IsInt, IsBoolean, MinLength, MaxLength, Min, Max, Matches } from 'class-validator';

/** Request body for POST /schools/:id/students (school_admin/super_admin). */
export class CreateStudentDto {
  /** Student display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Per-school username — lowercase letters/digits, 3–20 chars (email local-part safe) */
  @IsString()
  @Matches(/^[a-z0-9]{3,20}$/, {
    message: 'Username must be 3–20 lowercase letters or digits',
  })
  username!: string;

  /** Initial password — min 8, no complexity requirement (kid-friendly) */
  @IsString()
  @MinLength(8)
  password!: string;

  /** 4-digit year of birth (drives the under-13 consent gate) */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;

  /** True when the admin attests school consent (required only for under-13) */
  @IsBoolean()
  consentAttested!: boolean;
}
```

- [ ] **Step 2: `update-student-active.dto.ts`.**

```ts
import { IsBoolean } from 'class-validator';

/** Request body for PATCH /schools/:id/students/:studentId. */
export class UpdateStudentActiveDto {
  /** New active state (false disables login + frees the seat). */
  @IsBoolean()
  active!: boolean;
}
```

- [ ] **Step 3: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

```bash
git add apps/api/src/modules/schools/dto/create-student.dto.ts apps/api/src/modules/schools/dto/update-student-active.dto.ts
git commit -F - <<'EOF'
feat(schools): student DTOs (create + set-active)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: SchoolStudentsService (TDD)

**Files:** Create `apps/api/src/modules/schools/school-students.service.ts` + `.spec.ts`

- [ ] **Step 1: Write the failing test.** Create `school-students.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolStudentsService } from './school-students.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);

const mockTxn = { get: jest.fn(), update: jest.fn() };
const mockAuditSet = jest.fn();
const mockDocRef = { set: mockAuditSet };
const mockFirestore = {
  collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue(mockDocRef) }),
  runTransaction: jest.fn().mockImplementation((fn: (t: typeof mockTxn) => unknown) => fn(mockTxn)),
};
const mockFirebase = {
  auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims, updateUser: mockUpdateUser },
  firestore: mockFirestore,
};
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn(), findStudentsBySchool: jest.fn(), setActive: jest.fn().mockResolvedValue(undefined) };
const mockSchoolsRepo = { findById: jest.fn(), generateUniqueLoginCode: jest.fn().mockResolvedValue('AB12CD'), incrementSeatsUsed: jest.fn().mockResolvedValue(undefined) };

/** Helper: make the seat transaction read a school with the given seats. */
function seatSnap(seatsUsed: number, seatLimit: number, loginCode?: string) {
  mockTxn.get.mockResolvedValueOnce({ exists: true, data: () => ({ seatsUsed, seatLimit, loginCode }) });
}

describe('SchoolStudentsService', () => {
  let service: SchoolStudentsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    mockSchoolsRepo.generateUniqueLoginCode.mockResolvedValue('AB12CD');
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolStudentsService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SchoolsRepository, useValue: mockSchoolsRepo },
      ],
    }).compile();
    service = moduleRef.get(SchoolStudentsService);
  });

  describe('createStudent', () => {
    it('reserves a seat, mints a child with synthetic email + school claims', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockResolvedValueOnce({ uid: 's-9' });
      const result = await service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2015, consentAttested: true });
      expect(mockTxn.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ seatsUsed: 1 }));
      expect(mockCreateUser).toHaveBeenCalledWith({ email: 'jsmith@ab12cd.students.local', password: 'hunter2!', displayName: 'Jamie' });
      expect(mockSetClaims).toHaveBeenCalledWith('s-9', { role: 'child', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('s-9', { email: 'jsmith@ab12cd.students.local', displayName: 'Jamie', role: 'child', schoolId: 'school-1', username: 'jsmith', birthYear: 2015, active: true });
      expect(mockAuditSet).toHaveBeenCalledWith(expect.objectContaining({ studentUid: 's-9', schoolId: 'school-1', username: 'jsmith', birthYear: 2015 }));
      expect(result).toEqual({ uid: 's-9', username: 'jsmith', displayName: 'Jamie', active: true });
    });

    it('skips the consent audit for 13+ students', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockResolvedValueOnce({ uid: 's-10' });
      await service.createStudent('school-1', { displayName: 'Alex', username: 'alex01', password: 'hunter2!', birthYear: 2008, consentAttested: false });
      expect(mockAuditSet).not.toHaveBeenCalled();
    });

    it('throws CONSENT_REQUIRED for under-13 without attestation (no seat touched)', async () => {
      await expect(service.createStudent('school-1', { displayName: 'Sam', username: 'sam01', password: 'hunter2!', birthYear: 2016, consentAttested: false }))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockFirestore.runTransaction).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('throws SEAT_LIMIT_REACHED when the school is full', async () => {
      seatSnap(30, 30, 'AB12CD');
      await expect(service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }))
        .rejects.toBeInstanceOf(ConflictException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps duplicate username to USERNAME_TAKEN and releases the seat', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }))
        .rejects.toBeInstanceOf(ConflictException);
      expect(mockSchoolsRepo.incrementSeatsUsed).toHaveBeenCalledWith('school-1', -1);
    });

    it('throws NotFound when the school is missing', async () => {
      mockTxn.get.mockResolvedValueOnce({ exists: false });
      await expect(service.createStudent('nope', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listRoster', () => {
    it('returns mapped students + loginCode + seats', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1', loginCode: 'AB12CD', seatsUsed: 1, seatLimit: 30 });
      mockUsersRepo.findStudentsBySchool.mockResolvedValueOnce([
        { uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false },
        { uid: 's-2', username: 'alex01', displayName: 'Alex' },
      ]);
      const result = await service.listRoster('school-1');
      expect(result).toEqual({
        students: [
          { uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false },
          { uid: 's-2', username: 'alex01', displayName: 'Alex', active: true },
        ],
        loginCode: 'AB12CD',
        seatsUsed: 1,
        seatLimit: 30,
      });
    });

    it('throws NotFound for a missing school', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce(null);
      await expect(service.listRoster('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setStudentActive', () => {
    it('deactivating disables login, flag, and frees a seat', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1' });
      const result = await service.setStudentActive('school-1', 's-1', false);
      expect(mockUpdateUser).toHaveBeenCalledWith('s-1', { disabled: true });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('s-1', false);
      expect(mockSchoolsRepo.incrementSeatsUsed).toHaveBeenCalledWith('school-1', -1);
      expect(result).toEqual({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false });
    });

    it('reactivating re-checks the seat limit then enables login', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1' });
      seatSnap(5, 30, 'AB12CD');
      const result = await service.setStudentActive('school-1', 's-1', true);
      expect(mockTxn.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ seatsUsed: 6 }));
      expect(mockUpdateUser).toHaveBeenCalledWith('s-1', { disabled: false });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('s-1', true);
      expect(result.active).toBe(true);
    });

    it('reactivating throws SEAT_LIMIT_REACHED when full (login untouched)', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1' });
      seatSnap(30, 30, 'AB12CD');
      await expect(service.setStudentActive('school-1', 's-1', true)).rejects.toBeInstanceOf(ConflictException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound for a student in another school', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', role: 'child', schoolId: 'other' });
      await expect(service.setStudentActive('school-1', 's-1', false)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound when the uid is not a child', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', role: 'teacher', schoolId: 'school-1' });
      await expect(service.setStudentActive('school-1', 't-1', false)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-students.service.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `school-students.service.ts`:

```ts
import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { School, SchoolStudentSummary } from '@eureka-lab/shared-types';
import { synthesizeStudentEmail } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { SchoolsRepository } from './schools.repository';
import { CreateStudentDto } from './dto/create-student.dto';

/** Combined roster payload for the Students tab. */
export interface StudentRoster {
  students: SchoolStudentSummary[];
  loginCode: string;
  seatsUsed: number;
  seatLimit: number;
}

/** Age below which the COPPA school-consent attestation is required. */
const CONSENT_AGE_THRESHOLD = 13;

/**
 * School-admin student management. TenantGuard scopes a school_admin to their
 * own school at the controller; this service additionally verifies a targeted
 * student belongs to the school, and keeps the seat counter accurate via a
 * transaction on the school doc.
 */
@Injectable()
export class SchoolStudentsService {
  private readonly logger = new Logger(SchoolStudentsService.name);
  private readonly auditCollection = 'schoolConsentAuditLog';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) {}

  /**
   * Provision a seated student account under a school.
   * @param schoolId - Target school id.
   * @param dto - Student account data.
   * @returns The student summary.
   * @throws BadRequestException CONSENT_REQUIRED for under-13 without attestation.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException SEAT_LIMIT_REACHED / USERNAME_TAKEN.
   */
  async createStudent(schoolId: string, dto: CreateStudentDto): Promise<SchoolStudentSummary> {
    const age = new Date().getFullYear() - dto.birthYear;
    if (age < CONSENT_AGE_THRESHOLD && !dto.consentAttested) {
      throw new BadRequestException({ message: 'School consent is required for under-13 students', code: 'CONSENT_REQUIRED' });
    }

    const candidateCode = await this.schoolsRepository.generateUniqueLoginCode();
    const loginCode = await this.reserveSeat(schoolId, candidateCode);
    const email = synthesizeStudentEmail(loginCode, dto.username);

    let uid: string;
    try {
      const fbUser = await this.firebase.auth.createUser({ email, password: dto.password, displayName: dto.displayName });
      uid = fbUser.uid;
    } catch (error: unknown) {
      await this.schoolsRepository.incrementSeatsUsed(schoolId, -1); // release the reserved seat
      const code = (error as { code?: string }).code ?? '';
      const msg = error instanceof Error ? error.message : '';
      if (code === 'auth/email-already-exists' || msg.includes('email-already-exists')) {
        throw new ConflictException({ message: 'Username is already taken in this school', code: 'USERNAME_TAKEN' });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'child', schoolId });
    await this.usersRepository.create(uid, {
      email,
      displayName: dto.displayName,
      role: 'child',
      schoolId,
      username: dto.username,
      birthYear: dto.birthYear,
      active: true,
    });

    if (age < CONSENT_AGE_THRESHOLD) {
      await this.firebase.firestore.collection(this.auditCollection).doc().set({
        studentUid: uid,
        schoolId,
        adminUid: 'system', // replaced by the calling admin's uid in the controller layer if needed
        username: dto.username,
        birthYear: dto.birthYear,
        attestedAt: new Date().toISOString(),
      });
    }

    this.logger.log({ event: 'student_provisioned', schoolId, uid, underThirteen: age < CONSENT_AGE_THRESHOLD });
    return { uid, username: dto.username, displayName: dto.displayName, active: true };
  }

  /**
   * List a school's students plus its login code and seat usage.
   * @param schoolId - School id.
   * @returns Roster payload.
   * @throws NotFoundException when the school is missing.
   */
  async listRoster(schoolId: string): Promise<StudentRoster> {
    const school = await this.schoolsRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const docs = await this.usersRepository.findStudentsBySchool(schoolId);
    const students = docs.map((d) => ({
      uid: d.uid,
      username: d.username ?? '',
      displayName: d.displayName,
      active: d.active ?? true,
    }));
    return { students, loginCode: school.loginCode ?? '', seatsUsed: school.seatsUsed, seatLimit: school.seatLimit };
  }

  /**
   * Activate or deactivate a student (Firebase disabled flag + user-doc flag +
   * seat accounting). Reactivation re-checks the seat limit.
   * @param schoolId - School id (must own the student).
   * @param studentId - Student uid.
   * @param active - New active state.
   * @returns The updated student summary.
   * @throws NotFoundException when the uid is not a child of this school.
   * @throws ConflictException SEAT_LIMIT_REACHED when reactivating a full school.
   */
  async setStudentActive(schoolId: string, studentId: string, active: boolean): Promise<SchoolStudentSummary> {
    const student = await this.usersRepository.findByUid(studentId);
    if (!student || student.role !== 'child' || student.schoolId !== schoolId) {
      throw new NotFoundException({ message: 'Student not found in this school', code: 'STUDENT_NOT_FOUND' });
    }

    if (active) {
      const candidateCode = await this.schoolsRepository.generateUniqueLoginCode();
      await this.reserveSeat(schoolId, candidateCode);
      try {
        await this.firebase.auth.updateUser(studentId, { disabled: false });
        await this.usersRepository.setActive(studentId, true);
      } catch (error) {
        await this.schoolsRepository.incrementSeatsUsed(schoolId, -1); // release on failure
        throw error;
      }
    } else {
      await this.firebase.auth.updateUser(studentId, { disabled: true });
      await this.usersRepository.setActive(studentId, false);
      await this.schoolsRepository.incrementSeatsUsed(schoolId, -1);
    }

    this.logger.log({ event: 'student_active_changed', schoolId, studentId, active });
    return { uid: student.uid, username: student.username ?? '', displayName: student.displayName, active };
  }

  /**
   * Reserve one seat on the school doc inside a transaction, lazily setting the
   * login code if absent.
   * @param schoolId - School id.
   * @param candidateLoginCode - Code to assign if the school has none yet.
   * @returns The school's effective login code.
   * @throws NotFoundException when the school is missing.
   * @throws ConflictException SEAT_LIMIT_REACHED at capacity.
   */
  private async reserveSeat(schoolId: string, candidateLoginCode: string): Promise<string> {
    const ref = this.firebase.firestore.collection('schools').doc(schoolId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      if (!snap.exists) {
        throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
      }
      const school = snap.data() as School;
      if (school.seatsUsed >= school.seatLimit) {
        throw new ConflictException({ message: 'Seat limit reached', code: 'SEAT_LIMIT_REACHED' });
      }
      const loginCode = school.loginCode ?? candidateLoginCode;
      const update: Record<string, unknown> = { seatsUsed: school.seatsUsed + 1 };
      if (!school.loginCode) update.loginCode = loginCode;
      txn.update(ref, update);
      return loginCode;
    });
  }
}
```

> **Note on `adminUid`:** the audit row records `adminUid: 'system'` here because the service does not receive the caller uid in 4a. The controller already authenticates the admin; capturing their uid into the audit row is a small enhancement deferred with the rest of usage/audit views to 4b. The audit row's `studentUid`/`schoolId`/`birthYear` are the COPPA-material fields and are present.

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-students.service.spec.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/school-students.service.ts apps/api/src/modules/schools/school-students.service.spec.ts
git commit -F - <<'EOF'
feat(schools): SchoolStudentsService — provision/list/set-active + seats + consent

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: SchoolStudentsController + module registration (TDD)

**Files:** Create `school-students.controller.ts` + `.spec.ts`; modify `schools.module.ts`

- [ ] **Step 1: Write the failing test.** Create `school-students.controller.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStudentsController } from './school-students.controller';
import { SchoolStudentsService } from './school-students.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = {
  createStudent: jest.fn(),
  listRoster: jest.fn(),
  setStudentActive: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolStudentsController', () => {
  let controller: SchoolStudentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolStudentsController],
      providers: [{ provide: SchoolStudentsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolStudentsController);
  });

  it('create delegates id + dto', async () => {
    const dto = { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2015, consentAttested: true };
    mockService.createStudent.mockResolvedValueOnce({ uid: 's-9' });
    expect(await controller.create('s1', dto)).toEqual({ uid: 's-9' });
    expect(mockService.createStudent).toHaveBeenCalledWith('s1', dto);
  });

  it('list returns the roster payload', async () => {
    const roster = { students: [], loginCode: 'AB12CD', seatsUsed: 0, seatLimit: 30 };
    mockService.listRoster.mockResolvedValueOnce(roster);
    expect(await controller.list('s1')).toEqual(roster);
    expect(mockService.listRoster).toHaveBeenCalledWith('s1');
  });

  it('setActive delegates id + studentId + active', async () => {
    mockService.setStudentActive.mockResolvedValueOnce({ uid: 's-1', active: false });
    expect(await controller.setActive('s1', 's-1', { active: false })).toEqual({ uid: 's-1', active: false });
    expect(mockService.setStudentActive).toHaveBeenCalledWith('s1', 's-1', false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-students.controller.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the controller.** Create `school-students.controller.ts`:

```ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolStudentsService } from './school-students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentActiveDto } from './dto/update-student-active.dto';

/**
 * School-admin student management, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/students.
 */
@Controller('schools/:id/students')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolStudentsController {
  constructor(private readonly studentsService: SchoolStudentsService) {}

  /**
   * Provision a student in this school.
   * @param id - School id.
   * @param dto - Student data.
   * @returns The provisioned student summary.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('id') id: string, @Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent(id, dto);
  }

  /**
   * List this school's students + login code + seat usage.
   * @param id - School id.
   * @returns Roster payload.
   */
  @Get()
  async list(@Param('id') id: string) {
    return this.studentsService.listRoster(id);
  }

  /**
   * Activate / deactivate a student.
   * @param id - School id.
   * @param studentId - Student uid.
   * @param dto - { active }.
   * @returns The updated student summary.
   */
  @Patch(':studentId')
  async setActive(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentActiveDto,
  ) {
    return this.studentsService.setStudentActive(id, studentId, dto.active);
  }
}
```

- [ ] **Step 4: Register in the module.** In `schools.module.ts`:

4a. Add imports (after the existing `SchoolTeachers*` imports):
```ts
import { SchoolStudentsController } from './school-students.controller';
import { SchoolStudentsService } from './school-students.service';
```
4b. Add `SchoolStudentsController` to the `controllers` array and `SchoolStudentsService` to the `providers` array.

- [ ] **Step 5: Run the controller spec, then the full suite.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-students.controller.spec.ts`
Expected: PASS (3 tests).
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all green (34 suites + new tests).

- [ ] **Step 6: Commit.**

```bash
git add apps/api/src/modules/schools/school-students.controller.ts apps/api/src/modules/schools/school-students.controller.spec.ts apps/api/src/modules/schools/schools.module.ts
git commit -F - <<'EOF'
feat(schools): SchoolStudentsController (TenantGuard) + module wiring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: `schoolsApi` student methods

**Files:** Modify `apps/web/src/lib/api-client.ts`

- [ ] **Step 1: Add the import.** In the shared-types import block, add `SchoolStudentSummary` next to `SchoolTeacherSummary`:
```ts
  SchoolStudentSummary,
```

- [ ] **Step 2: Add the methods.** Inside the `schoolsApi` object, append after `setTeacherActive` (before the closing `};`):

```ts
  /** List a school's students + login code + seat usage. */
  listStudents: (schoolId: string) =>
    request<{ students: SchoolStudentSummary[]; loginCode: string; seatsUsed: number; seatLimit: number }>(
      `/schools/${schoolId}/students`,
    ),

  /** Provision a student (school_admin sets username + temp password). */
  createStudent: (
    schoolId: string,
    body: { displayName: string; username: string; password: string; birthYear: number; consentAttested: boolean },
  ) => request<SchoolStudentSummary>(`/schools/${schoolId}/students`, { method: 'POST', body: JSON.stringify(body) }),

  /** Activate / deactivate a student. */
  setStudentActive: (schoolId: string, studentId: string, active: boolean) =>
    request<SchoolStudentSummary>(`/schools/${schoolId}/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
```

- [ ] **Step 3: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

```bash
git add apps/web/src/lib/api-client.ts
git commit -F - <<'EOF'
feat(web): schoolsApi student methods

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 8: `SchoolStudents` i18n namespace (en/fr/ar)

**Files:** Modify `apps/web/src/messages/{en,fr,ar}.json`

- [ ] **Step 1: Insert the `SchoolStudents` namespace** immediately before the `"SchoolAdmin": {` line in each file (so it sits just before the slice-3 namespace).

**en.json** (anchor `  "SchoolAdmin": {`):
```json
  "SchoolStudents": {
    "tab": "Students",
    "teachersTab": "Teachers",
    "title": "Students",
    "addStudent": "Add Student",
    "name": "Name",
    "username": "Username",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "displayName": "Display Name",
    "password": "Temporary Password",
    "birthYear": "Year of Birth",
    "seats": "Seats",
    "schoolCode": "School code",
    "loading": "Loading…",
    "noStudents": "No students yet. Click \"Add Student\" to enroll the first one.",
    "creating": "Creating…",
    "cancel": "Cancel",
    "deactivate": "Deactivate",
    "reactivate": "Reactivate",
    "deactivateConfirm": "Deactivate this student? They will not be able to sign in (frees a seat) until reactivated.",
    "reactivateConfirm": "Reactivate this student? This uses a seat.",
    "consentLabel": "I confirm the school has obtained parental consent (or acts in loco parentis) for this under-13 student under COPPA's school-consent exception.",
    "seatLimitReached": "Seat limit reached. Deactivate a student or raise the school's seat limit.",
    "usernameTaken": "That username is already taken in this school.",
    "consentRequired": "School consent is required to enroll an under-13 student.",
    "actionFailed": "Action failed. Please try again.",
    "studentLoginTitle": "Student sign-in",
    "studentLoginHint": "Enter your school code, username, and password.",
    "signIn": "Sign in"
  },
  "SchoolAdmin": {
```

**fr.json** (anchor `  "SchoolAdmin": {`):
```json
  "SchoolStudents": {
    "tab": "Élèves",
    "teachersTab": "Enseignants",
    "title": "Élèves",
    "addStudent": "Ajouter un élève",
    "name": "Nom",
    "username": "Identifiant",
    "status": "Statut",
    "active": "Actif",
    "inactive": "Inactif",
    "displayName": "Nom affiché",
    "password": "Mot de passe temporaire",
    "birthYear": "Année de naissance",
    "seats": "Places",
    "schoolCode": "Code de l'école",
    "loading": "Chargement…",
    "noStudents": "Aucun élève pour le moment. Cliquez sur « Ajouter un élève » pour inscrire le premier.",
    "creating": "Création…",
    "cancel": "Annuler",
    "deactivate": "Désactiver",
    "reactivate": "Réactiver",
    "deactivateConfirm": "Désactiver cet élève ? Il ne pourra pas se connecter (libère une place) jusqu'à réactivation.",
    "reactivateConfirm": "Réactiver cet élève ? Cela utilise une place.",
    "consentLabel": "Je confirme que l'école a obtenu le consentement parental (ou agit in loco parentis) pour cet élève de moins de 13 ans, conformément à l'exception scolaire de la COPPA.",
    "seatLimitReached": "Limite de places atteinte. Désactivez un élève ou augmentez la limite de l'école.",
    "usernameTaken": "Cet identifiant est déjà utilisé dans cette école.",
    "consentRequired": "Le consentement de l'école est requis pour inscrire un élève de moins de 13 ans.",
    "actionFailed": "L'action a échoué. Veuillez réessayer.",
    "studentLoginTitle": "Connexion élève",
    "studentLoginHint": "Saisissez le code de votre école, votre identifiant et votre mot de passe.",
    "signIn": "Se connecter"
  },
  "SchoolAdmin": {
```

**ar.json** (anchor `  "SchoolAdmin": {`):
```json
  "SchoolStudents": {
    "tab": "الطلاب",
    "teachersTab": "المعلمون",
    "title": "الطلاب",
    "addStudent": "إضافة طالب",
    "name": "الاسم",
    "username": "اسم المستخدم",
    "status": "الحالة",
    "active": "نشط",
    "inactive": "غير نشط",
    "displayName": "الاسم المعروض",
    "password": "كلمة مرور مؤقتة",
    "birthYear": "سنة الميلاد",
    "seats": "المقاعد",
    "schoolCode": "رمز المدرسة",
    "loading": "جارٍ التحميل…",
    "noStudents": "لا يوجد طلاب بعد. انقر على «إضافة طالب» لتسجيل الأول.",
    "creating": "جارٍ الإنشاء…",
    "cancel": "إلغاء",
    "deactivate": "إيقاف",
    "reactivate": "إعادة تفعيل",
    "deactivateConfirm": "إيقاف هذا الطالب؟ لن يتمكن من تسجيل الدخول (يحرّر مقعدًا) حتى إعادة التفعيل.",
    "reactivateConfirm": "إعادة تفعيل هذا الطالب؟ هذا يستهلك مقعدًا.",
    "consentLabel": "أؤكد أن المدرسة حصلت على موافقة ولي الأمر (أو تعمل بصفة وليّ الأمر) لهذا الطالب دون 13 عامًا وفقًا لاستثناء موافقة المدرسة في COPPA.",
    "seatLimitReached": "تم بلوغ حد المقاعد. أوقف طالبًا أو ارفع حد مقاعد المدرسة.",
    "usernameTaken": "اسم المستخدم هذا مستخدم بالفعل في هذه المدرسة.",
    "consentRequired": "موافقة المدرسة مطلوبة لتسجيل طالب دون 13 عامًا.",
    "actionFailed": "فشل الإجراء. حاول مرة أخرى.",
    "studentLoginTitle": "تسجيل دخول الطالب",
    "studentLoginHint": "أدخل رمز مدرستك واسم المستخدم وكلمة المرور.",
    "signIn": "تسجيل الدخول"
  },
  "SchoolAdmin": {
```

- [ ] **Step 2: Validate JSON + commit.**

Run: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`
Expected: `en OK` / `fr OK` / `ar OK`.

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/fr.json apps/web/src/messages/ar.json
git commit -F - <<'EOF'
feat(web): SchoolStudents i18n namespace (en/fr/ar)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 9: Student components (table + dialog + panel)

**Files:** Create `StudentsTable.tsx`, `AddStudentDialog.tsx`, `StudentsPanel.tsx` under `apps/web/src/components/features/school/`

- [ ] **Step 1: `StudentsTable.tsx`.**

```tsx
'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface StudentsTableProps {
  students: SchoolStudentSummary[];
  busyUid: string | null;
  onToggle: (student: SchoolStudentSummary) => void;
}

/**
 * Students list with an active/inactive pill and a per-row toggle.
 * @param students - Rows.
 * @param busyUid - Uid currently mutating (disables its button).
 * @param onToggle - Called to flip a student's active state.
 */
export const StudentsTable: FC<StudentsTableProps> = ({ students, busyUid, onToggle }) => {
  const t = useTranslations('SchoolStudents');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('username')}</th>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('status')}</th>
            <th className="px-4 py-3 text-right">{' '}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.uid} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-muted-foreground">{student.username}</td>
              <td className="px-4 py-3 text-foreground">{student.displayName}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    student.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${student.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {student.active ? t('active') : t('inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onToggle(student)}
                  disabled={busyUid === student.uid}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {student.active ? t('deactivate') : t('reactivate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 2: `AddStudentDialog.tsx`** (conditional under-13 consent checkbox; auto-closes on success).

```tsx
'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface AddStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { displayName: string; username: string; password: string; birthYear: number; consentAttested: boolean }) => Promise<void>;
}

/**
 * Modal for provisioning a student. Shows a COPPA consent checkbox once the
 * entered birth year implies an age under 13, and gates submit on it. Inline
 * error on failure; closes on success.
 */
export const AddStudentDialog: FC<AddStudentDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('SchoolStudents');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const yearNum = Number(birthYear);
  const isUnder13 = yearNum > 0 && new Date().getFullYear() - yearNum < 13;
  const consentMissing = isUnder13 && !consent;

  const reset = () => {
    setDisplayName('');
    setUsername('');
    setPassword('');
    setBirthYear('');
    setConsent(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ displayName: displayName.trim(), username: username.trim().toLowerCase(), password, birthYear: yearNum, consentAttested: consent });
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addStudent')}>
        <h2 className="text-xl font-bold text-foreground">{t('addStudent')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
            <input id="student-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-username" className="block text-sm font-medium text-foreground">{t('username')}</label>
            <input id="student-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} pattern="[A-Za-z0-9]{3,20}" required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-pass" className="block text-sm font-medium text-foreground">{t('password')}</label>
            <input id="student-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-year" className="block text-sm font-medium text-foreground">{t('birthYear')}</label>
            <input id="student-year" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} min={1900} max={new Date().getFullYear()} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {isUnder13 && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{t('consentLabel')}</span>
            </label>
          )}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || password.length < 8 || consentMissing}>{loading ? t('creating') : t('addStudent')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: `StudentsPanel.tsx`** (self-contained orchestrator — fetch, header, table, dialog).

```tsx
'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { GameButton } from '@/components/game/GameButton';
import { StudentsTable } from './StudentsTable';
import { AddStudentDialog } from './AddStudentDialog';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface StudentsPanelProps {
  schoolId: string;
}

/** Students management panel for the /school console. */
export const StudentsPanel: FC<StudentsPanelProps> = ({ schoolId }) => {
  const t = useTranslations('SchoolStudents');
  const [students, setStudents] = useState<SchoolStudentSummary[]>([]);
  const [loginCode, setLoginCode] = useState('');
  const [seats, setSeats] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      const res = await schoolsApi.listStudents(schoolId);
      setStudents(res.students);
      setLoginCode(res.loginCode);
      setSeats({ used: res.seatsUsed, limit: res.seatLimit });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleCreate = async (values: { displayName: string; username: string; password: string; birthYear: number; consentAttested: boolean }) => {
    await schoolsApi.createStudent(schoolId, values);
    await fetchRoster();
  };

  const handleToggle = async (student: SchoolStudentSummary) => {
    const confirmMsg = student.active ? t('deactivateConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusyUid(student.uid);
    setError('');
    try {
      await schoolsApi.setStudentActive(schoolId, student.uid, !student.active);
      await fetchRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {loginCode && <span>{t('schoolCode')}: <span className="font-mono text-foreground">{loginCode}</span></span>}
          <span>{t('seats')}: <span className="text-foreground">{seats.used} / {seats.limit}</span></span>
        </div>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addStudent')}
        </GameButton>
      </div>

      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : students.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noStudents')}</p></div>
      ) : (
        <StudentsTable students={students} busyUid={busyUid} onToggle={handleToggle} />
      )}

      <AddStudentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </div>
  );
};
```

- [ ] **Step 4: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

```bash
git add apps/web/src/components/features/school
git commit -F - <<'EOF'
feat(web): student components (table + add dialog + panel)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 10: `/school` page — Teachers/Students tabs

**Files:** Modify `apps/web/src/app/(dashboard)/school/page.tsx`

- [ ] **Step 1: Add the tab state + Students panel.** The current page renders the teachers UI inside `SchoolAdminInner`. Wrap the existing teacher content in a tab and add the students tab.

1a. Add imports near the other imports at the top of the file:
```tsx
import { StudentsPanel } from '@/components/features/school/StudentsPanel';
```

1b. Add a translations hook for the tab labels and a tab state at the top of `SchoolAdminInner` (alongside the existing `const t = useTranslations('SchoolAdmin');` and the existing `useState` calls):
```tsx
  const ts = useTranslations('SchoolStudents');
  const [tab, setTab] = useState<'teachers' | 'students'>('teachers');
```

1c. In the returned JSX of `SchoolAdminInner` (the `schoolId`-present branch), insert a tab nav directly under the `<h1>…</h1>` heading row, and gate the existing teacher content (the `error` banner + the `loading/empty/table` block + the `<CreateTeacherDialog … />`) behind `tab === 'teachers'`, adding the students panel for `tab === 'students'`. Concretely, after the header `<div>` that contains the `<h1>` and the Add-Teacher `GameButton`, add:

```tsx
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('teachers')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'teachers' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {ts('teachersTab')}
        </button>
        <button
          onClick={() => setTab('students')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'students' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {ts('tab')}
        </button>
      </div>

      {tab === 'students' && <StudentsPanel schoolId={schoolId} />}
```

1d. Wrap the existing teacher-only JSX (the `{error && …}` banner, the `{loading ? … : teachers.length === 0 ? … : <TeachersTable … />}` block, and the `<CreateTeacherDialog … />`) in `{tab === 'teachers' && ( … )}`.

> **Note:** the Add-Teacher `GameButton` in the header is teacher-specific. Move it inside the `tab === 'teachers'` region (e.g. render it only when `tab === 'teachers'`) so it doesn't show on the Students tab. The Students tab has its own Add-Student button inside `StudentsPanel`. Read the current file and adjust the header so each tab shows its own primary action.

- [ ] **Step 2: Type-check + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add "apps/web/src/app/(dashboard)/school/page.tsx"
git commit -F - <<'EOF'
feat(web): /school Teachers/Students tabs + students panel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 11: Student sign-in (login page entry)

**Files:** Create `apps/web/src/components/features/auth/StudentLoginForm.tsx` + `apps/web/src/app/(auth)/student-login/page.tsx`; modify `apps/web/src/components/features/auth/LoginForm.tsx`

- [ ] **Step 1: `StudentLoginForm.tsx`** (school code + username + password → synthetic email → Firebase).

```tsx
'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { synthesizeStudentEmail } from '@eureka-lab/shared-types';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { homeForRole } from '@/lib/auth-redirects';
import { Button } from '@/components/ui/button';

/**
 * Student sign-in: school code + username + password. Rebuilds the student's
 * non-routable synthetic email and authenticates with Firebase, then exchanges
 * the token for the enriched profile (same as the main login form).
 */
export const StudentLoginForm: FC = () => {
  const t = useTranslations('SchoolStudents');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [schoolCode, setSchoolCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const email = synthesizeStudentEmail(schoolCode.trim(), username.trim());
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const profile = await authApi.login(idToken);
      setUser({ ...profile, streak: 0 });
      router.push(homeForRole(profile.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('studentLoginTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('studentLoginHint')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="school-code" className="text-sm font-medium text-foreground">{t('schoolCode')}</label>
          <input id="school-code" type="text" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label htmlFor="student-username" className="text-sm font-medium text-foreground">{t('username')}</label>
          <input id="student-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label htmlFor="student-password" className="text-sm font-medium text-foreground">{t('password')}</label>
          <input id="student-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? '...' : t('signIn')}</Button>
      </form>
    </div>
  );
};
```

- [ ] **Step 2: `student-login/page.tsx`** (mirror the existing login page shell).

```tsx
import { StudentLoginForm } from '@/components/features/auth/StudentLoginForm';

/** Student sign-in route. */
export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <StudentLoginForm />
    </div>
  );
}
```

- [ ] **Step 3: Link to it from the main login form.** In `LoginForm.tsx`, add a link just before the closing `</div>` of the outer container (after the existing "no account" paragraph):

```tsx
      <p className="text-center text-sm text-muted-foreground">
        <a href="/student-login" className="font-medium text-primary hover:underline">
          {useTranslations('SchoolStudents')('studentLoginTitle')}
        </a>
      </p>
```

> **Note:** calling a hook inside JSX like `useTranslations('SchoolStudents')('studentLoginTitle')` is fine at the top render scope of a component, but cleaner is to add `const ts = useTranslations('SchoolStudents');` next to the existing `const t = useTranslations('Auth');` at the top of `LoginForm` and use `{ts('studentLoginTitle')}` in the link. Use the clean form.

- [ ] **Step 4: Type-check + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 5: Commit.**

```bash
git add apps/web/src/components/features/auth/StudentLoginForm.tsx "apps/web/src/app/(auth)/student-login/page.tsx" apps/web/src/components/features/auth/LoginForm.tsx
git commit -F - <<'EOF'
feat(web): student sign-in (school code + username + password)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 12: Final verification + ROADMAP

**Files:** Modify `ROADMAP.md`

- [ ] **Step 1: Backend verification.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand` → all green (expect 35 suites / ~330 tests)

- [ ] **Step 2: Coverage on the schools module (≥80%).**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand --coverage --collectCoverageFrom='src/modules/schools/**/*.ts'`
Expected: schools module ≥80% lines (service/controller/repo/helper exercised; module file is wiring-only). If under 80%, add focused specs for uncovered service branches (e.g. the reactivate compensation path) rather than waving it through.

- [ ] **Step 3: Frontend verification.**

Run: `pnpm --filter @eureka-lab/web lint` → clean
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → `24`

- [ ] **Step 4: Update ROADMAP Stream 6 sub-project 4 row.** Replace the existing row 4 with two rows reflecting the 4a/4b split:
```
| 4a | School student enrollment + seat enforcement + school-consent COPPA (username/synthetic-email login, transactional seats, per-student under-13 audit) | **DONE** (`feat/school-admin-console`, 2026-05-31) | [enrollment](docs/superpowers/specs/2026-05-31-school-tenancy-student-enrollment-design.md) · [plan](docs/superpowers/plans/2026-05-31-school-tenancy-student-enrollment-plan.md) |
| 4b | Classroom→school rollup + class assignment + school/super-admin usage views + teacher-side roster | NOT WRITTEN | — |
```

- [ ] **Step 5: Commit.**

```bash
git add ROADMAP.md
git commit -F - <<'EOF'
docs(roadmap): mark B2B sub-project 4a (student enrollment) DONE; split out 4b

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: Report to the user** — summarize; recommend a user-driven smoke: as a school_admin, open `/school` → Students tab → add a 13+ student (no consent box) and an under-13 student (consent box appears and gates submit); confirm seat counter increments and `SEAT_LIMIT_REACHED` when full; sign in at `/student-login` with the school code + username + password; deactivate frees a seat / reactivate re-checks; confirm a non-school_admin is redirected from `/school` and cross-tenant `:id` is 403. Await push approval.

---

## Self-Review (completed by plan author)

**Spec coverage:** `loginCode`/`SchoolStudentSummary`/`synthesizeStudentEmail` (T1), `username`+`findStudentsBySchool` (T2), `generateUniqueLoginCode` (T3), DTOs (T4), provisioning + seats + consent + audit + compensation (T5), controller+TenantGuard+wiring (T6), `schoolsApi` (T7), i18n en/fr/ar (T8), components (T9), Students tab (T10), student sign-in + synthetic-email reuse (T11), verification + ROADMAP split (T12). Every spec section maps to a task. ✔

**Placeholder scan:** complete code in every step; the two `> Note:` callouts (T10 header action, T11 link hook) describe a read-then-adjust against existing code, not missing logic. ✔

**Type consistency:** `SchoolStudentSummary {uid,username,displayName,active}` (T1) is returned by `createStudent`/`setStudentActive`/`listRoster` (T5), typed in `schoolsApi` (T7), rendered by `StudentsTable` (T9). `StudentRoster {students,loginCode,seatsUsed,seatLimit}` (T5) ↔ controller `list` (T6) ↔ `schoolsApi.listStudents` (T7) ↔ `StudentsPanel` (T9). `CreateStudentDto {displayName,username,password,birthYear,consentAttested}` (T4) ↔ service (T5) ↔ `AddStudentDialog` onSubmit (T9). `synthesizeStudentEmail(loginCode,username)` (T1) used by service (T5) and `StudentLoginForm` (T11). `reserveSeat` + `incrementSeatsUsed(-1)` keep `seatsUsed` consistent (T5). `findStudentsBySchool` queries `role=='child'` (T2) matching `setStudentActive`'s `role!=='child'` guard (T5). ✔

**Deferred excluded:** classroom rollup/assignment, usage views, teacher-side provisioning, coded self-enroll, CSV import, password reset, capturing `adminUid` in the audit row — none built (called out in T5 note + ROADMAP 4b). ✔
