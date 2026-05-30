# Super-Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Core super-admin console — a `/admin` schools table and `/admin/schools/[id]` detail page where a platform super-admin can create/list/suspend schools, edit seat limits, and create/list school admins — backed by two new `super_admin`-guarded endpoints.

**Architecture:** Extends the existing `schools` NestJS module with `PATCH /schools/:id` (status + seat-limit) and `GET /schools/:id/admins` (resolve admin uids → summaries). The frontend adds a reusable `RoleGate`, a `schoolsApi` typed client, an `Admin` i18n namespace, and React pages/components that mirror the teacher dashboard (custom-overlay dialogs with **inline** error feedback — the app-wide Sonner toast is broken, see ROADMAP Stream 4).

**Tech Stack:** NestJS + Firebase Admin (backend, Jest), Next.js 14.2 App Router + next-intl + Tailwind v4 (frontend). Backend is TDD; frontend verified via lint + tsc + a user-driven smoke (no autonomous Playwright).

**Spec:** [super-admin console](../specs/2026-05-30-school-tenancy-superadmin-console-design.md) · **Epic:** [epic](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)

**Branch:** `feat/school-superadmin-console` (already created off `feat/school-tenancy`).

---

## Pre-flight (run once before Task 1)

- [ ] `git branch --show-current` → `feat/school-superadmin-console`
- [ ] Baseline green:
  - `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
  - `pnpm --filter @eureka-lab/api exec jest --runInBand` → **30 suites / 288 tests pass**
  - `pnpm --filter @eureka-lab/web lint` → clean
  - `pnpm --filter @eureka-lab/web exec tsc --noEmit` → 24 pre-existing test-file errors (record the count)

> **Conventions for the executor:**
> - API tests: `pnpm --filter @eureka-lab/api exec jest --runInBand` (NOT `test -- --runInBand` — the double `--` is forwarded to jest and breaks it). Single suite: append the path, e.g. `… exec jest --runInBand src/modules/schools/schools.service.spec.ts`.
> - After editing `packages/shared-types`, rebuild: `pnpm --filter @eureka-lab/shared-types build`.
> - Commit footer every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task.
> - Dynamic-route `params` are **synchronous** in Next 14.2 (`params.id`).
> - Feedback in UI is **inline** (local state), never `toast()` — Sonner does not render in this build.

---

## File Structure

**Backend — modify**
- `packages/shared-types/src/index.ts` — add `SchoolAdminSummary`.
- `apps/api/src/modules/schools/dto/update-school.dto.ts` — new `UpdateSchoolDto`.
- `apps/api/src/modules/schools/schools.repository.ts` — add `updateSchool`.
- `apps/api/src/modules/schools/schools.service.ts` — add `updateSchool`, `listSchoolAdmins`.
- `apps/api/src/modules/schools/schools.controller.ts` — add `PATCH :id`, `GET :id/admins`.
- `apps/api/src/modules/schools/schools.{repository,service,controller}.spec.ts` — extend.

**Frontend — create/modify**
- `apps/web/src/lib/api-client.ts` — add `schoolsApi` + type imports.
- `apps/web/src/components/auth/RoleGate.tsx` — new.
- `apps/web/src/components/features/admin/SchoolStatusBadge.tsx` — new.
- `apps/web/src/components/features/admin/SchoolsTable.tsx` — new.
- `apps/web/src/components/features/admin/CreateSchoolDialog.tsx` — new.
- `apps/web/src/components/features/admin/CreateSchoolAdminDialog.tsx` — new.
- `apps/web/src/components/features/admin/EditSeatLimitDialog.tsx` — new.
- `apps/web/src/app/(dashboard)/admin/page.tsx` — replace placeholder with the table page.
- `apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx` — new detail page.
- `apps/web/src/messages/{en,fr,ar}.json` — add `Admin` namespace.

**Docs**
- `ROADMAP.md` — Stream 6 sub-project 2 status.

---

## Task 1: Shared type — `SchoolAdminSummary`

**Files:** Modify `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add the type.** Directly after the `SchoolSummary` interface, add:

```ts
/** Resolved school-admin row for the console (no secrets) */
export interface SchoolAdminSummary {
  uid: string;
  email: string;
  displayName: string;
}
```

- [ ] **Step 2: Build.**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: exits 0.

- [ ] **Step 3: Commit.**

```bash
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): SchoolAdminSummary for console admin list"
```

---

## Task 2: `SchoolsRepository.updateSchool` (TDD)

