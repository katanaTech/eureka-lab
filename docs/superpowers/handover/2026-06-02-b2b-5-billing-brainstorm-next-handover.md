# B2B Sub-project 5 (Subscriptions / Billing / Key Rotation) — Brainstorm Next — Handover

> **Created:** 2026-06-02. For the next session (a fresh session, per the user's request).
> **State at handoff:** Sub-projects **1, 2, 3, 4a, 4b are DONE** (PRs #9–#13). **Sub-project 5 has NO brainstorm, NO spec, NO plan, NO code.** Your job: **start the established cycle from the top — `superpowers:brainstorming` first**, then spec → `writing-plans` → `subagent-driven-development`. Do **not** jump to a plan; 5 is unspecified.

---

## TL;DR for the resuming agent

1. Read **CLAUDE.md** (root) first, then **[ROADMAP.md](../../../ROADMAP.md) Stream 6**.
2. Read the **epic spec** [`2026-05-30-school-tenancy-b2b-epic-design.md`](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) and **[ADR-008](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)** (locked tenancy architecture).
3. Read the open **`STRIPE-001`** blocker in ROADMAP — sub-project 5 **intersects** it (B2B billing rides on the same Stripe layer). Also re-read **Phase 7** consumer Stripe (`apps/api/src/modules/payments/`) since 5 extends it.
4. **Invoke `superpowers:brainstorming`** to define sub-project 5's scope and design with the user, then write the spec to `docs/superpowers/specs/2026-06-…-school-tenancy-billing-design.md`. Only after the spec is approved: `superpowers:writing-plans` → `superpowers:subagent-driven-development` (the cycle the user has used for every B2B slice).
5. **Branch:** create a new stacked branch **`feat/school-b2b-billing`** off **`feat/school-classroom-rollup`** (4b, PR #13) before Task 1. Each sub-project gets its own stacked branch + its own PR.
6. **Never push without explicit approval.** Finish → `superpowers:finishing-a-development-branch` → user picks "push + PR" per slice.

---

## 1. What sub-project 5 is (from the epic spec)

**"B2B subscriptions / billing / key rotation"** — the real commercial layer. From the epic (§ scope table + open questions):

- **Per-seat school subscriptions** vs. the existing per-user consumer Stripe (Phase 7). Likely a **separate Stripe product/price**. This is the core of 5.
- **Ties into `STRIPE-001`** (the open Stripe-webhook ship-blocker) — B2B billing needs reliable webhooks.
- **Secret-key rotation.** The foundation (sub-project 1) stored a simple `enrollmentSecret`/secret-key field on the school; sub-project 5 defines its **semantics** (enrollment code? API key?) and **rotation** flow. (Note 4a/4b use a `loginCode` for student sign-in — clarify how that relates to the school "secret key" during brainstorming.)
- **Super-admin usage-over-time analytics** — deferred here from sub-project 2 (super-admin console) and again from 4b. The 4b spec explicitly parked "usage views / usage-over-time" to sub-project 5. Decide in brainstorming whether analytics belongs in 5 or splits out (as 4 split into 4a/4b).
- **Depends on** sub-projects 2 (super-admin console — where billing UI likely lives) and 4 (seats/enrollment that billing meters).

**Open design questions to resolve in brainstorming** (don't assume answers): per-seat vs. per-school-flat pricing; trial/proration; who pays (school invoice vs. card); separate Stripe product vs. metadata on the consumer product; secret-key = enrollment code vs. API key vs. both; analytics scope (in 5 or deferred); how this interacts with the unresolved `STRIPE-001`.

**Likely the final B2B slice.** After 5, the epic is delivered.

---

## 2. Repo + branch state

- **Working dir:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Current branch at handoff:** `feat/school-classroom-rollup` (4b, PR #13). HEAD `4759bb7`.
- **The B2B stack is rooted on the redesign branch, NOT main.** Full chain (each PR's base in parens):
  - **#8** `redesign/v2-from-reference` → `main`
  - **#9** `feat/school-tenancy` → `redesign/v2-from-reference` (sub-project 1)
  - **#10** `feat/school-superadmin-console` → `feat/school-tenancy` (2)
  - **#11** `feat/school-admin-console` → `feat/school-superadmin-console` (3)
  - **#12** `feat/school-student-enrollment` → `feat/school-admin-console` (4a)
  - **#13** `feat/school-classroom-rollup` → `feat/school-student-enrollment` (4b) ← **stack tip**
  - **5 → `feat/school-b2b-billing`** (new) off `feat/school-classroom-rollup`, base on #13.
  - **#14** `fix/ci-lint-and-prerender-build` → `main` (standalone CI lint hotfix — see §4)
- **Working tree — leave alone:** `M .claude/settings.local.json` (per-machine; never stage). `.vercel/` is gitignored (local Vercel link).
- **PR-merge ordering:** #8 → #9 → #10 → #11 → #12 → #13 → then 5. GitHub auto-retargets a stacked PR's base when its parent merges.

### Baseline health (verify before Task 1)
- `pnpm --filter @eureka-lab/api exec tsc --noEmit` → **0 errors**
- `pnpm --filter @eureka-lab/api exec jest --runInBand` → **37 suites / 363 tests pass**
- `pnpm --filter @eureka-lab/web lint` → **clean**; `pnpm turbo lint` → **7/7**
- `pnpm --filter @eureka-lab/web exec tsc --noEmit 2>&1 | grep -c "error TS"` → **24** (pre-existing test-file errors; not regressions)
- `pnpm --filter @eureka-lab/web exec next build` → **succeeds** on 4b (23/23 pages) — but only because of the fix in §4. (Build is NOT part of CI; CI runs lint + jest + vitest.)

---

## 3. What this session delivered (sub-project 4b + infra fixes)

**4b — DONE (PR #13).** All 11 plan tasks landed via subagent-driven-development (spec→plan→execute, two-stage review per task): classroom `schoolId` stamping; teacher roster assignment (`POST /classrooms/:id/students`); roster source (`GET /classrooms/roster`); same-school join hardening (`CROSS_SCHOOL_JOIN`, also rejects non-child); school-admin rollup (`GET /schools/:id/classrooms`, 3 guards); teacher Add-students picker; `/school` Classrooms tab; `SchoolClassrooms` i18n en/fr/ar; ROADMAP row flipped. api: classrooms ~95% / schools ~92% coverage. Two intentional, documented deviations: net-new capacity arithmetic; defense-in-depth `role==='child'` on join.

**Then the user hit failing CI + Vercel and we fixed three pre-existing issues (none caused by 4b):**

1. **CI lint (main, red since 2026-05-11)** — the Zustand action `useSparkCharge` was named like a hook → `react-hooks/rules-of-hooks` false positive. Renamed → `spendSparkCharge`. Fix is **on `main` via PR #14** (`fix/ci-lint-and-prerender-build`). main now lints + builds + web-tests green.
2. **Vercel build crash** — `next@14.2.35`'s **SWC server minifier** miscompiled a feature-stack module into `TypeError: e[o] is not a function`, crashing RSC prerender (and would 500 at runtime). Fix: `experimental.serverMinification: false` in `apps/web/next.config.js`. Verified on Vercel's Linux build. **On 4b only** (commit `29f5f64`).
3. **Stray root `vercel.json`** — re-introduced by a revert; forces Root Directory = repo root, conflicting with `apps/web/vercel.json`. Removed (commit `5a67c6c`), restoring parity with main.

**Vercel publishing:** auto-deploy is **off by design** (the project's "Ignored Build Step" skips git-triggered builds — the user wants manual deploys). 4b was published via **`vercel deploy`** (CLI bypasses the ignore step): preview https://eureka-53dpzjmja-katanatech.vercel.app. A manual deploy guide was added: **[docs/deployment/vercel.md](../../deployment/vercel.md)** (commit `4759bb7`).

---

## 4. Open issues / caveats (READ before deploying or merging)

- **The build fix (`serverMinification:false`) and the root-`vercel.json` removal are ONLY on the 4b branch (#13).** The **redesign branch (#8)** and lower B2B branches (#9–#12) still carry the SWC build crash and (some) the stray root `vercel.json`. Any `next build` / Vercel deploy of those branches will fail until 4b's commits propagate. **Recommended:** cherry-pick `29f5f64` (and `5a67c6c` if present there) onto `redesign/v2-from-reference` so the whole stack builds. Confirm with the user before touching #8.
- **`STRIPE-001`** (Stripe webhook ship-blocker) is still open and **intersects sub-project 5**. Resolving or scoping around it is part of 5's brainstorming.
- **CI only runs on `main`/`develop`** (`.github/workflows/ci.yml`) — it does **not** run on the stacked feature PRs. Don't expect green checks on #9–#13 from CI; validate locally.
- **`next build` is not in CI** — that's why the SWC crash went unnoticed across the redesign. Consider proposing a CI build step during 5 (ask the user).
- **next-intl `ENVIRONMENT_FALLBACK`** warnings appear during build (non-fatal): i18n date/number formatting without a configured `timeZone`. Harmless to the build but can cause SSR/client hydration mismatches — a small optional follow-up (set `timeZone` in the next-intl config).

---

## 5. Conventions & gotchas (carried from 4a/4b — still apply)

1. **API tests:** `pnpm --filter @eureka-lab/api exec jest --runInBand [path]`. **Never** `... test -- --runInBand`. `NODE_OPTIONS=--max-old-space-size=6144` if OOM.
2. **Rebuild shared-types after editing** `packages/shared-types/src/index.ts`: `pnpm --filter @eureka-lab/shared-types build`. Commit only `src/`.
3. **Commit footer (every commit):** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. One commit per task; conventional subjects. Use the **Bash heredoc** `git commit -F - <<'EOF' … EOF` (the Bash tool is bash; PowerShell `@'…'@` fails).
4. **NestJS route ordering:** declare static routes (`@Get('foo')`) **before** param routes (`@Get(':id')`).
5. **Controller specs** must `.overrideGuard(...)` every guard the controller uses (TenantGuard routes = 3 guards: `FirebaseAuthGuard`, `RolesGuard`, `TenantGuard`).
6. **Sonner toasts broken app-wide** — all UI feedback is **inline** local state, never `toast()`.
7. **Next.js 14.2** — dynamic-route `params` are synchronous (`params.id`).
8. **Tailwind v4** tokens in `apps/web/src/app/globals.css` `@theme inline`. `GameButton` variants: `primary | gold | ghost | danger` (no `secondary`). `panel` class exists.
9. **Web `tsc` has 24 pre-existing test-file errors.** Success for frontend tasks = count **stays 24**, not zero.
10. **No frontend unit tests this stack** (web harness shaky). Frontend verification = lint + tsc(24) + user smoke. **Backend carries the ≥80% coverage bar.**
11. **i18n** keys in **all three** locales (en/fr/ar). Validate JSON: `node -e "['en','fr','ar'].forEach(l=>{require('./apps/web/src/messages/'+l+'.json');console.log(l,'OK')})"`. (Watch the `Teacher` namespace — `cancel` lives there now; don't assume a key exists, grep first.)
12. **Stripe lives in** `apps/api/src/modules/payments/` (consumer flow, Phase 7) — read it before designing the B2B billing layer. Schools module: `apps/api/src/modules/schools/`. School docs carry `seatLimit`, `seatsUsed`, `loginCode`, subscription fields (see `School` type in shared-types).

---

## 6. User preferences (current as of 2026-06-02)

- **Execution mode:** **subagent-driven-development** (fresh subagent per task; spec-compliance review then code-quality review; fix-and-re-review loops). Worked well for 4a + 4b.
- **Brainstorm first** for an unspecified slice (5 has no spec). Then spec → plan → execute.
- **Push timing:** every push individually approved. **Never push unprompted.**
- **Branching:** each sub-project = its own stacked branch off the previous, own PR.
- **Commit granularity:** one commit per task; within-task review fixes folded via `git commit --amend` (branch unpushed) to keep tasks atomic.
- **Deployment:** **manual only** (CLI `vercel deploy` / `--prod`). User dislikes auto-deploy; keep the Ignored Build Step on. See [docs/deployment/vercel.md](../../deployment/vercel.md).
- **Updates:** brief; report at phase/task boundaries. **Smoke testing:** user-driven — hand a short smoke brief; they run it and report before push.
- **Technical rigor on reviews:** triage findings, fix the genuine ones, decline precedent-consistent/out-of-spec ones **with a stated reason**; announce deviations briefly. The user values "I'm adjusting, here's why" over silent drift.

---

## 7. Where to find things

- **Epic spec:** [`2026-05-30-school-tenancy-b2b-epic-design.md`](../specs/2026-05-30-school-tenancy-b2b-epic-design.md) · **ADR-008:** [`…role-hierarchy.md`](../../context/ADR-008-school-tenancy-and-role-hierarchy.md)
- **Closest templates (DONE):** 4b [spec](../specs/2026-05-31-school-tenancy-classroom-rollup-design.md) · [plan](../plans/2026-05-31-school-tenancy-classroom-rollup-plan.md) · this session's predecessor handover [`…4b…spec-done-handover.md`](2026-05-31-b2b-4b-classroom-rollup-spec-done-handover.md)
- **Canonical state:** [`ROADMAP.md`](../../../ROADMAP.md) Stream 6 (1–3, 4a, 4b DONE; 5 NOT WRITTEN) + `STRIPE-001` blocker.
- **Deploy guide:** [`docs/deployment/vercel.md`](../../deployment/vercel.md). **Project rules (read first):** [`CLAUDE.md`](../../../CLAUDE.md).

---

*Handover authored 2026-06-02 at the seam between sub-project 4b (DONE + deployed) and sub-project 5 (unspecified). The next session starts with `superpowers:brainstorming` for sub-project 5 — do not skip to a plan.*
