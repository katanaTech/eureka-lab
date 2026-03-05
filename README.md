# Eureka Lab

AI literacy platform for children aged 8-16. Teaches kids to be active AI builders through a 4-level progression: AI Conversation, Workflow Automation, Vibe Coding, and Buddy Agents.

## Prerequisites

- **Node.js** >= 20 (tested with v22)
- **pnpm** >= 10

## Getting Started

```bash
# Install all dependencies
pnpm install

# Start both frontend and backend in dev mode
pnpm dev
```

This starts:
- **Frontend** (Next.js): http://localhost:3010
- **Backend** (NestJS + Fastify): http://localhost:3011

### Health Check

```bash
curl http://localhost:3011/api/v1/health
# {"status":"ok","timestamp":"..."}
```

## Project Structure

```
eureka-lab/
├── apps/
│   ├── web/                    # Next.js 14 frontend (App Router)
│   └── api/                    # NestJS backend (Fastify adapter)
├── packages/
│   ├── shared-types/           # TypeScript types shared between apps
│   ├── ui/                     # Shared component library
│   └── ai-prompts/             # AI system prompts + safety preamble
├── planning/                   # Sprint plans, task board, API contracts
├── rules/                      # Development rules per domain
└── turbo.json                  # Turborepo pipeline config
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode (with hot reload) |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without writing |
| `pnpm clean` | Remove all build artifacts |

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend**: NestJS 10, Fastify, Firebase Auth, Firestore
- **Monorepo**: pnpm workspaces, Turborepo
- **AI**: Anthropic Claude API (via abstraction layer)
- **Languages**: Arabic, French, English (RTL support)
