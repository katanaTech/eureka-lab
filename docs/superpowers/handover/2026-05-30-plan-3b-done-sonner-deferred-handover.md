# Plan 3b DONE + Sonner Deferred — Handover

> **Created:** 2026-05-30. Handover for the next session.
> **State at handoff:** Plan 3b is fully **DONE** (code complete, QA smoke passed, both QA bugs fixed and verified). The redesign branch is pushed and the working tree is clean. One significant infrastructure bug surfaced during the QA fix work and was **deferred** after a deep but unsuccessful investigation — full evidence is below so the next session doesn't repeat it.
> **Supersedes:** [`2026-05-28-plan-3b-ready-handover.md`](2026-05-28-plan-3b-ready-handover.md) (for resume purposes).

---

## TL;DR for the resuming agent

1. Read this doc.
2. Read [`ROADMAP.md`](../../../ROADMAP.md) at the repo root — Plan 3b is marked DONE; Stream 4 has the new Sonner entry.
3. Pick the next direction with the user (see §6 "What's next"). Likely options: **Plan 3c (polish), Sonner investigation, or a Stream 3 ship-blocker.**

The branch `redesign/v2-from-reference` is fully pushed to origin at this handover, draft PR #8 is open. No babysitting needed for what already shipped.

---

## 1. Repo + branch state

- **Working dir:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Branch:** `redesign/v2-from-reference`
- **Tracking:** `origin/redesign/v2-from-reference` — **up to date** after push at handover time.
- **Latest commit:** see `git log --oneline -1` — should be the docs commit that includes this handover.
- **Draft PR:** https://github.com/katanaTech/eureka-lab/pull/8 (OPEN, isDraft).
- **Working tree (leave alone, per Plan 3b carryover):**
  ```
  M .claude/settings.local.json
  M apps/web/tsconfig.tsbuildinfo
  ```

### Baseline health (verify before any new work)
- `pnpm --filter @eureka-lab/web exec tsc --noEmit` → **24 pre-existing test-file errors** (same as Plan 3b pre-flight; not regressions).
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0**.
- `pnpm --filter @eureka-lab/web lint` → **clean**.
- `pnpm --filter @eureka-lab/api test -- --runInBand` → **261 passing / 24 suites** (use `--runInBand` — parallel OOMs on this machine).

---

## 2. What landed in Plan 3b (already DONE — for reference)

23 task commits across A→E + Phase F docs (`3c44b8e` through `9103f9f`), plus two QA-bug fixes after the user's smoke:

| Phase | Closes | Highlights |
|---|---|---|
| A (5 commits) | P3-14 | `SignupDto.role` → `birthYear`; server-derived role; +6 unit tests; Welcome + SignupForm updated |
| B (3 commits) | P3-15 | `POST /auth/complete-oauth-signup` + `OAuthBirthYearModal`; Google-OAuth 404 → modal → profile completion |
| C (7 commits) | P3-16 | `email` + `coppa` modules; under-13 pending → parent email → confirm → Firebase user + `coppaAuditLog` batch; `/confirm-parent/[token]` page; +6 unit tests |
| D (3 commits) | P3-17 | Idempotent `POST /inventory/credit-kp` (kpEvents subcoll); lessons/videos/battle wired to it |
| E (3 commits) | P3-18 | `AcademyProgress` shared type; Firestore-backed `academy-progress` module; store hydrates on auth + writes through |
| F.2 + ADR-007 | — | ROADMAP marked code-complete; `ADR-007-server-side-role-derivation.md` written |
| **QA Bug 1** (`1df4c3f`) | — | **Persistent inline error feedback** on Welcome (Sonner-independent — see §4). The age-17 / signup rejection now shows reliably. |
| **QA Bug 2** (`2a00a92`) | — | `confirmParentEmail` catches `auth/email-already-exists` (idempotent) + frontend `useRef` guard prevents StrictMode double-fire. +unit test. |
| F.2 (final ROADMAP) (`c96332c`) | — | Plan 3b marked **DONE**, smoke passed 2026-05-29, with the two fix SHAs recorded. |

