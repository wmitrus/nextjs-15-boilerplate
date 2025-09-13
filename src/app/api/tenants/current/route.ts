import { headers } from 'next/headers';

import { TenantResponseData } from '@/lib/api/tenant';
import { env } from '@/lib/env';
import {
  createServerErrorResponse,
  createSuccessResponse,
} from '@/lib/responseService';

import type { Tenant } from '@/lib/multi-tenant/types';

// Mock tenant database - REPLACE WITH REAL DATABASE IN PRODUCTION
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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

export async function GET() {
  try {
    // Get tenant ID from headers (set by middleware)
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id') || env.DEFAULT_TENANT_ID;

    // SECURITY: Validate tenant ID format
    if (!tenantId || typeof tenantId !== 'string' || tenantId.length > 100) {
      return createServerErrorResponse('Invalid tenant ID', 400);
    }

    // SECURITY: Sanitize tenant ID (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      return createServerErrorResponse('Invalid tenant ID format', 400);
    }

    // Find tenant in mock database
    const tenant = mockTenants[tenantId];

    if (!tenant) {
      return createServerErrorResponse(`Tenant not found: ${tenantId}`, 404);
    }

    const responseData: TenantResponseData = {
      tenant,
    };

    return createSuccessResponse(responseData);
  } catch (error: unknown) {
    console.error('Current tenant API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(
      `Failed to fetch current tenant: ${errorMessage}`,
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return createServerErrorResponse('Method not allowed', 405);
}

export async function PUT() {
  return createServerErrorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return createServerErrorResponse('Method not allowed', 405);
}
