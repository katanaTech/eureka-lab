# ADR-004: UI Mode Resolution (User Preference vs Tenant Lock)

> **Status:** ACCEPTED
> **Date:** 2026-04-25
> **Author:** ARCH agent
> **Implements:** [planning/phase-16-gamified-ui-redesign.md](../../planning/phase-16-gamified-ui-redesign.md) §9
> **Depends on:** ADR-002

---

## Context

The platform serves two distinct customer types:

- **B2C** — individual parents and children. Each child should be free to pick the learning
  presentation that suits them (Normal or Gamified).
- **B2B education clients** — schools, after-school programs, and learning centres. These
  customers need consistent presentation across all their students for classroom management and
  pedagogical reasons. A teacher running a synchronous lesson cannot have half the class on
  Gamified mode and half on Normal mode.

Both customer types share the same authentication, curriculum, and storage. UI mode resolution
must support per-user preference for B2C, and tenant-enforced override for B2B.

## Decision

### 1. Two persisted settings

| Setting | Location | Owned by | Default |
|---|---|---|---|
| User preference | `users/{userId}.uiMode: 'normal' \| 'gamified'` | User (via `/settings`) | `'normal'` |
| Tenant lock | `tenants/{tenantId}.uiModeLock: { mode: 'normal' \| 'gamified' \| null, locked: boolean }` | Tenant admin (via `/admin/tenant`) | `{ mode: null, locked: false }` |

### 2. Single resolver

A backend service `UiModeResolver` is the **only** code path that decides the effective mode:

```typescript
function resolveEffectiveUiMode(user: User, tenant?: Tenant): UiMode {
  if (tenant?.uiModeLock?.locked && tenant.uiModeLock.mode) {
    return tenant.uiModeLock.mode;
  }
  return user.uiMode ?? 'normal';
}
```

- Tenant lock wins when active (`locked: true` AND `mode != null`).
- Otherwise falls through to user preference.
- Never trusted from the client; always re-derived server-side.

### 3. Where the resolver is called

- Every authenticated request whose response or behavior depends on UI mode (KP earning hook,
  parent dashboard rendering hints, etc.) calls `UiModeResolver` and caches the result in the
  request context (avoids repeated Firestore reads within one request).
- Frontend fetches the effective mode from `GET /api/v1/users/me/settings` on session start, and
  receives change-notifications via the existing TanStack Query invalidation pattern.

### 4. Frontend rendering behaviour

- The root layout sets `<html data-ui-mode="normal" | "gamified">` based on the resolved mode.
- CSS variable scopes (see [planning/phase-16-gamified-ui-redesign.md](../../planning/phase-16-gamified-ui-redesign.md) §4.1) live under `[data-ui-mode="game"]`.
- Switching mode triggers a `router.push(currentRoute)` and TanStack Query refetch of layout-level
  data — does not require a full page reload.

### 5. UX for locked-tenant users

When a user belongs to a tenant with `uiModeLock.locked === true`, the `/settings` page hides the
mode toggle and shows:

> Learning mode is set by your school administrator.

This message is informational, not error. The setting endpoint (`PUT /users/me/settings`) returns
`403 Forbidden` with `code: 'UI_MODE_LOCKED_BY_TENANT'` if the user attempts to override.

### 6. Mid-session safety

Mode toggle is disabled while:

- A combat session is in progress (`combatStore.phase !== 'idle'`).
- An AI prompt is mid-stream.
- A purchase is mid-transaction.

The frontend disables the toggle UI; the backend rejects with `409 Conflict` if it slips through.

## Consequences

**Positive**

- Single source of truth (`UiModeResolver`) prevents drift between client decisions and server
  decisions.
- B2B clients get the consistency they need without affecting B2C flexibility.
- Mid-session protections prevent state corruption.
- Settings endpoint behavior is explicit and testable.

**Negative**

- One extra Firestore read on every mode-sensitive endpoint (mitigated by per-request caching
  and `users` and `tenants` documents being small).
- B2B clients who unlock the mode mid-curriculum may find their students suddenly seeing a
  different UI on next refresh — UX needs a notice. (Tracked as a follow-up: tenant admin sees
  a warning before unlocking that "students will see the mode change on next session.")

**Neutral**

- Free users without a tenant simply skip the tenant branch in the resolver.

## Alternatives Considered

1. **Single `uiMode` field on `users/{userId}`, tenant lock not modeled.** Rejected — B2B clients
   have no enforcement mechanism.

2. **Tenant lock as a hard write on every user under the tenant.** Rejected — needs a backfill
   on every lock change, expensive and racy.

3. **Resolve mode on the frontend.** Rejected — clients can lie. Server-side enforcement
   matters because KP earning depends on it (ADR-003).

4. **Per-class (rather than per-tenant) lock.** Out of scope for v1; revisit in a future ADR when
   B2B classroom features land.

## Acceptance Criteria

- Unit test for `UiModeResolver` covers all 4 cases:
  (locked + mode=normal), (locked + mode=gamified), (unlocked + user=normal),
  (unlocked + user=gamified).
- Integration test: locked-tenant user receives `403 UI_MODE_LOCKED_BY_TENANT` from
  `PUT /users/me/settings`.
- E2E test (Playwright): toggling mode mid-battle is blocked in the UI.

---

*Authored 2026-04-25 by ARCH agent.*
