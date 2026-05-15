# Eureka Lab Redesign — Plan 3a of N: Adult-facing pages re-skin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin all eight adult-facing pages and the `(dashboard)/` route-group layout in the fantasy chrome introduced by Plan 1. After this plan, the entire app — learner *and* adult-facing — uses the reference's visual language end-to-end. No more half-shadcn, half-fantasy split.

**Architecture:** Replace `(dashboard)/layout.tsx`'s Navbar + Sidebar + ProtectedRoute + MobileRedirect chrome with a unified fantasy layout (`<Scene>` wrapper + `<Logo />` header + `<UserMenu />` chip + inline auth gate), mirroring `(learner)/layout.tsx`. Each adult page swaps its shadcn `Card`/`Button` chrome for `panel` + `<GameButton>` + `font-display` per the spec §6 recipe. Pure visual pass — no business-logic, data-model, or i18n changes. Nested feature components (`PricingCard`, `BadgeGrid`, `SubscriptionCard`, `ClassroomCard`, `StudentProgressTable`, `XpBar`, `StreakCounter`, `ActivityCalendar`, `LevelBadge`, `JoinCodeDisplay`, `CreateClassroomDialog`) are explicitly out of scope and stay on their current shadcn-light styling; they're tracked as a Plan 3c polish pass.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS v4 (config in `apps/web/src/app/globals.css`), Zustand auth-store, Firebase Auth, lucide-react icons. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-09-redesign-from-reference-design.md](../specs/2026-05-09-redesign-from-reference-design.md) — sections **5.1** (route map), **5.5** (auth flow — bounce anonymous to `/` not `/login`), **§6** (adult-page re-skin recipe), **§9.1** (checkout paths — keep at `/checkout/*`), **§10** (success criteria — single-Cinzel app-wide).

**Reference project:** `C:\Eureka-lab-app\Dev\ai-adventure-island` has no adult-page equivalent — the visual recipe is the `Dashboard.tsx` HUD pattern (Logo + character chip + sign-out) ported to non-character adult users.

**P3-XX tasks resolved by this plan:** P3-01, P3-02, P3-03, P3-04, P3-05, P3-06.

**Out of scope for Plan 3a (covered elsewhere):**
- P3-07 backend hybrid combat validation — Plan 3b.
- P3-08 / P3-09 / P3-10 i18n re-key, new strings, RTL Arabic font — Plan 3c.
- P3-11 E2E suite rewrite — Plan 3c.
- P3-12 retire `useMobileDetect` — Plan 3c. (Plan 3a deletes `MobileRedirect`, which is the last *page-level* consumer. If no consumer remains after A.3, `useMobileDetect` becomes orphaned and P3-12 is reduced to deleting the hook itself.)
- P3-13 PWA + Sentry verification — Plan 3c.
- P3-14 / P3-15 / P3-16 R5 follow-ups (server role derivation, OAuth age gate, COPPA pipeline) — Plan 3b.
- P3-17 / P3-18 backend KP-credit + persistent academy progress — Plan 3b.
- P3-19 `AiTutorChat` `chapterName` prop — Plan 3c polish.
- Nits N1 (dashboard hardcoded xp/LV) / N2 (campaign-card image dims) / N3 (character-store rollback) — Plan 1 carry-overs; land standalone before or after Plan 3a as you prefer.
- Deep feature-component re-skin (`PricingCard`, `BadgeGrid`, `XpBar`, …) — Plan 3c polish.
- `(dashboard)/learn/page.tsx` + `(dashboard)/learn/[moduleId]/page.tsx` re-skin — these pre-date the redesign and are not in spec §5.1's route map. They inherit the new fantasy layout (because they live under `(dashboard)/`) and will continue to function; their internal styling will look mismatched until Plan 3c. **Do not touch them in Plan 3a.**
- Renaming `(dashboard)/` → `(admin)/` per spec §5.1 nomenclature — pure cosmetic directory rename; the new `(dashboard)/` group serves only adult routes after this plan, but Phase 16-era code still imports against `'(dashboard)'`. Defer indefinitely.

---

## Pre-flight

