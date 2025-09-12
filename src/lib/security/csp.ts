// Edge runtime-safe: no Node.js modules
import { NextResponse } from 'next/server';

export const NONCE_HEADER = 'x-nonce';

export function createNonce(): string {
  // Prefer Web Crypto API (Edge/modern Node)
  const g: Crypto | undefined = (globalThis as typeof globalThis).crypto;

  // Best: random 128-bit and base64-encode
  if (g?.getRandomValues) {
    const bytes = new Uint8Array(16);
    g.getRandomValues(bytes);
    let binary = '';
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // Fallback: derive bytes from UUID and base64-encode
  if (g?.randomUUID) {
    const hex = g.randomUUID().replace(/-/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    let binary = '';
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // Last-resort fallback without Node APIs (non-cryptographic)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildCSP(
  nonce: string,
  opts?: { isAuthOrClerkRoute?: boolean },
) {
  const { isAuthOrClerkRoute = false } = opts || {};

  // Allow Next.js framework, nonce-based inline, and strict-dynamic
  // Expand for Clerk routes to permit their domains and iframes
  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = !isDev;

  // Allowlist additions via env (comma-separated)
  const allowExtra = (v?: string) =>
    v
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const extraScript = allowExtra(process.env.NEXT_PUBLIC_CSP_SCRIPT_EXTRA);
  const extraConnect = allowExtra(process.env.NEXT_PUBLIC_CSP_CONNECT_EXTRA);
  const extraFrame = allowExtra(process.env.NEXT_PUBLIC_CSP_FRAME_EXTRA);
  const extraStyle = allowExtra(process.env.NEXT_PUBLIC_CSP_STYLE_EXTRA);
  const extraImg = allowExtra(process.env.NEXT_PUBLIC_CSP_IMG_EXTRA);
  const extraFont = allowExtra(process.env.NEXT_PUBLIC_CSP_FONT_EXTRA);

  // Known third-party domains (applied only where relevant)
  const clerkDomains = isAuthOrClerkRoute
    ? ['https://*.clerk.com', 'https://*.clerk.services']
    : [];

  const hasThirdPartyScripts =
    (isAuthOrClerkRoute && true) || extraScript.length > 0;

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    // Use 'strict-dynamic' only when no third-party script hosts are configured
    !hasThirdPartyScripts ? "'strict-dynamic'" : '',
    // Loosen only for dev tooling
    isDev ? "'unsafe-eval'" : '',
    isDev ? "'wasm-unsafe-eval'" : '',
    // Allow Clerk scripts on auth-related routes only
    ...(isAuthOrClerkRoute
      ? [
          'https://js.clerk.com',
          'https://*.clerk.com',
          'https://*.clerk.services',
        ]
      : []),
    ...extraScript,
  ]
    .filter(Boolean)
    .join(' ');

  const styleSrc = [
    "'self'",
    ...(isDev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`]),
    // In production, avoid broad https: and prefer explicit allowlists
    ...(isProd ? [] : ['https:']),
    'data:',
    'blob:',
    ...extraStyle,
  ]
    .filter(Boolean)
    .join(' ');

  const workerSrc = ["'self'", 'blob:', 'data:'].join(' ');
  const childSrc = ["'self'", 'blob:', 'data:'].join(' ');

  const connectSrc = [
    "'self'",
    // In production, avoid broad https: and prefer explicit allowlists
    ...(isProd ? [] : ['https:']),
    // Enable HMR/dev overlay connections
    isDev ? 'ws:' : '',
    isDev ? 'wss:' : '',
    ...extraConnect,
  ]
    .filter(Boolean)
    .join(' ');
  const imgSrc = ["'self'", 'data:', 'blob:', 'https:', ...extraImg].join(' ');
  const fontSrc = ["'self'", 'data:', 'https:', ...extraFont].join(' ');
  const frameSrc = ["'self'", 'https:', ...extraFrame, ...clerkDomains].join(
    ' ',
  );

  return (
    `default-src 'self'; ` +
    `base-uri 'self'; ` +
    `object-src 'none'; ` +
    `frame-ancestors 'none'; ` +
    `upgrade-insecure-requests; ` +
    `script-src ${scriptSrc}; ` +
    `style-src ${styleSrc}; ` +
    // Some browsers use style-src-elem specifically
    `style-src-elem ${styleSrc}; ` +
    `img-src ${imgSrc}; ` +
    `font-src ${fontSrc}; ` +
    `connect-src ${connectSrc}; ` +
    `worker-src ${workerSrc}; ` +
    // Safari/older browsers fallback
    `child-src ${childSrc}; ` +
    `frame-src ${frameSrc};`
  );
}

export function withCSPHeaders(
  request: Request & { nextUrl?: { pathname?: string } },
  response: NextResponse,
) {
  const pathname = request?.nextUrl?.pathname || '';
  const isAuth =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('clerk');

  const nonce = createNonce();
  const csp = buildCSP(nonce, { isAuthOrClerkRoute: isAuth });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set(NONCE_HEADER, nonce);
  // Helpful security headers
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Return a response that also forwards the nonce to the app via request headers
  const forwarded = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // copy headers we already set onto forwarded response
  for (const [k, v] of response.headers.entries()) {
    forwarded.headers.set(k, v);
  }

  // Attach nonce to request headers so server components can read it
  forwarded.headers.set(NONCE_HEADER, nonce);

  return forwarded;
}
