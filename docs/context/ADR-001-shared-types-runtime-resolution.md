# ADR-001: shared-types Runtime Resolution (dist over src)

> **Status:** ACCEPTED
> **Date:** 2026-04-25
> **Author:** ARCH agent
> **Supersedes:** commit `feaca15` (`fix(vercel): point shared-types main/types to src for transpilePackages`)
> **Related files:** [packages/shared-types/package.json](../../packages/shared-types/package.json), [apps/web/next.config.js](../../apps/web/next.config.js), [turbo.json](../../turbo.json)

---

## Context

`@eureka-lab/shared-types` is a workspace package consumed by both:

- **apps/web** — Next.js 14 with `transpilePackages: ['@eureka-lab/shared-types']`. Next compiles
  whatever it finds (TS or JS) at build time.
- **apps/api** — NestJS, distributed as compiled CommonJS via `node dist/main`. Node's standard
  module resolution reads the package's `main` field at runtime; **Node cannot parse TypeScript
  syntax** (`export type`, generics, etc.) without a transpiler.

On 2026-03-18, commit `feaca15` changed `packages/shared-types/package.json` to expose raw TS
source as `main`, `types`, and the default `exports` condition:

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": { "types": "./src/index.ts", "default": "./src/index.ts" } }
}
```

The stated motive was avoiding a `dist/` "not-yet-built race on Vercel cold builds." This worked
for Next.js (because of `transpilePackages`) but **broke the API at runtime** with:

```
SyntaxError: Unexpected token 'export'
  at file:///.../packages/shared-types/src/index.ts:9
  export type UserRole = 'child' | 'parent' | 'teacher' | 'admin';
  ^^^^^^
```

The "race" the original commit was solving was illusory. `turbo.json` already has
`"build": { "dependsOn": ["^build"] }` and lists `dist/**` as outputs, so dependency packages
build before consumers in every Vercel build.

## Decision

**`@eureka-lab/shared-types` (and any other workspace package consumed by both Next.js and Node)
exposes compiled `dist/` artifacts via `main`, `types`, and the `exports` field. It does NOT
expose raw `.ts` source as a runtime entry point.**

Canonical `package.json` shape:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

Build-order guarantee provided by Turbo's `dependsOn: ["^build"]` is the right place to solve the
"dist not yet built" problem — not by exposing source.

## Consequences

**Positive**

- API boots correctly under `node dist/main`.
- Vercel builds remain unbroken (Next.js consumes `dist/index.js` via `transpilePackages`, which
  re-processes through SWC; no behavior change).
- Type checking still works: TS resolves `.d.ts` from `dist/`, with sourcemaps pointing back to
  `src/` so editor "Go to Definition" remains pleasant.
- Same pattern is now consistent with `packages/ui` (which already follows it).

**Negative**

- After editing `packages/shared-types/src/*`, developers must rebuild the package before
  apps see the change at runtime:
  ```bash
  pnpm --filter @eureka-lab/shared-types build
  ```
  Editor type-checking (via `.d.ts` from prior build) may temporarily lag.
- TypeScript tooling will not auto-suggest types for un-built changes until rebuild.

**Mitigation (deferred — out of scope of this ADR)**

A future ADR may introduce a `dev` script for shared-types using `tsc --watch` and wire it into
`turbo dev` so changes propagate without manual builds. Tracking under planning issue
"shared-types dev watcher".

## Alternatives Considered

1. **Conditional exports — `types` from src, `default` from dist** (`exports: { ".": { "types":
   "./src/index.ts", "default": "./dist/index.js" } }`). **Rejected** because it's harder to
   reason about, the gain is marginal (faster type-check on uncompiled changes), and Node still
   loads `dist/` at runtime so the runtime contract is unchanged.

2. **Keep src exposure (status quo of commit feaca15) and add a transpiler at API runtime** (e.g.
   `tsx`, `ts-node`). **Rejected** — adds cold-start latency, requires a runtime dependency in
   prod, contradicts NestJS's compile-then-run philosophy, and masks real type issues at build
   time.

3. **Inline shared types into each app.** **Rejected** — defeats the purpose of the package, causes
   drift between web and api type definitions.

## Verification

- API boots: `pnpm --filter @eureka-lab/api dev` shows `Listening on 0.0.0.0:3011` with no
  SyntaxError.
- Web builds: `pnpm --filter @eureka-lab/web build` completes without resolution errors.
- Vercel deploy: full pipeline completes (Turbo builds shared-types before web).

## Enforcement

Any future PR that points a workspace package's `main`, `types`, or `default` export at a `.ts`
file requires explicit ARCH review and an updated ADR.

---

*Authored 2026-04-25 by ARCH agent.*
