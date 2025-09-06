import { LocalFeatureFlagProvider } from './local-provider';
import { getEnvironmentConfig } from '../env';

import type { FeatureFlagContext, FeatureFlag } from './types';

// Type for accessing private properties in tests
type LocalFeatureFlagProviderWithPrivates = {
  flags: Record<string, FeatureFlag>;
  hashString: (str: string) => number;
};

// Mock the environment module
jest.mock('../env');

const mockGetEnvironmentConfig = getEnvironmentConfig as jest.MockedFunction<
  typeof getEnvironmentConfig
>;

describe('LocalFeatureFlagProvider', () => {
  let provider: LocalFeatureFlagProvider;

  beforeEach(() => {
    provider = new LocalFeatureFlagProvider();

    // Mock default environment config
    mockGetEnvironmentConfig.mockReturnValue({
      environment: 'development',
      isProduction: false,
      isDevelopment: true,
      isPreview: false,
      isStaging: false,
      isTest: false,
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the provider with local flags', async () => {
      await provider.initialize();

      // Test that flags are loaded by checking a known flag (dark-mode is enabled without rollout percentage)
      const result = await provider.isEnabled('dark-mode');
      expect(result).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await provider.initialize();
      const firstCall = await provider.getAllFlags();

      await provider.initialize();
      const secondCall = await provider.getAllFlags();

      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('isEnabled', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should return false for non-existent flags', async () => {
      const result = await provider.isEnabled('non-existent-flag');
      expect(result).toBe(false);
    });

    it('should return true for enabled flags in correct environment', async () => {
      const result = await provider.isEnabled('dark-mode');
      expect(result).toBe(true);
    });

    it('should return false for disabled flags', async () => {
      const result = await provider.isEnabled('beta-features');
      expect(result).toBe(false);
    });

    it('should respect environment restrictions', async () => {
      // Test flag that's only enabled in production
      mockGetEnvironmentConfig.mockReturnValue({
        environment: 'production',
        isProduction: true,
        isDevelopment: false,
        isPreview: false,
        isStaging: false,
        isTest: false,
        version: '1.0.0',
        baseUrl: 'http://localhost:3000',
      });

      const result = await provider.isEnabled('caching');
      expect(result).toBe(true);
    });

    it('should return false for flags not available in current environment', async () => {
      // Test production-only flag in development
      const result = await provider.isEnabled('caching');
      expect(result).toBe(false);
    });

    it('should use context environment over default', async () => {
      const context: FeatureFlagContext = {
        environment: 'production',
      };

      const result = await provider.isEnabled('caching', context);
      expect(result).toBe(true);
    });

    it('should respect tenant restrictions', async () => {
      // Create a mock flag with tenant restrictions
      const flagWithTenants: FeatureFlag = {
        key: 'tenant-specific',
        enabled: true,
        tenants: ['tenant1', 'tenant2'],
        environments: ['development'],
      };

      // Mock the provider to include this flag
      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'tenant-specific': flagWithTenants,
      };

      const contextWithValidTenant: FeatureFlagContext = {
        environment: 'development',
        tenantId: 'tenant1',
      };

      const contextWithInvalidTenant: FeatureFlagContext = {
        environment: 'development',
        tenantId: 'tenant3',
      };

      const validResult = await provider.isEnabled(
        'tenant-specific',
        contextWithValidTenant,
      );
      const invalidResult = await provider.isEnabled(
        'tenant-specific',
        contextWithInvalidTenant,
      );

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });

    it('should handle rollout percentage correctly', async () => {
      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'test-user-1',
      };

      // Test with new-dashboard which has 50% rollout
      const result = await provider.isEnabled('new-dashboard', context);
      expect(typeof result).toBe('boolean');
    });

    it('should handle rollout percentage consistently for same user', async () => {
      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'consistent-user',
      };

      const result1 = await provider.isEnabled('new-dashboard', context);
      const result2 = await provider.isEnabled('new-dashboard', context);

      expect(result1).toBe(result2);
    });

    it('should evaluate conditions correctly', async () => {
      // Create a flag with conditions
      const flagWithConditions: FeatureFlag = {
        key: 'conditional-flag',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'equals',
            value: 'admin-user',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'conditional-flag': flagWithConditions,
      };

      const adminContext: FeatureFlagContext = {
        environment: 'development',
        userId: 'admin-user',
      };

      const regularContext: FeatureFlagContext = {
        environment: 'development',
        userId: 'regular-user',
      };

      const adminResult = await provider.isEnabled(
        'conditional-flag',
        adminContext,
      );
      const regularResult = await provider.isEnabled(
        'conditional-flag',
        regularContext,
      );

      expect(adminResult).toBe(true);
      expect(regularResult).toBe(false);
    });
  });

  describe('getValue', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should return default value for non-existent flags', async () => {
      const result = await provider.getValue('non-existent', 'default');
      expect(result).toBe('default');
    });

    it('should return default value for disabled flags', async () => {
      const result = await provider.getValue('beta-features', 'default');
      expect(result).toBe('default');
    });

    it('should return flag value when enabled and has value', async () => {
      // Create a flag with a value
      const flagWithValue: FeatureFlag = {
        key: 'config-flag',
        enabled: true,
        value: 'custom-value',
        environments: ['development'],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'config-flag': flagWithValue,
      };

      const result = await provider.getValue('config-flag', 'default');
      expect(result).toBe('custom-value');
    });

    it('should return default value when flag is enabled but has no value', async () => {
      const result = await provider.getValue('new-dashboard', 'default');
      expect(result).toBe('default');
    });

    it('should work with different value types', async () => {
      const numberFlag: FeatureFlag = {
        key: 'number-flag',
        enabled: true,
        value: 42,
        environments: ['development'],
      };

      const booleanFlag: FeatureFlag = {
        key: 'boolean-flag',
        enabled: true,
        value: true,
        environments: ['development'],
      };

      const objectFlag: FeatureFlag = {
        key: 'object-flag',
        enabled: true,
        value: { setting: 'value' },
        environments: ['development'],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'number-flag': numberFlag,
        'boolean-flag': booleanFlag,
        'object-flag': objectFlag,
      };

      const numberResult = await provider.getValue('number-flag', 0);
      const booleanResult = await provider.getValue('boolean-flag', false);
      const objectResult = await provider.getValue('object-flag', {});

      expect(numberResult).toBe(42);
      expect(booleanResult).toBe(true);
      expect(objectResult).toEqual({ setting: 'value' });
    });
  });

  describe('getAllFlags', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should return all flags with their evaluated enabled state', async () => {
      const result = await provider.getAllFlags();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should evaluate each flag based on context', async () => {
      const context: FeatureFlagContext = {
        environment: 'production',
      };

      const result = await provider.getAllFlags(context);

      // Caching should be enabled in production
      expect(result.caching?.enabled).toBe(true);

      // Beta features should be disabled (only available in development)
      expect(result['beta-features']?.enabled).toBe(false);
    });

    it('should return flags with original metadata', async () => {
      const result = await provider.getAllFlags();

      const newDashboard = result['new-dashboard'];
      expect(newDashboard).toBeDefined();
      expect(newDashboard.key).toBe('new-dashboard');
      expect(newDashboard.description).toBe('Enable the new dashboard UI');
      expect(newDashboard.environments).toContain('development');
    });
  });

  describe('refresh', () => {
    it('should log refresh message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await provider.refresh();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Local provider: flags refreshed',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('evaluateCondition', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should evaluate environment conditions', async () => {
      const flagWithEnvCondition: FeatureFlag = {
        key: 'env-condition-flag',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'environment',
            operator: 'equals',
            value: 'development',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'env-condition-flag': flagWithEnvCondition,
      };

      const result = await provider.isEnabled('env-condition-flag');
      expect(result).toBe(true);
    });

    it('should evaluate tenant conditions', async () => {
      const flagWithTenantCondition: FeatureFlag = {
        key: 'tenant-condition-flag',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'tenant',
            operator: 'in',
            value: ['tenant1', 'tenant2'],
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'tenant-condition-flag': flagWithTenantCondition,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        tenantId: 'tenant1',
      };

      const result = await provider.isEnabled('tenant-condition-flag', context);
      expect(result).toBe(true);
    });

    it('should return false for tenant conditions without tenantId', async () => {
      const flagWithTenantCondition: FeatureFlag = {
        key: 'tenant-condition-flag',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'tenant',
            operator: 'equals',
            value: 'tenant1',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'tenant-condition-flag': flagWithTenantCondition,
      };

      const result = await provider.isEnabled('tenant-condition-flag');
      expect(result).toBe(false);
    });

    it('should evaluate user conditions', async () => {
      const flagWithUserCondition: FeatureFlag = {
        key: 'user-condition-flag',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'contains',
            value: 'admin',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'user-condition-flag': flagWithUserCondition,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'admin-user',
      };

      const result = await provider.isEnabled('user-condition-flag', context);
      expect(result).toBe(true);
    });
  });

  describe('evaluateOperator', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should handle equals operator', async () => {
      const flag: FeatureFlag = {
        key: 'equals-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'equals',
            value: 'test-user',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'equals-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'test-user',
      };

      const result = await provider.isEnabled('equals-test', context);
      expect(result).toBe(true);
    });

    it('should handle contains operator', async () => {
      const flag: FeatureFlag = {
        key: 'contains-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'contains',
            value: 'admin',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'contains-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'super-admin-user',
      };

      const result = await provider.isEnabled('contains-test', context);
      expect(result).toBe(true);
    });

    it('should handle in operator', async () => {
      const flag: FeatureFlag = {
        key: 'in-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'in',
            value: ['user1', 'user2', 'user3'],
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'in-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'user2',
      };

      const result = await provider.isEnabled('in-test', context);
      expect(result).toBe(true);
    });

    it('should handle not_in operator', async () => {
      const flag: FeatureFlag = {
        key: 'not-in-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'not_in',
            value: ['blocked1', 'blocked2'],
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'not-in-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'allowed-user',
      };

      const result = await provider.isEnabled('not-in-test', context);
      expect(result).toBe(true);
    });

    it('should handle greater_than operator', async () => {
      const flag: FeatureFlag = {
        key: 'greater-than-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'greater_than',
            value: 100,
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'greater-than-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: '150',
      };

      const result = await provider.isEnabled('greater-than-test', context);
      expect(result).toBe(true);
    });

    it('should handle less_than operator', async () => {
      const flag: FeatureFlag = {
        key: 'less-than-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'less_than',
            value: 100,
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'less-than-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: '50',
      };

      const result = await provider.isEnabled('less-than-test', context);
      expect(result).toBe(true);
    });

    it('should return false for unknown operators', async () => {
      const flag: FeatureFlag = {
        key: 'unknown-operator-test',
        enabled: true,
        environments: ['development'],
        conditions: [
          {
            type: 'user',
            operator: 'unknown' as 'equals', // Testing invalid operator
            value: 'test',
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'unknown-operator-test': flag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'test',
      };

      const result = await provider.isEnabled('unknown-operator-test', context);
      expect(result).toBe(false);
    });
  });

  describe('hashString', () => {
    it('should produce consistent hash for same input', () => {
      const hash1 = (
        provider as unknown as LocalFeatureFlagProviderWithPrivates
      ).hashString('test-string');
      const hash2 = (
        provider as unknown as LocalFeatureFlagProviderWithPrivates
      ).hashString('test-string');

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = (
        provider as unknown as LocalFeatureFlagProviderWithPrivates
      ).hashString('string1');
      const hash2 = (
        provider as unknown as LocalFeatureFlagProviderWithPrivates
      ).hashString('string2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const hash = (
        provider as unknown as LocalFeatureFlagProviderWithPrivates
      ).hashString('');
      expect(typeof hash).toBe('number');
      expect(hash).toBeGreaterThanOrEqual(0);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('should handle complex flag evaluation with multiple conditions', async () => {
      const complexFlag: FeatureFlag = {
        key: 'complex-flag',
        enabled: true,
        environments: ['development', 'preview'],
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'user',
            operator: 'contains',
            value: 'admin',
          },
          {
            type: 'environment',
            operator: 'in',
            value: ['development', 'preview'],
          },
        ],
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'complex-flag': complexFlag,
      };

      const validContext: FeatureFlagContext = {
        environment: 'development',
        userId: 'admin-user',
      };

      const invalidContext: FeatureFlagContext = {
        environment: 'production',
        userId: 'admin-user',
      };

      const validResult = await provider.isEnabled(
        'complex-flag',
        validContext,
      );
      const invalidResult = await provider.isEnabled(
        'complex-flag',
        invalidContext,
      );

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });

    it('should handle rollout percentage edge cases', async () => {
      const zeroPercentFlag: FeatureFlag = {
        key: 'zero-percent',
        enabled: true,
        environments: ['development'],
        rolloutPercentage: 0,
      };

      const hundredPercentFlag: FeatureFlag = {
        key: 'hundred-percent',
        enabled: true,
        environments: ['development'],
        rolloutPercentage: 100,
      };

      (provider as unknown as LocalFeatureFlagProviderWithPrivates).flags = {
        'zero-percent': zeroPercentFlag,
        'hundred-percent': hundredPercentFlag,
      };

      const context: FeatureFlagContext = {
        environment: 'development',
        userId: 'test-user',
      };

      const zeroResult = await provider.isEnabled('zero-percent', context);
      const hundredResult = await provider.isEnabled(
        'hundred-percent',
        context,
      );

      expect(zeroResult).toBe(false);
      expect(hundredResult).toBe(true);
    });
  });
});
