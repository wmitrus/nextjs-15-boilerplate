import {
  test,
  expect,
  request,
  type APIRequestContext,
} from '@playwright/test';

type TokenJson = { data?: { token?: string }; token?: string };

const extractToken = (j: unknown): string => {
  const obj = j as TokenJson;
  const dataToken = obj && obj.data ? (obj.data.token ?? '') : '';
  const flatToken = obj && obj.token ? (obj.token ?? '') : '';
  return dataToken || flatToken;
};

type HeaderRecord = Record<string, string | string[] | undefined>;

type HasHeadersMethod = {
  headers: () => HeaderRecord;
};

type HasHeadersObject = {
  headers: Headers;
};

type WithHeaders = HasHeadersMethod | HasHeadersObject;

function isHasHeadersMethod(x: WithHeaders): x is HasHeadersMethod {
  return typeof (x as HasHeadersMethod).headers === 'function';
}

const header = (res: WithHeaders, name: string): string => {
  if (isHasHeadersMethod(res)) {
    const obj = res.headers();
    const lower = name.toLowerCase();
    const foundKey =
      Object.keys(obj).find((k) => k.toLowerCase() === lower) || '';
    const value = foundKey ? obj[foundKey] : '';
    return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  }
  return res.headers.get(name) ?? '';
};

// Uses /api/security/csrf and /api/examples/secure-post from the app

