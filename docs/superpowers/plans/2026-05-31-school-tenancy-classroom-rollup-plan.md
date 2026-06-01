# Classroom→School Rollup, Roster Assignment & Join Hardening — Implementation Plan (Sub-project 4b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect 4a's seated school students to teacher classrooms and roll classrooms up to the school: classrooms carry a denormalized `schoolId`, teachers assign students from their school roster, the existing join-by-code flow becomes tenant-safe, and a school admin sees a read-only classroom rollup.

**Architecture:** A denormalized `ClassroomDocument.schoolId` (ADR-008 hybrid-tenancy pattern, mirrors `users.schoolId`) makes a school's classrooms an O(1) query. Backend work lands in the existing `classrooms` module (create-stamp, roster, assignment, join hardening) and the `schools` module (a new read-only rollup controller). No new module. TDD throughout — backend carries the ≥80% coverage bar for both modules. Frontend adds a teacher "Add students" picker (school teachers only) and a read-only `/school` **Classrooms** tab.

**Tech Stack:** NestJS (Fastify), Firestore (firebase-admin), Jest + Supertest (api), Next.js 14.2 App Router, next-intl, Tailwind v4, TypeScript.

**Source spec:** [`docs/superpowers/specs/2026-05-31-school-tenancy-classroom-rollup-design.md`](../specs/2026-05-31-school-tenancy-classroom-rollup-design.md) — source of truth.

---

## Conventions (apply to every task)

- **API test command:** `pnpm --filter @eureka-lab/api exec jest --runInBand [optional/path]`. **Never** `... test -- --runInBand`. Add `NODE_OPTIONS=--max-old-space-size=6144` before the command if it OOMs.
- **API typecheck:** `pnpm --filter @eureka-lab/api exec tsc --noEmit` → must stay **0 errors**.
- **Web lint:** `pnpm --filter @eureka-lab/web lint` → must stay **clean**.
- **Web typecheck:** `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → must stay **24** (pre-existing test-file errors; not zero).
- **Rebuild shared-types after editing** `packages/shared-types/src/index.ts`: `pnpm --filter @eureka-lab/shared-types build`. Commit only `src/` (dist is gitignored).
- **Commit footer on every commit** (Bash heredoc form, since the Bash tool is bash):
  ```bash
  git commit -F - <<'EOF'
  <conventional subject>

  <body>

  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  EOF
  ```
- **One commit per task.** Within-task review fixes fold in via `git commit --amend` (branch is unpushed).
- **NestJS route ordering:** declare static routes (`@Get('roster')`) **before** param routes (`@Get(':id')`).
- **Controller specs** must `.overrideGuard(...)` exactly the guards the controller uses: `ClassroomsController` → `FirebaseAuthGuard`, `RolesGuard` (two). Schools rollup controller → `FirebaseAuthGuard`, `RolesGuard`, `TenantGuard` (three).
- **No frontend unit tests** this slice. Frontend verification = lint + tsc(24) + user smoke.
- **Sonner is broken app-wide** — all UI feedback is inline local state, never `toast()`.
- **i18n** keys in all three locales (en/fr/ar). Validate before committing:
  `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`

---

## Pre-flight (do before Task 1)

- [ ] **Confirm branch.** Run: `git branch --show-current` → Expected: `feat/school-classroom-rollup` (already created off `feat/school-student-enrollment`).
- [ ] **Baseline api typecheck.** Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → Expected: 0 errors.
- [ ] **Baseline api tests.** Run: `pnpm --filter @eureka-lab/api exec jest --runInBand` → Expected: 35 suites / 340 tests pass.
- [ ] **Baseline web lint.** Run: `pnpm --filter @eureka-lab/web lint` → Expected: clean.
- [ ] **Baseline web typecheck.** Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → Expected: 24.
- [ ] **Leave the working tree's pre-existing `M` files alone** (`.claude/settings.local.json`, `apps/web/tsconfig.tsbuildinfo`) — never stage them.

---

## File Structure

**shared-types**
- Modify: `packages/shared-types/src/index.ts` — add `schoolId?` to `ClassroomDocument`; add `SchoolClassroomSummary`.

**api — classrooms module**
- Create: `apps/api/src/modules/classrooms/dto/assign-students.dto.ts` — `AssignStudentsDto`.
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts` — `createClassroom` gains `schoolId`; new `assignStudents`, `getSchoolRoster`; `joinClassroom` hardened.
- Modify: `apps/api/src/modules/classrooms/classrooms.controller.ts` — thread `user.schoolId`; new `GET /classrooms/roster`, `POST /classrooms/:id/students`.
- Modify: `apps/api/src/modules/classrooms/classrooms.service.spec.ts` and `classrooms.controller.spec.ts` — new + updated tests.

**api — schools module**
- Create: `apps/api/src/modules/schools/school-classrooms.service.ts` — `listSchoolClassrooms`.
- Create: `apps/api/src/modules/schools/school-classrooms.controller.ts` — `GET /schools/:id/classrooms`.
- Create: `apps/api/src/modules/schools/school-classrooms.service.spec.ts`, `school-classrooms.controller.spec.ts`.
- Modify: `apps/api/src/modules/schools/schools.module.ts` — register the new controller + service.

**web**
- Modify: `apps/web/src/lib/api-client.ts` — `classroomsApi.getRoster`, `classroomsApi.assignStudents`; `schoolsApi.listClassrooms`; import `SchoolClassroomSummary`.
- Create: `apps/web/src/components/features/teacher/AddStudentsDialog.tsx` — roster picker.
- Modify: `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx` — wire the picker (school teachers only).
- Create: `apps/web/src/components/features/school/ClassroomsTable.tsx`, `ClassroomsPanel.tsx`.
- Modify: `apps/web/src/app/(dashboard)/school/page.tsx` — add the read-only Classrooms tab.
- Modify: `apps/web/src/messages/{en,fr,ar}.json` — `SchoolClassrooms` namespace + a few `Teacher` keys.

**docs**
- Modify: `ROADMAP.md` — flip Stream 6 sub-project-4b row to DONE.

---

## Task 1: shared-types — `schoolId` on classrooms + `SchoolClassroomSummary`

**Files:**
- Modify: `packages/shared-types/src/index.ts:771-786` (`ClassroomDocument`) and `:786-800` (after `ClassroomSummary`)

- [ ] **Step 1: Add `schoolId?` to `ClassroomDocument`.** In `packages/shared-types/src/index.ts`, inside `interface ClassroomDocument`, add after the `teacherId` field:

```typescript
  /** Teacher's Firebase UID */
  teacherId: string;
  /**
   * Owning school tenant id (denormalized, ADR-008). Set when a teacher who
   * has a schoolId creates the class; absent for B2C classrooms.
   */
  schoolId?: string;
```

- [ ] **Step 2: Add `SchoolClassroomSummary`.** Immediately after the `ClassroomSummary` interface (around line 800), add:

