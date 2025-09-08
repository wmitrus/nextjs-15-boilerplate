import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';
import { apiRateLimit, checkRateLimit, getClientIP } from '@/lib/rate-limit';

// Create the tenant middleware
const tenantMiddleware = createTenantMiddleware();

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // First apply tenant middleware
  const tenantResponse = tenantMiddleware(request);

  // If tenant middleware returns a response (redirect, etc.), use it
  if (tenantResponse && tenantResponse !== NextResponse.next()) {
    return tenantResponse;
  }

  // Apply rate limiting to API routes (excluding Clerk auth routes)
  if (
    request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.includes('clerk')
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

  // Add security headers for authentication routes
  const response = NextResponse.next();

  if (
    request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/sign-up') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('clerk')
  ) {
    // Add additional security headers for auth routes
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
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
