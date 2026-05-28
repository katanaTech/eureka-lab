# Eureka Lab Redesign — Plan 3b of N: R5 follow-ups + learner persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all three Plan-2 R5 carry-over compliance gaps (server-side role derivation, Google OAuth age gate, under-13 COPPA confirmation pipeline) and ship the two backend persistence features the learner loop has been faking with optimistic-local state (KP-credit endpoints, persistent academy progress). After this plan, the under-13 cohort can actually sign up for the product, the role field is server-trusted, and KP / lesson / video progress survives a page reload.

**Architecture:** Five logical workstreams across the backend + frontend. Phases A (P3-14 role-from-birthYear) and B (P3-15 OAuth age gate) tighten the auth signup surface. Phase C (P3-16 COPPA pipeline) adds a new `coppa` module + `email` service module — pending-child accounts go to a `pendingChildAccounts` Firestore collection; parents confirm via a tokenised email link, which then creates the real Firebase user and writes a `coppaAuditLog` row. Phase D (P3-17 KP-credit) exposes the already-implemented `InventoryService.awardKp` via a new `POST /inventory/credit-kp` endpoint with idempotency. Phase E (P3-18 persistent academy progress) replaces the in-memory `academy-progress-store` with a Firestore-backed `academy-progress` module + new shared API client. Phase F runs smoke + updates the roadmap. **Plan 3b explicitly defers P3-07 hybrid combat validation** to a separate plan — combat already functions optimistically and the work doesn't unblock anything ship-critical.

**Tech Stack:** Same as Plan 3a — Next.js 14 App Router, NestJS + Fastify backend, Firestore, class-validator DTOs, Firebase Admin SDK, Zustand stores. New: **Resend** for transactional email (CLAUDE.md tech stack already specifies Resend; no new selection needed). New backend modules: `email`, `coppa`, `academy-progress`.

**Spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md) — sections 5.5 (auth flow), 5.6 (combat trust model — informs but defers combat validation).
**ADR:** [`docs/context/ADR-006-kid-signup-flow.md`](../../context/ADR-006-kid-signup-flow.md) — defines the kid-signup decision; this plan ships the deferred "Plan 3 slice" from that ADR.
**Roadmap:** [`ROADMAP.md`](../../../ROADMAP.md) Stream 2 — Plan 3b row.

**P3-XX items resolved by this plan:** P3-14, P3-15, P3-16, P3-17, P3-18.

**Explicitly out of scope:**
- P3-07 hybrid combat validation — own plan when prioritised.
- All Plan 3c items (i18n re-key, RTL fonts, E2E rewrite, PWA/Sentry verification, `AiTutorChat.chapterName`, feature-component re-skin, `(dashboard)/learn/*` decision, `ui-store.sidebarOpen` prune).
- Stripe webhook hardening (STRIPE-001 — ROADMAP Stream 3).
- Test-coverage / security / a11y / perf audits (QA-001/SEC-001/A11Y-001/PERF-001 — Stream 3).
- ADR back-fill (ADR 001-005) — Stream 5 hygiene work.

---

## Pre-flight

This plan executes on the **existing** `redesign/v2-from-reference` branch. HEAD should be at `1cf9efc` (the role-aware routing fix from 2026-05-15 session) or later. Branch is currently **67 commits ahead** of `main`, **0 commits ahead** of `origin/redesign/v2-from-reference` (pushed).

- [ ] **Pre-flight Step 1: Confirm branch + working tree**

Run:
```powershell
git status -sb
git rev-parse --abbrev-ref HEAD
git rev-list --count main..HEAD
```

Expected: branch `redesign/v2-from-reference`, ahead 67 of `main`, working tree shows only `.claude/settings.local.json` and `apps/web/tsconfig.tsbuildinfo` as modified (both leave-alone artifacts).

- [ ] **Pre-flight Step 2: Confirm pre-existing baseline error counts**

Run:
```powershell
$out = pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1; ($out | Select-String -Pattern "error TS").Count
$out = pnpm --filter @eureka-lab/api exec tsc --noEmit 2>&1; ($out | Select-String -Pattern "error TS").Count
pnpm --filter @eureka-lab/web lint 2>&1 | Select-Object -Last 3
```

Expected: web tsc = 24, api tsc = 0, web lint = "No ESLint warnings or errors".

- [ ] **Pre-flight Step 3: Confirm Resend env var is documented (but optional locally)**

Resend is the email provider chosen in CLAUDE.md §2. The implementation in Phase C will read `RESEND_API_KEY` from env. For local dev, the email service falls back to a console-log stub when the key is missing (so kid-signup works end-to-end in dev without sending real email). Document the new env var in `docs/context/env-variables.md` before shipping.

- [ ] **Pre-flight Step 4: Confirm Firebase Admin can write to new Firestore collections**

Phase C introduces `pendingChildAccounts` and `coppaAuditLog`. Phase E introduces `academyProgress`. Firestore security rules in `infrastructure/firebase/firestore.rules` must permit Admin SDK writes (deny-all default with explicit user-doc allows is fine — Admin SDK bypasses rules). Verify the rules file exists and is the current source of truth before touching new collections:

```powershell
ls infrastructure/firebase/firestore.rules
```

Expected: file exists. If absent, escalate — do not proceed.

- [ ] **Pre-flight Step 5: Dev servers can start**

In two terminals:
```powershell
pnpm --filter @eureka-lab/api dev
pnpm --filter @eureka-lab/web dev
```

Expected: API on `http://localhost:3011`, web on `http://localhost:3010`. Open `/` — Welcome renders. Sign in as the parent + teacher accounts from Plan 3a smoke to confirm the new role-aware routing from `1cf9efc` is working (parent → `/parent`, teacher → `/teacher`). Kill both before continuing.

---

## Phase A — P3-14: Server-side role derivation from birthYear

Today the role is client-trusted. The Welcome page computes age from `birthYear`, decides `role: 'child'`, and sends it in the signup body. A motivated user can POST any role they want to `/auth/signup`. This phase moves role derivation server-side: the client sends `birthYear`, the server decides the role, and the `role` field on `SignupDto` becomes a server-internal concept only.

### Task A.1: Add `birthYear` field to `SignupDto`, deprecate `role`

**Files:**
- Modify: `apps/api/src/modules/auth/dto/signup.dto.ts` (full replace, ~40 lines)

The new DTO accepts `birthYear` (required) and **drops** `role` from the client surface. The auth service computes role from age.

- [ ] **Step 1: Read current DTO**

Read [apps/api/src/modules/auth/dto/signup.dto.ts](../../../apps/api/src/modules/auth/dto/signup.dto.ts).

- [ ] **Step 2: Replace DTO content**

Write the following to `apps/api/src/modules/auth/dto/signup.dto.ts`:

```ts
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /auth/signup.
 *
 * Per ADR-006 and Plan 3b A.1, the client sends `birthYear` only — the
 * server computes the role:
 *   - age 13–16 → role 'child'
 *   - age 17    → rejected (`AGE_GAP` — between kid and adult tiers)
 *   - age ≥ 18  → role 'parent'
 *   - age < 13  → routed to the COPPA pipeline (Phase C; this endpoint
 *                  rejects with `UNDER_13_PIPELINE_REQUIRED` so the
 *                  frontend can prompt for `parentEmail`).
 *
 * Teachers do NOT signup via this endpoint — teachers self-onboard via a
 * separate flow that does not yet exist in UI (filed as ROADMAP Stream 4
 * gap "Teacher signup UI"). For now teachers are seeded via direct API
 * calls; when a UI is added it will hit a dedicated `/auth/signup-teacher`
 * route, not this one.
 */
export class SignupDto {
  /** Account email address */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Password — min 8 chars, at least 1 uppercase and 1 number */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;

  /** Display name for the account */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /**
   * 4-digit year of birth used to derive role server-side.
   * Constrained to [1900, current year] — `AuthService.signup` enforces
   * the age-specific rules listed in the class JSDoc.
   */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 4: Commit**

```powershell
git add apps/api/src/modules/auth/dto/signup.dto.ts
git commit -m "feat(auth): replace client-trusted role with birthYear in SignupDto (P3-14)"
```

---

### Task A.2: Compute role server-side in `AuthService.signup`

**Files:**
- Modify: `apps/api/src/modules/auth/auth.service.ts:73-117` (the `signup` method)

The current `signup()` uses `dto.role ?? 'parent'`. Replace with age-based derivation. Reject ages 17 (gap) and < 13 (pipeline-required).

- [ ] **Step 1: Read the current `signup` method**

Read lines 73–117 of [apps/api/src/modules/auth/auth.service.ts](../../../apps/api/src/modules/auth/auth.service.ts) to confirm shape.

- [ ] **Step 2: Add a new private `deriveRole` helper above `signup`**

Insert this method into the `AuthService` class, immediately above the existing `signup` method:

```ts
/**
 * Derive a user role from year of birth using the kid-signup age rules
 * defined in ADR-006. Throws structured exceptions for the rejected
 * branches so the controller layer can surface meaningful error codes.
 *
 * @param birthYear - 4-digit year of birth (validated by SignupDto).
 * @returns 'child' for ages 13–16, 'parent' for ages 18+.
 * @throws BadRequestException with `code: 'AGE_GAP'` for age 17.
 * @throws BadRequestException with `code: 'UNDER_13_PIPELINE_REQUIRED'` for age <13.
 */
private deriveRole(birthYear: number): 'child' | 'parent' {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age < 13) {
    throw new BadRequestException({
      message:
        'Under 13 requires parent confirmation. Use the COPPA signup flow instead.',
      code: 'UNDER_13_PIPELINE_REQUIRED',
    });
  }
  if (age === 17) {
    throw new BadRequestException({
      message:
        'Heroes are 13–16 and adults are 18+. Contact support if you are 17.',
      code: 'AGE_GAP',
    });
  }
  return age <= 16 ? 'child' : 'parent';
}
```

Add `BadRequestException` to the `@nestjs/common` import at the top of the file if it's not already imported.

- [ ] **Step 3: Replace the `signup` method**

Replace the existing `signup` method (lines ~73–117) with:

```ts
/**
 * Create a new account. Role is derived from `birthYear` per ADR-006.
 * Under-13 callers MUST use the COPPA flow (see CoppaController in
 * Phase C); this endpoint rejects them with a specific code so the
 * frontend can pivot.
 *
 * @param dto - Signup data (email, password, displayName, birthYear)
 * @returns Created user info with token
 */
