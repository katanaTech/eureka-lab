/**
 * Parameter and result shapes for the StripeService abstraction.
 * Extracted from stripe.service.ts to keep that file focused (CLAUDE.md Rule 8).
 */

/** Parameters for creating a Stripe Checkout session. */
export interface CheckoutSessionParams {
  /** Stripe customer ID (cus_...) */
  customerId: string;
  /** Stripe price ID for the selected plan */
  priceId: string;
  /** URL to redirect on successful checkout */
  successUrl: string;
  /** URL to redirect on canceled checkout */
  cancelUrl: string;
  /** Metadata to attach to the session (userId, plan, etc.) */
  metadata: Record<string, string>;
}

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
  /** Unix seconds — Stripe subscription item current_period_end */
  currentPeriodEnd: number;
  latestInvoiceUrl?: string;
}

/** Result of a quantity (proration) update. */
export interface QuantityUpdateResult {
  status: string;
  /** Unix seconds — Stripe subscription item current_period_end */
  currentPeriodEnd: number;
  seatQuantity: number;
}
