# School-Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a school admin manage teachers in their own school — a `/school` console plus `/schools/:id/teachers` endpoints (create / list / deactivate-reactivate), tenant-scoped by `TenantGuard` (its first live use).

**Architecture:** A new `SchoolTeachersController` + `SchoolTeachersService` in the schools module mints/lists/toggles teachers; deactivate = Firebase `disabled:true` plus an `active:false` flag on the user doc. `TenantGuard` (built in the foundation) gates the routes so a `school_admin` only touches their own `:id`. The auth profile is extended to return `schoolId` so the frontend knows which school the admin manages. Frontend mirrors the super-admin console (inline-feedback dialogs — Sonner is broken app-wide).

**Tech Stack:** NestJS + Firebase Admin (Jest, TDD), Next.js 14.2 App Router + next-intl + Tailwind v4 (lint/tsc + user smoke).

**Spec:** [school-admin console](../specs/2026-05-30-school-tenancy-schooladmin-console-design.md) · **Epic:** [epic](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)

**Branch:** `feat/school-admin-console` (already created off `feat/school-superadmin-console`).

---

## Pre-flight (run once before Task 1)

- [ ] `git branch --show-current` → `feat/school-admin-console`
- [ ] Baseline green:
  - `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
  - `pnpm --filter @eureka-lab/api exec jest --runInBand` → **30 suites / 295 tests pass**
  - `pnpm --filter @eureka-lab/web lint` → clean
  - `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → `24`

> **Conventions:** API tests `pnpm --filter @eureka-lab/api exec jest --runInBand [path]` (never `test -- --runInBand`). Rebuild shared-types after editing: `pnpm --filter @eureka-lab/shared-types build`. One commit/task, footer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Next 14.2 `params` are synchronous. UI feedback is **inline**, never `toast()`.

---

## File Structure

**Backend**
- `packages/shared-types/src/index.ts` — `SchoolTeacherSummary`.
- `apps/api/src/modules/auth/auth.service.ts` (+ `.spec.ts`) — `schoolId` on `LoginResult` + `login`/`getMe`.
- `apps/api/src/modules/users/users.repository.ts` (+ `.spec.ts`) — `active` field, `findTeachersBySchool`, `setActive`.
- `apps/api/src/modules/schools/dto/create-teacher.dto.ts`, `update-teacher-active.dto.ts` — new.
- `apps/api/src/modules/schools/school-teachers.service.ts` (+ `.spec.ts`) — new.
- `apps/api/src/modules/schools/school-teachers.controller.ts` (+ `.spec.ts`) — new.
- `apps/api/src/modules/schools/schools.module.ts` — register controller + service.

**Frontend**
- `apps/web/src/lib/api-client.ts` — teacher methods on `schoolsApi`.
- `apps/web/src/components/features/school/{TeachersTable,CreateTeacherDialog}.tsx` — new.
- `apps/web/src/app/(dashboard)/school/page.tsx` — replace placeholder.
- `apps/web/src/messages/{en,fr,ar}.json` — `SchoolAdmin` namespace.

**Docs:** `ROADMAP.md`.

---

## Task 1: Shared type — `SchoolTeacherSummary`

**Files:** Modify `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add the type** directly after the `SchoolAdminSummary` interface:

```ts
/** Resolved teacher row for the school-admin console */
export interface SchoolTeacherSummary {
  uid: string;
  email: string;
  displayName: string;
  /** false when the teacher's login is disabled; defaults true on older docs */
  active: boolean;
}
```

- [ ] **Step 2: Build.**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: exits 0.

- [ ] **Step 3: Commit.**

```bash
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): SchoolTeacherSummary"
```

---

## Task 2: Auth profile returns `schoolId`

**Files:** Modify `apps/api/src/modules/auth/auth.service.ts` + `.spec.ts`

- [ ] **Step 1: Add the failing test.** In `auth.service.spec.ts`, inside the `login` describe block, append after the "should return enriched profile" test:

```ts
    it('includes schoolId when the user has one', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin-1' });
      mockUsersRepository.findByUid.mockResolvedValue({
        uid: 'admin-1',
        email: 'admin@s.edu',
        displayName: 'Admin',
        role: 'school_admin',
        plan: 'free',
        xp: 0,
        schoolId: 'school-1',
      });
      const result = await service.login('valid-token');
      expect(result.schoolId).toBe('school-1');
    });
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/auth/auth.service.spec.ts`
Expected: FAIL — `result.schoolId` is undefined / not on the type.

- [ ] **Step 3: Implement.** In `auth.service.ts`:

3a. Add `schoolId` to the `LoginResult` interface (after `level: number;`):
```ts
  schoolId?: string;