async signup(dto: SignupDto): Promise<SignupResult> {
  const role = this.deriveRole(dto.birthYear);

  try {
    const firebaseUser = await this.firebaseService.auth.createUser({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });

    await this.firebaseService.auth.setCustomUserClaims(firebaseUser.uid, { role });

    await this.usersRepository.create(firebaseUser.uid, {
      email: dto.email,
      displayName: dto.displayName,
      role,
      birthYear: dto.birthYear,
    });

    const token = await this.firebaseService.auth.createCustomToken(firebaseUser.uid);

    this.logger.log({ event: 'signup', uid: firebaseUser.uid, role, birthYear: dto.birthYear });

    return {
      uid: firebaseUser.uid,
      email: dto.email,
      displayName: dto.displayName,
      role,
      token,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    const code = (error as { code?: string }).code ?? '';
    if (
      msg.includes('email-already-exists') ||
      msg.includes('already in use') ||
      code === 'auth/email-already-exists'
    ) {
      throw new ConflictException({
        message: 'Email address is already registered',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }
    throw error;
  }
}
```

- [ ] **Step 4: Verify `UsersRepository.create` accepts `birthYear`**

Run the Grep tool:
- Pattern: `birthYear`
- Path: `apps/api/src/modules/users/users.repository.ts`

Expected: `birthYear` is a field on `CreateUserData`. If it's not, add it as `birthYear?: number` and write it through to the Firestore doc. The `addChild` method already passes `birthYear` through (see `auth.service.ts:244`) so the field plumbing should exist.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/modules/auth/auth.service.ts
git commit -m "feat(auth): derive role server-side from birthYear (P3-14)"
```

---

### Task A.3: Add unit tests for `deriveRole` and `signup` role gating

**Files:**
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Read the current spec file**

Read [apps/api/src/modules/auth/auth.service.spec.ts](../../../apps/api/src/modules/auth/auth.service.spec.ts) to understand the existing test scaffold (mocks for `FirebaseService` + `UsersRepository`).

- [ ] **Step 2: Add a `describe` block for `signup` role derivation**

Append the following block inside the top-level `describe('AuthService', () => { ... })` block, after any existing `describe('signup', …)` block (or replace it if it exists):

```ts
describe('signup role derivation (P3-14)', () => {
  const currentYear = new Date().getFullYear();

  const baseDto = (birthYear: number) => ({
    email: 'hero@realm.io',
    password: 'Sword123',
    displayName: 'Test Hero',
    birthYear,
  });

  it('derives role child for age 16 (lower bound of child band)', async () => {
    firebaseAuthMock.createUser.mockResolvedValue({ uid: 'uid-child-16' });
    firebaseAuthMock.setCustomUserClaims.mockResolvedValue(undefined);
    firebaseAuthMock.createCustomToken.mockResolvedValue('tok');
    usersRepositoryMock.create.mockResolvedValue(undefined);

    const result = await service.signup(baseDto(currentYear - 16));
    expect(result.role).toBe('child');
    expect(usersRepositoryMock.create).toHaveBeenCalledWith(
      'uid-child-16',
      expect.objectContaining({ role: 'child', birthYear: currentYear - 16 }),
    );
  });

  it('derives role child for age 13 (upper bound of child band)', async () => {
    firebaseAuthMock.createUser.mockResolvedValue({ uid: 'uid-child-13' });
    firebaseAuthMock.setCustomUserClaims.mockResolvedValue(undefined);
    firebaseAuthMock.createCustomToken.mockResolvedValue('tok');
    usersRepositoryMock.create.mockResolvedValue(undefined);

    const result = await service.signup(baseDto(currentYear - 13));
    expect(result.role).toBe('child');
  });

  it('derives role parent for age 18', async () => {
    firebaseAuthMock.createUser.mockResolvedValue({ uid: 'uid-parent-18' });
    firebaseAuthMock.setCustomUserClaims.mockResolvedValue(undefined);
    firebaseAuthMock.createCustomToken.mockResolvedValue('tok');
    usersRepositoryMock.create.mockResolvedValue(undefined);

    const result = await service.signup(baseDto(currentYear - 18));
    expect(result.role).toBe('parent');
  });

  it('rejects age 17 with AGE_GAP', async () => {
    await expect(service.signup(baseDto(currentYear - 17))).rejects.toMatchObject({
      response: { code: 'AGE_GAP' },
    });
    expect(firebaseAuthMock.createUser).not.toHaveBeenCalled();
  });

  it('rejects age 12 with UNDER_13_PIPELINE_REQUIRED', async () => {
    await expect(service.signup(baseDto(currentYear - 12))).rejects.toMatchObject({
      response: { code: 'UNDER_13_PIPELINE_REQUIRED' },
    });
    expect(firebaseAuthMock.createUser).not.toHaveBeenCalled();
  });

  it('rejects age 8 with UNDER_13_PIPELINE_REQUIRED (under bound check)', async () => {
    await expect(service.signup(baseDto(currentYear - 8))).rejects.toMatchObject({
      response: { code: 'UNDER_13_PIPELINE_REQUIRED' },
    });
  });
});
```

The variable names `firebaseAuthMock` and `usersRepositoryMock` MUST match what the existing spec file uses. If the existing file uses different mock names, rename them in this block to match. Read the top of the spec file's `beforeEach` to confirm.

- [ ] **Step 3: Run the new tests**

Run: `pnpm --filter @eureka-lab/api test -- auth.service.spec`

Expected: all 6 new tests pass.

- [ ] **Step 4: Commit**

```powershell
git add apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "test(auth): cover signup role derivation by birthYear (P3-14)"
```

---

### Task A.4: Update Welcome page to send `birthYear` (drop client-side role)

**Files:**
- Modify: `apps/web/src/app/page.tsx:80-89` (the register branch's `authApi.signup` call)

The Welcome page already collects `birthYear` (added in Plan 2 F.1). Today it sends `role: 'child'` to the backend; now it sends `birthYear` instead.

- [ ] **Step 1: Read the register branch (lines 52-102)**

Read [apps/web/src/app/page.tsx](../../../apps/web/src/app/page.tsx) lines 52-102 — the `submit` handler's `if (mode === 'register')` block.

- [ ] **Step 2: Replace the `authApi.signup` call**

Find the block (around lines 80-86):

```ts
        await authApi.signup({
          email: email.trim(),
          password,
          displayName: username.trim(),
          role: 'child',
        });
```

Replace with:

```ts
        try {
          await authApi.signup({
            email: email.trim(),
            password,
            displayName: username.trim(),
            birthYear: year,
          });
        } catch (err) {
          // Server now owns role derivation. If birthYear maps to <13 we get
          // UNDER_13_PIPELINE_REQUIRED; Phase C will redirect to the COPPA
          // form. For Plan 3b A.4 (this task) we surface the error as a toast;
          // the actual under-13 branch lands in Task C.7.
          const apiErr = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
          const code = apiErr.response?.data?.code;
          if (code === 'UNDER_13_PIPELINE_REQUIRED') {
            return toast.error('Under 13: parent confirmation coming in Phase C.');
          }
          if (code === 'AGE_GAP') {
            return toast.error('Heroes are 13–16. Contact support if you are 17.');
          }
          throw err;
        }
```

Also remove the client-side under-13 / over-16 toasts at lines 66-73 — the backend now owns those rules. The age-range hint in the field label (`Year of Birth (13–16 only)`) stays as a UX nudge.

- [ ] **Step 3: Update `authApi.signup` type signature**

Read [apps/web/src/lib/api-client.ts](../../../apps/web/src/lib/api-client.ts) and find the `authApi.signup` definition. Replace `role: 'parent' | 'teacher' | 'child'` in the body type with `birthYear: number`.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (same pre-existing baseline; no new errors).

- [ ] **Step 5: Commit**

```powershell
git add "apps/web/src/app/page.tsx" apps/web/src/lib/api-client.ts
git commit -m "feat(welcome): send birthYear instead of client-trusted role (P3-14)"
```

---

### Task A.5: Update SignupForm (adult `/signup`) to send `birthYear` too

**Files:**
- Modify: `apps/web/src/components/features/auth/SignupForm.tsx`

The standalone `/signup` page creates adult accounts. Today its `SignupForm` sends `role: 'parent'`. With the new backend, it must send a `birthYear` that produces `role: 'parent'` (≥18). Add a birthYear field to the form.

- [ ] **Step 1: Read the current SignupForm**

Read [apps/web/src/components/features/auth/SignupForm.tsx](../../../apps/web/src/components/features/auth/SignupForm.tsx).

- [ ] **Step 2: Replace file content**

```tsx
'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { homeForRole } from '@/lib/auth-redirects';

const CURRENT_YEAR = new Date().getFullYear();
/** Adult signup requires age 18+; backend rejects 13–16 (kid) and 17 (gap). */
const ADULT_MIN_AGE = 18;

/**
 * Adult-account signup form (parent or, post-Plan-3b, age-derived).
 * Per Plan 3b A.1, the backend derives role from birthYear; this form
 * just collects birthYear and lets the server decide. Today only
 * age 18+ resolves to a parent account; teacher signup is a separate
 * deferred flow (ROADMAP Stream 4 gap).
 */
export const SignupForm: FC = () => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Handle adult signup. */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    setError('');

    const yearNum = Number(birthYear);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > CURRENT_YEAR) {
      setError('Year of birth looks odd.');
      return;
    }
    if (CURRENT_YEAR - yearNum < ADULT_MIN_AGE) {
      setError(`Adult signup is for ages ${ADULT_MIN_AGE}+. Heroes 13–16 sign up via the Welcome page.`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.signup({
        email,
        password,
        displayName,
        birthYear: yearNum,
      });

      await createUserWithEmailAndPassword(auth, email, password).catch(() => {
        /* User was already created by the backend — sign in instead */
      });

      setUser({
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
        role: result.role as 'parent',
        plan: 'free',
        xp: 0,
        streak: 0,
        level: 1,
      });

      router.push(homeForRole(result.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('signupTitle')}</h1>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium text-foreground">
            {t('displayName')}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="birthYear" className="text-sm font-medium text-foreground">
            Year of birth
          </label>
          <input
            id="birthYear"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder={`${CURRENT_YEAR - ADULT_MIN_AGE} or earlier`}
            min={1900}
            max={CURRENT_YEAR - ADULT_MIN_AGE}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '...' : t('signupButton')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <a href="/login" className="font-medium text-primary hover:underline">
          {t('loginButton')}
        </a>
      </p>
    </div>
  );
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/components/features/auth/SignupForm.tsx
git commit -m "feat(auth): SignupForm sends birthYear; client-side adult age gate (P3-14)"
```

---

## Phase B — P3-15: Google OAuth age gate

Google OAuth users currently skip the age gate entirely. After `signInWithPopup`, the user has a Firebase session but no Firestore profile yet. `useAuth` hits `authApi.getMe` which 404s, then `useAuth` signs them out (per Plan 1 fix `b485166`). Result: Google OAuth signup is silently broken.

Fix: detect the "orphan Google session" case in the Welcome handler, show a birthYear collection modal, and POST to a new endpoint `/auth/complete-oauth-signup` that creates the Firestore profile using the same role-derivation logic as Phase A.

### Task B.1: New backend endpoint `POST /auth/complete-oauth-signup`

**Files:**
- Create: `apps/api/src/modules/auth/dto/complete-oauth-signup.dto.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts` (add `completeOAuthSignup` method)
- Modify: `apps/api/src/modules/auth/auth.controller.ts` (add new endpoint)

- [ ] **Step 1: Create the DTO**

Write to `apps/api/src/modules/auth/dto/complete-oauth-signup.dto.ts`:

```ts
import { IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /auth/complete-oauth-signup.
 *
 * After a Google OAuth signInWithPopup the client has a valid Firebase
 * session (auth.currentUser is set) but no Firestore profile yet. This
 * endpoint creates the profile using the same role-derivation rules as
 * the standard /auth/signup endpoint (Plan 3b A.2).
 *
 * The Firebase ID token is verified by the FirebaseAuthGuard on the
 * controller; the caller's UID is taken from the verified token, not
 * from the request body.
 */
export class CompleteOAuthSignupDto {
  /** 4-digit year of birth — must satisfy the same age rules as SignupDto. */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
```

- [ ] **Step 2: Add `completeOAuthSignup` method to `AuthService`**

Append the following method to `AuthService`, after `signup`:

```ts
/**
 * Create a Firestore profile for an already-authenticated OAuth user.
 * Looks up the Firebase user's email + displayName via the Admin SDK
 * (the caller only supplies the verified UID + birthYear). Uses the same
 * role-derivation rules as `signup`. Idempotent: if a profile already
 * exists for `uid`, returns it unchanged.
 *
 * @param uid - Firebase UID (from the verified ID token)
 * @param dto - { birthYear }
 * @returns SignupResult-shaped payload
 */
async completeOAuthSignup(
  uid: string,
  dto: CompleteOAuthSignupDto,
): Promise<SignupResult> {
  // Idempotency — if a profile already exists, return it.
  const existing = await this.usersRepository.findByUid(uid);
  if (existing) {
    return {
      uid: existing.uid,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role,
      token: await this.firebaseService.auth.createCustomToken(uid),
    };
  }

  const fbUser = await this.firebaseService.auth.getUser(uid);
  const email = fbUser.email ?? '';
  const displayName = fbUser.displayName ?? email.split('@')[0] ?? 'Hero';
  const role = this.deriveRole(dto.birthYear);

  await this.firebaseService.auth.setCustomUserClaims(uid, { role });

  await this.usersRepository.create(uid, {
    email,
    displayName,
    role,
    birthYear: dto.birthYear,
  });

  const token = await this.firebaseService.auth.createCustomToken(uid);

  this.logger.log({ event: 'oauth_signup', uid, role, birthYear: dto.birthYear });

  return { uid, email, displayName, role, token };
}
```

Add the import at the top of the service file:
```ts
import type { CompleteOAuthSignupDto } from './dto/complete-oauth-signup.dto';
```

- [ ] **Step 3: Add the controller endpoint**

In `apps/api/src/modules/auth/auth.controller.ts`, add this endpoint method below `signup`:

```ts
/**
 * Complete the Firestore profile creation for a Google OAuth user.
 * Caller must be authenticated (Firebase ID token in Authorization header).
 *
 * @param user - Current authenticated user (from FirebaseAuthGuard)
 * @param dto - { birthYear }
 * @returns Created profile + custom token
 */
@Post('complete-oauth-signup')
@UseGuards(FirebaseAuthGuard)
@HttpCode(HttpStatus.CREATED)
async completeOAuthSignup(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CompleteOAuthSignupDto,
) {
  return this.authService.completeOAuthSignup(user.uid, dto);
}
```

Add the import:
```ts
import { CompleteOAuthSignupDto } from './dto/complete-oauth-signup.dto';
```

The service looks up the Firebase user's email + displayName internally (it already injects `FirebaseService`), so the controller stays thin — no private-field access.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/modules/auth/dto/complete-oauth-signup.dto.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.controller.ts
git commit -m "feat(auth): POST /auth/complete-oauth-signup to fill profile after Google OAuth (P3-15)"
```

---

### Task B.2: Create `<OAuthBirthYearModal />` component

**Files:**
- Create: `apps/web/src/components/features/auth/OAuthBirthYearModal.tsx`

- [ ] **Step 1: Write the component**

Write to `apps/web/src/components/features/auth/OAuthBirthYearModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { GameButton } from '@/components/game/GameButton';

const CURRENT_YEAR = new Date().getFullYear();

interface OAuthBirthYearModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Submit handler — receives the chosen birth year. */
  onSubmit: (birthYear: number) => Promise<void> | void;
  /** Cancel handler — closes the modal without completing signup. */
  onCancel: () => void;
}

/**
 * Modal shown after a Google OAuth signInWithPopup when the user has no
 * Firestore profile yet. Collects birthYear so the backend can derive
 * the role. Used by the Welcome page's handleGoogle flow (Plan 3b B.3).
 *
 * Under-13 ages route to the COPPA pipeline; the modal itself just
 * collects and submits — error handling and the under-13 pivot live on
 * the caller side.
 */
export function OAuthBirthYearModal({ open, onSubmit, onCancel }: OAuthBirthYearModalProps) {
  const [birthYear, setBirthYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const yearNum = Number(birthYear);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > CURRENT_YEAR) {
      setError('Year of birth looks odd.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(yearNum);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-birthyear-title"
    >
      <div className="panel rune-ring max-w-md w-full mx-4 p-6 sm:p-8 animate-fade-in-up">
        <h2 id="oauth-birthyear-title" className="font-display text-2xl text-glow-primary text-center">
          One last rune, hero
        </h2>
        <p className="text-sm text-muted-foreground text-center mt-2">
          We need your year of birth to forge the right kind of legend for you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-[11px] font-display tracking-[0.3em] uppercase text-primary/80 mb-1.5">
              Year of Birth
            </span>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder={`${CURRENT_YEAR - 14}`}
              min={1900}
              max={CURRENT_YEAR}
              required
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-input border border-border/70 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <GameButton type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting} className="flex-1">
              Cancel
            </GameButton>
            <GameButton type="submit" variant="primary" size="sm" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '...' : 'Forge Identity'}
            </GameButton>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 3: Commit**

```powershell
git add apps/web/src/components/features/auth/OAuthBirthYearModal.tsx
git commit -m "feat(auth): OAuthBirthYearModal for post-Google-OAuth birthYear collection (P3-15)"
```

---

### Task B.3: Wire Welcome's `handleGoogle` to use the modal + complete signup

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/lib/api-client.ts` (add `authApi.completeOAuthSignup`)

- [ ] **Step 1: Add `authApi.completeOAuthSignup` to the API client**

In [apps/web/src/lib/api-client.ts](../../../apps/web/src/lib/api-client.ts), find the `authApi` object. Add this method (alongside `signup`):

```ts
/**
 * Complete the Firestore profile creation after a Google OAuth sign-in.
 * The caller must pass a valid Firebase ID token (the `request` helper
 * grabs it from the current Firebase session).
 *
 * @param body - { birthYear }
 * @returns SignupResult — uid, email, displayName, role, token
 */
completeOAuthSignup: (body: { birthYear: number }) =>
  request<{ uid: string; email: string; displayName: string; role: string; token: string }>(
    '/auth/complete-oauth-signup',
    { method: 'POST', body: JSON.stringify(body) },
  ),
```

- [ ] **Step 2: Rewrite Welcome's `handleGoogle`**

In `apps/web/src/app/page.tsx`, replace the existing `handleGoogle` (around line 104) with:

```tsx
const [oauthModalOpen, setOauthModalOpen] = useState(false);
const [pendingOAuthUser, setPendingOAuthUser] = useState<{ uid: string } | null>(null);

const handleGoogle = async () => {
  if (!auth) return toast.error('Auth is not available.');
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    toast.success(`Welcome, ${cred.user.displayName ?? 'Hero'}.`);

    // Try to fetch existing profile. If 404, this is a first-time OAuth
    // user — show the birthYear modal so we can complete the signup.
    try {
      const profile = await authApi.getMe();
      router.push(homeForRole(profile.role));
    } catch (err) {
      const apiErr = err as { statusCode?: number };
      if (apiErr.statusCode === 404) {
        setPendingOAuthUser({ uid: cred.user.uid });
        setOauthModalOpen(true);
        return;
      }
      throw err;
    }
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? 'Google sign-in failed.';
    toast.error(msg);
  }
};

const handleOAuthBirthYearSubmit = async (birthYear: number) => {
  if (!pendingOAuthUser) return;
  try {
    const result = await authApi.completeOAuthSignup({ birthYear });
    setOauthModalOpen(false);
    setPendingOAuthUser(null);
    toast.success('Identity forged. Onward, hero.');
    router.push(homeForRole(result.role));
  } catch (err) {
    const apiErr = err as { response?: { data?: { code?: string; message?: string } } };
    const code = apiErr.response?.data?.code;
    if (code === 'UNDER_13_PIPELINE_REQUIRED') {
      throw new Error('Under 13 OAuth: parent confirmation coming in Phase C.');
    }
    if (code === 'AGE_GAP') {
      throw new Error('Heroes are 13–16. Contact support if you are 17.');
    }
    throw err;
  }
};

const handleOAuthCancel = async () => {
  // User backed out of the birthYear collection — sign them out of Firebase
  // so we don't leave an orphan session lying around.
  setOauthModalOpen(false);
  setPendingOAuthUser(null);
  if (auth) {
    try {
      await auth.signOut();
    } catch {
      /* best-effort */
    }
  }
};
```

Add the import at the top:
```tsx
import { OAuthBirthYearModal } from '@/components/features/auth/OAuthBirthYearModal';
```

And render the modal at the bottom of the JSX, inside `<Scene>` but after `</main>`:

```tsx
<OAuthBirthYearModal
  open={oauthModalOpen}
  onSubmit={handleOAuthBirthYearSubmit}
  onCancel={handleOAuthCancel}
/>
```

Remove the existing `TODO(plan-3b): collect birthYear before Google OAuth so we can age-gate` comment — it's now implemented.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/lib/api-client.ts "apps/web/src/app/page.tsx"
git commit -m "feat(welcome): Google OAuth birthYear modal + profile completion (P3-15)"
```

---

## Phase C — P3-16: Under-13 COPPA confirmation pipeline

The biggest phase. Builds the parent-email confirmation flow ADR-006 deferred. Under-13 signups create a `pendingChildAccounts` document (not a real Firebase user yet), send the parent an email with a one-time confirmation link, and only on parent click does the actual Firebase user + Firestore profile get created. Adds a `coppaAuditLog` row per confirmation.

### Task C.1: Document `RESEND_API_KEY` env var

**Files:**
- Modify: `docs/context/env-variables.md`

- [ ] **Step 1: Add the var to the Backend table**

Read [docs/context/env-variables.md](../../context/env-variables.md). Insert this row in the Backend table after the existing `SENTRY_DSN` row:

```
| `RESEND_API_KEY` | Yes (prod) | — | Resend API key for transactional email (COPPA parent confirmation; magic-link signin if added later). Email service falls back to console-log when absent. |
| `RESEND_FROM_EMAIL` | Yes (prod) | `no-reply@eurekalab.example.com` | From address for outbound email. Must be verified in Resend's dashboard. |
```

Also append `RESEND_API_KEY=re_...` and `RESEND_FROM_EMAIL=no-reply@yourdomain.com` to the Backend `.env` Template code block.

- [ ] **Step 2: Commit**

```powershell
git add docs/context/env-variables.md
git commit -m "docs(env): document RESEND_API_KEY + RESEND_FROM_EMAIL (P3-16 prep)"
```

---

### Task C.2: Install Resend SDK and create `EmailService`

**Files:**
- Modify: `apps/api/package.json` (add `resend` dependency)
- Create: `apps/api/src/modules/email/email.service.ts`
- Create: `apps/api/src/modules/email/email.module.ts`

- [ ] **Step 1: Install the dependency**

Run:
```powershell
pnpm --filter @eureka-lab/api add resend
```

Expected: `resend` added to `apps/api/package.json` dependencies (any 4.x version is fine).

- [ ] **Step 2: Create `EmailService`**

Write to `apps/api/src/modules/email/email.service.ts`:

```ts
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface CoppaConfirmationEmail {
  parentEmail: string;
  kidDisplayName: string;
  confirmUrl: string;
}

/**
 * Transactional email service backed by Resend.
 *
 * When `RESEND_API_KEY` is absent (local dev), this service logs the
 * email payload to console instead of sending — that lets the COPPA
 * flow be exercised end-to-end without sending real email or signing
 * up for a Resend account.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend?: Resend;
  private readonly fromAddress: string;

  constructor(@Optional() private readonly config?: ConfigService) {
    const apiKey = config?.get<string>('RESEND_API_KEY') ?? process.env.RESEND_API_KEY;
    this.fromAddress =
      config?.get<string>('RESEND_FROM_EMAIL') ??
      process.env.RESEND_FROM_EMAIL ??
      'no-reply@eurekalab.example.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set — EmailService runs in console-log mode (no real emails sent).',
      );
    }
  }

  /**
   * Send the COPPA parent-confirmation email.
   *
   * @param email - Parent's email address (from the pending signup)
   * @returns Resolved when the send call completes (or logged in dev).
   */
  async sendCoppaConfirmation(email: CoppaConfirmationEmail): Promise<void> {
    const subject = `Confirm ${email.kidDisplayName}'s Eureka Lab account`;
    const text = [
      `Hi,`,
      ``,
      `${email.kidDisplayName} wants to create an Eureka Lab account to learn about AI.`,
      `Because they are under 13, US COPPA rules require a parent to confirm.`,
      ``,
      `Click here to confirm: ${email.confirmUrl}`,
      ``,
      `This link expires in 7 days. If you didn't expect this email, you can ignore it — no account is created until you click.`,
      ``,
      `— The Eureka Lab team`,
    ].join('\n');

    if (!this.resend) {
      this.logger.log({
        event: 'email_send_stub',
        to: email.parentEmail,
        subject,
        body: text,
      });
      return;
    }

    const result = await this.resend.emails.send({
      from: this.fromAddress,
      to: email.parentEmail,
      subject,
      text,
    });

    if (result.error) {
      this.logger.error(
        `Resend send failed for ${email.parentEmail}: ${result.error.message}`,
      );
      throw new Error(`Failed to send confirmation email: ${result.error.message}`);
    }

    this.logger.log({ event: 'email_sent', to: email.parentEmail, subject });
  }
}
```

- [ ] **Step 3: Create the module**

Write to `apps/api/src/modules/email/email.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Global-ish email module. Exposes EmailService for any feature module
 * that needs to send transactional email (COPPA, magic-link signin, etc.).
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/package.json apps/api/src/modules/email/email.service.ts apps/api/src/modules/email/email.module.ts pnpm-lock.yaml
git commit -m "feat(email): add EmailService with Resend integration + dev console-log fallback (P3-16)"
```

---

### Task C.3: Create `CoppaService` + DTOs + module

**Files:**
- Create: `apps/api/src/modules/coppa/dto/create-pending-child.dto.ts`
- Create: `apps/api/src/modules/coppa/dto/confirm-parent-email.dto.ts`
- Create: `apps/api/src/modules/coppa/coppa.service.ts`
- Create: `apps/api/src/modules/coppa/coppa.module.ts`

- [ ] **Step 1: Create DTOs**

Write to `apps/api/src/modules/coppa/dto/create-pending-child.dto.ts`:

```ts
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /coppa/pending-child.
 * Under-13 signup — creates a pending account that needs parent confirmation
 * before a real Firebase user is created.
 *
 * NOTE: no password is collected here. Persisting an under-13's credential
 * at rest (even hashed) is an unnecessary secret. At parent-confirmation
 * time the backend creates the account with a random password and emails a
 * password-setup link, so the kid chooses their real password AFTER the
 * grown-up has confirmed.
 */
export class CreatePendingChildDto {
  /** Kid's email address (will become the child account email after confirmation) */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Parent's email — receives the confirmation link */
  @IsEmail()
  @IsNotEmpty()
  parentEmail!: string;

  /** Kid's display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Kid's birth year — server confirms age < 13 */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
```

Write to `apps/api/src/modules/coppa/dto/confirm-parent-email.dto.ts`:

```ts
import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * Request body for POST /coppa/confirm-parent-email.
 * The `token` is the one delivered in the parent's confirmation email
 * (per CoppaService — 32-char URL-safe random string).
 */
export class ConfirmParentEmailDto {
  @IsString()
  @IsNotEmpty()
  @Length(32, 32)
  token!: string;
}
```

- [ ] **Step 2: Create `CoppaService`**

Write to `apps/api/src/modules/coppa/coppa.service.ts`:

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { EmailService } from '../email/email.service';
import type { CreatePendingChildDto } from './dto/create-pending-child.dto';
import type { ConfirmParentEmailDto } from './dto/confirm-parent-email.dto';

/** Shape persisted in the pendingChildAccounts collection. */
interface PendingChildDoc {
  token: string;
  email: string;
  parentEmail: string;
  displayName: string;
  birthYear: number;
  createdAt: string;
  expiresAt: string;
}

/** Audit log row written on every successful parent confirmation. */
interface CoppaAuditDoc {
  childUid: string;
  parentEmail: string;
  kidEmail: string;
  kidDisplayName: string;
  birthYear: number;
  confirmedAt: string;
}

/** TTL for unconfirmed pending accounts (7 days). */
const PENDING_TTL_DAYS = 7;

/** Confirm URL the parent receives in their email. */
function buildConfirmUrl(frontendUrl: string, token: string): string {
  return `${frontendUrl.replace(/\/$/, '')}/confirm-parent/${token}`;
}

/**
 * COPPA pipeline service.
 * Implements the under-13 parent-email confirmation flow per ADR-006.
 *
 * Flow:
 *   1. Kid submits CreatePendingChildDto → service stores hashed password
 *      in pendingChildAccounts/{token}, sends parent an email.
 *   2. Parent clicks confirm link → service finds doc by token, creates
 *      real Firebase user + Firestore profile, deletes pending doc,
 *      writes coppaAuditLog row.
 */
@Injectable()
export class CoppaService {
  private readonly logger = new Logger(CoppaService.name);
  private readonly pendingCollection = 'pendingChildAccounts';
  private readonly auditCollection = 'coppaAuditLog';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly users: UsersRepository,
    private readonly email: EmailService,
  ) {}

  /**
   * Create a pending child account and email the parent for confirmation.
   *
   * @param dto - Kid's signup details + parent email
   * @returns { token } — opaque ID; the frontend uses it to show a
   *                     "check parent's email" pending screen.
   */
  async createPendingChild(dto: CreatePendingChildDto): Promise<{ token: string }> {
    const currentYear = new Date().getFullYear();
    const age = currentYear - dto.birthYear;
    if (age >= 13) {
      throw new BadRequestException({
        message: 'COPPA pipeline is only for ages under 13. Use /auth/signup directly.',
        code: 'NOT_UNDER_13',
      });
    }

    // Reject if the kid's email is already a real account.
    try {
      await this.firebase.auth.getUserByEmail(dto.email);
      throw new ConflictException({
        message: 'Email is already registered.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/user-not-found') throw err;
      // No existing user — good, we can proceed.
    }

    const token = randomBytes(16).toString('hex'); // 32 chars
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PENDING_TTL_DAYS * 24 * 60 * 60 * 1000);

    const doc: PendingChildDoc = {
      token,
      email: dto.email,
      parentEmail: dto.parentEmail,
      displayName: dto.displayName,
      birthYear: dto.birthYear,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.firebase.firestore
      .collection(this.pendingCollection)
      .doc(token)
      .set(doc);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3010';
    await this.email.sendCoppaConfirmation({
      parentEmail: dto.parentEmail,
      kidDisplayName: dto.displayName,
      confirmUrl: buildConfirmUrl(frontendUrl, token),
    });

    this.logger.log({
      event: 'coppa_pending_created',
      token,
      parentEmail: dto.parentEmail,
      kidEmail: dto.email,
      age,
    });

    return { token };
  }

  /**
   * Confirm a pending child account using the parent's email token.
   * Creates the real Firebase user, the Firestore profile, writes the
   * audit log, and deletes the pending doc — all in sequence (the
   * Firestore parts are batched into a single write).
   *
   * @param dto - { token }
   * @returns { uid, email } — the new child account's identifiers
   */
  async confirmParentEmail(dto: ConfirmParentEmailDto): Promise<{ uid: string; email: string }> {
    const ref = this.firebase.firestore
      .collection(this.pendingCollection)
      .doc(dto.token);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException({
        message: 'Confirmation token not found or already used.',
        code: 'TOKEN_INVALID',
      });
    }
    const pending = snap.data() as PendingChildDoc;
    if (new Date(pending.expiresAt) < new Date()) {
      throw new BadRequestException({
        message: 'Confirmation link expired. Ask the hero to sign up again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Create the Firebase user with a random throwaway password. The kid
    // sets their real password via the reset link generated below — we
    // never persisted a credential for an under-13 account.
    const randomPassword = randomBytes(24).toString('hex');
    const fbUser = await this.firebase.auth.createUser({
      email: pending.email,
      password: randomPassword,
      displayName: pending.displayName,
    });
    await this.firebase.auth.setCustomUserClaims(fbUser.uid, { role: 'child' });

    await this.users.create(fbUser.uid, {
      email: pending.email,
      displayName: pending.displayName,
      role: 'child',
      birthYear: pending.birthYear,
    });

    // Audit log + delete the pending doc, as a Firestore batch so they
    // succeed or fail together.
    const audit: CoppaAuditDoc = {
      childUid: fbUser.uid,
      parentEmail: pending.parentEmail,
      kidEmail: pending.email,
      kidDisplayName: pending.displayName,
      birthYear: pending.birthYear,
      confirmedAt: new Date().toISOString(),
    };
    const batch = this.firebase.firestore.batch();
    batch.set(this.firebase.firestore.collection(this.auditCollection).doc(), audit);
    batch.delete(ref);
    await batch.commit();

    // Generate a password-reset link so the kid can set their own real
    // password. EmailService.sendCoppaConfirmation already exists; for
    // this notification we just log it — adding a second email template
    // is polish; the kid knowing their email + clicking "forgot password"
    // gets them in until then.
    const resetLink = await this.firebase.auth.generatePasswordResetLink(pending.email);
    this.logger.log({
      event: 'coppa_confirmed',
      childUid: fbUser.uid,
      kidEmail: pending.email,
      resetLink,
    });

    return { uid: fbUser.uid, email: pending.email };
  }
}
```

- [ ] **Step 3: Create the module**

Write to `apps/api/src/modules/coppa/coppa.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CoppaService } from './coppa.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [CoppaService],
  exports: [CoppaService],
})
export class CoppaModule {}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/modules/coppa/
git commit -m "feat(coppa): pending-child + parent-confirm service with Firestore audit log (P3-16)"
```

---

### Task C.4: Create `CoppaController` and register in AppModule

**Files:**
- Create: `apps/api/src/modules/coppa/coppa.controller.ts`
- Modify: `apps/api/src/app.module.ts` (add CoppaModule to imports)

- [ ] **Step 1: Create the controller**

Write to `apps/api/src/modules/coppa/coppa.controller.ts`:

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CoppaService } from './coppa.service';
import { CreatePendingChildDto } from './dto/create-pending-child.dto';
import { ConfirmParentEmailDto } from './dto/confirm-parent-email.dto';

/**
 * COPPA pipeline endpoints. Public — no auth required because the kid
 * doesn't have a real account yet at create time, and the parent doesn't
 * have an Eureka Lab account at confirm time.
 *
 * Both endpoints are rate-limited at the global Nest layer (or should
 * be — verify in main.ts that throttling is enabled before shipping).
 */
@Controller('coppa')
export class CoppaController {
  constructor(private readonly coppa: CoppaService) {}

  /**
   * Create a pending child account. Sends parent an email with a
   * confirmation link.
   */
  @Post('pending-child')
  @HttpCode(HttpStatus.ACCEPTED)
  async createPendingChild(@Body() dto: CreatePendingChildDto) {
    return this.coppa.createPendingChild(dto);
  }

  /**
   * Confirm a pending child account using the token from the parent's
   * email. Creates the real Firebase user + Firestore profile.
   */
  @Post('confirm-parent-email')
  @HttpCode(HttpStatus.CREATED)
  async confirmParentEmail(@Body() dto: ConfirmParentEmailDto) {
    return this.coppa.confirmParentEmail(dto);
  }
}
```

- [ ] **Step 2: Wire into the CoppaModule**

In `apps/api/src/modules/coppa/coppa.module.ts`, add the controller:

```ts
import { Module } from '@nestjs/common';
import { CoppaController } from './coppa.controller';
import { CoppaService } from './coppa.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsersModule, EmailModule],
  controllers: [CoppaController],
  providers: [CoppaService],
  exports: [CoppaService],
})
export class CoppaModule {}
```

- [ ] **Step 3: Register CoppaModule in AppModule**

Read [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts). Add `CoppaModule` to the `imports` array (alongside existing modules like `AuthModule`, `InventoryModule`).

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/modules/coppa/coppa.controller.ts apps/api/src/modules/coppa/coppa.module.ts apps/api/src/app.module.ts
git commit -m "feat(coppa): CoppaController + AppModule wiring (P3-16)"
```

