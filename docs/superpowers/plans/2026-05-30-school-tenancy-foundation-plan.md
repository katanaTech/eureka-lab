# School Tenancy Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the backend foundation for multi-tenant B2B school accounts — a `schools` collection, `super_admin`/`school_admin` roles, `schoolId` on user docs, a seed-only super-admin, super-admin-guarded school/admin endpoints, and a reusable `TenantGuard` — with tests. No console UI.

**Architecture:** A new NestJS `schools` module mirrors the existing `classrooms`/`auth` module shape. Schools are stored as `schools/{id}` Firestore docs with a denormalized `seatsUsed` counter and `adminUids[]`; tenancy is denormalized via an optional `schoolId` on user docs and in custom claims. The first `super_admin` is minted out-of-band by a script run via the compiled `dist/` (no new deps). All new endpoints are `super_admin`-guarded; `TenantGuard` is built + unit-tested as shared infra for sub-projects 2–3.

**Tech Stack:** NestJS + Fastify, Firebase Admin SDK (Firestore + Auth), class-validator DTOs, Jest + ts-jest. Frontend: Next.js 14 App Router (minimal — redirect map + placeholder pages).

**Specs:** [foundation](../specs/2026-05-30-school-tenancy-foundation-design.md) · [epic](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)

**Branch:** `feat/school-tenancy` (already created off `redesign/v2-from-reference`).

---

## Pre-flight (run once before Task 1)

- [ ] Confirm baseline green so new failures are attributable:
  - `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0 errors**
  - `pnpm --filter @eureka-lab/api test -- --runInBand` → **261 passing / 24 suites**
  - `pnpm --filter @eureka-lab/web lint` → **clean**
- [ ] `git branch --show-current` → `feat/school-tenancy`

> **Convention notes for the executor:**
> - API tests OOM in parallel — **always** use `pnpm --filter @eureka-lab/api test -- --runInBand`. Add `NODE_OPTIONS=--max-old-space-size=6144` if it still OOMs.
> - Run a single suite with: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/schools/schools.service.spec.ts`
> - After editing `packages/shared-types`, **rebuild**: `pnpm --filter @eureka-lab/shared-types build` (dual-resolution exports — consumers read `dist/`).
> - Commit footer for every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
> - One commit per task (conventional commits).

---

## File Structure

**Create:**
- `apps/api/src/modules/schools/schools.repository.ts` — Firestore CRUD for `schools/{id}` + atomic counter.
- `apps/api/src/modules/schools/schools.service.ts` — business logic (create school, mint admin, get/list).
- `apps/api/src/modules/schools/schools.controller.ts` — 4 super-admin endpoints.
- `apps/api/src/modules/schools/schools.module.ts` — wiring.
- `apps/api/src/modules/schools/dto/create-school.dto.ts`
- `apps/api/src/modules/schools/dto/create-school-admin.dto.ts`
- `apps/api/src/modules/schools/schools.repository.spec.ts`
- `apps/api/src/modules/schools/schools.service.spec.ts`
- `apps/api/src/common/guards/tenant.guard.ts` — cross-tenant guard (shared infra).
- `apps/api/src/common/guards/tenant.guard.spec.ts`
- `apps/api/src/scripts/seed-super-admin.ts` — testable core + CLI bootstrap.
- `apps/api/src/scripts/seed-super-admin.spec.ts`
- `apps/web/src/app/(dashboard)/admin/page.tsx` — placeholder.
- `apps/web/src/app/(dashboard)/school/page.tsx` — placeholder.

**Modify:**
- `packages/shared-types/src/index.ts` — `UserRole` += 2 roles; `School`, `SchoolSummary`, `SchoolStatus`, `SchoolSubscription`, `SchoolSecretKeys`; `UserProfile.schoolId`.
- `apps/api/src/modules/users/users.repository.ts` — `UserDoc`/`CreateUserData` gain `schoolId`; persist it.
- `apps/api/src/common/decorators/current-user.decorator.ts` — `AuthenticatedUser.schoolId?`.
- `apps/api/src/common/guards/firebase-auth.guard.ts` — pass `schoolId` claim through.
- `apps/api/src/app.module.ts` — register `SchoolsModule`.
- `apps/api/package.json` — `seed:super-admin` script.
- `apps/web/src/lib/auth-redirects.ts` — `super_admin → /admin`, `school_admin → /school`.
- `infrastructure/firebase/firestore.rules` — `schools/{id}` rules + `super_admin` reads.

---

## Task 1: Shared types — roles + School model

**Files:**
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Extend `UserRole` and add School types.** In `packages/shared-types/src/index.ts`, replace the `UserRole` definition (currently line ~9) and add the School types directly after it:

