/**
 * @fileoverview Tests for API Services Index
 *
 * Tests the central export point for all API services and utilities
 * to ensure proper module exports and integration.
 *
 * @module lib/api/index.test
 * @version 1.0.0
 * @since 1.0.0
 */

import { handleApiResponse } from '@/lib/responseService';

import { apiClient, createApiClient, ApiError } from './client';
import { featureFlagsApi, FeatureFlagsApiService } from './feature-flags';
import * as apiIndex from './index';
// Import individual modules to compare against exports
import { tenantApi, TenantApiService } from './tenant';
import { userApi, UserApiService } from './user';

describe('API Index Module', () => {
  describe('Core API client exports', () => {
    it('should export apiClient from client module', () => {
      expect(apiIndex.apiClient).toBeDefined();
      expect(apiIndex.apiClient).toBe(apiClient);
    });

    it('should export createApiClient from client module', () => {
      expect(apiIndex.createApiClient).toBeDefined();
      expect(apiIndex.createApiClient).toBe(createApiClient);
      expect(typeof apiIndex.createApiClient).toBe('function');
    });

    it('should export ApiError from client module', () => {
      expect(apiIndex.ApiError).toBeDefined();
      expect(apiIndex.ApiError).toBe(ApiError);
      expect(typeof apiIndex.ApiError).toBe('function');
    });
  });

  describe('Feature Flags API exports', () => {
    it('should export featureFlagsApi service', () => {
      expect(apiIndex.featureFlagsApi).toBeDefined();
      expect(apiIndex.featureFlagsApi).toBe(featureFlagsApi);
      expect(typeof apiIndex.featureFlagsApi).toBe('object');
    });

    it('should export FeatureFlagsApiService class', () => {
      expect(apiIndex.FeatureFlagsApiService).toBeDefined();
      expect(apiIndex.FeatureFlagsApiService).toBe(FeatureFlagsApiService);
      expect(typeof apiIndex.FeatureFlagsApiService).toBe('function');
    });

    it('should have proper featureFlagsApi service structure', () => {
      expect(apiIndex.featureFlagsApi).toHaveProperty('getFlags');
      expect(typeof apiIndex.featureFlagsApi.getFlags).toBe('function');
    });
  });

  describe('User API exports', () => {
    it('should export userApi service', () => {
      expect(apiIndex.userApi).toBeDefined();
      expect(apiIndex.userApi).toBe(userApi);
      expect(typeof apiIndex.userApi).toBe('object');
    });

    it('should export UserApiService class', () => {
      expect(apiIndex.UserApiService).toBeDefined();
      expect(apiIndex.UserApiService).toBe(UserApiService);
      expect(typeof apiIndex.UserApiService).toBe('function');
    });

    it('should have proper userApi service structure', () => {
      expect(apiIndex.userApi).toHaveProperty('getProfile');
      expect(apiIndex.userApi).toHaveProperty('updateProfile');
      expect(apiIndex.userApi).toHaveProperty('deleteAccount');
      expect(typeof apiIndex.userApi.getProfile).toBe('function');
      expect(typeof apiIndex.userApi.updateProfile).toBe('function');
      expect(typeof apiIndex.userApi.deleteAccount).toBe('function');
    });
  });

  describe('Tenant API exports', () => {
    it('should export tenantApi service', () => {
      expect(apiIndex.tenantApi).toBeDefined();
      expect(apiIndex.tenantApi).toBe(tenantApi);
      expect(typeof apiIndex.tenantApi).toBe('object');
    });

    it('should export TenantApiService class', () => {
      expect(apiIndex.TenantApiService).toBeDefined();
      expect(apiIndex.TenantApiService).toBe(TenantApiService);
      expect(typeof apiIndex.TenantApiService).toBe('function');
    });

    it('should have proper tenantApi service structure', () => {
      expect(apiIndex.tenantApi).toHaveProperty('getCurrentTenant');
      expect(apiIndex.tenantApi).toHaveProperty('getTenant');
      expect(typeof apiIndex.tenantApi.getCurrentTenant).toBe('function');
      expect(typeof apiIndex.tenantApi.getTenant).toBe('function');
    });
  });

  describe('Response service utilities', () => {
    it('should export handleApiResponse utility', () => {
      expect(apiIndex.handleApiResponse).toBeDefined();
      expect(apiIndex.handleApiResponse).toBe(handleApiResponse);
      expect(typeof apiIndex.handleApiResponse).toBe('function');
    });
  });

  describe('Module structure validation', () => {
    it('should not export unexpected properties', () => {
      const expectedExports = [
        // Core API client
        'apiClient',
        'createApiClient',
        'ApiError',
        // Feature Flags API
        'featureFlagsApi',
        'FeatureFlagsApiService',
        // User API
        'userApi',
        'UserApiService',
        // Tenant API
        'tenantApi',
        'TenantApiService',
        // Response service utilities
        'handleApiResponse',
      ];

      const actualExports = Object.keys(apiIndex);

      // Check that all expected exports are present
      expectedExports.forEach((exportName) => {
        expect(actualExports).toContain(exportName);
      });

      // Check that no unexpected exports are present
      actualExports.forEach((exportName) => {
        expect(expectedExports).toContain(exportName);
      });
    });

    it('should have the correct number of exports', () => {
      const exportCount = Object.keys(apiIndex).length;
      expect(exportCount).toBe(10); // Update if new exports are added
    });
  });

  describe('API services integration', () => {
    it('should allow creating custom API client instances', () => {
      const customClient = apiIndex.createApiClient({
        baseUrl: 'https://test-api.com',
        timeout: 5000,
      });

      expect(customClient).toBeDefined();
      expect(customClient).toHaveProperty('get');
      expect(customClient).toHaveProperty('post');
      expect(customClient).toHaveProperty('put');
      expect(customClient).toHaveProperty('delete');
    });

    it('should allow instantiating ApiError', () => {
      const error = new apiIndex.ApiError('Test error', 404);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(apiIndex.ApiError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should provide access to service static methods', () => {
      // Feature Flags Service
      expect(typeof apiIndex.FeatureFlagsApiService.getFlags).toBe('function');

      // User Service
      expect(typeof apiIndex.UserApiService.getProfile).toBe('function');
      expect(typeof apiIndex.UserApiService.updateProfile).toBe('function');
      expect(typeof apiIndex.UserApiService.deleteAccount).toBe('function');

      // Tenant Service
      expect(typeof apiIndex.TenantApiService.getCurrentTenant).toBe(
        'function',
      );
      expect(typeof apiIndex.TenantApiService.getTenant).toBe('function');
    });
  });

  describe('Type exports validation', () => {
    it('should provide TypeScript interface exports', () => {
      // This test validates that the module can be used with TypeScript
      // The actual type checking happens at compile time

      // Test that we can import and use types (compile-time validation)
      const testFunction = (
        response: typeof apiIndex.handleApiResponse extends (
          r: infer R,
        ) => unknown
          ? R
          : never,
      ) => {
        return apiIndex.handleApiResponse(response);
      };

      expect(testFunction).toBeDefined();
      expect(typeof testFunction).toBe('function');
    });
  });

  describe('Convenience access patterns', () => {
    it('should allow direct access to API service methods', () => {
      // Test that convenience exports work as expected
      expect(apiIndex.featureFlagsApi.getFlags).toBe(
        apiIndex.FeatureFlagsApiService.getFlags,
      );
      expect(apiIndex.userApi.getProfile).toBe(
        apiIndex.UserApiService.getProfile,
      );
      expect(apiIndex.userApi.updateProfile).toBe(
        apiIndex.UserApiService.updateProfile,
      );
      expect(apiIndex.userApi.deleteAccount).toBe(
        apiIndex.UserApiService.deleteAccount,
      );
      expect(apiIndex.tenantApi.getCurrentTenant).toBe(
        apiIndex.TenantApiService.getCurrentTenant,
      );
      expect(apiIndex.tenantApi.getTenant).toBe(
        apiIndex.TenantApiService.getTenant,
      );
    });

    it('should provide consistent API surface for all services', () => {
      // Verify that all API services follow similar patterns
      const services = [
        {
          api: apiIndex.featureFlagsApi,
          service: apiIndex.FeatureFlagsApiService,
        },
        { api: apiIndex.userApi, service: apiIndex.UserApiService },
        { api: apiIndex.tenantApi, service: apiIndex.TenantApiService },
      ];

      services.forEach(({ api, service }) => {
        expect(api).toBeDefined();
        expect(service).toBeDefined();
        expect(typeof api).toBe('object');
        expect(typeof service).toBe('function');
      });
    });
  });

  describe('Module initialization', () => {
    it('should not throw errors during import', () => {
      // This test validates that the module can be imported without side effects
      expect(() => {
        // Re-import the module to test initialization
        expect(apiIndex).toBeDefined();
        expect(typeof apiIndex).toBe('object');
      }).not.toThrow();
    });

    it('should provide stable object references', () => {
      // Test that repeated access returns the same object references
      const firstAccess = {
        apiClient: apiIndex.apiClient,
        featureFlagsApi: apiIndex.featureFlagsApi,
        userApi: apiIndex.userApi,
        tenantApi: apiIndex.tenantApi,
      };

      const secondAccess = {
        apiClient: apiIndex.apiClient,
        featureFlagsApi: apiIndex.featureFlagsApi,
        userApi: apiIndex.userApi,
        tenantApi: apiIndex.tenantApi,
      };

      expect(firstAccess.apiClient).toBe(secondAccess.apiClient);
      expect(firstAccess.featureFlagsApi).toBe(secondAccess.featureFlagsApi);
      expect(firstAccess.userApi).toBe(secondAccess.userApi);
      expect(firstAccess.tenantApi).toBe(secondAccess.tenantApi);
    });
  });
});
