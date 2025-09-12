import type { NextRequest } from 'next/server';

export type CsrfConfig = {
  headerName: string;
  acceptHeaderNames: string[];
  cookiePrefix: string;
  cookieNames: {
    secret: string;
    iat: string; // issued-at ms timestamp
  };
  secretBytes: number;
  saltBytes: number;
  rotateAfterMs: number; // rotate secret after this age on safe requests
  secureCookies: boolean;
  protectPaths: RegExp[]; // only apply CSRF to matching paths
};

export function defaultCsrfConfig(): CsrfConfig {
  const secure = process.env.NODE_ENV === 'production';
  const headerName = process.env.CSRF_HEADER_NAME || 'x-csrf-token';
  const accept = (
    process.env.CSRF_ACCEPT_HEADERS || 'x-csrf-token,x-xsrf-token'
  )
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const cookiePrefix = process.env.CSRF_COOKIE_PREFIX || '';

  const rotateAfterMs = parseInt(process.env.CSRF_ROTATE_AFTER_MS || '', 10);

  return {
    headerName,
    acceptHeaderNames: accept.length ? accept : [headerName, 'x-xsrf-token'],
    cookiePrefix,
    cookieNames: {
      secret: `${cookiePrefix}csrf-secret`,
      iat: `${cookiePrefix}csrf-iat`,
    },
    secretBytes: parseInt(process.env.CSRF_SECRET_BYTES || '', 10) || 32,
    saltBytes: parseInt(process.env.CSRF_SALT_BYTES || '', 10) || 32,
    rotateAfterMs: Number.isFinite(rotateAfterMs)
      ? rotateAfterMs
      : 24 * 60 * 60 * 1000, // 24h
    secureCookies:
      (process.env.CSRF_SECURE_COOKIES || '').toLowerCase() === 'true'
        ? true
        : secure,
    protectPaths: [
      // Only protect API routes by default
      /^\/api(\/|$)/,
    ],
  };
}

export function pathIsProtected(req: NextRequest, cfg: CsrfConfig): boolean {
  const p = req.nextUrl.pathname;
  return cfg.protectPaths.some((re) => re.test(p));
}