This plan executes on the **existing** `redesign/v2-from-reference` branch (no new branch — Plan 3a is a continuation of Plan 2's PR #8). HEAD should be at `4197be5` (Plan 2 handover commit) or later, with the branch **46 commits ahead** of `main`.

- [ ] **Pre-flight Step 1: Confirm branch + working tree**

Run:
```powershell
git status -sb
git rev-parse --abbrev-ref HEAD
```

Expected: branch `redesign/v2-from-reference`, working tree shows only `.claude/settings.local.json` and `apps/web/tsconfig.tsbuildinfo` as modified (both leave-alone artifacts). No other untracked files except any local cache the user has on disk.

- [ ] **Pre-flight Step 2: Confirm commit count ahead of main**

Run: `git rev-list --count main..HEAD`

Expected: `46`.

- [ ] **Pre-flight Step 3: Dev servers can start**

In two terminals:
```powershell
pnpm --filter @eureka-lab/api dev
pnpm --filter @eureka-lab/web dev
```

Expected: API on `http://localhost:3011`, web on `http://localhost:3010`. Open the web URL — `/` renders the fantasy Welcome page from Plan 2. Kill both before continuing.

- [ ] **Pre-flight Step 4: Confirm a parent + teacher account exist for smoke**

Phase C.1 smoke needs at least one **parent** and one **teacher** account so we can view `/parent`, `/teacher`, `/teacher/[classroomId]`, `/settings`, `/pricing`, `/checkout/*`, `/achievements`. Welcome (`/`) now creates child accounts only (per ADR-006). To create non-child accounts, use the standalone `/signup` page which still allows `role: 'parent' | 'teacher'` (backend `SignupDto` was extended in Plan 2 G.1 to also accept `'child'`).

If accounts don't exist:
1. Navigate to `http://localhost:3010/signup`.
2. Create one parent (`parent@example.com`).
3. Sign out from `/dashboard`.
4. Repeat for teacher (`teacher@example.com`).

You will reuse these accounts for Phase C smoke.

- [ ] **Pre-flight Step 5: Confirm the reference fantasy chrome is in place**

Run:
```powershell
ls apps/web/src/components/game
```

Expected: `Scene.tsx`, `Logo.tsx`, `GameButton.tsx`, `KpBadge.tsx`, `AiTutorChat.tsx`, `NavLink.tsx`, `HpBar.tsx`. These are the building blocks for every task below. If missing, escalate — do not proceed.

---

## Phase A — Layout chrome swap

This phase replaces the `(dashboard)/` layout's old shadcn chrome (Navbar + Sidebar + ProtectedRoute + MobileRedirect) with a unified fantasy layout that every adult page automatically inherits. After Phase A, the adult pages still look "off" inside (because their content is still shadcn), but the *frame* is correct. Phase B then re-skins the content of each page.

### Task A.1: Create `<UserMenu />` component for adult pages

**Files:**
- Create: `apps/web/src/components/game/UserMenu.tsx`

The learner Dashboard has an inline user chip that depends on the character (class image, color, level). Adult users have no character — they need a simpler chip with display name, role label, and sign-out. Extract once, reuse across the adult layout.

- [ ] **Step 1: Create the file**

Write the following to `apps/web/src/components/game/UserMenu.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/** Lucide icon per role. Falls back to `ShieldCheck` for unknown roles. */
function RoleIcon({ role }: { role: string }) {
  if (role === 'teacher') return <Briefcase className="h-3.5 w-3.5" aria-hidden />;
  return <ShieldCheck className="h-3.5 w-3.5" aria-hidden />;
}

/**
 * Fantasy-styled user chip + sign-out for non-learner pages.
 * Shows display name, role label, and a sign-out button that returns the
 * user to `/`. Mirrors the learner Dashboard's HUD chip pattern but without
 * the character art (adult users don't have a character).
 *
 * Renders nothing if no user is loaded — the parent layout's auth gate
 * already prevents anonymous render, this is just defensive.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-3 panel px-4 py-2">
      <div className="leading-tight">
        <div className="font-display text-sm text-glow-primary">{user.displayName}</div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center gap-1.5">
          <RoleIcon role={user.role} />
          {user.role}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="ml-2 h-9 w-9 rounded-lg border border-border/60 hover:border-destructive hover:text-destructive flex items-center justify-center transition-all"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run:
```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: same error count as before (24 pre-existing test-file errors). No NEW errors from `UserMenu.tsx`.

- [ ] **Step 3: Commit**

```powershell
git add apps/web/src/components/game/UserMenu.tsx
git commit -m "feat(game): add UserMenu component for adult-page HUD"
```

---

### Task A.2: Rewrite `(dashboard)/layout.tsx`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (full replace, ~42 lines → ~60 lines)

Replace Navbar + Sidebar + ProtectedRoute + MobileRedirect with `<Scene>` + `<Logo />` + `<UserMenu />` + inline auth gate. The auth gate mirrors `(learner)/layout.tsx`: bounce anonymous users to `/` (per spec §5.5) — not to `/login` as the old `ProtectedRoute` did. The gamification-store `refreshProfile()` side-effect from the old layout is **preserved** (achievements page depends on it).

- [ ] **Step 1: Read the current layout for context**

Read [apps/web/src/app/(dashboard)/layout.tsx](../../../apps/web/src/app/(dashboard)/layout.tsx) to confirm the existing shape before replacing.

- [ ] **Step 2: Write the new layout**

Replace the entire file content with:

```tsx
'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/stores/gamification-store';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { UserMenu } from '@/components/game/UserMenu';
import { BadgeUnlockToast } from '@/components/features/gamification/BadgeUnlockToast';

/**
 * Layout for the adult-facing routes (parent, teacher, settings, pricing,
 * achievements, checkout). Replaces the legacy Navbar+Sidebar chrome with a
 * unified fantasy header (Logo + UserMenu) inside a Scene wrapper.
 *
 * Anonymous users bounce to `/` (welcome) — not `/login`, per spec §5.5.
 * Gamification profile hydrates on auth (achievements page depends on it).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const refreshProfile = useGamificationStore((s) => s.refreshProfile);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <Scene>
      <header className="flex items-center justify-between gap-4 flex-wrap px-4 py-6 lg:px-10 lg:py-8">
        <Logo />
        <UserMenu />
      </header>
      <main className="relative px-4 pb-12 lg:px-10">{children}</main>
      <BadgeUnlockToast />
    </Scene>
  );
}
```

- [ ] **Step 3: Typecheck**

Run:
```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: same error count as before. No NEW errors.

- [ ] **Step 4: Smoke (manual)**

Start `pnpm --filter @eureka-lab/web dev`, sign in as the parent account, visit `/parent`. Expected:
- Page is wrapped in dark fantasy Scene (vignette + scanlines + drifting embers).
- Top header has the Logo on the left and the UserMenu chip on the right (display name + role + sign-out icon).
- The OLD navbar + sidebar are GONE.
- The page content itself (parent dashboard) still uses shadcn styling — looks mismatched. **This is expected and gets fixed in Phase B.**
- Click sign-out → land on `/` (not `/login`).
- Anonymous visit to `/parent` → bounce to `/`.

Kill dev server before continuing.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/layout.tsx
git commit -m "feat(admin): re-skin (dashboard) layout in fantasy chrome (Scene + Logo + UserMenu)"
```

---

### Task A.3: Delete the now-unused chrome components

After A.2 lands, `Navbar`, `Sidebar`, `ProtectedRoute`, and `MobileRedirect` have **zero callers** in `apps/web/src` (Grep verified earlier — only their own files referenced them). Delete them and any companion test files. The `useUiStore.sidebarOpen` / `toggleSidebar` state still exists in `ui-store.ts` but becomes dead state — leave the store alone (other code may add it back; out of scope for Plan 3a).

- [ ] **Step 1: Verify zero callers before deleting**

Run, separately:
```powershell
# Should match only the files about to be deleted themselves
```

Use the Grep tool with:
- Pattern: `from.*\\b(Navbar|Sidebar|ProtectedRoute|MobileRedirect)\\b`
- Path: `apps/web/src`

Expected: zero matches in any *page* or *layout* file. Hits only inside `components/shared/Navbar.tsx`, `Sidebar.tsx`, `ProtectedRoute.tsx`, `MobileRedirect.tsx` (their own imports), or in their `.test.*` files. If anything else matches, STOP and audit before deleting.

- [ ] **Step 2: Find companion test files**

Use the Glob tool with pattern:
- `apps/web/src/components/shared/{Navbar,Sidebar,ProtectedRoute,MobileRedirect}*.{test,spec}.{ts,tsx}`

Note any hits — they need to be deleted too.

- [ ] **Step 3: Delete the four components and any test files**

Run:
```powershell
Remove-Item apps/web/src/components/shared/Navbar.tsx
Remove-Item apps/web/src/components/shared/Sidebar.tsx
Remove-Item apps/web/src/components/shared/ProtectedRoute.tsx
Remove-Item apps/web/src/components/shared/MobileRedirect.tsx
# Plus any test files found in Step 2
```

- [ ] **Step 4: Typecheck**

Run:
```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: same error count as before. If any NEW error mentions "Cannot find module" or "'Navbar' is not exported from", the Step 1 grep missed a caller — fix the import and re-run.

- [ ] **Step 5: Commit**

```powershell
git add -A apps/web/src/components/shared
git commit -m "chore(shared): remove legacy Navbar/Sidebar/ProtectedRoute/MobileRedirect (superseded by (dashboard) layout)"
```

---

## Phase B — Re-skin individual pages

Each Phase B task is **independent** — Phase B tasks can be parallelized across subagents if you use the subagent-driven flow. They share no files. Each task follows the spec §6 recipe applied to the *content* of the page (the Scene + header is already inherited from Phase A's layout):

1. **No `<Scene>` re-wrap** — the layout owns Scene. Each page just renders content.
2. **Containers** — replace `rounded-lg border border-border`, `bg-white dark:bg-gray-800`, `rounded-xl border border-border` with `panel` utility (which composes the dark-gradient card backdrop + glow border).
3. **Buttons** — `<Button variant="default">` → `<GameButton variant="primary">`; `<Button variant="destructive">` → `<GameButton variant="danger">`; `<Button variant="outline">` or `variant="ghost">` → `<GameButton variant="ghost">`. **Keep** shadcn `<Button>` for: (a) icon-only buttons (`size="icon"`), (b) tertiary controls inside dense forms or modal footers — the recipe explicitly preserves these.
4. **Typography** — h1/h2 get `font-display`; h1 *only* gets `text-glow-primary`. Body text stays Inter (the default `font-sans`).
5. **Colors** — replace `text-gray-900 dark:text-white` with `text-foreground`. Replace `text-gray-500 dark:text-gray-400` with `text-muted-foreground`. Replace error banner `bg-red-50 dark:bg-red-950 …` with a `panel` variant tinted destructive: `panel border-destructive/60 bg-destructive/10`.
6. **`useTranslations` calls stay verbatim** — Plan 3a does NOT touch i18n. Keep `t('title')` / `t('addChild')` / etc. exactly as written. If a string is hardcoded English (not behind `t()`), keep it that way and add a `// TODO(plan-3c-i18n)` comment above the JSX node.

The recipe step 4 says "keep shadcn `<Button>` for tertiary controls inside dense forms". Inside `(classroomId)/page.tsx` and `CreateClassroomDialog`, the dialog/table buttons are tertiary — those are inside out-of-scope nested components and don't need touching anyway.

---

### Task B.1: Re-skin `/parent`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/parent/page.tsx` (full replace, ~76 lines)

The parent dashboard lists children with XP/age/plan. Each child card is currently `rounded-xl border border-border p-4 space-y-3 bg-white dark:bg-gray-800`. Becomes `panel p-4 space-y-3`. The "Add child" Button becomes `<GameButton variant="primary">`. The empty-state card becomes a `panel`. `LevelBadge` is an out-of-scope nested component and stays as-is.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/parent/page.tsx](../../../apps/web/src/app/(dashboard)/parent/page.tsx) to confirm the existing shape (76 lines).