### QA smoke (2026-05-29)
User ran the manual smoke per [`2026-05-29-plan-3b-qa-smoke-brief.md`](2026-05-29-plan-3b-qa-smoke-brief.md). WT2/WT4/WT6/WT7 PASS, WT1/WT8 SKIP (no accounts / no Google config), **WT3 + WT5 found 2 bugs**, both now fixed and re-verified via Playwright in the dev-fix session. The QA report itself is at [`docs/testing-reports/Plan 3b — QA Smoke Report.md`](../../testing-reports/Plan%203b%20%E2%80%94%20QA%20Smoke%20Report.md).

---

## 3. Plan 3b is fully accepted

ROADMAP Stream 2 shows Plan 3b as **DONE** (smoke passed). All five P3-XX items (P3-14…P3-18) resolved. No follow-up `fix(plan-3b):` commits expected — both QA bugs are closed.

---

## 4. ⚠️ Deferred: App-wide Sonner toast failure

**Critical for the next session: do not re-investigate from scratch — start from this evidence.**

### What's broken
Sonner toasts (`toast(...)`, `toast.success/error/message`) **do not render anywhere in this app**. The `<section aria-label="Notifications">` wrapper mounts, but `[data-sonner-toaster] > li` is never created. Affects: Welcome login success, shop purchases, character forge, campaign-prepare lessons/videos, battle prompts, and mission-prep KP — all of these silently no-op. **It does not break any flow** because the actions still complete; only the toast feedback is missing.

### Where it doesn't matter (already covered)
The auth-form rejection (the one QA flagged as Bug 1) routes errors through a **persistent inline alert** added in `1df4c3f` — `fail()` does `setFormError(msg); toast.error(msg);`. The inline channel is load-bearing; the toast was always the bonus. So WT3's "age-17 silent" is fixed regardless of Sonner.

### Proven root cause (don't waste time re-deriving)
The `toast()` emitter and the `<Toaster>` subscriber resolve to **disconnected `ToastState` instances**, despite a single npm copy and `'use client'` in sonner's source. Decisive evidence (browser-reproduced):

| Probe | Result | Implication |
|---|---|---|
| `toast.getHistory().length` after `toast('X')` | **1** | `toast()`'s `ToastState.toasts` has the toast |
| `useSonner().toasts.length` (same import statement!) | **0** | The subscriber never saw it |
| Co-located `<Toaster>` + `toast()` in one component | renders nothing | Not a layout-placement issue |
| `setTimeout(() => flushSync(setState))` in the same component | works (counter goes 0→1) | Not the mechanism — `flushSync` is functional, named and default exports identical |
| `globalThis.__eurekaToastStore.getState().toasts` after my in-house `toast.error` | **`[]`** | Even the from-scratch Zustand replacement (`globalThis`-anchored) didn't reflect the write — so this is below the module-singleton layer |
| Style tag count | 1 sonner `<style>` | Looks like single module on the surface, but `getHistory` vs `useSonner` proves the emitter/subscriber split anyway |
| Single React, single sonner npm copy (`pnpm why react`, `ls .pnpm/sonner*`) | confirmed | Not duplicate npm |

### Fixes that were tried and FAILED
1. **`'use client'` wrapper component** around `<Toaster>` in the root layout → no change.
2. **`transpilePackages: ['sonner']`** in next.config → no change.
3. **`webpack.resolve.alias['sonner$']`** → absolute path of `dist/index.mjs` (verified via `node -e require.resolve`) → no change.
4. **From-scratch in-house toast** (`apps/web/src/lib/toast.tsx`) backed by a Zustand store + `<Toaster>` component, with the store anchored on `globalThis.__eurekaToastStore` to defeat any module duplication, with `<Toaster>` rendered inside the client `<Providers>` (not the server layout), and all 6 `from 'sonner'` import sites repointed → **toast also failed to render** (`storeToasts: []` after `toast.error`). All of these experiments are **reverted in the current tree** (working tree is clean).

