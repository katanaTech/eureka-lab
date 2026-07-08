import { test, expect } from '@playwright/test';

/**
 * Auth flow E2E tests — covers all login surfaces and redirect rules.
 *
 * Unauthenticated tests run without credentials and verify:
 *   - Pages render with no JS errors
 *   - Invalid credentials show inline error, form stays visible
 *   - Protected routes redirect unauthenticated visitors to /
 *
 * Authenticated tests require env vars (skipped when not set):
 *   E2E_CHILD_EMAIL / E2E_CHILD_PASSWORD    → child (learner) account
 *   E2E_PARENT_EMAIL / E2E_PARENT_PASSWORD  → parent account
 *   E2E_SUPER_ADMIN_EMAIL / E2E_SUPER_ADMIN_PASSWORD → super_admin account
 *   E2E_SCHOOL_CODE / E2E_STUDENT_USERNAME / E2E_STUDENT_PASSWORD → school student
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fail if the page emits any non-benign console errors. */
async function expectNoConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign browser warnings that are not app bugs.
      if (
        text.includes('favicon.ico') ||
        text.includes('icon-192x192') ||
        text.includes('apple-mobile-web-app-capable')
      ) return;
      errors.push(text);
    }
  });
  return () => errors;
}

// ---------------------------------------------------------------------------
// Public page rendering
// ---------------------------------------------------------------------------

