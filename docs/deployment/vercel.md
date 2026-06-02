# Vercel Deployment Guide (Manual)

> **Deployments are manual by design.** Git pushes do **not** auto-deploy — the Vercel project's **Ignored Build Step** skips git-triggered builds on purpose. You deploy from the CLI, when you choose, with `vercel deploy`. Keep it that way; don't enable auto-deploy.

---

## 1. Project facts

| | |
|---|---|
| Vercel team (scope) | `katanatech` |
| Project | `eureka-lab` |
| Production URL | https://eureka-lab-katanatech.vercel.app |
| Root Directory (Vercel setting) | `apps/web` |
| Monorepo | pnpm workspaces + Turborepo; build is scoped with `--filter=@eureka-lab/web...` |
| Build config | [`apps/web/vercel.json`](../../apps/web/vercel.json) — `cd ../..` back to repo root, then `pnpm turbo build` |

> There must be **exactly one** `vercel.json` — `apps/web/vercel.json`. A root-level `vercel.json` forces Root Directory to the repo root and breaks the monorepo build; do not re-add one.

---

## 2. One-time setup

```bash
# Install the CLI (once per machine)
npm i -g vercel

# Authenticate (opens browser / device flow)
vercel login

# Link this repo to the project (run from the repo root)
vercel link --yes --project eureka-lab --scope katanatech
```

This creates a gitignored `.vercel/` folder holding the project link. Verify:

```bash
vercel whoami            # your Vercel user
cat .vercel/project.json # { "projectName": "eureka-lab", ... }
```

---

## 3. Development deploy (preview)

A **preview** deployment builds the **current working tree** on Vercel and returns a unique, shareable URL. It does **not** touch production. Use it to review a branch/feature before promoting.

```bash
# From the repo root
vercel deploy --scope katanatech
```

- Builds remotely (install → `pnpm turbo build --filter=@eureka-lab/web...` → `next build`).
- Prints a `Preview` URL like `https://eureka-<hash>-katanatech.vercel.app`.
- Deploys whatever is in your working directory — commit first if you want the URL to match a known commit.

Watch logs / inspect:

```bash
vercel inspect <deployment-url> --scope katanatech
vercel logs <deployment-url> --scope katanatech
```

---

## 4. Production deploy

Promotes a build to the **production domain** (https://eureka-lab-katanatech.vercel.app). Only do this from code you intend to be live (normally `main`).

```bash
# Build + deploy current working tree straight to production
vercel deploy --prod --scope katanatech
```

Or promote an **existing** preview without rebuilding:

```bash
vercel promote <preview-url> --scope katanatech
```

**Recommended production flow:**
1. `git checkout main && git pull`
2. `vercel deploy --scope katanatech` → smoke-test the preview URL.
3. If good: `vercel deploy --prod --scope katanatech`.

---

## 5. Environment variables

The web build needs these (already configured in the Vercel project — listed for reference):

- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL` (NestJS backend base URL)

Manage them:

```bash
vercel env ls --scope katanatech                 # list
vercel env add NEXT_PUBLIC_API_URL production     # add (prompts for value)
vercel env pull apps/web/.env.local --scope katanatech  # mirror Vercel env locally
```

Only truly-public values may carry the `NEXT_PUBLIC_` prefix. Never put server secrets (Firebase Admin, Stripe secret, Anthropic key) in the web project — those live on the API backend.

---

## 6. Rollback

```bash
vercel ls --scope katanatech                 # list recent deployments
vercel rollback <previous-prod-url> --scope katanatech   # repoint production to a known-good build
```

---

## 7. Known gotchas

- **`vercel deploy` deploys the working tree, not a git ref.** Commit (and `git status` clean) before deploying if the URL needs to map to a specific commit.
- **Server minification is disabled** (`experimental.serverMinification: false` in [`apps/web/next.config.js`](../../apps/web/next.config.js)): on `next@14.2.35` the SWC server minifier miscompiled a module into `TypeError: e[o] is not a function`, crashing RSC rendering during `next build` (and at runtime). Re-evaluate removing this flag on the next Next.js upgrade.
- **`next build` runs from the repo root** via the `cd ../..` in `apps/web/vercel.json` — required so Turborepo can resolve workspace packages (`@eureka-lab/shared-types`, `@eureka-lab/ui`).
- **No auto-deploy:** if a teammate expects a push to deploy, it won't — that's intentional. Point them here.

---

*Manual deployment only. Last updated: 2026-06-02.*
