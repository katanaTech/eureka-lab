Plan 3b — QA Smoke Report                                  
                                                                             
  Branch: redesign/v2-from-reference | Date: 2026-05-29
                                                                                                       
  ┌─────┬────────────────────────────────────────┬─────────────────────────────────────────────────┐
  │ WT  │              Description               │                     Result                      │   
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT1 │ Existing adults regression guard       │ SKIP — no pre-existing parent/teacher accounts  │
  │     │                                        │ from Plan 3a available                          │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT2 │ Adult signup via /signup with          │ PASS                                            │
  │     │ birthYear (P3-14)                      │                                                 │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT3 │ Welcome adult/kid signup + under-13    │ PARTIAL — 1 bug                                 │
  │     │ pivot (P3-14→P3-16)                    │                                                 │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT4 │ Under-13 pending creation + parent     │ PASS                                            │
  │     │ email stub (P3-16)                     │                                                 │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT5 │ Parent confirms via the link (P3-16)   │ FAIL — 1 bug                                    │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT6 │ KP persists across reload (P3-17 +     │ PASS                                            │
  │     │ P3-18)                                 │                                                 │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT7 │ Lesson completion persists (P3-18)     │ PASS                                            │
  ├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ WT8 │ Google OAuth birthYear modal (P3-15)   │ SKIP — optional, no local OAuth config          │
  └─────┴────────────────────────────────────────┴─────────────────────────────────────────────────┘

  ---
  BUG 1 — WT3: AGE_GAP toast does not appear for birthYear 2009

  Steps: Welcome / → Begin Quest → enter birthYear 2009, hero name, email, password → submit.

  Expected: Toast: "Heroes are 13–16. Contact support if you are 17."

  Actual: No toast appears. The form remains on screen with no visible feedback.

  Server response: Correct — 400 Bad Request with body { "code": "AGE_GAP", "message": "Heroes are
  13–16 and adults are 18+. Contact support if you are 17." }.

  Code trace:
  - apps/api/src/modules/auth/auth.service.ts:91-97 — deriveRole() throws correctly.
  - apps/api/src/common/filters/all-exceptions.filter.ts:44,53 — filter includes code in response.
  - apps/web/src/lib/api-client.ts:78-79 — ApiError is constructed with code from response body.
  - apps/web/src/app/page.tsx:118-120 — catch handler checks apiErr.code === 'AGE_GAP' and calls
  toast.error(...).

  All pieces of the chain appear correct. The handler at page.tsx:118 should fire, but the toast never
  renders. Possible causes: the error object shape doesn't match the as { code?: string } cast (e.g.
  code is nested differently), or an upstream catch swallows the error before it reaches this handler.
  Needs dev investigation.

  ---
  BUG 2 — WT5: Confirm-parent page shows "Confirmation failed" (React StrictMode double-fire)

  Steps: Open http://localhost:3010/confirm-parent/<token> in browser.

  Expected: "Confirming…" → "Hero Confirmed" with "Go to Sign-in" button.

  Actual: "Confirming…" → "Confirmation failed" with error message about email already in use.

  API logs: Two concurrent POST /api/v1/coppa/confirm-parent-email requests fire within milliseconds
  (React StrictMode unmounts and remounts the component). The first request succeeds — creates the
  Firebase user, confirms the account. The second request hits Firebase createUser again and fails with
   auth/email-already-exists (500). The error response (1.2s) arrives before the success response
  (3.3s), so the UI lands on the error state.

  Root cause: apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx:32-54 — the useEffect has a
  cancelled flag, but both requests are already in flight before the cleanup runs. The real fix is on
  the backend: apps/api/src/modules/coppa/coppa.service.ts:166 — the createUser call is not idempotent.
   If the Firebase user already exists for this email, the service should look it up instead of
  failing.

  Workaround options:
  1. Make coppa.service.ts confirmParentEmail idempotent — catch auth/email-already-exists and proceed
  with the existing user.
  2. Add a mutex/guard on the frontend (e.g. useRef flag checked before calling the API).
  3. Both (belt and suspenders).

  Note: This bug only manifests in dev mode (StrictMode double-mount). Production builds mount once.
  However, idempotency on the backend is still the correct fix for resilience against network retries,
  double-clicks, etc.

  ---
  Pre-existing issues observed (not Plan 3b bugs)

  - Post-signup 401 race: After signup, the frontend immediately calls GET /api/v1/gamification/profile
   without an auth header, gets 401, and bounces to /. Login afterwards works fine. Pre-existing.
  - Logout 500: POST /api/v1/auth/logout sends content-type: application/json with empty body — Fastify
   rejects it. Sign-out still works client-side. Pre-existing.
  - WT2 age validation: The brief expects the text "Adult signup is for ages 18+" for underage input on
   /signup. The form uses HTML5 max attribute
  (apps/web/src/components/features/auth/SignupForm.tsx:136) so native browser validation fires first.
  The React error message at line 50 is unreachable in practice. Functional but doesn't match the
  brief's exact expectation — cosmetic only.

  ---
  Verdict

  Plan 3b is not ready to flip to DONE. Bug 2 (WT5) is a functional failure — the COPPA confirmation
  flow breaks in dev and is fragile in prod. Bug 1 (WT3) is lower severity but means the age-17
  rejection UX is silent. Both need fix(plan-3b): commits before re-smoke.

✻ Cogitated for 1h 20m 53s                                      
                                                                             
● Background command "Start API dev server on port 3011" completed (exit code 0)                       
                                                                                                       
● Background command "Start web dev server on port 3010" completed (exit code 0)                       
                                                                                                       
● The dev servers from the previous session have shut down — that's expected since the smoke testing is
   complete.                               

  The full PASS/FAIL report has been delivered above. To summarize the two actionable bugs:            
   
  1. Bug 1 (WT3): AGE_GAP toast silent — apps/web/src/app/page.tsx:118. Server returns the right error,
   frontend handler exists, but toast never renders. Needs dev investigation into error object shape or
   swallowed exception.
  2. Bug 2 (WT5): COPPA confirm page fails — apps/api/src/modules/coppa/coppa.service.ts:166. Backend
  createUser is not idempotent; React StrictMode double-mount causes two concurrent requests, second
  one 500s. Fix: make confirmParentEmail catch auth/email-already-exists and proceed with the existing
  user.

  Both need fix(plan-3b): commits before re-smoke. Hand back to dev.