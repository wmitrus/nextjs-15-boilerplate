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
  if (headerTenantId && isValidTenantId(headerTenantId)) {
    return {
      tenantId: headerTenantId,
      strategy: 'header',
    };
  }

  // Strategy 2: Subdomain-based resolution
  const host = request.headers.get('host');
  if (host) {
    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && isValidTenantId(subdomain)) {
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
  if (pathMatch && isValidTenantId(pathMatch[1])) {
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

/**
 * SECURITY: Validate tenant ID format to prevent injection attacks
 */
function isValidTenantId(tenantId: string): boolean {
  // Check basic constraints
  if (!tenantId || typeof tenantId !== 'string') {
    return false;
  }

  // Length constraints
  if (tenantId.length < 1 || tenantId.length > 100) {
    return false;
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  // Also reject control characters that could be used for injection
  if (!/^[a-zA-Z0-9_-]+$/.test(tenantId) || /[\r\n\t\0]/.test(tenantId)) {
    return false;
  }

  // Prevent reserved names that could cause conflicts
  const reservedNames = [
    'api',
    'www',
    'admin',
    'root',
    'system',
    'public',
    'private',
    'static',
    'assets',
    'cdn',
    'mail',
    'email',
    'ftp',
    'ssh',
    'localhost',
    'staging',
    'prod',
    'production',
    'dev',
    'development',
  ];

  if (reservedNames.includes(tenantId.toLowerCase())) {
    return false;
  }

  return true;
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
