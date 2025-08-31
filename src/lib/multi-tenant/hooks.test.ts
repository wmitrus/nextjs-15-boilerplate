import { headers } from 'next/headers';

import {
  getTenantContext,
  getCurrentTenant,
  getTenantId,
  getTenantDatabaseUrl,
  getTenantCacheKey,
  isTenantFeatureEnabled,
} from './hooks';

import type { Tenant } from './types';

// Mock all dependencies to ensure complete isolation
jest.mock('next/headers');

const mockHeaders = headers as jest.MockedFunction<typeof headers>;

// Mock the env module
jest.mock('../env', () => ({
  env: {
    MULTI_TENANT_ENABLED: true,
    DEFAULT_TENANT_ID: 'default',
    DATABASE_URL: 'postgresql://localhost:5432/testdb',
  },
}));

describe('Multi-Tenant Hooks', () => {
  let mockHeadersList: jest.Mocked<Headers>;

  const mockDefaultTenant: Tenant = {
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
  };

  const mockPreviewTenant: Tenant = {
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
  };

  beforeEach(() => {
    // Create a mock headers object
    mockHeadersList = {
      get: jest.fn(),
      has: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      append: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      [Symbol.iterator]: jest.fn(),
    } as unknown as jest.Mocked<Headers>;

    // Mock the headers function to return our mock
    mockHeaders.mockResolvedValue(mockHeadersList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantContext', () => {
    it('should return context with default tenant when no headers are present', async () => {
      mockHeadersList.get.mockReturnValue(null);

      const result = await getTenantContext();

      expect(result).toEqual({
        tenant: mockDefaultTenant,
        isMultiTenant: true,
        tenantId: 'default',
        subdomain: undefined,
        domain: undefined,
        error: null,
      });

      expect(mockHeaders).toHaveBeenCalled();
      expect(mockHeadersList.get).toHaveBeenCalledWith('x-tenant-id');
      expect(mockHeadersList.get).toHaveBeenCalledWith('x-tenant-subdomain');
      expect(mockHeadersList.get).toHaveBeenCalledWith('x-tenant-domain');
    });

    it('should return context with tenant from headers', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id':
            return 'preview-tenant';
          case 'x-tenant-subdomain':
            return 'preview';
          case 'x-tenant-domain':
            return 'preview.example.com';
          default:
            return null;
        }
      });

      const result = await getTenantContext();

      expect(result).toEqual({
        tenant: mockPreviewTenant,
        isMultiTenant: true,
        tenantId: 'preview-tenant',
        subdomain: 'preview',
        domain: 'preview.example.com',
        error: null,
      });
    });

    it('should return context with null tenant for unknown tenant ID', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id':
            return 'unknown-tenant';
          case 'x-tenant-subdomain':
            return 'unknown';
          case 'x-tenant-domain':
            return 'unknown.example.com';
          default:
            return null;
        }
      });

      const result = await getTenantContext();

      expect(result).toEqual({
        tenant: null,
        isMultiTenant: true,
        tenantId: 'unknown-tenant',
        subdomain: 'unknown',
        domain: 'unknown.example.com',
        error: null,
      });
    });

    it('should handle partial header information', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id':
            return 'preview-tenant';
          case 'x-tenant-subdomain':
            return null; // Missing subdomain
          case 'x-tenant-domain':
            return 'preview.example.com';
          default:
            return null;
        }
      });

      const result = await getTenantContext();

      expect(result).toEqual({
        tenant: mockPreviewTenant,
        isMultiTenant: true,
        tenantId: 'preview-tenant',
        subdomain: undefined,
        domain: 'preview.example.com',
        error: null,
      });
    });
  });

  describe('getCurrentTenant', () => {
    it('should return the tenant from context', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        return header === 'x-tenant-id' ? 'preview-tenant' : null;
      });

      const result = await getCurrentTenant();

      expect(result).toEqual(mockPreviewTenant);
    });

    it('should return null when tenant is not found', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        return header === 'x-tenant-id' ? 'unknown-tenant' : null;
      });

      const result = await getCurrentTenant();

      expect(result).toBeNull();
    });

    it('should return default tenant when no tenant ID in headers', async () => {
      mockHeadersList.get.mockReturnValue(null);

      const result = await getCurrentTenant();

      expect(result).toEqual(mockDefaultTenant);
    });
  });

  describe('getTenantId', () => {
    it('should return tenant ID from headers', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        return header === 'x-tenant-id' ? 'preview-tenant' : null;
      });

      const result = await getTenantId();

      expect(result).toBe('preview-tenant');
    });

    it('should return default tenant ID when no header present', async () => {
      mockHeadersList.get.mockReturnValue(null);

      const result = await getTenantId();

      expect(result).toBe('default');
    });
  });

  describe('getTenantDatabaseUrl', () => {
    it('should return base URL for default tenant', () => {
      const result = getTenantDatabaseUrl('default');

      expect(result).toBe('postgresql://localhost:5432/testdb');
    });

    it('should return schema-specific URL for non-default tenant', () => {
      const result = getTenantDatabaseUrl('preview-tenant');

      expect(result).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_preview-tenant',
      );
    });

    it('should handle custom tenant IDs', () => {
      const result = getTenantDatabaseUrl('custom-tenant-123');

      expect(result).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_custom-tenant-123',
      );
    });
  });

  describe('getTenantCacheKey', () => {
    it('should generate cache key with tenant ID and key', () => {
      const result = getTenantCacheKey('tenant-123', 'user-data');

      expect(result).toBe('tenant:tenant-123:user-data');
    });

    it('should handle different tenant IDs and keys', () => {
      const result1 = getTenantCacheKey('default', 'settings');
      const result2 = getTenantCacheKey('preview-tenant', 'analytics');
      const result3 = getTenantCacheKey('custom-tenant', 'feature-flags');

      expect(result1).toBe('tenant:default:settings');
      expect(result2).toBe('tenant:preview-tenant:analytics');
      expect(result3).toBe('tenant:custom-tenant:feature-flags');
    });

    it('should handle empty strings', () => {
      const result = getTenantCacheKey('', '');

      expect(result).toBe('tenant::');
    });

    it('should handle special characters in keys', () => {
      const result = getTenantCacheKey('tenant-123', 'user:profile:settings');

      expect(result).toBe('tenant:tenant-123:user:profile:settings');
    });
  });

  describe('isTenantFeatureEnabled', () => {
    it('should return false when tenant is null', () => {
      const result = isTenantFeatureEnabled(null, 'analytics');

      expect(result).toBe(false);
    });

    it('should return true for enabled boolean features', () => {
      const result = isTenantFeatureEnabled(mockDefaultTenant, 'analytics');

      expect(result).toBe(true);
    });

    it('should return false for disabled boolean features', () => {
      const result = isTenantFeatureEnabled(
        mockDefaultTenant,
        'customBranding',
      );

      expect(result).toBe(false);
    });

    it('should return false for non-boolean feature values', () => {
      const result1 = isTenantFeatureEnabled(mockDefaultTenant, 'maxUsers');
      const result2 = isTenantFeatureEnabled(mockDefaultTenant, 'integrations');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should work with different tenants', () => {
      const defaultResult = isTenantFeatureEnabled(
        mockDefaultTenant,
        'customBranding',
      );
      const previewResult = isTenantFeatureEnabled(
        mockPreviewTenant,
        'customBranding',
      );

      expect(defaultResult).toBe(false);
      expect(previewResult).toBe(true);
    });

    it('should handle all boolean feature types', () => {
      const features = [
        'analytics',
        'customBranding',
        'apiAccess',
        'advancedReporting',
      ] as const;

      features.forEach((feature) => {
        const result = isTenantFeatureEnabled(mockPreviewTenant, feature);
        expect(typeof result).toBe('boolean');
        expect(result).toBe(mockPreviewTenant.features[feature]);
      });
    });

    it('should handle tenant with missing features', () => {
      const tenantWithoutFeatures = {
        ...mockDefaultTenant,
        features: {} as Tenant['features'],
      };

      const result = isTenantFeatureEnabled(tenantWithoutFeatures, 'analytics');

      expect(result).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should work with complete tenant resolution flow', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id':
            return 'preview-tenant';
          case 'x-tenant-subdomain':
            return 'preview';
          case 'x-tenant-domain':
            return 'preview.example.com';
          default:
            return null;
        }
      });

      const context = await getTenantContext();
      const tenant = await getCurrentTenant();
      const tenantId = await getTenantId();
      const dbUrl = getTenantDatabaseUrl(tenantId);
      const cacheKey = getTenantCacheKey(tenantId, 'settings');
      const hasAnalytics = isTenantFeatureEnabled(tenant, 'analytics');

      expect(context.tenant).toEqual(mockPreviewTenant);
      expect(context.tenantId).toBe('preview-tenant');
      expect(context.subdomain).toBe('preview');
      expect(context.domain).toBe('preview.example.com');
      expect(tenant).toEqual(mockPreviewTenant);
      expect(tenantId).toBe('preview-tenant');
      expect(dbUrl).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_preview-tenant',
      );
      expect(cacheKey).toBe('tenant:preview-tenant:settings');
      expect(hasAnalytics).toBe(true);
    });

    it('should handle unknown tenant gracefully', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        return header === 'x-tenant-id' ? 'unknown-tenant' : null;
      });

      const context = await getTenantContext();
      const tenant = await getCurrentTenant();
      const tenantId = await getTenantId();
      const dbUrl = getTenantDatabaseUrl(tenantId);
      const cacheKey = getTenantCacheKey(tenantId, 'settings');
      const hasAnalytics = isTenantFeatureEnabled(tenant, 'analytics');

      expect(context.tenant).toBeNull();
      expect(context.tenantId).toBe('unknown-tenant');
      expect(tenant).toBeNull();
      expect(tenantId).toBe('unknown-tenant');
      expect(dbUrl).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_unknown-tenant',
      );
      expect(cacheKey).toBe('tenant:unknown-tenant:settings');
      expect(hasAnalytics).toBe(false);
    });

    it('should handle concurrent requests correctly', async () => {
      mockHeadersList.get.mockImplementation((header: string) => {
        return header === 'x-tenant-id' ? 'preview-tenant' : null;
      });

      const [context1, context2, tenant1, tenant2, tenantId1, tenantId2] =
        await Promise.all([
          getTenantContext(),
          getTenantContext(),
          getCurrentTenant(),
          getCurrentTenant(),
          getTenantId(),
          getTenantId(),
        ]);

      expect(context1).toEqual(context2);
      expect(tenant1).toEqual(tenant2);
      expect(tenantId1).toBe(tenantId2);
      expect(tenantId1).toBe('preview-tenant');
    });
  });
});
