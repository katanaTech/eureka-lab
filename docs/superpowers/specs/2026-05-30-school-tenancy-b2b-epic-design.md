# School Tenancy (B2B) — Epic Design

> **Status:** Draft (2026-05-30)
> **Author:** brainstormed with the user this session.
> **Scope:** Platform-level. Introduces a multi-tenant B2B layer (schools) on top of the existing B2C consumer model. This is an **epic** spanning ~5 sub-projects, each with its own spec → plan → implementation cycle.
> **First slice spec:** [`2026-05-30-school-tenancy-foundation-design.md`](2026-05-30-school-tenancy-foundation-design.md)
> **Architecture decision:** [`ADR-008`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)

---

## 1. Why

The product today is **B2C**: parents self-sign-up, kids (13–16) self-sign-up behind an age gate, under-13 go through a COPPA parent-email pipeline, and billing is consumer Stripe. The only B2B surface is a teacher dashboard whose accounts can only be minted by hand — the long-standing ROADMAP Stream 4 "Teacher signup UI" gap.

The user wants to sell to **schools**. That reframes the teacher-signup gap entirely: teachers should not self-register — they should be **provisioned by a school administrator**, and schools themselves should be **managed by a platform super-admin** who controls subscriptions, license/seat counts, and access keys. This requires a tenancy layer the codebase does not have.

## 2. The hierarchy

```
Super Admin (platform — us)
  └── manages all Schools (tenants): subscription, license/seat count, secret keys, status
        └── School Admin (per tenant)
              └── manages Teachers in their school
                    └── Teachers manage Classrooms (existing)
                          └── Children / students (consume license seats)
```

The B2B tree runs **parallel** to the existing B2C tree (parent → child). A given child belongs to **exactly one** tree (see §4, locked decision 1).

## 3. Sub-project decomposition

Built in dependency order. Each is its own spec + plan.

| # | Sub-project | Delivers | Depends on |
|---|---|---|---|
| **1** | **Tenancy + role foundation** *(keystone)* | `schools` collection; `super_admin` + `school_admin` roles; `schoolId` on user docs; **seeded** first super-admin; super-admin-only backend to create schools + mint a school's first admin; `TenantGuard`; tests. **No console UI.** | — |
| **2** | **Super-admin console** | Dashboard + UI/CRUD: create/list/suspend schools; edit subscription, seat limit, child count, secret keys; create each school's first admin; usage views | 1 |
| **3** | **School-admin console** | School admin adds / lists / deactivates teachers linked to their `schoolId`; teacher credential delivery | 1, 2 |
| **4** | **Seat / license enforcement + rollup + enrollment** | School students enrolled (teacher/admin or coded); children count against `seatLimit`; classrooms roll up to school; **school-consent COPPA path** for under-13 students | 1–3 |
| **5** | **B2B subscriptions / billing / key rotation** | Real commercial layer — ties into existing Stripe (Phase 7) and the open `STRIPE-001` blocker; secret-key rotation | 2, 4 |

This epic **supersedes** the ROADMAP Stream 4 "Teacher signup UI" gap: teachers are provisioned by a school admin (sub-project 3), not self-served.

## 4. Cross-cutting decisions (LOCKED this session)

1. **Separate trees.** A child belongs to **either** a parent (B2C, `parentUid`) **or** a school (B2B, `schoolId`), never both. The existing parent/kid self-signup flow is untouched. A student seat = a `child` user carrying the school's `schoolId`.
2. **Hybrid tenancy storage.** `schoolId` denormalized onto each user doc (O(1) tenant scoping, mirrors existing `parentUid`) **plus** a `schools/{id}` doc holding metadata + a denormalized `seatsUsed` counter and `adminUids[]`.
3. **Super-admin is seed-only.** The first (and any) `super_admin` is created exclusively by an out-of-band script that sets a Firebase custom claim. No API or UI path can ever mint one. This is the top security boundary.
4. **Two new roles, `admin` left alone.** Add `super_admin` and `school_admin` to the `UserRole` union; the existing placeholder `admin` role is not migrated or reused.

## 5. Cross-cutting concerns / open questions (resolved later, per sub-project)

| Concern | Where resolved | Note |
|---|---|---|
| **COPPA for school students** | Sub-project 4 | School students have no parent account. Under-13 enrollment must use the COPPA **school-consent exception** (school consents in loco parentis), not the parent-email pipeline. Needs its own audit-log path. |
| **B2B billing model** | Sub-project 5 | Per-seat school subscription vs. the existing per-user consumer Stripe. Likely a separate Stripe product; intersects the open `STRIPE-001` webhook blocker. |
| **Secret-key semantics** | Sub-projects 1 (field) → 5 (rotation) | Foundation stores a simple `enrollmentSecret`; meaning (enrollment code? API key?) and rotation are sub-project 5. |
| **Suspension cascade** | Sub-project 2 | What happens to a suspended school's teachers/students (lockout vs read-only). |
| **Cross-tree migration** | Out of scope | Moving an existing B2C child into a school is not supported in this epic. |

## 6. Relationship to existing roadmap

- **Replaces** Stream 4 "Teacher signup UI" gap.
- **Intersects** Stream 3 `STRIPE-001` (B2B billing in sub-project 5) and `COPPA-001` (school-consent path in sub-project 4).
- New direction, **not** part of the `redesign/v2-from-reference` visual epic — should live on its own branch / PR.

## 7. Sequencing & deliverable per slice

Each sub-project ends with: code + tests (≥80% new-code coverage per DoD), an updated ROADMAP epic row, and any required ADR addendum. We brainstorm/plan the **next** slice only after the prior one lands, so the design can react to what we learn building the foundation.