**Files:** Modify `apps/api/src/modules/schools/schools.repository.ts` + `.spec.ts`

- [ ] **Step 1: Add the failing test.** Append inside the `describe('SchoolsRepository', …)` block in `schools.repository.spec.ts`:

```ts
  it('updateSchool updates only the provided fields', async () => {
    await repo.updateSchool('school-1', { status: 'suspended', seatLimit: 25 });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'suspended', seatLimit: 25 });
  });
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: FAIL — `updateSchool` is not a function.

- [ ] **Step 3: Implement.** In `schools.repository.ts`, add this method after `createSchool` (above `findById`):

```ts
  /**
   * Update mutable school fields (status / seatLimit).
   * @param id - School id.
   * @param partial - Subset of mutable fields to write.
   */
  async updateSchool(
    id: string,
    partial: Partial<Pick<School, 'status' | 'seatLimit'>>,
  ): Promise<void> {
    await this.firebase.firestore.collection(this.collection).doc(id).update(partial);
  }
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.repository.ts apps/api/src/modules/schools/schools.repository.spec.ts
git commit -m "feat(schools): repository updateSchool (status/seatLimit)"
```

---

## Task 3: `UpdateSchoolDto`

**Files:** Create `apps/api/src/modules/schools/dto/update-school.dto.ts`

- [ ] **Step 1: Create the DTO.**

```ts
import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';

/** Request body for PATCH /schools/:id (super_admin only). All fields optional. */
export class UpdateSchoolDto {
  /** New lifecycle status */
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  /** New seat (license) limit */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  seatLimit?: number;
}
```

- [ ] **Step 2: Type-check.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit.**

```bash
git add apps/api/src/modules/schools/dto/update-school.dto.ts
git commit -m "feat(schools): UpdateSchoolDto"
```

---

## Task 4: `SchoolsService.updateSchool` + `listSchoolAdmins` (TDD)

**Files:** Modify `apps/api/src/modules/schools/schools.service.ts` + `.spec.ts`

- [ ] **Step 1: Add failing tests.** Append these two `describe` blocks inside the top-level `describe('SchoolsService', …)` in `schools.service.spec.ts` (after the existing `getSchool / listSchools` block):

```ts
  describe('updateSchool', () => {
    it('throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.updateSchool('nope', { status: 'suspended' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('writes only provided fields and returns the merged school', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 'school-1', name: 'A', status: 'active', seatLimit: 100, seatsUsed: 3,
        adminUids: [], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
      });
      (mockRepo as { updateSchool?: jest.Mock }).updateSchool = jest.fn().mockResolvedValue(undefined);
      const result = await service.updateSchool('school-1', { seatLimit: 25 });
      expect((mockRepo as { updateSchool: jest.Mock }).updateSchool).toHaveBeenCalledWith('school-1', { seatLimit: 25 });
      expect(result.seatLimit).toBe(25);
      expect(result.status).toBe('active');
    });
  });

  describe('listSchoolAdmins', () => {
    it('throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.listSchoolAdmins('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolves adminUids to summaries and skips missing users', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 'school-1', name: 'A', status: 'active', seatLimit: 1, seatsUsed: 0,
        adminUids: ['u-1', 'gone'], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
      });
      mockUsersRepo.findByUid
        .mockResolvedValueOnce({ uid: 'u-1', email: 'a@s.edu', displayName: 'Admin One' })
        .mockResolvedValueOnce(null);
      const result = await service.listSchoolAdmins('school-1');
      expect(result).toEqual([{ uid: 'u-1', email: 'a@s.edu', displayName: 'Admin One' }]);
    });
  });
