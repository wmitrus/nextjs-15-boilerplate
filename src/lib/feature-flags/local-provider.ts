import { getEnvironmentConfig } from '../env';

import type {
  FeatureFlag,
  FeatureFlagCondition,
  FeatureFlagContext,
  FeatureFlagProvider,
} from './types';

// Local feature flag configuration
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    environments: ['development', 'preview'],
    rolloutPercentage: 50,
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'dark-mode': {
    key: 'dark-mode',
    enabled: true,
    description: 'Enable dark mode theme',
    environments: ['development', 'preview', 'production'],
    tenants: ['startup-tenant', 'enterprise-tenant'], // Enabled for startup and enterprise tenants
  },
  'beta-features': {
    key: 'beta-features',
    enabled: false,
    description: 'Enable beta features',
    environments: ['development'],
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'rate-limiting': {
    key: 'rate-limiting',
    enabled: true,
    description: 'Enable API rate limiting',
    environments: ['preview', 'production'],
  },
  caching: {
    key: 'caching',
    enabled: true,
    description: 'Enable response caching',
    environments: ['production'],
  },
  analytics: {
    key: 'analytics',
    enabled: false,
    description: 'Enable analytics tracking',
    environments: ['production'],
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'ai-assistant': {
    key: 'ai-assistant',
    enabled: false,
    description: 'Enable AI assistant features',
    environments: ['development'],
    rolloutPercentage: 10,
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'real-time-updates': {
    key: 'real-time-updates',
    enabled: false,
    description: 'Enable real-time updates via WebSocket',
    environments: ['development', 'preview'],
    tenants: ['startup-tenant', 'enterprise-tenant'], // Enabled for startup and enterprise tenants
  },
  'advanced-search': {
    key: 'advanced-search',
    enabled: true,
    description: 'Enable advanced search functionality',
    environments: ['development', 'preview', 'production'],
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'tenant-isolation': {
    key: 'tenant-isolation',
    enabled: false,
    description: 'Enable tenant data isolation',
    environments: ['development', 'preview'],
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
  'custom-branding': {
    key: 'custom-branding',
    enabled: false,
    description: 'Enable custom tenant branding',
    environments: ['development'],
    tenants: ['startup-tenant', 'enterprise-tenant'], // Enabled for startup and enterprise tenants
  },
  'tenant-analytics': {
    key: 'tenant-analytics',
    enabled: false,
    description: 'Enable per-tenant analytics',
    environments: ['development'],
    tenants: ['enterprise-tenant'], // Only enabled for enterprise tenants
  },
};

export class LocalFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Record<string, FeatureFlag> = {};
  private initialized = false;
  private evaluationCache: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.flags = { ...LOCAL_FLAGS };
    this.initialized = true;
    // Clear cache on initialization
    this.evaluationCache.clear();
  }

  async isEnabled(
    flagKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    const flag = this.flags[flagKey];
    if (!flag) return false;

    // Create cache key based on flag key and context
    const cacheKey = this.createCacheKey(flagKey, context);
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!;
    }

    const result = await this.evaluateFlag(flag, context);
    this.evaluationCache.set(cacheKey, result);
    return result;
  }

  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    const flag = this.flags[flagKey];
    if (!flag) return defaultValue;

    const isEnabled = await this.isEnabled(flagKey, context);
    if (!isEnabled) return defaultValue;

    return (flag.value as T) ?? defaultValue;
  }

  async getAllFlags(
    context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>> {
    const result: Record<string, FeatureFlag> = {};

    for (const [key, flag] of Object.entries(this.flags)) {
      const isEnabled = await this.isEnabled(key, context);
      result[key] = { ...flag, enabled: isEnabled };
    }

    return result;
  }

  async refresh(): Promise<void> {
    // In a real implementation, this would reload flags from a remote source
    // Clear cache when refreshing
    this.evaluationCache.clear();
    console.log('Local provider: flags refreshed');
  }

  private createCacheKey(
    flagKey: string,
    context?: FeatureFlagContext,
  ): string {
    // Create a cache key based on flag key and relevant context properties
    const contextKey = context
      ? `${context.userId || ''}:${context.tenantId || ''}:${context.environment || ''}`
      : '';
    return `${flagKey}:${contextKey}`;
  }

  private async evaluateFlag(
    flag: FeatureFlag,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    if (!flag.enabled) return false;

    const envConfig = getEnvironmentConfig();
    const currentEnv = context?.environment || envConfig.environment;

    // Check environment restrictions
    if (flag.environments && !flag.environments.includes(currentEnv)) {
      return false;
    }

    // Check tenant restrictions
    if (
      flag.tenants &&
      context?.tenantId &&
      !flag.tenants.includes(context.tenantId)
    ) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashString(flag.key + (context?.userId || 'anonymous'));
      const percentage = hash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    // Evaluate conditions
    if (flag.conditions) {
      for (const condition of flag.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(
    condition: FeatureFlagCondition,
    context?: FeatureFlagContext,
  ): boolean {
    // Simple condition evaluation - can be extended
    switch (condition.type) {
      case 'environment':
        const envConfig = getEnvironmentConfig();
        const currentEnv = context?.environment || envConfig.environment;
        return this.evaluateOperator(
          currentEnv,
          condition.operator,
          condition.value,
        );

      case 'tenant':
        if (!context?.tenantId) return false;
        return this.evaluateOperator(
          context.tenantId,
          condition.operator,
          condition.value,
        );

      case 'user':
        if (!context?.userId) return false;
        return this.evaluateOperator(
          context.userId,
          condition.operator,
          condition.value,
        );

      default:
        return true;
    }
  }

  private evaluateOperator(
    actual: string | number,
    operator: string,
    expected: string | number | string[],
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'in':
        return Array.isArray(expected) && expected.includes(String(actual));
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(String(actual));
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
