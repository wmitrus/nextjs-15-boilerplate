import { NextRequest } from 'next/server';

import { TenantResponseData } from '@/lib/api/tenant';
import {
  createServerErrorResponse,
  createSuccessResponse,
} from '@/lib/responseService';

import type { Tenant } from '@/lib/multi-tenant/types';

// Mock tenant database - in a real app, this would be a database
const mockTenants: Record<string, Tenant> = {
  'tenant-123': {
    id: 'tenant-123',
    name: 'Test Tenant',
    domain: 'test.example.com',
    subdomain: 'test',
    settings: {
      branding: {
        logo: '/logos/test-tenant.png',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es'],
        timezone: 'UTC',
      },
      security: {
        allowedDomains: ['test.example.com'],
        requireMfa: false,
        sessionTimeout: 3600,
      },
    },
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['stripe', 'mailchimp'],
      maxUsers: 100,
      storageLimit: 10737418240, // 10GB in bytes
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  current: {
    id: 'default',
    name: 'Default Tenant',
    domain: 'example.com',
    subdomain: undefined,
    settings: {
      branding: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'UTC',
      },
      security: {
        requireMfa: false,
        sessionTimeout: 1800,
      },
    },
    features: {
      analytics: false,
      customBranding: false,
      apiAccess: false,
      advancedReporting: false,
      integrations: [],
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const { tenantId } = await params;

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
    console.error('Tenant API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServerErrorResponse(`Failed to fetch tenant: ${errorMessage}`);
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
