# Bug Reports — Eureka-Lab Platform

> Filed by QA agent. Assigned to FE or BE agents.
> PM agent tracks overall bug health.
> CRITICAL bugs block releases.

---

## Open Bugs

## BUG-001: ModerationService not yet implemented — all moderation tests fail

**Found by:** QA agent
**Date:** 2026-02-18
**Severity:** HIGH
**Type:** SAFETY
**Affects:** BE

**Steps to reproduce:**
1. Run `pnpm --filter api test` from repo root
2. Observe all tests in `moderation.service.spec.ts` fail with `NotImplementedException`

**Expected behaviour:**
`ModerationService.screenInput()` and `screenOutput()` implemented per adversarial spec.
All 70+ test cases in `moderation.service.spec.ts` pass.

**Actual behaviour:**
Both methods throw `NotImplementedException` — stub only, awaiting BE-021 and BE-022.

**Evidence:**
```
ModerationService.screenInput not yet implemented — see BE-021
ModerationService.screenOutput not yet implemented — see BE-022
```

**Assigned to:** BE agent (BE-021, BE-022)
**Status:** OPEN
**Fixed in:** pending BE-021 + BE-022

---

## BUG-002: No rate-limit test for moderation endpoint under rapid repeated jailbreak attempts

**Found by:** QA agent
**Date:** 2026-02-18
**Severity:** MEDIUM
**Type:** SECURITY
**Affects:** BE

**Steps to reproduce:**
1. Authenticate as a child user
2. Submit 50 rapid jailbreak attempts within 10 seconds via POST /ai/prompt
3. Observe whether the rate limiter triggers before moderation can be saturated

**Expected behaviour:**
ThrottlerModule (10 req/s, 100 req/min) kicks in before the moderation layer is overwhelmed.
After the 11th request in a second, 429 Too Many Requests is returned.

**Actual behaviour:**
Not yet testable — AI gateway (BE-020) not implemented. Rate limit enforcement
against the moderation pipeline has not been validated.

**Assigned to:** BE agent + QA agent (add test when BE-020 + BE-024 are DONE)
**Status:** OPEN — blocked on BE-020

---

## Resolved Bugs

_None yet._

---

## Bug Template

```markdown
## BUG-[N]: [Short descriptive title]

**Found by:** QA
**Date:** [date]
**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Type:** SAFETY / COPPA / FUNCTIONAL / UI / PERFORMANCE / SECURITY
**Affects:** FE / BE / Both

**Steps to reproduce:**
1.
2.
3.

**Expected behaviour:**
[what should happen]

**Actual behaviour:**
[what actually happens]

**Evidence:**
[code snippet, test output, or screenshot description]

**Assigned to:** [FE / BE]
**Status:** OPEN / IN_PROGRESS / FIXED / VERIFIED / WONT_FIX
**Fixed in:** [commit hash or PR link, when resolved]
```

---

## Severity Guide

| Severity | Definition | SLA |
|----------|------------|-----|
| CRITICAL | Child safety, data exposure, auth bypass | Stop everything. Fix today. |
| HIGH | Core feature broken, payment issue, moderation gap | Fix in current sprint |
| MEDIUM | Non-critical feature broken, usability issue | Next sprint |
| LOW | Visual glitch, edge case, minor UX | Backlog |
