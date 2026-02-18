# Eureka-lab — Agent System Guide

## What This Is

A complete multi-agent development system for the AI Literacy Kids Platform. Six specialised Claude agents coordinate through shared markdown files to design, build, test, and deploy the platform without losing context across sessions.

---

## The 6 Agents

| Agent | Role | Start Here |
|-------|------|-----------|
| **ARCH** | Software Architect — designs systems, owns API contracts, ADRs | `agents/ARCH-agent-prompt.md` |
| **PM** | Project Manager — sync checks, unblocks agents, tracks sprint | `agents/PM-agent-prompt.md` |
| **FE** | Frontend Developer — all Next.js code | `agents/FE-agent-prompt.md` |
| **BE** | Backend Developer — all NestJS code | `agents/BE-agent-prompt.md` |
| **QA** | QA Engineer — tests, safety testing, COPPA compliance | `agents/QA-agent-prompt.md` |
| **DEVOPS** | DevOps — CI/CD, infra, deployment | `agents/DEVOPS-agent-prompt.md` |

---

## How to Start a Work Session

### Step 1 — Run the sync check
```bash
./scripts/sync-check.sh
```
This shows you: current sprint status, in-progress tasks, blockers, and open bugs.

### Step 2 — Generate agent context (optional but recommended)
```bash
node scripts/build-agent-context.js FE    # context for FE agent
node scripts/build-agent-context.js --all  # context for all agents
```
Copy the output. You'll paste it BEFORE the agent prompt in Claude.

### Step 3 — Open Claude and paste the agent prompt
1. Open a new Claude conversation
2. Paste the context snapshot (from Step 2) — optional
3. Paste the full contents of the agent's initiation prompt (e.g., `agents/FE-agent-prompt.md`)
4. The agent reads its files and begins work

### Step 4 — Provide the actual files
When the agent asks to read planning files, paste the content of:
- `CLAUDE.md`
- `planning/task-board.md`
- `planning/api-contracts.md`
- Any sprint file it needs

### Step 5 — Take the agent's output
Copy the code/files the agent produces into your actual codebase.
Update `planning/task-board.md` manually with the status changes the agent specified.

---

## File Map

```
docs/
├── CLAUDE.md                      ← Master context — every agent reads this first
├── agents/
│   ├── ARCH-agent-prompt.md       ← Paste into Claude to start ARCH session
│   ├── PM-agent-prompt.md         ← Paste into Claude to start PM session
│   ├── FE-agent-prompt.md         ← Paste into Claude to start FE session
│   ├── BE-agent-prompt.md         ← Paste into Claude to start BE session
│   ├── QA-agent-prompt.md         ← Paste into Claude to start QA session
│   └── DEVOPS-agent-prompt.md     ← Paste into Claude to start DEVOPS session
├── planning/
│   ├── task-board.md              ← THE shared state — all agents read/write this
│   ├── sprint-01.md               ← Sprint 1 detailed plan
│   ├── api-contracts.md           ← API spec (ARCH writes, FE+BE implement)
│   ├── blockers.md                ← Active blockers (all agents write)
│   └── bugs.md                    ← Bug reports (QA writes, FE/BE fix)
├── rules/
│   ├── frontend-rules.md          ← FE coding standards
│   ├── backend-rules.md           ← BE coding standards
│   ├── qa-rules.md                ← Testing standards
│   └── devops-rules.md            ← Infrastructure standards
└── context/
    ├── ADRs.md                    ← Architecture decisions (ARCH writes)
    └── env-variables.md           ← All env vars documented
scripts/
├── sync-check.sh                  ← Run before each session
├── setup.sh                       ← New developer setup
└── build-agent-context.js         ← Generates context snapshot per agent
```

---

## Sprint 1 Critical Path

```
Day 1:   DEVOPS → DEV-001 (monorepo scaffold) ← EVERYTHING BLOCKS ON THIS
Day 1-3: ARCH → ARCH-001 (API contracts), ARCH-006 (env spec)
Day 2:   DEVOPS → DEV-002 (Turborepo workspaces)
Day 3:   FE → FE-001 (Next.js scaffold) | BE → BE-001 (NestJS scaffold)
Day 3-5: DEVOPS → DEV-003, DEV-004, DEV-005 (deploys + CI)
Day 3-8: ARCH → ARCH-002, ARCH-003, ARCH-004, ARCH-005
Day 4-10: FE → FE-002 through FE-006 | BE → BE-002 through BE-005
Day 8-14: QA → QA-001 through QA-004
```

**The 90-day MVP clock is running. Ship Level 1 to production.**

---

## Agent Communication Rules

Agents never have real-time channels. They coordinate via files:

1. **Claim a task:** Change `TODO` → `IN_PROGRESS [AGENT_ID]` in task-board.md
2. **Report a blocker:** Write to planning/blockers.md + update task status to `BLOCKED`
3. **Interface produced:** Update planning/api-contracts.md (ARCH) immediately
4. **Task done:** Update task-board.md to `DONE` with a note
5. **Bug found:** Write to planning/bugs.md with severity rating

---

## When to Use Which Agent

| Situation | Use This Agent |
|-----------|---------------|
| Architecture unclear, need API design | ARCH |
| Sprint is off track, unclear what to do next | PM |
| Need to build a React component or page | FE |
| Need to build an API endpoint or service | BE |
| Need to write tests, found a bug | QA |
| Need CI/CD changes, deployment issue | DEVOPS |
| Multiple things at once (not recommended) | Start with PM for the sync check |

---

## Escalation to Rob (Human Founder)

Escalate when:
1. A blocker is unresolved for >1 session
2. A CRITICAL security bug is open
3. A decision requires founder authority (legal, financial, vendor selection)
4. Sprint exit criteria are at risk with <5 days remaining

Use the escalation format in `agents/PM-agent-prompt.md`.

---

*System version: 1.0 | Created: February 2026*