```typescript
/** Resolved classroom row for the school-admin read-only rollup. */
export interface SchoolClassroomSummary {
  /** Classroom document id */
  id: string;
  /** Classroom display name */
  name: string;
  /** Owning teacher's display name */
  teacherName: string;
  /** Number of enrolled students */
  studentCount: number;
}
```

- [ ] **Step 3: Rebuild shared-types.**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: build succeeds, no TS errors.

- [ ] **Step 4: Verify api still typechecks.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors (the new optional field + new interface don't break anything yet).

- [ ] **Step 5: Commit.**

```bash
git add packages/shared-types/src/index.ts
git commit -F - <<'EOF'
feat(shared-types): add classroom schoolId + SchoolClassroomSummary

Denormalized schoolId on ClassroomDocument (ADR-008 hybrid tenancy) and the
SchoolClassroomSummary row for the school-admin classroom rollup (4b).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `createClassroom` stamps `schoolId`

**Files:**
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts:60-114` (`createClassroom`)
- Modify: `apps/api/src/modules/classrooms/classrooms.controller.ts:52-66` (`createClassroom` handler)
- Test: `apps/api/src/modules/classrooms/classrooms.service.spec.ts` (createClassroom describe block)

- [ ] **Step 1: Write the failing tests.** In `classrooms.service.spec.ts`, inside the `describe('createClassroom', ...)` block, add two tests. (The existing happy-path test calls `service.createClassroom(teacherId, 'Math 101')` — it will need the new optional arg; leave it, the arg is optional.)

```typescript
    it('stamps schoolId on the created classroom when provided', async () => {
      const created = await service.createClassroom(teacherId, 'Math 101', 'school-7');
      expect(created.schoolId).toBe('school-7');
      // The persisted document carries schoolId too.
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school-7' }),
      );
    });

    it('omits schoolId for a B2C teacher (no schoolId arg)', async () => {
      const created = await service.createClassroom(teacherId, 'Math 101');
      expect(created.schoolId).toBeUndefined();
      expect(mockSet).toHaveBeenCalledWith(
        expect.not.objectContaining({ schoolId: expect.anything() }),
      );
    });
```

- [ ] **Step 2: Run the tests to verify they fail.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: FAIL — the two new tests fail (schoolId is `undefined` / always absent because the param doesn't exist yet). TypeScript may also complain about the 3rd argument.

- [ ] **Step 3: Add the `schoolId` parameter to the service.** Edit `createClassroom` in `classrooms.service.ts`:

```typescript
  /**
   * Create a new classroom for a teacher.
   * Generates a unique 6-character join code.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param name - Classroom name (moderated)
   * @param schoolId - Owning school tenant id; stamped on the doc when present (school teachers), omitted for B2C.
   * @returns Created classroom document
   */
  async createClassroom(
    teacherId: string,
    name: string,
    schoolId?: string,
  ): Promise<ClassroomDocument> {
```

Then in the document construction, add `schoolId` conditionally (Firestore rejects `undefined` values, so spread it only when present):

```typescript
    const now = new Date().toISOString();
    const classroom: ClassroomDocument = {
      id: docRef.id,
      teacherId,
      name,
      joinCode,
      studentIds: [],
      maxStudents: DEFAULT_MAX_STUDENTS,
      createdAt: now,
      ...(schoolId ? { schoolId } : {}),
    };
```

- [ ] **Step 4: Thread `user.schoolId` from the controller.** Edit the `createClassroom` handler in `classrooms.controller.ts`:

```typescript
    return this.classroomsService.createClassroom(user.uid, dto.name, user.schoolId);
```

- [ ] **Step 5: Run tests to verify they pass.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: PASS (all createClassroom tests green, including the pre-existing one).

- [ ] **Step 6: Typecheck.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit.**

```bash
git add apps/api/src/modules/classrooms/classrooms.service.ts apps/api/src/modules/classrooms/classrooms.controller.ts apps/api/src/modules/classrooms/classrooms.service.spec.ts
git commit -F - <<'EOF'
feat(classrooms): stamp schoolId on classroom creation

A teacher with a schoolId claim creates classrooms owned by that school
(denormalized, ADR-008). B2C teachers' classrooms stay schoolId-less.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: `assignStudents` — teacher roster assignment

**Files:**
- Create: `apps/api/src/modules/classrooms/dto/assign-students.dto.ts`
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts` (new `assignStudents` method)
- Modify: `apps/api/src/modules/classrooms/classrooms.controller.ts` (new `POST :id/students` handler + import)
- Test: `apps/api/src/modules/classrooms/classrooms.service.spec.ts`, `classrooms.controller.spec.ts`

> **Capacity arithmetic note (deviation from spec §5 step 3, applied intentionally):** the spec says `studentIds.length + current ≤ maxStudents`, but already-enrolled students consume no new seat. We dedupe first and enforce `current + netNew.length ≤ maxStudents`. This is the correct arithmetic and avoids a false `CLASSROOM_FULL` when a teacher re-submits a list containing already-enrolled students. The dedupe is also required by spec §5 step 4. Document this in the method JSDoc.

- [ ] **Step 1: Create the DTO.** `apps/api/src/modules/classrooms/dto/assign-students.dto.ts`:

```typescript
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

/**
 * DTO for assigning students to a classroom from the school roster.
 * CLAUDE.md Rule 10: input validated via class-validator.
 */
export class AssignStudentsDto {
  /** Student (child) UIDs to add; non-empty, each a string. */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  studentIds!: string[];
}
```

- [ ] **Step 2: Write the failing service tests.** In `classrooms.service.spec.ts`, add a new top-level describe (place it after the createClassroom block). Note the mock plumbing: `mockFirebaseService.firestore.collection().doc().get()` resolves `mockGet`; `mockUsersRepository.findByUid` resolves user docs; `mockFirebaseService.firestore.batch()` returns a batch with `update`/`commit`. The existing `mockGet` returns the classroom; we set per-test return values.

```typescript
  /* ── assignStudents ──────────────────────────────────────────────── */
  describe('assignStudents', () => {
    const schoolClassroom = {
      id: classroomId,
      teacherId,
      name: 'Math 101',
      joinCode: 'ABC123',
      schoolId: 'school-7',
      studentIds: ['existing-1'],
      maxStudents: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const childInSchool = (uid: string) => ({
      uid,
      role: 'child',
      schoolId: 'school-7',
      active: true,
      displayName: 'Kid',
    });

    it('adds same-school active children and returns the updated doc', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid
        .mockResolvedValueOnce(childInSchool('new-1'))
        .mockResolvedValueOnce(childInSchool('new-2'));
      const batchUpdate = jest.fn();
      const batchCommit = jest.fn().mockResolvedValue(undefined);
      mockFirebaseService.firestore.batch.mockReturnValueOnce({ update: batchUpdate, commit: batchCommit });

      const result = await service.assignStudents(teacherId, classroomId, ['new-1', 'new-2']);

      expect(result.studentIds).toEqual(['existing-1', 'new-1', 'new-2']);
      // class doc + one update per new student = 3 batch updates.
      expect(batchUpdate).toHaveBeenCalledTimes(3);
      expect(batchCommit).toHaveBeenCalledTimes(1);
    });

    it('dedupes students already enrolled', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce(childInSchool('new-1'));
      const batchUpdate = jest.fn();
      const batchCommit = jest.fn().mockResolvedValue(undefined);
      mockFirebaseService.firestore.batch.mockReturnValueOnce({ update: batchUpdate, commit: batchCommit });

      const result = await service.assignStudents(teacherId, classroomId, ['existing-1', 'new-1']);

      expect(result.studentIds).toEqual(['existing-1', 'new-1']);
      // class doc + only the one net-new student = 2 updates (existing-1 skipped).
      expect(batchUpdate).toHaveBeenCalledTimes(2);
    });

    it('rejects a non-owner teacher (ForbiddenException)', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ ...schoolClassroom, teacherId: 'someone-else' }) });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toThrow(ForbiddenException);
    });

    it('rejects a B2C classroom with NOT_A_SCHOOL_CLASSROOM', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ ...schoolClassroom, schoolId: undefined }) });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'NOT_A_SCHOOL_CLASSROOM' },
      });
    });

    it('rejects a student from another school with STUDENT_NOT_IN_SCHOOL', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ ...childInSchool('new-1'), schoolId: 'other-school' });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'STUDENT_NOT_IN_SCHOOL' },
      });
    });

    it('rejects a non-child / inactive user with STUDENT_NOT_IN_SCHOOL', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ ...childInSchool('new-1'), active: false });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'STUDENT_NOT_IN_SCHOOL' },
      });
    });

    it('enforces maxStudents with CLASSROOM_FULL (net-new count)', async () => {
      // maxStudents 3, one existing → only 2 net-new seats. Three net-new overflows.
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid
        .mockResolvedValueOnce(childInSchool('n1'))
        .mockResolvedValueOnce(childInSchool('n2'))
        .mockResolvedValueOnce(childInSchool('n3'));
      await expect(service.assignStudents(teacherId, classroomId, ['n1', 'n2', 'n3'])).rejects.toMatchObject({
        response: { code: 'CLASSROOM_FULL' },
      });
    });
  });
```

- [ ] **Step 3: Run the service tests to verify they fail.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: FAIL — `service.assignStudents is not a function`.

- [ ] **Step 4: Implement `assignStudents`.** Add to `classrooms.service.ts` (after `joinClassroom`, before `removeStudent`). Reuse the private `getOwnedClassroom` for the ownership + existence check:

```typescript
  /**
   * Assign school-roster students to a teacher's own classroom.
   * Validates every student up front (all-or-nothing), then writes the class
   * studentIds and each student's classroomIds in a single atomic batch.
   * Capacity is enforced on the NET-NEW count (already-enrolled students are
   * deduped and consume no seat).
   *
   * @param teacherId - Caller (must own the classroom).
   * @param classroomId - Target classroom (must have a schoolId).
   * @param studentIds - Candidate student UIDs.
   * @returns The updated classroom document.
   * @throws ForbiddenException when the caller does not own the classroom.
   * @throws NotFoundException when the classroom does not exist.
   * @throws BadRequestException NOT_A_SCHOOL_CLASSROOM / STUDENT_NOT_IN_SCHOOL / CLASSROOM_FULL.
   */
  async assignStudents(
    teacherId: string,
    classroomId: string,
    studentIds: string[],
  ): Promise<ClassroomDocument> {
    const classroom = await this.getOwnedClassroom(teacherId, classroomId);

    if (!classroom.schoolId) {
      throw new BadRequestException({
        message: 'This classroom is not a school classroom',
        code: 'NOT_A_SCHOOL_CLASSROOM',
      });
    }

    /* Net-new only: dedupe against current roster, preserving order. */
    const enrolled = new Set(classroom.studentIds);
    const netNew = [...new Set(studentIds)].filter((id) => !enrolled.has(id));

    /* Validate every net-new student belongs to this school, is a child, and is active. */
    for (const studentId of netNew) {
      const student = await this.usersRepository.findByUid(studentId);
      if (
        !student ||
        student.role !== 'child' ||
        (student.active ?? true) === false ||
        student.schoolId !== classroom.schoolId
      ) {
        throw new BadRequestException({
          message: `Student ${studentId} is not an active child of this school`,
          code: 'STUDENT_NOT_IN_SCHOOL',
        });
      }
    }

    /* Capacity check on net-new seats. */
    if (classroom.studentIds.length + netNew.length > classroom.maxStudents) {
      throw new BadRequestException({
        message: 'Classroom is full',
        code: 'CLASSROOM_FULL',
      });
    }

    /* Atomic write: class roster + each student's classroomIds. */
    if (netNew.length > 0) {
      const { FieldValue } = await import('firebase-admin/firestore');
      const batch = this.firebase.firestore.batch();

      const classRef = this.firebase.firestore.collection(this.collectionName).doc(classroomId);
      batch.update(classRef, { studentIds: FieldValue.arrayUnion(...netNew) });

      for (const studentId of netNew) {
        const userRef = this.firebase.firestore.collection('users').doc(studentId);
        batch.update(userRef, { classroomIds: FieldValue.arrayUnion(classroomId) });
      }

      await batch.commit();
    }

    this.logger.log({
      event: 'students_assigned',
      teacherId,
      classroomId,
      added: netNew.length,
    });

    return { ...classroom, studentIds: [...classroom.studentIds, ...netNew] };
  }
```

- [ ] **Step 5: Run service tests to verify they pass.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: PASS (all assignStudents tests green).

- [ ] **Step 6: Add the controller route + write its test.** First the controller — in `classrooms.controller.ts`, import the DTO and add the handler. **Placement matters:** put `POST :id/students` anywhere among the POST handlers (it won't collide with `POST join` or `POST ()`), but keep it grouped logically near the other `:id` routes. Add the import near the other DTO imports:

```typescript
import { AssignStudentsDto } from './dto/assign-students.dto';
```

Add the handler (e.g. after `joinClassroom`):

```typescript
  /**
   * Assign school-roster students to a classroom the teacher owns.
   *
   * @param user - Authenticated teacher
   * @param id - Classroom document ID
   * @param dto - Student UIDs to add
   * @returns The updated classroom document
   */
  @Post(':id/students')
  @Roles('teacher')
  @HttpCode(HttpStatus.OK)
  async assignStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignStudentsDto,
  ) {
    return this.classroomsService.assignStudents(user.uid, id, dto.studentIds);
  }
```

Then in `classrooms.controller.spec.ts` add (mirror the existing service-mock pattern in that file — check its `mockService` object and add `assignStudents: jest.fn()` to it):

```typescript
  it('assignStudents delegates uid + id + studentIds', async () => {
    mockClassroomsService.assignStudents.mockResolvedValueOnce({ id: 'c1', studentIds: ['s1'] });
    const user = { uid: 'teacher-1', email: 't@s.edu', role: 'teacher', schoolId: 'school-7' } as AuthenticatedUser;
    const res = await controller.assignStudents(user, 'c1', { studentIds: ['s1'] });
    expect(res).toEqual({ id: 'c1', studentIds: ['s1'] });
    expect(mockClassroomsService.assignStudents).toHaveBeenCalledWith('teacher-1', 'c1', ['s1']);
  });
```

> Read `classrooms.controller.spec.ts` first to match its exact mock-service variable name and `AuthenticatedUser` import. Add `assignStudents` (and later `getSchoolRoster`) to its mock-service object.

- [ ] **Step 7: Run the controller tests.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.controller.spec`
Expected: PASS.

- [ ] **Step 8: Typecheck.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 9: Commit.**

```bash
git add apps/api/src/modules/classrooms/dto/assign-students.dto.ts apps/api/src/modules/classrooms/classrooms.service.ts apps/api/src/modules/classrooms/classrooms.controller.ts apps/api/src/modules/classrooms/classrooms.service.spec.ts apps/api/src/modules/classrooms/classrooms.controller.spec.ts
git commit -F - <<'EOF'
feat(classrooms): teacher roster assignment (POST :id/students)

Same-school + ownership + active-child + maxStudents enforced; atomic batch
writes class roster and each student's classroomIds; already-enrolled deduped.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `getSchoolRoster` — teacher roster source

**Files:**
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts` (new `getSchoolRoster`)
- Modify: `apps/api/src/modules/classrooms/classrooms.controller.ts` (new `GET roster` — **declared before `GET :id`**)
- Test: `classrooms.service.spec.ts`, `classrooms.controller.spec.ts`

- [ ] **Step 1: Write the failing service tests.** In `classrooms.service.spec.ts`:

```typescript
  /* ── getSchoolRoster ─────────────────────────────────────────────── */
  describe('getSchoolRoster', () => {
    it('returns the school active students as summaries', async () => {
      mockUsersRepository.findStudentsBySchool = jest.fn().mockResolvedValueOnce([
        { uid: 's1', username: 'kid1', displayName: 'Kid One', active: true },
        { uid: 's2', username: 'kid2', displayName: 'Kid Two', active: false },
        { uid: 's3', username: 'kid3', displayName: 'Kid Three' },
      ]);
      const res = await service.getSchoolRoster('school-7');
      // inactive s2 filtered out; s3 (active undefined) defaults to active.
      expect(res.map((s) => s.uid)).toEqual(['s1', 's3']);
      expect(res[0]).toEqual({ uid: 's1', username: 'kid1', displayName: 'Kid One', active: true });
    });

    it('returns an empty list for a school-less (B2C) teacher', async () => {
      const res = await service.getSchoolRoster(undefined);
      expect(res).toEqual([]);
    });
  });
```

> If `mockUsersRepository` in this spec doesn't yet have `findStudentsBySchool`, the test assigns it inline as above; alternatively add it to the top-level `mockUsersRepository` object. Match whichever pattern the file already uses.

- [ ] **Step 2: Run to verify failure.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: FAIL — `service.getSchoolRoster is not a function`.

- [ ] **Step 3: Implement `getSchoolRoster`.** Add to `classrooms.service.ts`. Import the type at the top (extend the existing `import type { ... }` block):

```typescript
import type {
  ClassroomDocument,
  ClassroomSummary,
  ClassroomDetailView,
  StudentProgressSummary,
  SchoolStudentSummary,
} from '@eureka-lab/shared-types';
```

Method:

```typescript
  /**
   * List the active students of a teacher's school for the assignment picker.
   * Returns an empty list when the teacher has no school (B2C).
   *
   * @param schoolId - Caller-teacher's school id (from their token claim), or undefined.
   * @returns Active student summaries of that school.
   */
  async getSchoolRoster(schoolId: string | undefined): Promise<SchoolStudentSummary[]> {
    if (!schoolId) {
      return [];
    }
    const docs = await this.usersRepository.findStudentsBySchool(schoolId);
    return docs
      .filter((d) => (d.active ?? true) !== false)
      .map((d) => ({
        uid: d.uid,
        username: d.username ?? '',
        displayName: d.displayName,
        active: d.active ?? true,
      }));
  }
```

- [ ] **Step 4: Run service tests to verify pass.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: PASS.

- [ ] **Step 5: Add the controller route — BEFORE `GET :id`.** In `classrooms.controller.ts`, add this handler **above** the existing `@Get(':id')` `getClassroomDetail` handler so `:id` doesn't capture `roster`:

```typescript
  /**
   * List the caller-teacher's school roster (active students) for assignment.
   *
   * @param user - Authenticated teacher
   * @returns Active student summaries of the teacher's school (empty for B2C).
   */
  @Get('roster')
  @Roles('teacher')
  async getRoster(@CurrentUser() user: AuthenticatedUser) {
    return { students: await this.classroomsService.getSchoolRoster(user.schoolId) };
  }
```

- [ ] **Step 6: Add the controller test.** In `classrooms.controller.spec.ts` (add `getSchoolRoster: jest.fn()` to the mock-service object):

```typescript
  it('getRoster returns the school roster for the caller-teacher', async () => {
    mockClassroomsService.getSchoolRoster.mockResolvedValueOnce([{ uid: 's1', username: 'k', displayName: 'K', active: true }]);
    const user = { uid: 'teacher-1', email: 't@s.edu', role: 'teacher', schoolId: 'school-7' } as AuthenticatedUser;
    const res = await controller.getRoster(user);
    expect(res).toEqual({ students: [{ uid: 's1', username: 'k', displayName: 'K', active: true }] });
    expect(mockClassroomsService.getSchoolRoster).toHaveBeenCalledWith('school-7');
  });
```

- [ ] **Step 7: Run controller tests + full classrooms suite + typecheck.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms`
Expected: PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit.**

```bash
git add apps/api/src/modules/classrooms/classrooms.service.ts apps/api/src/modules/classrooms/classrooms.controller.ts apps/api/src/modules/classrooms/classrooms.service.spec.ts apps/api/src/modules/classrooms/classrooms.controller.spec.ts
git commit -F - <<'EOF'
feat(classrooms): GET /classrooms/roster for the assignment picker

Returns the caller-teacher's school active students; empty for B2C. Route
declared before :id to avoid param capture.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: Harden `joinClassroom` — same-school only

**Files:**
- Modify: `apps/api/src/modules/classrooms/classrooms.service.ts:172-227` (`joinClassroom`)
- Test: `classrooms.service.spec.ts` (joinClassroom describe block)

> The current `joinClassroom(studentId, joinCode)` only knows the studentId. To compare the child's `schoolId` to the classroom's, the service must load the joining child's user doc. We add that lookup inside `joinClassroom` (the controller signature is unchanged — still passes `user.uid`).

- [ ] **Step 1: Write the failing tests.** In `classrooms.service.spec.ts`, inside (or adding) the `describe('joinClassroom', ...)` block:

```typescript
  describe('joinClassroom tenancy', () => {
    const baseClass = {
      id: classroomId,
      teacherId,
      name: 'Math 101',
      joinCode: 'ABC123',
      studentIds: [],
      maxStudents: 30,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    /** Make the join-code lookup resolve to the given classroom doc. */
    const stubCodeLookup = (classroom: Record<string, unknown>) => {
      mockWhere.mockReturnValueOnce({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false, docs: [{ data: () => classroom }] }),
        }),
      });
    };

    it('rejects a cross-school child with CROSS_SCHOOL_JOIN', async () => {
      stubCodeLookup({ ...baseClass, schoolId: 'school-7' });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-x', role: 'child', schoolId: 'other-school' });
      await expect(service.joinClassroom('child-x', 'ABC123')).rejects.toMatchObject({
        response: { code: 'CROSS_SCHOOL_JOIN' },
      });
    });

    it('lets a same-school child join a school classroom', async () => {
      stubCodeLookup({ ...baseClass, schoolId: 'school-7' });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-y', role: 'child', schoolId: 'school-7' });
      const res = await service.joinClassroom('child-y', 'ABC123');
      expect(res.studentIds).toContain('child-y');
    });

    it('leaves B2C self-join unaffected (no schoolId on class)', async () => {
      stubCodeLookup({ ...baseClass });
      // No user-doc lookup needed for a B2C class, but tolerate one.
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-z', role: 'child' });
      const res = await service.joinClassroom('child-z', 'ABC123');
      expect(res.studentIds).toContain('child-z');
    });
  });
