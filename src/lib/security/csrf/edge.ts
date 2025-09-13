import {
  atou,
  createSecret,
  createToken,
  utoa,
  verifyToken,
} from '@edge-csrf/core';
import { NextRequest, NextResponse } from 'next/server';

import { isSameOrigin } from '@/lib/security/origin';

import { CsrfConfig, defaultCsrfConfig, pathIsProtected } from './config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getCookie(req: NextRequest, name: string): string | undefined {
  return req.cookies.get(name)?.value;
}

function setCookie(
  res: NextResponse,
  name: string,
  value: string,
  cfg: CsrfConfig,
  overrides?: Partial<Parameters<NextResponse['cookies']['set']>[2]>,
) {
  res.cookies.set(name, value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cfg.secureCookies,
    path: '/',
    ...overrides,
  });
}

async function mintSecret(cfg: CsrfConfig): Promise<Uint8Array> {
  return createSecret(cfg.secretBytes);
}

async function mintTokenString(
  secret: Uint8Array,
  cfg: CsrfConfig,
): Promise<string> {
  const token = await createToken(secret, cfg.saltBytes);
  return utoa(token);
}

function nowMs(): number {
  return Date.now();
}

function shouldRotate(
  iatMs: number | null | undefined,
  cfg: CsrfConfig,
): boolean {
  if (!iatMs || Number.isNaN(iatMs)) return true; // missing or invalid timestamp
  return nowMs() - iatMs >= cfg.rotateAfterMs;
}

function readSecretFromCookie(
  req: NextRequest,
  cfg: CsrfConfig,
): Uint8Array | null {
  const s = getCookie(req, cfg.cookieNames.secret);
  if (!s) return null;
  try {
    return atou(s);
  } catch {
    return null;
  }
}

function readIatFromCookie(req: NextRequest, cfg: CsrfConfig): number | null {
  const v = getCookie(req, cfg.cookieNames.iat);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export type EdgeCsrf = {
  apply: (req: NextRequest, res: NextResponse) => Promise<NextResponse>;
  issueForRoute: (req: NextRequest) => Promise<NextResponse>;
  config: CsrfConfig;
};

export function createEdgeCsrf(userCfg?: Partial<CsrfConfig>): EdgeCsrf {
  const cfg: CsrfConfig = { ...defaultCsrfConfig(), ...userCfg };

  async function ensureSecret(
    req: NextRequest,
    res: NextResponse,
  ): Promise<Uint8Array> {
    let secret = readSecretFromCookie(req, cfg);
    const iat = readIatFromCookie(req, cfg);

    if (!secret || shouldRotate(iat, cfg)) {
      secret = await mintSecret(cfg);
      setCookie(res, cfg.cookieNames.secret, utoa(secret), cfg);
      setCookie(res, cfg.cookieNames.iat, String(nowMs()), cfg);
    }
    return secret;
  }

  async function issueTokenForRequest(
    req: NextRequest,
    res: NextResponse,
  ): Promise<string> {
    const secret = await ensureSecret(req, res);
    const tokenStr = await mintTokenString(secret, cfg);
    // Expose token via header for convenience
    res.headers.set(cfg.headerName, tokenStr);
    // Avoid caching token-bearing responses
    res.headers.set('cache-control', 'no-store');
    return tokenStr;
  }

  async function verifyUnsafe(req: NextRequest): Promise<boolean> {
    const headerToken =
      cfg.acceptHeaderNames
        .map((h) => req.headers.get(h))
        .find((v) => typeof v === 'string' && v.length > 0) || null;

    if (!headerToken) return false;

    const secret = readSecretFromCookie(req, cfg);
    if (!secret) return false;

    try {
      const token = atou(headerToken);
      return await verifyToken(token, secret);
    } catch {
      return false;
    }
  }

  async function apply(
    req: NextRequest,
    res: NextResponse,
  ): Promise<NextResponse> {
    // Skip applying CSRF on the token-issuance endpoint to avoid double-minting
    const p = req.nextUrl.pathname;
    if (p.startsWith('/api/security/csrf')) return res;

    // Only protect configured paths
    if (!pathIsProtected(req, cfg)) return res;

    if (SAFE_METHODS.has(req.method)) {
      await issueTokenForRequest(req, res);
      return res;
    }

    // Defense-in-depth: enforce same-origin for unsafe methods
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { status: 'server_error', error: 'Cross-origin forbidden' },
        { status: 403 },
      );
    }

    const ok = await verifyUnsafe(req);
    if (!ok) {
      return NextResponse.json(
        { status: 'server_error', error: 'Invalid or missing CSRF token' },
        { status: 403 },
      );
    }

    // On successful unsafe request: rotate secret immediately to prevent replay
    const rotated = NextResponse.next({ request: { headers: req.headers } });
    // Force rotation: mint a brand-new secret and set cookies
    const newSecret = await mintSecret(cfg);
    setCookie(rotated, cfg.cookieNames.secret, utoa(newSecret), cfg);
    setCookie(rotated, cfg.cookieNames.iat, String(nowMs()), cfg);
    const tokenStr = await mintTokenString(newSecret, cfg);
    rotated.headers.set(cfg.headerName, tokenStr);

    // Merge existing response headers/cookies into rotated one
    for (const [k, v] of res.headers.entries()) rotated.headers.set(k, v);
    for (const c of res.cookies.getAll()) {
      // Preserve freshly rotated CSRF cookies; don't overwrite them
      if (c.name === cfg.cookieNames.secret || c.name === cfg.cookieNames.iat)
        continue;
      rotated.cookies.set(c);
    }

    return rotated;
  }

  async function issueForRoute(req: NextRequest): Promise<NextResponse> {
    // Use a staging response to set cookies via ensureSecret
    const staging = NextResponse.json(
      { status: 'ok', data: { token: '' } },
      { status: 200 },
    );
    const secret = await ensureSecret(req, staging);
    const token = await mintTokenString(secret, cfg);

    // Create final response with token in both header and body
    const finalRes = NextResponse.json(
      { status: 'ok', data: { token } },
      {
        status: 200,
        headers: { [cfg.headerName]: token, 'cache-control': 'no-store' },
      },
    );
    // Carry over cookies set on staging to the final response
    for (const c of staging.cookies.getAll()) finalRes.cookies.set(c);

    return finalRes;
  }

  return { apply, issueForRoute, config: cfg };
}