The fact that the in-house replacement *also* failed strongly suggests this isn't sonner-specific — there's something in this Next 14.2.35 + React 18.3.1 + the layout/Providers shape that breaks module-singleton-backed reactive stores in a way that wasn't fully characterized. Note that the app's **other Zustand stores (`inventory-store`, `character-store`, `academy-progress-store`) do work** — they are imported by client components in the learner subtree, NOT by `<Providers>` in the root chain. That distinction may matter.

### Recommended directions for the next session (do NOT just re-run the failed fixes)
- **A. Production build test (cheap, decisive).** `pnpm --filter @eureka-lab/web build && pnpm --filter @eureka-lab/web start`, then exercise toasts. If they work in prod, this is a **dev-mode-only artifact** of Next's separate per-route client compilation and the practical "fix" is "don't sweat it for dev." This is the highest-value next step.
- **B. Try the same probe page but rendered under `(learner)/layout.tsx`** (which is itself a `'use client'` boundary, not the root server layout). The in-house store + `<Toaster>` rendered from `(learner)/layout.tsx` (and toast emitted from `(learner)/dashboard/page.tsx`) would test whether the breakage is specifically the root server-layout → Providers boundary. If it works there, the fix is: render the global Toaster from a `'use client'` layout *below* root (or in some other client-rooted spot).
- **C. Replace Sonner with a portal-based approach** that doesn't rely on module-singleton subscribe (e.g., a context-provider model where the Toaster *owns* the store and exposes `toast()` via context). More code, but immune to whatever module-instance issue is biting both Sonner and the Zustand-anchored attempt.
- **D. Pin a different Sonner version.** Sonner 1.x had a simpler subscribe path; a downgrade test is cheap. The current version is `sonner@2.0.7` (single install in `node_modules/.pnpm`).

### What NOT to do
- Don't add `<Toaster>` directly to the server root layout and call it done — that's how it was when I started.
- Don't re-add `transpilePackages: ['sonner']` or the webpack alias — both verified ineffective. The committed `next.config.js` is the original (no Sonner-specific entries).
- Don't change Sonner internals or patch node_modules.

---

## 5. Carried-over gotchas (still true)

From the 2026-05-28 handover (unchanged where not otherwise noted):

1. **This repo is Next.js 14.2.35, NOT 15.** Dynamic-route `params` are synchronous.
2. **Don't call `router.replace()` during render** — wrap in `useEffect`.
3. **Tailwind v4, NOT v3.** No `tailwind.config.ts`; config lives in `apps/web/src/app/globals.css` under `@theme inline`.
4. **`shared-types` needs dual-resolution exports**; rebuild after editing (`pnpm --filter @eureka-lab/shared-types build`).
5. **`useAuthStore.user` is `UserProfile`**, not Firebase `User`.
6. **Sonner toaster is mounted in `app/layout.tsx` root (server component)** — and **does not render any toasts** in dev (see §4).
7. **Don't modify files under `docs/superpowers/`** — plans/specs/handovers are append-only. Record ongoing status in `ROADMAP.md`.
8. **Don't delete `_future_r3f/`** — 27 parked R3F components for the future 3D phase.
9. **Plan 3b changed `/auth/signup`** — it now takes `birthYear` not `role`. Teachers can no longer be made via that endpoint (the curl trick); seed in Firestore or build the teacher-signup UI gap (Stream 4).
10. **API tests OOM in parallel.** Use `pnpm --filter @eureka-lab/api test -- --runInBand` (`NODE_OPTIONS=--max-old-space-size=6144` helps if it still OOMs).
11. **Next.js dev first-compile is slow (~90s on this machine)** and exceeds Playwright's default 60s navigate timeout. If automating browser tests, pre-warm routes via curl before navigating, or bump the Playwright timeout. (Encountered this in the QA session.)

---

## 6. What's next — pick with the user

