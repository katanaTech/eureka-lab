# Sprint 1 Plan — Foundation (Weeks 1–2)

**Sprint Goal:** Every agent has a working local development environment and a deployed "hello world" for both frontend and backend. No features, just infrastructure.

**Start Date:** Day 1
**End Date:** Day 14
**Sprint Master:** PM Agent

---

## Sprint 1 Objectives

1. Monorepo scaffolded and running locally
2. Next.js app returns 200 on `/` in production (Vercel)
3. NestJS API returns `{ status: 'ok' }` on `/health` in production (Railway)
4. Firebase project configured with Auth + Firestore + Storage
5. CI pipeline runs on every PR (lint + test + build)
6. All agents know their tools and have confirmed access

---

## Agent Assignments

### ARCH (Days 1–3, must complete before others are blocked)
- [ ] ARCH-001: OpenAPI spec for auth endpoints → unblocks FE + BE Sprint 2
- [ ] ARCH-002: Firestore security rules schema → unblocks BE Sprint 2
- [ ] ARCH-006: Environment variables doc → unblocks DEVOPS Day 1

### DEVOPS (Days 1–5, critical path)
- [ ] DEV-001: GitHub org + monorepo scaffold (Day 1 — blocks everything)
- [ ] DEV-002: Turborepo with apps/web + apps/api workspaces (Day 2)
- [ ] DEV-003: Vercel config (Day 3)
- [ ] DEV-004: Railway config (Day 3)
- [ ] DEV-005: GitHub Actions CI pipeline (Day 4–5)
- [ ] DEV-006: GitHub Actions CD pipeline (Day 5)

### BE (Days 3–10, starts after DEV-002)
- [ ] BE-001: NestJS + Fastify scaffold + `/health` endpoint (Day 3–4)
- [ ] BE-002: Firebase Admin SDK setup (Day 4–5)
- [ ] BE-003: Pino logger service (Day 5–6)
- [ ] BE-004: Global exception filter (Day 6–7)
- [ ] BE-005: Validation pipe (Day 7–8)

### FE (Days 3–10, starts after DEV-002)
- [ ] FE-001: Next.js 14 scaffold (Day 3–4)
- [ ] FE-002: Tailwind + shadcn/ui + theme (Day 4–5)
- [ ] FE-003: next-intl + RTL + locale files (Day 5–6)
- [ ] FE-004: next-pwa + manifest (Day 6–7)
- [ ] FE-005: Base layout (Day 7–9)
- [ ] FE-006: Zustand + TanStack Query (Day 8–9)

### QA (Days 8–14, starts after FE-001 + BE-001)
- [ ] QA-001: Vitest config (Day 8–9)
- [ ] QA-002: Jest config (Day 8–9)
- [ ] QA-003: Playwright config (Day 9–10)
- [ ] QA-004: Smoke test: health endpoint (Day 10)

---

## Sprint 1 Exit Criteria

All of the following must be true before Sprint 2 begins:

- [ ] `git clone` + `pnpm install` + `pnpm dev` runs without errors on a clean machine
- [ ] `https://[project].vercel.app` returns a rendered Next.js page
- [ ] `https://[project].railway.app/health` returns `{"status":"ok","timestamp":"..."}`
- [ ] Firebase project exists with Auth, Firestore, Storage enabled
- [ ] GitHub Actions CI runs and passes on the main branch
- [ ] ARCH-001 (OpenAPI auth spec) is written and reviewed by BE + FE agents
- [ ] All agents have confirmed their local environment works

---

## Blockers Protocol

If any agent is blocked for more than 4 hours:
1. Write `BLOCKED:` + reason in task-board.md
2. Post a note in `planning/blockers.md`
3. PM agent resolves within one work session

---

## Sprint 1 Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Firebase setup takes longer than expected | Medium | DEVOPS has admin access to Firebase console before Sprint 1 starts |
| Turborepo workspace config conflicts | Low | Use official Turborepo Next.js + NestJS template as starting point |
| Vercel/Railway free tier limits hit | Low | Both have generous free tiers for early-stage projects |
