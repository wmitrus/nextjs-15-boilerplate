// src/middleware.ts
import { NextResponse } from 'next/server';

export function middleware() {
  const response = NextResponse.next();

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

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