```

> Verify the existing join tests' lookup-stub style and reuse it; the `stubCodeLookup` helper mirrors the `mockWhere(...).limit(...).get()` chain used by `joinClassroom`. If the file already stubs this differently, align the helper to it.

- [ ] **Step 2: Run to verify failure.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: FAIL — cross-school join currently succeeds (no `CROSS_SCHOOL_JOIN` thrown).

- [ ] **Step 3: Add the tenant check in `joinClassroom`.** In `classrooms.service.ts`, after the classroom is loaded and before/after the "already a member" check, add the same-school guard. Insert right after `const classroom = doc.data() as ClassroomDocument;`:

```typescript
    /* Tenant safety: a school classroom may only be joined by its own students. */
    if (classroom.schoolId) {
      const student = await this.usersRepository.findByUid(studentId);
      if (!student || student.schoolId !== classroom.schoolId) {
        throw new ForbiddenException({
          message: 'You cannot join a classroom from another school',
          code: 'CROSS_SCHOOL_JOIN',
        });
      }
    }
```

(`ForbiddenException` is already imported in this file.)

- [ ] **Step 4: Run tests to verify pass.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand classrooms.service.spec`
Expected: PASS.

- [ ] **Step 5: Typecheck.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit.**

```bash
git add apps/api/src/modules/classrooms/classrooms.service.ts apps/api/src/modules/classrooms/classrooms.service.spec.ts
git commit -F - <<'EOF'
feat(classrooms): harden join-by-code to same-school (CROSS_SCHOOL_JOIN)

A classroom carrying a schoolId may only be joined by a child of that school;
B2C classrooms (no schoolId) self-join unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: School-admin rollup — `GET /schools/:id/classrooms`

**Files:**
- Create: `apps/api/src/modules/schools/school-classrooms.service.ts`
- Create: `apps/api/src/modules/schools/school-classrooms.controller.ts`
- Create: `apps/api/src/modules/schools/school-classrooms.service.spec.ts`
- Create: `apps/api/src/modules/schools/school-classrooms.controller.spec.ts`
- Modify: `apps/api/src/modules/schools/schools.module.ts`

- [ ] **Step 1: Write the failing service spec.** `apps/api/src/modules/schools/school-classrooms.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolClassroomsService } from './school-classrooms.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockWhereGet = jest.fn();
const mockFirebaseService = {
  firestore: {
    collection: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ get: mockWhereGet }),
    }),
  },
};
const mockUsersRepository = { findByUid: jest.fn() };

