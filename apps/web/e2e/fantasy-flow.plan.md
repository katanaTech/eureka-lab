# Playwright Test Plan — Fantasy Mode E2E (P16-QA-001 / QA-002)

> **Task:** P16-QA-PLAN
> **Author:** QA agent
> **Date:** 2026-04-29
> **Covers:** P16-QA-001 (fantasy-mode E2E) and P16-QA-002 (feature-flag matrix)

---

## 1. Objectives

1. **QA-001** — Validate the full fantasy-mode gameplay loop end-to-end:
   welcome → character create → dashboard → campaign → prepare → mission prep →
   battle (win + lose) → shop → equip → battle reuse.
2. **QA-002** — Run the same flow with `featureFlags.fantasyUi` toggled `true`
   and `false`, confirming correct rendering in each state.

---

## 2. Test Architecture

### 2.1 File Layout

```
apps/web/e2e/
├── smoke.spec.ts                   # Existing (unchanged)
├── fantasy-flow.plan.md            # This plan
├── fantasy-flow.spec.ts            # QA-001 — fantasy-mode E2E suite
├── fantasy-flag-matrix.spec.ts     # QA-002 — flag true/false matrix
└── fixtures/
    ├── auth.fixture.ts             # Mock Firebase auth + test user factory
    ├── api-mocks.fixture.ts        # Route-handler mocks (inventory, shop, combat, character)
    └── game-state.fixture.ts       # localStorage seeds for Zustand stores
```

### 2.2 Playwright Config Additions

No changes to `playwright.config.ts` are required. Both new spec files live in
`e2e/` and are automatically discovered. Desktop Chrome and Mobile Chrome
(Pixel 5) projects both apply.

### 2.3 Base URL

All tests run against `http://localhost:3010` (existing web server config).

---

## 3. Mock Auth Strategy

Firebase Auth cannot run in E2E without real credentials. Tests will intercept
network requests at the Playwright level using `page.route()`.

### 3.1 Auth Fixture (`fixtures/auth.fixture.ts`)

```ts
// Provides:
// - mockFirebaseAuth(page)  — intercepts Firebase Auth REST calls
// - TEST_USER               — a UserProfile object for assertions
// - seedAuthState(page)     — injects auth-store into localStorage
```

**Approach:**

1. **Intercept Firebase Auth API calls** — `page.route()` catches:
   - `identitytoolkit.googleapis.com/**` (email/password signup + login)
   - `securetoken.googleapis.com/**` (token refresh)
   Returns a stubbed `{ idToken, refreshToken, localId, email }` response.

2. **Intercept backend auth endpoints** — `page.route()` catches:
   - `**/api/v1/auth/me` → returns `TEST_USER` profile
   - `**/api/v1/auth/login` → returns `TEST_USER` profile

3. **Seed Zustand auth-store** — For tests that skip the welcome page and need
   an already-authenticated state, `seedAuthState(page)` writes to localStorage
   before navigation (Zustand persist middleware reads it on hydration).

### 3.2 Test User Shape

```ts
const TEST_USER = {
  uid: 'test-hero-uid-001',
  email: 'hero@realm.test',
  displayName: 'Test Hero',
  role: 'child',
  plan: 'free',
  xp: 0,
  level: 1,
  streak: 0,
};
```

---

## 4. API Mock Strategy (`fixtures/api-mocks.fixture.ts`)

All backend calls are intercepted via `page.route()` so tests run without a live
API server. Each mock returns typed JSON matching `@eureka-lab/shared-types`.

| Endpoint | Method | Mock Response |
|----------|--------|---------------|
| `/api/v1/users/me/character` | GET | `{ name: 'Test Hero', class: 'mage', classColorHsl: '268 70% 60%', weaponName: 'Starter Wand' }` |
| `/api/v1/users/me/character` | PUT | `200 OK` (echo body) |
| `/api/v1/inventory` | GET | `{ kp: 100, totalKpEarned: 200, ownedAbilityIds: ['ability-spark-bolt'], ownedWeaponIds: ['weapon-starter-wand'], equippedWeaponId: 'weapon-starter-wand' }` |
| `/api/v1/inventory/buy` | POST | `200 OK` (returns updated inventory with new item) |
| `/api/v1/inventory/equip` | POST | `200 OK` (returns `{ equippedWeaponId }`) |
| `/api/v1/shop/catalog` | GET | Full `ShopCatalog` with 5 abilities + 4 weapons (matches sprint-p16.md §KP Tuning) |
| `/api/v1/combat/init` | POST | `BattleConfig` with 4 quiz questions, zombie HP, player HP |
| `/api/v1/combat/:battleId/complete` | POST | `{ xpAwarded: 50, badgesUnlocked: [], kpAwarded: 15 }` |
| `/api/v1/combat/certificate` | POST | `{ certificateUrl: 'https://storage.example.com/cert.svg' }` |
| `/api/v1/users/me/settings` | PUT | `200 OK` |
| `/api/v1/tenants/*/ui-mode-lock` | GET | `{ locked: false, defaultMode: 'gamified' }` |