```

Also extend the `mockUsersRepo` near the top of the file to include `findByUid`:

```ts
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn() };
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.service.spec.ts`
Expected: FAIL — `updateSchool` / `listSchoolAdmins` not functions.

- [ ] **Step 3: Implement.** In `schools.service.ts`:

3a. Add `SchoolAdminSummary` to the shared-types import:
```ts
import type { School, SchoolSummary, SchoolAdminSummary } from '@eureka-lab/shared-types';
```

3b. Import the new DTO at the top with the others:
```ts
import { UpdateSchoolDto } from './dto/update-school.dto';
```

3c. Add both methods after `getSchool` (before `listSchools`):

```ts
  /**
   * Update a school's mutable fields (status and/or seatLimit).
   * @param id - School id.
   * @param dto - Partial update.
   * @returns The updated school.
   * @throws NotFoundException when missing.
   */
  async updateSchool(id: string, dto: UpdateSchoolDto): Promise<School> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const partial: Partial<Pick<School, 'status' | 'seatLimit'>> = {};
    if (dto.status !== undefined) partial.status = dto.status;
    if (dto.seatLimit !== undefined) partial.seatLimit = dto.seatLimit;
    await this.repo.updateSchool(id, partial);
    this.logger.log({ event: 'school_updated', schoolId: id, fields: Object.keys(partial) });
    return { ...school, ...partial };
  }

  /**
   * Resolve a school's adminUids to summaries (uid/email/displayName).
   * Skips uids that no longer resolve to a user.
   * @param id - School id.
   * @returns Array of admin summaries.
   * @throws NotFoundException when the school is missing.
   */
  async listSchoolAdmins(id: string): Promise<SchoolAdminSummary[]> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const admins: SchoolAdminSummary[] = [];
    for (const uid of school.adminUids) {
      const user = await this.usersRepository.findByUid(uid);
      if (user) {
        admins.push({ uid: user.uid, email: user.email, displayName: user.displayName });
      }
    }
    return admins;
  }
```

- [ ] **Step 4: Run — expect PASS.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.service.spec.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.service.ts apps/api/src/modules/schools/schools.service.spec.ts
git commit -m "feat(schools): service updateSchool + listSchoolAdmins"
```

---

## Task 5: Controller endpoints `PATCH /:id` + `GET /:id/admins` (TDD)

**Files:** Modify `apps/api/src/modules/schools/schools.controller.ts` + `.spec.ts`

- [ ] **Step 1: Add failing tests.** In `schools.controller.spec.ts`, extend `mockService` with the two new methods:

```ts
const mockService = {
  createSchool: jest.fn(),
  listSchools: jest.fn(),
  getSchool: jest.fn(),
  mintSchoolAdmin: jest.fn(),
  updateSchool: jest.fn(),
  listSchoolAdmins: jest.fn(),
};
```

Then append inside `describe('SchoolsController', …)`:

```ts
  it('updateSchool delegates id + dto', async () => {
    mockService.updateSchool.mockResolvedValueOnce({ id: 's1', status: 'suspended' });
    const result = await controller.updateSchool('s1', { status: 'suspended' });
    expect(mockService.updateSchool).toHaveBeenCalledWith('s1', { status: 'suspended' });
    expect(result).toEqual({ id: 's1', status: 'suspended' });
  });

  it('listSchoolAdmins wraps results in an { admins } envelope', async () => {
    mockService.listSchoolAdmins.mockResolvedValueOnce([{ uid: 'u1', email: 'a@s.edu', displayName: 'A' }]);
    const result = await controller.listSchoolAdmins('s1');
    expect(mockService.listSchoolAdmins).toHaveBeenCalledWith('s1');
    expect(result).toEqual({ admins: [{ uid: 'u1', email: 'a@s.edu', displayName: 'A' }] });
  });
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.controller.spec.ts`
Expected: FAIL — `controller.updateSchool` / `listSchoolAdmins` not functions.

- [ ] **Step 3: Implement.** In `schools.controller.ts`:

3a. Add `Patch` to the `@nestjs/common` import and import the DTO:
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
```
```ts
import { UpdateSchoolDto } from './dto/update-school.dto';
```

3b. Add the two handlers after `getSchool` (before `createSchoolAdmin`):

```ts
  /**
   * Update a school's status and/or seat limit.
   * @param id - School id.
   * @param dto - Partial update.
   * @returns The updated school.
   */
  @Patch(':id')
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.updateSchool(id, dto);
  }

  /**
   * List a school's admins (resolved summaries).
   * @param id - School id.
   * @returns { admins }.
   */
  @Get(':id/admins')
  async listSchoolAdmins(@Param('id') id: string) {
    return { admins: await this.schoolsService.listSchoolAdmins(id) };
  }
```

- [ ] **Step 4: Run — expect PASS, then full api suite.**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.controller.spec.ts`
Expected: PASS (6 tests).
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all green (30 suites, +6 new tests over baseline → 294).

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/modules/schools/schools.controller.ts apps/api/src/modules/schools/schools.controller.spec.ts
git commit -m "feat(schools): PATCH /schools/:id + GET /schools/:id/admins"
```

---

## Task 6: `schoolsApi` typed client

**Files:** Modify `apps/web/src/lib/api-client.ts`

- [ ] **Step 1: Add the type imports.** In the big `import type { … } from '@eureka-lab/shared-types';` block at the top, add `School`, `SchoolSummary`, `SchoolAdminSummary` (place near the other additions):

```ts
  School,
  SchoolSummary,
  SchoolAdminSummary,