---

### Task C.5: Add frontend `coppaApi` client + Welcome under-13 branch

**Files:**
- Modify: `apps/web/src/lib/api-client.ts` (add `coppaApi`)
- Modify: `apps/web/src/app/page.tsx` (under-13 form variant)

- [ ] **Step 1: Add `coppaApi` to the API client**

In [apps/web/src/lib/api-client.ts](../../../apps/web/src/lib/api-client.ts), add this export near the `authApi`:

```ts
/** COPPA pipeline API (public — no auth required). */
export const coppaApi = {
  /**
   * Create a pending under-13 child account. Sends parent an email.
   * @param body - { email, parentEmail, displayName, birthYear }
   * @returns { token } — opaque ID for the pending account
   */
  createPendingChild: (body: {
    email: string;
    parentEmail: string;
    displayName: string;
    birthYear: number;
  }) =>
    request<{ token: string }>('/coppa/pending-child', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Confirm a pending account using the token from the parent's email.
   * @param body - { token }
   * @returns { uid, email } — the new child account's identifiers
   */
  confirmParentEmail: (body: { token: string }) =>
    request<{ uid: string; email: string }>('/coppa/confirm-parent-email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
```

- [ ] **Step 2: Modify Welcome to show the under-13 form when the standard signup is rejected**