```

3b. In `login()`, add `schoolId` to the `result` object literal (after `level: xpLevel.level,`):
```ts
      schoolId: userDoc.schoolId,
```

3c. In `getMe()`, add `schoolId` to its `result` object literal (after `level: xpLevel.level,`):
```ts
      schoolId: userDoc.schoolId,
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/auth/auth.service.spec.ts`
Expected: PASS (existing tests + the new one).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "feat(auth): return schoolId in login/getMe profile"
```

---

## Task 3: UsersRepository — `active` + `findTeachersBySchool` + `setActive` (TDD)

**Files:** Modify `apps/api/src/modules/users/users.repository.ts`; replace `apps/api/src/modules/users/users.repository.spec.ts`

- [ ] **Step 1: Replace the spec file** with this fuller version (adds query + update mocks):

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockDocRef = { get: jest.fn(), set: mockSet, update: mockUpdate };

const whereChain = { where: jest.fn(), get: mockGet };
whereChain.where.mockReturnValue(whereChain);

const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
  where: jest.fn().mockReturnValue(whereChain),
};
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

describe('UsersRepository', () => {
  let repo: UsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    whereChain.where.mockReturnValue(whereChain);
    mockCollectionRef.where.mockReturnValue(whereChain);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();
    repo = moduleRef.get(UsersRepository);
  });

  describe('create schoolId/active', () => {
    it('persists schoolId when provided', async () => {
      await repo.create('admin-1', { email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1' });
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet.mock.calls[0][0]).toMatchObject({ uid: 'admin-1', role: 'school_admin', schoolId: 'school-1' });
    });

    it('omits schoolId when not provided', async () => {
      await repo.create('p-1', { email: 'p@x.com', displayName: 'P', role: 'parent' });
      expect(mockSet.mock.calls[0][0]).not.toHaveProperty('schoolId');
    });

    it('persists active when provided', async () => {
      await repo.create('t-1', { email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
      expect(mockSet.mock.calls[0][0]).toMatchObject({ active: true });
    });
  });

  describe('findTeachersBySchool', () => {
    it('queries role==teacher AND schoolId==id and maps data', async () => {
      mockGet.mockResolvedValueOnce({ docs: [{ data: () => ({ uid: 't-1', role: 'teacher', schoolId: 'school-1' }) }] });
      const result = await repo.findTeachersBySchool('school-1');
      expect(mockCollectionRef.where).toHaveBeenCalledWith('role', '==', 'teacher');
      expect(whereChain.where).toHaveBeenCalledWith('schoolId', '==', 'school-1');
      expect(result).toEqual([{ uid: 't-1', role: 'teacher', schoolId: 'school-1' }]);
    });
  });

  describe('setActive', () => {
    it('updates the active flag', async () => {
      await repo.setActive('t-1', false);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts`
Expected: FAIL — `active` not accepted / `findTeachersBySchool` / `setActive` not functions.

- [ ] **Step 3: Implement.** In `users.repository.ts`:

3a. Add `active?: boolean;` to the `UserDoc` interface (after `schoolId?: string;`):
```ts
  active?: boolean;
```

3b. Add `active?: boolean;` to the `CreateUserData` interface (after `schoolId?: string;`):
```ts
  active?: boolean;
```

3c. In `create()`, add the spread after the `schoolId` spread:
```ts
      ...(data.active !== undefined && { active: data.active }),
```

3d. Add two methods after `countChildrenByParent` (anywhere in the class is fine):
```ts
  /**
   * Find all teacher user docs belonging to a school.
   * @param schoolId - School tenant id.
   * @returns Teacher user documents.
   */
  async findTeachersBySchool(schoolId: string): Promise<UserDoc[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'teacher')
      .where('schoolId', '==', schoolId)
      .get();
    return snapshot.docs.map((d) => d.data() as UserDoc);
  }

  /**
   * Set the `active` flag on a user document.
   * @param uid - Firebase UID.
   * @param active - New active state.
   */
  async setActive(uid: string, active: boolean): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .update({ active, updatedAt: FieldValue.serverTimestamp() });
  }
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/users/users.repository.ts apps/api/src/modules/users/users.repository.spec.ts
git commit -m "feat(users): active flag + findTeachersBySchool + setActive"
```

---

## Task 4: Teacher DTOs

**Files:** Create `create-teacher.dto.ts` + `update-teacher-active.dto.ts` under `apps/api/src/modules/schools/dto/`

- [ ] **Step 1: `create-teacher.dto.ts`.**

```ts
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/** Request body for POST /schools/:id/teachers (school_admin/super_admin). */
export class CreateTeacherDto {
  /** Teacher email */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Teacher display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Initial password — min 8 chars, ≥1 uppercase + ≥1 number */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
```

- [ ] **Step 2: `update-teacher-active.dto.ts`.**

```ts
import { IsBoolean } from 'class-validator';

/** Request body for PATCH /schools/:id/teachers/:teacherId. */
export class UpdateTeacherActiveDto {
  /** New active state (false disables login). */
  @IsBoolean()
  active!: boolean;
}
```

- [ ] **Step 3: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

```bash
git add apps/api/src/modules/schools/dto/create-teacher.dto.ts apps/api/src/modules/schools/dto/update-teacher-active.dto.ts
git commit -m "feat(schools): teacher DTOs (create + set-active)"
```

---

## Task 5: SchoolTeachersService (TDD)

**Files:** Create `apps/api/src/modules/schools/school-teachers.service.ts` + `.spec.ts`

- [ ] **Step 1: Write the failing test.** Create `school-teachers.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolTeachersService } from './school-teachers.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);
const mockFirebase = { auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims, updateUser: mockUpdateUser } };
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn(), findTeachersBySchool: jest.fn(), setActive: jest.fn().mockResolvedValue(undefined) };
const mockSchoolsRepo = { findById: jest.fn() };

describe('SchoolTeachersService', () => {
  let service: SchoolTeachersService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolTeachersService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SchoolsRepository, useValue: mockSchoolsRepo },
      ],
    }).compile();
    service = moduleRef.get(SchoolTeachersService);
  });

  describe('createTeacher', () => {
    it('mints a teacher with school claims + active flag', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockResolvedValueOnce({ uid: 't-9' });
      const result = await service.createTeacher('school-1', { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' });
      expect(mockSetClaims).toHaveBeenCalledWith('t-9', { role: 'teacher', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('t-9', { email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
      expect(result).toEqual({ uid: 't-9', email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
    });

    it('throws NotFound when the school is missing', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce(null);
      await expect(service.createTeacher('nope', { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps duplicate email to ConflictException', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.createTeacher('school-1', { email: 'dupe@s.edu', displayName: 'T', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listTeachers', () => {
    it('maps docs to summaries, defaulting active to true', async () => {
      mockUsersRepo.findTeachersBySchool.mockResolvedValueOnce([
        { uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false },
        { uid: 't-2', email: 'b@s.edu', displayName: 'B' },
      ]);
      const result = await service.listTeachers('school-1');
      expect(result).toEqual([
        { uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false },
        { uid: 't-2', email: 'b@s.edu', displayName: 'B', active: true },
      ]);
    });
  });

  describe('setTeacherActive', () => {
    it('disables login + flag when deactivating', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', email: 'a@s.edu', displayName: 'A', role: 'teacher', schoolId: 'school-1' });
      const result = await service.setTeacherActive('school-1', 't-1', false);
      expect(mockUpdateUser).toHaveBeenCalledWith('t-1', { disabled: true });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('t-1', false);
      expect(result).toEqual({ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false });
    });

    it('throws NotFound for a teacher in another school', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', role: 'teacher', schoolId: 'other' });
      await expect(service.setTeacherActive('school-1', 't-1', false)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound when the uid is not a teacher', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 'x', role: 'parent' });
      await expect(service.setTeacherActive('school-1', 'x', true)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-teachers.service.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `school-teachers.service.ts`:

```ts
import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { SchoolsRepository } from './schools.repository';
import { CreateTeacherDto } from './dto/create-teacher.dto';

/** Result of minting a teacher. */
export interface MintTeacherResult {
  uid: string;
  email: string;
  displayName: string;
  role: 'teacher';
  schoolId: string;
  active: boolean;
}

/**
 * School-admin teacher management. Callers are constrained to their own school
 * by TenantGuard at the controller; this service additionally verifies that a
 * targeted teacher belongs to the school before mutating it.
 */
@Injectable()
export class SchoolTeachersService {
  private readonly logger = new Logger(SchoolTeachersService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) {}

  /**
   * Mint a teacher account linked to a school.
   * @param schoolId - Target school id.
   * @param dto - Teacher account data.
   * @returns The minted teacher summary.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException when the email is already registered.
   */
  async createTeacher(schoolId: string, dto: CreateTeacherDto): Promise<MintTeacherResult> {
    const school = await this.schoolsRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }

    let uid: string;
    try {
      const fbUser = await this.firebase.auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
      });
      uid = fbUser.uid;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      const code = (error as { code?: string }).code ?? '';
      if (msg.includes('email-already-exists') || code === 'auth/email-already-exists') {
        throw new ConflictException({ message: 'Email address is already registered', code: 'EMAIL_ALREADY_EXISTS' });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'teacher', schoolId });
    await this.usersRepository.create(uid, {
      email: dto.email,
      displayName: dto.displayName,
      role: 'teacher',
      schoolId,
      active: true,
    });

    this.logger.log({ event: 'teacher_minted', schoolId, uid });
    return { uid, email: dto.email, displayName: dto.displayName, role: 'teacher', schoolId, active: true };
  }

  /**
   * List a school's teachers as summaries (active defaults true).
   * @param schoolId - School id.
   * @returns Teacher summaries.
   */
  async listTeachers(schoolId: string): Promise<SchoolTeacherSummary[]> {
    const docs = await this.usersRepository.findTeachersBySchool(schoolId);
    return docs.map((d) => ({
      uid: d.uid,
      email: d.email,
      displayName: d.displayName,
      active: d.active ?? true,
    }));
  }

  /**
   * Activate or deactivate a teacher (Firebase disabled flag + user-doc flag).
   * @param schoolId - School id (must own the teacher).
   * @param teacherId - Teacher uid.
   * @param active - New active state.
   * @returns The updated teacher summary.
   * @throws NotFoundException when the uid is not a teacher of this school.
   */
  async setTeacherActive(schoolId: string, teacherId: string, active: boolean): Promise<SchoolTeacherSummary> {
    const teacher = await this.usersRepository.findByUid(teacherId);
    if (!teacher || teacher.role !== 'teacher' || teacher.schoolId !== schoolId) {
      throw new NotFoundException({ message: 'Teacher not found in this school', code: 'TEACHER_NOT_FOUND' });
    }
    await this.firebase.auth.updateUser(teacherId, { disabled: !active });
    await this.usersRepository.setActive(teacherId, active);
    this.logger.log({ event: 'teacher_active_changed', schoolId, teacherId, active });
    return { uid: teacher.uid, email: teacher.email, displayName: teacher.displayName, active };
  }
}
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-teachers.service.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/school-teachers.service.ts apps/api/src/modules/schools/school-teachers.service.spec.ts
git commit -m "feat(schools): SchoolTeachersService — mint/list/set-active"
```

---

## Task 6: SchoolTeachersController + module registration (TDD)

**Files:** Create `school-teachers.controller.ts` + `.spec.ts`; modify `schools.module.ts`

- [ ] **Step 1: Write the failing test.** Create `school-teachers.controller.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolTeachersController } from './school-teachers.controller';
import { SchoolTeachersService } from './school-teachers.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = {
  createTeacher: jest.fn(),
  listTeachers: jest.fn(),
  setTeacherActive: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolTeachersController', () => {
  let controller: SchoolTeachersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolTeachersController],
      providers: [{ provide: SchoolTeachersService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolTeachersController);
  });

  it('create delegates id + dto', async () => {
    const dto = { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' };
    mockService.createTeacher.mockResolvedValueOnce({ uid: 't-9' });
    expect(await controller.create('s1', dto)).toEqual({ uid: 't-9' });
    expect(mockService.createTeacher).toHaveBeenCalledWith('s1', dto);
  });

  it('list wraps results in a { teachers } envelope', async () => {
    mockService.listTeachers.mockResolvedValueOnce([{ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: true }]);
    expect(await controller.list('s1')).toEqual({ teachers: [{ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: true }] });
    expect(mockService.listTeachers).toHaveBeenCalledWith('s1');
  });

  it('setActive delegates id + teacherId + active', async () => {
    mockService.setTeacherActive.mockResolvedValueOnce({ uid: 't-1', active: false });
    expect(await controller.setActive('s1', 't-1', { active: false })).toEqual({ uid: 't-1', active: false });
    expect(mockService.setTeacherActive).toHaveBeenCalledWith('s1', 't-1', false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-teachers.controller.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the controller.** Create `school-teachers.controller.ts`:

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
import { SchoolTeachersService } from './school-teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherActiveDto } from './dto/update-teacher-active.dto';

/**
 * School-admin teacher management, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/teachers.
 */
@Controller('schools/:id/teachers')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolTeachersController {
  constructor(private readonly teachersService: SchoolTeachersService) {}

  /**
   * Mint a teacher in this school.
   * @param id - School id.
   * @param dto - Teacher data.
   * @returns The minted teacher.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('id') id: string, @Body() dto: CreateTeacherDto) {
    return this.teachersService.createTeacher(id, dto);
  }

  /**
   * List this school's teachers.
   * @param id - School id.
   * @returns { teachers }.
   */
  @Get()
  async list(@Param('id') id: string) {
    return { teachers: await this.teachersService.listTeachers(id) };
  }

  /**
   * Activate / deactivate a teacher.
   * @param id - School id.
   * @param teacherId - Teacher uid.
   * @param dto - { active }.
   * @returns The updated teacher summary.
   */
  @Patch(':teacherId')
  async setActive(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: UpdateTeacherActiveDto,
  ) {
    return this.teachersService.setTeacherActive(id, teacherId, dto.active);
  }
}
```

- [ ] **Step 4: Register in the module.** In `schools.module.ts`:

4a. Add imports:
```ts
import { SchoolTeachersController } from './school-teachers.controller';
import { SchoolTeachersService } from './school-teachers.service';
```
4b. Add `SchoolTeachersController` to the `controllers` array and `SchoolTeachersService` to the `providers` array.

- [ ] **Step 5: Run the controller spec, then the full suite.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/school-teachers.controller.spec.ts`
Expected: PASS (3 tests).
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all green (30 suites + new tests).

- [ ] **Step 6: Commit.**

```bash
git add apps/api/src/modules/schools/school-teachers.controller.ts apps/api/src/modules/schools/school-teachers.controller.spec.ts apps/api/src/modules/schools/schools.module.ts
git commit -m "feat(schools): SchoolTeachersController (TenantGuard) + module wiring"
```

---

## Task 7: `schoolsApi` teacher methods

**Files:** Modify `apps/web/src/lib/api-client.ts`

- [ ] **Step 1: Add the import.** In the shared-types import block, add `SchoolTeacherSummary` next to the other school types:
```ts
  SchoolTeacherSummary,
```

- [ ] **Step 2: Add the methods.** Inside the `schoolsApi` object, append after `createAdmin`:

```ts
  /** List a school's teachers. */
  listTeachers: (schoolId: string) =>
    request<{ teachers: SchoolTeacherSummary[] }>(`/schools/${schoolId}/teachers`),

  /** Mint a teacher (school_admin sets the temp password). */
  createTeacher: (schoolId: string, body: { email: string; displayName: string; password: string }) =>
    request<{ uid: string; email: string; displayName: string; role: string; schoolId: string; active: boolean }>(
      `/schools/${schoolId}/teachers`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  /** Activate / deactivate a teacher. */
  setTeacherActive: (schoolId: string, teacherId: string, active: boolean) =>
    request<SchoolTeacherSummary>(`/schools/${schoolId}/teachers/${teacherId}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
```

> Note: `createAdmin` currently ends the object with `,` after its closing `)`. Insert these three methods between `createAdmin`'s trailing comma and the closing `};`.

- [ ] **Step 3: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

```bash
git add apps/web/src/lib/api-client.ts
git commit -m "feat(web): schoolsApi teacher methods"
```

---

## Task 8: `SchoolAdmin` i18n namespace (en/fr/ar)

**Files:** Modify `apps/web/src/messages/{en,fr,ar}.json`

- [ ] **Step 1: Insert the `SchoolAdmin` namespace** immediately before the `"Teacher": {` line in each file (it will sit just after the `Admin` namespace).

**en.json** (anchor `  "Teacher": {`):
```json
  "SchoolAdmin": {
    "title": "Teachers",
    "addTeacher": "Add Teacher",
    "name": "Name",
    "email": "Email",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "displayName": "Display Name",
    "tempPassword": "Temporary Password",
    "loading": "Loading…",
    "noTeachers": "No teachers yet. Click \"Add Teacher\" to create the first one.",
    "noSchool": "Your account is not linked to a school.",
    "creating": "Creating…",
    "cancel": "Cancel",
    "deactivate": "Deactivate",
    "reactivate": "Reactivate",
    "deactivateConfirm": "Deactivate this teacher? They will not be able to sign in until reactivated.",
    "reactivateConfirm": "Reactivate this teacher?",
    "teacherCreatedTitle": "Teacher created — share these credentials now",
    "teacherCreatedNote": "This password is shown once. Copy it before closing.",
    "done": "Done",
    "actionFailed": "Action failed. Please try again."
  },
  "Teacher": {
```

**fr.json** (anchor `  "Teacher": {`):
```json
  "SchoolAdmin": {
    "title": "Enseignants",
    "addTeacher": "Ajouter un enseignant",
    "name": "Nom",
    "email": "E-mail",
    "status": "Statut",
    "active": "Actif",
    "inactive": "Inactif",
    "displayName": "Nom affiché",
    "tempPassword": "Mot de passe temporaire",
    "loading": "Chargement…",
    "noTeachers": "Aucun enseignant pour le moment. Cliquez sur « Ajouter un enseignant » pour créer le premier.",
    "noSchool": "Votre compte n'est lié à aucune école.",
    "creating": "Création…",
    "cancel": "Annuler",
    "deactivate": "Désactiver",
    "reactivate": "Réactiver",
    "deactivateConfirm": "Désactiver cet enseignant ? Il ne pourra pas se connecter jusqu'à réactivation.",
    "reactivateConfirm": "Réactiver cet enseignant ?",
    "teacherCreatedTitle": "Enseignant créé — partagez ces identifiants maintenant",
    "teacherCreatedNote": "Ce mot de passe n'est affiché qu'une fois. Copiez-le avant de fermer.",
    "done": "Terminé",
    "actionFailed": "L'action a échoué. Veuillez réessayer."
  },
  "Teacher": {
```

**ar.json** (anchor `  "Teacher": {`):
```json
  "SchoolAdmin": {
    "title": "المعلمون",
    "addTeacher": "إضافة معلم",
    "name": "الاسم",
    "email": "البريد الإلكتروني",
    "status": "الحالة",
    "active": "نشط",
    "inactive": "غير نشط",
    "displayName": "الاسم المعروض",
    "tempPassword": "كلمة مرور مؤقتة",
    "loading": "جارٍ التحميل…",
    "noTeachers": "لا يوجد معلمون بعد. انقر على «إضافة معلم» لإنشاء الأول.",
    "noSchool": "حسابك غير مرتبط بأي مدرسة.",
    "creating": "جارٍ الإنشاء…",
    "cancel": "إلغاء",
    "deactivate": "إيقاف",
    "reactivate": "إعادة تفعيل",
    "deactivateConfirm": "إيقاف هذا المعلم؟ لن يتمكن من تسجيل الدخول حتى إعادة التفعيل.",
    "reactivateConfirm": "إعادة تفعيل هذا المعلم؟",
    "teacherCreatedTitle": "تم إنشاء المعلم — شارك بيانات الدخول الآن",
    "teacherCreatedNote": "تُعرض كلمة المرور هذه مرة واحدة. انسخها قبل الإغلاق.",
    "done": "تم",
    "actionFailed": "فشل الإجراء. حاول مرة أخرى."
  },
  "Teacher": {
```

- [ ] **Step 2: Validate JSON + commit.**

Run: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`
Expected: `en OK` / `fr OK` / `ar OK`.

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/fr.json apps/web/src/messages/ar.json
git commit -m "feat(web): SchoolAdmin i18n namespace (en/fr/ar)"
```

---

## Task 9: School-admin components (table + create dialog)

**Files:** Create `TeachersTable.tsx` + `CreateTeacherDialog.tsx` under `apps/web/src/components/features/school/`

- [ ] **Step 1: `TeachersTable.tsx`.**

```tsx
'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';

interface TeachersTableProps {
  teachers: SchoolTeacherSummary[];
  busyUid: string | null;
  onToggle: (teacher: SchoolTeacherSummary) => void;
}

/**
 * Teachers list with an active/inactive pill and a per-row toggle.
 * @param teachers - Rows.
 * @param busyUid - Uid currently mutating (disables its button).
 * @param onToggle - Called to flip a teacher's active state.
 */
export const TeachersTable: FC<TeachersTableProps> = ({ teachers, busyUid, onToggle }) => {
  const t = useTranslations('SchoolAdmin');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('email')}</th>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('status')}</th>
            <th className="px-4 py-3 text-right">{' '}</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.uid} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-muted-foreground">{teacher.email}</td>
              <td className="px-4 py-3 text-foreground">{teacher.displayName}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    teacher.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${teacher.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {teacher.active ? t('active') : t('inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onToggle(teacher)}
                  disabled={busyUid === teacher.uid}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {teacher.active ? t('deactivate') : t('reactivate')}
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

- [ ] **Step 2: `CreateTeacherDialog.tsx`** (mirrors `CreateSchoolAdminDialog` — creds shown once).

```tsx
'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateTeacherDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { email: string; displayName: string; password: string }) => Promise<void>;
}

/**
 * Modal for minting a teacher. On success shows the email + temp password once
 * (no email is sent). Inline error on failure.
 */
export const CreateTeacherDialog: FC<CreateTeacherDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('SchoolAdmin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setError('');
    setCreated(null);
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
      await onSubmit({ email: email.trim(), displayName: displayName.trim(), password });
      setCreated({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addTeacher')}>
        {created ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{t('teacherCreatedTitle')}</h2>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p><span className="text-muted-foreground">{t('email')}: </span><span className="font-mono">{created.email}</span></p>
              <p><span className="text-muted-foreground">{t('tempPassword')}: </span><span className="font-mono">{created.password}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">{t('teacherCreatedNote')}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={handleClose}>{t('done')}</Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground">{t('addTeacher')}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="teacher-email" className="block text-sm font-medium text-foreground">{t('email')}</label>
                <input id="teacher-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="teacher-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
                <input id="teacher-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="teacher-pass" className="block text-sm font-medium text-foreground">{t('tempPassword')}</label>
                <input id="teacher-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
                <Button type="submit" disabled={loading || password.length < 8}>{loading ? t('creating') : t('addTeacher')}</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

```bash
git add apps/web/src/components/features/school
git commit -m "feat(web): school-admin teacher components (table + create dialog)"
```

---

## Task 10: `/school` console page

**Files:** Modify `apps/web/src/app/(dashboard)/school/page.tsx` (replace placeholder)

- [ ] **Step 1: Replace the placeholder.**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@/components/game/GameButton';
import { TeachersTable } from '@/components/features/school/TeachersTable';
import { CreateTeacherDialog } from '@/components/features/school/CreateTeacherDialog';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** School-admin teacher console. Gated to school_admin via RoleGate. */
function SchoolAdminInner() {
  const t = useTranslations('SchoolAdmin');
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [teachers, setTeachers] = useState<SchoolTeacherSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await schoolsApi.listTeachers(schoolId);
      setTeachers(res.teachers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleCreate = async (values: { email: string; displayName: string; password: string }) => {
    if (!schoolId) return;
    await schoolsApi.createTeacher(schoolId, values);
    await fetchTeachers();
  };

  const handleToggle = async (teacher: SchoolTeacherSummary) => {
    if (!schoolId) return;
    const confirmMsg = teacher.active ? t('deactivateConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusyUid(teacher.uid);
    setError('');
    try {
      await schoolsApi.setTeacherActive(schoolId, teacher.uid, !teacher.active);
      await fetchTeachers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusyUid(null);
    }
  };

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{t('noSchool')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{t('title')}</h1>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addTeacher')}
        </GameButton>
      </div>

      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : teachers.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noTeachers')}</p></div>
      ) : (
        <TeachersTable teachers={teachers} busyUid={busyUid} onToggle={handleToggle} />
      )}

      <CreateTeacherDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

/** Page wrapper applying the school_admin role gate. */
export default function SchoolAdminPage() {
  return (
    <RoleGate allow={['school_admin']}>
      <SchoolAdminInner />
    </RoleGate>
  );
}
```

- [ ] **Step 2: Type-check + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add "apps/web/src/app/(dashboard)/school/page.tsx"
git commit -m "feat(web): /school teacher console (RoleGate + manage teachers)"
```

---

## Task 11: Final verification + ROADMAP

**Files:** Modify `ROADMAP.md`

- [ ] **Step 1: Backend verification.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand` → all green (expect 32 suites / ~310 tests)

- [ ] **Step 2: Coverage on the schools module (≥80%).**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand --coverage --collectCoverageFrom='src/modules/schools/**/*.ts'`
Expected: schools module ≥80% lines (service/controller/repo exercised; module file is wiring-only).

- [ ] **Step 3: Frontend verification.**

Run: `pnpm --filter @eureka-lab/web lint` → clean
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → `24`

- [ ] **Step 4: Update ROADMAP Stream 6 sub-project 3 row** to:
```
| 3 | School-admin console (manage teachers: create / list / deactivate-reactivate; TenantGuard's first live route) | **DONE** (`feat/school-admin-console`, 2026-05-30) | [console](docs/superpowers/specs/2026-05-30-school-tenancy-schooladmin-console-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-schooladmin-console-plan.md) |
```

- [ ] **Step 5: Commit.**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): mark B2B sub-project 3 (school-admin console) DONE"
```

- [ ] **Step 6: Report to the user** — summarize; recommend a user-driven smoke (log in as a school_admin from sub-project 2; add a teacher → creds shown once; deactivate/reactivate; confirm a non-school_admin is redirected from `/school` and cross-tenant `:id` is 403); await push approval.

---

## Self-Review (completed by plan author)

**Spec coverage:** profile `schoolId` (T2), teacher endpoints create/list/set-active (T5+T6), `TenantGuard` live wiring (T6), `active` + `findTeachersBySchool` + `setActive` (T3), `SchoolTeacherSummary` (T1), DTOs (T4), `schoolsApi` (T7), `SchoolAdmin` i18n en/fr/ar (T8), components (T9), `/school` page (T10), tests + ROADMAP (T11). Every spec section maps to a task. ✔

**Deferred excluded:** teacher email/name edit + password reset, classroom rollup/seat enforcement, enrollment/COPPA, email invites — none built. ✔

**Type consistency:** `SchoolTeacherSummary {uid,email,displayName,active}` (T1) is returned by `listTeachers`/`setTeacherActive` (T5), typed in `schoolsApi` (T7), and rendered by `TeachersTable` (T9). `createTeacher` returns `{…role,schoolId,active}` mint shape (T5/T7) — the dialog shows its own form password (T9). `findTeachersBySchool`/`setActive`/`active` (T3) are consumed by the service (T5). `UpdateTeacherActiveDto {active}` (T4) ↔ controller `setActive` (T6) ↔ `setTeacherActive(id,teacherId,active)` (T5). `LoginResult.schoolId` (T2) feeds `useAuth().user.schoolId` (T10). TenantGuard overridden in the controller spec (T6) matches the 3-guard `@UseGuards` (T6). ✔

**Placeholder scan:** complete code in every step; no TBD/vague handling. ✔