- [ ] **Step 2: Replace file contents**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@/components/game/GameButton';
import { LevelBadge } from '@/components/features/gamification/LevelBadge';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Parent dashboard — children list with gamification stats.
 * Re-skinned for the fantasy chrome (panel cards + GameButton + font-display).
 * Inner LevelBadge component keeps its current styling (Plan 3c polish).
 */
export default function ParentDashboardPage() {
  const t = useTranslations('Parent');
  const { user } = useAuth();

  const children = user?.children ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{t('dashboardTitle')}</h1>
        <GameButton variant="primary" size="sm">
          {t('addChild')}
        </GameButton>
      </div>

      {children.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-muted-foreground">
            {/* TODO(plan-3c-i18n): hoist empty-state copy into messages/{en,fr,ar}.json */}
            No children added yet. Click &ldquo;{t('addChild')}&rdquo; to create a child account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div key={child.uid} className="panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">{child.displayName}</h3>
                <LevelBadge xp={child.xp} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-display text-glow-primary">{child.xp}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">XP</p>
                </div>
                <div>
                  <p className="text-lg font-display">{child.age}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    {t('age')}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-display capitalize">{child.plan}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    Plan
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count as before.

- [ ] **Step 4: Manual smoke**

Sign in as parent, visit `/parent`. Expected: dark panel cards, Cinzel-styled h1 with cyan text-glow, Cinzel "Add child" GameButton with shimmer hover, dark fantasy backdrop from the layout's Scene. If you have no children, the empty-state panel renders.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/parent/page.tsx
git commit -m "feat(parent): re-skin /parent in fantasy chrome (panel + GameButton + font-display)"
```

---

### Task B.2: Re-skin `/teacher`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/teacher/page.tsx` (full replace, ~107 lines)

The teacher dashboard lists classrooms via `ClassroomCard` (a feature component, stays as-is). The page-level chrome — "Create classroom" button, error banner, empty-state — needs the re-skin. `useState` / `useEffect` / `classroomsApi` logic is untouched.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/teacher/page.tsx](../../../apps/web/src/app/(dashboard)/teacher/page.tsx) to confirm shape.

- [ ] **Step 2: Replace file contents**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { GameButton } from '@/components/game/GameButton';
import { ClassroomCard } from '@/components/features/teacher/ClassroomCard';
import { CreateClassroomDialog } from '@/components/features/teacher/CreateClassroomDialog';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomSummary } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Teacher dashboard — classrooms list + create.
 * Re-skinned for the fantasy chrome. ClassroomCard / CreateClassroomDialog
 * keep their current styling (Plan 3c polish).
 */