describe('SchoolClassroomsService', () => {
  let service: SchoolClassroomsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolClassroomsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();
    service = moduleRef.get(SchoolClassroomsService);
  });

  it('resolves teacher names + student counts scoped to the school', async () => {
    mockWhereGet.mockResolvedValueOnce({
      docs: [
        { data: () => ({ id: 'c1', name: 'Math', teacherId: 't1', studentIds: ['a', 'b'], schoolId: 'school-7' }) },
        { data: () => ({ id: 'c2', name: 'Art', teacherId: 't2', studentIds: [], schoolId: 'school-7' }) },
      ],
    });
    mockUsersRepository.findByUid
      .mockResolvedValueOnce({ uid: 't1', displayName: 'Ms. Ada' })
      .mockResolvedValueOnce({ uid: 't2', displayName: 'Mr. Boole' });

    const res = await service.listSchoolClassrooms('school-7');
    expect(res).toEqual([
      { id: 'c1', name: 'Math', teacherName: 'Ms. Ada', studentCount: 2 },
      { id: 'c2', name: 'Art', teacherName: 'Mr. Boole', studentCount: 0 },
    ]);
  });

  it('falls back to a placeholder when the teacher doc is missing', async () => {
    mockWhereGet.mockResolvedValueOnce({
      docs: [{ data: () => ({ id: 'c1', name: 'Math', teacherId: 't-gone', studentIds: ['a'], schoolId: 'school-7' }) }],
    });
    mockUsersRepository.findByUid.mockResolvedValueOnce(null);
    const res = await service.listSchoolClassrooms('school-7');
    expect(res[0].teacherName).toBe('Unknown teacher');
    expect(res[0].studentCount).toBe(1);
  });

  it('returns an empty list when the school has no classrooms', async () => {
    mockWhereGet.mockResolvedValueOnce({ docs: [] });
    const res = await service.listSchoolClassrooms('school-7');
    expect(res).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand school-classrooms.service.spec`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the service.** `apps/api/src/modules/schools/school-classrooms.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import type { ClassroomDocument, SchoolClassroomSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Read-only rollup of a school's classrooms for the school-admin console.
 * Scoped by the denormalized classrooms.schoolId (ADR-008), resolving each
 * classroom's owning teacher name and current student count.
 */
@Injectable()
export class SchoolClassroomsService {
  private readonly logger = new Logger(SchoolClassroomsService.name);
  private readonly collectionName = 'classrooms';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * List all classrooms owned by a school as resolved summaries.
   * @param schoolId - School tenant id.
   * @returns Classroom summaries (name, teacher name, student count).
   */
  async listSchoolClassrooms(schoolId: string): Promise<SchoolClassroomSummary[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('schoolId', '==', schoolId)
      .get();

    const classrooms = snapshot.docs.map((d) => d.data() as ClassroomDocument);

    return Promise.all(
      classrooms.map(async (c) => {
        const teacher = await this.usersRepository.findByUid(c.teacherId);
        return {
          id: c.id,
          name: c.name,
          teacherName: teacher?.displayName ?? 'Unknown teacher',
          studentCount: c.studentIds.length,
        };
      }),
    );
  }
}
```

- [ ] **Step 4: Run service spec to verify pass.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand school-classrooms.service.spec`
Expected: PASS.

- [ ] **Step 5: Write the failing controller spec.** `apps/api/src/modules/schools/school-classrooms.controller.spec.ts` (three guards overridden, mirroring `school-students.controller.spec.ts`):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolClassroomsController } from './school-classrooms.controller';
import { SchoolClassroomsService } from './school-classrooms.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = { listSchoolClassrooms: jest.fn() };
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolClassroomsController', () => {
  let controller: SchoolClassroomsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolClassroomsController],
      providers: [{ provide: SchoolClassroomsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolClassroomsController);
  });

  it('list returns the classrooms rollup payload', async () => {
    const rows = [{ id: 'c1', name: 'Math', teacherName: 'Ms. Ada', studentCount: 2 }];
    mockService.listSchoolClassrooms.mockResolvedValueOnce(rows);
    expect(await controller.list('school-7')).toEqual({ classrooms: rows });
    expect(mockService.listSchoolClassrooms).toHaveBeenCalledWith('school-7');
  });
});
```

- [ ] **Step 6: Run to verify failure.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand school-classrooms.controller.spec`
Expected: FAIL — controller does not exist.

