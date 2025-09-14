import { test, expect } from '@playwright/test';

// Verifies extra hardening headers applied by middleware for auth/Clerk routes

test.describe('Auth hardening headers', () => {
  test('sign-in sets X-Frame-Options and Permissions-Policy', async ({
    page,
    baseURL,
  }) => {
    const res = await page.goto(`${baseURL}/sign-in`);
    expect(res).toBeTruthy();
    expect(res!.ok()).toBeTruthy();

    const headers = res!.headers(); // header names are lower-cased

    // Auth-specific hardening
    expect(headers['x-frame-options']).toBe('DENY');
    const permissions = headers['permissions-policy'];
    expect(permissions).toBeTruthy();
    expect(permissions).toContain('camera=()');
    expect(permissions).toContain('microphone=()');
    expect(permissions).toContain('geolocation=()');

    // Global security headers should also be present
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });
});