```ts
/** User roles in the platform */
export type UserRole =
  | 'child'
  | 'parent'
  | 'teacher'
  | 'admin'
  | 'super_admin'
  | 'school_admin';

/** Lifecycle status of a school tenant */
export type SchoolStatus = 'active' | 'suspended';

/** School subscription — simple fields now; real billing is epic sub-project 5 */
export interface SchoolSubscription {
  /** Plan tier label, e.g. 'trial' | 'standard' */
  tier: string;
  /** Status label, e.g. 'active' | 'trialing' | 'past_due' */
  status: string;
  /** Unix ms when the current period ends (optional until billing lands) */
  periodEnd?: number;
}

/** School access keys — semantics/rotation are epic sub-project 5 */
export interface SchoolSecretKeys {
  /** Secret used (later) to gate student enrollment under this school */
  enrollmentSecret: string;
}

/** A school tenant document (`schools/{id}`) */
export interface School {
  id: string;
  name: string;
  status: SchoolStatus;
  /** Max student licenses */
  seatLimit: number;
  /** Denormalized count of students consuming a seat (enforced in sub-project 4) */
  seatsUsed: number;
  /** UIDs of this school's school_admin users */
  adminUids: string[];
  subscription: SchoolSubscription;
  secretKeys: SchoolSecretKeys;
  /** Unix ms creation time */
  createdAt: number;
  /** super_admin uid that created the school */
  createdBy: string;
}

/** Compact school view for list endpoints (no secrets) */
export interface SchoolSummary {
  id: string;
  name: string;
  status: SchoolStatus;
  seatLimit: number;
  seatsUsed: number;
}
```

- [ ] **Step 2: Add `schoolId` to `UserProfile`.** Find `export interface UserProfile {` (line ~40) and add inside it, after `subscription?: SubscriptionData;`:

```ts
  /** Tenant id when this user belongs to a school (B2B); absent for B2C + super_admin */
  schoolId?: string;
```

- [ ] **Step 3: Build shared-types and type-check.**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: exits 0, regenerates `packages/shared-types/dist/`.

- [ ] **Step 4: Commit.**

```bash
git add packages/shared-types/src/index.ts packages/shared-types/dist
git commit -m "feat(shared-types): super_admin/school_admin roles + School tenant types"
```

---

## Task 2: User repository — persist `schoolId`

**Files:**
- Modify: `apps/api/src/modules/users/users.repository.ts`
- Test: `apps/api/src/modules/users/users.repository.spec.ts` (create if absent)

- [ ] **Step 1: Write the failing test.** Create or append to `apps/api/src/modules/users/users.repository.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

const mockSet = jest.fn();
const mockDocRef = { get: jest.fn(), set: mockSet, update: jest.fn() };
const mockCollectionRef = { doc: jest.fn().mockReturnValue(mockDocRef) };
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

describe('UsersRepository schoolId', () => {
  let repo: UsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();
    repo = moduleRef.get(UsersRepository);
  });

  it('persists schoolId when provided', async () => {
    await repo.create('admin-1', {
      email: 'a@s.edu',
      displayName: 'Admin',
      role: 'school_admin',
      schoolId: 'school-1',
    });
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][0]).toMatchObject({
      uid: 'admin-1',
      role: 'school_admin',
      schoolId: 'school-1',
    });
  });

  it('omits schoolId when not provided', async () => {
    await repo.create('p-1', { email: 'p@x.com', displayName: 'P', role: 'parent' });
    expect(mockSet.mock.calls[0][0]).not.toHaveProperty('schoolId');
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/users/users.repository.spec.ts`
Expected: FAIL — `CreateUserData` has no `schoolId`; type error / undefined write.

- [ ] **Step 3: Implement.** In `apps/api/src/modules/users/users.repository.ts`:

3a. Add the import for the shared role type at the top (replace the existing shared-types import line):
```ts
import type { SubscriptionData, PlanType, FantasyCharacter, UserRole } from '@eureka-lab/shared-types';
```

3b. In `interface UserDoc`, change the `role` line and add `schoolId`:
```ts
  role: UserRole;
  schoolId?: string;
```

3c. In `interface CreateUserData`, change `role` and add `schoolId`:
```ts
  role: UserRole;
  schoolId?: string;
```

3d. In `create()`, add the spread inside the `userDoc` object, right after the `parentUid` spread:
```ts
      ...(data.schoolId && { schoolId: data.schoolId }),
```

- [ ] **Step 4: Run it — expect PASS.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/users/users.repository.spec.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/users/users.repository.ts apps/api/src/modules/users/users.repository.spec.ts
git commit -m "feat(users): persist optional schoolId on user docs"
```

---

## Task 3: Auth plumbing — carry `schoolId` claim

**Files:**
- Modify: `apps/api/src/common/decorators/current-user.decorator.ts`
- Modify: `apps/api/src/common/guards/firebase-auth.guard.ts`

- [ ] **Step 1: Extend `AuthenticatedUser`.** In `current-user.decorator.ts`, add to the `AuthenticatedUser` interface after `role: string;`:

```ts
  /** Tenant id from custom claims (school_admin / school-provisioned users) */
  schoolId?: string;
```

- [ ] **Step 2: Pass the claim through.** In `firebase-auth.guard.ts`, in the `user` object built from `decoded`, add after the `role` line:

```ts
        schoolId: (decoded['schoolId'] as string | undefined) ?? undefined,
```

- [ ] **Step 3: Type-check.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit.**

```bash
git add apps/api/src/common/decorators/current-user.decorator.ts apps/api/src/common/guards/firebase-auth.guard.ts
git commit -m "feat(auth): carry schoolId custom claim on authenticated user"
```

---

## Task 4: SchoolsRepository (TDD)

**Files:**
- Create: `apps/api/src/modules/schools/schools.repository.ts`
- Test: `apps/api/src/modules/schools/schools.repository.spec.ts`

- [ ] **Step 1: Write the failing test.** Create `apps/api/src/modules/schools/schools.repository.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { School } from '@eureka-lab/shared-types';

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockLimitGet = jest.fn();
const mockDocRef = { id: 'auto-id-1', get: mockGet, set: mockSet, update: mockUpdate };
const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
  limit: jest.fn().mockReturnValue({ get: mockLimitGet }),
};
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

