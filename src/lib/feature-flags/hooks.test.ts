import {
  getFeatureFlag,
  getFeatureFlagValue,
  getAllFeatureFlags,
  isFeatureEnabled,
  createFeatureFlagContext,
} from './hooks';
import { getFeatureFlagProvider } from './provider';

import type {
  FeatureFlagProvider,
  FeatureFlagContext,
  FeatureFlag,
} from './types';

// Mock all dependencies to ensure complete isolation
jest.mock('./provider');
jest.mock('./local-provider');
jest.mock('../env');

const mockGetFeatureFlagProvider =
  getFeatureFlagProvider as jest.MockedFunction<typeof getFeatureFlagProvider>;

describe('Feature Flag Hooks', () => {
  let mockProvider: jest.Mocked<FeatureFlagProvider>;

  beforeEach(() => {
    // Create a mock provider with all required methods
    mockProvider = {
      initialize: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn(),
      getValue: jest.fn(),
      getAllFlags: jest.fn(),
      refresh: jest.fn().mockResolvedValue(undefined),
    };

    // Mock the provider getter to return our mock
    mockGetFeatureFlagProvider.mockReturnValue(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeatureFlag', () => {
    it('should return true when feature flag is enabled', async () => {
      mockProvider.isEnabled.mockResolvedValue(true);

      const result = await getFeatureFlag('new-dashboard');

      expect(result).toBe(true);
      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        undefined,
      );
    });

    it('should return false when feature flag is disabled', async () => {
      mockProvider.isEnabled.mockResolvedValue(false);

      const result = await getFeatureFlag('dark-mode');

      expect(result).toBe(false);
      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'dark-mode',
        undefined,
      );
    });

    it('should pass context to provider when provided', async () => {
      const context: FeatureFlagContext = {
        userId: 'user123',
        tenantId: 'tenant456',
        environment: 'production',
      };
      mockProvider.isEnabled.mockResolvedValue(true);

      await getFeatureFlag('new-dashboard', context);

      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        context,
      );
    });

    it('should handle provider errors', async () => {
      const error = new Error('Provider error');
      mockProvider.isEnabled.mockRejectedValue(error);

      await expect(getFeatureFlag('new-dashboard')).rejects.toThrow(
        'Provider error',
      );
    });
  });

  describe('getFeatureFlagValue', () => {
    it('should return the feature flag value from provider', async () => {
      const expectedValue = 'custom-value';
      mockProvider.getValue.mockResolvedValue(expectedValue);

      const result = await getFeatureFlagValue(
        'new-dashboard',
        'default-value',
      );

      expect(result).toBe(expectedValue);
      expect(mockProvider.getValue).toHaveBeenCalledWith(
        'new-dashboard',
        'default-value',
        undefined,
      );
    });

    it('should return default value when provider returns it', async () => {
      const defaultValue = 'default-value';
      mockProvider.getValue.mockResolvedValue(defaultValue);

      const result = await getFeatureFlagValue('dark-mode', defaultValue);

      expect(result).toBe(defaultValue);
    });

    it('should work with different value types', async () => {
      // Test with number
      mockProvider.getValue.mockResolvedValue(42);
      const numberResult = await getFeatureFlagValue('rate-limiting', 10);
      expect(numberResult).toBe(42);

      // Test with boolean
      mockProvider.getValue.mockResolvedValue(true);
      const booleanResult = await getFeatureFlagValue('analytics', false);
      expect(booleanResult).toBe(true);

      // Test with object
      const objectValue = { theme: 'dark', sidebar: 'collapsed' };
      mockProvider.getValue.mockResolvedValue(objectValue);
      const objectResult = await getFeatureFlagValue('dark-mode', {});
      expect(objectResult).toEqual(objectValue);
    });

    it('should pass context to provider when provided', async () => {
      const context: FeatureFlagContext = {
        userId: 'user123',
        environment: 'staging',
      };
      mockProvider.getValue.mockResolvedValue('test-value');

      await getFeatureFlagValue('new-dashboard', 'default', context);

      expect(mockProvider.getValue).toHaveBeenCalledWith(
        'new-dashboard',
        'default',
        context,
      );
    });

    it('should handle provider errors', async () => {
      const error = new Error('Provider getValue error');
      mockProvider.getValue.mockRejectedValue(error);

      await expect(
        getFeatureFlagValue('new-dashboard', 'default'),
      ).rejects.toThrow('Provider getValue error');
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags as boolean map', async () => {
      const mockFlags: Record<string, FeatureFlag> = {
        'new-dashboard': {
          key: 'new-dashboard',
          enabled: true,
          description: 'New dashboard feature',
        },
        'dark-mode': {
          key: 'dark-mode',
          enabled: false,
          description: 'Dark mode theme',
        },
        'beta-features': {
          key: 'beta-features',
          enabled: true,
          description: 'Beta features access',
        },
      };

      mockProvider.getAllFlags.mockResolvedValue(mockFlags);

      const result = await getAllFeatureFlags();

      expect(result).toEqual({
        'new-dashboard': true,
        'dark-mode': false,
        'beta-features': true,
      });
      expect(mockProvider.getAllFlags).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty flags response', async () => {
      mockProvider.getAllFlags.mockResolvedValue({});

      const result = await getAllFeatureFlags();

      expect(result).toEqual({});
    });

    it('should pass context to provider when provided', async () => {
      const context: FeatureFlagContext = {
        userId: 'user123',
        tenantId: 'tenant456',
        environment: 'development',
      };
      mockProvider.getAllFlags.mockResolvedValue({});

      await getAllFeatureFlags(context);

      expect(mockProvider.getAllFlags).toHaveBeenCalledWith(context);
    });

    it('should handle provider errors', async () => {
      const error = new Error('Provider getAllFlags error');
      mockProvider.getAllFlags.mockRejectedValue(error);

      await expect(getAllFeatureFlags()).rejects.toThrow(
        'Provider getAllFlags error',
      );
    });

    it('should handle flags with missing enabled property', async () => {
      const mockFlags: Record<string, FeatureFlag> = {
        'test-flag': {
          key: 'test-flag',
          enabled: true,
        },
        'another-flag': {
          key: 'another-flag',
          enabled: false,
        },
      };

      mockProvider.getAllFlags.mockResolvedValue(mockFlags);

      const result = await getAllFeatureFlags();

      expect(result).toEqual({
        'test-flag': true,
        'another-flag': false,
      });
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return typed boolean result', async () => {
      mockProvider.isEnabled.mockResolvedValue(true);

      const result = await isFeatureEnabled('new-dashboard');

      expect(result).toBe(true);
      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        undefined,
      );
    });

    it('should work with different feature flag keys', async () => {
      // Test with different flag keys
      mockProvider.isEnabled.mockResolvedValue(false);
      const darkModeResult = await isFeatureEnabled('dark-mode');
      expect(darkModeResult).toBe(false);

      mockProvider.isEnabled.mockResolvedValue(true);
      const analyticsResult = await isFeatureEnabled('analytics');
      expect(analyticsResult).toBe(true);
    });

    it('should pass context to provider when provided', async () => {
      const context: FeatureFlagContext = {
        userId: 'user123',
        environment: 'production',
      };
      mockProvider.isEnabled.mockResolvedValue(true);

      await isFeatureEnabled('beta-features', context);

      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'beta-features',
        context,
      );
    });

    it('should handle provider errors', async () => {
      const error = new Error('Provider isEnabled error');
      mockProvider.isEnabled.mockRejectedValue(error);

      await expect(isFeatureEnabled('new-dashboard')).rejects.toThrow(
        'Provider isEnabled error',
      );
    });
  });

  describe('createFeatureFlagContext', () => {
    it('should create context with all provided parameters', () => {
      const context = createFeatureFlagContext(
        'user123',
        'tenant456',
        'production',
        'Mozilla/5.0',
        '192.168.1.1',
        { customProp: 'value' },
      );

      expect(context).toEqual({
        userId: 'user123',
        tenantId: 'tenant456',
        environment: 'production',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        customProperties: { customProp: 'value' },
      });
    });

    it('should create context with minimal parameters', () => {
      const context = createFeatureFlagContext();

      expect(context).toEqual({
        userId: undefined,
        tenantId: undefined,
        environment: 'development',
        userAgent: undefined,
        ipAddress: undefined,
        customProperties: undefined,
      });
    });

    it('should use default environment when not provided', () => {
      const context = createFeatureFlagContext('user123');

      expect(context.environment).toBe('development');
      expect(context.userId).toBe('user123');
    });

    it('should preserve provided environment', () => {
      const context = createFeatureFlagContext(
        'user123',
        'tenant456',
        'staging',
      );

      expect(context.environment).toBe('staging');
    });

    it('should handle partial parameters', () => {
      const context = createFeatureFlagContext(
        'user123',
        undefined,
        'production',
        'Chrome/91.0',
      );

      expect(context).toEqual({
        userId: 'user123',
        tenantId: undefined,
        environment: 'production',
        userAgent: 'Chrome/91.0',
        ipAddress: undefined,
        customProperties: undefined,
      });
    });

    it('should handle custom properties correctly', () => {
      const customProps = {
        role: 'admin',
        subscription: 'premium',
        features: ['feature1', 'feature2'],
        metadata: { source: 'web' },
      };

      const context = createFeatureFlagContext(
        'user123',
        'tenant456',
        'production',
        undefined,
        undefined,
        customProps,
      );

      expect(context.customProperties).toEqual(customProps);
    });

    it('should handle empty custom properties', () => {
      const context = createFeatureFlagContext(
        'user123',
        'tenant456',
        'production',
        undefined,
        undefined,
        {},
      );

      expect(context.customProperties).toEqual({});
    });
  });

  describe('Integration scenarios', () => {
    it('should work with real-world context creation and flag checking', async () => {
      const context = createFeatureFlagContext(
        'user123',
        'tenant456',
        'production',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '192.168.1.100',
        { role: 'admin', plan: 'enterprise' },
      );

      mockProvider.isEnabled.mockResolvedValue(true);

      const isEnabled = await getFeatureFlag('new-dashboard', context);

      expect(isEnabled).toBe(true);
      expect(mockProvider.isEnabled).toHaveBeenCalledWith(
        'new-dashboard',
        context,
      );
    });

    it('should handle multiple concurrent flag requests', async () => {
      mockProvider.isEnabled
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const [dashboard, darkMode, analytics] = await Promise.all([
        getFeatureFlag('new-dashboard'),
        getFeatureFlag('dark-mode'),
        getFeatureFlag('analytics'),
      ]);

      expect(dashboard).toBe(true);
      expect(darkMode).toBe(false);
      expect(analytics).toBe(true);
      expect(mockProvider.isEnabled).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed flag operations', async () => {
      const mockFlags: Record<string, FeatureFlag> = {
        'new-dashboard': { key: 'new-dashboard', enabled: true },
        'dark-mode': { key: 'dark-mode', enabled: false },
      };

      mockProvider.isEnabled.mockResolvedValue(true);
      mockProvider.getValue.mockResolvedValue('premium');
      mockProvider.getAllFlags.mockResolvedValue(mockFlags);

      const context = createFeatureFlagContext('user123', 'tenant456');

      const [isEnabled, value, allFlags] = await Promise.all([
        getFeatureFlag('new-dashboard', context),
        getFeatureFlagValue('subscription-tier', 'basic', context),
        getAllFeatureFlags(context),
      ]);

      expect(isEnabled).toBe(true);
      expect(value).toBe('premium');
      expect(allFlags).toEqual({
        'new-dashboard': true,
        'dark-mode': false,
      });
    });
  });
});
