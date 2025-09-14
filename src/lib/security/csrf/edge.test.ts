/**
 * Unit tests for Edge CSRF implementation
 */
// import { atou, utoa } from '@edge-csrf/core';
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

  // Shim minimal NextRequest pieces without using `any`
  base.cookies = {
    get: (name: string) =>
      cookiesMap.has(name) ? { name, value: cookiesMap.get(name)! } : undefined,
  };
  base.nextUrl = new URL(url);
  // Note: Request.method is read-only and already set via constructor init
  return base as unknown as NextRequest;
}

function makeResponse() {
  const res = NextResponse.next();
  return res;
}

describe('Edge CSRF basics', () => {
  it('issues token on safe request and sets cookies', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    const req = makeRequest('https://example.com/api/test', { method: 'GET' });
    const res = makeResponse();

    const out = await csrf.apply(req, res);
    const headerToken = out.headers.get(csrf.config.headerName);
    expect(headerToken).toBeTruthy();

    const secretCookie = out.cookies.get(csrf.config.cookieNames.secret);
    const iatCookie = out.cookies.get(csrf.config.cookieNames.iat);
    expect(secretCookie?.value).toBeTruthy();
    expect(iatCookie?.value).toBeTruthy();
  });

  it('rejects unsafe without header', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    const getReq = makeRequest('https://example.com/api/test', {
      method: 'GET',
    });
    await csrf.apply(getReq, makeResponse());

    const postReq = makeRequest('https://example.com/api/test', {
      method: 'POST',
    });
    const blocked = await csrf.apply(postReq, makeResponse());
    expect(blocked.status).toBe(403);
  });

  it('accepts valid token and rotates on unsafe', async () => {
    const csrf = createEdgeCsrf({ protectPaths: [/^\//] });
    // Bootstrap via safe
    const bootReq = makeRequest('https://example.com/api/test', {
      method: 'GET',
    });
    const res = await csrf.apply(bootReq, makeResponse());
    const token = res.headers.get(csrf.config.headerName)!;
    const secretCookie = res.cookies.get(csrf.config.cookieNames.secret)!.value;

    // Build unsafe request with token + cookie
    const postReq = makeRequest('http://127.0.0.1:3000/api/test', {
      method: 'POST',
      headers: {
        [csrf.config.headerName]: token,
        origin: 'http://127.0.0.1:3000',
        referer: 'http://127.0.0.1:3000/some-page',
        host: '127.0.0.1:3000',
        'x-forwarded-proto': 'http',
      },
      cookies: { [csrf.config.cookieNames.secret]: secretCookie },
    });

    const ok = await csrf.apply(postReq, makeResponse());
    expect(ok.status).toBe(200);
    // Should set a new token header
    expect(ok.headers.get(csrf.config.headerName)).toBeTruthy();
  });
});
