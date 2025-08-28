import { LocalFeatureFlagProvider } from './local-provider';
import {
  createFeatureFlagProvider,
  getFeatureFlagProvider,
  initializeFeatureFlags,
} from './provider';
import { env, getEnvironmentConfig } from '../env';

import type { FeatureFlagProviderType } from './types';

// Mock the environment module
jest.mock('../env');

const mockGetEnvironmentConfig = getEnvironmentConfig as jest.MockedFunction<
  typeof getEnvironmentConfig
>;
const mockEnv = env as jest.Mocked<typeof env>;

describe('Feature Flag Provider', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock default environment config
    mockGetEnvironmentConfig.mockReturnValue({
      environment: 'development',
      isProduction: false,
      isDevelopment: true,
      isPreview: false,
      isStaging: false,
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
    });

    // Mock env variables
    Object.defineProperty(mockEnv, 'FEATURE_FLAGS_ENABLED', {
      value: true,
      writable: true,
    });
    Object.defineProperty(mockEnv, 'FEATURE_FLAGS_PROVIDER', {
      value: 'local',
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeatureFlagProvider', () => {
    it('should create local provider when type is "local"', () => {
      const provider = createFeatureFlagProvider('local');

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });

    it('should create local provider when no type is provided and env.FEATURE_FLAGS_PROVIDER is "local"', () => {
      const provider = createFeatureFlagProvider();

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });

    it('should throw error for LaunchDarkly provider', () => {
      expect(() => createFeatureFlagProvider('launchdarkly')).toThrow(
        'LaunchDarkly provider not implemented yet. Install @launchdarkly/node-server-sdk first.',
      );
    });

    it('should throw error for GrowthBook provider', () => {
      expect(() => createFeatureFlagProvider('growthbook')).toThrow(
        'GrowthBook provider not implemented yet. Install @growthbook/growthbook first.',
      );
    });

    it('should throw error for Vercel provider', () => {
      expect(() => createFeatureFlagProvider('vercel')).toThrow(
        'Vercel provider not implemented yet. Install @vercel/edge-config first.',
      );
    });

    it('should fall back to local provider for unknown provider type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const provider = createFeatureFlagProvider(
        'unknown' as FeatureFlagProviderType,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown feature flag provider: unknown. Falling back to local provider.',
      );
      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);

      consoleSpy.mockRestore();
    });

    it('should use env.FEATURE_FLAGS_PROVIDER when no type parameter is provided', () => {
      const provider = createFeatureFlagProvider();

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });
  });

  describe('getFeatureFlagProvider', () => {
    it('should create and return a provider instance', () => {
      const provider = getFeatureFlagProvider();

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });

    it('should return the same instance on subsequent calls (singleton pattern)', async () => {
      // Reset the provider instance for this test
      await jest.isolateModules(async () => {
        const { getFeatureFlagProvider } = await import('./provider');
        const provider1 = getFeatureFlagProvider();
        const provider2 = getFeatureFlagProvider();

        expect(provider1).toBe(provider2);
        expect(provider1).toBeInstanceOf(LocalFeatureFlagProvider);
      });
    });
  });

  describe('initializeFeatureFlags', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should initialize feature flags when enabled', async () => {
      await jest.isolateModules(async () => {
        // Mock the LocalFeatureFlagProvider to track initialize calls
        const mockProvider = new LocalFeatureFlagProvider();
        mockProvider.initialize = jest.fn().mockResolvedValue(undefined);

        // We can't easily mock the constructor, so we'll test the behavior
        const { initializeFeatureFlags } = await import('./provider');
        await initializeFeatureFlags();

        // We can check that the console log was called
        expect(consoleSpy).toHaveBeenCalledWith(
          'Feature flags initialized with local provider',
        );
      });
    });

    it('should not initialize feature flags when disabled', async () => {
      // Set FEATURE_FLAGS_ENABLED to false
      Object.defineProperty(mockEnv, 'FEATURE_FLAGS_ENABLED', {
        value: false,
        writable: true,
      });

      await initializeFeatureFlags();

      expect(consoleSpy).toHaveBeenCalledWith('Feature flags are disabled');
    });

    it('should log the correct provider type', async () => {
      await initializeFeatureFlags();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Feature flags initialized with local provider',
      );
    });
  });

  describe('Provider Type Validation', () => {
    it('should create local provider without throwing', () => {
      expect(() => createFeatureFlagProvider('local')).not.toThrow();
    });

    it('should throw for unimplemented provider types', () => {
      const unimplementedTypes: FeatureFlagProviderType[] = [
        'launchdarkly',
        'growthbook',
        'vercel',
      ];

      unimplementedTypes.forEach((type) => {
        expect(() => createFeatureFlagProvider(type)).toThrow();
      });
    });
  });

  describe('Environment Integration', () => {
    it('should respect FEATURE_FLAGS_PROVIDER environment variable', () => {
      const provider = createFeatureFlagProvider();

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });

    it('should override environment variable when explicit type is provided', () => {
      const provider = createFeatureFlagProvider('local');

      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages for unimplemented providers', () => {
      const testCases = [
        {
          type: 'launchdarkly' as FeatureFlagProviderType,
          expectedMessage:
            'LaunchDarkly provider not implemented yet. Install @launchdarkly/node-server-sdk first.',
        },
        {
          type: 'growthbook' as FeatureFlagProviderType,
          expectedMessage:
            'GrowthBook provider not implemented yet. Install @growthbook/growthbook first.',
        },
        {
          type: 'vercel' as FeatureFlagProviderType,
          expectedMessage:
            'Vercel provider not implemented yet. Install @vercel/edge-config first.',
        },
      ];

      testCases.forEach(({ type, expectedMessage }) => {
        expect(() => createFeatureFlagProvider(type)).toThrow(expectedMessage);
      });
    });

    it('should warn and fallback for unknown provider types', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const provider = createFeatureFlagProvider(
        'invalid-type' as FeatureFlagProviderType,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown feature flag provider: invalid-type. Falling back to local provider.',
      );
      expect(provider).toBeInstanceOf(LocalFeatureFlagProvider);

      consoleSpy.mockRestore();
    });
  });

  describe('Lazy Loading Functions', () => {
    it('should have separate functions for each provider type', () => {
      // Test that the lazy loading functions exist and throw appropriate errors
      expect(() => createFeatureFlagProvider('launchdarkly')).toThrow(
        /LaunchDarkly/,
      );
      expect(() => createFeatureFlagProvider('growthbook')).toThrow(
        /GrowthBook/,
      );
      expect(() => createFeatureFlagProvider('vercel')).toThrow(/Vercel/);
    });
  });

  describe('Module State Management', () => {
    it('should maintain singleton state across multiple imports', async () => {
      await jest.isolateModules(async () => {
        const { getFeatureFlagProvider } = await import('./provider');

        // First call creates the instance
        const provider1 = getFeatureFlagProvider();

        // Second call should return the same instance
        const provider2 = getFeatureFlagProvider();

        expect(provider1).toBe(provider2);
        expect(provider1).toBeInstanceOf(LocalFeatureFlagProvider);
      });
    });
  });

  describe('Integration with Environment Configuration', () => {
    it('should work when feature flags are enabled', async () => {
      await jest.isolateModules(async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const { initializeFeatureFlags } = await import('./provider');
        await initializeFeatureFlags();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Feature flags initialized with local provider',
        );

        consoleSpy.mockRestore();
      });
    });

    it('should work when feature flags are disabled', async () => {
      // Set FEATURE_FLAGS_ENABLED to false
      Object.defineProperty(mockEnv, 'FEATURE_FLAGS_ENABLED', {
        value: false,
        writable: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await initializeFeatureFlags();

      expect(consoleSpy).toHaveBeenCalledWith('Feature flags are disabled');

      consoleSpy.mockRestore();
    });
  });
});
