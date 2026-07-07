# Landing Page App — Scaffold Design

> **Status:** Approved (2026-07-07)
> **Author:** brainstormed with the user this session.
> **Scope:** Scaffold only — no marketing content/components yet. Content will be extracted from an imported Lovable project in a follow-up session.

## 1. Why

The project needs a public marketing/landing site distinct from `apps/web`. Note: `apps/web`'s root route (`src/app/page.tsx`) is the in-product "Welcome" auth gate (login/register for the game), not a marketing page — so there's no existing surface to repurpose. A new workspace app is the clean fit.

## 2. Scope

**In scope (this task):**
- New workspace app `apps/landing` (`@eureka-lab/landing`), Next.js 14 App Router, TypeScript, Tailwind CSS v4.
- Minimal placeholder home page + root layout — no real copy or components.
- `next-intl` scaffolding (en/fr/ar) with empty/placeholder message files, mirroring `apps/web`'s i18n structure.
- `NEXT_PUBLIC_APP_URL` env var (in `.env.example`) for CTA links out to the product app; no hardcoded relative paths to `apps/web` routes.
- `vercel.json` mirroring `apps/web`'s pattern (turbo-filtered install/build commands, same security headers).
- Dev script on port `3012` (`apps/web` uses `3010`, `apps/api` uses `3011`).

**Non-goals (deferred to the follow-up content session):**
- Any Lovable-sourced components, pages, copy, or assets.
- Promoting shared components into `packages/ui` (decide once real components exist).
- Real translated marketing copy.
- Wiring the actual `NEXT_PUBLIC_APP_URL` CTA buttons into a real header/hero (placeholder page just proves the app boots).

## 3. Locked decisions (this session)

| # | Decision | Rationale |
|---|---|---|
| 1 | Next.js App Router, Tailwind v4 — matches `apps/web`, not Lovable's native Vite/Tailwind v3/react-router stack | Consistency across the monorepo; Lovable code will be adapted on import rather than the monorepo adapting to it |
| 2 | Own workspace app, not a route inside `apps/web` | `apps/web`'s `/` is already occupied by the game's auth gate; separate app keeps the marketing site's build/deploy independent |
| 3 | i18n scaffolded now (next-intl, empty messages) | Matches CLAUDE.md's i18n-from-day-one rule; structure ready before real copy lands |
| 4 | Cross-link to product app via `NEXT_PUBLIC_APP_URL` env var, not relative paths | Domain relationship between landing and web app (subdomain vs. path-based) isn't decided yet; an env var works either way |
| 5 | `vercel.json` added now, mirroring `apps/web` | Deploy-ready as soon as real content lands; no separate follow-up config task needed |

## 4. Structure

```
apps/landing/
├── package.json          # @eureka-lab/landing, port 3012
├── next.config.js
├── postcss.config.js
├── tsconfig.json
├── vercel.json
├── .env.example           # NEXT_PUBLIC_APP_URL
├── messages/
│   ├── en.json            # placeholder keys only
│   ├── fr.json
│   └── ar.json
└── src/
    ├── i18n/               # next-intl request config + routing
    ├── middleware.ts        # locale routing
    └── app/
        └── [locale]/
            ├── layout.tsx   # root layout, loads messages
            └── page.tsx     # placeholder home page
```

Depends on `@eureka-lab/shared-types` (workspace) for any shared types; no dependency on `packages/ui` yet — added when real components are promoted there.

## 5. Definition of done for this scaffold

- `pnpm install` resolves the new workspace member.
- `pnpm --filter @eureka-lab/landing dev` boots on port 3012 and renders the placeholder page in all three locales.
- `pnpm --filter @eureka-lab/landing build` and `lint` pass via turbo.
- No Lovable content included — this is infrastructure only.