### 4.1 Combat Init Mock (BattleConfig)

```ts
const MOCK_BATTLE_CONFIG = {
  battleId: 'battle-test-001',
  battleType: 'minion',
  zombieType: 'library',
  zombieName: 'Babble Minion',
  zombieDialogue: 'Your prompts are weak, young one!',
  playerMaxHp: 100,
  zombieMaxHp: 60,
  questions: [
    {
      id: 'q1',
      text: 'What makes a good AI prompt?',
      options: ['Being vague', 'Being specific and clear', 'Using jargon', 'Writing less'],
      correctIndex: 1,
      tier: 1,
    },
    // ... 3 more questions
  ],
};
```

---

## 5. Game State Seeds (`fixtures/game-state.fixture.ts`)

For tests starting mid-flow (e.g., battle tests that skip character creation),
pre-seed Zustand stores via localStorage injection before `page.goto()`.

```ts
// Seeds for different test starting points:
function seedNewPlayer(page)       // No character, no progress
function seedWithCharacter(page)   // Character created, library unlocked
function seedMidGame(page)         // Library + forge cleared, 200 KP
function seedFullGame(page)        // All zones cleared except overlord
```

Each seed writes to the localStorage keys used by Zustand persist middleware
(`game-store`, `inventory-store`).

---

## 6. Test Cases — QA-001 (Fantasy Mode E2E)

### Suite 1: Authentication Flow

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1.1 | Welcome page renders | Navigate to `/g/welcome` | Logo visible, "The Awakening" heading, email + password inputs, "Enter the Realm" button |
| 1.2 | Register new hero | Switch to "Forge My Legend" tab → fill hero name, email, password → submit | Navigates to `/g/character`, no error toasts |
| 1.3 | Login existing hero | Fill email + password → submit | Navigates to `/g/dashboard` |
| 1.4 | Invalid credentials show error | Login with wrong password (mock returns 401) | Toast: "The secret rune you entered is incorrect." |
| 1.5 | Google OAuth button exists | — | "Continue with Google" button is visible and enabled |

### Suite 2: Character Creation

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 2.1 | Class carousel navigates | Click "Next class" arrow 3 times | Different class name, description, weapon shown each time |
| 2.2 | Hero name required | Leave hero name empty → click "Begin Your Quest" | Toast error; does not navigate |
| 2.3 | Aura colour selection | Click 3 different aura presets | Each click updates the aura orb colour |
| 2.4 | Character saved on confirm | Fill hero name → click confirm | PUT `/api/v1/users/me/character` called with `{ name, class, classColorHsl, weaponName }` → navigates to `/g/dashboard` |

### Suite 3: Dashboard (Realm Map)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 3.1 | Dashboard renders 4 zones | Navigate to `/g/dashboard` (seeded auth + character) | 4 zone cards visible: Library, Forge, Citadel, Academy |
| 3.2 | Library is unlocked by default | — | Library card has "Enter Isle" and "Prepare" buttons |
| 3.3 | Forge is locked initially | — | Forge card shows lock icon, no enter/prepare buttons, "Defeat the previous isle's guardian" text |
| 3.4 | KP badge displays balance | — | KpBadge shows current KP from inventory store |
| 3.5 | Hero name + class visible | — | Header shows hero name and fantasy class |
| 3.6 | Sign out navigates to welcome | Click "Sign Out" | Navigates to `/g/welcome`, game store reset |

### Suite 4: Campaign Detail

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 4.1 | Campaign page lists missions | Navigate to `/g/campaign/whispers` | Mission list with difficulty tiers visible |
| 4.2 | Enter Isle navigates to campaign | Click "Enter Isle" on Library card | URL is `/g/campaign/whispers` |

### Suite 5: Academy Prepare

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 5.1 | Prepare page has 4 tabs | Navigate to `/g/campaign/whispers/prepare` | Tabs for lessons, shorts, tutor, forge visible |
| 5.2 | Lesson tab lists content | Click lessons tab | Lesson items rendered |

### Suite 6: Mission Prep (Warm-up Quiz)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 6.1 | Prep page renders quiz | Navigate to mission prep route | Question text and answer buttons visible |
| 6.2 | Answering completes prep | Select an answer | Feedback shown, can proceed to battle |

### Suite 7: Battle Flow (Critical Path)

