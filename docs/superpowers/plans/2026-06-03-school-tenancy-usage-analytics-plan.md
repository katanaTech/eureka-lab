# School Tenancy 5b — Super-admin Usage Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the platform super-admin current-state usage views — a platform overview (tiles) plus an enriched schools table — computed on demand from existing data (seat utilization, roster counts, billing-status mix, active students).

**Architecture:** A new bounded `school-analytics` NestJS module aggregates on request: it lists schools (`SchoolsRepository.listAll`, bounded ≤500) and fans out cheap Firestore `count()` queries per school via count helpers added to the **owning** services/repos (`UsersRepository` for teachers + active students, `ClassroomsService` for classrooms); `seatsUsed` and `subscription.status` come from the school doc (no new query). No schema changes, no write-path counters. Frontend adds overview tiles + table columns to the existing super-admin `/admin` dashboard.

**Tech Stack:** NestJS (Fastify), Firestore `count()` aggregations (`firebase-admin`), Jest, Next.js 14 App Router, next-intl, TypeScript (no `any`).

**Spec:** [`docs/superpowers/specs/2026-06-03-school-tenancy-usage-analytics-design.md`](../specs/2026-06-03-school-tenancy-usage-analytics-design.md)

---

## Conventions (apply to every task)

- **API tests:** `pnpm --filter @eureka-lab/api exec jest --runInBand <path>`. Never `... test -- ...`. `NODE_OPTIONS=--max-old-space-size=6144` if OOM.
- **After editing `packages/shared-types/src/index.ts`:** `pnpm --filter @eureka-lab/shared-types build`. Commit only `src/`.
- **Commit footer (every commit):** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task; conventional subjects. Use the Bash heredoc `git commit -F - <<'EOF' … EOF`.
- **NestJS:** static routes before param routes; controller specs `.overrideGuard(...)` every guard used.
- **No `console.log`** (Pino/Nest `Logger`). **No `any`** (narrow `unknown`). **JSDoc** on every new function/param. Files **< 300 lines**.
- **Frontend:** inline feedback only (Sonner broken — never `toast()`); i18n in en/fr/ar; **no** frontend unit tests — success = `lint` clean + web `tsc` error count **stays 24**.
- **Do not stage** `.claude/settings.local.json`.

## File Structure

**Create:**
- `apps/api/src/modules/school-analytics/school-analytics.service.ts` — aggregation (rows + overview).
- `apps/api/src/modules/school-analytics/school-analytics.controller.ts` — 2 GET endpoints (super_admin).
- `apps/api/src/modules/school-analytics/school-analytics.module.ts` — wiring.
- `apps/api/src/modules/school-analytics/school-analytics.service.spec.ts`, `school-analytics.controller.spec.ts`
- `infrastructure/firebase/firestore.indexes.json` — the one new composite index.

**Modify:**
- `packages/shared-types/src/index.ts` — `SchoolUsageRow`, `PlatformUsageOverview`.
- `apps/api/src/modules/users/users.repository.ts` (+ spec) — `countTeachersBySchool`, `countActiveStudents`.
- `apps/api/src/modules/classrooms/classrooms.service.ts` (+ spec) — `countBySchool`.
- `apps/api/src/app.module.ts` — register `SchoolAnalyticsModule`.
- `apps/web/src/lib/api-client.ts` — `schoolAnalyticsApi`.
- `apps/web/src/components/features/admin/UsageOverview.tsx` (new) + `SchoolsTable.tsx` (columns) + `(dashboard)/admin/page.tsx`.
- `apps/web/src/messages/{en,fr,ar}.json` — `SchoolAnalytics` namespace.
- `ROADMAP.md`, `docs/context/env-variables.md` (no new env — DEPLOY note only in ROADMAP).

---

## Task 1: Shared types — `SchoolUsageRow` + `PlatformUsageOverview`

**Files:**
- Modify: `packages/shared-types/src/index.ts` (after the existing `SchoolSummary` / billing types)

- [ ] **Step 1: Add the types**