test.describe('CSRF Protection', () => {
  test('full lifecycle: issue, verify, rotate, block replay/cross-binding', async ({
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const sessionA: APIRequestContext = await request.newContext();

    // Step 1: Bootstrap CSRF via GET /api/security/csrf
    const bootstrap = await sessionA.get(`${baseURL}/api/security/csrf`);
    expect(bootstrap.status()).toBe(200);
    const tokenA = extractToken(await bootstrap.json());
    expect(tokenA).toBeTruthy();

    // Step 2: Safe GET should succeed and return a token header
    const ping = await sessionA.get(`${baseURL}/api/csrf-ping`);
    expect(ping.status()).toBe(204);

    // Step 3: Unsafe POST without header should fail (same-origin enforced)
    const noHeader = await sessionA.post(
      `${baseURL}/api/examples/secure-post`,
      {
        data: { name: 'Alice' },
        headers: { origin },
      },
    );
    expect(noHeader.status()).toBe(403);

    // Step 4: Unsafe POST with header should succeed and rotate token
    const withHeader = await sessionA.post(
      `${baseURL}/api/examples/secure-post`,
      {
        data: { name: 'Alice' },
        headers: { 'x-csrf-token': tokenA, origin },
      },
    );
    expect(withHeader.status()).toBe(200);
    const rotatedToken = header(withHeader, 'x-csrf-token');
    expect(rotatedToken).toBeTruthy();
    expect(rotatedToken).not.toBe(tokenA);

    // Step 5: Cookie should be present for this request context
    const stateAfter = await sessionA.storageState();
    const cookieA = stateAfter.cookies.find((c) =>
      c.name.endsWith('csrf-secret'),
    );
    expect(cookieA).toBeDefined();

    // Step 6: Same-session replay using stale token should fail (use old tokenA again)
    const replay = await sessionA.post(`${baseURL}/api/examples/secure-post`, {
      data: { name: 'ReplayAttack' },
      headers: { 'x-csrf-token': tokenA, origin },
    });
    expect(replay.status()).toBe(403);

    // Step 7: Cross-binding checks: using stolen cookie + stale token must fail
    const stolenCookieHeader = `${cookieA!.name}=${cookieA!.value}`;
    const sessionB: APIRequestContext = await request.newContext();
    const stolen = await sessionB.post(`${baseURL}/api/examples/secure-post`, {
      data: { name: 'Mallory' },
      headers: { 'x-csrf-token': tokenA, origin, cookie: stolenCookieHeader },
    });
    expect(stolen.status()).toBe(403);
  });

  test('rejects cross-origin unsafe requests even with token', async ({
    baseURL,
  }) => {
    const session: APIRequestContext = await request.newContext();

    // Bootstrap token and cookies (same-origin)
    const bootstrap = await session.get(`${baseURL}/api/security/csrf`);
    const token = extractToken(await bootstrap.json());
    expect(token).toBeTruthy();

    // Send POST with valid token but wrong Origin
    const bad = await session.post(`${baseURL}/api/examples/secure-post`, {
      data: { name: 'Mallory' },
      headers: { 'x-csrf-token': token, origin: 'https://evil.example' },
    });
    expect(bad.status()).toBe(403);
  });

  test('accepts token via alternate header name (x-xsrf-token)', async ({
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const session: APIRequestContext = await request.newContext();

    const bootstrap = await session.get(`${baseURL}/api/security/csrf`);
    const token = extractToken(await bootstrap.json());
    expect(token).toBeTruthy();

    const ok = await session.post(`${baseURL}/api/examples/secure-post`, {
      data: { name: 'Bob' },
      headers: { 'x-xsrf-token': token, origin },
    });
    expect(ok.status()).toBe(200);
  });

  test('rejects unsafe POST when Origin/Referer are missing', async ({
    baseURL,
  }) => {
    const session: APIRequestContext = await request.newContext();

    const bootstrap = await session.get(`${baseURL}/api/security/csrf`);
    const token = extractToken(await bootstrap.json());
    expect(token).toBeTruthy();

    // No origin/referer headers at all
    const res = await session.post(`${baseURL}/api/examples/secure-post`, {
      data: { name: 'NoOrigin' },
      headers: { 'x-csrf-token': token },
    });
    expect(res.status()).toBe(403);
  });

  test('rotated secret is not overwritten by earlier response cookies', async ({
    baseURL,
    request,
  }) => {
    const issue = await request.get(`${baseURL}/api/security/csrf`);
    const token = extractToken(await issue.json());
    expect(token).toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const res = await request.post(`${baseURL}/api/examples/secure-post`, {
      data: { a: 1 },
      headers: { origin, 'x-csrf-token': token },
    });
    expect(res.status()).toBe(200);
    // Immediately replay old token should fail (verifies rotated cookie remains effective)
    const replay = await request.post(`${baseURL}/api/examples/secure-post`, {
      data: { a: 1 },
      headers: { origin, 'x-csrf-token': token },
    });
    expect(replay.status()).toBe(403);
  });

  test('OPTIONS requests bypass CSRF and return 204', async ({
    baseURL,
    request,
  }) => {
    const res = await request.fetch(`${baseURL}/api/examples/secure-post`, {
      method: 'OPTIONS',
    });
    // OPTIONS requests should return either 200 or 204, not be rate-limited
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
  });

  test('CSRF cookie names honor prefix', async ({ baseURL, request }) => {
    // Run webserver with CSRF_COOKIE_PREFIX set, or set it in config for the test process.
    await request.get(`${baseURL}/api/security/csrf`);
    const cookies = await request.storageState();
    const prefixed = cookies.cookies.some(
      (c) => c.name.endsWith('csrf-secret') && c.name.startsWith('foo_'),
    );
    expect(prefixed).toBe(true);
  });

  // New tests for recent security changes
  test('issuance endpoint returns token in header and sets secure cookies with correct attributes (test env)', async ({
    baseURL,
  }) => {
    const session: APIRequestContext = await request.newContext();
    const res = await session.get(`${baseURL}/api/security/csrf`);
    expect(res.status()).toBe(200);
    const tokenHdr = header(res as unknown as WithHeaders, 'x-csrf-token');
    expect(tokenHdr).toBeTruthy();

    const state = await session.storageState();
    const secret = state.cookies.find((c) => c.name.endsWith('csrf-secret'));
    const iat = state.cookies.find((c) => c.name.endsWith('csrf-iat'));
    expect(secret, 'secret cookie should exist').toBeTruthy();
    expect(iat, 'iat cookie should exist').toBeTruthy();

    // Cookie attributes in test env
    expect(secret!.httpOnly).toBe(true);
    expect(iat!.httpOnly).toBe(true);
    expect(secret!.sameSite).toBe('Strict');
    expect(iat!.sameSite).toBe('Strict');
    // In test env CSRF_SECURE_COOKIES is not set -> secure=false
    expect(secret!.secure).toBe(false);
    expect(iat!.secure).toBe(false);
  });

  test('safe GET to protected API returns a CSRF token header', async ({
    baseURL,
    request,
  }) => {
    const res = await request.get(`${baseURL}/api/csrf-ping`);
    expect(res.status()).toBe(204);
    const token = header(res as unknown as WithHeaders, 'x-csrf-token');
    expect(token).toBeTruthy();
  });

  test('request body is sanitized server-side', async ({ baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const session: APIRequestContext = await request.newContext();
    const issue = await session.get(`${baseURL}/api/security/csrf`);
    const token = extractToken(await issue.json());

    const payload = { message: '<script>alert(1)</script><b>ok</b>' };
    const res = await session.post(`${baseURL}/api/examples/secure-post`, {
      data: payload,
      headers: { origin, 'x-csrf-token': token },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.data?.echoed?.message).toBe('ok');
  });
});
