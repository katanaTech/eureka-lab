# Plan 3b — QA Smoke Brief (P3-14…P3-18)

> **For:** a fresh QA session. **Created:** 2026-05-29.
> **Role:** You are the QA agent (CLAUDE.md §4). Your job here is **manual feature smoke** of Plan 3b — confirm the flows work in a real browser, report any regressions. You do NOT write feature code; if you find a bug, file it (see §7) and hand back.

---

## 1. What you're testing

Plan 3b is **code-complete but unsmoked**. It shipped 23 commits on branch `redesign/v2-from-reference` covering five items:

| ID | What | Where it shows up |
|---|---|---|
| P3-14 | Server derives role from `birthYear` (client no longer sends `role`) | Welcome `/`, `/signup` |
| P3-15 | Google OAuth age gate (birthYear modal for first-time OAuth users) | Welcome `/` → "Sign in with the Google Sigil" |
| P3-16 | Under-13 COPPA pipeline (parent-email confirmation) | Welcome `/` → under-13 birthYear → parent email → `/confirm-parent/[token]` |
| P3-17 | Server-authoritative KP credit (idempotent) | Battle victory, lesson/video completion |
| P3-18 | Persistent academy progress (survives reload) | Lesson completion, KP balance |

**Automated checks are already green** (you don't need to re-run them, but for reference): web `tsc` = 24 pre-existing test-file errors only, api `tsc` = 0, web lint clean, api tests = 260 passing / 24 suites. If you want to re-verify: `pnpm --filter @eureka-lab/api test -- --runInBand` (use `--runInBand` — the full parallel run OOMs on this machine).

---

## 2. Pre-conditions

- **Working dir:** `c:\Eureka-lab-app\Dev\Eureka-Lab2`
- **Branch:** `redesign/v2-from-reference` (don't switch branches; don't push).
- **Start both dev servers** (separate terminals):
  ```powershell
  pnpm --filter @eureka-lab/api dev    # http://localhost:3011
  pnpm --filter @eureka-lab/web dev    # http://localhost:3010
  ```
  Keep the **API terminal visible** — you'll read the COPPA confirmation link from its logs (no real email is sent locally).
- **Firebase must be configured** (the `NEXT_PUBLIC_FIREBASE_*` + Admin SDK env vars). If the API can't reach Firebase, signup/login won't work and that's an environment problem, not a Plan 3b bug — flag it and stop.
- **No `RESEND_API_KEY` needed.** The email service intentionally falls back to console-log mode locally; that's expected, not a bug.

### Accounts you'll need
- **Existing parent + teacher accounts** from the Plan 3a smoke (used in Walkthrough 1). If you don't have them:
  - A parent can be made fresh via Walkthrough 2.
  - **⚠️ A teacher CANNOT be made via `/auth/signup` anymore** — Phase A replaced `role` with `birthYear`, so the old curl trick no longer creates teachers. If you need a fresh teacher, seed it directly in Firestore (`users/{uid}` with `role: 'teacher'`) + a matching Firebase Auth user, or skip the teacher half of Walkthrough 1 and note it.
- Ages assume **current year 2026**. Use these birth years:
  - **Adult/parent:** `1990`
  - **Child (13–16):** `2012` (age ~14)
  - **Age-17 gap (should be rejected):** `2009`
  - **Under-13 (COPPA):** `2017` (age ~9)

---

## 3. Smoke walkthroughs

Run each and record PASS/FAIL + any console errors (browser devtools + API terminal).

**WT1 — Existing adults still work (regression guard).**
Sign in as the existing parent → expect redirect to `/parent`. Sign in as the existing teacher → expect `/teacher`. Sign out → expect `/`. No console errors.

**WT2 — Adult signup via `/signup` with birthYear (P3-14).**
Go to `/signup`. Create an account with birthYear `1990`. Expect: server derives `role: 'parent'`, lands on `/parent`.
Then retry with birthYear `2015`. Expect: form blocks client-side with "Adult signup is for ages 18+…" (no request sent).

**WT3 — Welcome adult/kid signup + under-13 pivot (P3-14 → P3-16).**
Go to `/`, "Begin Quest" tab.
- Enter birthYear `2012` (age ~14), a hero name, email, password → expect success, lands on `/character` (Forge My Legend). *(This also gives you a child account for WT6/WT7.)*
- Sign out. Begin Quest again with birthYear `2009` (age 17) → expect a toast "Heroes are 13–16. Contact support if you are 17." (server `AGE_GAP`).
- Sign out. Begin Quest again with birthYear `2017` (age ~9) → expect the form to **pivot to under-13 mode**: a "Parent's Email Sigil" field appears and a toast "Almost there — we just need a grown-up to confirm."

**WT4 — Under-13 pending creation + parent email stub (P3-16).**
Continuing WT3's under-13 form: fill the parent email (e.g. `parent-smoke@example.com`) and submit. Expect:
- An **activation-pending panel**: "Awaiting Parent's Confirmation" showing the parent email.
- In the **API terminal**, a log line with `event: "email_send_stub"` whose body contains `Click here to confirm: http://localhost:3010/confirm-parent/<32-hex-char-token>`. Copy that URL.

**WT5 — Parent confirms via the link (P3-16).**
Open the copied `http://localhost:3010/confirm-parent/<token>` in a new tab. Expect: "Confirming…" → "Hero Confirmed" with a "Go to Sign-in" button. API terminal logs `event: "coppa_confirmed"` (with a `resetLink`).
- Re-opening the same URL a second time → expect a "Confirmation failed" state (token already used / not found). That's correct behavior.
- The kid never set a password (none is collected under-13). To actually log them in, use Firebase "Forgot password?" on the kid's email. **This is a known rough edge, not a bug** (see §6).

**WT6 — KP persists across reload (P3-17 + P3-18).**
Sign in as a child account (the one from WT3, or any 13–16 account). Go to `/dashboard` → into a campaign → start a battle → win it. Note KP awarded. Visit `/inventory`, note the KP balance, then **hard-refresh**. Expect: KP balance survives the reload (before Plan 3b it reset). Win the *same* battle again → expect **no double-credit** (idempotent on `slug:missionId`).

**WT7 — Lesson completion persists (P3-18).**
Go to a campaign's prepare/academy screen, complete a lesson. Confirm the "completed" indicator. **Refresh.** Expect: lesson stays marked complete.

**WT8 — Google OAuth birthYear modal (P3-15) — OPTIONAL.**
Only if Google OAuth is configured locally. Sign out. From `/`, click "Sign in with the Google Sigil" with a Google account that has **no** Eureka profile. Expect: the birthYear modal appears; entering a valid year completes signup and routes by derived role; Cancel signs you back out (no orphan session).

---

## 4. What "done" looks like

WT1–WT7 PASS with no console errors. WT8 is optional. If all pass, report back so the main session can flip the ROADMAP Plan 3b row from **"code complete — user smoke pending"** to **DONE**.

---

## 5. Hard rules for this QA session

- **Don't push** to origin. Don't open/merge PRs. Reporting only.
- **Don't modify files under `docs/superpowers/`** (plans/specs/handovers are append-only). Record status in `ROADMAP.md` if you update anything.
- **Don't write feature code.** If a walkthrough fails, file it (§7) and stop — fixes are the dev session's job as `fix(plan-3b):` commits.
- If you must create a teacher account, **don't** try `/auth/signup` (it no longer accepts `role`).

---

## 6. Known non-bugs (do not file these)

- API logs `RESEND_API_KEY not set — EmailService runs in console-log mode`. Expected locally.
- Under-13 kids have no password until they use "Forgot password?" — a deliberate COPPA design choice (no credential stored for under-13). A follow-up plan may email the reset link directly.
- web `tsc` showing 24 errors — all pre-existing test-file errors that predate the redesign.

---

## 7. How to report findings

Produce a short PASS/FAIL table (WT1–WT8) plus, for any FAIL: the walkthrough, exact steps, expected vs actual, and any browser-console / API-terminal error text. Hand that back to the user so the dev session can address it. Reference code locations as `file_path:line` where you can.

Key files if you need to trace something:
- Welcome flow: `apps/web/src/app/page.tsx`
- Adult signup: `apps/web/src/components/features/auth/SignupForm.tsx`
- OAuth modal: `apps/web/src/components/features/auth/OAuthBirthYearModal.tsx`
- Confirm page: `apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx`
- COPPA backend: `apps/api/src/modules/coppa/`
- Email stub: `apps/api/src/modules/email/email.service.ts`
- KP credit: `apps/api/src/modules/inventory/inventory.service.ts` (`creditKpIdempotent`) + `inventory.controller.ts`
- Academy progress: `apps/api/src/modules/academy-progress/` + `apps/web/src/stores/academy-progress-store.ts`
- Role derivation: `apps/api/src/modules/auth/auth.service.ts` (`deriveRole`)
