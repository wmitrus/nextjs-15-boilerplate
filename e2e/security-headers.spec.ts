import { test, expect } from '@playwright/test';

// Helpers outside tests to satisfy playwright/no-conditional-in-test

type HeaderCarrier = { headers(): Record<string, string> };

const readHeader = (res: HeaderCarrier, name: string): string => {
  const headers = res.headers();
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return '';
};

// Verifies CSP/nonce and key hardening headers from middleware on pages and APIs

test.describe('Global Security Headers', () => {
  test('page responses include CSP, nonce header, and hardening defaults', async ({
    page,
  }) => {
    const resp = await page.goto('/');
    expect(resp).toBeTruthy();

    const csp = readHeader(resp!, 'content-security-policy');
    const nonce = readHeader(resp!, 'x-nonce');

    expect(csp, 'CSP header should be present').toBeTruthy();
    expect(nonce, 'nonce header should be present').toBeTruthy();

    const referrer = readHeader(resp!, 'referrer-policy');
    const xcto = readHeader(resp!, 'x-content-type-options');

    expect(referrer).toBe('strict-origin-when-cross-origin');
    expect(xcto).toBe('nosniff');
  });

  test('API responses include CSP, nonce, and rotate nonce across requests', async ({
    request,
    baseURL,
  }) => {
    const first = await request.get(`${baseURL}/api/csrf-ping`);
    expect(first.status()).toBe(204);

    const csp1 = readHeader(first, 'content-security-policy');
    const nonce1 = readHeader(first, 'x-nonce');

    expect(csp1).toContain('script-src');
    expect(nonce1.length).toBeGreaterThan(0);

    const second = await request.get(`${baseURL}/api/csrf-ping`);
    expect(second.status()).toBe(204);

    const nonce2 = readHeader(second, 'x-nonce');
    expect(nonce2).toBeTruthy();
    // Nonce should change per request
    expect(nonce2).not.toBe(nonce1);
  });
});
