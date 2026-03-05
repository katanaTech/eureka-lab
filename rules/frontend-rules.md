# Frontend Development Rules — Eureka-lab Platform

> **FE Agent reads this at the start of every session. These rules are enforced in CI.**

---

## 1. File & Folder Conventions

```
apps/web/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Route group: unauthenticated pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/            # Route group: authenticated pages
│   │   ├── learn/page.tsx
│   │   ├── learn/[moduleId]/page.tsx
│   │   └── parent/page.tsx
│   ├── layout.tsx              # Root layout (providers, fonts)
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui base components (DO NOT EDIT)
│   ├── shared/                 # Reusable cross-feature components
│   │   ├── PromptEditor/
│   │   │   ├── PromptEditor.tsx
│   │   │   ├── PromptEditor.test.tsx
│   │   │   └── index.ts
│   └── features/               # Feature-specific components
│       ├── auth/
│       ├── learn/
│       └── parent/
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities, API client, helpers
│   ├── api-client.ts           # Typed API client (generated from OpenAPI spec)
│   ├── auth.ts                 # Auth helpers
│   └── utils.ts
├── stores/                     # Zustand stores
├── messages/                   # i18n locale files
│   ├── en.json
│   ├── fr.json
│   └── ar.json
└── types/                      # Frontend-only types (not in shared-types)
```

**Naming conventions:**
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Pages: `page.tsx` (Next.js convention)
- Test files: `ComponentName.test.tsx` co-located with component

---

## 2. Component Rules

### Every component must:
```typescript
// ✅ CORRECT — every component structure
import { type FC } from 'react';

interface PromptEditorProps {
  moduleId: string;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Split-pane prompt editor for Level 1 activities.
 * Left pane: user prompt input. Right pane: AI response.
 */
export const PromptEditor: FC<PromptEditorProps> = ({
  moduleId,
  onSubmit,
  isLoading = false,
  className,
}) => {
  // ...
};
```

### Never:
```typescript
// ❌ WRONG — no prop types
export default function PromptEditor(props) { ... }

// ❌ WRONG — any type
const handleResponse = (data: any) => { ... }

// ❌ WRONG — inline styles (use Tailwind)
<div style={{ color: 'red' }}>

// ❌ WRONG — hardcoded text (use i18n)
<button>Submit</button>

// ❌ WRONG — direct API calls in components (use hooks)
const res = await fetch('/api/...')
```

---

## 3. API Calls

**All API calls go through the typed API client:**

```typescript
// lib/api-client.ts — the ONLY place that calls fetch
import { createApiClient } from '@eureka-lab/shared-types';

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  getToken: async () => {
    const user = auth.currentUser;
    return user ? await user.getIdToken() : null;
  },
});

// In hooks — correct usage:
const { data, isLoading } = useQuery({
  queryKey: ['modules', level],
  queryFn: () => apiClient.modules.list({ level }),
});
```

**Never:**
```typescript
// ❌ WRONG — raw fetch in component
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modules`);

// ❌ WRONG — axios in component  
const res = await axios.get('/api/modules');

// ❌ WORST — calling Anthropic API from frontend
const res = await fetch('https://api.anthropic.com/v1/messages', ...);
```

---

## 4. State Management

```typescript
// Zustand store — one file per domain
// stores/auth-store.ts
import { create } from 'zustand';
import type { UserProfile } from '@eureka-lab/shared-types';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}));
```

**Rule:** Zustand stores hold **client-side** state only (auth status, UI preferences, modal state).
Server data (modules, progress, profile) lives in **TanStack Query** cache only.

---

## 5. Internationalisation (i18n)

Every string visible to the user MUST be in the locale files. No exceptions.

```typescript
// ✅ CORRECT
import { useTranslations } from 'next-intl';

export const SubmitButton: FC = () => {
  const t = useTranslations('Learn');
  return <button>{t('submitPrompt')}</button>;
};

// messages/en.json
{ "Learn": { "submitPrompt": "Submit Prompt" } }

// messages/fr.json  
{ "Learn": { "submitPrompt": "Soumettre" } }

// messages/ar.json
{ "Learn": { "submitPrompt": "إرسال" } }
```

**RTL Rule:** All layout components must be tested with `dir="rtl"`. Use Tailwind RTL variants:
```tsx
<div className="ml-4 rtl:ml-0 rtl:mr-4">  // mirrors margins for RTL
```

---

## 6. Styling Rules

```tsx
// ✅ Use Tailwind + shadcn/ui variants
import { Button } from '@/components/ui/button';
<Button variant="default" size="lg">Click me</Button>

// ✅ Use cn() helper for conditional classes
import { cn } from '@/lib/utils';
<div className={cn('base-class', isActive && 'active-class', className)}>

// ✅ Design tokens via CSS variables (defined in globals.css)
// Use semantic color names, not hex values in components
<div className="bg-background text-foreground border-border">
```

**Design token conventions:**
- `background` / `foreground` — page background and primary text
- `primary` / `primary-foreground` — brand color for CTAs
- `muted` / `muted-foreground` — secondary text, placeholders
- `destructive` — errors and danger states
- `ring` — focus ring color

---

## 7. Accessibility Rules

Every interactive element must:
1. Be keyboard navigable (Tab focus, Enter/Space activation)
2. Have an accessible label (`aria-label`, `aria-labelledby`, or visible text)
3. Have sufficient color contrast (WCAG AA: 4.5:1 for normal text)
4. Not rely on color alone to convey information
5. Have visible focus indicators (shadcn/ui default ring is acceptable)

```tsx
// ✅ CORRECT
<button
  aria-label={t('closeModal')}
  onClick={onClose}
  className="focus-visible:ring-2 focus-visible:ring-ring"
>
  <X size={16} aria-hidden="true" />
</button>

// ❌ WRONG — icon button with no label
<button onClick={onClose}><X /></button>
```

---

## 8. Performance Rules

- Images: Always use `next/image` with explicit `width` and `height`
- Fonts: Always use `next/font` — never `@import` in CSS
- Code splitting: Dynamic imports for Monaco Editor and heavy components
- No third-party scripts that load synchronously in `<head>`

```tsx
// ✅ Heavy component lazy loading
const MonacoEditor = dynamic(() => import('@/components/features/learn/CodeEditor'), {
  loading: () => <CodeEditorSkeleton />,
  ssr: false,
});
```

---

## 9. Testing Requirements

Every component file must have a co-located test file.

**Minimum test coverage per component:**
```typescript
// ComponentName.test.tsx
describe('PromptEditor', () => {
  it('renders without crashing', ...)
  it('calls onSubmit with trimmed prompt value', ...)
  it('disables submit button when isLoading=true', ...)
  it('shows character count', ...)
  it('is keyboard navigable', ...)  // accessibility
});
```

E2E tests (Playwright) are required for:
- All authentication flows
- All payment flows
- All parent consent flows
- Level 1 complete-module flow

---

## 10. Child Safety UI Rules

These are non-negotiable UX rules for any interface used by children:

1. No external links that open without parent awareness
2. No social features that allow direct child-to-child messaging
3. All AI output areas must show a subtle "AI-generated" label
4. Error messages must be child-friendly (no technical jargon)
5. Loading states must be clear (children get frustrated by ambiguous waits)
6. Progress must always be visible — children disengage if they can't see progress

---

*Version: 1.0 | Maintained by: ARCH agent | Last updated: Sprint 1*
