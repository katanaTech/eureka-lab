# ADR-001: Frontend State Management Decision

**Date:** Sprint 1
**Status:** Accepted
**Deciders:** ARCH
**Supersedes:** None

---

## Context

The frontend application needs two categories of state management:

1. **Client-side ephemeral state** — UI state that does not need to be persisted or synchronised with the server. Examples: which modal is open, sidebar expanded/collapsed, current theme, auth session object held in memory.

2. **Server state** — data fetched from the NestJS API that must be cached, kept fresh, synchronised across components, and updated optimistically. Examples: user profile, module list, progress records.

We evaluated the following options:

| Option | Client State | Server State |
|--------|-------------|--------------|
| Redux Toolkit | Yes | Via RTK Query |
| React Context API | Yes (limited) | No |
| Zustand | Yes | No |
| SWR | No | Yes |
| TanStack Query (React Query) | No | Yes |

**Key criteria:**
- Bundle size must be minimal for PWA performance.
- Developer experience must be approachable for a fast-moving sprint team.
- No over-engineering: the app does not need time-travel debugging or complex middleware chains.
- Server state management must support caching, background refetch, optimistic updates, and stale-while-revalidate patterns.

---

## Decision

**Zustand** for all global client-side state.
**TanStack Query (React Query v5)** for all server state.

These two libraries are used together and cover complementary concerns. They do not overlap.

### Zustand — Client State

- Lightweight (< 2 KB gzipped), zero boilerplate, no provider wrapping required.
- State is defined in small, focused store files.
- Devtools support via `zustand/middleware` — compatible with Redux DevTools.
- Maximum 5 Zustand stores across the entire app:
  - `useAuthStore` — Firebase auth session, user role/plan
  - `useUIStore` — modal state, sidebar state, active theme
  - `usePromptEditorStore` — ephemeral prompt editor state (Level 1 module)
  - (2 reserved for future levels)

### TanStack Query — Server State

- Industry-standard server state library with excellent TypeScript support.
- Provides: automatic caching, background refetch, window-focus refetch, stale-while-revalidate, paginated queries, optimistic mutations.
- Used for all data fetched from the NestJS API (modules, progress, profile, leaderboard).
- Query keys follow the pattern: `[resource, identifier, ...filters]`.
- All TanStack Query hooks live in `apps/web/lib/queries/`.

### What is NOT used

- **Redux / Redux Toolkit** — rejected due to boilerplate overhead and larger bundle impact. RTK Query would duplicate TanStack Query's capabilities.
- **React Context API** — acceptable for theming only. Not to be used for any data that updates frequently (causes unnecessary re-renders).
- **SWR** — rejected in favour of TanStack Query's richer feature set (optimistic updates, mutation lifecycle callbacks, DevTools).
- **Jotai / Recoil** — no strong advantage over Zustand for our use case.

---

## Consequences

### Positive

- Simple mental model: Zustand = UI state, TanStack Query = server data. Every developer knows where to look.
- Small bundle: Zustand (~2 KB) + TanStack Query (~12 KB) combined is far smaller than Redux Toolkit + RTK Query.
- TanStack Query's cache eliminates redundant API calls across components without manual coordination.
- Devtools for both libraries exist and work well.

### Negative

- Two paradigms to learn for new developers (Zustand store pattern + TanStack Query hooks pattern). Mitigated by clear documentation and code examples in `docs/rules/fe-rules.md`.
- Care must be taken not to duplicate server state in Zustand. Rule: if the data comes from the API, it belongs in TanStack Query, not Zustand.

---

*ADR authored by ARCH agent | See also: ADR-004 (Monorepo), ADR-005 (Authentication)*
