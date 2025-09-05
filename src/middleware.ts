import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';

// Create the tenant middleware
const tenantMiddleware = createTenantMiddleware();

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // First apply tenant middleware
  const tenantResponse = tenantMiddleware(request);

  // If tenant middleware returns a response (redirect, etc.), use it
  if (tenantResponse && tenantResponse !== NextResponse.next()) {
    return tenantResponse;
  }

  // Continue with Clerk's default behavior
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