- [ ] **Step 7: Implement the controller.** `apps/api/src/modules/schools/school-classrooms.controller.ts` (mirror `SchoolStudentsController`):

```typescript
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolClassroomsService } from './school-classrooms.service';

/**
 * School-admin read-only classroom rollup, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/classrooms.
 */
@Controller('schools/:id/classrooms')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolClassroomsController {
  constructor(private readonly classroomsService: SchoolClassroomsService) {}

  /**
   * List this school's classrooms as resolved summaries.
   * @param id - School id.
   * @returns { classrooms } rollup payload.
   */
  @Get()
  async list(@Param('id') id: string) {
    return { classrooms: await this.classroomsService.listSchoolClassrooms(id) };
  }
}
```

- [ ] **Step 8: Register in the module.** Edit `schools.module.ts` — add imports and entries:

```typescript
import { SchoolClassroomsController } from './school-classrooms.controller';
import { SchoolClassroomsService } from './school-classrooms.service';
```

```typescript
  controllers: [SchoolsController, SchoolTeachersController, SchoolStudentsController, SchoolClassroomsController],
  providers: [SchoolsService, SchoolsRepository, SchoolTeachersService, SchoolStudentsService, SchoolClassroomsService],
```

(`UsersModule` is already imported by `SchoolsModule`, so `UsersRepository` is injectable.)

