import { test, expect } from '@playwright/test';

/**
 * Smoke tests — basic page load verification.
 * These tests ensure critical pages render without crashing.
 */
test.describe('Smoke Tests', () => {
  test('home page loads and shows app name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Eureka Lab')).toBeVisible();
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page renders form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('#displayName')).toBeVisible();
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Accessibility Basics', () => {
  test('login page has proper form labels', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    /* Check that labels are associated with inputs */
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('pages have no duplicate IDs', async ({ page }) => {
    await page.goto('/login');
    const duplicateIds = await page.evaluate(() => {
      const allIds = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const id of allIds) {
        if (seen.has(id)) dupes.push(id);
        seen.add(id);
      }
      return dupes;
    });
    expect(duplicateIds).toHaveLength(0);
  });
});
