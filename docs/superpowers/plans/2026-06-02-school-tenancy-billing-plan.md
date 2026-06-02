# School Tenancy 5a — B2B School Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-seat Stripe billing layer for school tenants — super-admin provisions an invoice-collected subscription (quantity = `seatLimit`), seat-limit edits prorate, payment status syncs via webhook, and the school-admin gets a Customer Portal link.

**Architecture:** New bounded `school-billing` NestJS module (service + controller) depending on the global `StripeService` and the exported `SchoolsRepository`. The existing consumer payments path is untouched except for one upstream "is this a school event?" branch in the shared `/payments/webhook` controller. Billing state rides on the `schools/{id}` doc (no new collection). Frontend adds a super-admin Billing panel and a school-admin billing badge + portal button.

**Tech Stack:** NestJS (Fastify), Stripe Node SDK (via `StripeService` abstraction), Firestore (`firebase-admin`), Jest + Supertest, Next.js 14 App Router, next-intl, TypeScript (no `any`).

**Spec:** [`docs/superpowers/specs/2026-06-02-school-tenancy-billing-design.md`](../specs/2026-06-02-school-tenancy-billing-design.md)

---

## Conventions (carried from 4a/4b — apply to every task)

- **API tests:** `pnpm --filter @eureka-lab/api exec jest --runInBand <path>`. Never `... test -- ...`. Add `NODE_OPTIONS=--max-old-space-size=6144` if OOM.
- **After editing `packages/shared-types/src/index.ts`:** `pnpm --filter @eureka-lab/shared-types build`. Commit only `src/` (the build emits `dist/`, which is gitignored / not staged).
- **Commit footer (every commit):** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task; conventional subjects. Use the Bash heredoc form `git commit -F - <<'EOF' … EOF`.
- **NestJS route ordering:** static routes (`@Get('me')`) declared **before** param routes (`@Get(':schoolId')`).
- **Controller specs** must `.overrideGuard(...)` every guard the controller uses.
- **No `console.log`** — use the NestJS `Logger`. **No `any`** — narrow `unknown`. **JSDoc** on every new function/param. Files **< 300 lines**. **class-validator** DTOs on all inputs.
- **Frontend:** inline feedback only (Sonner is broken app-wide — never `toast()`). i18n keys in **all three** locales (en/fr/ar). No frontend unit tests; success = `lint` clean + web `tsc` error count **stays 24**.
- **Do not stage** `.claude/settings.local.json`.

## File Structure

**Create:**
- `apps/api/src/modules/school-billing/school-billing.module.ts` — module wiring.
- `apps/api/src/modules/school-billing/school-billing.service.ts` — setup, summary, portal, webhook handlers, event matcher.
- `apps/api/src/modules/school-billing/school-billing.controller.ts` — the 4 endpoints.
- `apps/api/src/modules/school-billing/dto/create-school-subscription.dto.ts` — `{ billingEmail, trialDays? }`.
- `apps/api/src/modules/school-billing/school-billing.service.spec.ts`
- `apps/api/src/modules/school-billing/school-billing.controller.spec.ts`

