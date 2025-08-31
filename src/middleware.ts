import { NextRequest } from 'next/server';

import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';

// Create the tenant middleware
const tenantMiddleware = createTenantMiddleware();

export function middleware(request: NextRequest) {
  // Apply tenant middleware
  return tenantMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