> **Note:** Battle page (P16-PG-007) is TODO. These test cases are written
> against the decomposition in sprint-p16.md. Implementation of test code is
> blocked until PG-007 lands.

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 7.1 | Battle initializes | Navigate to battle route → mock `POST /combat/init` | Combat store hydrated; intro overlay visible with zombie name, dialogue, "Start Fight" button |
| 7.2 | Start fight transitions to player_turn | Click "Start Fight" | Question card visible with 4 answer options and timer |
| 7.3 | Correct answer deals damage | Select correct answer | Player attack animation plays; zombie HP decreases; phase → `player_attack` → `zombie_attack` → `player_turn` |
| 7.4 | Wrong answer still advances | Select wrong answer | Zombie attacks; player HP decreases; next question loads |
| 7.5 | Timer pressure affects damage | Answer with >10s remaining vs <5s remaining | High-time answer deals 15 dmg; low-time deals 7.5 dmg (verify via HP bar values) |
| 7.6 | Victory on zombie HP ≤ 0 | Answer enough questions correctly to deplete zombie HP | Phase → `victory`; victory panel shows XP + KP awarded; `POST /combat/:id/complete` called |
| 7.7 | Defeat on player HP ≤ 0 | Allow zombie to deplete player HP (mock high zombie damage) | Phase → `defeat`; defeat panel shows retry + exit buttons |
| 7.8 | Retry after defeat | Click "Retry" on defeat panel | Battle re-initializes (new `POST /combat/init`) |
| 7.9 | KP awarded on victory (gamified mode) | Win battle with `isGameMode: true` | KP toast notification; inventory store KP increased |
| 7.10 | Overlord victory chains to certificate | Win overlord battle → `POST /combat/certificate` | Navigates to `/g/victory`; certificate image displayed |
| 7.11 | Minion victory returns to campaign | Win minion battle | Navigates back to `/g/campaign/[slug]` |
| 7.12 | Spark Charge ability (if charges > 0) | Seed `sparkCharges: 1` → use spark button | Bonus damage dealt; spark charge count decrements; button disappears at 0 |
| 7.13 | No R3F imports in battle page | Static analysis (build check) | No `@react-three` imports in battle page bundle |

### Suite 8: Shop Flow

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 8.1 | Global shop renders catalog | Navigate to `/g/shop` | Abilities and weapons listed with names, costs, buy buttons |
| 8.2 | Buy ability with sufficient KP | Seed 100 KP → click "Buy" on Mind Blast (60 KP) | `POST /inventory/buy` called; KP decreases to 40; ability appears in owned list |
| 8.3 | Buy blocked with insufficient KP | Seed 10 KP → attempt buy on 60 KP item | Buy button disabled or toast error; no API call |
| 8.4 | Already-owned items show "Owned" | Seed with owned ability | Buy button replaced with "Owned" badge |
| 8.5 | Realm shop filters by zone | Navigate to `/g/campaign/whispers/shop` | Only library-zone items shown |

### Suite 9: Inventory & Equip

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 9.1 | Inventory page shows owned items | Navigate to `/g/inventory` | KP balance, owned abilities, owned weapons visible |
| 9.2 | Equip weapon | Click "Equip" on Echo Staff | `POST /inventory/equip` called; equipped indicator moves to Echo Staff |
| 9.3 | Equipped weapon persists | Equip → navigate away → return to inventory | Same weapon still shows as equipped |

### Suite 10: Victory Page

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 10.1 | Victory page shows certificate | Seed combat store with `certificateUrl` → navigate to `/g/victory` | Certificate image displayed; XP shown |
| 10.2 | Direct navigation redirects | Navigate to `/g/victory` without certificate state | Redirects to `/g/dashboard` |
| 10.3 | Back to dashboard resets combat | Click "Back to Realm" | Combat store reset; navigates to `/g/dashboard` |

### Suite 11: Settings

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 11.1 | UI mode toggle visible (unlocked tenant) | Navigate to `/g/settings` (mock tenant lock: false) | Toggle between Normal / Gamified is interactive |
| 11.2 | Toggle saves preference | Switch to "Normal" → submit | `PUT /api/v1/users/me/settings` called with `{ uiMode: 'normal' }` |
| 11.3 | Tenant lock hides toggle | Mock tenant lock: true | Toggle is disabled/hidden; informational message shown |
| 11.4 | Combat in progress disables toggle | Seed combat store with active battle (phase !== 'idle') | Toggle disabled; "Battle in progress" warning shown |

### Suite 12: Route Redirects

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 12.1 | `/g/world` → `/g/dashboard` | Navigate to `/g/world` | Redirects to `/g/dashboard` |
| 12.2 | `/g/zone/library` → `/g/campaign/whispers` | Navigate to legacy zone route | Redirects to campaign route |

### Suite 13: Not Found

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 13.1 | Unknown game route shows fantasy 404 | Navigate to `/g/nonexistent` | "Consumed by the Void" copy visible in fantasy Scene wrapper |

---

## 7. Test Cases — QA-002 (Feature Flag Matrix)

