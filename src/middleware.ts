import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';
import { apiRateLimit, checkRateLimit, getClientIP } from '@/lib/rate-limit';
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

  // Generate a per-request nonce and CSP
  const nonce = createNonce();
  const csp = buildCSP(nonce, { isAuthOrClerkRoute });

  // First apply tenant middleware
  const tenantResponse = tenantMiddleware(request);

  // If tenant middleware returns a response (redirect, etc.), attach security headers and return it
  if (tenantResponse && tenantResponse !== NextResponse.next()) {
    tenantResponse.headers.set('Content-Security-Policy', csp);
    tenantResponse.headers.set(NONCE_HEADER, nonce);
    tenantResponse.headers.set(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
    tenantResponse.headers.set('X-Content-Type-Options', 'nosniff');
    if (isAuthOrClerkRoute) {
      tenantResponse.headers.set('X-Frame-Options', 'DENY');
      tenantResponse.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()',
      );
    }
    return tenantResponse;
  }

  // Apply rate limiting to API routes (excluding Clerk auth routes)
  if (
    pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.includes('clerk')
  ) {
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(apiRateLimit, clientIP);

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
  }

  // Continue the chain, forwarding nonce via request headers for server components
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(NONCE_HEADER, nonce);
  let response = NextResponse.next({ request: { headers: forwardedHeaders } });

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