In `apps/web/src/app/page.tsx`, change the existing Plan-3b A.4 catch branch:

```ts
if (code === 'UNDER_13_PIPELINE_REQUIRED') {
  return toast.error('Under 13: parent confirmation coming in Phase C.');
}
```

to:

```ts
if (code === 'UNDER_13_PIPELINE_REQUIRED') {
  setUnder13Mode(true);
  toast.message('Almost there — we just need a grown-up to confirm.');
  return;
}
```

And add new state at the top of the component:
```ts
const [under13Mode, setUnder13Mode] = useState(false);
const [parentEmail, setParentEmail] = useState('');
const [pendingToken, setPendingToken] = useState<string | null>(null);
```

In the `submit` handler, branch on `under13Mode`:

```ts
if (under13Mode) {
  if (!parentEmail.trim()) {
    return toast.error('Parent email required.');
  }
  try {
    const yearNum = Number(birthYear);
    const result = await coppaApi.createPendingChild({
      email: email.trim(),
      parentEmail: parentEmail.trim(),
      displayName: username.trim(),
      birthYear: yearNum,
    });
    setPendingToken(result.token);
    toast.success('A confirmation rune has flown to your parent.');
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? 'Pending signup failed.';
    toast.error(msg);
  }
  return;
}
```

When `pendingToken` is set, render an activation-pending state INSTEAD of the form:

