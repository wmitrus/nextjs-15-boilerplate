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
    };
  }

  const headersList = await headers();
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

// Utility functions for tenant-specific operations
export function getTenantDatabaseUrl(tenantId: string): string {
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
  return `tenant:${tenantId}:${key}`;
}

export function isTenantFeatureEnabled(
  tenant: Tenant | null,
  feature: keyof Tenant['features'],
): boolean {
  if (!tenant) return false;
  const featureValue = tenant.features[feature];
  return typeof featureValue === 'boolean' ? featureValue : false;
}