test.describe('Public pages — render without errors', () => {
  test('home page loads with both auth tabs', async ({ page }) => {
    const getErrors = await expectNoConsoleErrors(page);
    await page.goto('/');
    await expect(page.locator('h1:has-text("The Awakening")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin Quest' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Return Hero' })).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('/login page renders email + password form', async ({ page }) => {
    const getErrors = await expectNoConsoleErrors(page);
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Student sign-in' })).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('/signup page renders parent/adult registration form', async ({ page }) => {
    const getErrors = await expectNoConsoleErrors(page);
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('/student-login page renders school-code + username form', async ({ page }) => {
    const getErrors = await expectNoConsoleErrors(page);
    await page.goto('/student-login');
    await expect(page.getByLabel('School code')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Temporary Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Login error handling — form stays on page, inline error visible
// ---------------------------------------------------------------------------

test.describe('Login forms — invalid credentials stay on page', () => {
  test('/login shows inline error on bad credentials, does not redirect', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nobody@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    // force:true bypasses the Next.js dev-mode portal overlay in headless
    await page.getByRole('button', { name: 'Log In' }).click({ force: true });

    // Must stay on /login — no redirect to / or anywhere else
    await expect(page).toHaveURL(/\/login$/);
    // Inline error alert must appear
    await expect(page.getByRole('alert').filter({ hasText: /invalid-credential|invalid-email|user-not-found/i })).toBeVisible({ timeout: 10000 });
    // Login form must still be visible (not disappeared)
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('home page login tab shows inline error on bad credentials, does not redirect', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Return Hero' }).click({ force: true });
    await page.fill('input[placeholder="hero@realm.io"]', 'nobody@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: 'Enter the Realm' }).click({ force: true });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('alert').filter({ hasText: /invalid-credential|invalid-email|user-not-found/i })).toBeVisible({ timeout: 10000 });
    // Form still visible — not replaced by dashboard
    await expect(page.getByRole('button', { name: 'Return Hero' })).toBeVisible();
  });

  test('/student-login shows inline error on bad school code, does not redirect', async ({ page }) => {
    await page.goto('/student-login');
    await page.getByLabel('School code').fill('XXXXXX');
    await page.getByLabel('Username').fill('nobody');
    await page.getByLabel('Temporary Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click({ force: true });

    await expect(page).toHaveURL(/\/student-login$/);
    await expect(page.getByRole('alert').filter({ hasText: /invalid-credential|user-not-found/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('School code')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Protected route guards — unauthenticated redirects
// ---------------------------------------------------------------------------

test.describe('Protected routes — redirect unauthenticated users to /', () => {
  const protectedRoutes = ['/dashboard', '/character', '/campaign/isle-1', '/admin', '/school', '/parent', '/teacher', '/achievements', '/settings', '/pricing'];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /`, async ({ page }) => {
      await page.goto(route);
      // Firebase auth state initialisation can take a few seconds in headless;
      // wait up to 10s for the unauthenticated redirect to / to fire.
      await page.waitForURL('http://localhost:3010/', { timeout: 10000 }).catch(() => {});
      expect(page.url()).toBe('http://localhost:3010/');
    });
  }
});

// ---------------------------------------------------------------------------
// Navigation links
// ---------------------------------------------------------------------------

test.describe('Navigation links between auth pages', () => {
  test('/login → /signup via "Create Account" link', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/signup"]').first().click({ force: true });
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('/login → /student-login via "Student sign-in" link', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/student-login"]').click({ force: true });
    await expect(page).toHaveURL(/\/student-login$/);
  });

  test('/signup → /login via "Log In" link', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('a[href="/login"]').first().click({ force: true });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('home page "Begin Quest" tab default + switching to "Return Hero"', async ({ page }) => {
    await page.goto('/');
    // Default tab is Begin Quest (register) — hero name field visible
    await expect(page.getByRole('button', { name: 'Begin Quest' })).toBeVisible();
    // Switch to Return Hero (login)
    await page.getByRole('button', { name: 'Return Hero' }).click({ force: true });
    await expect(page.locator('input[placeholder="hero@realm.io"]')).toBeVisible();
    // Hero Name field gone
    await expect(page.locator('input[placeholder="e.g. Stormrider"]')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Authenticated flows — skipped when env vars are not set
// ---------------------------------------------------------------------------

test.describe('Authenticated — child (learner) login', () => {
  test.skip(!process.env['E2E_CHILD_EMAIL'], 'Set E2E_CHILD_EMAIL + E2E_CHILD_PASSWORD to run');

  test('child logs in via /login and lands on /dashboard or /character', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env['E2E_CHILD_EMAIL']!);
    await page.fill('input[type="password"]', process.env['E2E_CHILD_PASSWORD']!);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Should land on /dashboard (character created) or /character (first login)
    await page.waitForURL(/\/(dashboard|character)$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/(dashboard|character)$/);

    // Must NOT stay on /login
    expect(page.url()).not.toContain('/login');
    // Must NOT bounce back to / (the bug we fixed)
    expect(page.url()).not.toBe('http://localhost:3010/');
  });

  test('child login: no gamification 403 in console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('403')) errors.push(msg.text());
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env['E2E_CHILD_EMAIL']!);
    await page.fill('input[type="password"]', process.env['E2E_CHILD_PASSWORD']!);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL(/\/(dashboard|character)$/, { timeout: 15000 });

    // Wait for async effects to settle
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Authenticated — parent login', () => {
  test.skip(!process.env['E2E_PARENT_EMAIL'], 'Set E2E_PARENT_EMAIL + E2E_PARENT_PASSWORD to run');

  test('parent logs in via /login and lands on /parent', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env['E2E_PARENT_EMAIL']!);
    await page.fill('input[type="password"]', process.env['E2E_PARENT_PASSWORD']!);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.waitForURL(/\/parent$/, { timeout: 15000 });
    expect(page.url()).toContain('/parent');
  });
});

test.describe('Authenticated — super_admin login', () => {
  test.skip(!process.env['E2E_SUPER_ADMIN_EMAIL'], 'Set E2E_SUPER_ADMIN_EMAIL + E2E_SUPER_ADMIN_PASSWORD to run');

  test('super_admin logs in via /login and lands on /admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env['E2E_SUPER_ADMIN_EMAIL']!);
    await page.fill('input[type="password"]', process.env['E2E_SUPER_ADMIN_PASSWORD']!);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.waitForURL(/\/admin$/, { timeout: 15000 });
    expect(page.url()).toContain('/admin');
  });

  test('super_admin: no gamification 403 in console (layout fix)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('gamification') && msg.text().includes('403')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env['E2E_SUPER_ADMIN_EMAIL']!);
    await page.fill('input[type="password"]', process.env['E2E_SUPER_ADMIN_PASSWORD']!);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL(/\/admin$/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Authenticated — school student login', () => {
  test.skip(!process.env['E2E_SCHOOL_CODE'], 'Set E2E_SCHOOL_CODE + E2E_STUDENT_USERNAME + E2E_STUDENT_PASSWORD to run');

  test('student logs in via /student-login and lands on learner shell', async ({ page }) => {
    await page.goto('/student-login');
    await page.getByLabel('School code').fill(process.env['E2E_SCHOOL_CODE']!);
    await page.getByLabel('Username').fill(process.env['E2E_STUDENT_USERNAME']!);
    await page.getByLabel('Temporary Password').fill(process.env['E2E_STUDENT_PASSWORD']!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/\/(dashboard|character)$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/(dashboard|character)$/);
  });
});