```

- [ ] **Step 2: Add the API object.** Append at the end of the file (after the last `…Api` export):

```ts
/* ── Schools API (super-admin console) ─────────────────────────── */

/** Super-admin school/tenant management endpoints (all require super_admin). */
export const schoolsApi = {
  /** List all schools as summaries. */
  list: () => request<{ schools: SchoolSummary[] }>('/schools'),

  /** Get one school (full doc, incl. read-only subscription/secret). */
  get: (id: string) => request<School>(`/schools/${id}`),

  /** Create a school tenant. */
  create: (body: { name: string; seatLimit: number; subscriptionTier?: string }) =>
    request<School>('/schools', { method: 'POST', body: JSON.stringify(body) }),

  /** Update status and/or seat limit. */
  update: (id: string, body: { status?: 'active' | 'suspended'; seatLimit?: number }) =>
    request<School>(`/schools/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  /** List a school's admins (resolved summaries). */
  listAdmins: (id: string) =>
    request<{ admins: SchoolAdminSummary[] }>(`/schools/${id}/admins`),

  /** Mint a school admin (super-admin sets the temp password). */
  createAdmin: (id: string, body: { email: string; displayName: string; password: string }) =>
    request<{ uid: string; email: string; displayName: string; role: string; schoolId: string }>(
      `/schools/${id}/admins`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
```

- [ ] **Step 3: Type-check.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24` (unchanged — no new errors).

- [ ] **Step 4: Commit.**

```bash
git add apps/web/src/lib/api-client.ts
git commit -m "feat(web): schoolsApi typed client"
```

---

## Task 7: `RoleGate` access component

**Files:** Create `apps/web/src/components/auth/RoleGate.tsx`

- [ ] **Step 1: Create the component.**

```tsx
'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole, type UserRoleString } from '@/lib/auth-redirects';

interface RoleGateProps {
  /** Roles permitted to view the children */
  allow: UserRoleString[];
  /** Protected content */
  children: ReactNode;
}

/**
 * Client-side role gate. Renders children only for users whose role is in
 * `allow`; anyone else is redirected to their own home (`homeForRole`).
 *
 * Assumes it sits inside a layout that already handles the anonymous case
 * (the `(dashboard)` layout bounces unauthenticated users to `/`). The
 * redirect runs in an effect — never during render (repo rule).
 *
 * @param allow - Allowed roles.
 * @param children - Protected content.
 */
export function RoleGate({ allow, children }: RoleGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role;
  const permitted = !!role && allow.includes(role);

  useEffect(() => {
    if (!isLoading && role && !permitted) {
      router.replace(homeForRole(role));
    }
  }, [isLoading, role, permitted, router]);

  if (isLoading || !permitted) return null;
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

- [ ] **Step 3: Commit.**

```bash
git add apps/web/src/components/auth/RoleGate.tsx
git commit -m "feat(web): RoleGate client-side role access component"
```

---

## Task 8: `Admin` i18n namespace (en/fr/ar)

**Files:** Modify `apps/web/src/messages/en.json`, `fr.json`, `ar.json`

- [ ] **Step 1: Insert the `Admin` namespace** as a sibling of `Teacher`. In each file, find the line `  "Teacher": {` and insert the matching block immediately **before** it.

**en.json:**
```json
  "Admin": {
    "schoolsTitle": "Schools",
    "newSchool": "New School",
    "schoolName": "School Name",
    "seats": "Seats",
    "status": "Status",
    "active": "Active",
    "suspended": "Suspended",
    "noSchools": "No schools yet. Click \"New School\" to create the first tenant.",
    "loading": "Loading…",
    "createSchool": "Create School",
    "seatLimit": "Seat Limit",
    "subscriptionTier": "Subscription Tier",
    "creating": "Creating…",
    "cancel": "Cancel",
    "save": "Save",
    "saving": "Saving…",
    "backToSchools": "Back to schools",
    "subscription": "Subscription",
    "enrollmentSecret": "Enrollment Secret",
    "admins": "Admins",
    "addAdmin": "Add Admin",
    "email": "Email",
    "displayName": "Display Name",
    "tempPassword": "Temporary Password",
    "noAdmins": "No admins yet. Add the first one.",
    "editLimit": "Edit Limit",
    "suspendSchool": "Suspend",
    "reactivateSchool": "Reactivate",
    "suspendConfirm": "Suspend this school? Its members lose access until reactivated.",
    "reactivateConfirm": "Reactivate this school?",
    "adminCreatedTitle": "Admin created — share these credentials now",
    "adminCreatedNote": "This password is shown once. Copy it before closing.",
    "done": "Done",
    "actionFailed": "Action failed. Please try again."
  },
```

**fr.json:**
```json
  "Admin": {
    "schoolsTitle": "Écoles",
    "newSchool": "Nouvelle école",
    "schoolName": "Nom de l'école",
    "seats": "Places",
    "status": "Statut",
    "active": "Active",
    "suspended": "Suspendue",
    "noSchools": "Aucune école pour le moment. Cliquez sur « Nouvelle école » pour créer le premier locataire.",
    "loading": "Chargement…",
    "createSchool": "Créer l'école",
    "seatLimit": "Limite de places",
    "subscriptionTier": "Forfait d'abonnement",
    "creating": "Création…",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "saving": "Enregistrement…",
    "backToSchools": "Retour aux écoles",
    "subscription": "Abonnement",
    "enrollmentSecret": "Clé d'inscription",
    "admins": "Administrateurs",
    "addAdmin": "Ajouter un administrateur",
    "email": "E-mail",
    "displayName": "Nom affiché",
    "tempPassword": "Mot de passe temporaire",
    "noAdmins": "Aucun administrateur pour le moment. Ajoutez le premier.",
    "editLimit": "Modifier la limite",
    "suspendSchool": "Suspendre",
    "reactivateSchool": "Réactiver",
    "suspendConfirm": "Suspendre cette école ? Ses membres perdent l'accès jusqu'à réactivation.",
    "reactivateConfirm": "Réactiver cette école ?",
    "adminCreatedTitle": "Administrateur créé — partagez ces identifiants maintenant",
    "adminCreatedNote": "Ce mot de passe n'est affiché qu'une fois. Copiez-le avant de fermer.",
    "done": "Terminé",
    "actionFailed": "L'action a échoué. Veuillez réessayer."
  },
```

**ar.json:**
```json
  "Admin": {
    "schoolsTitle": "المدارس",
    "newSchool": "مدرسة جديدة",
    "schoolName": "اسم المدرسة",
    "seats": "المقاعد",
    "status": "الحالة",
    "active": "نشطة",
    "suspended": "موقوفة",
    "noSchools": "لا توجد مدارس بعد. انقر على «مدرسة جديدة» لإنشاء أول مستأجر.",
    "loading": "جارٍ التحميل…",
    "createSchool": "إنشاء مدرسة",
    "seatLimit": "حد المقاعد",
    "subscriptionTier": "خطة الاشتراك",
    "creating": "جارٍ الإنشاء…",
    "cancel": "إلغاء",
    "save": "حفظ",
    "saving": "جارٍ الحفظ…",
    "backToSchools": "العودة إلى المدارس",
    "subscription": "الاشتراك",
    "enrollmentSecret": "مفتاح التسجيل",
    "admins": "المسؤولون",
    "addAdmin": "إضافة مسؤول",
    "email": "البريد الإلكتروني",
    "displayName": "الاسم المعروض",
    "tempPassword": "كلمة مرور مؤقتة",
    "noAdmins": "لا يوجد مسؤولون بعد. أضف الأول.",
    "editLimit": "تعديل الحد",
    "suspendSchool": "إيقاف",
    "reactivateSchool": "إعادة تفعيل",
    "suspendConfirm": "إيقاف هذه المدرسة؟ سيفقد أعضاؤها الوصول حتى إعادة التفعيل.",
    "reactivateConfirm": "إعادة تفعيل هذه المدرسة؟",
    "adminCreatedTitle": "تم إنشاء المسؤول — شارك بيانات الدخول الآن",
    "adminCreatedNote": "تُعرض كلمة المرور هذه مرة واحدة. انسخها قبل الإغلاق.",
    "done": "تم",
    "actionFailed": "فشل الإجراء. حاول مرة أخرى."
  },
```

- [ ] **Step 2: Validate JSON.**

Run: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`
Expected: `en OK` / `fr OK` / `ar OK` (no parse error).

- [ ] **Step 3: Commit.**

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/fr.json apps/web/src/messages/ar.json
git commit -m "feat(web): Admin i18n namespace (en/fr/ar)"
```

---

## Task 9: Admin feature components (badge, table, dialogs)

**Files:** Create the five components under `apps/web/src/components/features/admin/`.

- [ ] **Step 1: `SchoolStatusBadge.tsx`.**

```tsx
'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolStatus } from '@eureka-lab/shared-types';

/**
 * Coloured pill for a school's lifecycle status.
 * @param status - 'active' | 'suspended'.
 */
export const SchoolStatusBadge: FC<{ status: SchoolStatus }> = ({ status }) => {
  const t = useTranslations('Admin');
  const active = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
      {active ? t('active') : t('suspended')}
    </span>
  );
};
```

- [ ] **Step 2: `SchoolsTable.tsx`.**

```tsx
'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolSummary } from '@eureka-lab/shared-types';
import { SchoolStatusBadge } from './SchoolStatusBadge';

interface SchoolsTableProps {
  schools: SchoolSummary[];
  onRowClick: (id: string) => void;
}

/**
 * Schools list table. Each row is keyboard-activatable and navigates to detail.
 * @param schools - Rows to render.
 * @param onRowClick - Called with a school id on row activation.
 */
export const SchoolsTable: FC<SchoolsTableProps> = ({ schools, onRowClick }) => {
  const t = useTranslations('Admin');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('schoolName')}</th>
            <th className="px-4 py-3">{t('seats')}</th>
            <th className="px-4 py-3">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
            <tr
              key={s.id}
              tabIndex={0}
              role="button"
              onClick={() => onRowClick(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(s.id);
                }
              }}
              className="cursor-pointer border-t border-border/40 hover:bg-white/5 focus:bg-white/5 focus:outline-none"
            >
              <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.seatsUsed}/{s.seatLimit}
              </td>
              <td className="px-4 py-3">
                <SchoolStatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 3: `CreateSchoolDialog.tsx`** (mirrors `CreateClassroomDialog`; inline error).

```tsx
'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateSchoolDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; seatLimit: number; subscriptionTier?: string }) => Promise<void>;
}

/**
 * Modal for creating a school tenant. Inline error feedback (Sonner is broken
 * app-wide). Clears + closes on success.
 */
export const CreateSchoolDialog: FC<CreateSchoolDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
  const [name, setName] = useState('');
  const [seatLimit, setSeatLimit] = useState('30');
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const seats = Number(seatLimit);
    if (name.trim().length < 2 || !Number.isInteger(seats) || seats < 0) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), seatLimit: seats, ...(tier.trim() && { subscriptionTier: tier.trim() }) });
      setName('');
      setSeatLimit('30');
      setTier('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('createSchool')}
      >
        <h2 className="text-xl font-bold text-foreground">{t('createSchool')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="school-name" className="block text-sm font-medium text-foreground">{t('schoolName')}</label>
            <input id="school-name" type="text" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="seat-limit" className="block text-sm font-medium text-foreground">{t('seatLimit')}</label>
            <input id="seat-limit" type="number" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} min={0} max={100000} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="sub-tier" className="block text-sm font-medium text-foreground">{t('subscriptionTier')}</label>
            <input id="sub-tier" type="text" value={tier} onChange={(e) => setTier(e.target.value)} maxLength={50} placeholder="trial"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || name.trim().length < 2}>{loading ? t('creating') : t('createSchool')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: `CreateSchoolAdminDialog.tsx`** (shows credentials once on success).

```tsx
'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateSchoolAdminDialogProps {
  open: boolean;
  onClose: () => void;
  /** Resolves when the admin is created; rejects (with message) on failure. */
  onSubmit: (values: { email: string; displayName: string; password: string }) => Promise<void>;
}

/**
 * Modal for minting a school admin. The super-admin types a temporary
 * password; on success the dialog shows the email + password once (no email
 * is sent) before the operator closes it.
 */
export const CreateSchoolAdminDialog: FC<CreateSchoolAdminDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
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
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('addAdmin')}
      >
        {created ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{t('adminCreatedTitle')}</h2>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p><span className="text-muted-foreground">{t('email')}: </span><span className="font-mono">{created.email}</span></p>
              <p><span className="text-muted-foreground">{t('tempPassword')}: </span><span className="font-mono">{created.password}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminCreatedNote')}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={handleClose}>{t('done')}</Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground">{t('addAdmin')}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-foreground">{t('email')}</label>
                <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="admin-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
                <input id="admin-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="admin-pass" className="block text-sm font-medium text-foreground">{t('tempPassword')}</label>
                <input id="admin-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
                <Button type="submit" disabled={loading || password.length < 8}>{loading ? t('creating') : t('addAdmin')}</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: `EditSeatLimitDialog.tsx`.**

```tsx
'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface EditSeatLimitDialogProps {
  open: boolean;
  current: number;
  onClose: () => void;
  onSubmit: (seatLimit: number) => Promise<void>;
}

