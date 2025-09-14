/**
 * Additional coverage tests for Edge CSRF implementation
 */
import { NextRequest, NextResponse } from 'next/server';

import { createEdgeCsrf } from '@/lib/security/csrf/edge';

function makeRequest(
  url: string,
  init?: RequestInit & { cookies?: Record<string, string> },
) {
  type MutableNextRequest = Request & {
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined;
    };
    nextUrl: URL;
    method: string;
  };

  const base = new Request(url, init) as MutableNextRequest;
  const cookiesMap = new Map<string, string>(
    Object.entries(init?.cookies ?? {}),
  );

  base.cookies = {
    get: (name: string) =>
      cookiesMap.has(name) ? { name, value: cookiesMap.get(name)! } : undefined,
  };
  base.nextUrl = new URL(url);
  return base as unknown as NextRequest;
}

function makeResponse() {
  return NextResponse.next();
}

function sameOriginHeaders(origin: string) {
  const u = new URL(origin);
  return {
    origin: `${u.origin}`,
    referer: `${u.origin}/ref`,
    host: `${u.host}`,
    'x-forwarded-proto': u.protocol.replace(':', ''),
  } as Record<string, string>;
}

// Uses .env.test => http://127.0.0.1:3000
const TEST_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';

describe('Edge CSRF additional coverage', () => {
  it('skips applying on /api/security/csrf path', async () => {
    const csrf = createEdgeCsrf();
    const req = makeRequest(`${TEST_ORIGIN}/api/security/csrf/token`, {
      method: 'GET',
    });
    const res = makeResponse();

    const out = await csrf.apply(req, res);
    expect(out.headers.get(csrf.config.headerName)).toBeNull();
    expect(out.cookies.get(csrf.config.cookieNames.secret)).toBeUndefined();
  });

  it('does nothing when path is not protected', async () => {
    const csrf = createEdgeCsrf();
    const req = makeRequest(`${TEST_ORIGIN}/public/page`, { method: 'GET' });
    const res = makeResponse();

    const out = await csrf.apply(req, res);
    expect(out.headers.get(csrf.config.headerName)).toBeNull();
  });

  it('enforces same-origin on unsafe methods', async () => {
    const csrf = createEdgeCsrf();
    const evil = makeRequest('https://evil.example.com/api/test', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example.com',
        referer: 'https://evil.example.com/page',
        host: 'evil.example.com',
        'x-forwarded-proto': 'https',
      },
    });
    const out = await csrf.apply(evil, makeResponse());
    expect(out.status).toBe(403);
  });

  it('rotates secret when iat is invalid', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    // Seed cookies via safe request
    const seedReq = makeRequest(`${TEST_ORIGIN}/any`, { method: 'GET' });
    const seeded = await csrf.apply(seedReq, makeResponse());
    const initialSecret = seeded.cookies.get(
      csrf.config.cookieNames.secret,
    )!.value;

    // Second request with invalid iat should rotate
    const invalidIatReq = makeRequest(`${TEST_ORIGIN}/any`, {
      method: 'GET',
      cookies: {
        [csrf.config.cookieNames.secret]: initialSecret,
        [csrf.config.cookieNames.iat]: 'not-a-number',
      },
    });
    const rotated = await csrf.apply(invalidIatReq, makeResponse());
    const newSecret = rotated.cookies.get(
      csrf.config.cookieNames.secret,
    )!.value;
    expect(newSecret).not.toEqual(initialSecret);
  });

  it('does not rotate secret when iat is recent', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    const first = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/any`, { method: 'GET' }),
      makeResponse(),
    );
    const secret = first.cookies.get(csrf.config.cookieNames.secret)!.value;
    const iat = first.cookies.get(csrf.config.cookieNames.iat)!.value;

    const second = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/any`, {
        method: 'GET',
        cookies: {
          [csrf.config.cookieNames.secret]: secret,
          [csrf.config.cookieNames.iat]: iat,
        },
      }),
      makeResponse(),
    );

    // No rotation means no CSRF cookies re-set on the response
    expect(second.cookies.get(csrf.config.cookieNames.secret)).toBeUndefined();
    expect(second.cookies.get(csrf.config.cookieNames.iat)).toBeUndefined();

    // But a token header should still be issued for safe requests
    expect(second.headers.get(csrf.config.headerName)).toBeTruthy();
  });

  it('returns 403 with invalid token (decode/verify failure)', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    // Bootstrap to set cookies
    const boot = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, { method: 'GET' }),
      makeResponse(),
    );
    const secretCookie = boot.cookies.get(
      csrf.config.cookieNames.secret,
    )!.value;

    const bad = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, {
        method: 'POST',
        headers: {
          ...sameOriginHeaders(TEST_ORIGIN),
          [csrf.config.headerName]: '!!!not-base64!!!',
        },
        cookies: { [csrf.config.cookieNames.secret]: secretCookie },
      }),
      makeResponse(),
    );

    expect(bad.status).toBe(403);
  });

  it('accepts token from alternate header (x-xsrf-token)', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    const boot = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, { method: 'GET' }),
      makeResponse(),
    );
    const token = boot.headers.get(csrf.config.headerName)!;
    const secretCookie = boot.cookies.get(
      csrf.config.cookieNames.secret,
    )!.value;

    const ok = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, {
        method: 'POST',
        headers: {
          ...sameOriginHeaders(TEST_ORIGIN),
          'x-xsrf-token': token,
        },
        cookies: { [csrf.config.cookieNames.secret]: secretCookie },
      }),
      makeResponse(),
    );

    expect(ok.status).toBe(200);
  });

  it('merges non-CSRF cookies on rotation', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    // Bootstrap via safe request
    const boot = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, { method: 'GET' }),
      makeResponse(),
    );
    const token = boot.headers.get(csrf.config.headerName)!;
    const secret = boot.cookies.get(csrf.config.cookieNames.secret)!.value;

    // Response with an existing unrelated cookie
    const resWithCookie = makeResponse();
    resWithCookie.cookies.set('other', '1', { path: '/' });

    const rotated = await csrf.apply(
      makeRequest(`${TEST_ORIGIN}/api/test`, {
        method: 'POST',
        headers: {
          ...sameOriginHeaders(TEST_ORIGIN),
          [csrf.config.headerName]: token,
        },
        cookies: { [csrf.config.cookieNames.secret]: secret },
      }),
      resWithCookie,
    );

    // other cookie should remain
    const other = rotated.cookies.get('other');
    expect(other?.value).toBe('1');
    // rotated should also include new CSRF cookies
    expect(rotated.cookies.get(csrf.config.cookieNames.secret)).toBeTruthy();
    expect(rotated.cookies.get(csrf.config.cookieNames.iat)).toBeTruthy();
  });

  it('issues token via issueForRoute with header, body and cookies', async () => {
    const csrf = createEdgeCsrf();
    const req = makeRequest(`${TEST_ORIGIN}/api/security/csrf/token`, {
      method: 'GET',
    });

    const out = await csrf.issueForRoute(req);
    const headerToken = out.headers.get(csrf.config.headerName);
    expect(headerToken).toBeTruthy();

    const data = await out.json();
    expect(data?.data?.token).toBe(headerToken);

    // cookies should be set on the response
    expect(out.cookies.get(csrf.config.cookieNames.secret)).toBeTruthy();
    expect(out.cookies.get(csrf.config.cookieNames.iat)).toBeTruthy();

    // cache-control header is present
    expect(out.headers.get('cache-control')).toBe('no-store');
  });
});
