import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('@smoke should handle 404 pages', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Should display some content (Next.js default 404 or custom)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    const consoleLogs: string[] = [];

    // Listen for console errors (but ignore middleware warnings)
    page.on('console', (msg) => {
      const text = msg.text();

      // Capture all console logs for debugging
      if (text.includes('TenantProvider') || text.includes('loadTenant')) {
        consoleLogs.push(`${msg.type()}: ${text}`);
      }

      if (msg.type() === 'error') {
        // Filter out SSL and resource loading errors
        if (
          !text.includes('Failed to load resource') &&
          !text.includes('SSL connect error')
        ) {
          errors.push(text);
        }
      } else if (msg.type() === 'warning') {
        // Ignore expected warnings and development messages
        if (
          !text.includes('Redis not configured') &&
          !text.includes('Rate limiting failed') &&
          !text.includes('Clerk has been loaded with development keys') &&
          !text.includes('Development instances have strict usage limits') &&
          !text.includes('Failed to load resource') &&
          !text.includes('status of 404')
        ) {
          errors.push(text);
        }
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Listen for request errors (but filter out external SSL issues)
    page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();

      // Filter out known development environment SSL issues
      if (failure && !failure.errorText.includes('SSL connect error')) {
        // Only capture errors that are not SSL-related from development resources
        if (url.includes('127.0.0.1:3000') || url.includes('localhost:3000')) {
          errors.push(`Request failed: ${url} - ${failure.errorText}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Always output captured diagnostics for visibility without conditionals
    console.log('Console logs:', consoleLogs);
    console.log('Errors:', errors);

    // Should not have any JavaScript errors on the home page
    expect(errors).toHaveLength(0);
  });

  test.fixme('should handle network failures', async ({ page, context }) => {
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
    const logo = page.locator('div.h-8.w-8.rounded-lg.bg-indigo-600');
    await expect(logo).toBeAttached();

    // External links should still be present (even if they would fail when clicked)
    await expect(
      page.getByRole('link', { name: /explore features/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible();
  });
});
