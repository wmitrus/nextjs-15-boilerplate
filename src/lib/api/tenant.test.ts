/**
 * @fileoverview Tests for Tenant API Service
 */

import { apiClient } from './client';
import { TenantApiService, tenantApi } from './tenant';

import type {
  Tenant,
  TenantSettings,
  TenantFeatures,
} from '@/lib/multi-tenant/types';

// Mock the API client
jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TenantApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a mock tenant
  const createMockTenant = (id: string): Tenant => ({
    id,
    name: `Test Tenant ${id}`,
    domain: `${id}.example.com`,
    subdomain: id,
    customDomain: `custom-${id}.com`,
    settings: {
      branding: {
        logo: '/logo.png',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        favicon: '/favicon.ico',
        customCss: '.custom { color: blue; }',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr'],
        timezone: 'America/New_York',
      },
      security: {
        allowedDomains: ['example.com', 'test.com'],
        requireMfa: true,
        sessionTimeout: 3600,
      },
    } as TenantSettings,
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['stripe', 'mailchimp'],
      maxUsers: 100,
      storageLimit: 1000000000,
    } as TenantFeatures,
    metadata: {
      region: 'us-east',
      plan: 'premium',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T12:30:00Z'),
  });

  describe('getTenant', () => {
    it('should make successful GET request for specific tenant', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = createMockTenant(tenantId);
      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: mockTenant,
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await TenantApiService.getTenant(tenantId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/tenants/${tenantId}`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle different tenant ID formats', async () => {
      const testCases = [
        'simple-tenant',
        'tenant_with_underscores',
        'tenant-with-numbers-123',
        'UPPERCASE-TENANT',
        'mixed-Case-Tenant',
      ];

      for (const tenantId of testCases) {
        const mockTenant = createMockTenant(tenantId);
        const mockResponse = {
          status: 'ok' as const,
          data: {
            tenant: mockTenant,
          },
        };

        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        await TenantApiService.getTenant(tenantId);

        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/api/tenants/${tenantId}`,
        );
      }

      expect(mockApiClient.get).toHaveBeenCalledTimes(testCases.length);
    });

    it('should handle getTenant error responses', async () => {
      const tenantId = 'nonexistent-tenant';
      const mockError = {
        status: 'server_error' as const,
        error: 'Tenant not found',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await TenantApiService.getTenant(tenantId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/tenants/${tenantId}`,
      );
      expect(result).toEqual(mockError);
    });

    it('should handle network errors for getTenant', async () => {
      const tenantId = 'tenant-456';
      const mockError = {
        status: 'server_error' as const,
        error: 'Network timeout',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await TenantApiService.getTenant(tenantId);

      expect(result).toEqual(mockError);
    });
  });

  describe('getCurrentTenant', () => {
    it('should make successful GET request for current tenant', async () => {
      const mockTenant = createMockTenant('current-tenant');
      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: mockTenant,
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await TenantApiService.getCurrentTenant();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tenants/current');
      expect(result).toEqual(mockResponse);
    });

    it('should handle current tenant with minimal settings', async () => {
      const minimalTenant: Tenant = {
        id: 'minimal-tenant',
        name: 'Minimal Tenant',
        settings: {
          branding: {},
          localization: {
            defaultLanguage: 'en',
            supportedLanguages: ['en'],
            timezone: 'UTC',
          },
          security: {},
        } as TenantSettings,
        features: {
          analytics: false,
          customBranding: false,
          apiAccess: false,
          advancedReporting: false,
          integrations: [],
        } as TenantFeatures,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: minimalTenant,
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await TenantApiService.getCurrentTenant();

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('ok');

      // Type assertion after status check
      const successResult = result as Extract<typeof result, { status: 'ok' }>;
      expect(successResult.data.tenant.settings.branding).toEqual({});
      expect(successResult.data.tenant.features.integrations).toEqual([]);
    });

    it('should handle getCurrentTenant error responses', async () => {
      const mockError = {
        status: 'server_error' as const,
        error: 'Current tenant not found',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await TenantApiService.getCurrentTenant();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tenants/current');
      expect(result).toEqual(mockError);
    });

    it('should handle unauthorized access to current tenant', async () => {
      const mockError = {
        status: 'server_error' as const,
        error: 'Unauthorized',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await TenantApiService.getCurrentTenant();

      expect(result).toEqual(mockError);
    });
  });

  describe('convenience functions', () => {
    it('should have tenantApi.getTenant pointing to service method', () => {
      expect(tenantApi.getTenant).toBe(TenantApiService.getTenant);
    });

    it('should have tenantApi.getCurrentTenant pointing to service method', () => {
      expect(tenantApi.getCurrentTenant).toBe(
        TenantApiService.getCurrentTenant,
      );
    });

    it('should work correctly through convenience functions', async () => {
      const tenantId = 'test-tenant';
      const mockTenant = createMockTenant(tenantId);
      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: mockTenant,
        },
      };

      // Test getTenant convenience function
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const getTenantResult = await tenantApi.getTenant(tenantId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/tenants/${tenantId}`,
      );
      expect(getTenantResult).toEqual(mockResponse);

      // Test getCurrentTenant convenience function
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const getCurrentTenantResult = await tenantApi.getCurrentTenant();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tenants/current');
      expect(getCurrentTenantResult).toEqual(mockResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in tenant ID', async () => {
      const specialTenantIds = [
        'tenant-with-dashes',
        'tenant_with_underscores',
        'tenant.with.dots',
        'tenant123',
        'TENANT-UPPERCASE',
      ];

      for (const tenantId of specialTenantIds) {
        const mockTenant = createMockTenant(tenantId);
        const mockResponse = {
          status: 'ok' as const,
          data: {
            tenant: mockTenant,
          },
        };

        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        await TenantApiService.getTenant(tenantId);

        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/api/tenants/${tenantId}`,
        );
      }
    });

    it('should handle tenant with complex nested data', async () => {
      const complexTenant: Tenant = {
        id: 'complex-tenant',
        name: 'Complex Tenant with Unicode 🏢',
        domain: 'complex-tenant.example.com',
        subdomain: 'complex',
        customDomain: 'custom.complex-tenant.org',
        settings: {
          branding: {
            logo: 'https://cdn.example.com/logos/complex-tenant.svg',
            primaryColor: '#ff6b35',
            secondaryColor: '#004e89',
            favicon:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            customCss: `
              .tenant-theme {
                --primary: #ff6b35;
                --secondary: #004e89;
              }
            `,
          },
          localization: {
            defaultLanguage: 'en-US',
            supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'],
            timezone: 'America/Los_Angeles',
          },
          security: {
            allowedDomains: [
              '*.complex-tenant.com',
              'partner1.example.org',
              'partner2.test.net',
            ],
            requireMfa: true,
            sessionTimeout: 7200,
          },
        } as TenantSettings,
        features: {
          analytics: true,
          customBranding: true,
          apiAccess: true,
          advancedReporting: true,
          integrations: [
            'google-analytics',
            'stripe',
            'mailchimp',
            'salesforce',
            'slack',
          ],
          maxUsers: 1000,
          storageLimit: 10737418240, // 10GB
        } as TenantFeatures,
        metadata: {
          region: 'us-west-2',
          plan: 'enterprise',
          customField1: 'value1',
          customField2: { nested: { data: true } },
          tags: ['premium', 'high-volume', 'analytics-heavy'],
        },
        createdAt: new Date('2023-06-15T08:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:30Z'),
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: complexTenant,
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await TenantApiService.getTenant('complex-tenant');

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('ok');

      // Type assertion after status check
      const successResult = result as Extract<typeof result, { status: 'ok' }>;
      expect(successResult.data.tenant.name).toContain('🏢');
      expect(successResult.data.tenant.features.integrations).toHaveLength(5);
      expect(successResult.data.tenant.metadata?.tags).toEqual([
        'premium',
        'high-volume',
        'analytics-heavy',
      ]);
    });

    it('should handle empty tenant ID as string', async () => {
      const mockError = {
        status: 'server_error' as const,
        error: 'Invalid tenant ID',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await TenantApiService.getTenant('');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tenants/');
      expect(result).toEqual(mockError);
    });

    it('should handle very long tenant ID', async () => {
      const longTenantId = 'a'.repeat(200);
      const mockTenant = createMockTenant(longTenantId);
      const mockResponse = {
        status: 'ok' as const,
        data: {
          tenant: mockTenant,
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      await TenantApiService.getTenant(longTenantId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/tenants/${longTenantId}`,
      );
    });
  });
});