export default function TeacherDashboardPage() {
  const t = useTranslations('Teacher');
  const router = useRouter();

  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  /** Fetch all classrooms for the authenticated teacher. */
  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await classroomsApi.list();
      setClassrooms(response.classrooms);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load classrooms';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  /**
   * Handle new classroom creation.
   * @param name - Classroom name
   */
  const handleCreate = async (name: string) => {
    await classroomsApi.create(name);
    await fetchClassrooms();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">
          {t('dashboardTitle')}
        </h1>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('createClassroom')}
        </GameButton>
      </div>

      {error && (
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-muted-foreground">{t('noClassrooms')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onClick={() => router.push(`/teacher/${classroom.id}`)}
            />
          ))}
        </div>
      )}

      <CreateClassroomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as teacher, visit `/teacher`. Expected: dark fantasy chrome, Cinzel h1 with glow, "Create classroom" GameButton. With no classrooms → empty panel. With classrooms → grid of ClassroomCards (these keep their current shadcn styling — that's expected and slated for Plan 3c).

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/teacher/page.tsx
git commit -m "feat(teacher): re-skin /teacher in fantasy chrome (panel + GameButton + font-display)"
```

---

### Task B.3: Re-skin `/teacher/[classroomId]`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx` (full replace, ~240 lines)

The classroom-detail page is the most complex of Phase B: back button, join-code section, regenerate button, student count, student progress table, danger-zone delete. Per the recipe: re-skin chrome and primary CTAs; keep tertiary controls (the icon-only back button) as shadcn `<Button variant="ghost" size="icon">`. The `JoinCodeDisplay` and `StudentProgressTable` are nested components and stay as-is. The danger-zone section becomes a `panel border-destructive/60` block.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx](../../../apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameButton } from '@/components/game/GameButton';
import { JoinCodeDisplay } from '@/components/features/teacher/JoinCodeDisplay';
import { StudentProgressTable } from '@/components/features/teacher/StudentProgressTable';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomDetailView } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Classroom detail page — join code, student progress, danger-zone delete.
 * Re-skinned for the fantasy chrome. Nested JoinCodeDisplay and
 * StudentProgressTable keep their current styling (Plan 3c polish).
 */
export default function ClassroomDetailPage() {
  const t = useTranslations('Teacher');
  const router = useRouter();
  const params = useParams<{ classroomId: string }>();
  const classroomId = params.classroomId;

  const [detail, setDetail] = useState<ClassroomDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Fetch classroom detail with student progress. */
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classroomsApi.getDetail(classroomId);
      setDetail(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load classroom';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /** Regenerate the classroom join code. */
  const handleRegenerateCode = async () => {
    if (!window.confirm(t('regenerateCodeConfirm'))) return;

    try {
      setRegenerating(true);
      const { joinCode } = await classroomsApi.regenerateCode(classroomId);
      setDetail((prev) =>
        prev ? { ...prev, classroom: { ...prev.classroom, joinCode } } : prev,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to regenerate code';
      setError(message);
    } finally {
      setRegenerating(false);
    }
  };

  /**
   * Remove a student from the classroom.
   * @param studentId - UID of the student to remove
   */
  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm(t('removeStudentConfirm'))) return;

    try {
      await classroomsApi.removeStudent(classroomId, studentId);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              students: prev.students.filter((s) => s.uid !== studentId),
              classroom: {
                ...prev.classroom,
                studentIds: prev.classroom.studentIds.filter((id) => id !== studentId),
              },
            }
          : prev,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove student';
      setError(message);
    }
  };

  /** Delete the entire classroom and navigate back. */
  const handleDeleteClassroom = async () => {
    if (!window.confirm(t('deleteClassroomConfirm'))) return;

    try {
      setDeleting(true);
      await classroomsApi.deleteClassroom(classroomId);
      router.push('/teacher');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete classroom';
      setError(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teacher')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToDashboard')}
        </Button>
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with back button — keep shadcn icon button (tertiary per recipe) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/teacher')}
          aria-label={t('backToDashboard')}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="font-display text-3xl text-glow-primary">
          {detail.classroom.name}
        </h1>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Join code section */}
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <div className="flex-1">
          <p className="mb-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {t('joinCode')}
          </p>
          <JoinCodeDisplay code={detail.classroom.joinCode} />
        </div>
        <GameButton
          variant="ghost"
          size="sm"
          onClick={handleRegenerateCode}
          disabled={regenerating}
        >
          <RefreshCw
            className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {t('regenerateCode')}
        </GameButton>
      </div>

      {/* Student count */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {t('studentCount')}: {detail.students.length}/{detail.classroom.maxStudents}
        </h2>
      </div>

      {/* Student progress table — nested component, keeps current styling */}
      <StudentProgressTable
        students={detail.students}
        onRemoveStudent={handleRemoveStudent}
      />

      {/* Danger zone */}
      <div className="panel border-destructive/60 p-4">
        <h3 className="mb-3 text-[10px] tracking-[0.3em] uppercase text-destructive">
          {t('dangerZone')}
        </h3>
        <GameButton
          variant="danger"
          size="sm"
          onClick={handleDeleteClassroom}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('deleteClassroom')}
        </GameButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as teacher, navigate from `/teacher` into any classroom (or create one first if empty). Expected:
