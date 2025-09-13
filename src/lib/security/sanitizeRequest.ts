import { NextRequest } from 'next/server';

import { sanitizeInput } from './sanitize';

/**
 * Utility to safely parse and sanitize JSON request bodies.
 * - Returns sanitized object
 * - On invalid JSON, returns null
 */
export async function parseAndSanitizeJson<T = Record<string, unknown>>(
  request: NextRequest,
): Promise<T | null> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return {} as T;

  try {
    const data = (await request.json()) as unknown;
    return deepSanitize(data) as T;
  } catch {
    return null;
  }
}

function deepSanitize(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeInput(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepSanitize(v);
    }
    return out;
  }
  return value;
}
