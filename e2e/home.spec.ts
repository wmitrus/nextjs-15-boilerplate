import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the custom logo', async ({ page }) => {
    const logo = page.locator('div.h-8.w-8.rounded-lg.bg-indigo-600');
    await expect(logo).toBeVisible();
  });

  test('should display the main heading text', async ({ page }) => {
    await expect(page.getByText('Modern Web Development')).toBeVisible();
    await expect(
      page.getByText(
        'A Next.js 15 boilerplate with environment management, feature flags, and multi-tenant support',
      ),
    ).toBeVisible();
  });

  test.fixme('should have working external links', async ({ page }) => {
    // Test Explore Features button
    const featuresLink = page.getByRole('link', { name: /explore features/i });
    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute('href', '#features');

    // Test Learn more button
    const learnMoreLink = page.getByRole('link', { name: /learn more/i });
    await expect(learnMoreLink).toBeVisible();
    await expect(learnMoreLink).toHaveAttribute('href', 'https://nextjs.org');
    await expect(learnMoreLink).toHaveAttribute('target', '_blank');
  });

  test('should have footer content', async ({ page }) => {
    // Check for footer text content
    await expect(page.getByText('NextJS 15 Boilerplate')).toBeVisible();
    await expect(
      page.getByText(
        'Built with Next.js 15, TypeScript, and modern web technologies',
      ),
    ).toBeVisible();

    // Check for footer logo
    const footerLogo = page.locator(
      'footer div.h-6.w-6.rounded-lg.bg-indigo-600',
    );
    await expect(footerLogo).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('main')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();

    // Check if hero section buttons are visible on mobile
    const buttonContainer = page.locator(
      '.flex.items-center.justify-center.gap-x-6',
    );
    await expect(buttonContainer).toBeVisible();

    // Check if feature grid adapts to different screen sizes
    const featureGrid = page.locator(
      '.grid.grid-cols-1.gap-8.sm\\:grid-cols-2.lg\\:grid-cols-3',
    );
    await expect(featureGrid).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await expect(page).toHaveTitle(/Next\.js 15 Boilerplate/);

    // Check for favicon
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveCount(1);
  });
});
