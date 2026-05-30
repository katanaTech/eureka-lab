# ADR-008 — School tenancy & role hierarchy (B2B)

> **Status:** Proposed (2026-05-30)
> **Driver:** User decision to sell to schools; reframes the ROADMAP Stream 4 "Teacher signup UI" gap into a multi-tenant B2B model.
> **Epic spec:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](../superpowers/specs/2026-05-30-school-tenancy-b2b-epic-design.md)
> **Foundation spec:** [`2026-05-30-school-tenancy-foundation-design.md`](../superpowers/specs/2026-05-30-school-tenancy-foundation-design.md)

## Context

The platform is B2C: parents and kids self-sign-up, role is derived server-side from `birthYear` (ADR-007), and the only B2B surface is a teacher dashboard whose accounts can only be created by hand. There is no tenant concept — roles are a flat `child | parent | teacher | admin` union and classrooms are owned directly by a `teacherId`.

The product needs to be sold to **schools**, with a platform operator managing tenants (subscriptions, license seats, keys) and each school managing its own teachers. This requires a tenancy + role hierarchy the codebase does not have.

## Decision

Introduce a multi-tenant B2B layer that runs **parallel** to the existing B2C model.

1. **Hierarchy:** `super_admin` (platform) → `School` (tenant) → `school_admin` → `teacher` → `child`/student. The B2B tree is parallel to the existing parent → child B2C tree.

2. **Two new roles**, added to `UserRole`: `super_admin` and `school_admin`. The existing placeholder `admin` role is **not** migrated or reused.

3. **Separate trees.** A child belongs to **either** a parent (`parentUid`, B2C) **or** a school (`schoolId`, B2B), never both. The existing parent/kid self-signup and consumer billing are untouched.

4. **Hybrid tenancy storage.** `schoolId` is denormalized onto user docs for O(1) tenant scoping (mirroring the existing `parentUid` field), **and** a `schools/{id}` document holds tenant metadata with a denormalized `seatsUsed` counter and `adminUids[]`.

5. **Super-admin is seed-only.** The first and any `super_admin` is created exclusively by an out-of-band script that sets a Firebase custom claim. **No API or UI path can mint a `super_admin`.** This is the top security boundary.

6. **School admins are minted by a super-admin**, and teachers by a school admin (sub-project 3). Teachers no longer self-register — this **supersedes** the Stream 4 "Teacher signup UI" gap.

## Alternatives considered

- **Unified tree (child has both `parentUid` and `schoolId`).** Rejected for the foundation: dual ownership muddies seat accounting, billing, and data-access rules. Separate trees are cleaner; cross-tree migration is explicitly out of scope.
- **Membership subcollection (`schools/{id}/members/{uid}`).** More normalized and auditable, but costs extra reads to resolve a user's tenant and complicates fan-out queries. The hybrid denormalized model matches the existing flat user-doc pattern.
- **Self-serve school registration** (anyone creates a school and becomes its admin). Rejected: the user wants the platform operator to control who becomes a tenant (sales-led B2B). Super-admin provisions schools.
- **Repurpose the existing `admin` role as super-admin.** Rejected: `admin` is referenced in several `@Roles('admin')` lists and co-mingled to `/parent`; reusing it risks accidental privilege. A distinct `super_admin` role is unambiguous.

## Consequences

### Positive
- Clean tenant isolation via `schoolId` + `TenantGuard`; least-privilege super-admin boundary (seed-only).
- Existing B2C flows (ADR-006/007 age-gate, COPPA parent pipeline, consumer Stripe) are untouched.
- Closes the Teacher-signup gap with a stronger compliance story (admin-provisioned, not self-declared).

### Negative / deferred
- **COPPA for school students** is unresolved here — school students have no parent account, so under-13 enrollment must use the COPPA **school-consent exception**. Deferred to sub-project 4.
- **B2B billing** (per-seat school subscriptions) is a separate Stripe surface that intersects the open `STRIPE-001` blocker. Deferred to sub-project 5; the foundation stores subscription/seat as plain fields.
- **Secret-key semantics & rotation** are stubbed (`enrollmentSecret` field) and finalized in sub-project 5.
- Adds two roles to every role-aware surface; `homeForRole` and guards must stay in sync.

## Implementation pointer (foundation slice)

- Roles/types: `packages/shared-types/src/index.ts`
- Schools module: `apps/api/src/modules/schools/`
- Tenant guard: `apps/api/src/common/guards/tenant.guard.ts`
- Super-admin seed: `scripts/seed-super-admin.ts`
- Redirects: `apps/web/src/lib/auth-redirects.ts`
- Rules: `infrastructure/firebase/firestore.rules`
