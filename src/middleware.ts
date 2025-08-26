// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// 🔐 Redis setup - with fallback for missing or invalid credentials
const isValidRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Check if both values exist and are not dummy/test values
  return (
    url &&
    token &&
    url !== 'https://dummy.upstash.io' &&
    token !== 'dummy' &&
    url.startsWith('https://') &&
    token.length > 10 // Basic validation for token length
  );
};

const redis = isValidRedisConfig()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache the Redis availability check to avoid repeated validation
const REDIS_AVAILABLE = redis !== null;

// Only log the warning once during startup, not on every request
if (!REDIS_AVAILABLE && process.env.NODE_ENV !== 'test') {
  console.warn(
    'Redis not configured or using dummy credentials, skipping rate limiting',
  );
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';

  let response = NextResponse.next();

  // 🛡️ Rate limiting - only if Redis is available
  if (REDIS_AVAILABLE) {
    try {
      // Route-specific rate limits
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

      response = success
        ? NextResponse.next()
        : new NextResponse('Rate limit exceeded', {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          });
    } catch (error) {
      // If rate limiting fails, log the error but continue without rate limiting
      console.warn('Rate limiting failed:', error);
      response = NextResponse.next();
    }
  }
  // Note: Redis not available, rate limiting skipped (warning logged at startup)

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
