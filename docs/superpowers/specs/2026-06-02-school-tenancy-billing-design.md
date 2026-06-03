# School Tenancy (B2B) — Sub-project 5a: School Billing — Design

> **Status:** Draft (2026-06-02)
> **Author:** brainstormed with the user this session.
> **Epic:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR:** [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
> **Slice:** 5a of the B2B epic. Sub-projects 1, 2, 3, 4a, 4b are DONE. This is the commercial layer.
> **Branch:** `feat/school-b2b-billing` (stacked off `feat/school-classroom-rollup`, PR #13).

---

## 1. Why

Sub-projects 1–4b built the tenancy structure: schools, roles, seat enforcement, classrooms. None of it bills. The platform's consumer side (Phase 7, `apps/api/src/modules/payments/`) charges parents via Stripe Checkout + Customer Portal, with subscription state on the user doc. Schools need their own commercial layer: a **per-seat subscription** the platform operator provisions (sales-led, per ADR-008), billed by invoice, with a self-serve portal for the school admin to manage payment.

This slice (5a) delivers that billing layer. It is the last *structural* B2B slice; what remains after it (secret-key rotation, super-admin usage analytics) is deferred to future slices with no consumer today.

## 2. Scope

**In scope:**
- A super-admin sets up a per-seat Stripe subscription for a school: quantity = the school's `seatLimit`, optional trial period, invoice collection (`send_invoice`).
- Editing a school's `seatLimit` prorates the subscription quantity automatically.
- The school's payment status (`active` / `trialing` / `past_due` / `canceled`) is tracked on the school doc and surfaced in both the super-admin and school-admin consoles.
- The school-admin gets a Stripe Customer Portal link to update payment method and view invoices.
- Webhooks keep the school's billing status in sync.

**Non-goals (explicitly deferred):**
- **Secret-key rotation.** The dormant `secretKeys.enrollmentSecret` has no consumer; rotating the live `loginCode` would orphan existing students' synthetic emails. Revisit when a feature (SSO / roster-sync API) actually needs keys.
- **Super-admin usage-over-time analytics.** Parked from sub-projects 2 and 4b; a future 5b.
- **Metered / usage-based billing.** We bill on `seatLimit` (licenses purchased), not `seatsUsed` (filled).
- **Auto-lockout on payment failure.** Billing and access stay decoupled; lockout remains the manual super-admin `status: suspended` toggle.
- **Any change to consumer (Phase 7) billing.** The consumer path is frozen; 5a only adds an upstream routing branch to the shared webhook.

## 3. Locked decisions (this session)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Per-seat, billed on `seatLimit`.** Stripe subscription `quantity = seatLimit`. | One number drives both enforcement (4a) and billing — no second source of truth, no metered reconciliation. Standard SaaS seat licensing. |
| 2 | **Hybrid ownership.** Super-admin sets up the subscription (sales-led, invoice collection); school-admin gets a Customer Portal link for payment method + invoices. | Matches ADR-008's sales-led B2B model; schools pay by invoice/PO, not a personal card, but can self-serve payment updates. |
| 3 | **Track payment status, don't auto-lock.** `past_due` surfaces as a badge; lockout stays the manual super-admin `status` toggle. | Safest for kids mid-lesson; gives sales a grace window; keeps billing and access-enforcement decoupled. |
| 4 | **Optional trial on setup.** Super-admin may set `trial_period_days`; Stripe reports `trialing` until conversion. | Common for sales-led B2B pilots; `School.subscription.tier` already defaults to `'trial'`. |
| 5 | **Drop key rotation from 5a.** | No consumer for the dormant secret; rotating `loginCode` is unsafe. |
| 6 | **Architecture A:** new `school-billing` module + shared single webhook endpoint routed by metadata. | Consumer billing untouched and stable; B2B is a bounded, testable module matching the existing `schools/` decomposition; one prod webhook secret. |
| 7 | **Scope around `STRIPE-001`.** | The consumer webhook handlers + signature verification already exist and are tested; the real remainder is prod secret verification (folds into `DEPLOY-001`), not code. |

## 4. Data model (`packages/shared-types/src/index.ts`)

Extend the existing `SchoolSubscription` — all new fields optional so existing school docs stay valid:

```ts
/** School subscription — billing state (sub-project 5a) */
export interface SchoolSubscription {
  tier: string;                    // existing — plan tier label
  status: string;                  // existing — now mirrors Stripe status
  periodEnd?: number;              // existing — Unix seconds current period end (matches SubscriptionData)
  stripeCustomerId?: string;       // new — cus_...
  stripeSubscriptionId?: string;   // new — sub_...
  seatQuantity?: number;           // new — quantity synced to Stripe (= seatLimit at last sync)
  collectionMethod?: 'send_invoice' | 'charge_automatically'; // new
}
```

Add an optional `billingEmail?: string` to `School` (where Stripe sends invoices and the portal mails). No new top-level collection — billing state rides on `schools/{id}`, consistent with ADR-008's hybrid model.

A `SchoolBillingSummary` view type for the console (no secrets):

```ts
export interface SchoolBillingSummary {
  schoolId: string;
  tier: string;
  status: string;                  // active | trialing | past_due | canceled | none
  seatLimit: number;
  seatsUsed: number;
  seatQuantity?: number;
  periodEnd?: number;
  hasSubscription: boolean;
  latestInvoiceUrl?: string;       // hosted invoice URL from last setup (super-admin view only)
}
```

Rebuild shared-types after editing (`pnpm --filter @eureka-lab/shared-types build`; commit only `src/`).

## 5. `StripeService` additions (`apps/api/src/infrastructure/stripe/stripe.service.ts`)

Three additions to the existing abstraction (Rule 18), preserving its mock-fallback-when-no-key pattern:

- **`createSchoolSubscription({ customerId, priceId, quantity, trialDays?, daysUntilDue, metadata })`** → creates a subscription with `collection_method: 'send_invoice'`, `days_until_due`, `items: [{ price, quantity }]`, `metadata.schoolId`, and `trial_period_days` when `trialDays` is set. Returns `{ subscriptionId, status, currentPeriodEnd, latestInvoiceUrl }`.
- **`updateSubscriptionQuantity(subscriptionId, quantity)`** → updates the single line-item quantity with `proration_behavior: 'create_prorations'`. Returns the updated status + period end. Used on seat-limit change.
- **`createPortalSession(customerId, returnUrl)`** — already exists; reused verbatim for the school-admin link.

`createCustomer(email, name, metadata)` and `getSubscription(id)` already exist and are reused. Mock mode returns deterministic `sub_mock_*` shapes so service tests run without a live key.

## 6. New module: `apps/api/src/modules/school-billing/`

Bounded module mirroring the `schools/` sub-service style. Depends on `SchoolsRepository` (read/write the school doc's subscription block) and `StripeService`. Does **not** depend on `SchoolsService` (avoids a cycle; `SchoolsService` reaches Stripe directly for the proration seam — see §8).

### Endpoints

Static routes declared **before** any param routes (NestJS gotcha). Controller specs must `.overrideGuard(...)` every guard used.

| Method + route | Guards | Caller | Behaviour |
|---|---|---|---|
| `POST /school-billing/:schoolId/subscription` | `FirebaseAuthGuard`, `RolesGuard('super_admin')` | super_admin | Create the Stripe customer if the school has none (email = `billingEmail` from DTO, metadata `{ schoolId }`); create a per-seat subscription (qty = `seatLimit`, optional `trialDays`); persist `stripeCustomerId`, `stripeSubscriptionId`, `status`, `periodEnd`, `seatQuantity`, `collectionMethod`, and `billingEmail` onto the school doc; return the billing summary incl. `latestInvoiceUrl`. Rejects if the school already has a `stripeSubscriptionId` (`SUBSCRIPTION_EXISTS`) or is missing (`SCHOOL_NOT_FOUND`). |
| `GET /school-billing/:schoolId` | `FirebaseAuthGuard`, `RolesGuard('super_admin')` | super_admin | Return `SchoolBillingSummary` for any school. |
| `POST /school-billing/portal` | `FirebaseAuthGuard`, `RolesGuard('school_admin')` | school_admin | Create a Customer Portal session for the **caller's own** school. `schoolId` is read from `@CurrentUser().schoolId` (the verified token claim), never the body — there is no `:id` param to spoof, so `TenantGuard` is not used (it keys off `params.id` and would reject a no-`:id` route). Rejects if the claim is missing (`NO_SCHOOL_CLAIM`) or the school has no `stripeCustomerId` (`NO_SUBSCRIPTION`). Returns `{ url }`. |
| `GET /school-billing/me` | `FirebaseAuthGuard`, `RolesGuard('school_admin')` | school_admin | Return the caller's own school's `SchoolBillingSummary` (no `latestInvoiceUrl`) for the console badge. `schoolId` from `@CurrentUser().schoolId`; rejects a missing claim (`NO_SCHOOL_CLAIM`). |

DTOs (class-validator, Rule 10): `CreateSchoolSubscriptionDto { billingEmail: string (email); trialDays?: number (int, min 0, max 90) }`.

### Service responsibilities
- `setUpSubscription(schoolId, dto)` — orchestrates customer + subscription creation and persistence (above).
- `getBillingSummary(schoolId)` / `getOwnBillingSummary(schoolId)` — assemble `SchoolBillingSummary` from the school doc.
- `createPortalLink(schoolId, returnUrl)` — guard for `stripeCustomerId`, delegate to `StripeService.createPortalSession`.
- `handleWebhookEvent(eventType, data)` — the school-side webhook handlers (§7).

## 7. Webhook routing (one endpoint, routed by metadata)

`POST /payments/webhook` stays the **single** endpoint: one `STRIPE_WEBHOOK_SECRET`, already wired with Fastify `rawBody` and signature verification. The consumer dispatch in `PaymentsController`/`PaymentsService` is **byte-for-byte unchanged** except for one added upstream "is this a school event?" decision. If it is → `SchoolBillingService.handleWebhookEvent(...)`; else → the existing `PaymentsService.handleWebhookEvent(...)`.

**Routing is event-type-aware, because Stripe invoice objects do not inherit a subscription's metadata:**
- **`customer.subscription.*` events** — the `Subscription` object carries `metadata`. Every B2B subscription is created with `metadata.schoolId`; every consumer one with `metadata.userId`. Route by `object.metadata?.schoolId`.
- **`invoice.*` events** — the `Invoice` object has **no** subscription metadata; it has only `customer` (and `subscription`) ids. Route by resolving `object.customer` to a school via `SchoolsRepository.findByStripeCustomerId`; a hit → school path, a miss → consumer path (unchanged).

To keep the controller branch thin, the school-vs-consumer decision is delegated to a small `SchoolBillingService.matchesSchoolEvent(event): Promise<boolean>` helper that encapsulates the two rules above; the controller just awaits it and dispatches.

School handlers:

| Stripe event | Action on `schools/{id}` |
|---|---|
| `customer.subscription.updated` | Sync `status`, `periodEnd`, `seatQuantity` from the event. |
| `customer.subscription.deleted` | Set `status: 'canceled'`. **Do not** suspend the school. |
| `invoice.payment_failed` | Set `status: 'past_due'`. |
| `invoice.paid` | Set `status: 'active'`. |

Lookup inside the handlers is by `stripeSubscriptionId` (subscription events) or `stripeCustomerId` (invoice events) via new `SchoolsRepository.findByStripeSubscriptionId` / `findByStripeCustomerId` queries (mirroring the consumer `UsersRepository` equivalents). Handlers are idempotent — each writes a terminal status value, so replays are last-write-wins on the same value.

## 8. Seat-limit ↔ proration seam

`seatLimit` stays a `SchoolsService`-owned field (edited today via `PATCH /schools/:id`). After `SchoolsService.updateSchool` persists a `seatLimit` change, **if** the school has an active `stripeSubscriptionId`, it calls `StripeService.updateSubscriptionQuantity(subId, newSeatLimit)` to prorate, then persists the returned `seatQuantity` / `status` / `periodEnd`.

This is the **only** billing concern in `SchoolsService` — a single call to the infra leaf (`StripeService`), so there is **no dependency on `school-billing`** and no module cycle. All richer billing (setup, portal, webhooks) lives in `school-billing`. Result: one seat-edit endpoint; the console never branches on subscription state to change seats.

## 9. Frontend

- **Super-admin console** (school detail page): a **Billing** panel showing current tier / status / seats / period and the latest invoice link, plus a **Set up subscription** form (billing email, optional trial days) calling `POST /school-billing/:schoolId/subscription`. Re-skins via existing console patterns; **inline** feedback only (Sonner is broken app-wide — never `toast()`).
- **School-admin console:** a billing **status badge** (`active` / `trialing` / `past_due` / `none`) from `GET /school-billing/me`, and a **Manage billing** button → `POST /school-billing/portal` → redirect to the Stripe Portal URL.
- **i18n:** new keys in `en` / `fr` / `ar` (validate all three parse). Watch existing namespaces — grep before assuming a key exists.
- **Verification:** no frontend unit tests this stack (web harness shaky); success = `lint` clean + web `tsc` error count **stays 24** (not zero) + user smoke.

## 10. Config, rules, security

- **Env:** `STRIPE_PRICE_ID_SCHOOL_SEAT` (the per-seat recurring Price ID) and a `days_until_due` constant for invoice collection. Document in `context/env-variables.md`. Reuses existing `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
- **Firestore rules:** billing fields on `schools/{id}` stay **server-write-only** (no client writes), consistent with existing school rules. No new collection.
- **Tenant isolation:** school-admin endpoints derive `schoolId` from the verified token claim (`@CurrentUser().schoolId`), never from a route param or the request body — a school_admin can never name, and so can never read or act on, another school's billing.
- **CLAUDE.md rules honoured:** no `any` (narrow `unknown`); JSDoc on all new functions/params; files < 300 lines (split service/controller); no `console.log` (Pino logger); class-validator DTOs on all inputs.

## 11. Testing (backend carries the ≥80% bar)

- `school-billing.service.spec.ts`: subscription setup (incl. trial + existing-customer reuse), `SUBSCRIPTION_EXISTS` / `SCHOOL_NOT_FOUND` rejections, each webhook handler (updated / deleted / payment_failed / paid), portal-link guard, billing-summary assembly, and Stripe mock-mode fallback.
- `school-billing.controller.spec.ts`: guard overrides; tenant isolation (a school_admin cannot reach another school's billing); super-admin-only setup/read.
- `schools.service.spec.ts` (extend): proration side-effect — a `seatLimit` change on a subscribed school calls `updateSubscriptionQuantity`; an unsubscribed school does not.
- `stripe.service` mock-mode assertions for the two new methods.
- Target ≥ 80% new-code coverage per the Definition of Done. API tests: `pnpm --filter @eureka-lab/api exec jest --runInBand [path]`.

## 12. ROADMAP / `STRIPE-001` bookkeeping

On landing:
- Flip Stream 6 row **5** to DONE (note this slice is **5a — billing**; key rotation + analytics deferred).
- Add a note that **`STRIPE-001` is code-complete** — the consumer webhook handlers (`subscription.updated`, `payment_failed`, etc.) and signature verification exist and are tested; the real remainder is **prod webhook-secret verification**, which folds into `DEPLOY-001`. It is not a code blocker for 5a.

## 13. Deliverable

Per the epic's per-slice contract: code + tests (≥80% new-code coverage), updated ROADMAP epic row, the env-var doc entry, and any ADR addendum if a cross-cutting decision changed (none expected — 5a stays within ADR-008). Its own stacked branch (`feat/school-b2b-billing`) and its own PR, merged after #13.
