import { headers } from 'next/headers';

import {
  getTenantContext,
  getCurrentTenant,
  getTenantId,
  getTenantDatabaseUrl,
  getTenantCacheKey,
  isTenantFeatureEnabled,
} from './hooks';

// Mock all dependencies to ensure complete isolation
jest.mock('next/headers');

const mockHeaders = headers as jest.MockedFunction<typeof headers>;

// Mock the env module with multi-tenant disabled
jest.mock('../env', () => ({
  env: {
    MULTI_TENANT_ENABLED: false,
    DEFAULT_TENANT_ID: 'default',
    DATABASE_URL: 'postgresql://localhost:5432/testdb',
  },
}));

describe('Multi-Tenant Hooks (Disabled)', () => {
  let mockHeadersList: jest.Mocked<Headers>;

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
    it('should return default context when multi-tenant is disabled', async () => {
      const result = await getTenantContext();

      expect(result).toEqual({
        tenant: null,
        isMultiTenant: false,
        tenantId: 'default',
      });

      // Should not call headers when multi-tenant is disabled
      expect(mockHeaders).not.toHaveBeenCalled();
    });

    it('should not process headers when multi-tenant is disabled', async () => {
      // Set up headers that would normally be processed
      mockHeadersList.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id':
            return 'some-tenant';
          case 'x-tenant-subdomain':
            return 'some-subdomain';
          case 'x-tenant-domain':
            return 'some-domain.com';
          default:
            return null;
        }
      });

      const result = await getTenantContext();

      // Should still return default context regardless of headers
      expect(result).toEqual({
        tenant: null,
        isMultiTenant: false,
        tenantId: 'default',
      });

      // Headers should not be called at all
      expect(mockHeaders).not.toHaveBeenCalled();
      expect(mockHeadersList.get).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentTenant', () => {
    it('should return null when multi-tenant is disabled', async () => {
      const result = await getCurrentTenant();

      expect(result).toBeNull();
      expect(mockHeaders).not.toHaveBeenCalled();
    });
  });

  describe('getTenantId', () => {
    it('should return default tenant ID when multi-tenant is disabled', async () => {
      const result = await getTenantId();

      expect(result).toBe('default');
      expect(mockHeaders).not.toHaveBeenCalled();
    });
  });

  describe('getTenantDatabaseUrl', () => {
    it('should work normally even when multi-tenant is disabled', () => {
      const defaultResult = getTenantDatabaseUrl('default');
      const tenantResult = getTenantDatabaseUrl('some-tenant');

      expect(defaultResult).toBe('postgresql://localhost:5432/testdb');
      expect(tenantResult).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_some-tenant',
      );
    });
  });

  describe('getTenantCacheKey', () => {
    it('should work normally even when multi-tenant is disabled', () => {
      const result = getTenantCacheKey('default', 'settings');
      expect(result).toBe('tenant:default:settings');
    });
  });

  describe('isTenantFeatureEnabled', () => {
    it('should work normally even when multi-tenant is disabled', () => {
      // Create a mock tenant for testing
      const mockTenant = {
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
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result1 = isTenantFeatureEnabled(mockTenant, 'analytics');
      const result2 = isTenantFeatureEnabled(mockTenant, 'customBranding');
      const result3 = isTenantFeatureEnabled(null, 'analytics');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('Integration scenario', () => {
    it('should handle complete flow when multi-tenant is disabled', async () => {
      const context = await getTenantContext();
      const tenant = await getCurrentTenant();
      const tenantId = await getTenantId();
      const dbUrl = getTenantDatabaseUrl(tenantId);

      expect(context.isMultiTenant).toBe(false);
      expect(context.tenant).toBeNull();
      expect(context.tenantId).toBe('default');
      expect(tenant).toBeNull();
      expect(tenantId).toBe('default');
      expect(dbUrl).toBe('postgresql://localhost:5432/testdb');

      // Verify headers were never called
      expect(mockHeaders).not.toHaveBeenCalled();
    });
  });
});
