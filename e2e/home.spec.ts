import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the Next.js logo', async ({ page }) => {
    const logo = page.getByAltText('Next.js logo');
    await expect(logo).toBeVisible();
  });

  test('should display the main heading text', async ({ page }) => {
    await expect(page.getByText('Get started by editing')).toBeVisible();
    await expect(page.getByText('src/app/page.tsx')).toBeVisible();
  });

  test('should have working external links', async ({ page }) => {
    // Test Deploy now button
    const deployLink = page.getByRole('link', { name: /deploy now/i });
    await expect(deployLink).toBeVisible();
    await expect(deployLink).toHaveAttribute('href', /vercel\.com/);
    await expect(deployLink).toHaveAttribute('target', '_blank');

    // Test Read our docs button
    const docsLink = page.getByRole('link', { name: /read our docs/i });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', /nextjs\.org\/docs/);
    await expect(docsLink).toHaveAttribute('target', '_blank');
  });

  test('should have footer links', async ({ page }) => {
    const learnLink = page.getByRole('link', { name: /learn/i });
    const examplesLink = page.getByRole('link', { name: /examples/i });
    const nextjsLink = page.getByRole('link', { name: /go to nextjs\.org/i });

    await expect(learnLink).toBeVisible();
    await expect(examplesLink).toBeVisible();
    await expect(nextjsLink).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('main')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();

    // Check if layout adapts (buttons should stack vertically on mobile)
    const buttonContainer = page.locator(
      '.flex.flex-col.items-center.gap-4.sm\\:flex-row',
    );
    await expect(buttonContainer).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await expect(page).toHaveTitle(/Create Next App/);

    // Check for favicon
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveCount(1);
  });
});