Add (after `SchoolBillingSummary`):

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
  totalStudents: number;
  totalActiveStudents: number;
  /** Count of schools per subscription status. */
  billingStatusMix: Record<string, number>;
}
```

- [ ] **Step 2: Build + type-check**

Run: `pnpm --filter @eureka-lab/shared-types build` → 0 errors.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/index.ts
git commit -F - <<'EOF'
feat(types): SchoolUsageRow + PlatformUsageOverview (5b)

View types for super-admin usage analytics — per-school row + platform
aggregate. No persisted shape.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `UsersRepository` count helpers + composite index

**Files:**
- Modify: `apps/api/src/modules/users/users.repository.ts`
- Modify: `apps/api/src/modules/users/users.repository.spec.ts`
- Create: `infrastructure/firebase/firestore.indexes.json`

The file already has the `.count().get()` idiom (`countChildrenByParent`) and `role==teacher` + `schoolId==` queries (`findTeachersBySchool`) — mirror them.

- [ ] **Step 1: Write the failing tests**

Add to `users.repository.spec.ts` (match the file's existing Firestore-mock style; reference shape below — adapt to the actual mock helpers in the file):

```ts
describe('school analytics counts', () => {
  it('countTeachersBySchool counts role=teacher + schoolId', async () => {
    const get = jest.fn().mockResolvedValue({ data: () => ({ count: 3 }) });
    const where2 = jest.fn().mockReturnValue({ count: () => ({ get }) });
    const where1 = jest.fn().mockReturnValue({ where: where2 });
    (firebase.firestore.collection as jest.Mock).mockReturnValue({ where: where1 });
    expect(await repo.countTeachersBySchool('s1')).toBe(3);
    expect(where1).toHaveBeenCalledWith('role', '==', 'teacher');
    expect(where2).toHaveBeenCalledWith('schoolId', '==', 's1');
  });

  it('countActiveStudents filters child + schoolId + lastActiveDate>=cutoff', async () => {
    const get = jest.fn().mockResolvedValue({ data: () => ({ count: 5 }) });
    const where3 = jest.fn().mockReturnValue({ count: () => ({ get }) });
    const where2 = jest.fn().mockReturnValue({ where: where3 });
    const where1 = jest.fn().mockReturnValue({ where: where2 });
    (firebase.firestore.collection as jest.Mock).mockReturnValue({ where: where1 });
    expect(await repo.countActiveStudents('s1', '2026-05-04')).toBe(5);
    expect(where1).toHaveBeenCalledWith('schoolId', '==', 's1');
    expect(where2).toHaveBeenCalledWith('role', '==', 'child');
    expect(where3).toHaveBeenCalledWith('lastActiveDate', '>=', '2026-05-04');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts`
Expected: FAIL — methods not defined.

- [ ] **Step 3: Implement the methods**

Add to `users.repository.ts` (after `findTeachersBySchool`):

```ts
  /**
   * Count teacher user docs in a school.
   * @param schoolId - School tenant id.
   * @returns Teacher count.
   */
  async countTeachersBySchool(schoolId: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'teacher')
      .where('schoolId', '==', schoolId)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Count active students in a school (child users whose lastActiveDate is
   * on or after the cutoff). Requires the users composite index.
   * @param schoolId - School tenant id.
   * @param sinceDate - Inclusive cutoff as a YYYY-MM-DD string.
   * @returns Active-student count.
   */
  async countActiveStudents(schoolId: string, sinceDate: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('schoolId', '==', schoolId)
      .where('role', '==', 'child')
      .where('lastActiveDate', '>=', sinceDate)
      .count()
      .get();
    return snapshot.data().count;
  }
```

- [ ] **Step 4: Create the composite index file**

Create `infrastructure/firebase/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "lastActiveDate", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 5: Run to verify pass + type-check**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/users/users.repository.spec.ts` → PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/users/users.repository.ts apps/api/src/modules/users/users.repository.spec.ts infrastructure/firebase/firestore.indexes.json
git commit -F - <<'EOF'
feat(users): count helpers for school analytics + composite index

Add countTeachersBySchool and countActiveStudents (child + schoolId +
lastActiveDate>=cutoff). Introduce firestore.indexes.json with the users
composite index the active-students range query needs (deploy via
firebase deploy --only firestore:indexes — tracked with DEPLOY-001).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: `ClassroomsService.countBySchool`

**Files:**
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts`
- Modify: `apps/api/src/modules/classrooms/classrooms.service.spec.ts`

`classrooms.service.ts` owns the `classrooms` collection (`collectionName = 'classrooms'`) and already uses `.count()`. Add a school-scoped count.

- [ ] **Step 1: Write the failing test**

Add to `classrooms.service.spec.ts` (match its existing Firestore-mock style):

```ts
describe('countBySchool', () => {
  it('counts classrooms with schoolId', async () => {
    const get = jest.fn().mockResolvedValue({ data: () => ({ count: 4 }) });
    const where = jest.fn().mockReturnValue({ count: () => ({ get }) });
    (firebase.firestore.collection as jest.Mock).mockReturnValue({ where });
    expect(await service.countBySchool('s1')).toBe(4);
    expect(where).toHaveBeenCalledWith('schoolId', '==', 's1');
  });
});
```

> Adapt `firebase`/mock variable names to the spec's actual setup. The mock must reflect `collection('classrooms').where('schoolId','==',id).count().get()`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/classrooms/classrooms.service.spec.ts`
Expected: FAIL — method not defined.

- [ ] **Step 3: Implement**

Add to `classrooms.service.ts` (use the existing `this.collectionName` constant; place near other query methods):

```ts
  /**
   * Count classrooms belonging to a school.
   * @param schoolId - School tenant id.
   * @returns Classroom count.
   */
  async countBySchool(schoolId: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('schoolId', '==', schoolId)
      .count()
      .get();
    return snapshot.data().count;
  }
```

> If the service injects Firestore under a different accessor than `this.firebase.firestore`, match the file's existing usage.

- [ ] **Step 4: Run to verify pass + type-check**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/classrooms/classrooms.service.spec.ts` → PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/classrooms/classrooms.service.ts apps/api/src/modules/classrooms/classrooms.service.spec.ts
git commit -F - <<'EOF'
feat(classrooms): countBySchool for usage analytics

Add a schoolId-scoped classroom count() used by the super-admin
analytics rollup.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `SchoolAnalyticsService` (rows + overview)

**Files:**
- Create: `apps/api/src/modules/school-analytics/school-analytics.service.ts`
- Create: `apps/api/src/modules/school-analytics/school-analytics.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `school-analytics.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { SchoolAnalyticsService } from './school-analytics.service';
import { SchoolsRepository } from '../schools/schools.repository';
import { UsersRepository } from '../users/users.repository';
import { ClassroomsService } from '../classrooms/classrooms.service';

const mkSchool = (over: Record<string, unknown> = {}) => ({
  id: 's1', name: 'A', status: 'active', seatLimit: 30, seatsUsed: 10, adminUids: [],
  subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_1' },
  secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa', ...over,
});

const mockSchools = { listAll: jest.fn() };
const mockUsers = { countTeachersBySchool: jest.fn(), countActiveStudents: jest.fn() };
const mockClassrooms = { countBySchool: jest.fn() };

describe('SchoolAnalyticsService', () => {
  let service: SchoolAnalyticsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchoolAnalyticsService,
        { provide: SchoolsRepository, useValue: mockSchools },
        { provide: UsersRepository, useValue: mockUsers },
        { provide: ClassroomsService, useValue: mockClassrooms },
      ],
    }).compile();
    service = moduleRef.get(SchoolAnalyticsService);
  });

  describe('getSchoolRows', () => {
    it('builds a row with utilization/activeRate and billing status', async () => {
      mockSchools.listAll.mockResolvedValue([mkSchool()]);
      mockUsers.countTeachersBySchool.mockResolvedValue(2);
      mockClassrooms.countBySchool.mockResolvedValue(4);
      mockUsers.countActiveStudents.mockResolvedValue(5);
      const rows = await service.getSchoolRows();
      expect(rows[0]).toEqual(expect.objectContaining({
        schoolId: 's1', seatLimit: 30, seatsUsed: 10, teacherCount: 2, classroomCount: 4,
        activeStudents: 5, billingStatus: 'active',
      }));
      expect(rows[0].utilization).toBeCloseTo(10 / 30);
      expect(rows[0].activeRate).toBeCloseTo(5 / 10);
    });

    it('guards divide-by-zero for a school with no seats', async () => {
      mockSchools.listAll.mockResolvedValue([mkSchool({ seatLimit: 0, seatsUsed: 0, subscription: { tier: 'trial', status: 'none' } })]);
      mockUsers.countTeachersBySchool.mockResolvedValue(0);
      mockClassrooms.countBySchool.mockResolvedValue(0);
      mockUsers.countActiveStudents.mockResolvedValue(0);
      const rows = await service.getSchoolRows();
      expect(rows[0].utilization).toBe(0);
      expect(rows[0].activeRate).toBe(0);
      expect(rows[0].billingStatus).toBe('none');
    });
  });

  describe('getOverview', () => {
    it('aggregates totals, status counts, and billing mix', async () => {
      mockSchools.listAll.mockResolvedValue([
        mkSchool({ id: 's1', status: 'active', seatLimit: 30, seatsUsed: 10, subscription: { tier: 't', status: 'active' } }),
        mkSchool({ id: 's2', status: 'suspended', seatLimit: 20, seatsUsed: 20, subscription: { tier: 't', status: 'past_due' } }),
      ]);
      mockUsers.countTeachersBySchool.mockResolvedValue(1);
      mockClassrooms.countBySchool.mockResolvedValue(1);
      mockUsers.countActiveStudents.mockResolvedValueOnce(4).mockResolvedValueOnce(8);
      const o = await service.getOverview();
      expect(o.totalSchools).toBe(2);
      expect(o.schoolsByStatus).toEqual({ active: 1, suspended: 1 });
      expect(o.totalSeatLimit).toBe(50);
      expect(o.totalSeatsUsed).toBe(30);
      expect(o.totalStudents).toBe(30);
      expect(o.totalActiveStudents).toBe(12);
      expect(o.seatUtilization).toBeCloseTo(30 / 50);
      expect(o.billingStatusMix).toEqual(expect.objectContaining({ active: 1, past_due: 1 }));
    });

    it('returns zeros for an empty platform', async () => {
      mockSchools.listAll.mockResolvedValue([]);
      const o = await service.getOverview();
      expect(o).toEqual(expect.objectContaining({ totalSchools: 0, totalSeatLimit: 0, totalSeatsUsed: 0, seatUtilization: 0, totalActiveStudents: 0 }));
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-analytics/school-analytics.service.spec.ts`
Expected: FAIL — service not found.

- [ ] **Step 3: Implement the service**

Create `school-analytics.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type {
  School,
  SchoolUsageRow,
  PlatformUsageOverview,
} from '@eureka-lab/shared-types';
import { SchoolsRepository } from '../schools/schools.repository';
import { UsersRepository } from '../users/users.repository';
import { ClassroomsService } from '../classrooms/classrooms.service';

/** How recently a student must have been active to count as "active". */
const ACTIVE_WINDOW_DAYS = 30;

/**
 * On-demand super-admin usage analytics. Aggregates current-state metrics
 * from existing data (no time-series, no stored counters). Read-only.
 */
@Injectable()
export class SchoolAnalyticsService {
  constructor(
    private readonly schools: SchoolsRepository,
    private readonly users: UsersRepository,
    private readonly classrooms: ClassroomsService,
  ) {}

  /**
   * Per-school usage rows for the enriched super-admin table.
   * @returns One row per school (bounded by listAll).
   */
  async getSchoolRows(): Promise<SchoolUsageRow[]> {
    const schools = await this.schools.listAll();
    const since = this.activeCutoff();
    return Promise.all(schools.map((s) => this.toRow(s, since)));
  }

  /**
   * Platform-wide usage aggregate for the overview tiles.
   * @returns The aggregate.
   */
  async getOverview(): Promise<PlatformUsageOverview> {
    const rows = await this.getSchoolRows();
    const overview: PlatformUsageOverview = {
      totalSchools: rows.length,
      schoolsByStatus: { active: 0, suspended: 0 },
      totalSeatLimit: 0,
      totalSeatsUsed: 0,
      seatUtilization: 0,
      totalStudents: 0,
      totalActiveStudents: 0,
      billingStatusMix: {},
    };
    for (const r of rows) {
      if (r.status === 'active') overview.schoolsByStatus.active += 1;
      else overview.schoolsByStatus.suspended += 1;
      overview.totalSeatLimit += r.seatLimit;
      overview.totalSeatsUsed += r.seatsUsed;
      overview.totalStudents += r.seatsUsed;
      overview.totalActiveStudents += r.activeStudents;
      overview.billingStatusMix[r.billingStatus] =
        (overview.billingStatusMix[r.billingStatus] ?? 0) + 1;
    }
    overview.seatUtilization = this.ratio(overview.totalSeatsUsed, overview.totalSeatLimit);
    return overview;
  }

  /**
   * Build one usage row for a school (3 count queries, fanned out by caller).
   * @param school - The school doc.
   * @param since - Active-student cutoff (YYYY-MM-DD).
   * @returns The usage row.
   */
  private async toRow(school: School, since: string): Promise<SchoolUsageRow> {
    const [teacherCount, classroomCount, activeStudents] = await Promise.all([
      this.users.countTeachersBySchool(school.id),
      this.classrooms.countBySchool(school.id),
      this.users.countActiveStudents(school.id, since),
    ]);
    return {
      schoolId: school.id,
      name: school.name,
      status: school.status,
      seatLimit: school.seatLimit,
      seatsUsed: school.seatsUsed,
      utilization: this.ratio(school.seatsUsed, school.seatLimit),
      teacherCount,
      classroomCount,
      activeStudents,
      activeRate: this.ratio(activeStudents, school.seatsUsed),
      billingStatus: school.subscription.status,
    };
  }

  /**
   * Safe ratio, 0 when the denominator is 0.
   * @param num - Numerator.
   * @param den - Denominator.
   * @returns num/den, or 0.
   */
  private ratio(num: number, den: number): number {
    return den > 0 ? num / den : 0;
  }

  /**
   * Active-student cutoff as a YYYY-MM-DD string (today − ACTIVE_WINDOW_DAYS).
   * @returns The cutoff date string.
   */
  private activeCutoff(): string {
    const ms = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
}
```

- [ ] **Step 4: Run to verify pass + type-check + length**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-analytics/school-analytics.service.spec.ts` → PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors. Confirm the file is < 300 lines.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/school-analytics/school-analytics.service.ts apps/api/src/modules/school-analytics/school-analytics.service.spec.ts
git commit -F - <<'EOF'
feat(school-analytics): usage aggregation service

Per-school rows (seat utilization, teacher/classroom counts, active
students, billing status) and a platform overview, computed on demand via
count() fan-out. Divide-by-zero guarded; 30-day active window.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: `SchoolAnalyticsController` + module wiring

**Files:**
- Create: `apps/api/src/modules/school-analytics/school-analytics.controller.ts`
- Create: `apps/api/src/modules/school-analytics/school-analytics.controller.spec.ts`
- Create: `apps/api/src/modules/school-analytics/school-analytics.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write the failing controller test**

Create `school-analytics.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { SchoolAnalyticsController } from './school-analytics.controller';
import { SchoolAnalyticsService } from './school-analytics.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const mockService = { getOverview: jest.fn(), getSchoolRows: jest.fn() };
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolAnalyticsController', () => {
  let controller: SchoolAnalyticsController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SchoolAnalyticsController],
      providers: [{ provide: SchoolAnalyticsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolAnalyticsController);
  });

  it('overview delegates to the service', async () => {
    mockService.getOverview.mockResolvedValueOnce({ totalSchools: 2 });
    expect(await controller.overview()).toEqual({ totalSchools: 2 });
  });

  it('schools wraps rows in { schools }', async () => {
    mockService.getSchoolRows.mockResolvedValueOnce([{ schoolId: 's1' }]);
    expect(await controller.schools()).toEqual({ schools: [{ schoolId: 's1' }] });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-analytics/school-analytics.controller.spec.ts`
Expected: FAIL — controller not found.

- [ ] **Step 3: Implement controller + module**

Create `school-analytics.controller.ts` (static routes; both GET, super_admin):

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type {
  PlatformUsageOverview,
  SchoolUsageRow,
} from '@eureka-lab/shared-types';
import { SchoolAnalyticsService } from './school-analytics.service';

/**
 * Super-admin usage analytics (read-only). Platform overview + per-school rows.
 */
@Controller('school-analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('super_admin')
export class SchoolAnalyticsController {
  constructor(private readonly analytics: SchoolAnalyticsService) {}

  /**
   * Platform-wide usage aggregate.
   * @returns The overview tiles payload.
   */
  @Get('overview')
  async overview(): Promise<PlatformUsageOverview> {
    return this.analytics.getOverview();
  }

  /**
   * Per-school usage rows for the enriched table.
   * @returns Rows wrapped in { schools }.
   */
  @Get('schools')
  async schools(): Promise<{ schools: SchoolUsageRow[] }> {
    return { schools: await this.analytics.getSchoolRows() };
  }
}
```

Create `school-analytics.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { SchoolAnalyticsController } from './school-analytics.controller';
import { SchoolAnalyticsService } from './school-analytics.service';
import { SchoolsModule } from '../schools/schools.module';
import { UsersModule } from '../users/users.module';
import { ClassroomsModule } from '../classrooms/classrooms.module';

/**
 * School analytics module — super-admin usage views.
 * Imports SchoolsModule (SchoolsRepository), UsersModule (UsersRepository),
 * ClassroomsModule (ClassroomsService).
 */
@Module({
  imports: [SchoolsModule, UsersModule, ClassroomsModule],
  controllers: [SchoolAnalyticsController],
  providers: [SchoolAnalyticsService],
})
export class SchoolAnalyticsModule {}
```

> Verify each imported module exports what's needed: `SchoolsModule` exports `SchoolsRepository` (yes), `UsersModule` exports `UsersRepository` (yes), `ClassroomsModule` exports `ClassroomsService` (yes). If any does not, add it to that module's `exports` (a targeted, in-scope fix).

Register `SchoolAnalyticsModule` in `apps/api/src/app.module.ts` (import + add to the `imports` array near `SchoolsModule`).

- [ ] **Step 4: Run to verify pass + full suite**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-analytics` → both suites PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand` → all green (module graph boots).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/school-analytics/school-analytics.controller.ts apps/api/src/modules/school-analytics/school-analytics.controller.spec.ts apps/api/src/modules/school-analytics/school-analytics.module.ts apps/api/src/app.module.ts
git commit -F - <<'EOF'
feat(school-analytics): controller + module wiring

Two super-admin GET endpoints (/school-analytics/overview, /schools).
Register SchoolAnalyticsModule (imports schools/users/classrooms).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: Frontend — API client + overview tiles + enriched table + i18n

**Files (confirm paths by reading first):**
- Modify: `apps/web/src/lib/api-client.ts` — add `schoolAnalyticsApi`.
- Create: `apps/web/src/components/features/admin/UsageOverview.tsx`.
- Modify: `apps/web/src/components/features/admin/SchoolsTable.tsx` — add columns.
- Modify: `apps/web/src/app/(dashboard)/admin/page.tsx` — render `<UsageOverview />` above the table.
- Modify: `apps/web/src/messages/{en,fr,ar}.json` — `SchoolAnalytics` namespace.

- [ ] **Step 1: Read the seams**

Read `apps/web/src/lib/api-client.ts` (the `schoolsApi` object + `request<T>` helper), `apps/web/src/app/(dashboard)/admin/page.tsx`, `apps/web/src/components/features/admin/SchoolsTable.tsx`, and `apps/web/src/components/features/billing/billingStatus.ts` (the 5a status-badge helpers to reuse for the billing column).

- [ ] **Step 2: API client**

Add to `api-client.ts` (after `schoolsApi`), importing `PlatformUsageOverview` + `SchoolUsageRow` from `@eureka-lab/shared-types`:

```ts
export const schoolAnalyticsApi = {
  /** Super-admin: platform usage overview. */
  overview: () => request<PlatformUsageOverview>('/school-analytics/overview'),
  /** Super-admin: per-school usage rows. */
  schools: () => request<{ schools: SchoolUsageRow[] }>('/school-analytics/schools'),
};
```

- [ ] **Step 3: `UsageOverview` tiles**

Create `apps/web/src/components/features/admin/UsageOverview.tsx` (`'use client'`): on mount call `schoolAnalyticsApi.overview()`; render tiles for total schools (+ active/suspended), seats sold vs filled with utilization %, total/active students, and a billing-status-mix breakdown (reuse `features/billing/billingStatus.ts` for status labels/colors). Inline loading + error (no `toast`). Use the existing panel/tile styling on the admin page; `useTranslations('SchoolAnalytics')`. Keep < 300 lines.

- [ ] **Step 4: Enriched `SchoolsTable`**

In `SchoolsTable.tsx`: fetch `schoolAnalyticsApi.schools()` once, index rows by `schoolId`, and add columns — **Utilization** (`utilization` as %), **Students** (`seatsUsed`), **Active %** (`activeRate` as %), **Billing** (badge via the billing helper). Render `—` for a school with no matching usage row (defensive). Preserve existing columns/behavior. Inline loading state for the added data.

- [ ] **Step 5: Render the overview + i18n**

In `(dashboard)/admin/page.tsx`, render `<UsageOverview />` above the schools table. Add a `SchoolAnalytics` namespace to `apps/web/src/messages/{en,fr,ar}.json` with real fr/ar translations for keys you reference (e.g. `overviewTitle`, `totalSchools`, `active`, `suspended`, `seatsSoldVsFilled`, `utilization`, `students`, `activeStudents`, `activePct`, `billingMix`, `loading`, `errorGeneric`, column headers `colUtilization`, `colStudents`, `colActive`, `colBilling`).

Validate: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`.

- [ ] **Step 6: Verify**

Run: `pnpm --filter @eureka-lab/web lint` → clean.
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → **24** (unchanged).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -F - <<'EOF'
feat(web): super-admin usage analytics (overview tiles + table columns)

UsageOverview tiles (schools by status, seat utilization, active students,
billing mix) and new SchoolsTable columns (utilization, students, active %,
billing badge), with a typed schoolAnalyticsApi and en/fr/ar strings.
Inline feedback only.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Docs — ROADMAP + epic-complete + DEPLOY note

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Update ROADMAP**

In Stream 6, add a row for **5b** marked **DONE** (`feat/school-b2b-usage-analytics`, 2026-06-03) — super-admin usage analytics (overview + enriched table; current-state, no time-series). Note the B2B epic is **delivered**; the only remaining parked item is **secret-key rotation**, awaiting a consuming feature.

In Stream 3, append to the `DEPLOY-001` row a note: "5b adds the first Firestore composite index (`infrastructure/firebase/firestore.indexes.json`, `users` schoolId+role+lastActiveDate); deploy with `firebase deploy --only firestore:indexes` — the active-students count errors until it's live."

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -F - <<'EOF'
docs(roadmap): mark B2B 5b (usage analytics) DONE; epic delivered

Flip Stream 6 to add 5b DONE and note the B2B epic is complete (key
rotation the sole parked item). Add the firestore.indexes.json deploy step
to DEPLOY-001.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Final verification (after Task 7)

- [ ] `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.
- [ ] `pnpm --filter @eureka-lab/api exec jest --runInBand` → all suites pass; `school-analytics` ≥ 80% coverage (`--coverage --collectCoverageFrom='src/modules/school-analytics/**'`).
- [ ] `pnpm --filter @eureka-lab/web lint` → clean; web tsc error count → 24.
- [ ] `node -e "['en','fr','ar'].forEach(l=>require('./apps/web/src/messages/'+l+'.json'))"` → parse.
- [ ] Smoke brief to user (super-admin `/admin`: overview tiles populate; table shows utilization/students/active%/billing columns). User runs + reports before push.
- [ ] `superpowers:finishing-a-development-branch` → user picks push + PR (base `feat/school-b2b-billing`).

## Spec coverage check

| Spec section | Task(s) |
|---|---|
| §4 view types | 1 |
| §5 count helpers (users) + composite index | 2 |
| §5 count helper (classrooms) | 3 |
| §5 analytics service (rows + overview, active window, divide-by-zero) | 4 |
| §5 controller + module (2 super-admin GETs) | 5 |
| §6 frontend (api client, tiles, table columns, i18n) | 6 |
| §7 testing | 2–5 + final verification |
| §9 ROADMAP / epic-complete / DEPLOY index note | 7 |