- Header with shadcn icon back button + Cinzel h1 with the classroom name.
- Join-code panel with regenerate GameButton.
- Student count h2 in Cinzel.
- Student-progress table (nested, unchanged styling).
- Danger-zone panel with crimson-bordered delete GameButton.

Click regenerate — confirm dialog appears, code rotates, no errors. Don't actually delete the classroom unless you want to.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/teacher/[classroomId]/page.tsx
git commit -m "feat(teacher): re-skin /teacher/[classroomId] in fantasy chrome"
```

---

### Task B.4: Re-skin `/settings`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx` (full replace, ~55 lines)

The settings page is the simplest: title + SubscriptionCard (parents only). Just apply font-display + text-glow to h1 and ditch the dark-mode-only color overrides.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/settings/page.tsx](../../../apps/web/src/app/(dashboard)/settings/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
/**
 * Settings page — user account settings and subscription management.
 * Re-skinned for fantasy chrome. Nested SubscriptionCard keeps its current
 * styling (Plan 3c polish).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { SubscriptionCard } from '@/components/features/payments/SubscriptionCard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Settings page component.
 * Displays subscription management for parents.
 *
 * @returns Settings page
 */
export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const isParent = user?.role === 'parent';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="font-display text-3xl text-glow-primary">{t('title')}</h1>

      {isParent && (
        <SubscriptionCard
          plan={user?.plan ?? 'free'}
          subscription={user?.subscription ?? null}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as parent, visit `/settings`. Expected: Cinzel h1 with cyan glow, then SubscriptionCard below (nested component, retains shadcn look). Sign in as teacher and visit /settings — expected: just the h1, no SubscriptionCard (isParent is false).

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(settings): re-skin /settings in fantasy chrome (font-display + glow h1)"
```

---

### Task B.5: Re-skin `/pricing`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pricing/page.tsx` (full replace, ~106 lines)

Pricing has a centered hero (title + subtitle), an error banner if checkout fails, and a 3-column PricingCard grid. The PricingCard component itself stays as-is (Plan 3c polish). The Stripe checkout redirect (`window.location.href = url`) is untouched.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/pricing/page.tsx](../../../apps/web/src/app/(dashboard)/pricing/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
/**
 * Pricing page — available subscription plans.
 * Re-skinned for fantasy chrome. PricingCard component unchanged (Plan 3c).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PRICING_PLANS } from '@eureka-lab/shared-types';
import { useAuthStore } from '@/stores/auth-store';
import { paymentsApi } from '@/lib/api-client';
import { PricingCard } from '@/components/features/payments/PricingCard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Pricing page component.
 * Displays 3 plan cards. Upgrade buttons redirect to Stripe Checkout.
 *
 * @returns Pricing page
 */
export default function PricingPage() {
  const t = useTranslations('Pricing');
  const { user, isLoading: authLoading } = useAuthStore();
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle plan upgrade — creates Stripe Checkout session and redirects.
   * @param plan - Target plan ('explorer' or 'creator')
   */
  const handleUpgrade = async (plan: 'explorer' | 'creator') => {
    setUpgradeLoading(plan);
    setError(null);
    try {
      const { url } = await paymentsApi.createCheckout(plan);
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      setUpgradeLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const currentPlan = user?.plan ?? 'free';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl text-glow-primary">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            isLoading={upgradeLoading === plan.id}
          />
        ))}
      </div>

      <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
        {t('footerNote')}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as parent (need parent role for upgrade flow), visit `/pricing`. Expected: Cinzel centered h1, muted subtitle, 3-column grid of PricingCards (still shadcn-styled — that's expected). Don't click upgrade unless you actually want a Stripe session.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/pricing/page.tsx
git commit -m "feat(pricing): re-skin /pricing in fantasy chrome (font-display + glow h1)"
```

---

### Task B.6: Re-skin `/achievements`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/achievements/page.tsx` (full replace, ~96 lines)

Achievements has a header (title + subtitle), XP + Streak row, ActivityCalendar, and BadgeGrid. All nested components (XpBar, StreakCounter, ActivityCalendar, BadgeGrid) keep their current styling. Just re-skin the page-level chrome.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/achievements/page.tsx](../../../apps/web/src/app/(dashboard)/achievements/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
/**
 * Achievements page — full gamification dashboard.
 * Re-skinned for fantasy chrome. Nested gamification components
 * (XpBar, StreakCounter, ActivityCalendar, BadgeGrid) keep their
 * current styling (Plan 3c polish).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGamificationStore } from '@/stores/gamification-store';
import { XpBar } from '@/components/features/gamification/XpBar';
import { StreakCounter } from '@/components/features/gamification/StreakCounter';
import { BadgeGrid } from '@/components/features/gamification/BadgeGrid';
import { ActivityCalendar } from '@/components/features/gamification/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Achievements page component.
 * Fetches and displays full gamification profile.
 *
 * @returns Achievements page
 */
export default function AchievementsPage() {
  const t = useTranslations('Gamification');
  const {
    xp,
    level,
    streak,
    badges,
    recentActivity,
    isLoading,
    refreshProfile,
  } = useGamificationStore();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (isLoading && !level) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-glow-primary">
          {t('achievementsTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('achievementsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <XpBar xp={xp} />
        {streak && (
          <StreakCounter current={streak.current} longest={streak.longest} expanded />
        )}
      </div>

      {recentActivity.length > 0 && <ActivityCalendar activities={recentActivity} />}

      <div>
        <h2 className="font-display text-xl mb-4">{t('badges')}</h2>
        <BadgeGrid earnedBadges={badges} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as any user (parent/teacher works — achievements is per-user), visit `/achievements`. Expected: Cinzel h1 with glow, muted subtitle, then XP/Streak/Calendar/Badges below (each nested component still shadcn-styled).

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/achievements/page.tsx
git commit -m "feat(achievements): re-skin /achievements in fantasy chrome (font-display + glow h1+h2)"
```

---

### Task B.7: Re-skin `/checkout/success`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/checkout/success/page.tsx` (full replace, ~63 lines)

The success page has a centered green-circled checkmark icon, h1, message, and CTA button that links to `/learn`. The hardcoded purple-indigo gradient button becomes a `<GameButton variant="primary">`. The CTA target `/learn` is the existing pre-redesign learn page (not in scope to change destination).

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/checkout/success/page.tsx](../../../apps/web/src/app/(dashboard)/checkout/success/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
/**
 * Checkout success page — shown after a successful Stripe payment.
 * Re-skinned for fantasy chrome.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GameButton } from '@/components/game/GameButton';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api-client';

/**
 * Checkout success page component.
 * Displays success message and refetches user profile.
 *
 * @returns Checkout success page
 */
export default function CheckoutSuccessPage() {
  const t = useTranslations('Checkout');
  const { setUser } = useAuthStore();

  /* Refetch user profile to get updated plan and subscription data */
  useEffect(() => {
    const refresh = async () => {
      try {
        const profile = await authApi.getMe();
        setUser(profile);
      } catch {
        /* Silently fail — user can still navigate */
      }
    };
    refresh();
  }, [setUser]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel text-center max-w-md p-8 space-y-6 animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 border border-success/40">
          <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl text-glow-primary">{t('successTitle')}</h1>
        <p className="text-muted-foreground">{t('successMessage')}</p>
        <Link href="/learn">
          <GameButton variant="primary">{t('successCta')}</GameButton>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Sign in as parent, navigate directly to `http://localhost:3010/checkout/success` (no real Stripe session needed). Expected: panel card with green check, Cinzel h1 glow, muted message, primary GameButton linking to /learn.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/checkout/success/page.tsx
git commit -m "feat(checkout): re-skin /checkout/success in fantasy chrome"
```

---

### Task B.8: Re-skin `/checkout/cancel`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/checkout/cancel/page.tsx` (full replace, ~45 lines)

Twin of B.7 — cancel page with an X icon and a back-to-pricing button. Replace the shadcn outline button with a `<GameButton variant="ghost">`.

- [ ] **Step 1: Read the current page**

Read [apps/web/src/app/(dashboard)/checkout/cancel/page.tsx](../../../apps/web/src/app/(dashboard)/checkout/cancel/page.tsx).

- [ ] **Step 2: Replace file contents**

```tsx
/**
 * Checkout cancel page — shown when user cancels Stripe Checkout.
 * Re-skinned for fantasy chrome.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { GameButton } from '@/components/game/GameButton';

/**
 * Checkout cancel page component.
 * Displays cancellation message with link back to pricing.
 *
 * @returns Checkout cancel page
 */
export default function CheckoutCancelPage() {
  const t = useTranslations('Checkout');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel text-center max-w-md p-8 space-y-6 animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 border border-border/60">
          <XCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl text-glow-primary">{t('cancelTitle')}</h1>
        <p className="text-muted-foreground">{t('cancelMessage')}</p>
        <Link href="/pricing">
          <GameButton variant="ghost">{t('cancelCta')}</GameButton>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @eureka-lab/web exec tsc --noEmit`. Expected: same error count.

- [ ] **Step 4: Manual smoke**

Visit `http://localhost:3010/checkout/cancel`. Expected: panel card with muted X icon, Cinzel h1 glow, ghost GameButton linking back to /pricing.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/src/app/(dashboard)/checkout/cancel/page.tsx
git commit -m "feat(checkout): re-skin /checkout/cancel in fantasy chrome"
```

---

## Phase C — Smoke + acceptance

### Task C.1: End-to-end manual smoke

Run both dev servers (`pnpm --filter @eureka-lab/api dev`, `pnpm --filter @eureka-lab/web dev`). Sign in as parent and click through every adult route. Then sign out, sign in as teacher, repeat.

- [ ] **Step 1: Parent walk-through**

Sign in as parent (`parent@example.com` from Pre-flight Step 4). Visit each:

| Route | Expected |
|---|---|
| `/parent` | Cinzel h1 with glow, dark panel for each child card, GameButton "Add child" |
| `/settings` | Cinzel h1 + SubscriptionCard (nested, shadcn-styled OK) |
| `/pricing` | Centered Cinzel h1, muted subtitle, 3 PricingCards (nested, shadcn OK) |
| `/achievements` | Cinzel h1+h2 with glow, XP/Streak/Calendar/Badges nested unchanged |
| `/checkout/success` | Panel card with green check, Cinzel h1, primary GameButton |
| `/checkout/cancel` | Panel card with muted X, Cinzel h1, ghost GameButton |

Each route should:
1. Show the Logo on top-left and UserMenu chip on top-right.
2. Have dark fantasy backdrop (vignette + scanlines + drifting embers) from the shared Scene.
3. Show **0 console errors** in browser DevTools (pre-existing favicon 404 + PWA warnings only).

Click sign-out from the UserMenu → land on `/` Welcome page.

- [ ] **Step 2: Teacher walk-through**

Sign in as teacher (`teacher@example.com`). Visit:

| Route | Expected |
|---|---|
| `/teacher` | Cinzel h1 with glow, GameButton "Create classroom" |
| `/teacher` (create one) | Click "Create classroom", enter "Smoke Class", submit |
| `/teacher/[classroomId]` | Cinzel h1 with classroom name, join-code panel, regenerate GameButton, danger-zone panel with danger GameButton |
| `/settings` | Cinzel h1, NO SubscriptionCard (teachers aren't parents) |
| `/achievements` | Same as parent |

Click sign-out → `/`.

- [ ] **Step 3: Anonymous redirect**

Open a private/incognito window. Visit `/parent`. Expected: bounced to `/` Welcome (not `/login`). Same for `/teacher`, `/settings`, etc.

- [ ] **Step 4: Verify `/learn` still works (regression check)**

`(dashboard)/learn/page.tsx` and `(dashboard)/learn/[moduleId]/page.tsx` are out of scope but inherit the new layout. Visit `/learn` as the parent. Expected: it renders (in its old internal styling — that's acknowledged), inside the new fantasy chrome. No console errors. If `/learn` breaks, file as a Plan 3c follow-up; do not fix in Plan 3a unless it's a trivial regression.

- [ ] **Step 5: Note any visual mismatches**

Capture (in scratch notes, not commits) any glaring mismatches between the new chrome and nested components (PricingCard, BadgeGrid, etc.). These are Plan 3c polish items, not Plan 3a regressions. Acceptable so long as the *page* re-skin matches the spec §6 recipe.

---

### Task C.2: Final typecheck across the monorepo

- [ ] **Step 1: Full tsc on web**

```powershell
pnpm --filter @eureka-lab/web exec tsc --noEmit
```

Expected: same 24 pre-existing test-file errors (in `CelebrationOverlay.test.tsx`, `useMobileDetect.test.ts`, `usePullToRefresh.test.ts`, `usePushNotifications.test.ts`). Zero new errors.

**Note:** `useMobileDetect.test.ts` may now fail at *load* time if `useMobileDetect` itself is still in place but its only call site (`MobileRedirect`) is gone. If it does, the test is testing dead code — let Plan 3c (P3-12) clean it up.

- [ ] **Step 2: Full tsc on api**

```powershell
pnpm --filter @eureka-lab/api exec tsc --noEmit
```

Expected: 0 errors. No backend changes in Plan 3a so this is a sanity check.

- [ ] **Step 3: Lint**

```powershell
pnpm --filter @eureka-lab/web lint
```

Expected: any pre-existing lint warnings unchanged. No new warnings from the re-skinned files. If new warnings appear, fix them inline before continuing.

---

### Task C.3: Update task board

**Files:**
- Modify: `planning/redesign-task-board.md` (mark P3-01 through P3-06 DONE, add Plan 3a section)

- [ ] **Step 1: Read current task board**

Read [planning/redesign-task-board.md](../../../planning/redesign-task-board.md). Locate the Plan 3+ section (around line 165) and the at-a-glance progress table (around line 14).

- [ ] **Step 2: Update at-a-glance progress table**

Add a new row for Plan 3a between Plan 2 and "Plan 3+":

```markdown
| 3a | Adult-facing pages re-skin (parent / teacher / settings / pricing / achievements / checkout) | **DONE** | [plan-3a](../docs/superpowers/plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md) |
```

Change the "Plan 3+" row description to "Backend persistence + R5 follow-ups + i18n + E2E + polish" since 3a removed the adult-reskin scope from the umbrella.

- [ ] **Step 3: Add Plan 3a section**

Insert a new section between Plan 2 and Plan 3+ at the appropriate place in the document:

```markdown
## Plan 3a — Adult-facing pages re-skin (DONE)

Plan: [plan-3a](../docs/superpowers/plans/2026-05-15-redesign-plan-3a-adult-pages-reskin.md). Resolves P3-01..06. No backend changes. Nested feature components (PricingCard, BadgeGrid, SubscriptionCard, ClassroomCard, etc.) explicitly deferred to Plan 3c.

### Phase A — Layout chrome swap

| ID | Task | Status | Commit |
|---|---|---|---|
| A.1 | `<UserMenu />` component for adult HUD | DONE | TBD |
| A.2 | Rewrite `(dashboard)/layout.tsx` in fantasy chrome | DONE | TBD |
| A.3 | Delete legacy Navbar/Sidebar/ProtectedRoute/MobileRedirect | DONE | TBD |

### Phase B — Page re-skins (one task per route)

| ID | Route | Status | Commit |
|---|---|---|---|
| B.1 | `/parent` | DONE | TBD |
| B.2 | `/teacher` | DONE | TBD |
| B.3 | `/teacher/[classroomId]` | DONE | TBD |
| B.4 | `/settings` | DONE | TBD |
| B.5 | `/pricing` | DONE | TBD |
| B.6 | `/achievements` | DONE | TBD |
| B.7 | `/checkout/success` | DONE | TBD |
| B.8 | `/checkout/cancel` | DONE | TBD |

### Phase C — Smoke + acceptance

| ID | Task | Status |
|---|---|---|
| C.1 | End-to-end smoke (parent + teacher walk-through, anonymous redirect, /learn regression) | DONE |
| C.2 | Full tsc clean (web + api) + lint | DONE |
| C.3 | Task-board update (this section) | DONE |

### Plan 3a follow-ups for Plan 3c polish

| ID | Item | Notes |
|---|---|---|
| P3a-N1 | Inner feature components still on shadcn-light (PricingCard, BadgeGrid, XpBar, StreakCounter, ActivityCalendar, LevelBadge, JoinCodeDisplay, StudentProgressTable, SubscriptionCard, ClassroomCard, CreateClassroomDialog) | Visual polish only — they function correctly inside the new fantasy chrome |
| P3a-N2 | Hardcoded English strings introduced by Plan 3a (e.g. "No children added yet..." empty state) marked with `TODO(plan-3c-i18n)` | Plan 3c i18n re-key sweep picks these up |
| P3a-N3 | `(dashboard)/learn/*` still on pre-redesign styling | Either re-skin in Plan 3c, redirect to `/dashboard`, or split into separate plan |
| P3a-N4 | `ui-store` still exports `sidebarOpen` / `toggleSidebar` state (dead after Phase A.3) | Can be pruned in Plan 3c |
```

Update each "Commit TBD" row with the actual SHA when committing. (Tip: do this in a single sweep after Phase B finishes — grep `git log --oneline main..HEAD | grep -E '(parent|teacher|settings|pricing|achievements|checkout|admin|UserMenu|MobileRedirect|Navbar|Sidebar)'` to pull all SHAs at once.)

- [ ] **Step 4: Update P3 task list to reflect 3a being done**

In the existing P3 task list (around line 168 of the task board), mark P3-01 through P3-06 as DONE and reference Plan 3a:

```markdown
| P3-01 | Re-skin `/parent` | DONE | Plan 3a B.1 |
| P3-02 | Re-skin `/teacher` + `/teacher/[classroomId]` | DONE | Plan 3a B.2 + B.3 |
| P3-03 | Re-skin `/settings` | DONE | Plan 3a B.4 |
| P3-04 | Re-skin `/pricing` | DONE | Plan 3a B.5 |
| P3-05 | Re-skin `/achievements` | DONE | Plan 3a B.6 |
| P3-06 | Re-skin `/checkout/{success,cancel}` | DONE | Plan 3a B.7 + B.8 |
```

- [ ] **Step 5: Commit task-board update**

```powershell
git add planning/redesign-task-board.md
git commit -m "docs(planning): mark Plan 3a tasks DONE; carry P3a-N1..N4 follow-ups to Plan 3c"
```

---

### Task C.4: Final commit count + branch state

- [ ] **Step 1: Verify the new commit count**

Run: `git rev-list --count main..HEAD`

Expected: `58` (46 from Plan 2 close + 12 from Plan 3a: A.1, A.2, A.3, B.1–B.8, C.3 = 12).

- [ ] **Step 2: Status sanity check**

Run: `git status -sb`

Expected: clean working tree (modulo `.claude/settings.local.json` and `apps/web/tsconfig.tsbuildinfo`). Branch is **ahead 12** of `origin/redesign/v2-from-reference` (Plan 2's gitignore + handover commits were pushed; Plan 3a's are not yet).

- [ ] **Step 3: DO NOT push automatically**

Per user preference: every push is individually approved. Surface the branch state to the user with the diff summary (`git log --oneline main..HEAD`) and ask whether to:
1. Push to `origin/redesign/v2-from-reference` (extending PR #8).
2. Mark PR #8 ready for review.
3. Hold off — start Plan 3b first.

---

## Acceptance checklist for Plan 3a

- [ ] All 12 commits land on `redesign/v2-from-reference` (A.1, A.2, A.3, B.1–B.8, C.3).
- [ ] `pnpm exec tsc --noEmit` clean across the monorepo (24 pre-existing test-file errors only; api: 0 errors).
- [ ] All 8 adult routes (`/parent`, `/teacher`, `/teacher/[classroomId]`, `/settings`, `/pricing`, `/achievements`, `/checkout/success`, `/checkout/cancel`) render in the fantasy chrome with:
  - `<Scene>` backdrop inherited from the `(dashboard)/layout`.
  - `<Logo />` + `<UserMenu />` top header.
  - h1 in `font-display` with `text-glow-primary`.
  - Primary CTAs use `<GameButton>` (variant per recipe).
  - Card containers use the `panel` utility.
  - Tertiary icon-buttons keep shadcn `<Button>`.
- [ ] Anonymous visit to any adult route bounces to `/` (welcome), not `/login`.
- [ ] Sign-out from any adult page returns to `/`.
- [ ] Old `Navbar`, `Sidebar`, `ProtectedRoute`, `MobileRedirect` files are deleted; zero callers remain.
- [ ] `(dashboard)/learn/*` still functions (it inherits the new chrome; internal styling unchanged — that's a known Plan 3c follow-up).
- [ ] Nested feature components keep their current styling (acknowledged in P3a-N1).
- [ ] Task board (`planning/redesign-task-board.md`) updated with Plan 3a section + P3-01..06 marked DONE.
- [ ] 4 Plan-3a follow-up items (P3a-N1..N4) added to the task board under Plan 3c polish.

---

## Hand-off to Plan 3b / 3c

Plan 3a closes the **visual** half of the redesign. The remaining Plan 3+ scope splits naturally:

**Plan 3b (next, biggest):** Backend persistence + R5 follow-ups. Includes P3-07 (hybrid combat validation), P3-14 (server-side `role` derivation from `birthYear`), P3-15 (Google OAuth age gate), P3-16 (COPPA confirmation pipeline — ~1 sprint alone), P3-17 (KP-credit endpoints), P3-18 (persistent academy progress). All backend-heavy; ships behind PR #8 or a follow-up branch off PR #8.

**Plan 3c (polish):** i18n re-key (P3-08), new locale strings (P3-09), RTL Arabic font (P3-10), E2E suite rewrite (P3-11), retire `useMobileDetect` (P3-12), PWA + Sentry verification (P3-13), `AiTutorChat.chapterName` prop (P3-19), feature-component re-skin (P3a-N1), `(dashboard)/learn/*` decision (P3a-N3), `ui-store.sidebarOpen` prune (P3a-N4), TODO i18n markers sweep (P3a-N2). Plus carry-over nits N1 (dashboard xp/LV), N2 (campaign-card dims), N3 (character-store rollback).

The user has not committed to ordering. After Plan 3a lands, surface the choice: 3b next (biggest blocker, COPPA), 3c next (lots of small wins), or interleave.

---

*Plan authored 2026-05-15 via `superpowers:writing-plans`. Mirrors the structure of Plan 2 (Phase A state/chrome → Phase B page work → Phase C smoke/acceptance). Targets the `redesign/v2-from-reference` branch on PR #8.*
