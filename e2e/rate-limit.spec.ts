import { test, expect } from '@playwright/test';

/**
 * Verifies rate limiting middleware behavior.
 * Uses TEST_LOCAL_RATE_LIMIT=1 to simulate without Upstash in E2E.
 */

test('Rate limit triggers 429 after threshold @smoke', async ({ request }) => {
  test.setTimeout(60000); // Increase timeout for this test
  // Check if rate limiting is disabled in test environment
  if (process.env.DISABLE_RATE_LIMITING === 'true') {
    console.log(
      'Rate limiting is disabled in test environment - skipping rate limit verification',
    );

    // Instead, verify that requests succeed when rate limiting is disabled
    for (let i = 0; i < 10; i++) {
      const res = await request.get('/api/config');
      expect(
        res.status(),
        `hit ${i + 1} should succeed when rate limiting disabled`,
      ).toBe(200);
    }

    // All requests should succeed, no 429 errors
    const rapidRequests = await Promise.all(
      Array(5)
        .fill(0)
        .map(() => request.get('/api/config')),
    );

    rapidRequests.forEach((response, index) => {
      expect(
        response.status(),
        `rapid request ${index + 1} should succeed`,
      ).toBe(200);
    });

    return;
  }

  // Original rate limiting test when not disabled
  // Hit a simple API route that exists and is covered by middleware
  // Using /api/config (safe and always available)
  const hits: number = Number(process.env.RATE_LIMIT_LOCAL_LIMIT || 3);
  const windowMs: number = Number(
    process.env.RATE_LIMIT_LOCAL_WINDOW_MS || 2000,
  );

  // Perform hits within the window
  for (let i = 0; i < hits; i++) {
    try {
      const res = await request.get('/api/config');
      expect(res.status(), `hit ${i + 1} expected 200`).toBe(200);
    } catch (error) {
      console.log(`Rate limit test error on hit ${i + 1}:`, error);
      throw error;
    }
  }

  // Next request should be limited
  const limited = await request.get('/api/config');
  expect(limited.status()).toBe(429);
  expect(limited.headers()['x-ratelimit-limit']).toBe(String(hits));
  expect(Number(limited.headers()['x-ratelimit-remaining'])).toBe(0);

  // Wait for reset and confirm it allows again
  await new Promise((r) => setTimeout(r, windowMs + 100));
  const afterReset = await request.get('/api/config');
  expect(afterReset.status()).toBe(200);
});
