// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// 🔐 Redis setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';

  // 🛡️ Route-specific rate limits
  let limiterConfig;
  if (path.startsWith('/api/login')) {
    limiterConfig = Ratelimit.slidingWindow(5, '30 s'); // stricter for login
  } else if (path.startsWith('/api/contact')) {
    limiterConfig = Ratelimit.slidingWindow(3, '60 s'); // very strict
  } else {
    limiterConfig = Ratelimit.slidingWindow(20, '10 s'); // general API
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: limiterConfig,
    analytics: true,
  });

  const key = `${path}:${ip}`;
  const { success, limit, remaining, reset } = await ratelimit.limit(key);

  const response = success
    ? NextResponse.next()
    : new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });

  // ✅ Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );

  return response;
}

// 🔍 Apply to all non-static routes
export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