const school: School = {
  id: 'school-1', name: 'Springfield Elementary', status: 'active',
  seatLimit: 100, seatsUsed: 0, adminUids: [],
  subscription: { tier: 'trial', status: 'active' },
  secretKeys: { enrollmentSecret: 'sek_x' },
  createdAt: 1000, createdBy: 'sa-1',
};

describe('SchoolsRepository', () => {
  let repo: SchoolsRepository;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [SchoolsRepository, { provide: FirebaseService, useValue: mockFirebaseService }],
    }).compile();
    repo = moduleRef.get(SchoolsRepository);
  });

  it('newId returns a firestore auto id', () => {
    expect(repo.newId()).toBe('auto-id-1');
  });

  it('createSchool writes the doc and returns it', async () => {
    const result = await repo.createSchool(school);
    expect(mockSet).toHaveBeenCalledWith(school);
    expect(result).toEqual(school);
  });

  it('findById returns null when missing', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    expect(await repo.findById('nope')).toBeNull();
  });

  it('findById returns the school data when present', async () => {
    mockGet.mockResolvedValueOnce({ exists: true, data: () => school });
    expect(await repo.findById('school-1')).toEqual(school);
  });

  it('listAll maps docs to data (bounded)', async () => {
    mockLimitGet.mockResolvedValueOnce({ docs: [{ data: () => school }] });
    expect(await repo.listAll()).toEqual([school]);
    expect(mockCollectionRef.limit).toHaveBeenCalledWith(500);
  });

  it('addAdminUid arrayUnions the uid', async () => {
    await repo.addAdminUid('school-1', 'admin-9');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('incrementSeatsUsed updates with a delta', async () => {
    await repo.incrementSeatsUsed('school-1', 1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `apps/api/src/modules/schools/schools.repository.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { School } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/** Max schools returned by an unbounded list (CLAUDE.md Rule 3 — no unbounded reads). */
const MAX_SCHOOLS = 500;

/**
 * Firestore repository for school tenant documents (`schools/{id}`).
 */
@Injectable()
export class SchoolsRepository {
  private readonly logger = new Logger(SchoolsRepository.name);
  private readonly collection = 'schools';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Generate a new Firestore auto-id for a school (used before write so the
   * id can be embedded in the document body).
   * @returns A fresh document id.
   */
  newId(): string {
    return this.firebase.firestore.collection(this.collection).doc().id;
  }

  /**
   * Write a fully-formed school document.
   * @param school - Complete school record (id already set).
   * @returns The same school record.
   */
  async createSchool(school: School): Promise<School> {
    await this.firebase.firestore.collection(this.collection).doc(school.id).set(school);
    this.logger.log({ event: 'school_created', schoolId: school.id });
    return school;
  }

  /**
   * Fetch a school by id.
   * @param id - School document id.
   * @returns The school or null if not found.
   */
  async findById(id: string): Promise<School | null> {
    const doc = await this.firebase.firestore.collection(this.collection).doc(id).get();
    return doc.exists ? (doc.data() as School) : null;
  }

  /**
   * List all schools (bounded to MAX_SCHOOLS).
   * @returns Array of school records.
   */
  async listAll(): Promise<School[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .limit(MAX_SCHOOLS)
      .get();
    return snapshot.docs.map((d) => d.data() as School);
  }

  /**
   * Append a school_admin uid to a school's adminUids array.
   * @param id - School id.
   * @param uid - school_admin uid.
   */
  async addAdminUid(id: string, uid: string): Promise<void> {
    await this.firebase.firestore
      .collection(this.collection)
      .doc(id)
      .update({ adminUids: FieldValue.arrayUnion(uid) });
  }

  /**
   * Atomically change a school's seatsUsed counter.
   * @param id - School id.
   * @param delta - Amount to add (may be negative).
   */
  async incrementSeatsUsed(id: string, delta: number): Promise<void> {
    await this.firebase.firestore
      .collection(this.collection)
      .doc(id)
      .update({ seatsUsed: FieldValue.increment(delta) });
  }
}
```

- [ ] **Step 4: Run it — expect PASS.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.repository.ts apps/api/src/modules/schools/schools.repository.spec.ts
git commit -m "feat(schools): SchoolsRepository — CRUD + atomic seat counter"
```

---

## Task 5: DTOs

**Files:**
- Create: `apps/api/src/modules/schools/dto/create-school.dto.ts`
- Create: `apps/api/src/modules/schools/dto/create-school-admin.dto.ts`

- [ ] **Step 1: Create `CreateSchoolDto`.** `apps/api/src/modules/schools/dto/create-school.dto.ts`:

```ts
import { IsString, IsNotEmpty, MinLength, MaxLength, IsInt, Min, Max, IsOptional } from 'class-validator';

/** Request body for POST /schools (super_admin only). */
export class CreateSchoolDto {
  /** School display name (moderated on create) */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Number of student licenses (seats) */
  @IsInt()
  @Min(0)
  @Max(100000)
  seatLimit!: number;

  /** Optional subscription tier label; defaults to 'trial' server-side */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subscriptionTier?: string;
}
```

- [ ] **Step 2: Create `CreateSchoolAdminDto`.** `apps/api/src/modules/schools/dto/create-school-admin.dto.ts`:

```ts
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/** Request body for POST /schools/:id/admins (super_admin only). */
export class CreateSchoolAdminDto {
  /** Admin email */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Admin display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Initial password — min 8 chars, ≥1 uppercase + ≥1 number (mirrors SignupDto) */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
```

- [ ] **Step 3: Type-check.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit.**

```bash
git add apps/api/src/modules/schools/dto
git commit -m "feat(schools): CreateSchoolDto + CreateSchoolAdminDto"
```

---

## Task 6: SchoolsService (TDD)

**Files:**
- Create: `apps/api/src/modules/schools/schools.service.ts`
- Test: `apps/api/src/modules/schools/schools.service.spec.ts`

- [ ] **Step 1: Write the failing test.** Create `apps/api/src/modules/schools/schools.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ContentModerationService } from '../ai/content-moderation.service';

const mockRepo = {
  newId: jest.fn().mockReturnValue('school-1'),
  createSchool: jest.fn((s) => Promise.resolve(s)),
  findById: jest.fn(),
  listAll: jest.fn(),
  addAdminUid: jest.fn().mockResolvedValue(undefined),
};
const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockFirebase = { auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims } };
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined) };
const mockModeration = { moderateInput: jest.fn().mockReturnValue({ passed: true }) };

describe('SchoolsService', () => {
  let service: SchoolsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.newId.mockReturnValue('school-1');
    mockModeration.moderateInput.mockReturnValue({ passed: true });
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: SchoolsRepository, useValue: mockRepo },
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();
    service = moduleRef.get(SchoolsService);
  });

  describe('createSchool', () => {
    it('creates a school with counters, defaults, and a generated secret', async () => {
      const result = await service.createSchool('sa-1', { name: 'Springfield', seatLimit: 50 });
      expect(result.id).toBe('school-1');
      expect(result.status).toBe('active');
      expect(result.seatsUsed).toBe(0);
      expect(result.adminUids).toEqual([]);
      expect(result.subscription.tier).toBe('trial');
      expect(result.secretKeys.enrollmentSecret).toMatch(/^sek_[0-9a-f]{48}$/);
      expect(result.createdBy).toBe('sa-1');
      expect(mockRepo.createSchool).toHaveBeenCalledTimes(1);
    });

    it('honors a provided subscriptionTier', async () => {
      const result = await service.createSchool('sa-1', { name: 'X', seatLimit: 10, subscriptionTier: 'standard' });
      expect(result.subscription.tier).toBe('standard');
    });

    it('rejects a name that fails moderation', async () => {
      mockModeration.moderateInput.mockReturnValueOnce({ passed: false });
      await expect(service.createSchool('sa-1', { name: 'bad', seatLimit: 1 }))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockRepo.createSchool).not.toHaveBeenCalled();
    });
  });

  describe('mintSchoolAdmin', () => {
    it('creates a firebase user, sets role+schoolId claims, writes the user doc, links admin', async () => {
      mockRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockResolvedValueOnce({ uid: 'admin-9' });
      const result = await service.mintSchoolAdmin('school-1', {
        email: 'a@s.edu', displayName: 'Admin', password: 'Passw0rd',
      });
      expect(mockSetClaims).toHaveBeenCalledWith('admin-9', { role: 'school_admin', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('admin-9', {
        email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1',
      });
      expect(mockRepo.addAdminUid).toHaveBeenCalledWith('school-1', 'admin-9');
      expect(result).toEqual({
        uid: 'admin-9', email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1',
      });
    });

    it('throws NotFound when the school does not exist', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.mintSchoolAdmin('nope', { email: 'a@s.edu', displayName: 'A', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps a duplicate email to ConflictException', async () => {
      mockRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.mintSchoolAdmin('school-1', { email: 'dupe@s.edu', displayName: 'A', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getSchool / listSchools', () => {
    it('getSchool throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.getSchool('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('listSchools maps to summaries (no secrets)', async () => {
      mockRepo.listAll.mockResolvedValueOnce([{
        id: 's1', name: 'A', status: 'active', seatLimit: 5, seatsUsed: 2,
        adminUids: [], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_secret' }, createdAt: 1, createdBy: 'sa',
      }]);
      const result = await service.listSchools();
      expect(result).toEqual([{ id: 's1', name: 'A', status: 'active', seatLimit: 5, seatsUsed: 2 }]);
      expect(JSON.stringify(result)).not.toContain('sek_secret');
    });
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/schools/schools.service.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `apps/api/src/modules/schools/schools.service.ts`:

```ts
import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { School, SchoolSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ContentModerationService } from '../ai/content-moderation.service';
import { SchoolsRepository } from './schools.repository';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';

/** Result of minting a school_admin. */
export interface MintSchoolAdminResult {
  uid: string;
  email: string;
  displayName: string;
  role: 'school_admin';
  schoolId: string;
}

/**
 * Business logic for school tenants. All callers are super_admin (enforced at
 * the controller). School accounts are minted, never age-derived.
 */
@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    private readonly repo: SchoolsRepository,
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Create a new school tenant.
   * @param creatorUid - super_admin uid creating the school.
   * @param dto - School creation data.
   * @returns The created school document.
   * @throws BadRequestException when the name fails moderation.
   */
  async createSchool(creatorUid: string, dto: CreateSchoolDto): Promise<School> {
    const nameCheck = this.moderation.moderateInput(dto.name);
    if (!nameCheck.passed) {
      throw new BadRequestException({
        message: 'School name contains inappropriate content',
        code: 'NAME_REJECTED',
      });
    }

    const school: School = {
      id: this.repo.newId(),
      name: dto.name,
      status: 'active',
      seatLimit: dto.seatLimit,
      seatsUsed: 0,
      adminUids: [],
      subscription: { tier: dto.subscriptionTier ?? 'trial', status: 'active' },
      secretKeys: { enrollmentSecret: this.generateEnrollmentSecret() },
      createdAt: Date.now(),
      createdBy: creatorUid,
    };

    await this.repo.createSchool(school);
    this.logger.log({ event: 'school_created', schoolId: school.id, createdBy: creatorUid });
    return school;
  }

  /**
   * Mint the first school_admin for a school (mirrors AuthService.addChild).
   * @param schoolId - Target school id.
   * @param dto - Admin account data.
   * @returns The minted admin summary.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException when the email is already registered.
   */
  async mintSchoolAdmin(
    schoolId: string,
    dto: CreateSchoolAdminDto,
  ): Promise<MintSchoolAdminResult> {
    const school = await this.repo.findById(schoolId);
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
        throw new ConflictException({
          message: 'Email address is already registered',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'school_admin', schoolId });
    await this.usersRepository.create(uid, {
      email: dto.email,
      displayName: dto.displayName,
      role: 'school_admin',
      schoolId,
    });
    await this.repo.addAdminUid(schoolId, uid);

    this.logger.log({ event: 'school_admin_minted', schoolId, uid });
    return { uid, email: dto.email, displayName: dto.displayName, role: 'school_admin', schoolId };
  }

  /**
   * Get a single school by id.
   * @param id - School id.
   * @returns The school document.
   * @throws NotFoundException when missing.
   */
  async getSchool(id: string): Promise<School> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    return school;
  }

  /**
   * List all schools as compact summaries (no secrets).
   * @returns Array of school summaries.
   */
  async listSchools(): Promise<SchoolSummary[]> {
    const schools = await this.repo.listAll();
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      seatLimit: s.seatLimit,
      seatsUsed: s.seatsUsed,
    }));
  }

  /**
   * Generate a random enrollment secret (prefixed for readability).
   * @returns A `sek_`-prefixed 48-hex-char secret.
   */
  private generateEnrollmentSecret(): string {
    return `sek_${randomBytes(24).toString('hex')}`;
  }
}
```

- [ ] **Step 4: Run it — expect PASS.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/modules/schools/schools.service.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.service.ts apps/api/src/modules/schools/schools.service.spec.ts
git commit -m "feat(schools): SchoolsService — create school, mint admin, get/list"
```

---

## Task 7: SchoolsController + module + registration

**Files:**
- Create: `apps/api/src/modules/schools/schools.controller.ts`
- Create: `apps/api/src/modules/schools/schools.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the controller.** `apps/api/src/modules/schools/schools.controller.ts`:

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';

/**
 * Super-admin-only endpoints for managing school tenants.
 * Routes: POST/GET /schools, GET /schools/:id, POST /schools/:id/admins.
 */
@Controller('schools')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('super_admin')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  /**
   * Create a new school tenant.
   * @param user - Authenticated super_admin.
   * @param dto - School creation data.
   * @returns The created school.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSchoolDto) {
    return this.schoolsService.createSchool(user.uid, dto);
  }

  /**
   * List all schools as summaries.
   * @returns Array of school summaries.
   */
  @Get()
  async listSchools() {
    return { schools: await this.schoolsService.listSchools() };
  }

  /**
   * Get one school by id.
   * @param id - School id.
   * @returns The school document.
   */
  @Get(':id')
  async getSchool(@Param('id') id: string) {
    return this.schoolsService.getSchool(id);
  }

  /**
   * Mint the first school_admin for a school.
   * @param id - School id.
   * @param dto - Admin account data.
   * @returns The minted admin summary.
   */
  @Post(':id/admins')
  @HttpCode(HttpStatus.CREATED)
  async createSchoolAdmin(@Param('id') id: string, @Body() dto: CreateSchoolAdminDto) {
    return this.schoolsService.mintSchoolAdmin(id, dto);
  }
}
```

- [ ] **Step 2: Create the module.** `apps/api/src/modules/schools/schools.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { SchoolsRepository } from './schools.repository';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

/**
 * Schools module — super-admin tenant management (B2B foundation).
 * Imports UsersModule (UsersRepository) and AiModule (ContentModerationService).
 */
@Module({
  imports: [UsersModule, AiModule],
  controllers: [SchoolsController],
  providers: [SchoolsService, SchoolsRepository],
  exports: [SchoolsService, SchoolsRepository],
})
export class SchoolsModule {}
```

- [ ] **Step 3: Register in `app.module.ts`.** Add the import near the other module imports:
```ts
import { SchoolsModule } from './modules/schools/schools.module';
```
and add `SchoolsModule,` to the `imports` array in the `/* Features */` group (e.g. after `ClassroomsModule,`).

- [ ] **Step 4: Verify `ContentModerationService` is exported by `AiModule`.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors. If tsc/Nest reports `ContentModerationService` is not exported, open `apps/api/src/modules/ai/ai.module.ts` and confirm it is in `exports` (ClassroomsModule already consumes it the same way, so it should be). Do not change AiModule unless the error proves it necessary.

- [ ] **Step 5: Run the whole api suite — expect green (no regressions).**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand`
Expected: all prior suites + the 2 new schools suites pass.

- [ ] **Step 6: Commit.**

```bash
git add apps/api/src/modules/schools/schools.controller.ts apps/api/src/modules/schools/schools.module.ts apps/api/src/app.module.ts
git commit -m "feat(schools): super_admin-guarded controller + module registration"
```

---

## Task 8: TenantGuard (TDD, shared infra)

**Files:**
- Create: `apps/api/src/common/guards/tenant.guard.ts`
- Test: `apps/api/src/common/guards/tenant.guard.spec.ts`

> **Note:** This guard has **no live consumer** in this slice (all foundation routes are `super_admin`-only). It is built + unit-tested now so sub-projects 2–3 (school-admin-scoped routes) can apply it. Do **not** wire it onto the schools controller here.

- [ ] **Step 1: Write the failing test.** Create `apps/api/src/common/guards/tenant.guard.spec.ts`:

```ts
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/** Build a fake ExecutionContext carrying a user + route params. */
function ctx(user: AuthenticatedUser, params: Record<string, string>): ExecutionContext {
  const request = { user, params };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  const guard = new TenantGuard();

  it('allows super_admin regardless of schoolId', () => {
    const user = { uid: 'sa', email: '', role: 'super_admin' } as AuthenticatedUser;
    expect(guard.canActivate(ctx(user, { id: 'school-1' }))).toBe(true);
  });

  it('allows a school_admin accessing their own school', () => {
    const user = { uid: 'a', email: '', role: 'school_admin', schoolId: 'school-1' } as AuthenticatedUser;
    expect(guard.canActivate(ctx(user, { id: 'school-1' }))).toBe(true);
  });

  it('rejects a school_admin accessing another school', () => {
    const user = { uid: 'a', email: '', role: 'school_admin', schoolId: 'school-1' } as AuthenticatedUser;
    expect(() => guard.canActivate(ctx(user, { id: 'school-2' }))).toThrow(ForbiddenException);
  });

  it('rejects a user with no schoolId', () => {
    const user = { uid: 'a', email: '', role: 'school_admin' } as AuthenticatedUser;
    expect(() => guard.canActivate(ctx(user, { id: 'school-1' }))).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/common/guards/tenant.guard.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `apps/api/src/common/guards/tenant.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Guard that enforces single-tenant access on routes scoped by an `:id`
 * school parameter. A `super_admin` bypasses the check; any other caller must
 * carry a `schoolId` claim matching the route's `:id`.
 *
 * Must run AFTER FirebaseAuthGuard so `request.user` is populated.
 * Shared infrastructure — first applied to live routes in epic sub-projects 2–3.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  /**
   * @param context - Execution context.
   * @returns True when access is permitted.
   * @throws ForbiddenException on cross-tenant access.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as FastifyRequest & { user: AuthenticatedUser }).user;
    const params = (request as FastifyRequest & { params?: Record<string, string> }).params ?? {};
    const targetSchoolId = params.id;

    if (user?.role === 'super_admin') {
      return true;
    }

    if (!user?.schoolId || user.schoolId !== targetSchoolId) {
      throw new ForbiddenException({
        message: 'Cross-tenant access denied',
        code: 'TENANT_MISMATCH',
      });
    }

    return true;
  }
}
```

- [ ] **Step 4: Run it — expect PASS.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/common/guards/tenant.guard.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/common/guards/tenant.guard.ts apps/api/src/common/guards/tenant.guard.spec.ts
git commit -m "feat(common): TenantGuard — cross-tenant access guard (shared infra)"
```

---

## Task 9: Super-admin seed script (TDD core + CLI)

**Files:**
- Create: `apps/api/src/scripts/seed-super-admin.ts`
- Test: `apps/api/src/scripts/seed-super-admin.spec.ts`
- Modify: `apps/api/package.json` (add `seed:super-admin` script)

- [ ] **Step 1: Write the failing test.** Create `apps/api/src/scripts/seed-super-admin.spec.ts`:

```ts
import { seedSuperAdmin } from './seed-super-admin';

describe('seedSuperAdmin', () => {
  const setClaims = jest.fn().mockResolvedValue(undefined);
  const docSet = jest.fn().mockResolvedValue(undefined);
  const firestore = {
    collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue({ set: docSet }) }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('elevates an existing user to super_admin (idempotent merge)', async () => {
    const auth = {
      getUserByEmail: jest.fn().mockResolvedValue({ uid: 'u-1' }),
      createUser: jest.fn(),
      setCustomUserClaims: setClaims,
    };
    const uid = await seedSuperAdmin(auth as never, firestore as never, 'boss@eureka.dev');
    expect(uid).toBe('u-1');
    expect(auth.createUser).not.toHaveBeenCalled();
    expect(setClaims).toHaveBeenCalledWith('u-1', { role: 'super_admin' });
    expect(docSet).toHaveBeenCalledTimes(1);
    expect(docSet.mock.calls[0][0]).toMatchObject({ uid: 'u-1', role: 'super_admin' });
    expect(docSet.mock.calls[0][1]).toEqual({ merge: true });
  });

  it('creates the user when not found, then elevates', async () => {
    const auth = {
      getUserByEmail: jest.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
      createUser: jest.fn().mockResolvedValue({ uid: 'u-2' }),
      setCustomUserClaims: setClaims,
    };
    const uid = await seedSuperAdmin(auth as never, firestore as never, 'new@eureka.dev', 'TempPass1');
    expect(uid).toBe('u-2');
    expect(auth.createUser).toHaveBeenCalledTimes(1);
    expect(setClaims).toHaveBeenCalledWith('u-2', { role: 'super_admin' });
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/scripts/seed-super-admin.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement.** Create `apps/api/src/scripts/seed-super-admin.ts`:

```ts
import { randomBytes } from 'crypto';
import type { auth as AdminAuth, firestore as AdminFirestore } from 'firebase-admin';

/**
 * Core seeding logic: ensure a Firebase user for `email` exists, elevate them
 * to `super_admin` via a custom claim, and upsert their Firestore user doc.
 * Idempotent — safe to re-run. Extracted from the CLI for testability.
 *
 * @param auth - Firebase Admin Auth instance.
 * @param firestore - Firebase Admin Firestore instance.
 * @param email - Email of the super-admin to seed.
 * @param password - Optional password used only when creating a new user.
 * @returns The seeded user's uid.
 */
export async function seedSuperAdmin(
  auth: AdminAuth.Auth,
  firestore: AdminFirestore.Firestore,
  email: string,
  password?: string,
): Promise<string> {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
  } catch {
    const created = await auth.createUser({
      email,
      password: password ?? randomBytes(12).toString('hex'),
      emailVerified: false,
    });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: 'super_admin' });

  const now = Date.now();
  await firestore
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        email,
        displayName: email.split('@')[0],
        role: 'super_admin',
        plan: 'free',
        xp: 0,
        streak: 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  return uid;
}

/* istanbul ignore next -- CLI bootstrap, not unit-tested */
async function bootstrap(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: node dist/scripts/seed-super-admin.js <email>');
    process.exit(1);
  }
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../app.module');
  const { FirebaseService } = await import('../infrastructure/firebase/firebase.service');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const firebase = app.get(FirebaseService);
  const uid = await seedSuperAdmin(firebase.auth, firebase.firestore, email);
  // eslint-disable-next-line no-console
  console.log(`Seeded super_admin uid=${uid} email=${email}`);
  await app.close();
}

/* istanbul ignore next */
if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run it — expect PASS.**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand src/scripts/seed-super-admin.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the npm script.** In `apps/api/package.json` `scripts`, add:
```json
    "seed:super-admin": "node dist/scripts/seed-super-admin.js",
```

- [ ] **Step 6: Sanity-check the build emits the script.**

Run: `pnpm --filter @eureka-lab/api build`
Expected: 0 errors; `apps/api/dist/scripts/seed-super-admin.js` exists.
(Operator usage later, out of band: `pnpm --filter @eureka-lab/api build && pnpm --filter @eureka-lab/api seed:super-admin you@example.com`.)

- [ ] **Step 7: Commit.**

```bash
git add apps/api/src/scripts/seed-super-admin.ts apps/api/src/scripts/seed-super-admin.spec.ts apps/api/package.json
git commit -m "feat(scripts): seed-only super_admin bootstrap (core + CLI)"
```

---

## Task 10: Firestore rules for `schools/{id}`

**Files:**
- Modify: `infrastructure/firebase/firestore.rules`

- [ ] **Step 1: Add the rules.** In `infrastructure/firebase/firestore.rules`, add a new block before the `// ── Default: deny all` block:

```
    // ── Schools Collection (B2B tenancy) ─────────────────────────────────

    match /schools/{schoolId} {
      // Super admins manage everything
      allow read: if hasRole('super_admin');

      // School admins can read their own school
      allow read: if hasRole('school_admin')
        && request.auth.uid in resource.data.adminUids;

      // Only the backend (Admin SDK) writes school docs
      allow write: if false;
    }
```

- [ ] **Step 2: Extend `super_admin` read on users (so super-admin tooling can read any profile).** In the `match /users/{userId}` block, add after the existing `allow read: if hasRole('admin');` line:

```
      // Super admins can read any profile
      allow read: if hasRole('super_admin');
```

- [ ] **Step 3: Validate rules syntax (best-effort).**

Run: `pnpm dlx firebase-tools firestore:rules:check infrastructure/firebase/firestore.rules 2>/dev/null || echo "firebase CLI not available — manual review only"`
Expected: either a clean parse, or the fallback message. If the CLI is unavailable, manually confirm the braces/match blocks are balanced and `hasRole(...)` matches the existing helper signature.

- [ ] **Step 4: Commit.**

```bash
git add infrastructure/firebase/firestore.rules
git commit -m "feat(firebase): firestore rules for schools/{id} + super_admin reads"
```

---

## Task 11: Frontend — redirects + placeholder consoles

**Files:**
- Modify: `apps/web/src/lib/auth-redirects.ts`
- Create: `apps/web/src/app/(dashboard)/admin/page.tsx`
- Create: `apps/web/src/app/(dashboard)/school/page.tsx`

- [ ] **Step 1: Map the new roles.** In `apps/web/src/lib/auth-redirects.ts`, inside `homeForRole`, add the two branches at the top of the function (before the `parent` check):

```ts
  if (role === 'super_admin') return '/admin';
  if (role === 'school_admin') return '/school';
```

Also extend the `UserRoleString` union for clarity:
```ts
export type UserRoleString =
  | 'child' | 'parent' | 'teacher' | 'admin'
  | 'super_admin' | 'school_admin' | string;
```

- [ ] **Step 2: Create the super-admin placeholder.** `apps/web/src/app/(dashboard)/admin/page.tsx`:

```tsx
/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Super-admin console placeholder. The full schools/subscriptions/licenses
 * console lands in B2B epic sub-project 2; this exists so `homeForRole`
 * redirects for super_admin resolve without a 404.
 */
export default function AdminConsolePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="font-display text-3xl text-glow-primary">Super Admin</h1>
      <div className="panel p-8 text-center">
        <p className="text-muted-foreground">
          School &amp; subscription management console — coming soon.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the school-admin placeholder.** `apps/web/src/app/(dashboard)/school/page.tsx`:

```tsx
/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * School-admin console placeholder. The teacher-management console lands in
 * B2B epic sub-project 3; this exists so `homeForRole` redirects for
 * school_admin resolve without a 404.
 */
export default function SchoolConsolePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="font-display text-3xl text-glow-primary">School Admin</h1>
      <div className="panel p-8 text-center">
        <p className="text-muted-foreground">Teacher management console — coming soon.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lint + type-check the web app.**

Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`
Expected: no NEW errors beyond the 24 known pre-existing test-file errors.

- [ ] **Step 5: Commit.**

```bash
git add apps/web/src/lib/auth-redirects.ts "apps/web/src/app/(dashboard)/admin/page.tsx" "apps/web/src/app/(dashboard)/school/page.tsx"
git commit -m "feat(web): route super_admin/school_admin home + placeholder consoles"
```

---

## Task 12: Final verification + ROADMAP status

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Full api suite + type-checks (no regressions).**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
Run: `pnpm --filter @eureka-lab/api test -- --runInBand` → all green (261 prior + new schools/guard/seed/users tests)
Run: `pnpm --filter @eureka-lab/web lint` → clean

- [ ] **Step 2: Confirm coverage on new code (≥80%).**

Run: `pnpm --filter @eureka-lab/api test -- --runInBand --coverage --collectCoverageFrom='src/modules/schools/**/*.ts' --collectCoverageFrom='src/common/guards/tenant.guard.ts' --collectCoverageFrom='src/scripts/seed-super-admin.ts'`
Expected: ≥80% lines for the schools module, TenantGuard, and the seed core (the `istanbul ignore` CLI bootstrap is excluded).

- [ ] **Step 3: Update ROADMAP Stream 6 row.** In `ROADMAP.md`, change the sub-project 1 row status from `**SPEC DONE — planning next**` to `**DONE** (<commit-sha-range>)` and note the plan doc:
```
| 1 | Tenancy + role foundation (...) | **DONE** (feat/school-tenancy) | [foundation](docs/superpowers/specs/2026-05-30-school-tenancy-foundation-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-foundation-plan.md) |
```

- [ ] **Step 4: Commit.**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): mark B2B sub-project 1 (tenancy foundation) DONE"
```

- [ ] **Step 5: Report to the user** — summarize what shipped, that nothing was pushed (await push approval), and that sub-project 2 (super-admin console) is the next slice to brainstorm/plan.

---

## Self-Review (completed by plan author)

**Spec coverage:** Roles (T1), School model (T1), `schoolId` on users (T2), schoolId claim (T3), schools collection + repo (T4), DTOs (T5), service create/mint/get/list (T6), 4 super-admin endpoints + registration (T7), TenantGuard (T8), seed-only super-admin (T9), Firestore rules (T10), homeForRole + placeholders (T11), tests/coverage/ROADMAP (T12). All foundation-spec sections map to a task. ✔

**Deferred items correctly excluded:** console UIs, teacher management, enrollment/seat enforcement, school-consent COPPA, real billing, key rotation — none implemented here (only the data fields they will later use). ✔

**Type consistency:** `School`/`SchoolSummary`/`UserRole` defined in T1 are the exact names used in T4/T6/T7. `seedSuperAdmin(auth, firestore, email, password?)` signature matches between T9 implementation and test. `mintSchoolAdmin` return shape matches the T6 test. `AuthenticatedUser.schoolId` (T3) is consumed by TenantGuard (T8). `incrementSeatsUsed`/`addAdminUid`/`newId`/`findById`/`listAll` names are consistent across repo (T4) and service (T6). ✔

**Placeholder scan:** every code step contains complete code; no TBD/TODO/"handle errors" placeholders. ✔