```tsx
{pendingToken ? (
  <div className="panel rune-ring p-8 text-center">
    <h2 className="font-display text-2xl text-glow-primary">Awaiting Parent's Confirmation</h2>
    <p className="text-sm text-muted-foreground mt-3">
      We sent a confirmation rune to <span className="text-primary">{parentEmail}</span>.
      Once a grown-up clicks the link, your hero account will be ready.
    </p>
    <p className="text-[11px] text-muted-foreground mt-3">
      The link expires in 7 days. You can close this window.
    </p>
  </div>
) : (
  // …existing form
)}
```

Add a `parentEmail` field to the register form when `under13Mode` is true.

Add the import:
```ts
import { coppaApi } from '@/lib/api-client';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/lib/api-client.ts "apps/web/src/app/page.tsx"
git commit -m "feat(welcome): under-13 COPPA branch + activation-pending UI (P3-16)"
```

---

### Task C.6: Add `/confirm-parent/[token]` page

**Files:**
- Create: `apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx`

- [ ] **Step 1: Create the page**

Write to `apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { coppaApi } from '@/lib/api-client';

/** Force dynamic — token is per-request and the page calls a public POST. */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { token: string };
}

/**
 * Public COPPA confirmation page. The parent receives an email with a link
 * to /confirm-parent/[token]; clicking it lands here. The page POSTs the
 * token to the backend on mount (single-click confirmation — the parent
 * doesn't need to do anything else).
 *
 * Once confirmed, we surface a "your kid can now sign in" message and a
 * link to /login. The backend has generated a password-reset link for the
 * kid (logged server-side in Plan 3b C.3); follow-up plan iteration may
 * email that link separately.
 */
export default function ConfirmParentPage({ params }: PageProps) {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await coppaApi.confirmParentEmail({ token: params.token });
        if (!cancelled) setState('success');
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
        const code = apiErr.response?.data?.code;
        const msg = apiErr.response?.data?.message ?? apiErr.message ?? 'Confirmation failed.';
        setErrorMessage(code === 'TOKEN_EXPIRED' ? 'The link expired. Ask the hero to sign up again.' : msg);
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel rune-ring max-w-md w-full p-8 text-center animate-fade-in-up">
          {state === 'loading' && (
            <>
              <h1 className="font-display text-2xl text-glow-primary">Confirming…</h1>
              <p className="text-sm text-muted-foreground mt-3">The runes are aligning.</p>
            </>
          )}
          {state === 'success' && (
            <>
              <h1 className="font-display text-2xl text-glow-primary">Hero Confirmed</h1>
              <p className="text-sm text-muted-foreground mt-3">
                The account is ready. Tell your hero they can sign in now — they may need to
                reset their password from the login page.
              </p>
              <Link href="/login" className="inline-block mt-6">
                <GameButton variant="primary">Go to Sign-in</GameButton>
              </Link>
            </>
          )}
          {state === 'error' && (
            <>
              <h1 className="font-display text-2xl text-destructive">Confirmation failed</h1>
              <p className="text-sm text-muted-foreground mt-3">{errorMessage}</p>
              <Link href="/" className="inline-block mt-6">
                <GameButton variant="ghost">Back to Welcome</GameButton>
              </Link>
            </>
          )}
        </div>
      </main>
    </Scene>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx"
git commit -m "feat(coppa): /confirm-parent/[token] page invokes confirm endpoint on mount (P3-16)"
```

---

### Task C.7: CoppaService unit tests

**Files:**
- Create: `apps/api/src/modules/coppa/coppa.service.spec.ts`

- [ ] **Step 1: Write the spec**

