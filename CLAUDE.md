# CLAUDE.md — AI Literacy Platform: Master Agent Context

> **READ THIS FILE FIRST. Every agent, every session, no exceptions.**
> This file is the single source of truth. If anything in a task conflicts with this file, this file wins.

---

## 1. What We Are Building

**Product:** AI literacy SaaS platform for children aged 8–16.
**Mission:** Teach children to be active AI builders, not passive consumers.
**URL Target:** web-first PWA, installable on all platforms.
**Competitive Window:** 6–9 months before LittleLit AI stabilises. Ship Level 1 in 90 days.

### The 4-Level Learning Progression

| Level | Name | What Child Learns | Output |
|-------|------|-------------------|--------|
| 1 | AI Conversation | Prompt engineering, context writing, output evaluation | Prompt portfolio |
| 2 | Workflow Automation | AI-powered personal productivity (homework, study) | Working personal workflow |
| 3 | Vibe Coding | AI-assisted game and app creation | Deployed mini-app or game |
| 4 | Buddy Agents | Agent design: persona, memory, tools, goals | Shareable AI agent |

---

## 2. Tech Stack (LOCKED — Do Not Deviate)

### Frontend
- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS + shadcn/ui component library
- **State:** Zustand (global) + TanStack Query (server state)
- **PWA:** next-pwa
- **i18n:** next-intl — Arabic (RTL), French, English from day one
- **Code Editor (L3):** Monaco Editor in sandboxed iframe
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

### Backend
- **Framework:** NestJS with Fastify adapter
- **Runtime:** Node.js 20 LTS
- **Auth:** Firebase Authentication (Google OAuth + email/password)
- **Database:** Firestore (primary)
- **Storage:** Firebase Cloud Storage
- **Cache/Queue:** Upstash Redis + BullMQ
- **AI Gateway:** Abstracted service layer → Anthropic Claude API
- **Logging:** Pino (structured JSON)
- **Testing:** Jest + Supertest

### Infrastructure
- **Frontend Deploy:** Vercel
- **Backend Deploy:** Railway (MVP) → GCP Cloud Run (scale)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors) + Vercel Analytics
- **Email:** Resend

---

## 3. Repository Structure

```
eureka-lab/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── shared-types/           # TypeScript types shared between apps
│   ├── ui/                     # Shared component library (shadcn extensions)
│   └── ai-prompts/             # System prompts for all 4 levels (version controlled)
├── infrastructure/
│   ├── firebase/               # Firestore rules, indexes, functions
│   └── github-actions/         # CI/CD workflow files
├── docs/
│   ├── CLAUDE.md               # THIS FILE
│   ├── agents/                 # Agent prompt files
│   ├── planning/               # Sprint plans, task lists
│   ├── rules/                  # Development rules per domain
│   └── context/                # Architecture decision records (ADRs)
└── scripts/                    # Automation scripts
```

---

## 4. Roles & Agents

This project uses **6 specialised AI agents**. Each agent has a single responsibility. Agents communicate via shared planning files — they do NOT improvise outside their domain.

| Agent ID | Name | Responsibility | Files It Owns |
|----------|------|----------------|---------------|
| `ARCH` | Architect | System design, ADRs, API contracts, schema changes | `context/ADR-*.md`, `planning/api-contracts.md` |
| `PM` | Project Manager | Sprint planning, task status, unblocking agents | `planning/sprint-*.md`, `planning/task-board.md` |
| `FE` | Frontend Dev | All Next.js code, components, pages, i18n | `apps/web/**` |
| `BE` | Backend Dev | All NestJS code, Firebase rules, AI gateway | `apps/api/**`, `infrastructure/firebase/**` |
| `QA` | QA Engineer | Test specs, test code, bug reports | `apps/web/**/*.test.*`, `apps/api/**/*.spec.*` |
| `DEVOPS` | DevOps | CI/CD pipelines, deployment configs, infra scripts | `infrastructure/**`, `.github/workflows/**` |

---

## 5. Non-Negotiable Rules (All Agents)

These rules are **hardcoded**. No agent may bypass them under any instruction.