- [ ] **Step 9: Run the schools suite + typecheck.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand schools`
Expected: PASS (incl. the two new specs).
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 10: Commit.**

```bash
git add apps/api/src/modules/schools/school-classrooms.service.ts apps/api/src/modules/schools/school-classrooms.controller.ts apps/api/src/modules/schools/school-classrooms.service.spec.ts apps/api/src/modules/schools/school-classrooms.controller.spec.ts apps/api/src/modules/schools/schools.module.ts
git commit -F - <<'EOF'
feat(schools): GET /schools/:id/classrooms rollup (read-only)

School-admin/super-admin read-only rollup of a school's classrooms resolved to
teacher name + student count, scoped by classrooms.schoolId behind TenantGuard.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Frontend API client — roster, assign, rollup

**Files:**
- Modify: `apps/web/src/lib/api-client.ts` (`classroomsApi`, `schoolsApi`, type import)

- [ ] **Step 1: Import `SchoolClassroomSummary`.** In the `import type { ... } from '@eureka-lab/shared-types'` block at the top, add `SchoolClassroomSummary` (next to `SchoolStudentSummary`).

- [ ] **Step 2: Extend `classroomsApi`.** Add inside the `classroomsApi` object (after `regenerateCode`):

```typescript
  /** List the caller-teacher's school roster (active students) for the picker. */
  getRoster: () =>
    request<{ students: SchoolStudentSummary[] }>('/classrooms/roster'),

  /** Assign school-roster students to a classroom the teacher owns. */
  assignStudents: (classroomId: string, studentIds: string[]) =>
    request<ClassroomDocument>(`/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    }),
```

> `SchoolStudentSummary` is already imported in this file (used by `schoolsApi`). Confirm it's in the import block; it is.

- [ ] **Step 3: Extend `schoolsApi`.** Add inside the `schoolsApi` object (after `setStudentActive`):

```typescript
  /** List a school's classrooms (read-only rollup). */
  listClassrooms: (schoolId: string) =>
    request<{ classrooms: SchoolClassroomSummary[] }>(`/schools/${schoolId}/classrooms`),
```

- [ ] **Step 4: Typecheck (count must stay 24).**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: 24.

- [ ] **Step 5: Lint.**

Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 6: Commit.**

```bash
git add apps/web/src/lib/api-client.ts
git commit -F - <<'EOF'
feat(web): api-client roster/assign/classroom-rollup methods (4b)

classroomsApi.getRoster + assignStudents and schoolsApi.listClassrooms.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 8: Frontend — teacher "Add students" picker

**Files:**
- Create: `apps/web/src/components/features/teacher/AddStudentsDialog.tsx`
- Modify: `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx`

> i18n keys used here (`Teacher` namespace) are added in Task 10. Reference them now; the smoke/lint will pass because next-intl renders the key string if missing, and Task 10 lands before the smoke. (Add Task 10 keys before user smoke.)

- [ ] **Step 1: Create the dialog.** `apps/web/src/components/features/teacher/AddStudentsDialog.tsx` — mirrors `AddStudentDialog` styling (inline error, overlay, `bg-card`), but is a multi-select checkbox list fed by the roster, excluding already-enrolled students:

```typescript
'use client';

import { useState, useEffect, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { classroomsApi } from '@/lib/api-client';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface AddStudentsDialogProps {
  open: boolean;
  classroomId: string;
  /** UIDs already enrolled — excluded from the pick list. */
  enrolledIds: string[];
  onClose: () => void;
  /** Called after a successful assignment so the parent can refetch. */
  onAssigned: () => void;
}

/**
 * Roster picker: lists the school's active students (minus those already in the
 * class) as checkboxes; submitting assigns the selected UIDs to the classroom.
 * Inline error; closes on success. Sonner is broken app-wide — feedback is inline.
 */
export const AddStudentsDialog: FC<AddStudentsDialogProps> = ({ open, classroomId, enrolledIds, onClose, onAssigned }) => {
  const t = useTranslations('Teacher');
  const [roster, setRoster] = useState<SchoolStudentSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    setSelected(new Set());
    classroomsApi
      .getRoster()
      .then((res) => {
        if (active) setRoster(res.students.filter((s) => !enrolledIds.includes(s.uid)));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : t('assignFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, enrolledIds, t]);

  if (!open) return null;

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await classroomsApi.assignStudents(classroomId, [...selected]);
      onAssigned();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('assignFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addStudents')}>
        <h2 className="text-xl font-bold text-foreground">{t('addStudents')}</h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
        ) : roster.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('noRosterStudents')}</p>
        ) : (
          <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto">
            {roster.map((s) => (
              <li key={s.uid}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-background">
                  <input type="checkbox" checked={selected.has(s.uid)} onChange={() => toggle(s.uid)} />
                  <span className="text-sm text-foreground">{s.displayName}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{s.username}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t('cancel')}</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || selected.size === 0}>
            {submitting ? t('assigning') : t('assignSelected', { count: selected.size })}
          </Button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Wire it into the class-detail page.** In `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx`:

Add imports near the top:

```typescript
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AddStudentsDialog } from '@/components/features/teacher/AddStudentsDialog';
```

(Keep the existing `lucide-react` import — merge `Plus` into it: `import { ArrowLeft, RefreshCw, Trash2, Plus } from 'lucide-react';`.)

Inside the component, add auth + dialog state (after the existing `useState` hooks):

```typescript
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
```

Render an **Add students** button next to the student-count header — shown only for school teachers (`user?.schoolId`). Replace the existing student-count block:

```tsx
      {/* Student count + add (school teachers only) */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {t('studentCount')}: {detail.students.length}/{detail.classroom.maxStudents}
        </h2>
        {user?.schoolId && (
          <GameButton variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addStudents')}
          </GameButton>
        )}
      </div>
```

Add the dialog near the end of the returned JSX (before the closing `</div>` of the page root):

```tsx
      <AddStudentsDialog
        open={addOpen}
        classroomId={classroomId}
        enrolledIds={detail.classroom.studentIds}
        onClose={() => setAddOpen(false)}
        onAssigned={fetchDetail}
      />
```

- [ ] **Step 3: Typecheck (24) + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: 24.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 4: Commit.**

```bash
git add "apps/web/src/components/features/teacher/AddStudentsDialog.tsx" "apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx"
git commit -F - <<'EOF'
feat(web): teacher Add-students roster picker (school teachers only)

Class-detail gains an Add-students dialog that lists the school roster
(minus already-enrolled) and assigns the selected students. Shown only when
the teacher has a schoolId.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 9: Frontend — `/school` read-only Classrooms tab

**Files:**
- Create: `apps/web/src/components/features/school/ClassroomsTable.tsx`
- Create: `apps/web/src/components/features/school/ClassroomsPanel.tsx`
- Modify: `apps/web/src/app/(dashboard)/school/page.tsx`

- [ ] **Step 1: Create the table.** `apps/web/src/components/features/school/ClassroomsTable.tsx` (mirror `StudentsTable`, read-only — no action column):

```typescript
'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolClassroomSummary } from '@eureka-lab/shared-types';

interface ClassroomsTableProps {
  classrooms: SchoolClassroomSummary[];
}

/** Read-only school classroom rollup: name · teacher · #students. */
export const ClassroomsTable: FC<ClassroomsTableProps> = ({ classrooms }) => {
  const t = useTranslations('SchoolClassrooms');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('teacher')}</th>
            <th className="px-4 py-3 text-right">{t('students')}</th>
          </tr>
        </thead>
        <tbody>
          {classrooms.map((c) => (
            <tr key={c.id} className="border-t border-border/40">
              <td className="px-4 py-3 text-foreground">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.teacherName}</td>
              <td className="px-4 py-3 text-right text-foreground">{c.studentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 2: Create the panel.** `apps/web/src/components/features/school/ClassroomsPanel.tsx` (mirror `StudentsPanel`'s fetch/loading/empty pattern):

```typescript
'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { ClassroomsTable } from './ClassroomsTable';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolClassroomSummary } from '@eureka-lab/shared-types';

interface ClassroomsPanelProps {
  schoolId: string;
}

/** Read-only classrooms rollup panel for the /school console. */
export const ClassroomsPanel: FC<ClassroomsPanelProps> = ({ schoolId }) => {
  const t = useTranslations('SchoolClassrooms');
  const [classrooms, setClassrooms] = useState<SchoolClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await schoolsApi.listClassrooms(schoolId);
      setClassrooms(res.classrooms);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return (
    <div className="space-y-6">
      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : classrooms.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noClassrooms')}</p></div>
      ) : (
        <ClassroomsTable classrooms={classrooms} />
      )}
    </div>
  );
};
```

- [ ] **Step 3: Add the third tab to the school page.** In `apps/web/src/app/(dashboard)/school/page.tsx`:

Add the import:

```typescript
import { ClassroomsPanel } from '@/components/features/school/ClassroomsPanel';
```

Add the namespace hook near `const ts = useTranslations('SchoolStudents');`:

```typescript
  const tc = useTranslations('SchoolClassrooms');
```

Widen the tab state type:

```typescript
  const [tab, setTab] = useState<'teachers' | 'students' | 'classrooms'>('teachers');
```

Update the heading expression to cover the new tab:

```tsx
        <h1 className="font-display text-3xl text-glow-primary">{tab === 'teachers' ? t('title') : tab === 'students' ? ts('title') : tc('title')}</h1>