Write to `apps/api/src/modules/coppa/coppa.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CoppaService } from './coppa.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { EmailService } from '../email/email.service';

describe('CoppaService', () => {
  let service: CoppaService;
  let firestoreMock: {
    collection: jest.Mock;
    batch: jest.Mock;
  };
  let firebaseAuthMock: {
    getUserByEmail: jest.Mock;
    createUser: jest.Mock;
    setCustomUserClaims: jest.Mock;
    generatePasswordResetLink: jest.Mock;
  };
  let usersMock: { create: jest.Mock };
  let emailMock: { sendCoppaConfirmation: jest.Mock };

  /** Build a fresh Firestore-doc mock with `get`/`set`/`delete` jest mocks. */
  const buildDocMock = (data?: object) => {
    const ref = {
      get: jest.fn().mockResolvedValue({ exists: !!data, data: () => data }),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    return ref;
  };

  beforeEach(async () => {
    firebaseAuthMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      setCustomUserClaims: jest.fn(),
      generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset.link/xyz'),
    };
    firestoreMock = {
      collection: jest.fn(),
      batch: jest.fn().mockReturnValue({
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      }),
    };
    usersMock = { create: jest.fn().mockResolvedValue(undefined) };
    emailMock = { sendCoppaConfirmation: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoppaService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: firestoreMock,
            auth: firebaseAuthMock,
          },
        },
        { provide: UsersRepository, useValue: usersMock },
        { provide: EmailService, useValue: emailMock },
      ],
    }).compile();

    service = module.get(CoppaService);
  });

  describe('createPendingChild', () => {
    const currentYear = new Date().getFullYear();
    const baseDto = (birthYear: number) => ({
      email: 'kid@realm.io',
      parentEmail: 'parent@realm.io',
      displayName: 'Spark',
      birthYear,
    });

    it('rejects age >= 13 with NOT_UNDER_13', async () => {
      await expect(service.createPendingChild(baseDto(currentYear - 13))).rejects.toMatchObject({
        response: { code: 'NOT_UNDER_13' },
      });
      expect(firebaseAuthMock.getUserByEmail).not.toHaveBeenCalled();
    });

    it('rejects when email already exists with EMAIL_ALREADY_EXISTS', async () => {
      firebaseAuthMock.getUserByEmail.mockResolvedValue({ uid: 'existing' });
      await expect(service.createPendingChild(baseDto(currentYear - 10))).rejects.toMatchObject({
        response: { code: 'EMAIL_ALREADY_EXISTS' },
      });
    });

    it('creates pending doc and sends email when valid', async () => {
      firebaseAuthMock.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
      const docMock = buildDocMock();
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      const result = await service.createPendingChild(baseDto(currentYear - 10));

      expect(result.token).toMatch(/^[a-f0-9]{32}$/);
      expect(docMock.set).toHaveBeenCalledTimes(1);
      expect(emailMock.sendCoppaConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          parentEmail: 'parent@realm.io',
          kidDisplayName: 'Spark',
        }),
      );
    });
  });

  describe('confirmParentEmail', () => {
    it('throws NotFound when token does not exist', async () => {
      const docMock = buildDocMock();
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      await expect(
        service.confirmParentEmail({ token: 'a'.repeat(32) }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects expired token with TOKEN_EXPIRED', async () => {
      const expired = new Date(Date.now() - 1000).toISOString();
      const docMock = buildDocMock({
        token: 'a'.repeat(32),
        email: 'kid@realm.io',
        parentEmail: 'parent@realm.io',
        displayName: 'Spark',
        birthYear: 2017,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: expired,
      });
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      await expect(
        service.confirmParentEmail({ token: 'a'.repeat(32) }),
      ).rejects.toMatchObject({ response: { code: 'TOKEN_EXPIRED' } });
    });

    it('creates Firebase user + Firestore profile + audit row on valid token', async () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const docMock = buildDocMock({
        token: 'a'.repeat(32),
        email: 'kid@realm.io',
        parentEmail: 'parent@realm.io',
        displayName: 'Spark',
        birthYear: 2017,
        createdAt: new Date().toISOString(),
        expiresAt: future,
      });
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });
      firebaseAuthMock.createUser.mockResolvedValue({ uid: 'new-uid' });

      const result = await service.confirmParentEmail({ token: 'a'.repeat(32) });
      expect(result.uid).toBe('new-uid');
      expect(firebaseAuthMock.setCustomUserClaims).toHaveBeenCalledWith('new-uid', { role: 'child' });
      expect(usersMock.create).toHaveBeenCalledWith(
        'new-uid',
        expect.objectContaining({ role: 'child', birthYear: 2017 }),
      );
      expect(firestoreMock.batch).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @eureka-lab/api test -- coppa.service.spec`

Expected: all tests pass.

- [ ] **Step 3: Commit**

```powershell
git add apps/api/src/modules/coppa/coppa.service.spec.ts
git commit -m "test(coppa): unit tests for createPendingChild + confirmParentEmail (P3-16)"
```

---

## Phase D — P3-17: Backend KP-credit endpoints

`InventoryService.awardKp(userId, event: KpEarnEvent)` already exists with daily-cap enforcement (see `apps/api/src/modules/inventory/inventory.service.ts:213`). All we need is to expose it via the controller and add idempotency so a retry from the client doesn't double-credit.

### Task D.1: Add `CreditKpDto` + endpoint with idempotency

**Files:**
- Create: `apps/api/src/modules/inventory/dto/credit-kp.dto.ts`
- Modify: `apps/api/src/modules/inventory/inventory.service.ts` (add `creditKpIdempotent`)
- Modify: `apps/api/src/modules/inventory/inventory.controller.ts` (add `POST /inventory/credit-kp`)

- [ ] **Step 1: Create the DTO**

Write to `apps/api/src/modules/inventory/dto/credit-kp.dto.ts`:

```ts
import { IsIn, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import type { KpEarnEvent } from '@eureka-lab/shared-types';

const EVENTS: KpEarnEvent[] = [
  'lesson_completed',
  'practice_completed',
  'minion_defeated',
  'guardian_defeated',
  'overlord_defeated',
  'daily_login',
];

/**
 * Request body for POST /inventory/credit-kp.
 * The server owns the reward amounts (KP_REWARDS) — the client just
 * names the event. `sourceId` provides idempotency: a repeat call with
 * the same sourceId returns the previously-awarded amount without
 * incrementing.
 */
export class CreditKpDto {
  /** Event type — maps to a server-side reward amount via KP_REWARDS. */
  @IsIn(EVENTS, { message: `event must be one of: ${EVENTS.join(', ')}` })
  event!: KpEarnEvent;

  /**
   * Opaque idempotency key. For lessons, use the lessonId. For battles,
   * use the battleId. For daily_login, use the YYYY-MM-DD date.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sourceId!: string;
}
```

- [ ] **Step 2: Add `creditKpIdempotent` to `InventoryService`**

Append to `InventoryService` (the class in `apps/api/src/modules/inventory/inventory.service.ts`):

```ts
/**
 * Award KP for an event with idempotency. A second call with the same
 * (userId, event, sourceId) tuple returns 0 without double-crediting.
 *
 * Persisted to `inventories/{userId}/kpEvents/{event}__{sourceId}`.
 *
 * @param userId - Firebase UID
 * @param event - The KP earn event type
 * @param sourceId - Opaque idempotency key (lessonId / battleId / date)
 * @returns KP actually credited (0 if duplicate or daily-cap-reached)
 */
async creditKpIdempotent(
  userId: string,
  event: KpEarnEvent,
  sourceId: string,
): Promise<{ granted: number; duplicate: boolean }> {
  const eventDocId = `${event}__${sourceId}`;
  const eventRef = this.firebase.firestore
    .collection(this.collection)
    .doc(userId)
    .collection('kpEvents')
    .doc(eventDocId);

  return this.firebase.firestore.runTransaction(async (txn) => {
    const snap = await txn.get(eventRef);
    if (snap.exists) {
      // Already credited — return 0 + duplicate flag.
      return { granted: 0, duplicate: true };
    }

    // Mark the event as processed BEFORE the award so a retry won't race.
    txn.set(eventRef, {
      event,
      sourceId,
      createdAt: new Date().toISOString(),
    });

    // The actual award lives outside this transaction (awardKp has its
    // own transaction for the daily cap + inventory write). Idempotency
    // here is "the event has been recognised" — a crash between this
    // tx commit and awardKp returning would lose the credit, which is
    // acceptable: better to under-award than to double-award.
    return { granted: -1, duplicate: false };
  })
  .then(async (interim) => {
    if (interim.duplicate) return interim;
    const granted = await this.awardKp(userId, event);
    return { granted, duplicate: false };
  });
}
```

Also export the `KpEarnEvent` type usage if needed — Top of file already imports `KpEarnEvent`.

- [ ] **Step 3: Add the controller endpoint**

In `apps/api/src/modules/inventory/inventory.controller.ts`, add:

```ts
/**
 * Credit KP for a game event. Server owns the amount via KP_REWARDS;
 * idempotency is provided by the (event, sourceId) tuple.
 *
 * @param user - Authenticated child user
 * @param dto - { event, sourceId }
 * @returns { granted, duplicate }
 */
@Post('inventory/credit-kp')
async creditKp(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CreditKpDto,
): Promise<{ granted: number; duplicate: boolean }> {
  this.logger.log(
    `creditKp: userId=${user.uid} event=${dto.event} sourceId=${dto.sourceId}`,
  );
  return this.inventoryService.creditKpIdempotent(user.uid, dto.event, dto.sourceId);
}
```

Add the import:
```ts
import { CreditKpDto } from './dto/credit-kp.dto';
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
git add apps/api/src/modules/inventory/dto/credit-kp.dto.ts apps/api/src/modules/inventory/inventory.service.ts apps/api/src/modules/inventory/inventory.controller.ts
git commit -m "feat(inventory): POST /inventory/credit-kp with idempotency via kpEvents subcoll (P3-17)"
```

---

### Task D.2: Wire `useGame.addKnowledge` + lesson/video to the new endpoint

**Files:**
- Modify: `apps/web/src/lib/api-client.ts` (add `inventoryApi.creditKp`)
- Modify: `apps/web/src/state/game-context.tsx`

- [ ] **Step 1: Add `inventoryApi.creditKp`**

In `apps/web/src/lib/api-client.ts`, add to the `inventoryApi` object:

```ts
/**
 * Credit KP for a game event. Idempotency via sourceId.
 * @param body - { event, sourceId }
 * @returns { granted, duplicate }
 */
creditKp: (body: { event: string; sourceId: string }) =>
  request<{ granted: number; duplicate: boolean }>(
    '/inventory/credit-kp',
    { method: 'POST', body: JSON.stringify(body) },
  ),
```

- [ ] **Step 2: Rewrite `completeLesson` and `watchVideo` in `useGame`**

In `apps/web/src/state/game-context.tsx`, replace the existing implementations of `completeLesson` and `watchVideo` (the ones with `// TODO(plan-3)` markers around lines 131-142):

```ts
completeLesson: (lessonId, _kp) => {
  if (academy.completedLessonIds.includes(lessonId)) return;
  academy.completeLesson(lessonId);
  // Server-authoritative KP award. Daily cap + idempotency are enforced
  // server-side; the response's `granted` is the actual amount credited
  // (may be 0 if the cap is reached for the day).
  void inventoryApi
    .creditKp({ event: 'lesson_completed', sourceId: lessonId })
    .then((res) => {
      if (res.granted > 0) inv.addKp(res.granted);
    })
    .catch(() => { /* offline tolerance */ });
},
watchVideo: (videoId, _kp) => {
  if (academy.watchedVideoIds.includes(videoId)) return;
  academy.watchVideo(videoId);
  void inventoryApi
    .creditKp({ event: 'practice_completed', sourceId: videoId })
    .then((res) => {
      if (res.granted > 0) inv.addKp(res.granted);
    })
    .catch(() => { /* offline tolerance */ });
},
```

Note: the `kp` parameter is now ignored (`_kp`) — the server owns the amount. The JSDoc on the interface should be updated too:

```ts
/**
 * Mark a lesson as completed and credit KP via the backend.
 * The `kp` arg is retained for source-compatibility but ignored — the
 * server owns the amount via KP_REWARDS.
 */
completeLesson: (lessonId: string, kp: number) => void;
```

(Apply the same JSDoc tweak to `watchVideo`.)

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/lib/api-client.ts apps/web/src/state/game-context.tsx
git commit -m "feat(state): wire useGame.completeLesson/watchVideo to /inventory/credit-kp (P3-17)"
```

---

### Task D.3: Wire battle victory to `creditKp`

**Files:**
- Modify: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/page.tsx`

The battle page awards KP on victory (and credits it locally). Replace the local award with a `creditKp` call.

- [ ] **Step 1: Find the victory branch**

Run the Grep tool:
- Pattern: `addKnowledge|addKp|setOutcome\(.win.`
- Path: `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/page.tsx`

Find the victory branch (where outcome becomes 'win'). Look for the existing call that credits KP locally.

- [ ] **Step 2: Replace the local KP award with a `creditKp` call**

In the victory branch, replace:

```ts
addKnowledge(120); // or whatever the existing amount is
```

with:

```ts
void inventoryApi
  .creditKp({ event: 'minion_defeated', sourceId: `${slug}:${missionId}` })
  .then((res) => {
    if (res.granted > 0) addKnowledge(res.granted);
  })
  .catch(() => { /* offline tolerance — local KP stays whatever the
                     previous useGame state was */ });
```

