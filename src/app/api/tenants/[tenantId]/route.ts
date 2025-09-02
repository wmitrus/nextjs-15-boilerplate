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
      theme: 'light',
      features: ['feature1', 'feature2'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  current: {
    id: 'default',
    name: 'Default Tenant',
    domain: 'example.com',
    subdomain: null,
    settings: {
      theme: 'light',
      features: ['feature1'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const { tenantId } = params;

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
