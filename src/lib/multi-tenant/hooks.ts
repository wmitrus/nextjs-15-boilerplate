import { headers } from 'next/headers';

import { env } from '../env';

import type { Tenant, TenantContext } from './types';

// Server-side tenant resolution
export async function getTenantContext(): Promise<TenantContext> {
  if (!env.MULTI_TENANT_ENABLED) {
    return {
      tenant: null,
      isMultiTenant: false,
      tenantId: env.DEFAULT_TENANT_ID,
      domain: undefined,
      subdomain: undefined,
      error: null,
    };
  }

  const headersList = await headers();
  return getTenantContextWithHeaders(headersList);
}

// Version that accepts headers for caching
export async function getTenantContextWithHeaders(
  headersList: Headers,
): Promise<TenantContext> {
  if (!env.MULTI_TENANT_ENABLED) {
    return {
      tenant: null,
      isMultiTenant: false,
      tenantId: env.DEFAULT_TENANT_ID,
      domain: undefined,
      subdomain: undefined,
      error: null,
    };
  }

  const tenantId = headersList.get('x-tenant-id') || env.DEFAULT_TENANT_ID;
  const subdomain = headersList.get('x-tenant-subdomain') || undefined;
  const domain = headersList.get('x-tenant-domain') || undefined;

  // In a real implementation, you would fetch tenant data from a database
  const tenant = await fetchTenant(tenantId);

  return {
    tenant,
    isMultiTenant: env.MULTI_TENANT_ENABLED,
    tenantId,
    subdomain,
    domain,
    error: null,
  };
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const context = await getTenantContext();
  return context.tenant;
}

export async function getTenantId(): Promise<string> {
  const context = await getTenantContext();
  return context.tenantId;
}

// Mock function - replace with actual database query
async function fetchTenant(tenantId: string): Promise<Tenant | null> {
  // SECURITY: Validate tenant ID before database query
  if (!isValidTenantId(tenantId)) {
    console.warn(`Invalid tenant ID attempted: ${tenantId}`);
    return null;
  }

  // This is a mock implementation
  // In a real app, you would query your database
  const mockTenants: Record<string, Tenant> = {
    default: {
      id: 'default',
      name: 'Default Tenant',
      settings: {
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
        },
        localization: {
          defaultLanguage: 'en',
          supportedLanguages: ['en'],
          timezone: 'UTC',
        },
        security: {
          requireMfa: false,
          sessionTimeout: 3600,
        },
      },
      features: {
        analytics: true,
        customBranding: false,
        apiAccess: true,
        advancedReporting: false,
        integrations: ['basic'],
        maxUsers: 100,
        storageLimit: 1000,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    'preview-tenant': {
      id: 'preview-tenant',
      name: 'Preview Tenant',
      subdomain: 'preview',
      settings: {
        branding: {
          primaryColor: '#f59e0b',
          secondaryColor: '#64748b',
        },
        localization: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          timezone: 'UTC',
        },
        security: {
          requireMfa: false,
          sessionTimeout: 3600,
        },
      },
      features: {
        analytics: true,
        customBranding: true,
        apiAccess: true,
        advancedReporting: true,
        integrations: ['basic', 'advanced'],
        maxUsers: 500,
        storageLimit: 5000,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  return mockTenants[tenantId] || null;
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

// Utility functions for tenant-specific operations
export function getTenantDatabaseUrl(tenantId: string): string {
  // SECURITY: Validate tenant ID before generating database URL
  if (!isValidTenantId(tenantId)) {
    console.warn(`Invalid tenant ID for database URL: ${tenantId}`);
    return env.DATABASE_URL || 'postgresql://localhost:5432';
  }

  // In a multi-tenant setup, you might have separate databases per tenant
  // or use schema-based isolation
  const baseUrl = env.DATABASE_URL || 'postgresql://localhost:5432';

  if (tenantId === env.DEFAULT_TENANT_ID) {
    return baseUrl;
  }

  // Example: schema-based isolation
  return `${baseUrl}?schema=tenant_${tenantId}`;
}

export function getTenantCacheKey(tenantId: string, key: string): string {
  // SECURITY: Validate tenant ID before generating cache key
  if (!isValidTenantId(tenantId)) {
    console.warn(`Invalid tenant ID for cache key: ${tenantId}`);
    tenantId = env.DEFAULT_TENANT_ID;
  }

  // SECURITY: Sanitize cache key to prevent injection
  const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `tenant:${tenantId}:${sanitizedKey}`;
}

export function isTenantFeatureEnabled(
  tenant: Tenant | null,
  feature: keyof Tenant['features'],
): boolean {
  if (!tenant) return false;
  const featureValue = tenant.features[feature];
  return typeof featureValue === 'boolean' ? featureValue : false;
}