Add the import:
```ts
import { inventoryApi } from '@/lib/api-client';
```

The mission battle is currently treated as a 'minion' event uniformly. Future plan (combat validation P3-07) may differentiate guardian/overlord; for Plan 3b D.3 this is sufficient.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 4: Commit**

```powershell
git add "apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/page.tsx"
git commit -m "feat(battle): credit KP via /inventory/credit-kp on victory (P3-17)"
```

---

## Phase E — P3-18: Persistent academy progress

Replace the in-memory `academy-progress-store` with a Firestore-backed module. New backend module `academy-progress` exposes `GET /academy-progress` (hydrate) and `POST /academy-progress/complete-lesson` + `/watch-video` (mutate). The frontend store calls these on mount + on each mutation.

### Task E.1: Add `AcademyProgress` to `@eureka-lab/shared-types`

**Files:**
- Modify: `packages/shared-types/src/index.ts` (add type at the end of the file)

- [ ] **Step 1: Add the type**

Append to `packages/shared-types/src/index.ts`:

```ts
/**
 * Persistent per-user academy progress.
 * Stored at `academyProgress/{userId}` in Firestore.
 * Lazily created on first read (returns the empty default if absent).
 */
export interface AcademyProgress {
  /** Lesson IDs the user has completed (idempotent — no duplicates). */
  completedLessonIds: string[];
  /** Video IDs the user has watched. */
  watchedVideoIds: string[];
  /** Last update — ISO 8601 timestamp. */
  updatedAt: string;
}
```

- [ ] **Step 2: Rebuild shared-types**

Run:
```powershell
pnpm --filter @eureka-lab/shared-types build
```

Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```powershell
git add packages/shared-types/src/index.ts packages/shared-types/dist/
git commit -m "feat(shared-types): add AcademyProgress for persistent lesson/video tracking (P3-18)"
```

---

### Task E.2: Backend `academy-progress` module

**Files:**
- Create: `apps/api/src/modules/academy-progress/dto/complete-lesson.dto.ts`
- Create: `apps/api/src/modules/academy-progress/dto/watch-video.dto.ts`
- Create: `apps/api/src/modules/academy-progress/academy-progress.service.ts`
- Create: `apps/api/src/modules/academy-progress/academy-progress.controller.ts`
- Create: `apps/api/src/modules/academy-progress/academy-progress.module.ts`
- Modify: `apps/api/src/app.module.ts` (register module)

- [ ] **Step 1: Create the DTOs**

Write to `apps/api/src/modules/academy-progress/dto/complete-lesson.dto.ts`:

```ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CompleteLessonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lessonId!: string;
}
```

Write to `apps/api/src/modules/academy-progress/dto/watch-video.dto.ts`:

```ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class WatchVideoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  videoId!: string;
}
```

- [ ] **Step 2: Create the service**

Write to `apps/api/src/modules/academy-progress/academy-progress.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { AcademyProgress } from '@eureka-lab/shared-types';

const COLLECTION = 'academyProgress';

function emptyProgress(): AcademyProgress {
  return {
    completedLessonIds: [],
    watchedVideoIds: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Per-user academy progress storage. Lazily creates the doc on first
 * read (matching the inventory module's pattern).
 */
@Injectable()
export class AcademyProgressService {
  private readonly logger = new Logger(AcademyProgressService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /** Fetch (or lazily create) the user's academy progress. */
  async getProgress(userId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      const empty = emptyProgress();
      await ref.set(empty);
      return empty;
    }
    return snap.data() as AcademyProgress;
  }

  /**
   * Mark a lesson completed (idempotent).
   * @returns The updated AcademyProgress.
   */
  async completeLesson(userId: string, lessonId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      const current: AcademyProgress = snap.exists
        ? (snap.data() as AcademyProgress)
        : emptyProgress();
      if (current.completedLessonIds.includes(lessonId)) return current;
      const updated: AcademyProgress = {
        ...current,
        completedLessonIds: [...current.completedLessonIds, lessonId],
        updatedAt: new Date().toISOString(),
      };
      txn.set(ref, updated);
      return updated;
    });
  }

  /**
   * Mark a video watched (idempotent).
   * @returns The updated AcademyProgress.
   */
  async watchVideo(userId: string, videoId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      const current: AcademyProgress = snap.exists
        ? (snap.data() as AcademyProgress)
        : emptyProgress();
      if (current.watchedVideoIds.includes(videoId)) return current;
      const updated: AcademyProgress = {
        ...current,
        watchedVideoIds: [...current.watchedVideoIds, videoId],
        updatedAt: new Date().toISOString(),
      };
      txn.set(ref, updated);
      return updated;
    });
  }
}
```

- [ ] **Step 3: Create the controller**

Write to `apps/api/src/modules/academy-progress/academy-progress.controller.ts`:

```ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AcademyProgressService } from './academy-progress.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { WatchVideoDto } from './dto/watch-video.dto';
import type { AcademyProgress } from '@eureka-lab/shared-types';

@Controller('academy-progress')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('child')
export class AcademyProgressController {
  constructor(private readonly service: AcademyProgressService) {}

  @Get()
  async getProgress(@CurrentUser() user: AuthenticatedUser): Promise<AcademyProgress> {
    return this.service.getProgress(user.uid);
  }

  @Post('complete-lesson')
  async completeLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteLessonDto,
  ): Promise<AcademyProgress> {
    return this.service.completeLesson(user.uid, dto.lessonId);
  }

  @Post('watch-video')
  async watchVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WatchVideoDto,
  ): Promise<AcademyProgress> {
    return this.service.watchVideo(user.uid, dto.videoId);
  }
}
```

- [ ] **Step 4: Create the module + register in AppModule**

Write to `apps/api/src/modules/academy-progress/academy-progress.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AcademyProgressService } from './academy-progress.service';
import { AcademyProgressController } from './academy-progress.controller';

@Module({
  controllers: [AcademyProgressController],
  providers: [AcademyProgressService],
  exports: [AcademyProgressService],
})
export class AcademyProgressModule {}
```

Add `AcademyProgressModule` to the `imports` of `AppModule` (alongside `InventoryModule`).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`. Expected: 0 errors.

- [ ] **Step 6: Commit**

```powershell
git add apps/api/src/modules/academy-progress/ apps/api/src/app.module.ts
git commit -m "feat(academy-progress): backend module with GET/POST endpoints (P3-18)"
```

---

### Task E.3: Frontend `academyProgressApi` + store hydration

**Files:**
- Modify: `apps/web/src/lib/api-client.ts` (add `academyProgressApi`)
- Modify: `apps/web/src/stores/academy-progress-store.ts` (replace in-memory with hydrate + write-through)

- [ ] **Step 1: Add the API client**

In `apps/web/src/lib/api-client.ts`, add the import:
```ts
import type { AcademyProgress } from '@eureka-lab/shared-types';
```

And add this export near `inventoryApi`:

```ts
export const academyProgressApi = {
  /** Fetch the authenticated child's academy progress (lazy-creates if absent). */
  getMine: () => request<AcademyProgress>('/academy-progress'),
  /** Mark a lesson completed (idempotent). */
  completeLesson: (lessonId: string) =>
    request<AcademyProgress>('/academy-progress/complete-lesson', {
      method: 'POST',
      body: JSON.stringify({ lessonId }),
    }),
  /** Mark a video watched (idempotent). */
  watchVideo: (videoId: string) =>
    request<AcademyProgress>('/academy-progress/watch-video', {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    }),
};
```

- [ ] **Step 2: Replace the academy-progress-store**

Write to `apps/web/src/stores/academy-progress-store.ts`:

```ts
'use client';

import { create } from 'zustand';
import { academyProgressApi } from '@/lib/api-client';

/**
 * Persistent academy progress (P3-18). State mirrors the server's
 * `academyProgress/{userId}` doc and is hydrated on auth via the
 * `(learner)/layout.tsx` hook.
 */
interface AcademyProgressState {
  completedLessonIds: string[];
  watchedVideoIds: string[];
  /** True after the first hydrate() resolves. */
  hasHydrated: boolean;
  /** Mark a lesson as completed (idempotent). Writes through to backend. */
  completeLesson: (lessonId: string) => Promise<void>;
  /** Mark a video as watched (idempotent). Writes through to backend. */
  watchVideo: (videoId: string) => Promise<void>;
  /** Hydrate from backend on auth. */
  hydrate: () => Promise<void>;
  /** Clear both lists — called on logout. */
  reset: () => void;
}

export const useAcademyProgressStore = create<AcademyProgressState>((set, get) => ({
  completedLessonIds: [],
  watchedVideoIds: [],
  hasHydrated: false,

  hydrate: async () => {
    try {
      const data = await academyProgressApi.getMine();
      set({
        completedLessonIds: data.completedLessonIds,
        watchedVideoIds: data.watchedVideoIds,
        hasHydrated: true,
      });
    } catch {
      // Network/offline: stay empty but mark hydrated so the UI doesn't
      // get stuck on a loading state.
      set({ hasHydrated: true });
    }
  },

  completeLesson: async (lessonId) => {
    if (get().completedLessonIds.includes(lessonId)) return;
    // Optimistic-local + server write-through.
    const previous = get().completedLessonIds;
    set({ completedLessonIds: [...previous, lessonId] });
    try {
      const updated = await academyProgressApi.completeLesson(lessonId);
      set({ completedLessonIds: updated.completedLessonIds });
    } catch {
      // Roll back on failure.
      set({ completedLessonIds: previous });
    }
  },

  watchVideo: async (videoId) => {
    if (get().watchedVideoIds.includes(videoId)) return;
    const previous = get().watchedVideoIds;
    set({ watchedVideoIds: [...previous, videoId] });
    try {
      const updated = await academyProgressApi.watchVideo(videoId);
      set({ watchedVideoIds: updated.watchedVideoIds });
    } catch {
      set({ watchedVideoIds: previous });
    }
  },

  reset: () => set({ completedLessonIds: [], watchedVideoIds: [], hasHydrated: false }),
}));
```

- [ ] **Step 3: Wire hydrate into the learner layout**

In `apps/web/src/app/(learner)/layout.tsx`, find the existing `useEffect` that calls `hydrateCharacter()` + `hydrateInventory()`. Add `hydrateAcademy`:

```ts
const hydrateAcademy = useAcademyProgressStore((s) => s.hydrate);