**Modify:**
- `packages/shared-types/src/index.ts` — extend `SchoolSubscription`, add `billingEmail` to `School`, add `SchoolBillingSummary`.
- `apps/api/src/infrastructure/stripe/stripe.service.ts` — add `createSchoolSubscription`, `updateSubscriptionQuantity`.
- `apps/api/src/modules/schools/schools.repository.ts` — add `findByStripeSubscriptionId`, `findByStripeCustomerId`, and widen `updateSchool`'s allowed fields to the subscription block + `billingEmail`.
- `apps/api/src/modules/schools/schools.service.ts` — proration side-effect in `updateSchool`.
- `apps/api/src/modules/schools/schools.service.spec.ts` — proration test.
- `apps/api/src/modules/payments/payments.controller.ts` — webhook dispatch branch.
- `apps/api/src/modules/payments/payments.controller.spec.ts` — branch tests.
- `apps/api/src/app.module.ts` — register `SchoolBillingModule`.
- `apps/api/src/modules/payments/payments.module.ts` — import `SchoolBillingModule` (for the controller's new dependency).
- `apps/web/...` — super-admin Billing panel, school-admin badge + portal button, API client, i18n (Tasks 8–9, paths confirmed during those tasks).
- `context/env-variables.md`, `ROADMAP.md` — docs (Task 10).

---

## Task 1: Shared types — extend `SchoolSubscription`, add `billingEmail` + `SchoolBillingSummary`

**Files:**
- Modify: `packages/shared-types/src/index.ts:20-55` (the `SchoolSubscription` + `School` block)

- [ ] **Step 1: Edit the types**

In `packages/shared-types/src/index.ts`, replace the existing `SchoolSubscription` interface (currently `{ tier; status; periodEnd? }`) with:

```ts
/** School subscription — billing state (sub-project 5a) */
export interface SchoolSubscription {
  /** Plan tier label, e.g. 'trial' | 'standard' */
  tier: string;
  /** Status label mirroring Stripe: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' */
  status: string;
  /** Unix ms when the current period ends */
  periodEnd?: number;
  /** Stripe customer id (cus_...) */
  stripeCustomerId?: string;
  /** Stripe subscription id (sub_...) */
  stripeSubscriptionId?: string;
  /** Seat quantity last synced to Stripe (equals seatLimit at sync time) */
  seatQuantity?: number;
  /** How Stripe collects payment for this subscription */
  collectionMethod?: 'send_invoice' | 'charge_automatically';
}
```

In the `School` interface, add a `billingEmail` field after `loginCode`:

```ts
  /** Email Stripe sends invoices / portal links to (set at subscription setup) */
  billingEmail?: string;
```

After the `SchoolSummary` interface, add:

```ts
/** Billing view for the console (no secrets). */
export interface SchoolBillingSummary {
  schoolId: string;
  tier: string;
  /** active | trialing | past_due | canceled | none */
  status: string;
  seatLimit: number;
  seatsUsed: number;
  seatQuantity?: number;
  periodEnd?: number;
  hasSubscription: boolean;
  /** Hosted invoice URL from the last setup — super-admin view only */
  latestInvoiceUrl?: string;
}
```

- [ ] **Step 2: Build shared-types**

Run: `pnpm --filter @eureka-lab/shared-types build`
Expected: builds with 0 errors.

- [ ] **Step 3: Verify API still type-checks**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors (the new fields are additive/optional).

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types/src/index.ts
git commit -F - <<'EOF'
feat(types): school billing fields + SchoolBillingSummary

Extend SchoolSubscription with Stripe linkage (customer/subscription id,
seatQuantity, collectionMethod), add School.billingEmail, and a
SchoolBillingSummary console view. All additive/optional — sub-project 5a.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 2: `StripeService` — `createSchoolSubscription` + `updateSubscriptionQuantity`

**Files:**
- Modify: `apps/api/src/infrastructure/stripe/stripe.service.ts` (add two methods + a params interface near the top, after `CheckoutSessionParams`)

- [ ] **Step 1: Write the failing tests**

Append to `apps/api/src/infrastructure/stripe/stripe.service.spec.ts` (create the file if it does not exist; if it exists, add a `describe` block). Tests assert **mock-mode** behaviour (no `STRIPE_SECRET_KEY`), since that is what runs in CI:

```ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

describe('StripeService school billing (mock mode)', () => {
  let service: StripeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: { get: () => undefined } }, // no keys → mock mode
      ],
    }).compile();
    service = moduleRef.get(StripeService);
    service.onModuleInit(); // sets client = null (mock)
  });

  it('createSchoolSubscription returns a deterministic mock subscription', async () => {
    const res = await service.createSchoolSubscription({
      customerId: 'cus_x',
      priceId: 'price_seat',
      quantity: 30,
      daysUntilDue: 14,
      metadata: { schoolId: 's1' },
    });
    expect(res.subscriptionId).toMatch(/^sub_mock_/);
    expect(res.status).toBe('active');
    expect(typeof res.currentPeriodEnd).toBe('number');
  });

  it('updateSubscriptionQuantity returns a mock result in mock mode', async () => {
    const res = await service.updateSubscriptionQuantity('sub_x', 50);
    expect(res.seatQuantity).toBe(50);
    expect(res.status).toBe('active');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/infrastructure/stripe/stripe.service.spec.ts`
Expected: FAIL — `createSchoolSubscription`/`updateSubscriptionQuantity` are not functions.

- [ ] **Step 3: Add the params interface + methods**

Near the top of `stripe.service.ts`, after the `CheckoutSessionParams` interface, add:

```ts
/** Parameters for creating a per-seat school subscription. */
export interface SchoolSubscriptionParams {
  /** Stripe customer id (cus_...) */
  customerId: string;
  /** Per-seat recurring price id */
  priceId: string;
  /** Number of seats (= school seatLimit) */
  quantity: number;
  /** Days until an issued invoice is due */
  daysUntilDue: number;
  /** Optional trial length in days */
  trialDays?: number;
  /** Metadata stamped on the subscription (must include schoolId) */
  metadata: Record<string, string>;
}

/** Result of creating a school subscription. */
export interface SchoolSubscriptionResult {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: number;
  latestInvoiceUrl?: string;
}

/** Result of a quantity (proration) update. */
export interface QuantityUpdateResult {
  status: string;
  currentPeriodEnd: number;
  seatQuantity: number;
}
```

Add these two methods to the `StripeService` class (after `getSubscription`):

```ts
  /**
   * Create a per-seat school subscription billed by invoice.
   * @param params - Customer, price, quantity, invoice terms, optional trial, metadata.
   * @returns Subscription id, status, current period end, and hosted invoice URL.
   */
  async createSchoolSubscription(
    params: SchoolSubscriptionParams,
  ): Promise<SchoolSubscriptionResult> {
    if (!this.client) {
      const mockId = `sub_mock_${Date.now()}`;
      this.logger.warn({ event: 'stripe_mock', method: 'createSchoolSubscription', mockId });
      return {
        subscriptionId: mockId,
        status: params.trialDays ? 'trialing' : 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        latestInvoiceUrl: undefined,
      };
    }

    const sub = await this.client.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId, quantity: params.quantity }],
      collection_method: 'send_invoice',
      days_until_due: params.daysUntilDue,
      metadata: params.metadata,
      ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
      expand: ['latest_invoice'],
    });

    const invoice = sub.latest_invoice as Stripe.Invoice | null;
    this.logger.log({ event: 'stripe_school_subscription_created', subscriptionId: sub.id });
    return {
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      latestInvoiceUrl: invoice?.hosted_invoice_url ?? undefined,
    };
  }

  /**
   * Update a subscription's single line-item quantity, prorating the change.
   * @param subscriptionId - Stripe subscription id.
   * @param quantity - New seat quantity.
   * @returns Updated status, period end, and quantity.
   */
  async updateSubscriptionQuantity(
    subscriptionId: string,
    quantity: number,
  ): Promise<QuantityUpdateResult> {
    if (!this.client) {
      this.logger.warn({ event: 'stripe_mock', method: 'updateSubscriptionQuantity' });
      return {
        status: 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        seatQuantity: quantity,
      };
    }

    const current = await this.client.subscriptions.retrieve(subscriptionId);
    const itemId = current.items.data[0].id;
    const updated = await this.client.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, quantity }],
      proration_behavior: 'create_prorations',
    });
    this.logger.log({ event: 'stripe_subscription_quantity_updated', subscriptionId, quantity });
    return {
      status: updated.status,
      currentPeriodEnd: updated.current_period_end,
      seatQuantity: quantity,
    };
  }
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/infrastructure/stripe/stripe.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/infrastructure/stripe/stripe.service.ts apps/api/src/infrastructure/stripe/stripe.service.spec.ts
git commit -F - <<'EOF'
feat(stripe): per-seat school subscription + quantity proration

Add createSchoolSubscription (invoice collection, optional trial,
schoolId metadata, expands latest_invoice for the hosted URL) and
updateSubscriptionQuantity (create_prorations) to the StripeService
abstraction, with mock-mode fallbacks for keyless CI.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 3: `SchoolsRepository` — Stripe lookups + widen `updateSchool`

**Files:**
- Modify: `apps/api/src/modules/schools/schools.repository.ts`
- Modify: `apps/api/src/modules/schools/schools.repository.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `apps/api/src/modules/schools/schools.repository.spec.ts` (mirror the existing Firestore-mock style in that file). The repo uses `this.firebase.firestore.collection(...).where(...).limit(1).get()`; mock that chain:

```ts
describe('stripe lookups', () => {
  it('findByStripeSubscriptionId returns the matching school', async () => {
    const school = { id: 's1', subscription: { stripeSubscriptionId: 'sub_1' } };
    const get = jest.fn().mockResolvedValue({ empty: false, docs: [{ data: () => school }] });
    const where = jest.fn().mockReturnValue({ limit: () => ({ get }) });
    (firebase.firestore.collection as jest.Mock).mockReturnValue({ where });
    const res = await repo.findByStripeSubscriptionId('sub_1');
    expect(res).toEqual(school);
    expect(where).toHaveBeenCalledWith('subscription.stripeSubscriptionId', '==', 'sub_1');
  });

  it('findByStripeCustomerId returns null when empty', async () => {
    const get = jest.fn().mockResolvedValue({ empty: true, docs: [] });
    const where = jest.fn().mockReturnValue({ limit: () => ({ get }) });
    (firebase.firestore.collection as jest.Mock).mockReturnValue({ where });
    expect(await repo.findByStripeCustomerId('cus_x')).toBeNull();
  });
});
```

> If the existing spec's Firestore mock differs, follow its established shape — these assertions only need to confirm the `where(field, '==', value)` clause and the empty/non-empty mapping.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: FAIL — methods not defined.

- [ ] **Step 3: Add the methods + widen `updateSchool`**

In `schools.repository.ts`, change the `updateSchool` signature to accept the subscription block and `billingEmail`:

```ts
  /**
   * Update mutable school fields (status / seatLimit / subscription / billingEmail).
   * @param id - School id.
   * @param partial - Subset of mutable fields to write.
   */
  async updateSchool(
    id: string,
    partial: Partial<Pick<School, 'status' | 'seatLimit' | 'subscription' | 'billingEmail'>>,
  ): Promise<void> {
    await this.firebase.firestore.collection(this.collection).doc(id).update(partial);
  }
```

Add two query methods after `findById`:

```ts
  /**
   * Find a school by its Stripe subscription id (webhook subscription events).
   * @param subscriptionId - Stripe subscription id (sub_...).
   * @returns The school or null.
   */
  async findByStripeSubscriptionId(subscriptionId: string): Promise<School | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeSubscriptionId', '==', subscriptionId)
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as School);
  }

  /**
   * Find a school by its Stripe customer id (webhook invoice events).
   * @param customerId - Stripe customer id (cus_...).
   * @returns The school or null.
   */
  async findByStripeCustomerId(customerId: string): Promise<School | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as School);
  }
```

- [ ] **Step 4: Run to verify pass + type-check**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.repository.spec.ts`
Expected: PASS.
Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/schools/schools.repository.ts apps/api/src/modules/schools/schools.repository.spec.ts
git commit -F - <<'EOF'
feat(schools): repo Stripe lookups + widen updateSchool fields

Add findByStripeSubscriptionId / findByStripeCustomerId (webhook lookups)
and allow updateSchool to write the subscription block + billingEmail.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 4: `CreateSchoolSubscriptionDto`

**Files:**
- Create: `apps/api/src/modules/school-billing/dto/create-school-subscription.dto.ts`

- [ ] **Step 1: Write the DTO**

```ts
import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Body for super-admin subscription setup. */
export class CreateSchoolSubscriptionDto {
  /** Email Stripe sends invoices / portal links to. */
  @IsEmail()
  billingEmail!: string;

  /** Optional trial length in days (0–90). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  trialDays?: number;
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/school-billing/dto/create-school-subscription.dto.ts
git commit -F - <<'EOF'
feat(school-billing): CreateSchoolSubscriptionDto

class-validator DTO for super-admin subscription setup
(billingEmail + optional trialDays 0-90).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 5: `SchoolBillingService` — setup, summary, portal, webhooks, matcher

**Files:**
- Create: `apps/api/src/modules/school-billing/school-billing.service.ts`
- Create: `apps/api/src/modules/school-billing/school-billing.service.spec.ts`

A constant for invoice terms lives at the top of the service: `const DAYS_UNTIL_DUE = 14;` and the price id is read from config: `STRIPE_PRICE_ID_SCHOOL_SEAT`.

- [ ] **Step 1: Write the failing tests**

Create `school-billing.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolBillingService } from './school-billing.service';
import { SchoolsRepository } from '../schools/schools.repository';
import { StripeService } from '../../infrastructure/stripe/stripe.service';

const mockRepo = {
  findById: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  findByStripeCustomerId: jest.fn(),
  updateSchool: jest.fn(),
};
const mockStripe = {
  createCustomer: jest.fn(),
  createSchoolSubscription: jest.fn(),
  createPortalSession: jest.fn(),
};
const cfg = { get: (k: string) => (k === 'STRIPE_PRICE_ID_SCHOOL_SEAT' ? 'price_seat' : undefined) };

const baseSchool = {
  id: 's1', name: 'A', status: 'active', seatLimit: 30, seatsUsed: 2,
  adminUids: [], subscription: { tier: 'trial', status: 'none' },
  secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
};

describe('SchoolBillingService', () => {
  let service: SchoolBillingService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchoolBillingService,
        { provide: SchoolsRepository, useValue: mockRepo },
        { provide: StripeService, useValue: mockStripe },
        { provide: ConfigService, useValue: cfg },
      ],
    }).compile();
    service = moduleRef.get(SchoolBillingService);
  });

  describe('setUpSubscription', () => {
    it('creates a customer + subscription and persists linkage', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      mockStripe.createCustomer.mockResolvedValue({ id: 'cus_1', email: 'b@s.edu' });
      mockStripe.createSchoolSubscription.mockResolvedValue({
        subscriptionId: 'sub_1', status: 'active', currentPeriodEnd: 123, latestInvoiceUrl: 'https://inv',
      });
      const res = await service.setUpSubscription('s1', { billingEmail: 'b@s.edu' });
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cus_1', priceId: 'price_seat', quantity: 30, metadata: { schoolId: 's1' } }),
      );
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({
        billingEmail: 'b@s.edu',
        subscription: expect.objectContaining({ stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1', status: 'active', seatQuantity: 30 }),
      }));
      expect(res.latestInvoiceUrl).toBe('https://inv');
      expect(res.hasSubscription).toBe(true);
    });

    it('passes trialDays through when provided', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      mockStripe.createCustomer.mockResolvedValue({ id: 'cus_1', email: 'b@s.edu' });
      mockStripe.createSchoolSubscription.mockResolvedValue({ subscriptionId: 'sub_1', status: 'trialing', currentPeriodEnd: 1 });
      await service.setUpSubscription('s1', { billingEmail: 'b@s.edu', trialDays: 14 });
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(expect.objectContaining({ trialDays: 14 }));
    });

    it('reuses an existing stripeCustomerId', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'trial', status: 'none', stripeCustomerId: 'cus_old' } });
      mockStripe.createSchoolSubscription.mockResolvedValue({ subscriptionId: 'sub_2', status: 'active', currentPeriodEnd: 1 });
      await service.setUpSubscription('s1', { billingEmail: 'b@s.edu' });
      expect(mockStripe.createCustomer).not.toHaveBeenCalled();
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cus_old' }));
    });

    it('rejects when a subscription already exists', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_existing' } });
      await expect(service.setUpSubscription('s1', { billingEmail: 'b@s.edu' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when the school is missing', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.setUpSubscription('s1', { billingEmail: 'b@s.edu' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createPortalLink', () => {
    it('throws BadRequest when no customer', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      await expect(service.createPortalLink('s1', 'https://ret')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('returns a portal url', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'active', stripeCustomerId: 'cus_1' } });
      mockStripe.createPortalSession.mockResolvedValue({ url: 'https://portal' });
      expect(await service.createPortalLink('s1', 'https://ret')).toEqual({ url: 'https://portal' });
    });
  });

  describe('getBillingSummary', () => {
    it('maps the school doc to a summary', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'past_due', stripeSubscriptionId: 'sub_1', seatQuantity: 30, periodEnd: 99 } });
      const s = await service.getBillingSummary('s1');
      expect(s).toEqual(expect.objectContaining({ schoolId: 's1', tier: 'standard', status: 'past_due', seatLimit: 30, seatsUsed: 2, hasSubscription: true }));
    });
  });

  describe('handleWebhookEvent', () => {
    it('subscription.updated syncs status/periodEnd/qty', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', current_period_end: 200, items: { data: [{ quantity: 40 }] } });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'active', periodEnd: 200, seatQuantity: 40 }) }));
    });
    it('invoice.payment_failed marks past_due via customer lookup', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('invoice.payment_failed', { customer: 'cus_1' });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'past_due' }) }));
    });
    it('invoice.paid marks active', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('invoice.paid', { customer: 'cus_1' });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'active' }) }));
    });
    it('subscription.deleted marks canceled, never suspends', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('customer.subscription.deleted', { id: 'sub_1' });
      const arg = mockRepo.updateSchool.mock.calls[0][1];
      expect(arg.subscription.status).toBe('canceled');
      expect(arg.status).toBeUndefined(); // school status untouched
    });
    it('no-ops when no school matches', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(null);
      await service.handleWebhookEvent('customer.subscription.updated', { id: 'sub_x', status: 'active' });
      expect(mockRepo.updateSchool).not.toHaveBeenCalled();
    });
  });

  describe('matchesSchoolEvent', () => {
    it('true for subscription event with schoolId metadata', async () => {
      expect(await service.matchesSchoolEvent({ type: 'customer.subscription.updated', data: { object: { metadata: { schoolId: 's1' } } } } as never)).toBe(true);
    });
    it('false for subscription event with userId metadata', async () => {
      expect(await service.matchesSchoolEvent({ type: 'customer.subscription.updated', data: { object: { metadata: { userId: 'u1' } } } } as never)).toBe(false);
    });
    it('invoice event resolves via customer lookup', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      expect(await service.matchesSchoolEvent({ type: 'invoice.paid', data: { object: { customer: 'cus_1' } } } as never)).toBe(true);
    });
    it('invoice event with unknown customer is not a school event', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(null);
      expect(await service.matchesSchoolEvent({ type: 'invoice.payment_failed', data: { object: { customer: 'cus_z' } } } as never)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-billing/school-billing.service.spec.ts`
Expected: FAIL — `SchoolBillingService` cannot be found.

- [ ] **Step 3: Implement the service**

Create `school-billing.service.ts`:

```ts
import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { School, SchoolBillingSummary, SchoolSubscription } from '@eureka-lab/shared-types';
import { SchoolsRepository } from '../schools/schools.repository';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { CreateSchoolSubscriptionDto } from './dto/create-school-subscription.dto';

/** Days until an issued school invoice is due. */
const DAYS_UNTIL_DUE = 14;

/**
 * B2B school billing: super-admin subscription setup, payment status sync,
 * and the school-admin Customer Portal link. Billing state lives on the
 * `schools/{id}` doc; consumer billing (PaymentsService) is untouched.
 */
@Injectable()
export class SchoolBillingService {
  private readonly logger = new Logger(SchoolBillingService.name);
  private readonly seatPriceId: string;

  constructor(
    private readonly schools: SchoolsRepository,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {
    this.seatPriceId = this.config.get<string>('STRIPE_PRICE_ID_SCHOOL_SEAT') ?? '';
  }

  /**
   * Set up a per-seat subscription for a school (super_admin action).
   * @param schoolId - Target school id.
   * @param dto - billingEmail + optional trialDays.
   * @returns The resulting billing summary (incl. latestInvoiceUrl).
   * @throws NotFoundException when the school is missing.
   * @throws ConflictException when a subscription already exists.
   * @throws BadRequestException when the seat price id is not configured.
   */
  async setUpSubscription(
    schoolId: string,
    dto: CreateSchoolSubscriptionDto,
  ): Promise<SchoolBillingSummary> {
    const school = await this.schools.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    if (school.subscription.stripeSubscriptionId) {
      throw new ConflictException({ message: 'Subscription already exists', code: 'SUBSCRIPTION_EXISTS' });
    }
    if (!this.seatPriceId) {
      throw new BadRequestException({ message: 'Seat price not configured', code: 'PRICE_NOT_CONFIGURED' });
    }

    let customerId = school.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.createCustomer(dto.billingEmail, school.name, { schoolId });
      customerId = customer.id;
    }

    const result = await this.stripe.createSchoolSubscription({
      customerId,
      priceId: this.seatPriceId,
      quantity: school.seatLimit,
      daysUntilDue: DAYS_UNTIL_DUE,
      trialDays: dto.trialDays,
      metadata: { schoolId },
    });

    const subscription: SchoolSubscription = {
      tier: school.subscription.tier,
      status: result.status,
      periodEnd: result.currentPeriodEnd,
      stripeCustomerId: customerId,
      stripeSubscriptionId: result.subscriptionId,
      seatQuantity: school.seatLimit,
      collectionMethod: 'send_invoice',
    };
    await this.schools.updateSchool(schoolId, { subscription, billingEmail: dto.billingEmail });

    this.logger.log({ event: 'school_subscription_setup', schoolId, subscriptionId: result.subscriptionId });
    return this.toSummary({ ...school, subscription, billingEmail: dto.billingEmail }, result.latestInvoiceUrl);
  }

  /**
   * Billing summary for any school (super_admin view).
   * @param schoolId - School id.
   * @returns Billing summary.
   * @throws NotFoundException when missing.
   */
  async getBillingSummary(schoolId: string): Promise<SchoolBillingSummary> {
    const school = await this.requireSchool(schoolId);
    return this.toSummary(school);
  }

  /**
   * Billing summary for the caller's own school (school_admin view, no invoice URL).
   * @param schoolId - The caller's schoolId claim.
   * @returns Billing summary.
   * @throws NotFoundException when missing.
   */
  async getOwnBillingSummary(schoolId: string): Promise<SchoolBillingSummary> {
    const school = await this.requireSchool(schoolId);
    return this.toSummary(school);
  }

  /**
   * Create a Customer Portal session for a school.
   * @param schoolId - School id.
   * @param returnUrl - URL to return to after the portal.
   * @returns The portal URL.
   * @throws NotFoundException when the school is missing.
   * @throws BadRequestException when the school has no Stripe customer.
   */
  async createPortalLink(schoolId: string, returnUrl: string): Promise<{ url: string }> {
    const school = await this.requireSchool(schoolId);
    const customerId = school.subscription.stripeCustomerId;
    if (!customerId) {
      throw new BadRequestException({ message: 'No subscription found', code: 'NO_SUBSCRIPTION' });
    }
    return this.stripe.createPortalSession(customerId, returnUrl);
  }

  /**
   * Decide whether a Stripe event belongs to a school (vs consumer).
   * Subscription events carry metadata.schoolId; invoice events are resolved
   * by looking up the customer id (invoices do not inherit sub metadata).
   * @param event - Stripe event ({ type, data.object }).
   * @returns True when the event targets a school.
   */
  async matchesSchoolEvent(event: {
    type: string;
    data: { object: Record<string, unknown> };
  }): Promise<boolean> {
    const obj = event.data.object;
    if (event.type.startsWith('customer.subscription.')) {
      const metadata = obj['metadata'] as Record<string, string> | undefined;
      return Boolean(metadata?.['schoolId']);
    }
    if (event.type.startsWith('invoice.')) {
      const customerId = obj['customer'] as string | undefined;
      if (!customerId) return false;
      return Boolean(await this.schools.findByStripeCustomerId(customerId));
    }
    return false;
  }

  /**
   * Apply a verified school billing webhook event to the school doc.
   * @param eventType - Stripe event type.
   * @param data - Event data object.
   */
  async handleWebhookEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    switch (eventType) {
      case 'customer.subscription.updated':
        await this.syncFromSubscription(data, { status: data['status'] as string });
        break;
      case 'customer.subscription.deleted':
        await this.syncFromSubscription(data, { status: 'canceled' });
        break;
      case 'invoice.payment_failed':
        await this.syncFromCustomer(data, 'past_due');
        break;
      case 'invoice.paid':
        await this.syncFromCustomer(data, 'active');
        break;
      default:
        this.logger.log({ event: 'school_webhook_ignored', eventType });
    }
  }

  /**
   * Update a school's subscription status from a subscription-shaped event.
   * @param data - Subscription event object (id, status, current_period_end, items).
   * @param override - Status override (e.g. 'canceled').
   */
  private async syncFromSubscription(
    data: Record<string, unknown>,
    override: { status: string },
  ): Promise<void> {
    const subscriptionId = data['id'] as string | undefined;
    if (!subscriptionId) return;
    const school = await this.schools.findByStripeSubscriptionId(subscriptionId);
    if (!school) {
      this.logger.warn({ event: 'school_webhook_no_match', subscriptionId });
      return;
    }
    const periodEnd = data['current_period_end'] as number | undefined;
    const items = data['items'] as { data?: Array<{ quantity?: number }> } | undefined;
    const qty = items?.data?.[0]?.quantity;
    const subscription: SchoolSubscription = {
      ...school.subscription,
      status: override.status,
      ...(periodEnd !== undefined ? { periodEnd } : {}),
      ...(qty !== undefined ? { seatQuantity: qty } : {}),
    };
    await this.schools.updateSchool(school.id, { subscription });
    this.logger.log({ event: 'school_subscription_synced', schoolId: school.id, status: override.status });
  }

  /**
   * Update a school's subscription status from an invoice-shaped event.
   * @param data - Invoice event object (customer).
   * @param status - New status ('past_due' | 'active').
   */
  private async syncFromCustomer(data: Record<string, unknown>, status: string): Promise<void> {
    const customerId = data['customer'] as string | undefined;
    if (!customerId) return;
    const school = await this.schools.findByStripeCustomerId(customerId);
    if (!school) {
      this.logger.warn({ event: 'school_webhook_no_match', customerId });
      return;
    }
    const subscription: SchoolSubscription = { ...school.subscription, status };
    await this.schools.updateSchool(school.id, { subscription });
    this.logger.log({ event: 'school_invoice_synced', schoolId: school.id, status });
  }

  /**
   * Load a school or throw NotFound.
   * @param schoolId - School id.
   * @returns The school.
   */
  private async requireSchool(schoolId: string): Promise<School> {
    const school = await this.schools.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    return school;
  }

  /**
   * Map a school doc to a billing summary.
   * @param school - The school.
   * @param latestInvoiceUrl - Optional hosted invoice URL (super-admin setup only).
   * @returns The summary.
   */
  private toSummary(school: School, latestInvoiceUrl?: string): SchoolBillingSummary {
    const sub = school.subscription;
    return {
      schoolId: school.id,
      tier: sub.tier,
      status: sub.status,
      seatLimit: school.seatLimit,
      seatsUsed: school.seatsUsed,
      seatQuantity: sub.seatQuantity,
      periodEnd: sub.periodEnd,
      hasSubscription: Boolean(sub.stripeSubscriptionId),
      latestInvoiceUrl,
    };
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-billing/school-billing.service.spec.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Type-check + file length**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors. Confirm `school-billing.service.ts` is < 300 lines (it is ~250; if it creeps over, split the webhook handlers into a sibling `school-billing-webhooks.service.ts`).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/school-billing/school-billing.service.ts apps/api/src/modules/school-billing/school-billing.service.spec.ts
git commit -F - <<'EOF'
feat(school-billing): billing service (setup, summary, portal, webhooks)

Super-admin subscription setup (per-seat on seatLimit, optional trial,
invoice collection), billing-summary mapping, school-admin portal link,
event-type-aware webhook sync (subscription metadata vs invoice customer
lookup), and matchesSchoolEvent router. Never suspends a school on
cancel/failure — status stays decoupled from access.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 6: `SchoolBillingController` + module wiring

**Files:**
- Create: `apps/api/src/modules/school-billing/school-billing.controller.ts`
- Create: `apps/api/src/modules/school-billing/school-billing.controller.spec.ts`
- Create: `apps/api/src/modules/school-billing/school-billing.module.ts`
- Modify: `apps/api/src/app.module.ts` (register the module)

- [ ] **Step 1: Write the failing controller test**

Create `school-billing.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SchoolBillingController } from './school-billing.controller';
import { SchoolBillingService } from './school-billing.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const mockService = {
  setUpSubscription: jest.fn(),
  getBillingSummary: jest.fn(),
  getOwnBillingSummary: jest.fn(),
  createPortalLink: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };
const superAdmin = { uid: 'sa-1', email: 'sa@x.io', role: 'super_admin' } as AuthenticatedUser;
const admin = { uid: 'ad-1', email: 'a@s.edu', role: 'school_admin', schoolId: 's1' } as AuthenticatedUser;
const adminNoSchool = { uid: 'ad-2', email: 'b@s.edu', role: 'school_admin' } as AuthenticatedUser;

describe('SchoolBillingController', () => {
  let controller: SchoolBillingController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SchoolBillingController],
      providers: [{ provide: SchoolBillingService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolBillingController);
  });

  it('setUp delegates schoolId + dto', async () => {
    mockService.setUpSubscription.mockResolvedValueOnce({ schoolId: 's1', hasSubscription: true });
    expect(await controller.setUp('s1', { billingEmail: 'b@s.edu' })).toEqual({ schoolId: 's1', hasSubscription: true });
    expect(mockService.setUpSubscription).toHaveBeenCalledWith('s1', { billingEmail: 'b@s.edu' });
  });

  it('get delegates schoolId', async () => {
    mockService.getBillingSummary.mockResolvedValueOnce({ schoolId: 's1' });
    expect(await controller.get('s1')).toEqual({ schoolId: 's1' });
  });

  it('me reads the caller schoolId claim', async () => {
    mockService.getOwnBillingSummary.mockResolvedValueOnce({ schoolId: 's1' });
    expect(await controller.me(admin)).toEqual({ schoolId: 's1' });
    expect(mockService.getOwnBillingSummary).toHaveBeenCalledWith('s1');
  });

  it('me throws when the claim is missing', async () => {
    await expect(controller.me(adminNoSchool)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('portal uses the caller schoolId claim, not the body', async () => {
    mockService.createPortalLink.mockResolvedValueOnce({ url: 'https://p' });
    expect(await controller.portal(admin, { returnUrl: 'https://r' })).toEqual({ url: 'https://p' });
    expect(mockService.createPortalLink).toHaveBeenCalledWith('s1', 'https://r');
  });

  it('portal throws when the claim is missing', async () => {
    await expect(controller.portal(adminNoSchool, { returnUrl: 'https://r' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

> Note the controller takes a `PortalSessionDto { returnUrl }`. Reuse the existing `apps/api/src/modules/payments/dto/portal-session.dto.ts` by importing it (it already validates `returnUrl`). If importing across modules is undesirable, create a local copy `dto/portal-session.dto.ts` with the same shape — confirm the existing DTO's contents first.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-billing/school-billing.controller.spec.ts`
Expected: FAIL — controller not found.

- [ ] **Step 3: Implement the controller**

Create `school-billing.controller.ts` (static `portal`/`me` routes BEFORE the `:schoolId` routes):

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
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { SchoolBillingSummary } from '@eureka-lab/shared-types';
import { SchoolBillingService } from './school-billing.service';
import { CreateSchoolSubscriptionDto } from './dto/create-school-subscription.dto';
import { PortalSessionDto } from '../payments/dto/portal-session.dto';

/**
 * B2B school billing endpoints. Super-admin sets up + reads any school's
 * billing; school_admin reads/manages only their own school (schoolId from
 * the verified token claim — no :id to spoof, so TenantGuard is not needed).
 */
@Controller('school-billing')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SchoolBillingController {
  constructor(private readonly billing: SchoolBillingService) {}

  /**
   * Customer Portal link for the caller's own school.
   * @param user - Authenticated school_admin (schoolId from claim).
   * @param dto - Return URL.
   * @returns The portal URL.
   */
  @Post('portal')
  @Roles('school_admin')
  @HttpCode(HttpStatus.OK)
  async portal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PortalSessionDto,
  ): Promise<{ url: string }> {
    return this.billing.createPortalLink(this.requireSchoolId(user), dto.returnUrl);
  }

  /**
   * Billing summary for the caller's own school (badge).
   * @param user - Authenticated school_admin (schoolId from claim).
   * @returns Billing summary.
   */
  @Get('me')
  @Roles('school_admin')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<SchoolBillingSummary> {
    return this.billing.getOwnBillingSummary(this.requireSchoolId(user));
  }

  /**
   * Set up a subscription for a school (super_admin).
   * @param schoolId - Target school id.
   * @param dto - billingEmail + optional trialDays.
   * @returns Billing summary incl. invoice URL.
   */
  @Post(':schoolId/subscription')
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  async setUp(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSchoolSubscriptionDto,
  ): Promise<SchoolBillingSummary> {
    return this.billing.setUpSubscription(schoolId, dto);
  }

  /**
   * Billing summary for any school (super_admin).
   * @param schoolId - School id.
   * @returns Billing summary.
   */
  @Get(':schoolId')
  @Roles('super_admin')
  async get(@Param('schoolId') schoolId: string): Promise<SchoolBillingSummary> {
    return this.billing.getBillingSummary(schoolId);
  }

  /**
   * Resolve the caller's schoolId claim or reject.
   * @param user - Authenticated user.
   * @returns The schoolId.
   * @throws ForbiddenException when the claim is absent.
   */
  private requireSchoolId(user: AuthenticatedUser): string {
    if (!user.schoolId) {
      throw new ForbiddenException({ message: 'No school claim', code: 'NO_SCHOOL_CLAIM' });
    }
    return user.schoolId;
  }
}
```

Create `school-billing.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { SchoolBillingController } from './school-billing.controller';
import { SchoolBillingService } from './school-billing.service';
import { SchoolsModule } from '../schools/schools.module';

/**
 * School billing module — per-seat B2B subscriptions.
 * Imports SchoolsModule for SchoolsRepository; StripeModule is global.
 */
@Module({
  imports: [SchoolsModule],
  controllers: [SchoolBillingController],
  providers: [SchoolBillingService],
  exports: [SchoolBillingService],
})
export class SchoolBillingModule {}
```

Register `SchoolBillingModule` in `apps/api/src/app.module.ts` (add the import and list it in the `imports` array next to `SchoolsModule`).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-billing/school-billing.controller.spec.ts`
Expected: PASS.

- [ ] **Step 5: Boot-check the module graph + type-check**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/school-billing`
Expected: both suites PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/school-billing/school-billing.controller.ts apps/api/src/modules/school-billing/school-billing.controller.spec.ts apps/api/src/modules/school-billing/school-billing.module.ts apps/api/src/app.module.ts
git commit -F - <<'EOF'
feat(school-billing): controller + module wiring

Four endpoints: super-admin POST/GET :schoolId (setup + summary),
school-admin POST /portal + GET /me (own school via token claim, static
routes first). Register SchoolBillingModule in AppModule.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 7: Webhook dispatch branch in `PaymentsController`

**Files:**
- Modify: `apps/api/src/modules/payments/payments.controller.ts` (inject `SchoolBillingService`, branch in `handleWebhook`)
- Modify: `apps/api/src/modules/payments/payments.module.ts` (import `SchoolBillingModule`)
- Modify: `apps/api/src/modules/payments/payments.controller.spec.ts` (provide the new dep, add branch tests)

- [ ] **Step 1: Extend the controller test**

In `payments.controller.spec.ts`, add a `mockSchoolBilling = { matchesSchoolEvent: jest.fn(), handleWebhookEvent: jest.fn() }` and register `{ provide: SchoolBillingService, useValue: mockSchoolBilling }` in the providers. Add tests:

```ts
it('routes a school event to SchoolBillingService', async () => {
  const event = { id: 'evt_1', type: 'customer.subscription.updated', data: { object: { metadata: { schoolId: 's1' } } } };
  mockStripeService.constructWebhookEvent.mockReturnValue(event);
  mockSchoolBilling.matchesSchoolEvent.mockResolvedValue(true);
  await controller.handleWebhook(buildReq('{}', 'sig'), 'sig', buildRes());
  expect(mockSchoolBilling.handleWebhookEvent).toHaveBeenCalledWith(event.type, event.data.object);
  expect(mockPaymentsService.handleWebhookEvent).not.toHaveBeenCalled();
});

it('routes a consumer event to PaymentsService', async () => {
  const event = { id: 'evt_2', type: 'customer.subscription.updated', data: { object: { metadata: { userId: 'u1' } } } };
  mockStripeService.constructWebhookEvent.mockReturnValue(event);
  mockSchoolBilling.matchesSchoolEvent.mockResolvedValue(false);
  await controller.handleWebhook(buildReq('{}', 'sig'), 'sig', buildRes());
  expect(mockPaymentsService.handleWebhookEvent).toHaveBeenCalledWith(event.type, event.data.object);
  expect(mockSchoolBilling.handleWebhookEvent).not.toHaveBeenCalled();
});
```

> `buildRes()` should return `{ status: () => ({ send: jest.fn() }) }` (a minimal FastifyReply). Reuse/extend the existing `buildReq` helper in that spec.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/payments/payments.controller.spec.ts`
Expected: FAIL — `SchoolBillingService` not provided / not injected.

- [ ] **Step 3: Implement the branch**

In `payments.controller.ts`, inject the service in the constructor:

```ts
import { SchoolBillingService } from '../school-billing/school-billing.service';
// ...
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly schoolBilling: SchoolBillingService,
  ) {}
```

Replace the dispatch tail of `handleWebhook` (currently the single `await this.paymentsService.handleWebhookEvent(...)` call) with:

```ts
    const eventObject = event.data.object as unknown as Record<string, unknown>;
    const isSchoolEvent = await this.schoolBilling.matchesSchoolEvent({
      type: event.type,
      data: { object: eventObject },
    });

    if (isSchoolEvent) {
      await this.schoolBilling.handleWebhookEvent(event.type, eventObject);
    } else {
      await this.paymentsService.handleWebhookEvent(event.type, eventObject);
    }

    await res.status(HttpStatus.OK).send({ received: true });
```

In `payments.module.ts`, import `SchoolBillingModule` so the controller can inject the service:

```ts
import { SchoolBillingModule } from '../school-billing/school-billing.module';
// imports: [UsersModule, SchoolBillingModule],
```

> `SchoolBillingModule` exports `SchoolBillingService`. There is no cycle: payments → school-billing → schools; school-billing does not import payments.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/payments/payments.controller.spec.ts`
Expected: PASS (existing webhook tests + 2 new branch tests).

- [ ] **Step 5: Full API suite + type-check**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all suites pass (baseline was 37 suites / 363 tests; this adds suites + tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/payments/payments.controller.ts apps/api/src/modules/payments/payments.controller.spec.ts apps/api/src/modules/payments/payments.module.ts
git commit -F - <<'EOF'
feat(payments): route school billing events on the shared webhook

Add a thin upstream branch to /payments/webhook: matchesSchoolEvent
dispatches school events to SchoolBillingService, everything else to the
untouched consumer PaymentsService. Import SchoolBillingModule.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 8: Proration seam in `SchoolsService.updateSchool`

**Files:**
- Modify: `apps/api/src/modules/schools/schools.service.ts` (inject `StripeService`; sync quantity on seatLimit change)
- Modify: `apps/api/src/modules/schools/schools.module.ts` (no change needed — StripeModule is global; verify)
- Modify: `apps/api/src/modules/schools/schools.service.spec.ts`

- [ ] **Step 1: Extend the service test**

In `schools.service.spec.ts`, add `{ provide: StripeService, useValue: mockStripe }` (with `updateSubscriptionQuantity: jest.fn()`) to the providers, then:

```ts
it('prorates Stripe when seatLimit changes on a subscribed school', async () => {
  mockRepo.findById.mockResolvedValue({ ...baseSchool, seatLimit: 30, subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_1', stripeCustomerId: 'cus_1' } });
  mockStripe.updateSubscriptionQuantity.mockResolvedValue({ status: 'active', currentPeriodEnd: 500, seatQuantity: 50 });
  await service.updateSchool('s1', { seatLimit: 50 });
  expect(mockStripe.updateSubscriptionQuantity).toHaveBeenCalledWith('sub_1', 50);
  // persists seatLimit AND the synced subscription block
  const arg = mockRepo.updateSchool.mock.calls.at(-1)![1];
  expect(arg.seatLimit).toBe(50);
  expect(arg.subscription).toEqual(expect.objectContaining({ seatQuantity: 50, periodEnd: 500 }));
});

it('does NOT call Stripe when the school has no subscription', async () => {
  mockRepo.findById.mockResolvedValue({ ...baseSchool, seatLimit: 30, subscription: { tier: 'trial', status: 'none' } });
  await service.updateSchool('s1', { seatLimit: 50 });
  expect(mockStripe.updateSubscriptionQuantity).not.toHaveBeenCalled();
});

it('does NOT call Stripe when seatLimit is unchanged (status-only edit)', async () => {
  mockRepo.findById.mockResolvedValue({ ...baseSchool, seatLimit: 30, subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_1' } });
  await service.updateSchool('s1', { status: 'suspended' });
  expect(mockStripe.updateSubscriptionQuantity).not.toHaveBeenCalled();
});
```

> Confirm `baseSchool` exists in the spec; if not, build a minimal school literal inline (mirror the one in Task 5's spec).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.service.spec.ts`
Expected: FAIL — Stripe not injected / quantity not synced.

- [ ] **Step 3: Implement the seam**

In `schools.service.ts`, inject `StripeService` (add `import { StripeService } from '../../infrastructure/stripe/stripe.service';` and a constructor param `private readonly stripe: StripeService`). Replace the body of `updateSchool` with seatLimit-change detection + proration:

```ts
  async updateSchool(id: string, dto: UpdateSchoolDto): Promise<School> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }

    const partial: Partial<Pick<School, 'status' | 'seatLimit' | 'subscription'>> = {};
    if (dto.status !== undefined) partial.status = dto.status;
    if (dto.seatLimit !== undefined) partial.seatLimit = dto.seatLimit;

    /* When seats change on a subscribed school, prorate the Stripe quantity. */
    const seatsChanged = dto.seatLimit !== undefined && dto.seatLimit !== school.seatLimit;
    const subscriptionId = school.subscription.stripeSubscriptionId;
    if (seatsChanged && subscriptionId) {
      const synced = await this.stripe.updateSubscriptionQuantity(subscriptionId, dto.seatLimit!);
      partial.subscription = {
        ...school.subscription,
        status: synced.status,
        periodEnd: synced.currentPeriodEnd,
        seatQuantity: synced.seatQuantity,
      };
    }

    await this.repo.updateSchool(id, partial);
    this.logger.log({ event: 'school_updated', schoolId: id, fields: Object.keys(partial) });
    return { ...school, ...partial };
  }
```

> `SchoolsModule` does not need a new import — `StripeModule` is `@Global`. Verify the module compiles; if Nest cannot resolve `StripeService`, confirm `StripeModule` is in the app graph (it is, via `app.module.ts`).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @eureka-lab/api exec jest --runInBand src/modules/schools/schools.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Full API suite + type-check**

Run: `pnpm --filter @eureka-lab/api exec tsc --noEmit`
Expected: 0 errors.
Run: `pnpm --filter @eureka-lab/api exec jest --runInBand`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/schools/schools.service.ts apps/api/src/modules/schools/schools.service.spec.ts
git commit -F - <<'EOF'
feat(schools): prorate Stripe quantity on seatLimit change

When a subscribed school's seatLimit changes, sync the Stripe
subscription quantity (create_prorations) and persist the returned
status/periodEnd/seatQuantity. The only billing concern in SchoolsService
— a single call to the StripeService leaf (no school-billing dep).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 9: Frontend — API client + super-admin Billing panel + school-admin badge/portal

**Files (confirm exact paths by exploring `apps/web/src/app` for the existing super-admin school-detail and school-admin pages built in sub-projects 2–3):**
- Modify/Create: web API client module for school-billing calls (follow the existing client pattern used by the schools console).
- Modify: super-admin school detail page — add a Billing panel.
- Modify: school-admin console page — add a billing badge + Manage-billing button.
- Modify: `apps/web/src/messages/{en,fr,ar}.json` — i18n keys.

- [ ] **Step 1: Locate the pages + client pattern**

Run a search to find the seams (do not guess paths):
```
Grep: "listSchools|SchoolDetail|seatLimit" in apps/web/src
Grep: "school_admin|SchoolAdmin" in apps/web/src/app
```
Identify: (a) the super-admin school-detail component, (b) the school-admin console page, (c) the typed API client these use. Read each before editing.

- [ ] **Step 2: Add the API client methods**

In the web API client (matching the existing style — `fetch` wrapper with auth header), add:
- `getSchoolBilling(schoolId): Promise<SchoolBillingSummary>` → `GET /school-billing/:schoolId`
- `setUpSchoolSubscription(schoolId, { billingEmail, trialDays? }): Promise<SchoolBillingSummary>` → `POST /school-billing/:schoolId/subscription`
- `getOwnSchoolBilling(): Promise<SchoolBillingSummary>` → `GET /school-billing/me`
- `openSchoolBillingPortal(returnUrl): Promise<{ url: string }>` → `POST /school-billing/portal`

Import `SchoolBillingSummary` from `@eureka-lab/shared-types`.

- [ ] **Step 3: Super-admin Billing panel**

In the school-detail component, add a "Billing" panel that:
- On mount, calls `getSchoolBilling(schoolId)` and shows tier / status (badge) / seats (`seatQuantity ?? seatLimit`) / `periodEnd` (formatted) and, if present, a "View invoice" link to `latestInvoiceUrl`.
- If `hasSubscription === false`, shows a "Set up subscription" form: a billing-email input and an optional trial-days number input, with a submit button calling `setUpSchoolSubscription(...)`. On success, re-fetch the summary and show the invoice link **inline** (no `toast()`). On error, show an inline error message.
- Use existing console components/`GameButton` variants (`primary | gold | ghost | danger`). Keyboard-navigable inputs with ARIA labels.

- [ ] **Step 4: School-admin badge + portal button**

In the school-admin console page, add:
- A billing status badge from `getOwnSchoolBilling()` (`active` → gold/green, `trialing` → neutral, `past_due` → danger, `none` → ghost).
- A "Manage billing" button (shown when `hasSubscription`) that calls `openSchoolBillingPortal(window.location.href)` and `window.location.assign(url)` on success; inline error otherwise.

- [ ] **Step 5: i18n keys (en/fr/ar)**

Add a `SchoolBilling` namespace to all three of `apps/web/src/messages/{en,fr,ar}.json` with keys for: `title`, `status`, `seats`, `renews`, `viewInvoice`, `setUpTitle`, `billingEmail`, `trialDays`, `setUpCta`, `manageBilling`, `statusActive`, `statusTrialing`, `statusPastDue`, `statusNone`, `errorGeneric`. Provide real translations (fr + ar), not English placeholders.

Validate all three parse:
```
node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"
```

- [ ] **Step 6: Verify (lint + tsc count)**

Run: `pnpm --filter @eureka-lab/web lint`
Expected: clean.
Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: **24** (unchanged from baseline — no new errors).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -F - <<'EOF'
feat(web): school billing UI (super-admin panel + school-admin badge)

Super-admin school-detail Billing panel (status + set-up form + invoice
link) and school-admin billing badge + Manage-billing portal button, with
a typed school-billing API client and en/fr/ar strings. Inline feedback
only (Sonner is broken app-wide).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Task 10: Docs — env var + ROADMAP + STRIPE-001 note

**Files:**
- Modify: `context/env-variables.md`
- Modify: `ROADMAP.md` (Stream 6 row 5; STRIPE-001 note in Stream 3)

- [ ] **Step 1: Document the env var**

In `context/env-variables.md`, add `STRIPE_PRICE_ID_SCHOOL_SEAT` (backend, the per-seat recurring Stripe Price id for school subscriptions) under the backend/Stripe section, alongside the existing `STRIPE_PRICE_ID_*` entries. Note it reuses `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.

- [ ] **Step 2: Update ROADMAP**

In `ROADMAP.md` Stream 6, flip row **5** status to **DONE** with branch `feat/school-b2b-billing` and a note: "5a — B2B billing (per-seat on seatLimit); key rotation + usage analytics deferred." Link the spec + this plan.

In Stream 3, append to the `STRIPE-001` row a note: "Consumer webhook handlers + signature verification are code-complete and tested (verified during 5a brainstorming); remaining work is prod webhook-secret verification — folded into DEPLOY-001."

- [ ] **Step 3: Commit**

```bash
git add context/env-variables.md ROADMAP.md
git commit -F - <<'EOF'
docs(roadmap): mark B2B 5a (billing) DONE; STRIPE-001 status note

Add STRIPE_PRICE_ID_SCHOOL_SEAT to env docs, flip Stream 6 row 5 to DONE
(5a billing; key rotation + analytics deferred), and note STRIPE-001 is
code-complete pending prod secret verification (DEPLOY-001).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
```

---

## Final verification (after Task 10)

- [ ] `pnpm --filter @eureka-lab/api exec tsc --noEmit` → 0 errors.
- [ ] `pnpm --filter @eureka-lab/api exec jest --runInBand` → all suites pass; new `school-billing` code ≥ 80% coverage (`--coverage --collectCoverageFrom='src/modules/school-billing/**'`).
- [ ] `pnpm --filter @eureka-lab/web lint` → clean.
- [ ] `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → 24.
- [ ] `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json')})"` → all parse.
- [ ] Hand the user a short smoke brief (super-admin: set up a subscription on a test school, see status + invoice link, bump seatLimit; school-admin: see the badge, open the portal). User runs it and reports before any push.
- [ ] `superpowers:finishing-a-development-branch` → user picks push + PR (base `feat/school-classroom-rollup`).

---

## Spec coverage check

| Spec section | Task(s) |
|---|---|
| §4 data model (SchoolSubscription, billingEmail, SchoolBillingSummary) | 1 |
| §5 StripeService additions | 2 |
| §6 module + 4 endpoints | 4, 5, 6 |
| §7 webhook routing (event-type-aware) | 5 (matcher + handlers), 7 (dispatch) |
| §8 seat-limit ↔ proration seam | 3 (widen updateSchool), 8 |
| §9 frontend | 9 |
| §10 config / rules / security | 4 (DTO), 6 (claim-derived schoolId), 10 (env) |
| §11 testing (≥80%) | 2, 3, 5, 6, 7, 8 + final verification |
| §12 ROADMAP / STRIPE-001 | 10 |