Run a **subset** of QA-001 flows under both flag states. The flag is currently
read from `DEFAULT_FEATURE_FLAGS` in shared-types. For testing, override via:

1. **`fantasyUi: true`** — Default. Fantasy 2D UI renders.
2. **`fantasyUi: false`** — Legacy R3F layout renders (dynamic-imported).

### Override Mechanism

Since the flag is read at build time from `DEFAULT_FEATURE_FLAGS`, the matrix
test will use one of:
- **Option A (preferred):** `page.addInitScript()` to override the module export
  at runtime before page load.
- **Option B:** Two separate test projects in `playwright.config.ts` with
  different `NEXT_PUBLIC_FANTASY_UI` env vars (requires the flag to read from
  env at runtime — may need a small code change).
- **Option C:** `page.route()` to intercept the JS chunk and patch the flag
  value — brittle, use as last resort.

**Recommendation:** Option A is most maintainable. If the flag source moves to
a backend API endpoint (planned per ADR-004), switch to mocking that endpoint.

### Matrix Test Cases

| # | Flag State | Test | Expected |
|---|-----------|------|----------|
| M.1 | `true` | Dashboard renders | Fantasy Scene wrapper, zone cards with realm names, KpBadge visible |
| M.2 | `false` | Dashboard renders | Legacy R3F 3D world map loads (dynamic import); no fantasy components |
| M.3 | `true` | Welcome page renders | Fantasy-themed "The Awakening" heading |
| M.4 | `false` | Welcome page renders | Legacy login page (if it exists) or redirect |
| M.5 | `true` | Character page renders | Class carousel with fantasy classes |
| M.6 | `false` | Character page renders | Legacy career-based character selection |
| M.7 | `true` | Inventory renders | Fantasy-themed inventory with abilities + weapons + KP |
| M.8 | `false` | Inventory renders | Legacy inventory view |

---

## 8. Accessibility Checks (Embedded in Suites)

Every test suite includes baseline a11y assertions:

- **Keyboard navigation:** Tab through interactive elements; Enter/Space activates buttons
- **ARIA labels:** All buttons have accessible names; `role="progressbar"` on HpBar
- **Focus trapping:** Modal overlays (battle intro, defeat panel) trap focus
- **No duplicate IDs:** Re-use pattern from existing `smoke.spec.ts`
- **Colour contrast:** Not automated in Playwright — manual check or axe-core integration

---

## 9. Mobile Testing

Both QA-001 and QA-002 run on the `mobile-chrome` project (Pixel 5 viewport)
already defined in `playwright.config.ts`. Key mobile-specific assertions:

- Touch targets are at least 44x44px (verify via bounding box)
- No horizontal scroll overflow on any page
- Battle question card options are fully visible without scrolling
- KpBadge is visible in mobile header

---

## 10. CI Integration

- Tests run in the existing GitHub Actions CI pipeline (`.github/workflows/`)
- The `pnpm exec playwright test` command discovers both new spec files
- Failure screenshots and traces are captured per existing config
- Retries: 2 in CI, 0 locally
- Workers: 1 in CI (sequential), parallel locally

---

## 11. Dependencies & Blockers

| Dependency | Status | Impact |
|------------|--------|--------|
| P16-PG-007 (battle page) | TODO | Suite 7 tests cannot be implemented until battle page exists |
| P16-PG-005 (prepare page) | IN_REVIEW | Suite 5 tests need committed code |
| P16-PG-006 (mission prep) | IN_REVIEW | Suite 6 tests need committed code |
| P16-PG-008/009 (shop pages) | IN_REVIEW | Suite 8 tests need committed code |
| P16-PG-010 (inventory re-theme) | IN_REVIEW | Suite 9 tests need committed code |
| Sprint C closure | BLOCKED | QA-001 implementation starts after Sprint C |

**What can start now:**
- Fixtures (auth, API mocks, game state seeds)
- Suites 1–4 (welcome, character, dashboard, campaign) — pages already committed
- Suite 11 (settings) — already committed
- Suite 12 (route redirects) — already committed
- Suite 13 (not found) — already committed
- QA-002 matrix scaffold + flag override mechanism

---

## 12. Estimated Effort

| Item | Estimate |
|------|----------|
| Fixtures (auth, API mocks, game state) | 3–4 hours |
| Suites 1–4 + 11–13 (ready pages) | 4–5 hours |
| Suites 5–6 (prepare/prep — post-commit) | 2 hours |
| Suite 7 (battle — post PG-007) | 4–5 hours |
| Suites 8–9 (shop/inventory — post-commit) | 2–3 hours |
| Suite 10 (victory) | 1 hour |
| QA-002 flag matrix | 2–3 hours |
| **Total** | **~20 hours** |

---

*Plan v1.0 — QA agent — 2026-04-29*
