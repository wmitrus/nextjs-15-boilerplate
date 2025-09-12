// Simple in-memory rate limiter for local/testing only
// Not for production use. Enabled via TEST_LOCAL_RATE_LIMIT=1

// Map of identifier -> array of timestamps (ms)
const buckets: Map<string, number[]> = new Map();

export type LocalRateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

export function localRateLimit(
  identifier: string,
  limit = Number(process.env.RATE_LIMIT_LOCAL_LIMIT || 3),
  windowMs = Number(process.env.RATE_LIMIT_LOCAL_WINDOW_MS || 2000),
): LocalRateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const arr = buckets.get(identifier) || [];
  // Remove timestamps outside the window
  const recent = arr.filter((ts) => ts >= windowStart);

  if (recent.length >= limit) {
    // Compute next reset time
    const oldest = Math.min(...recent);
    const resetMs = oldest + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(resetMs),
    };
  }

  // Allow and record this request
  recent.push(now);
  buckets.set(identifier, recent);

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    reset: new Date(now + windowMs),
  };
}
