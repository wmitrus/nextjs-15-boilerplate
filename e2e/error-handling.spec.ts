import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Should display some content (Next.js default 404 or custom)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Should not have any JavaScript errors on the home page
    expect(errors).toHaveLength(0);
  });

  test('should handle network failures', async ({ page, context }) => {
    // Block all network requests to simulate offline
    await context.route('**/*', (route) => {
      if (
        route.request().url().includes('vercel.com') ||
        route.request().url().includes('nextjs.org')
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/');

    // Page should still load even if external links fail
    await expect(page.getByAltText('Next.js logo')).toBeVisible();

    // External links should still be present (even if they would fail when clicked)
    await expect(page.getByRole('link', { name: /deploy now/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /read our docs/i }),
    ).toBeVisible();
  });
});
