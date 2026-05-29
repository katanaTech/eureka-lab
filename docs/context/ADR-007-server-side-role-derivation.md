# ADR-007 — Server-side role derivation from birthYear

> **Status:** Accepted (2026-05-29 — landed via Plan 3b)
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
