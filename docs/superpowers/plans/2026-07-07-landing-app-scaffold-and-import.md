# Landing App Scaffold + Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `apps/landing` as a new Next.js workspace app, promote the already-ported `GameButton`/`Logo`/design-token theme out of `apps/web` into `packages/ui` so both apps share one visual system, and import `Landing.tsx` from `C:\Eureka-lab-app\Dev\ai-adventure-island-new` (adapted from Vite/react-router to Next.js App Router) as the landing app's home page, with CTAs linking out to `apps/web` via `NEXT_PUBLIC_APP_URL`.

**Architecture:** `packages/ui` becomes the single source of truth for the "dark fantasy" design tokens (CSS custom properties + Tailwind v4 `@theme inline`) and the two shared components (`GameButton`, `Logo`) — both consumed by `apps/web` (already using them) and the new `apps/landing`. The landing page itself is split into one file per section (Nav/Hero/HorizontalIslands/Heroes/Academy/Battle/Footer) under `apps/landing/src/components/landing/`, matching CLAUDE.md's 300-line file cap — the source `Landing.tsx` is 332 lines as one file. `react-router-dom` Links become plain `<a>` tags (CTAs leave the app) since no in-landing-app route needs client-side routing. `Seo`/`react-helmet-async` is replaced by Next.js's `Metadata` export.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, next-intl (matching `apps/web`'s current hardcoded-`'en'` pattern — no URL locale routing exists yet anywhere in this repo), framer-motion (new dependency, not currently used in `apps/web`), pnpm workspaces + turbo.

**Scope note:** This plan does not add a test harness to `packages/ui` (none exists there today) or wire real i18n message keys through the new landing copy (`apps/web`'s own pages don't do this yet either — `next-intl`'s `getRequestConfig` is hardcoded to `'en'`, see `apps/web/src/i18n/request.ts:8`). Verification is via `build`/`lint`/`tsc` passing and manually viewing the page in a browser, consistent with this repo's current state, not new test infrastructure.

---

## File Structure

**New/modified in `packages/ui`** (promoted shared design system):
- `packages/ui/src/lib/cn.ts` — new, `cn()` helper (`clsx` + `tailwind-merge`)
- `packages/ui/src/components/GameButton.tsx` — moved from `apps/web`
- `packages/ui/src/components/Logo.tsx` — moved from `apps/web`
- `packages/ui/src/theme.css` — new, extracted shared design tokens from `apps/web/src/app/globals.css`
- `packages/ui/src/index.ts` — modified, exports `GameButton`, `Logo`
- `packages/ui/package.json` — modified, adds `class-variance-authority`, `clsx`, `tailwind-merge` deps + `next` peer dep + `./theme.css` export

**Modified in `apps/web`** (consume the promoted package instead of local copies):
- `apps/web/src/app/page.tsx` — import `Logo`/`GameButton` from `@eureka-lab/ui`
- `apps/web/src/app/globals.css` — replace the promoted sections with `@import "@eureka-lab/ui/theme.css"`, keep the app-specific mobile-gamification utilities (`xp-float`, `scrollbar-none`, `pb-safe`)
- Delete `apps/web/src/components/game/GameButton.tsx`, `apps/web/src/components/game/Logo.tsx`

**New in `apps/landing`** (the app itself):
- `apps/landing/package.json`, `next.config.js`, `postcss.config.js`, `tsconfig.json`, `.eslintrc.json`, `vercel.json`, `.env.example`
- `apps/landing/src/app/globals.css`
- `apps/landing/src/app/layout.tsx`
- `apps/landing/src/app/page.tsx` (server component, exports `metadata`)
- `apps/landing/src/i18n/request.ts`
- `apps/landing/src/messages/en.json`, `fr.json`, `ar.json` (empty placeholders — see scope note)
- `apps/landing/src/lib/links.ts` — `LOGIN_URL` constant built from `NEXT_PUBLIC_APP_URL`
- `apps/landing/src/components/landing/Nav.tsx`
- `apps/landing/src/components/landing/Hero.tsx`
- `apps/landing/src/components/landing/HorizontalIslands.tsx`
- `apps/landing/src/components/landing/Heroes.tsx`
- `apps/landing/src/components/landing/Academy.tsx`
- `apps/landing/src/components/landing/Battle.tsx`
- `apps/landing/src/components/landing/Footer.tsx`
- `apps/landing/src/components/landing/LandingPage.tsx` (client component assembling all sections; default export)
- `apps/landing/public/assets/game/*` — 11 image files copied from `apps/web/public/assets/game/`

---

## Task 1: Extract shared theme CSS into `packages/ui`

**Files:**
- Create: `packages/ui/src/theme.css`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create `packages/ui/src/theme.css` with the shared design tokens**

```css
/*
 * Eureka Lab — Shared Design Tokens
 * Ported from ai-adventure-island reference (cinematic dark-fantasy palette).
 * Consumed by every Next.js app in the monorepo via:
 *   @import "@eureka-lab/ui/theme.css";
 * All tokens use HSL channel triplets so consumers can compose alpha via
 * `hsl(var(--token) / <alpha>)`. Single dark theme — no light variant.
 *
 * Consuming apps must load Cinzel/Inter/Amiri via next/font and expose them
 * as --font-display / --font-sans / --font-arabic on <body> (see
 * apps/web/src/app/layout.tsx for the reference implementation).
 */

@layer base {
  :root {
    /* Dark fantasy default — single theme for the game */
    --background: 230 40% 5%;
    --foreground: 190 60% 95%;

    --card: 230 35% 9%;
    --card-foreground: 190 60% 95%;

    --popover: 230 40% 7%;
    --popover-foreground: 190 60% 95%;

    /* Arcane cyan primary */
    --primary: 188 95% 55%;
    --primary-foreground: 230 50% 8%;
    --primary-glow: 188 100% 70%;

    /* Mystic violet secondary */
    --secondary: 268 70% 55%;
    --secondary-foreground: 0 0% 100%;
    --secondary-glow: 280 90% 70%;

    /* Quest gold accent */
    --accent: 42 95% 60%;
    --accent-foreground: 230 50% 8%;
    --accent-glow: 42 100% 70%;

    --muted: 230 25% 15%;
    --muted-foreground: 215 25% 70%;

    --destructive: 0 85% 60%;
    --destructive-foreground: 0 0% 100%;

    --success: 145 70% 50%;

    --border: 200 50% 25%;
    --input: 230 30% 14%;
    --ring: 188 95% 55%;

    --radius: 0.85rem;

    /* Gradients */
    --gradient-primary: linear-gradient(135deg, hsl(188 95% 55%), hsl(220 90% 60%));
    --gradient-secondary: linear-gradient(135deg, hsl(268 70% 55%), hsl(310 80% 60%));
    --gradient-gold: linear-gradient(135deg, hsl(42 95% 60%), hsl(28 95% 55%));
    --gradient-bg: radial-gradient(ellipse at top, hsl(230 50% 12%) 0%, hsl(230 40% 4%) 60%);
    --gradient-card: linear-gradient(160deg, hsl(230 35% 12% / 0.85), hsl(230 40% 7% / 0.85));
    --gradient-rune: conic-gradient(from 0deg, hsl(188 95% 55% / 0.4), hsl(268 70% 55% / 0.4), hsl(42 95% 60% / 0.4), hsl(188 95% 55% / 0.4));

    /* Shadows / glows */
    --glow-primary: 0 0 30px hsl(188 100% 60% / 0.55), 0 0 60px hsl(188 100% 60% / 0.3);
    --glow-secondary: 0 0 30px hsl(280 90% 65% / 0.55), 0 0 60px hsl(280 90% 65% / 0.3);
    --glow-gold: 0 0 30px hsl(42 100% 60% / 0.55), 0 0 60px hsl(42 100% 60% / 0.3);
    --shadow-elevated: 0 20px 60px -10px hsl(230 80% 2% / 0.8);

    --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);

    /* Sidebar tokens */
    --sidebar-background: 230 40% 6%;
    --sidebar-foreground: 190 60% 90%;
    --sidebar-primary: 188 95% 55%;
    --sidebar-primary-foreground: 230 50% 8%;
    --sidebar-accent: 230 30% 12%;
    --sidebar-accent-foreground: 188 95% 75%;
    --sidebar-border: 200 50% 20%;
    --sidebar-ring: 188 95% 55%;
  }

  .dark {
    /* same — game is always dark */
    --background: 230 40% 5%;
    --foreground: 190 60% 95%;
  }
}

/*
 * Tailwind v4 theme inline — bridges the HSL variables above into
 * the utility classes (bg-primary, text-foreground, font-display,
 * animate-pulse-glow, etc.). Equivalent to v3's tailwind.config.ts
 * `theme.extend`.
 */
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-success: hsl(var(--success));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --font-display: var(--font-display), Cinzel, serif;
  --font-sans: var(--font-sans), Inter, system-ui, sans-serif;
  --font-arabic: var(--font-arabic), Amiri, serif;

  /* Animation tokens — Tailwind v4 generates `animate-<name>` utilities
   * from `--animate-<name>`. Keyframes themselves are defined at the
   * bottom of this file (raw @keyframes blocks). */
  --animate-float-slow: float-slow 5s ease-in-out infinite;
  --animate-pulse-glow: pulse-glow 2.5s ease-in-out infinite;
  --animate-fade-in-up: fade-in-up 0.6s ease-out both;
  --animate-flicker: flicker 4s ease-in-out infinite;
  --animate-shimmer: shimmer 2.5s linear infinite;
  --animate-shake: shake 0.45s ease-in-out;
  --animate-hit-flash: hit-flash 0.4s ease-out;
  --animate-slash: slash 0.5s ease-out forwards;
  --animate-damage-pop: damage-pop 0.9s ease-out forwards;
  --animate-victory-burst: victory-burst 0.6s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

/*
 * Base layer: global resets, body background, font defaults, RTL display font swap.
 */
@layer base {
  * {
    @apply border-border;
  }

  html,
  body {
    @apply h-full;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    background-image: var(--gradient-bg);
    background-attachment: fixed;
    font-family: var(--font-sans), "Inter", system-ui, sans-serif;
  }

  h1,
  h2,
  h3,
  h4,
  .font-display {
    font-family: var(--font-display), "Cinzel", serif;
    letter-spacing: 0.02em;
  }

  html[dir="rtl"] .font-display,
  html[dir="rtl"] h1,
  html[dir="rtl"] h2,
  html[dir="rtl"] h3,
  html[dir="rtl"] h4 {
    font-family: var(--font-arabic), "Amiri", serif;
  }
}

/*
 * Utility layer — porthole into reference's bespoke effects.
 * Text glows, gradient backgrounds, box-glows, the panel surface,
 * rune-ring orbital halo, and CRT scanlines overlay.
 */
@layer utilities {
  .text-glow-primary {
    text-shadow:
      0 0 20px hsl(var(--primary) / 0.7),
      0 0 40px hsl(var(--primary) / 0.4);
  }
  .text-glow-gold {
    text-shadow:
      0 0 20px hsl(var(--accent) / 0.7),
      0 0 40px hsl(var(--accent) / 0.4);
  }
  .text-glow-violet {
    text-shadow:
      0 0 20px hsl(var(--secondary) / 0.7),
      0 0 40px hsl(var(--secondary) / 0.4);
  }

  .bg-gradient-primary {
    background-image: var(--gradient-primary);
  }
  .bg-gradient-secondary {
    background-image: var(--gradient-secondary);
  }
  .bg-gradient-gold {
    background-image: var(--gradient-gold);
  }
  .bg-gradient-card {
    background-image: var(--gradient-card);
  }

  .glow-primary {
    box-shadow: var(--glow-primary);
  }
  .glow-secondary {
    box-shadow: var(--glow-secondary);
  }
  .glow-gold {
    box-shadow: var(--glow-gold);
  }

  .panel {
    background-image: var(--gradient-card);
    @apply backdrop-blur-xl border border-border/60 rounded-2xl;
    box-shadow:
      var(--shadow-elevated),
      inset 0 1px 0 hsl(var(--primary) / 0.1);
  }

  .rune-ring {
    position: relative;
  }
  .rune-ring::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: var(--gradient-rune);
    z-index: -1;
    filter: blur(8px);
    opacity: 0.7;
    animation: rune-spin 12s linear infinite;
  }

  .scanlines {
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      hsl(var(--primary) / 0.04) 3px,
      transparent 4px
    );
  }
}

/*
 * Keyframes for the design-system animations declared in @theme.
 * Tailwind v4 generates `animate-<name>` utilities from --animate-<name>
 * but the @keyframes themselves must exist somewhere reachable; raw CSS
 * here keeps them available for both Tailwind utilities and plain
 * `animation:` declarations (e.g. .rune-ring::before above).
 */
@keyframes rune-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 12px hsl(var(--primary) / 0.6));
  }
  50% {
    filter: drop-shadow(0 0 28px hsl(var(--primary) / 0.95));
  }
}

@keyframes flicker {
  0%,
  100% {
    opacity: 1;
  }
  45% {
    opacity: 0.85;
  }
  55% {
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-10px) rotate(-2deg);
  }
  40% {
    transform: translateX(10px) rotate(2deg);
  }
  60% {
    transform: translateX(-8px);
  }
  80% {
    transform: translateX(8px);
  }
}

@keyframes hit-flash {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(2.4) hue-rotate(-20deg)
      drop-shadow(0 0 25px hsl(var(--destructive)));
  }
}

@keyframes slash {
  0% {
    opacity: 0;
    transform: scale(0.4) rotate(-30deg);
  }
  40% {
    opacity: 1;
    transform: scale(1.1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(1.4) rotate(20deg);
  }
}

@keyframes damage-pop {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.6);
  }
  30% {
    opacity: 1;
    transform: translateY(-30px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-70px) scale(1);
  }
}

@keyframes victory-burst {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

- [ ] **Step 2: Replace the promoted sections in `apps/web/src/app/globals.css`**

Replace the entire file contents with:

```css
@import "tailwindcss";
@import "@eureka-lab/ui/theme.css";

/*
 * Eureka Lab (web app) — app-specific overrides.
 * Shared design tokens, fonts-as-CSS-vars, and game-visual utilities
 * (glows, gradients, panel, rune-ring, scanlines) now live in
 * packages/ui/src/theme.css, imported above. Fonts (Cinzel, Inter, Amiri)
 * are still loaded via next/font in src/app/layout.tsx.
 */

/*
 * Pre-existing Eureka utilities (mobile gamification + scroll/safe-area).
 * App-specific — not shared with other apps, kept here verbatim.
 */
@keyframes xp-float {
  0% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60px) scale(1.2);
  }
}

