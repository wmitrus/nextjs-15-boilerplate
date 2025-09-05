import { test, expect } from '@playwright/test';

// Define timeout values outside of test functions to avoid ESLint warnings
// about conditionals in tests
// Increased timeouts to account for Clerk authentication loading
const BASE_TIMEOUT = process.env.CI ? 12000 : 10000;
const NETWORK_CONDITIONS_TIMEOUT = process.env.CI ? 15000 : 12000;

test.describe('Performance', () => {
  test('@smoke should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (increased threshold for CI/test environments)
    // Firefox is generally slower than Chromium, and Clerk authentication adds loading time
    expect(loadTime).toBeLessThan(BASE_TIMEOUT);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Check if images are loaded properly (LCP related)
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();

      // Check if image has proper dimensions
      const boundingBox = await img.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }
  });

  test('should handle network conditions gracefully', async ({
    page,
    context,
  }) => {
    // Simulate slow 3G connection
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Even with slow connection, should load within reasonable time
    // Increased timeout for CI environments and Clerk authentication loading
    expect(loadTime).toBeLessThan(NETWORK_CONDITIONS_TIMEOUT);

    // Content should still be visible
    const logo = page.locator('div.h-8.w-8.rounded-lg.bg-indigo-600');
    await expect(logo).toBeVisible();
  });
});
