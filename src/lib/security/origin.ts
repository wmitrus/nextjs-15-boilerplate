import type { NextRequest } from 'next/server';

function configuredOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

export function isSameOrigin(req: NextRequest): boolean {
  // Prefer Origin; fall back to Referer’s origin
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  let candidate = origin;

  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = '';
    }
  }

  if (!candidate) return false;

  // If configured, compare with explicit origin
  const expected = configuredOrigin();
  if (expected) return candidate === expected;

  // Fallback: derive from forwarded headers/host
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const derived = host ? `${proto}://${host}` : '';

  return derived ? candidate === derived : false;
}