```

Add the third tab button inside the `role="tablist"` container, after the students tab button:

```tsx
        <button
          role="tab"
          id="tab-classrooms"
          aria-selected={tab === 'classrooms'}
          aria-controls="panel-classrooms"
          onClick={() => setTab('classrooms')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'classrooms' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {tc('tab')}
        </button>
```

Add the tab panel after the students `tabpanel` block:

```tsx
      {tab === 'classrooms' && (
        <div role="tabpanel" id="panel-classrooms" aria-labelledby="tab-classrooms">
          <ClassroomsPanel schoolId={schoolId} />
        </div>
      )}
```

- [ ] **Step 4: Typecheck (24) + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: 24.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 5: Commit.**

```bash
git add apps/web/src/components/features/school/ClassroomsTable.tsx apps/web/src/components/features/school/ClassroomsPanel.tsx "apps/web/src/app/(dashboard)/school/page.tsx"
git commit -F - <<'EOF'
feat(web): /school read-only Classrooms rollup tab

Third tab on the school-admin console listing classrooms (name · teacher ·
#students) via GET /schools/:id/classrooms, with ARIA tab semantics matching
the existing tabs.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 10: i18n — `SchoolClassrooms` namespace + `Teacher` keys (en/fr/ar)

**Files:**
- Modify: `apps/web/src/messages/en.json`, `fr.json`, `ar.json`

> Add a new `SchoolClassrooms` namespace and a handful of new `Teacher` keys used by the picker. `assignSelected` uses an ICU count placeholder.

- [ ] **Step 1: en.json — add `Teacher` keys.** Inside the existing `"Teacher"` object, add:

```json
    "addStudents": "Add Students",
    "assignSelected": "Add {count} selected",
    "assigning": "Adding…",
    "assignFailed": "Could not add students. Please try again.",
    "noRosterStudents": "No more students to add from your school roster."
```

- [ ] **Step 2: en.json — add the `SchoolClassrooms` namespace.** Add a new top-level namespace (e.g. after `"SchoolStudents"`):

```json
  "SchoolClassrooms": {
    "title": "Classrooms",
    "tab": "Classrooms",
    "name": "Classroom",
    "teacher": "Teacher",
    "students": "Students",
    "loading": "Loading…",
    "noClassrooms": "No classrooms yet. Teachers create classrooms and add students from the roster.",
    "actionFailed": "Action failed. Please try again."
  },
```

- [ ] **Step 3: fr.json — same keys, French.** Add to `"Teacher"`:

```json
    "addStudents": "Ajouter des élèves",
    "assignSelected": "Ajouter {count} sélectionné(s)",
    "assigning": "Ajout…",
    "assignFailed": "Impossible d'ajouter les élèves. Veuillez réessayer.",
    "noRosterStudents": "Aucun autre élève à ajouter depuis la liste de votre école."
```

Add the namespace:

```json
  "SchoolClassrooms": {
    "title": "Classes",
    "tab": "Classes",
    "name": "Classe",
    "teacher": "Enseignant",
    "students": "Élèves",
    "loading": "Chargement…",
    "noClassrooms": "Aucune classe pour l'instant. Les enseignants créent des classes et ajoutent des élèves depuis la liste.",
    "actionFailed": "Échec de l'action. Veuillez réessayer."
  },
```

- [ ] **Step 4: ar.json — same keys, Arabic.** Add to `"Teacher"`:

```json
    "addStudents": "إضافة طلاب",
    "assignSelected": "إضافة {count} محدد",
    "assigning": "جارٍ الإضافة…",
    "assignFailed": "تعذّرت إضافة الطلاب. يرجى المحاولة مرة أخرى.",
    "noRosterStudents": "لا يوجد طلاب آخرون لإضافتهم من قائمة مدرستك."
```

Add the namespace:

```json
  "SchoolClassrooms": {
    "title": "الفصول",
    "tab": "الفصول",
    "name": "الفصل",
    "teacher": "المعلّم",
    "students": "الطلاب",
    "loading": "جارٍ التحميل…",
    "noClassrooms": "لا توجد فصول بعد. ينشئ المعلّمون الفصول ويضيفون الطلاب من القائمة.",
    "actionFailed": "فشل الإجراء. يرجى المحاولة مرة أخرى."
  },
```

- [ ] **Step 5: Validate all three locale files parse.**

Run: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`
Expected: `en OK` / `fr OK` / `ar OK` (no JSON parse error — watch for trailing-comma mistakes).

- [ ] **Step 6: Typecheck (24) + lint.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: 24.
Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.

- [ ] **Step 7: Commit.**

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/fr.json apps/web/src/messages/ar.json
git commit -F - <<'EOF'
feat(web): i18n SchoolClassrooms namespace + Teacher add-students keys (en/fr/ar)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 11: Verification, coverage & ROADMAP

**Files:**
- Modify: `ROADMAP.md` (Stream 6 sub-project-4b row → DONE)

- [ ] **Step 1: Full api suite green.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all suites pass (35 prior + the new school-classrooms specs; ≥ 343 tests).

- [ ] **Step 2: Coverage ≥80% lines on the two touched modules.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand --coverage --collectCoverageFrom='src/modules/classrooms/**/*.ts' --collectCoverageFrom='src/modules/schools/**/*.ts'`
Expected: classrooms + schools modules ≥ 80% lines. If a new method is under-covered, add the missing-branch test and amend the relevant task's commit.

- [ ] **Step 3: api typecheck.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: web lint + typecheck.**

Run: `pnpm --filter @eureka-lab/web lint` → Expected: clean.
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → Expected: 24.

- [ ] **Step 5: Flip the ROADMAP row.** In `ROADMAP.md` Stream 6, change the sub-project-4b row status from its current "NOT WRITTEN"/planned marker to **DONE** (match the format of the 4a row directly above it — include this branch/PR once known; leave the PR number to be filled at push time).

- [ ] **Step 6: Commit.**

```bash
git add ROADMAP.md
git commit -F - <<'EOF'
docs(roadmap): mark B2B sub-project 4b (classroom rollup) DONE

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

- [ ] **Step 7: Hand off for smoke + finishing.** Do NOT push. Use `superpowers:finishing-a-development-branch` and hand the user a short smoke brief:
  1. As a **school teacher**, open a class → **Add students** lists the school roster (already-enrolled excluded) → select + add → students appear; count rises.
  2. As a **B2C teacher** (no schoolId), the **Add students** button is absent.
  3. As a **school admin**, `/school` → **Classrooms** tab lists classrooms with teacher names + counts.
  4. **Cross-school join blocked:** a child of school A entering a school-B class join code gets a same-school rejection; a B2C class code still works.

  The user pushes via **option 2 (push + PR, base `feat/school-student-enrollment`)** only on explicit approval.

---

## Self-Review (against the spec)

**Spec coverage:**
- §4 `ClassroomDocument.schoolId` + `SchoolClassroomSummary` → Task 1. ✓
- §5 `POST /classrooms/:id/students` (owner, NOT_A_SCHOOL_CLASSROOM, STUDENT_NOT_IN_SCHOOL, CLASSROOM_FULL, dedupe, arrayUnion on class + users) → Task 3. ✓
- §5 `GET /classrooms/roster` (active students, empty for B2C) → Task 4. ✓
- §5 `GET /schools/:id/classrooms` (3 guards, teacher name + count) → Task 6. ✓
- §5 `POST /classrooms/join` hardened (CROSS_SCHOOL_JOIN; B2C unchanged) → Task 5. ✓
- §5 `POST /classrooms` stamps schoolId → Task 2. ✓
- §6 teacher Add-students picker (school teachers only) → Task 8; `/school` Classrooms tab → Task 9; api-client methods → Task 7; `SchoolClassrooms` i18n → Task 10. ✓
- §7 error codes (NOT_A_SCHOOL_CLASSROOM/STUDENT_NOT_IN_SCHOOL/CLASSROOM_FULL/CROSS_SCHOOL_JOIN) → Tasks 3, 5. ✓
- §8 testing (all listed backend cases) → Tasks 2–6; frontend lint/tsc(24)/smoke → Tasks 7–11. ✓
- §9 DoD (rebuilt shared-types, guarded+tested endpoints, picker + tab, i18n×3, api 0/green/≥80%, web lint/tsc 24, ROADMAP DONE) → Tasks 1–11. ✓

**Placeholder scan:** every code step contains full code; commands have expected output. No TBD/TODO. ✓

**Type consistency:** `SchoolClassroomSummary { id, name, teacherName, studentCount }` is consistent across Task 1 (def), Task 6 (service/controller), Task 7 (api-client), Task 9 (table/panel). `assignStudents(teacherId, classroomId, studentIds)`, `getSchoolRoster(schoolId?)`, `listSchoolClassrooms(schoolId)`, `createClassroom(teacherId, name, schoolId?)` are consistent across their definition and call sites. Error codes match the spec's table verbatim. ✓

**Intentional deviation (flagged):** capacity check uses net-new count, not raw `studentIds.length` (spec §5 step 3) — documented in Task 3's note + method JSDoc; it is the correct arithmetic and required by the dedupe rule (§5 step 4).
