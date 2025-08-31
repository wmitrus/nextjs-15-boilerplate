import { NextRequest, NextResponse } from 'next/server';

import { env } from '../env';

import type { TenantResolutionStrategy } from './types';

export interface TenantResolutionResult {
  tenantId: string;
  strategy: TenantResolutionStrategy;
  domain?: string;
  subdomain?: string;
}

export function resolveTenant(request: NextRequest): TenantResolutionResult {
  if (!env.MULTI_TENANT_ENABLED) {
    return {
      tenantId: env.DEFAULT_TENANT_ID,
      strategy: 'header',
    };
  }

  // Strategy 1: Header-based resolution
  const headerTenantId = request.headers.get(env.TENANT_HEADER_NAME);
  if (headerTenantId) {
    return {
      tenantId: headerTenantId,
      strategy: 'header',
    };
  }

  // Strategy 2: Subdomain-based resolution
  const host = request.headers.get('host');
  if (host) {
    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain !== 'www') {
      return {
        tenantId: subdomain,
        strategy: 'subdomain',
        subdomain,
        domain: host,
      };
    }
  }

  // Strategy 3: Path-based resolution
  const pathname = request.nextUrl.pathname;
  const pathMatch = pathname.match(/^\/tenant\/([^\/]+)/);
  if (pathMatch) {
    return {
      tenantId: pathMatch[1],
      strategy: 'path',
    };
  }

  // Fallback to default tenant
  return {
    tenantId: env.DEFAULT_TENANT_ID,
    strategy: 'header',
  };
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Split by dots
  const parts = hostname.split('.');

  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export function createTenantMiddleware() {
  return function tenantMiddleware(request: NextRequest) {
    // Skip middleware for API routes, static files, and Next.js internals
    if (
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const tenantResolution = resolveTenant(request);

    // Add tenant information to headers for downstream consumption
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenantResolution.tenantId);
    response.headers.set('x-tenant-strategy', tenantResolution.strategy);

    if (tenantResolution.subdomain) {
      response.headers.set('x-tenant-subdomain', tenantResolution.subdomain);
    }

    if (tenantResolution.domain) {
      response.headers.set('x-tenant-domain', tenantResolution.domain);
    }

    return response;
  };
}