.animate-xp-float {
  animation: xp-float 1.5s ease-out forwards;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/theme.css apps/web/src/app/globals.css
git commit -m "refactor(ui): extract shared design tokens into packages/ui/theme.css"
```

---

## Task 2: Add `cn` utility and promote `GameButton` to `packages/ui`

**Files:**
- Create: `packages/ui/src/lib/cn.ts`
- Create: `packages/ui/src/components/GameButton.tsx`
- Delete: `apps/web/src/components/game/GameButton.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create `packages/ui/src/lib/cn.ts`**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper conflict resolution.
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `packages/ui/src/components/GameButton.tsx`** (moved from `apps/web`, import path updated)

```tsx
'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const variants = cva(
  'relative inline-flex items-center justify-center gap-2 font-display tracking-wider uppercase select-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden group',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-primary text-primary-foreground shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.7)] hover:shadow-[0_10px_40px_-6px_hsl(var(--primary)/0.95)] hover:-translate-y-0.5',
        gold: 'bg-gradient-gold text-accent-foreground shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.7)] hover:shadow-[0_10px_40px_-6px_hsl(var(--accent)/0.95)] hover:-translate-y-0.5',
        ghost:
          'bg-transparent text-foreground border border-primary/40 hover:bg-primary/10 hover:border-primary',
        danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-12 px-7 text-sm',
        lg: 'h-14 px-10 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

/** Props for GameButton — extends native button attributes with CVA variant props. */
export interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {}

/**
 * Fantasy-styled button with 4 visual variants and a shimmer hover effect.
 *
 * @param props.variant - Visual style: 'primary' | 'gold' | 'ghost' | 'danger'
 * @param props.size - Button size: 'sm' | 'md' | 'lg'
 * @param props.className - Optional extra CSS classes
 * @param props.children - Button content
 * @returns A styled button element with a shimmer overlay
 */
export const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <button ref={ref} className={cn(variants({ variant, size }), className)} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {/* Shimmer sweep on hover */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-[linear-gradient(110deg,transparent,hsl(var(--primary-foreground)/0.25),transparent)]"
      />
    </button>
  )
);
GameButton.displayName = 'GameButton';
```

- [ ] **Step 3: Delete `apps/web/src/components/game/GameButton.tsx`**

```bash
rm apps/web/src/components/game/GameButton.tsx
```

- [ ] **Step 4: Update the import in `apps/web/src/app/page.tsx`**

Change:
```ts
import { GameButton } from '@/components/game/GameButton';
```
to:
```ts
import { GameButton } from '@eureka-lab/ui';
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/lib/cn.ts packages/ui/src/components/GameButton.tsx apps/web/src/components/game/GameButton.tsx apps/web/src/app/page.tsx
git commit -m "refactor(ui): promote GameButton to packages/ui"
```

---

## Task 3: Promote `Logo` to `packages/ui`

**Files:**
- Create: `packages/ui/src/components/Logo.tsx`
- Delete: `apps/web/src/components/game/Logo.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create `packages/ui/src/components/Logo.tsx`** (moved from `apps/web`, import path updated; the brand tagline is passed in since `apps/web` and `apps/landing` use slightly different copy — `apps/web`'s was "QUEST FOR AI MASTERY", the Lovable source's was "CHRONICLES OF THE CODE")

```tsx
'use client';

import Image from 'next/image';
import { cn } from '../lib/cn';

interface LogoProps {
  /** Additional class names for the wrapper */
  className?: string;
  /** Whether to render the brand text alongside the emblem. Defaults to true. */
  withText?: boolean;
  /** Tagline shown under "EUREKA LAB". Defaults to the game's tagline. */
  tagline?: string;
}

/**
 * Eureka Lab brand logo with animated glow effect.
 * @param props.className - Optional extra CSS classes
 * @param props.withText - Show brand text alongside the emblem (default: true)
 * @param props.tagline - Tagline shown under "EUREKA LAB" (default: "QUEST FOR AI MASTERY")
 * @returns A flex row containing the logo image and optional brand text
 */
export function Logo({ className, withText = true, tagline = 'QUEST FOR AI MASTERY' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/assets/game/logo.png"
        alt="Eureka Lab emblem"
        width={48}
        height={48}
        className="h-12 w-12 animate-pulse-glow"
      />
      {withText && (
        <div className="leading-none">
          <div className="font-display text-2xl text-glow-primary">EUREKA LAB</div>
          <div className="text-[10px] tracking-[0.4em] text-primary/80">{tagline}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete `apps/web/src/components/game/Logo.tsx`**

```bash
rm apps/web/src/components/game/Logo.tsx
rmdir apps/web/src/components/game 2>/dev/null || true
```

(If `apps/web/src/components/game/` still contains other files, skip the `rmdir` — leave the directory in place.)

- [ ] **Step 3: Update the import in `apps/web/src/app/page.tsx`**

Change:
```ts
import { Logo } from '@/components/game/Logo';
```
to import alongside `GameButton` from Task 2:
```ts
import { Logo, GameButton } from '@eureka-lab/ui';
```
(Combine into the single `@eureka-lab/ui` import statement added in Task 2 rather than two separate import lines.)

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/Logo.tsx apps/web/src/components/game apps/web/src/app/page.tsx
git commit -m "refactor(ui): promote Logo to packages/ui"
```

---

## Task 3b: Fix remaining `GameButton`/`Logo` import sites (gap found during Task 4)

**Why this task exists:** Tasks 2 and 3 only updated `apps/web/src/app/page.tsx`'s imports when deleting the local `GameButton.tsx`/`Logo.tsx` files — that was the only usage checked when the plan was written. Task 4's build-verification step discovered 27 more files import these components from the now-deleted local paths, plus the barrel file `apps/web/src/components/game/index.ts` itself still re-exports from the deleted files. This task fixes all of them before Task 4 can pass its build-verification step.

**Files to modify** (28 total — run the grep in Step 1 to get the authoritative list, this is what it returned as of this writing):
- `apps/web/src/components/game/index.ts` (barrel file)
- `apps/web/src/components/features/school/StudentsPanel.tsx`
- `apps/web/src/components/features/school/BillingStatusCard.tsx`
- `apps/web/src/components/features/auth/OAuthBirthYearModal.tsx`
- `apps/web/src/components/features/admin/BillingPanel.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/app/(learner)/victory/page.tsx`
- `apps/web/src/app/(learner)/shop/page.tsx`
- `apps/web/src/app/(learner)/inventory/page.tsx`
- `apps/web/src/app/(learner)/dashboard/page.tsx`
- `apps/web/src/app/(learner)/character/page.tsx`
- `apps/web/src/app/(learner)/campaign/[slug]/prepare/page.tsx`
- `apps/web/src/app/(learner)/campaign/[slug]/page.tsx`
- `apps/web/src/app/(learner)/campaign/[slug]/mission/[missionId]/prep/page.tsx`
- `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/page.tsx`
- `apps/web/src/app/(learner)/campaign/[slug]/battle/[missionId]/_battle-outcome.tsx`
- `apps/web/src/app/(dashboard)/teacher/page.tsx`
- `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx`
- `apps/web/src/app/(dashboard)/school/page.tsx`
- `apps/web/src/app/(dashboard)/parent/page.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/app/(dashboard)/checkout/success/page.tsx`
- `apps/web/src/app/(dashboard)/checkout/cancel/page.tsx`
- `apps/web/src/app/(dashboard)/admin/schools/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/admin/page.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/confirm-parent/[token]/page.tsx`

- [ ] **Step 1: Get the authoritative current list of affected files**

```bash
grep -rl "from '@/components/game/\(GameButton\|Logo\)'" apps/web/src
```
Use this list, not the one above, if they differ — the one above is a snapshot and the codebase may have moved since this plan section was written.

- [ ] **Step 2: Fix the barrel file `apps/web/src/components/game/index.ts`**

Current content:
```ts
/**
 * Barrel export for the Phase 16 fantasy UI component library.
 * All components are client components (require 'use client' in their modules).
 */

export { Scene } from './Scene';
export { Logo } from './Logo';
export { GameButton } from './GameButton';
export type { GameButtonProps } from './GameButton';
export { KpBadge } from './KpBadge';
export { AiTutorChat } from './AiTutorChat';
export { NavLink } from './NavLink';
export { HpBar } from './HpBar';
```
Replace the `Logo`/`GameButton` lines so it re-exports those two from `@eureka-lab/ui` instead, leaving the other five exports (`Scene`, `KpBadge`, `AiTutorChat`, `NavLink`, `HpBar`) untouched since those components were never promoted and still live locally:
```ts
/**
 * Barrel export for the Phase 16 fantasy UI component library.
 * All components are client components (require 'use client' in their modules).
 */

export { Logo, GameButton, type GameButtonProps } from '@eureka-lab/ui';
export { Scene } from './Scene';
export { KpBadge } from './KpBadge';
export { AiTutorChat } from './AiTutorChat';
export { NavLink } from './NavLink';
export { HpBar } from './HpBar';
```

- [ ] **Step 3: Fix each of the other 27 files**

For each file, find its import line(s) for `GameButton` and/or `Logo` from `@/components/game/GameButton` or `@/components/game/Logo` and repoint them at `@eureka-lab/ui`, following the exact pattern already used in Tasks 2/3 for `apps/web/src/app/page.tsx`:
- If a file imports only `GameButton` from `@/components/game/GameButton`, change the import source to `@eureka-lab/ui` (keep it a separate line unless Step 4 below says to merge).
- If a file imports only `Logo` from `@/components/game/Logo`, same.
- If a file imports both `GameButton` and `Logo` (from two separate lines, since they were always two separate files), merge them into one `import { Logo, GameButton } from '@eureka-lab/ui';` line (matching the merge already done in Task 3 for `page.tsx`).
- If a file ALSO already imports something else from `@eureka-lab/ui` (unlikely at this point in the plan, but check), merge into that existing import statement instead of creating a second one.
- Do not change the import order/style of anything else in these files. Do not reformat unrelated code. This is a mechanical import-source fix, nothing else.

- [ ] **Step 4: Verify no references remain**

```bash
grep -r "from '@/components/game/\(GameButton\|Logo\)'" apps/web/src
```
Expected: no output (zero matches).

- [ ] **Step 5: Typecheck before committing**

```bash
pnpm --filter @eureka-lab/web lint
```
Fix anything it flags that's in scope for this task (an import-order/formatting nit introduced by your edits). Don't chase pre-existing warnings unrelated to your changes.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "fix(web): repoint remaining GameButton/Logo imports at @eureka-lab/ui"
```

---

## Task 4: Wire `packages/ui` exports/package.json and verify `apps/web` still builds

**Files:**
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Update `packages/ui/src/index.ts`**

```ts
/**
 * Shared UI component library for Eureka-Lab.
 * Extends shadcn/ui components with platform-specific variants.
 */

export { GameButton, type GameButtonProps } from './components/GameButton';
export { Logo } from './components/Logo';
export { cn } from './lib/cn';
```

- [ ] **Step 2: Update `packages/ui/package.json`** to add the new runtime deps, a `next` peer dependency, and the CSS export

```json
{
  "name": "@eureka-lab/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./theme.css": "./src/theme.css"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist",
    "lint": "tsc --noEmit"
  },
  "peerDependencies": {
    "next": ">=14",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "next": "^14.2.0",
    "typescript": "^5.6.0",
    "rimraf": "^6.0.0"
  }
}
```

- [ ] **Step 3: Install and build**

```bash
pnpm install
pnpm --filter @eureka-lab/ui build
```
Expected: `tsc` completes with no errors; `packages/ui/dist/index.js` and `index.d.ts` exist and export `GameButton`, `Logo`, `cn`.

- [ ] **Step 4: Verify `apps/web` still builds against the promoted package**

```bash
pnpm --filter @eureka-lab/web lint
pnpm --filter @eureka-lab/web build
```
Expected: both pass with no errors referencing `@/components/game/GameButton` or `@/components/game/Logo` (they should no longer be referenced anywhere).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/index.ts packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): export GameButton, Logo, cn from packages/ui"
```

---

## Task 5: Scaffold the `apps/landing` workspace app (config files)

**Files:**
- Create: `apps/landing/package.json`
- Create: `apps/landing/tsconfig.json`
- Create: `apps/landing/next.config.js`
- Create: `apps/landing/postcss.config.js`
- Create: `apps/landing/.eslintrc.json`
- Create: `apps/landing/vercel.json`
- Create: `apps/landing/.env.example`

- [ ] **Step 1: Create `apps/landing/package.json`**

```json
{
  "name": "@eureka-lab/landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3012",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rimraf .next .turbo"
  },
  "dependencies": {
    "@eureka-lab/shared-types": "workspace:*",
    "@eureka-lab/ui": "workspace:*",
    "@tailwindcss/postcss": "^4.2.0",
    "autoprefixer": "^10.4.24",
    "framer-motion": "^12.40.0",
    "next": "^14.2.0",
    "next-intl": "^4.8.3",
    "postcss": "^8.5.6",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "^4.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "rimraf": "^6.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/landing/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/landing/next.config.js`**

```js
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eureka-lab/shared-types', '@eureka-lab/ui'],
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = withNextIntl(nextConfig);
```

- [ ] **Step 4: Create `apps/landing/postcss.config.js`**

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `apps/landing/.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 6: Create `apps/landing/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@eureka-lab/landing...",
  "outputDirectory": ".next",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

- [ ] **Step 7: Create `apps/landing/.env.example`**

```
# Base URL of the apps/web product app — used for CTA links ("Enter the Realm",
# "Begin Your Quest") that leave the marketing site. Local dev default matches
# apps/web's dev port (3010).
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

- [ ] **Step 8: Copy `.env.example` to `.env.local` for local dev**

```bash
cp apps/landing/.env.example apps/landing/.env.local
```

- [ ] **Step 9: Commit**

```bash
git add apps/landing/package.json apps/landing/tsconfig.json apps/landing/next.config.js apps/landing/postcss.config.js apps/landing/.eslintrc.json apps/landing/vercel.json apps/landing/.env.example
git commit -m "feat(landing): scaffold apps/landing workspace app"
```

(`.env.local` is gitignored via the repo's root `.gitignore` — do not add it.)

---

## Task 6: App shell — layout, globals.css, i18n, page metadata wrapper

**Files:**
- Create: `apps/landing/src/app/globals.css`
- Create: `apps/landing/src/app/layout.tsx`
- Create: `apps/landing/src/app/page.tsx`
- Create: `apps/landing/src/i18n/request.ts`
- Create: `apps/landing/src/messages/en.json`
- Create: `apps/landing/src/messages/fr.json`
- Create: `apps/landing/src/messages/ar.json`
- Create: `apps/landing/src/lib/links.ts`

- [ ] **Step 1: Create `apps/landing/src/app/globals.css`**

```css
@import "tailwindcss";
@import "@eureka-lab/ui/theme.css";
```

- [ ] **Step 2: Create `apps/landing/src/i18n/request.ts`** (mirrors `apps/web`'s current hardcoded-locale pattern — see scope note in the plan header)

```ts
import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl request configuration.
 * Loads locale messages based on the current locale.
 */
export default getRequestConfig(async () => {
  const locale = 'en';

  return {
    locale,
    timeZone: 'UTC',
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create the placeholder message files**

`apps/landing/src/messages/en.json`:
```json
{}
```

`apps/landing/src/messages/fr.json`:
```json
{}
```

`apps/landing/src/messages/ar.json`:
```json
{}
```

- [ ] **Step 4: Create `apps/landing/src/lib/links.ts`**

```ts
/**
 * Absolute URL of the apps/web product app, used for CTAs that leave the
 * marketing site (e.g. "Enter the Realm", "Begin Your Quest").
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/** Login/signup entry point in the product app. */
export const LOGIN_URL = `${APP_URL}/login`;
```

- [ ] **Step 5: Create `apps/landing/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter, Cinzel, Amiri } from 'next/font/google';
import { getMessages, getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Eureka Lab — AI Literacy Quest for Kids',
  description:
    'A cinematic AI literacy adventure for kids 8–14. Forge a hero, hop magical islands, master AI, and defeat the Babble Zombies.',
};

/**
 * Root layout for the Eureka Lab landing/marketing site.
 * @param children - Page content rendered inside this layout
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} ${cinzel.variable} ${amiri.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create `apps/landing/src/app/page.tsx`** (server component; the interactive content is built in Task 8)

```tsx
import { LandingPage } from '@/components/landing/LandingPage';

/**
 * Home route — renders the Eureka Lab landing page.
 * @returns The landing page content
 */
export default function Page() {
  return <LandingPage />;
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/landing/src/app/globals.css apps/landing/src/app/layout.tsx apps/landing/src/i18n apps/landing/src/messages apps/landing/src/lib/links.ts
git commit -m "feat(landing): app shell (layout, i18n, theme import)"
```

(`apps/landing/src/app/page.tsx` is intentionally left uncommitted here — it references `LandingPage`, which doesn't exist until Task 8. Stage it together with Task 8's commit instead.)

---

## Task 7: Copy image assets into `apps/landing`

**Files:**
- Create: `apps/landing/public/assets/game/*` (11 files)

- [ ] **Step 1: Copy the asset files from `apps/web`'s public folder**

```bash
mkdir -p apps/landing/public/assets/game
cp apps/web/public/assets/game/*.jpg apps/web/public/assets/game/*.png apps/landing/public/assets/game/
```

- [ ] **Step 2: Verify all 11 files copied**

```bash
ls apps/landing/public/assets/game
```
Expected: `hero-engineer.jpg hero-mage.jpg hero-rogue.jpg hero-warrior.jpg island-1.jpg island-2.jpg island-3.jpg island-4.jpg logo.png world-map.jpg zombie.png`

- [ ] **Step 3: Commit**

```bash
git add apps/landing/public/assets/game
git commit -m "feat(landing): add game world/hero/island image assets"
```

---

## Task 8: Build the landing page sections (adapted from `Landing.tsx`)

**Source:** `C:\Eureka-lab-app\Dev\ai-adventure-island-new\src\pages\Landing.tsx`

**Files:**
- Create: `apps/landing/src/components/landing/Nav.tsx`
- Create: `apps/landing/src/components/landing/Hero.tsx`
- Create: `apps/landing/src/components/landing/HorizontalIslands.tsx`
- Create: `apps/landing/src/components/landing/Heroes.tsx`
- Create: `apps/landing/src/components/landing/Academy.tsx`
- Create: `apps/landing/src/components/landing/Battle.tsx`
- Create: `apps/landing/src/components/landing/Footer.tsx`
- Create: `apps/landing/src/components/landing/LandingPage.tsx`

Adaptations from the source (apply consistently across all files below):
1. `react-router-dom`'s `Link to="/login"` → plain `<a href={LOGIN_URL}>` (leaving the app, not an in-app route).
2. `@/components/game/Logo` / `@/components/game/GameButton` → `@eureka-lab/ui`.
3. Vite asset imports (`import worldBg from "@/assets/world-map.jpg"`) → public-path string constants (`'/assets/game/world-map.jpg'`), matching the pattern already used in `apps/web/src/app/page.tsx:20`.
4. `Seo` (react-helmet-async) removed — replaced by the `metadata` export on `apps/landing/src/app/page.tsx` (Task 6, Step 6).
5. The `Nav`'s `<Link to="/about">About</Link>` is dropped — no About page exists in this scope, and shipping a dead link isn't acceptable. Re-add when an About page is built.
6. Single 332-line source file split into one file per section per CLAUDE.md's 300-line cap.

- [ ] **Step 1: Create `apps/landing/src/components/landing/Nav.tsx`**

```tsx
'use client';

import { Logo, GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

/** Fixed top navigation bar with in-page section anchors and the login CTA. */
export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between backdrop-blur-md">
        <Logo tagline="CHRONICLES OF THE CODE" />
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-display tracking-[0.35em] uppercase text-primary/80">
          <a href="#world" className="hover:text-primary transition-colors">World</a>
          <a href="#heroes" className="hover:text-primary transition-colors">Heroes</a>
          <a href="#academy" className="hover:text-primary transition-colors">Academy</a>
          <a href="#battle" className="hover:text-primary transition-colors">Battle</a>
        </nav>
        <a href={LOGIN_URL}>
          <GameButton size="sm">Enter the Realm</GameButton>
        </a>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create `apps/landing/src/components/landing/Hero.tsx`**

```tsx
'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

const worldBg = '/assets/game/world-map.jpg';

/** Scroll-pinned, parallax hero section — the first thing visitors see. */
export function Hero({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [0, -200]);
  const scale = useTransform(progress, [0, 1], [1, 1.15]);
  const opacity = useTransform(progress, [0, 0.8], [1, 0]);
  const titleY = useTransform(progress, [0, 1], [0, -120]);

  return (
    <section className="relative h-[180vh]" id="top">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ y, scale, backgroundImage: `url(${worldBg})` }}
          className="absolute inset-0 bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
        <div className="absolute inset-0 scanlines opacity-40" />

        <motion.div
          style={{ y: titleY, opacity }}
          className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="text-[11px] tracking-[0.6em] text-primary/80 mb-6 animate-flicker">
            A NEW LEGEND BEGINS
          </p>
          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl text-glow-primary leading-[0.95]">
            <span aria-hidden="true">
              EUREKA
              <br />
              <span className="text-glow-gold">LAB</span>
            </span>
            <span className="sr-only">Eureka Lab — AI Literacy Quest for Kids</span>
          </h1>
          <p className="mt-8 max-w-xl text-base sm:text-lg text-muted-foreground">
            Four islands. Four trials. Master the AI arts and drive the Babble Zombies back into the void.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={LOGIN_URL}>
              <GameButton size="lg">Begin Your Quest</GameButton>
            </a>
            <a
              href="#world"
              className="text-[11px] font-display tracking-[0.4em] uppercase text-primary/70 hover:text-primary transition-colors"
            >
              Scroll to descend ↓
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary/60"
        >
          <div className="h-12 w-px bg-gradient-to-b from-transparent to-primary/80 animate-pulse" />
          <span className="text-[9px] tracking-[0.4em]">SCROLL</span>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `apps/landing/src/components/landing/HorizontalIslands.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ISLANDS = [
  { img: '/assets/game/island-1.jpg', name: 'Isle of Prompts', desc: 'Where every word holds power. Speak so clearly that even zombies fall silent.' },
  { img: '/assets/game/island-2.jpg', name: 'Realm of Reasoning', desc: 'Logic forged into steel. Chain your thoughts and break enemy minds.' },
  { img: '/assets/game/island-3.jpg', name: 'Vision Vaults', desc: 'Teach machines to see. Unmask illusions with the eye of the model.' },
  { img: '/assets/game/island-4.jpg', name: 'Citadel of Safety', desc: "Stand guard against bias and hallucination. Become the realm's shield." },
];

/** Scroll-driven horizontal reveal of the four learning islands. */
export function HorizontalIslands() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <section ref={ref} id="world" className="relative h-[400vh] bg-background">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER I</p>
          <h2 className="font-display text-4xl sm:text-5xl text-glow-gold mt-2">Four Magical Isles</h2>
        </div>
        <motion.div style={{ x }} className="flex gap-8 pl-[10vw] pr-[10vw]">
          {ISLANDS.map((isle, i) => (
            <div key={isle.name} className="relative w-[80vw] sm:w-[60vw] h-[70vh] flex-shrink-0 panel overflow-hidden group">
              <img src={isle.img} alt={isle.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <p className="text-[10px] tracking-[0.5em] text-primary/70">ISLE {String(i + 1).padStart(2, '0')}</p>
                <h3 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">{isle.name}</h3>
                <p className="mt-4 max-w-md text-muted-foreground">{isle.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `apps/landing/src/components/landing/Heroes.tsx`**

```tsx
'use client';

import { motion } from 'framer-motion';

const HEROES = [
  { img: '/assets/game/hero-mage.jpg', name: 'The Mage', tag: 'Wields prompts like incantations.' },
  { img: '/assets/game/hero-warrior.jpg', name: 'The Warrior', tag: 'Cleaves through hallucinations.' },
  { img: '/assets/game/hero-rogue.jpg', name: 'The Rogue', tag: 'Slips past biased guardians.' },
  { img: '/assets/game/hero-engineer.jpg', name: 'The Engineer', tag: 'Builds tools from raw logic.' },
];

/** Staggered-reveal grid of the four playable hero classes. */
export function Heroes() {
  return (
    <section id="heroes" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER II</p>
          <h2 className="font-display text-4xl sm:text-6xl text-glow-primary mt-2">Forge Your Hero</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Choose a class. Shape your destiny. Each path teaches a different way to wield AI.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HEROES.map((h, i) => (
            <motion.div
              key={h.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="panel rune-ring p-4 group"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-xl">
                <img
                  src={h.img}
                  alt={h.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="pt-4 text-center">
                <h3 className="font-display text-xl text-glow-primary">{h.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{h.tag}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `apps/landing/src/components/landing/Academy.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

const STEPS = [
  { kp: '+15 KP', title: 'Watch Shorts', desc: 'Bite-size videos explain how AI thinks, dreams, and sometimes lies.' },
  { kp: '+25 KP', title: 'Read Lessons', desc: 'Illustrated chronicles of prompts, models, bias, and safety.' },
  { kp: '+10 KP', title: 'Chat the Sage', desc: 'Ask the AI Tutor anything. Curiosity is the only currency.' },
  { kp: 'Forge', title: 'Spend KP', desc: 'Trade knowledge for new abilities and legendary weapons.' },
];

/** The Academy / Knowledge Points explainer section, with a scroll-charged KP bar. */
export function Academy() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const kpFill = useTransform(smooth, [0.2, 0.8], ['0%', '100%']);

  return (
    <section ref={ref} id="academy" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER III</p>
          <h2 className="font-display text-4xl sm:text-6xl text-glow-violet mt-2">The Academy</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Knowledge Points (KP) are your power. Earn them by learning — spend them to outmatch any foe.
          </p>
        </div>

        <div className="panel p-6 mb-16">
          <div className="flex justify-between text-[11px] font-display tracking-widest mb-3">
            <span className="text-primary/80">KNOWLEDGE POINTS</span>
            <span className="text-accent">SCROLL TO CHARGE</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div style={{ width: kpFill }} className="h-full bg-gradient-primary glow-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="panel p-6"
            >
              <div className="text-glow-gold font-display text-2xl">{s.kp}</div>
              <h3 className="mt-2 font-display text-lg text-glow-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create `apps/landing/src/components/landing/Battle.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

const zombie = '/assets/game/zombie.png';

/** Villain-reveal section with a parallax zombie and the final CTA. */
export function Battle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const zScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.1, 1.4]);
  const zRot = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.9, 0.3]);

  return (
    <section ref={ref} id="battle" className="relative h-[180vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <motion.div
          style={{ opacity: glow }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--destructive)/0.25),transparent_60%)]"
        />
        <div className="absolute inset-0 scanlines" />

        <motion.img
          src={zombie}
          alt="Babble Zombie"
          style={{ scale: zScale, rotate: zRot }}
          className="absolute h-[80vh] object-contain drop-shadow-[0_0_60px_hsl(var(--destructive)/0.6)]"
        />

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <p className="text-[11px] tracking-[0.5em] text-destructive animate-flicker">CHAPTER IV</p>
          <h2 className="font-display text-5xl sm:text-7xl text-glow-gold mt-3">
            The Babble Zombies Rise
          </h2>
          <p className="mt-6 text-muted-foreground">
            Riddle by riddle, prompt by prompt — banish the noise. Every correct answer is a strike.
            Every spent KP is a stat. Outsmart the swarm and reclaim the realm.
          </p>
          <div className="mt-10">
            <a href={LOGIN_URL}>
              <GameButton size="lg">Begin Your Quest</GameButton>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create `apps/landing/src/components/landing/Footer.tsx`**

```tsx
'use client';

import { Logo } from '@eureka-lab/ui';

/** Closing footer with brand mark and copyright line. */
export function Footer() {
  return (
    <footer className="relative py-20 px-6 border-t border-border/40">
      <div className="max-w-5xl mx-auto text-center">
        <Logo className="justify-center mb-6" tagline="CHRONICLES OF THE CODE" />
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A cinematic AI literacy adventure. Built for curious heroes ages 8 to 14.
        </p>
        <div className="mt-8 text-[10px] tracking-[0.4em] text-muted-foreground/60">
          © {new Date().getFullYear()} EUREKA LAB · CHRONICLES OF THE CODE
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: Create `apps/landing/src/components/landing/LandingPage.tsx`** (assembles all sections; this is what `src/app/page.tsx` renders)

```tsx
'use client';

import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { Nav } from './Nav';
import { Hero } from './Hero';
import { HorizontalIslands } from './HorizontalIslands';
import { Heroes } from './Heroes';
import { Academy } from './Academy';
import { Battle } from './Battle';
import { Footer } from './Footer';

/** Full Eureka Lab landing page — hero, four chapters, and footer. */
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  return (
    <div className="relative bg-background text-foreground">
      <Nav />
      <div ref={heroRef}>
        <Hero progress={heroProgress} />
      </div>
      <HorizontalIslands />
      <Heroes />
      <Academy />
      <Battle />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 9: Commit** (includes `src/app/page.tsx` from Task 6, Step 6, which depends on `LandingPage`)

```bash
git add apps/landing/src/components/landing apps/landing/src/app/page.tsx
git commit -m "feat(landing): import Landing.tsx as the home page, adapted for Next.js"
```

---

## Task 9: Install, build, and verify in the browser

**Files:** none (verification only)

- [ ] **Step 1: Install dependencies**

```bash
pnpm install
```
Expected: resolves `@eureka-lab/landing` as a new workspace member with no errors.

- [ ] **Step 2: Lint and build**

```bash
pnpm --filter @eureka-lab/landing lint
pnpm --filter @eureka-lab/landing build
```
Expected: both pass with zero errors. If `next build` fails on a missing `next-env.d.ts`, run `pnpm --filter @eureka-lab/landing dev` once first (Next.js generates it automatically) then re-run build.

- [ ] **Step 3: Start the dev server and view the page in a browser**

```bash
pnpm --filter @eureka-lab/landing dev
```
Then open `http://localhost:3012` in a browser (or use the Playwright MCP tools) and confirm:
- The hero section renders with the world map background, "EUREKA LAB" glowing title, and both CTA buttons visible (not transparent/blending — this was the exact bug reported earlier in this session for the Lovable project, so double-check `GameButton`'s `primary`/`ghost` variants render with visible contrast against the dark background here).
- Scrolling reveals the four islands, four heroes, the Academy KP bar, and the Battle section in sequence.
- "Enter the Realm" (nav) and "Begin Your Quest" (hero + battle) links point to `http://localhost:3010/login`.
- No console errors.

- [ ] **Step 4: Run the full workspace build once more to confirm nothing else broke**

```bash
pnpm build
```
Expected: `apps/web`, `apps/api`, `apps/landing`, and all `packages/*` build successfully.

- [ ] **Step 5: Commit any fixes found during verification**

If Steps 2–4 surface issues, fix them in the relevant file(s) from Tasks 1–8 and commit:
```bash
git add -A
git commit -m "fix(landing): address build/verification issues"
```
(Only run this step if verification actually found something to fix — otherwise there's nothing to commit.)

---

## Task 10: Compare the running app against the Lovable reference design and reconcile differences

**Why:** Task 9 only confirms the ported page builds and renders without errors — it doesn't confirm it *looks* right against the source. The Lovable project (`C:\Eureka-lab-app\Dev\ai-adventure-island-new`) is the canonical visual reference; this task is the explicit side-by-side check the user asked for before moving on to i18n/test-coverage work.

**Files:** whatever Task 8 files need adjustment based on findings (no new files expected).

- [ ] **Step 1: Run both apps side by side**

```bash
# Terminal 1 — the ported landing app
pnpm --filter @eureka-lab/landing dev
# Terminal 2 — the original Lovable reference (separate project, not a workspace member)
cd C:\Eureka-lab-app\Dev\ai-adventure-island-new
npm install   # first run only
npm run dev   # Vite default: http://localhost:5173, routed to /landing or / depending on its router — check terminal output for the exact URL
```

- [ ] **Step 2: Compare section by section, both at desktop (1440px) and mobile (390px) widths**

Check each of these against the reference and note any mismatch:
- **Hero** — world-map parallax depth/speed, title glow intensity, CTA button visibility and contrast (this was the exact "transparent button" bug reported earlier for the Lovable project during this session — confirm `GameButton`'s `primary` variant is NOT reproducing that bug here).
- **HorizontalIslands** — scroll-jacked horizontal reveal speed/distance, island card sizing, gradient overlay legibility of text over images.
- **Heroes** — stagger timing/delay on scroll-into-view, card hover scale.
- **Academy** — KP progress bar fill behavior tied to scroll position (spring physics feel).
- **Battle** — zombie parallax scale/rotation range, glow pulse.
- **Footer** — spacing, logo placement.
- **Fonts** — Cinzel on headings/display text, Inter on body, glow text-shadow rendering (this is the biggest risk point: confirm `packages/ui/theme.css`'s `@theme inline` block — which defines `--animate-*` tokens and the `.text-glow-*`/`.bg-gradient-*`/`.panel`/`.rune-ring`/`.scanlines` utility classes — is actually reachable from `apps/landing/src/app/globals.css` via `@import "@eureka-lab/ui/theme.css"` across the workspace package boundary; a broken import here would silently fall back to unstyled text/backgrounds rather than erroring).

- [ ] **Step 3: Log findings**

For each discrepancy found, note: section, what's different, and whether it's a missed CSS class, a wrong Tailwind v4 token, an animation timing/easing difference, or an asset difference. Keep the list inline in your task report — no separate file needed unless the list is long enough that a future session would benefit from it (if so, add a short section to this plan doc under this task, not a new file).

- [ ] **Step 4: Fix each discrepancy**

Edit the relevant file(s) from Task 8 (or `packages/ui/src/theme.css` from Task 1 if the issue is a missing/broken shared utility class). Re-run Step 1–2 after each fix to confirm.

- [ ] **Step 5: Re-run the full verification and commit**

```bash
pnpm --filter @eureka-lab/landing lint
pnpm --filter @eureka-lab/landing build
```
Expected: clean. Then commit:
```bash
git add -A
git commit -m "fix(landing): reconcile visual differences against Lovable reference"
```
(Only if Step 4 made changes — if the comparison found nothing to fix, skip the commit and say so.)

---

## Self-Review Notes

- **Branch correction (2026-07-08):** This plan was written and validated against `feat/school-b2b-usage-analytics` (confirmed: `apps/web/src/components/game/{GameButton,Logo}.tsx` and `apps/web/src/app/globals.css` match the content embedded in Tasks 1–3 exactly, and the JPG/PNG assets referenced in Task 7 are present at `apps/web/public/assets/game/`). The execution worktree must branch from this branch's HEAD, **not** from `main` — `main` is a separate, effectively abandoned line (see the 2026-07-08 conversation record: PR #7's "Phase 16 fantasy UI" was merged to `main` and then reverted on the line that became this branch; `main` kept building on the reverted architecture independently and has no bearing on this work).
- **Spec coverage:** All decisions from `docs/superpowers/specs/2026-07-07-landing-app-scaffold-design.md` are covered (Next.js App Router + Tailwind v4, `NEXT_PUBLIC_APP_URL` cross-link, `vercel.json`, i18n scaffolding) plus the two decisions made after that spec was written (share via `packages/ui`; port `3012` after discovering `apps/api` already uses `3011`).
- **i18n scope correction:** The original spec assumed a `src/app/[locale]/` + `middleware.ts` structure. Investigation during planning found `apps/web` doesn't actually do URL-based locale routing anywhere yet — `getRequestConfig` hardcodes `'en'`. This plan matches that real, existing pattern instead of building a heavier structure nothing else in the repo uses.
- **Task 10 added (2026-07-08):** Per explicit user request — run the ported app and the Lovable reference side by side and reconcile any visual differences before moving on to i18n/test-coverage/commit-hygiene work.
- **Known follow-up from Task 8 review (2026-07-08, not blocking):** The `LOGIN_URL` CTAs in `Nav.tsx`/`Hero.tsx`/`Battle.tsx` were fixed from invalid `<a><button></button></a>` nesting to `<GameButton onClick={() => window.location.href = LOGIN_URL}>`, which resolves the HTML-validity/screen-reader bug but loses native link affordances (open-in-new-tab, right-click copy-link, no-JS fallback) and reports as `button` role instead of `link` role. The code reviewer explicitly signed off to proceed rather than block on this. A cleaner fix would give `@eureka-lab/ui`'s `GameButton` an `asChild`/`as="a"` option so these can be real anchors again — worth doing as a small fast-follow, not part of this plan's scope.
- **Task 10 findings (2026-07-08):** Ran `apps/landing` (localhost:3012) and the live Lovable reference (`ai-adventure-island-new`, Vite dev server, localhost:8084) side by side via Playwright. Hero section is visually identical between the two (background parallax, "EUREKA LAB" glow, gradient CTA buttons, spacing, Cinzel font rendering) — a byte-diff screenshot comparison found no discrepancy. Heroes/Academy/Battle sections all render correctly on the port with real imagery, glow effects, and the Academy KP progress bar. Console is clean except a harmless missing-favicon 404 (no favicon was scaffolded for the new app — cosmetic gap, not fixed here, out of scope). CTA click-through confirmed `Enter the Realm`/`Begin Your Quest` correctly attempt navigation to `http://localhost:3010/login` (verified via network request inspection; the request itself fails locally only because `apps/web`'s dev server wasn't running at the time, which is expected). The only difference from the reference is the deliberately-dropped `About` nav link (Task 8 adaptation #5) — no other reconciliation was needed, so no fix commit was made for this task.
- **`/about` nav link:** Dropped rather than left dangling — noted inline in Task 8.