useEffect(() => {
  if (isAuthenticated) {
    void hydrateCharacter();
    void hydrateInventory();
    void hydrateAcademy();
  }
}, [isAuthenticated, hydrateCharacter, hydrateInventory, hydrateAcademy]);
```

Add the import:
```ts
import { useAcademyProgressStore } from '@/stores/academy-progress-store';
```

- [ ] **Step 4: Update `useGame` to use the async signatures**

In `apps/web/src/state/game-context.tsx`, the `useGame.completeLesson` and `useGame.watchVideo` from D.2 call `academy.completeLesson(lessonId)` synchronously. Change to:

```ts
completeLesson: (lessonId, _kp) => {
  if (academy.completedLessonIds.includes(lessonId)) return;
  void academy.completeLesson(lessonId);
  void inventoryApi.creditKp({ event: 'lesson_completed', sourceId: lessonId })
    .then((res) => { if (res.granted > 0) inv.addKp(res.granted); })
    .catch(() => {});
},
watchVideo: (videoId, _kp) => {
  if (academy.watchedVideoIds.includes(videoId)) return;
  void academy.watchVideo(videoId);
  void inventoryApi.creditKp({ event: 'practice_completed', sourceId: videoId })
    .then((res) => { if (res.granted > 0) inv.addKp(res.granted); })
    .catch(() => {});
},
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: 24 errors (baseline).

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src/lib/api-client.ts apps/web/src/stores/academy-progress-store.ts "apps/web/src/app/(learner)/layout.tsx" apps/web/src/state/game-context.tsx
git commit -m "feat(academy-progress): persist via API; hydrate on auth; write-through on mutation (P3-18)"
```

---

## Phase F — Smoke + roadmap update

### Task F.1: End-to-end smoke (user-driven)

This task is YOUR smoke test, not the agent's. After all Phase A-E commits land:

- [ ] **Step 1: Restart dev servers**

```powershell
pnpm --filter @eureka-lab/api dev
pnpm --filter @eureka-lab/web dev
```

- [ ] **Step 2: Walk-through 1 — Existing adult accounts still work**

Sign in as your existing parent + teacher accounts (created in Plan 3a smoke). Expected: still routes to `/parent` and `/teacher`. No regressions.

- [ ] **Step 3: Walk-through 2 — Adult signup via /signup with birthYear**

Sign out. Navigate to `/signup`. Create an adult account with `birthYear: 1990`. Expected: backend derives `role: 'parent'`, frontend lands on `/parent`.

Try again with `birthYear: 2015` (age ~10). Expected: form blocks with "Adult signup is for ages 18+…".

- [ ] **Step 4: Walk-through 3 — Welcome adult signup gets routed to COPPA pivot**

Navigate to `/`. Begin Quest. Enter `birthYear: 2017` (age ~8). Expected: form pivots to under-13 mode, shows `parentEmail` field.

Submit with parent email. Expected: activation-pending screen appears. Check API server logs — `email_send_stub` event with the confirmation URL should be visible (since `RESEND_API_KEY` isn't set locally).

- [ ] **Step 5: Walk-through 4 — Parent confirms via the email link**

Copy the `confirmUrl` from the API logs (something like `http://localhost:3010/confirm-parent/<32-char-token>`). Open it in a new browser tab. Expected: confirmation page → "Hero Confirmed" → "Go to Sign-in" button.

Click sign-in. The kid never set a password (none is collected in the under-13 flow), so use Firebase's "Forgot password?" flow on the kid's email to set one, then log in. (The backend logged a `resetLink` at confirmation time — a follow-up plan can email that link to the kid/parent directly instead of relying on the forgot-password flow.)

- [ ] **Step 6: Walk-through 5 — KP persists on reload**

Sign in as a kid account (use an existing 13–16 child account). Visit `/dashboard` → click into a campaign → start a battle → win. KP awarded.

Visit `/inventory` → confirm KP balance. Now hit **browser refresh**. Expected: KP balance survives (was clobbered to 0 before Plan 3b D.3).

- [ ] **Step 7: Walk-through 6 — Lesson completion persists**

Visit `/campaign/<slug>/prepare` (Academy). Complete a lesson. Confirm "completed" indicator. Refresh. Lesson should remain marked complete.

- [ ] **Step 8: Walk-through 7 — Google OAuth birthYear modal**

(Optional — only if Firebase Google OAuth is configured locally.) Sign out. From `/`, click "Sign in with the Google Sigil". Sign in with a Google account that has NO Eureka profile yet. Expected: birthYear modal appears, you enter a year, submit → routed by derived role.

- [ ] **Step 9: Note any regressions**

Any regression → file as `fix(plan-3b):` commits before marking PR ready.

---

### Task F.2: Update ROADMAP + add ADR-007

**Files:**
- Modify: `ROADMAP.md`
- Create: `docs/context/ADR-007-server-side-role-derivation.md`

- [ ] **Step 1: Update ROADMAP Stream 2 — Plan 3b status**

In `ROADMAP.md`, find the Plan 3b row in the Stream 2 table. Change `**NOT WRITTEN**` to `**DONE**` and link the plan doc. Also remove the P3-14..18 + P3a-N7 rows from "Plan 3b proposed scope" — they're now done.

Also update Stream 4 (architectural gaps) by removing the "Role-aware post-auth router" row and the implicit "Teacher signup UI" row (which Plan 3b doesn't fix — leave it).

- [ ] **Step 2: Write ADR-007**

Write to `docs/context/ADR-007-server-side-role-derivation.md`:

```markdown
# ADR-007 — Server-side role derivation from birthYear

> **Status:** Accepted (2026-05-15 — landed via Plan 3b)
> **Supersedes:** the client-trusted role half of ADR-006.
> **Plan:** [Plan 3b — R5 + persistence](../superpowers/plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md), Phase A.

## Context

ADR-006 documented that the kid-signup flow trusts the client to compute and send the `role` field, with server-side derivation deferred to Plan 3. Plan 3b A.1–A.5 ships that derivation.

## Decision

`SignupDto.role` is removed from the public surface. The client sends only `birthYear`; the server computes the role:
- age 13–16 → `'child'`
- age 17 → reject with `AGE_GAP`
- age 18+ → `'parent'`
- age < 13 → reject with `UNDER_13_PIPELINE_REQUIRED` (the frontend then pivots to the COPPA pipeline at `POST /coppa/pending-child`)

`Google OAuth` users have no `birthYear` at sign-in time. After `signInWithPopup`, the frontend checks `/auth/me`; if 404, it prompts the user with `<OAuthBirthYearModal />` and POSTs `birthYear` to `POST /auth/complete-oauth-signup`, which re-uses the same `deriveRole()` helper.

Teacher accounts are NOT created via either endpoint — they require a separate flow that does not yet exist in UI (filed as ROADMAP Stream 4 gap "Teacher signup UI").

## Consequences

### Positive
- Role is no longer client-trusted (R5 fully closed).
- Server-side audit trail of the birthYear used at signup.
- COPPA pipeline pivot is unambiguous (specific error code triggers the under-13 form).

### Negative
- Existing accounts created pre-Plan-3b have no `birthYear` in Firestore. They keep their existing role; backfilling birthYear is a data migration that this ADR does not require.
- Adult OAuth users see one extra dialog (the birthYear modal). Acceptable; alternative is a separate adult-signup OAuth route which adds two-flow drift.

## Implementation pointer

- Backend: `apps/api/src/modules/auth/auth.service.ts:deriveRole`
- DTO: `apps/api/src/modules/auth/dto/signup.dto.ts`
- OAuth DTO: `apps/api/src/modules/auth/dto/complete-oauth-signup.dto.ts`
- OAuth modal: `apps/web/src/components/features/auth/OAuthBirthYearModal.tsx`
```

- [ ] **Step 3: Commit**

```powershell
git add ROADMAP.md docs/context/ADR-007-server-side-role-derivation.md
git commit -m "docs(planning): mark Plan 3b DONE; ADR-007 for server-side role derivation"
```

---

### Task F.3: Final tsc + lint clean

- [ ] **Step 1: Full tsc**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit
pnpm --filter @eureka-lab/api exec tsc --noEmit
```

Expected: web = 24 baseline errors, api = 0 errors.

- [ ] **Step 2: Full lint**

```powershell
pnpm --filter @eureka-lab/web lint
```

Expected: clean ("No ESLint warnings or errors").

- [ ] **Step 3: API tests**

```powershell
pnpm --filter @eureka-lab/api test
```

Expected: all tests pass (existing tests + the new ones added in A.3 and C.7).

- [ ] **Step 4: Surface push decision**

Per user preference: every push is individually approved. Show commit count + diff summary (`git log --oneline main..HEAD | head`) and ask whether to push.

---

## Acceptance checklist

- [ ] P3-14 closed: `SignupDto` accepts `birthYear` (not `role`); server derives role; unit tests cover age boundaries 12/13/16/17/18.
- [ ] P3-15 closed: `OAuthBirthYearModal` collects birthYear after Google OAuth; `POST /auth/complete-oauth-signup` creates the Firestore profile.
- [ ] P3-16 closed: under-13 signups create `pendingChildAccounts/{token}`; parent email link confirms; `coppaAuditLog` row written; `/confirm-parent/[token]` page renders confirmation.
- [ ] P3-17 closed: `POST /inventory/credit-kp` exists with idempotency via `kpEvents/{event}__{sourceId}`; `useGame` lesson/video/battle wired to it.
- [ ] P3-18 closed: `academyProgress/{userId}` collection persists `completedLessonIds` + `watchedVideoIds`; `academy-progress-store` hydrates on auth + writes through on mutation; learner layout includes the hydrate call.
- [ ] ADR-007 written; ROADMAP Stream 2 updated to show Plan 3b DONE; Stream 4 "role-aware routing" row removed.
- [ ] `pnpm --filter @eureka-lab/web exec tsc --noEmit` clean (24 pre-existing); api tsc 0 errors; web lint clean; api tests pass.
- [ ] Manual smoke (F.1 Steps 2–7) walks the kid + parent + adult + Google OAuth flows without console errors.

---

## Hand-off to Plan 3c (or whatever comes next)

Plan 3b closes the **R5 compliance pipeline** and the **learner persistence gaps**. What's still open:

**Plan 3c (next, polish):** i18n re-key (P3-08), new locale strings (P3-09), Arabic display font (P3-10), E2E suite rewrite (P3-11), retire `useMobileDetect` (P3-12), PWA + Sentry verification (P3-13), `AiTutorChat.chapterName` (P3-19), inner feature-component re-skin (P3a-N1), hardcoded English (P3a-N2), `(dashboard)/learn/*` decision (P3a-N3), `ui-store.sidebarOpen` prune (P3a-N4).

**Plan TBD (combat security):** P3-07 hybrid combat validation — explicitly deferred from Plan 3b. Backend replays the play log against a seeded RNG to validate outcomes. Not blocking ship; can wait until anti-cheat pressure shows up.

**Pre-redesign ship-blockers (ROADMAP Stream 3, untouched by Plan 3b):**
- STRIPE-001 webhook hardening
- COPPA-001 broader compliance review (Plan 3b ships the under-13 signup gate but does NOT audit existing data paths)
- DEPLOY-001 prod env vars
- QA-001 test coverage
- I18N-001 / SEC-001 / A11Y-001 / PERF-001

**Teacher signup UI** is still a ROADMAP Stream 4 gap. Adding it is small (~3-5 tasks) and could fold into Plan 3c or stand alone.

---

*Plan authored 2026-05-15 via `superpowers:writing-plans`. Mirrors the Plan 2 / Plan 3a structure (Phase A state/backend changes → Phase B/C/D/E feature work → Phase F smoke + acceptance). Targets the `redesign/v2-from-reference` branch on PR #8. After Plan 3b, the branch will be roughly 25–30 commits ahead of where it is at plan-write time.*
