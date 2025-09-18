/**
 * @fileoverview Tests for Feature Flags API Service
 */

import { apiClient } from './client';
import { FeatureFlagsApiService, featureFlagsApi } from './feature-flags';

import type { FeatureFlagContext } from '@/lib/feature-flags/types';

// Mock the API client
jest.mock('./client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('FeatureFlagsApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFlags', () => {
    it('should make successful POST request with full context', async () => {
      const mockContext: FeatureFlagContext = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        environment: 'production',
        customProperties: {
          region: 'us-east',
          plan: 'premium',
        },
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {
            'feature-a': { enabled: true, value: 'test' },
            'feature-b': { enabled: false },
          },
          context: {
            environment: 'production',
            version: '1.0.0',
          },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlags(mockContext);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: 'user-123',
        tenantId: 'tenant-456',
        customProperties: {
          region: 'us-east',
          plan: 'premium',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request without context', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {
            'default-feature': { enabled: true },
          },
          context: {
            environment: 'production',
            version: '1.0.0',
          },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlags();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: undefined,
        tenantId: undefined,
        customProperties: undefined,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle partial context correctly', async () => {
      const mockContext: FeatureFlagContext = {
        userId: 'user-123',
        environment: 'staging',
        // tenantId and customProperties are missing
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {},
          context: { environment: 'staging', version: '1.0.0' },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlags(mockContext);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: 'user-123',
        tenantId: undefined,
        customProperties: undefined,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle network error gracefully', async () => {
      const mockContext: FeatureFlagContext = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        environment: 'production',
      };

      const mockError = {
        status: 'server_error' as const,
        error: 'Network error',
      };

      mockApiClient.post.mockResolvedValueOnce(mockError);

      const result = await FeatureFlagsApiService.getFlags(mockContext);

      expect(result).toEqual(mockError);
    });
  });

  describe('getFlagsWithQuery', () => {
    it('should make successful GET request with query parameters', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {
            'query-feature': { enabled: true },
          },
          context: {
            environment: 'development',
            version: '1.0.0',
          },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlagsWithQuery(
        'user-789',
        'tenant-012',
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/feature-flags?userId=user-789&tenantId=tenant-012',
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with only userId parameter', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: { 'user-specific': { enabled: true } },
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlagsWithQuery('user-456');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/feature-flags?userId=user-456',
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with only tenantId parameter', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: { 'tenant-specific': { enabled: false } },
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlagsWithQuery(
        undefined,
        'tenant-789',
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/feature-flags?tenantId=tenant-789',
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make GET request without parameters', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: { 'global-feature': { enabled: true } },
          context: { environment: 'production', version: '1.0.0' },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlagsWithQuery();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/feature-flags');

      expect(result).toEqual(mockResponse);
    });

    it('should handle empty string parameters correctly', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {},
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await FeatureFlagsApiService.getFlagsWithQuery('', '');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/feature-flags');

      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request errors', async () => {
      const mockError = {
        status: 'server_error' as const,
        error: 'Service unavailable',
      };

      mockApiClient.get.mockResolvedValueOnce(mockError);

      const result = await FeatureFlagsApiService.getFlagsWithQuery('user-123');

      expect(result).toEqual(mockError);
    });
  });

  describe('convenience functions', () => {
    it('should have featureFlagsApi.getFlags pointing to service method', () => {
      expect(featureFlagsApi.getFlags).toBe(FeatureFlagsApiService.getFlags);
    });

    it('should have featureFlagsApi.getFlagsWithQuery pointing to service method', () => {
      expect(featureFlagsApi.getFlagsWithQuery).toBe(
        FeatureFlagsApiService.getFlagsWithQuery,
      );
    });

    it('should work correctly through convenience functions', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: { 'convenience-test': { enabled: true } },
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      // Test convenience function for POST
      const contextResult = await featureFlagsApi.getFlags({
        userId: 'test-user',
        environment: 'test',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: 'test-user',
        tenantId: undefined,
        customProperties: undefined,
      });

      expect(contextResult).toEqual(mockResponse);

      // Test convenience function for GET
      const queryResult = await featureFlagsApi.getFlagsWithQuery('test-user');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/feature-flags?userId=test-user',
      );

      expect(queryResult).toEqual(mockResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query parameters', async () => {
      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {},
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const userIdWithSpecialChars = 'user@example.com';
      const tenantIdWithSpaces = 'tenant with spaces';

      await FeatureFlagsApiService.getFlagsWithQuery(
        userIdWithSpecialChars,
        tenantIdWithSpaces,
      );

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/feature-flags?userId=user%40example.com&tenantId=tenant+with+spaces',
      );
    });

    it('should handle context with empty custom properties', async () => {
      const mockContext: FeatureFlagContext = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        environment: 'test',
        customProperties: {},
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {},
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      await FeatureFlagsApiService.getFlags(mockContext);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: 'user-123',
        tenantId: 'tenant-456',
        customProperties: {},
      });
    });

    it('should handle context with undefined values', async () => {
      const mockContext: FeatureFlagContext = {
        userId: undefined,
        tenantId: 'tenant-456',
        environment: 'test',
        customProperties: undefined,
      };

      const mockResponse = {
        status: 'ok' as const,
        data: {
          flags: {},
          context: { environment: 'test', version: '1.0.0' },
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      await FeatureFlagsApiService.getFlags(mockContext);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/feature-flags', {
        userId: undefined,
        tenantId: 'tenant-456',
        customProperties: undefined,
      });
    });
  });
});
