/* eslint-disable testing-library/no-debugging-utils */
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import edgeLogger from '@/lib/logger/edge';
import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';
import { apiRateLimit, checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { localRateLimit } from '@/lib/rate-limit-local';
import { NONCE_HEADER, buildCSP, createNonce } from '@/lib/security';
import { createEdgeCsrf } from '@/lib/security/csrf/edge';

// Instantiate middlewares once
const tenantMiddleware = createTenantMiddleware();
const csrf = createEdgeCsrf();

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const isAuthOrClerkRoute =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('clerk');

  edgeLogger.debug(
    {
      pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent')?.slice(0, 100),
    },
    'Middleware processing request',
  );

  // Short-circuit CORS preflight requests
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    const reqOrigin = request.headers.get('origin') || '';
    if (reqOrigin) {
      res.headers.set('Access-Control-Allow-Origin', reqOrigin);
      res.headers.set('Vary', 'Origin');
    }
    res.headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('access-control-request-headers') || '*',
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    return res;
  }

  // Generate a per-request nonce and CSP
  const nonce = createNonce();
  const csp = buildCSP(nonce, { isAuthOrClerkRoute });

  // First apply tenant middleware (do not short-circuit the pipeline)
  const tenantResponse = tenantMiddleware(request);

  // Apply rate limiting to API routes (excluding Clerk auth routes)
  if (
    process.env.DISABLE_RATE_LIMITING !== 'true' &&
    pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.includes('clerk')
  ) {
    try {
      const clientIP = getClientIP(request);
      const rateLimitResult =
        process.env.TEST_LOCAL_RATE_LIMIT === '1'
          ? localRateLimit(clientIP)
          : await checkRateLimit(apiRateLimit, clientIP);

      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.getTime().toString(),
              'Retry-After': Math.ceil(
                (rateLimitResult.reset.getTime() - Date.now()) / 1000,
              ).toString(),
            },
          },
        );
      }
    } catch (e) {
      // Soft-fail rate limiting on environments that don't support fetch keepalive or when Upstash fails
      edgeLogger.warn(
        {
          error: e,
          clientIP: getClientIP(request),
          pathname,
        },
        '[rate-limit] Soft-failed',
      );
    }
  }

  // Continue the chain, forwarding nonce via request headers for server components
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(NONCE_HEADER, nonce);
  let response = NextResponse.next({ request: { headers: forwardedHeaders } });
  // Merge tenant headers into the main response so downstream can read them
  for (const [k, v] of tenantResponse.headers) {
    if (k.startsWith('x-tenant-')) response.headers.set(k, v);
  }

  // Apply CSRF for protected paths
  response = await csrf.apply(request, response);
  if (response.status === 403) {
    // CSRF blocked the request; return as is (already JSON body)
    return response;
  }

  // Global security headers
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set(NONCE_HEADER, nonce);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // TODO(production): Add Strict-Transport-Security when moving to a custom HTTPS domain.
  // See docs/PRODUCTION_READINESS_CHECKLIST.md for details.

  // Additional hardening for auth-related routes
  if (isAuthOrClerkRoute) {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