/** Modal to edit a school's seat limit. Inline error. */
export const EditSeatLimitDialog: FC<EditSeatLimitDialogProps> = ({ open, current, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
  const [value, setValue] = useState(String(current));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const seats = Number(value);
    if (!Number.isInteger(seats) || seats < 0) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(seats);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('editLimit')}>
        <h2 className="text-xl font-bold text-foreground">{t('editLimit')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-seats" className="block text-sm font-medium text-foreground">{t('seatLimit')}</label>
            <input id="edit-seats" type="number" value={value} onChange={(e) => setValue(e.target.value)} min={0} max={100000} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('saving') : t('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Type-check + commit.**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `24`.

```bash
git add apps/web/src/components/features/admin
git commit -m "feat(web): admin console components (table, status badge, dialogs)"
```

---

## Task 10: `/admin` schools table page

**Files:** Modify `apps/web/src/app/(dashboard)/admin/page.tsx` (replace placeholder)

- [ ] **Step 1: Replace the placeholder page.**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { GameButton } from '@/components/game/GameButton';
import { SchoolsTable } from '@/components/features/admin/SchoolsTable';
import { CreateSchoolDialog } from '@/components/features/admin/CreateSchoolDialog';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** Super-admin schools list. Gated to super_admin via RoleGate. */
function AdminSchoolsInner() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const res = await schoolsApi.list();
      setSchools(res.schools);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleCreate = async (values: { name: string; seatLimit: number; subscriptionTier?: string }) => {
    await schoolsApi.create(values);
    await fetchSchools();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{t('schoolsTitle')}</h1>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('newSchool')}
        </GameButton>
      </div>

      {error && (
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : schools.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noSchools')}</p></div>
      ) : (
        <SchoolsTable schools={schools} onRowClick={(id) => router.push(`/admin/schools/${id}`)} />
      )}

      <CreateSchoolDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

/** Page wrapper applying the super_admin role gate. */
export default function AdminSchoolsPage() {
  return (
    <RoleGate allow={['super_admin']}>
      <AdminSchoolsInner />
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
git add "apps/web/src/app/(dashboard)/admin/page.tsx"
git commit -m "feat(web): /admin schools table page (RoleGate + create)"
```

---

## Task 11: `/admin/schools/[id]` detail page

**Files:** Create `apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx`

- [ ] **Step 1: Create the detail page.**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { GameButton } from '@/components/game/GameButton';
import { SchoolStatusBadge } from '@/components/features/admin/SchoolStatusBadge';
import { CreateSchoolAdminDialog } from '@/components/features/admin/CreateSchoolAdminDialog';
import { EditSeatLimitDialog } from '@/components/features/admin/EditSeatLimitDialog';
import { schoolsApi } from '@/lib/api-client';
import type { School, SchoolAdminSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** Detail view for one school. Gated to super_admin. */
function SchoolDetailInner({ id }: { id: string }) {
  const t = useTranslations('Admin');
  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<SchoolAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([schoolsApi.get(id), schoolsApi.listAdmins(id)]);
      setSchool(s);
      setAdmins(a.admins);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load school');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleStatus = async () => {
    if (!school) return;
    const next = school.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = next === 'suspended' ? t('suspendConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setError('');
    try {
      await schoolsApi.update(id, { status: next });
      await fetchAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleSeatLimit = async (seatLimit: number) => {
    await schoolsApi.update(id, { seatLimit });
    await fetchAll();
  };

  const handleCreateAdmin = async (values: { email: string; displayName: string; password: string }) => {
    await schoolsApi.createAdmin(id, values);
    await fetchAll();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>;
  }
  if (!school) {
    return <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error || 'Not found'}</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToSchools')}
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl text-glow-primary">{school.name}</h1>
          <SchoolStatusBadge status={school.status} />
        </div>
        <GameButton variant={school.status === 'active' ? 'danger' : 'ghost'} size="sm" onClick={toggleStatus} disabled={busy}>
          {school.status === 'active' ? t('suspendSchool') : t('reactivateSchool')}
        </GameButton>
      </div>

      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('seats')}</span>
          <span className="flex items-center gap-3">
            <span className="font-medium text-foreground">{school.seatsUsed} / {school.seatLimit}</span>
            <button onClick={() => setSeatOpen(true)} className="text-sm text-primary hover:underline">{t('editLimit')}</button>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('subscription')}</span>
          <span className="font-medium text-foreground">{school.subscription.tier} · {school.subscription.status}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t('enrollmentSecret')}</span>
          <span className="font-mono text-xs text-muted-foreground break-all">{school.secretKeys.enrollmentSecret}</span>
        </div>
      </div>

      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">{t('admins')}</h2>
          <GameButton variant="primary" size="sm" onClick={() => setAdminOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addAdmin')}
          </GameButton>
        </div>
        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noAdmins')}</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {admins.map((a) => (
              <li key={a.uid} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-muted-foreground">{a.email}</span>
                <span className="text-foreground">{a.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateSchoolAdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} onSubmit={handleCreateAdmin} />
      <EditSeatLimitDialog open={seatOpen} current={school.seatLimit} onClose={() => setSeatOpen(false)} onSubmit={handleSeatLimit} />
    </div>
  );
}

/** Page wrapper: synchronous params (Next 14.2) + super_admin gate. */
export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGate allow={['super_admin']}>
      <SchoolDetailInner id={params.id} />
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
git add "apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx"
git commit -m "feat(web): /admin/schools/[id] detail (admins, suspend, seat limit)"
```

---

## Task 12: Final verification + ROADMAP + smoke brief

**Files:** Modify `ROADMAP.md`

- [ ] **Step 1: Full backend verification.**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand` → all green (expect 30 suites / 294 tests)

- [ ] **Step 2: Backend coverage on new code (≥80%).**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand --coverage --collectCoverageFrom='src/modules/schools/**/*.ts'`
Expected: schools module ≥80% lines (service/repository/controller all exercised by the extended specs).

- [ ] **Step 3: Frontend verification.**

Run: `pnpm --filter @eureka-lab/web lint` → clean
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → `24` (no new errors)

- [ ] **Step 4: Update ROADMAP Stream 6 sub-project 2 row** to:
```
| 2 | Super-admin console (Core: list/create/detail/suspend schools, edit seat limit, create + list admins) | **DONE** (`feat/school-superadmin-console`, 2026-05-30) | [console](docs/superpowers/specs/2026-05-30-school-tenancy-superadmin-console-design.md) · [plan](docs/superpowers/plans/2026-05-30-school-tenancy-superadmin-console-plan.md) |
```

- [ ] **Step 5: Commit.**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): mark B2B sub-project 2 (super-admin console) DONE"
```

- [ ] **Step 6: Report to the user** — summarize what shipped; note a user-driven smoke is the recommended next check (seed a super_admin via the foundation's `seed:super-admin`, log in, create a school, create an admin, suspend/reactivate, edit seat limit); await push approval.

---

## Self-Review (completed by plan author)

**Spec coverage:** RoleGate (T7), `/admin` table + create (T10), detail + suspend/seat-limit/admins (T11), `PATCH /schools/:id` (T3+T4+T5), `GET /schools/:id/admins` (T4+T5), `SchoolAdminSummary` (T1), `schoolsApi` (T6), `Admin` i18n en/fr/ar (T8), components (T9), tests + ROADMAP (T12). Every spec section maps to a task. ✔

**Deferred correctly excluded:** subscription editing, key rotation, usage analytics, email invites, teacher management, enrollment — none built (subscription/secret are read-only display only). ✔

**Type consistency:** `schoolsApi.update` body `{ status?, seatLimit? }` matches `UpdateSchoolDto` (T3) and `service.updateSchool` (T4) and `repo.updateSchool` partial (T2). `SchoolAdminSummary {uid,email,displayName}` (T1) is what `listSchoolAdmins` returns (T4), what `schoolsApi.listAdmins` types (T6), and what the detail page renders (T11). `createAdmin` returns the foundation's mint shape `{uid,email,displayName,role,schoolId}` — the dialog uses its own form password for the "shown once" panel (T9), not the response. `RoleGate` `allow: UserRoleString[]` consumes `homeForRole`/`UserRoleString` from the foundation (T7). i18n keys used in components (T9/T10/T11) all exist in the `Admin` namespace (T8). ✔

**Placeholder scan:** every code step has complete code; no TBD/TODO/vague-handling. ✔
