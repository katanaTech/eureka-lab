# Architecture Decision Records (ADRs)

> ADRs document significant architecture decisions and WHY they were made.
> They prevent agents from re-litigating settled decisions.
> Maintained by ARCH agent. All agents must read before proposing architectural changes.

---

## ADR-001: Frontend Framework Selection

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH

### Decision
Next.js 14 with App Router.

### Context
We need a React framework that supports SSR, PWA, i18n, and deploys to Vercel.

### Consequences
- App Router is the modern Next.js pattern — use it exclusively. No Pages Router.
- Server Components reduce JS bundle size — use them for data-fetching pages.
- Client Components ("use client") only when interactivity is required.
- RSC pattern: page fetches data server-side, passes to client component for interaction.

---

## ADR-002: AI Gateway Abstraction

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH

### Decision
All AI API calls go through a single `AiGatewayService` in the NestJS backend. The frontend never calls AI providers directly. The gateway abstracts the provider (Claude today, swappable tomorrow).

### Context
Direct frontend→Anthropic calls would expose API keys, bypass moderation, bypass token budgeting, and make provider switching impossible.

### Consequences
- `AiGatewayService` is the ONLY class that imports `@anthropic-ai/sdk`.
- All AI calls stream via Server-Sent Events (SSE): client → NestJS → Anthropic.
- The gateway interface is defined in `packages/shared-types/ai-gateway.ts`.
- Switching providers = update `AiGatewayService` only, zero frontend changes.

---

## ADR-003: State Management Split

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH

### Decision
- **Zustand:** Client-side ephemeral state (auth session, UI modals, sidebar state)
- **TanStack Query:** All server state (modules, progress, profile) with caching

### Context
Using a single state manager for both server and client state creates cache invalidation complexity and overcomplicates server data synchronisation.

### Consequences
- No Redux, no Context API for data (Context is acceptable for theming only).
- TanStack Query handles optimistic updates, background refetch, and stale-while-revalidate.
- Zustand stores are small and focused. Max 5 stores in the entire app.

---

## ADR-004: Monorepo Structure

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH + DEVOPS

### Decision
Turborepo monorepo with pnpm workspaces.

### Packages:
- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/shared-types` — TypeScript types + API client (shared between apps)
- `packages/ui` — Extended shadcn/ui components
- `packages/ai-prompts` — Version-controlled system prompts for all 4 levels

### Consequences
- Changes to `shared-types` trigger rebuilds in both apps (Turborepo handles this).
- The `ai-prompts` package is version-controlled separately — prompt changes go through PR review.
- Never cross-import between `apps/` directly. Always go through `packages/`.

---

## ADR-005: Authentication Architecture

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH + BE

### Decision
Firebase Authentication for identity + NestJS custom claims for roles/plan.

### Flow:
1. User authenticates with Firebase client SDK (Google OAuth or email/password)
2. Firebase issues an ID token (JWT, expires 1 hour)
3. Frontend sends ID token to `POST /auth/login`
4. NestJS verifies token via Firebase Admin SDK
5. NestJS sets custom claims on the Firebase user: `{ role, plan, parentUid }`
6. Subsequent requests use the Firebase ID token as Bearer token
7. NestJS `FirebaseAuthGuard` verifies the token and extracts claims on every request

### Consequences
- No custom JWT generation — Firebase handles token signing and rotation.
- Custom claims propagate to frontend via Firebase Auth state — frontend can read role/plan without extra API call.
- Token refresh: frontend calls `getIdToken(true)` to force refresh when custom claims change.
- The `FirebaseAuthGuard` is applied globally. Routes are explicitly marked `@Public()` to opt out.

---

## ADR-006: Content Moderation Architecture

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH

### Decision
Three-layer moderation pipeline: pre-generation (input) → post-generation (output) → human review queue.

### Layers:
1. **Pre-generation:** Regex + NLP rules applied to user input before AI call. Blocks jailbreaks, PII, adult keywords. Implemented in `ModerationService.screenInput()`.
2. **Post-generation:** AWS Comprehend Detect Toxicity + custom rules applied to AI output. Implemented in `ModerationService.screenOutput()`.
3. **Human review:** BullMQ queue for flagged content. Admin dashboard for review. Implemented via `ModerationQueueService`.

### Consequences
- AI API is never called if Layer 1 blocks the input. Cost savings + safety.
- All AI interactions are logged regardless of pass/fail (audit trail).
- Human review queue SLA: P1 (safety) = 1 hour, P2 = 24 hours, P3 = 72 hours.
- Layer 2 uses AWS Comprehend: ~$0.0001/unit. Budget this into per-request cost.

---

## ADR-007: Database Strategy

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH

### Decision
Firestore as primary database. No relational database in Phase 1.

### Rationale
- Firebase ecosystem alignment (Auth + Storage + Firestore = single billing, single SDK)
- Real-time capabilities useful for parent dashboard updates
- Scales to millions without infrastructure management

### Constraints (enforce these — Firestore anti-patterns are expensive):
- **No collection scans.** Every query must use an indexed field.
- **No nested subcollections deeper than 2 levels.**
- **Batch writes** for multi-document operations (atomic updates, max 500 docs/batch).
- **Composite indexes** must be defined in `firestore.indexes.json` before deploying queries that use them.

### Future:
If analytics requirements grow beyond Firestore's query capability (e.g., complex aggregations for school district reporting), BigQuery export via Firebase Extension is the upgrade path. Not before Phase 3.

---

## ADR-008: i18n Strategy

**Date:** Sprint 1
**Status:** ACCEPTED
**Deciders:** ARCH + FE

### Decision
`next-intl` for all internationalisation. Three locales from day one: English (`en`), French (`fr`), Arabic (`ar`).

### RTL Strategy:
- Tailwind `rtl:` variants for directional layout
- `dir` attribute set on `<html>` element based on locale
- Arabic uses Modern Standard Arabic (not Lebanese colloquial) for maximum MENA reach

### AI Prompt i18n:
- System prompts in `packages/ai-prompts` have locale variants: `module.en.ts`, `module.fr.ts`, `module.ar.ts`
- Model performance must be tested in all 3 languages before a module ships
- Locale detection: browser `Accept-Language` header, with manual override in user settings

---

*Last updated: Sprint 1 | Maintained by: ARCH agent*
*New ADRs require: problem statement, options considered, decision, and consequences.*
