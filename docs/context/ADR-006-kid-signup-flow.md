# ADR-006 — Kid signup flow

> **Status:** Accepted (2026-05-14)
> **Decision driver:** Plan 1 review finding **R5** + spec [§9 open question #5](../superpowers/specs/2026-05-09-redesign-from-reference-design.md#L381).
> **Plan:** [Plan 2 — Campaign + Combat + Inventory + Shop + Victory](../superpowers/plans/2026-05-14-redesign-plan-2-campaign-and-combat.md), Phase F.

## Context

Plan 1 shipped the Welcome page with a hardcoded `role: 'parent'` for every signup because the spec hadn't yet specified how kids should sign up. Plan 1's review surfaced this as **R5** ("Welcome hardcodes role:'parent'; inventory @Roles broadened with TODO"). The inventory `@Roles` decorator was temporarily broadened to `['child', 'parent']` so the Plan 1 happy-path could function while R5 was pending.

The product is targeted at **children aged 8–16** (per CLAUDE.md §1). Two real audiences exist:

1. **Kids 8–16** who play the game.
2. **Adults** (parents, teachers) who monitor / pay / configure but don't play.

R5 requires picking how the kid side actually onboards.

## Decision

**Option 2 — Self-signup with age gate**, sliced into Plan 2 + Plan 3.

### Plan 2 slice (this ADR's deliverable)

- Welcome's "Begin Quest" tab adds a **`birthYear`** field.
- On submit, compute `age = currentYear - birthYear` client-side.
- **Age 13–16:** signup proceeds with `role: 'child'`. User is redirected to `/character` exactly as today.
- **Age < 13:** signup is **blocked** with a toast/panel: "Hero too young — parent confirmation needed (coming soon)." No account is created.
- **Age > 16 or invalid year:** signup is blocked with "Hero too old — heroes are 8 to 16."
- Welcome's "Return Hero" tab is unchanged (login by email/password).
- Standalone `/signup` (route `(auth)/signup`) remains the **adult/parent** entry. Its `SignupForm` component continues to create `role: 'parent'` accounts. The two entry points have different audiences and different role assignments.
- Inventory `@Roles` decorator tightens to `'child'` only. Parent accounts no longer reach `/inventory`, `/shop`, `/campaign`, `/battle`, etc. — they're not learners.
- Google sign-in is unchanged for Plan 2 (no birthYear collection on OAuth path). Marked as a Plan 3 follow-up.

### Plan 3 slice (deferred — not implemented here)

The under-13 COPPA confirmation pipeline:

- New `parentEmail` field on the under-13 signup form.
- Backend endpoint creates a pending account, sends a confirmation email via Resend, and stores a one-time confirmation token.
- New `/auth/confirm-parent-email?token=...` endpoint flips the account from pending → active.
- Audit log row per parent confirmation (compliance evidence).
- Activation-pending screen on the frontend.

This is roughly a sprint of backend + frontend work and deserves its own brainstorming pass before implementation.

## Alternatives considered

### Option 1 — Parent-creates-child

Parent signs up at `/signup`, then from settings clicks "Add a young hero" → uses existing `authApi.addChild`. Child logs in with their own credentials afterward.

**Why rejected:** two-step onboarding, parent must complete signup first, and the Welcome page's "Begin Quest" tab loses its primary audience. The reference design (`ai-adventure-island`) is built around kids self-onboarding via Welcome — Option 1 fights that affordance.

### Option 3 — Single 'child' role for V1

Defer the parent/child distinction entirely; everyone signs up as `'child'`.

**Why rejected:** weakens the compliance story and creates a tech-debt time-bomb. Once parent dashboards are role-gated post-launch, an audit of every existing account will be needed to assign correct roles retroactively. Cheaper to do this right from the start.

### Option 4 — Defer R5 entirely to Plan 3

Don't pick now; keep `@Roles` broadened.

**Why rejected:** R5 is one of four review findings carried over from Plan 1. Leaving it open extends the broadened `@Roles` and keeps the "Welcome creates parents who shouldn't be parents" semantic wart visible. The minimal slice closes the structural gap today and ships the compliance pipeline as a focused Plan 3 task.

## Consequences

### Positive

- R5 closes in Plan 2 (4 of 4 Plan-1 review findings now resolved).
- Welcome's audience aligns with the product target (kids 8–16).
- Inventory `@Roles('child')` is no longer broadened — least-privilege restored.
- Plan 3 inherits a well-scoped task: the COPPA email pipeline, no other coupling.

### Negative

- **Compliance gap until Plan 3 ships:** under-13 cannot sign up at all. Real users between 8–12 hit a "coming soon" wall. Acceptable for V1 internal/beta but blocks public launch — Plan 3 (or a hotfix branch off Plan 3) must ship before any go-live with the under-13 cohort.
- **Client-trusted role:** the minimal slice computes `role` client-side and the backend currently doesn't recompute from `birthYear`. A motivated user could `POST /auth/signup` with `role: 'child'` regardless of their actual age. Server-side validation is on the Plan 3 work list (treat alongside the COPPA pipeline — the email confirmation IS the age verification mechanism).
- **Google sign-in path unchanged:** Google OAuth users skip the birthYear collection entirely. Edge case; Plan 3 polish task.

## Implementation pointer

- Welcome modification: `apps/web/src/app/page.tsx` — adds birthYear state, age computation, branching, under-13 block.
- Inventory retighten: `apps/api/src/modules/inventory/inventory.controller.ts` — `@Roles('child')` (was `@Roles('child', 'parent')`).
- Carry-over TODOs land in `planning/redesign-task-board.md` under a new "Plan 3 — R5 follow-up" section.

## References

- Plan 1 review finding R5 — [redesign-task-board.md](../../planning/redesign-task-board.md)
- Spec §9 open question 5 — [redesign-from-reference-design.md](../superpowers/specs/2026-05-09-redesign-from-reference-design.md)
- Inventory controller TODO at time of writing — `apps/api/src/modules/inventory/inventory.controller.ts:33-36`