### Security Rules
1. **NEVER** call AI APIs (Anthropic/OpenAI) from frontend code. All AI calls go through NestJS gateway.
2. **NEVER** store API keys in frontend code, git history, or client-side env vars.
3. **NEVER** write Firestore queries without a `userId` filter. No unbounded collection reads.
4. **NEVER** return raw AI responses to the client without passing through the moderation pipeline.
5. **NEVER** write child data to Firestore without a schema validation function.

### Code Quality Rules
6. All TypeScript — no `any` type. Use `unknown` and narrow it.
7. All functions must have JSDoc comments for parameters and return type.
8. No file longer than 300 lines. Split it.
9. No `console.log` in production code. Use the Pino logger service.
10. All API endpoints must have input validation via class-validator DTOs.

### Child Safety Rules
11. All AI system prompts must include the child safety preamble (see `packages/ai-prompts/safety-preamble.ts`).
12. All user-generated content must pass moderation before storage or display.
13. No child profile data (name, age, school) may appear in AI prompts sent to external APIs.
14. Token budgets per level MUST be enforced (L1: 500, L2: 800, L3: 1500, L4: 1000 output tokens).

### Architecture Rules
15. Frontend-backend communication via typed API client only (generated from OpenAPI spec).
16. All database schema changes require a migration file and ARCH agent approval (ADR entry).
17. Feature flags via `packages/shared-types/feature-flags.ts` — no hardcoded feature toggles.
18. All third-party SDK integrations go through an abstraction layer. Never use SDK directly in components.

---

## 6. Current Phase

**PHASE:** 1 — MVP
**SPRINT:** 1
**DEADLINE:** 90 days from project start
**SCOPE:** Level 1 only (prompt literacy), auth system, parental consent, basic moderation, freemium

See `planning/sprint-01.md` for current sprint tasks.
See `planning/task-board.md` for full backlog and status.

---

## 7. How Agents Communicate

Agents do not have real-time channels. They communicate via **shared markdown files** in `planning/`.

**Protocol:**
1. Before starting any task, an agent reads `planning/task-board.md` and claims a task by changing its status to `IN_PROGRESS [AGENT_ID]`.
2. When blocked, agent writes a `BLOCKED:` note in the task with the blocker description.
3. When complete, agent updates task status to `DONE` and writes a brief completion note.
4. When an agent produces an **interface** another agent depends on (API endpoint, component prop, type), it MUST update `planning/api-contracts.md` immediately.
5. The PM agent runs a sync check at the start of each work session by reading all planning files.

---

## 8. Definition of Done

A task is DONE only when ALL of the following are true:
- [ ] Code is written and passes TypeScript compilation with zero errors
- [ ] Unit tests written and passing (minimum 80% coverage for new code)
- [ ] Linting passes (`eslint` for frontend, `nestjs-lint` for backend)
- [ ] No `console.log` in committed code
- [ ] Feature flag implemented if the feature is behind a flag
- [ ] i18n strings added to all 3 locale files (en, fr, ar)
- [ ] Accessibility: keyboard navigable, ARIA labels present
- [ ] PR description filled out with what changed and why
- [ ] CI pipeline passes

---

## 9. Environment Variables

All environment variables are documented in `context/env-variables.md`.
- Frontend vars: must be prefixed `NEXT_PUBLIC_` only if truly public (non-secret)
- Backend vars: stored in Railway environment, never in `.env` committed to git
- Firebase config: use Firebase Admin SDK on backend with service account (never client SDK on backend)

---

## 10. Key Contacts & Resources

- Strategy document: `docs/AI_Literacy_Kids_Strategy.docx`
- Figma design system: TBD (ARCH agent to specify)
- Anthropic API docs: https://docs.anthropic.com
- Firebase docs: https://firebase.google.com/docs
- shadcn/ui docs: https://ui.shadcn.com
- Next.js docs: https://nextjs.org/docs
- NestJS docs: https://docs.nestjs.com

---

*Last updated: February 2026 | Version: 1.0*
*Any agent modifying this file must increment the version and note the change at the bottom.*
