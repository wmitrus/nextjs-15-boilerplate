import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from './env';

import type { Duration } from '@upstash/ratelimit';

// Initialize Redis client only if Upstash is configured
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;

// Create rate limiters for different use cases
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
      prefix: 'ratelimit:login',
    })
  : undefined;

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        env.API_RATE_LIMIT_REQUESTS,
        env.API_RATE_LIMIT_WINDOW as Duration,
      ),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : undefined;

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

// Rate limit check function
export async function checkRateLimit(
  rateLimit: typeof loginRateLimit,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  if (!rateLimit) {
    // If rate limiting is not configured, allow all requests
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }

  const result = await rateLimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset), // Convert Unix timestamp to Date
  };
}