In rough priority order, but **ask the user first**:

| Option | Scope | Notes |
|---|---|---|
| **Plan 3c — polish** | Big (~20 tasks across i18n re-key P3-08/09, RTL Arabic font P3-10, E2E rewrite P3-11, retire `useMobileDetect` P3-12, PWA/Sentry verify P3-13, `AiTutorChat.chapterName` P3-19, P3a-N1–N4) | Not written yet. Natural next plan in the redesign sequence. |
| **Sonner global toast fix** | Medium — start with §4 Recommendation A (prod-build test) | Could be its own small plan or folded into Plan 3c polish. |
| **Stream 3 ship-blockers** | Large — Stripe webhooks (STRIPE-001), broader COPPA audit (COPPA-001), prod env vars (DEPLOY-001), test coverage (QA-001), i18n/security/a11y/perf | Untouched by the redesign branch; block production launch. |
| **Plan TBD (combat validation)** | Medium — P3-07 hybrid combat validation, split out of 3b | Not blocking ship; only matters once anti-cheat pressure shows up. |
| **Teacher signup UI** | Small — 3-5 tasks; ⚠️ blocked-by + caused-by Plan 3b Phase A change to `/auth/signup` | Could fold into Plan 3c. |

---

## 7. User preferences (still current as of 2026-05-30)

- **Push timing:** every push individually approved. Don't push without being told.
- **Update cadence:** brief. Report at phase boundaries, not between every task.
- **Smoke testing:** **user-driven.** Hand a smoke brief (like [`2026-05-29-plan-3b-qa-smoke-brief.md`](2026-05-29-plan-3b-qa-smoke-brief.md)) to a fresh QA session rather than running Playwright autonomously in the dev session.
- **Commit granularity:** one commit per task (conventional commits: `feat(scope):`, `fix(scope):`, `docs(...)`, `test(...)`, `chore(...)`).
- **Execution mode:** inline with phase checkpoints worked for Plans 2, 3a, 3b. Default to that unless asked.
- **Commit message footer:** `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- **Anti-rabbit-hole:** the user appreciates a clear "I'm stopping and reverting, here's why" over indefinite digging. The Sonner deep-dive crossed that threshold; the responsible move was to revert all experiments and document — which is what happened.

---

## 8. Where to find things

- **Canonical planning entry:** [`ROADMAP.md`](../../../ROADMAP.md) (repo root).
- **Plan 3b plan doc (executed):** [`docs/superpowers/plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md`](../plans/2026-05-15-redesign-plan-3b-r5-and-persistence.md).
- **Plan 3a plan doc (executed):** [`docs/superpowers/plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md`](../plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md).
- **ADR-006 (kid signup decision):** [`docs/context/ADR-006-kid-signup-flow.md`](../../context/ADR-006-kid-signup-flow.md).
- **ADR-007 (server-side role derivation — landed in Plan 3b):** [`docs/context/ADR-007-server-side-role-derivation.md`](../../context/ADR-007-server-side-role-derivation.md).
- **Plan 3b QA smoke brief (handed to the QA session):** [`2026-05-29-plan-3b-qa-smoke-brief.md`](2026-05-29-plan-3b-qa-smoke-brief.md).
- **Plan 3b QA smoke report (the result):** [`docs/testing-reports/Plan 3b — QA Smoke Report.md`](../../testing-reports/Plan%203b%20%E2%80%94%20QA%20Smoke%20Report.md).
- **Redesign spec:** [`docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md`](../specs/2026-05-09-redesign-from-reference-design.md).
- **CLAUDE.md (project rules — read first):** [`CLAUDE.md`](../../../CLAUDE.md).

---

*Handover authored 2026-05-30 at the seam between Plan 3b (DONE + smoke-passed + 2 fixes verified + pushed) and whatever comes next. Supersedes [`2026-05-28-plan-3b-ready-handover.md`](2026-05-28-plan-3b-ready-handover.md) for resume purposes.*
