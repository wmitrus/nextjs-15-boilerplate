export interface FeatureFlag {
  key: string;
  enabled: boolean;
  value?: string | number | boolean | object;
  description?: string;
  environments?: string[];
  tenants?: string[];
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  type: 'user' | 'tenant' | 'environment' | 'custom';
  operator:
    | 'equals'
    | 'contains'
    | 'in'
    | 'not_in'
    | 'greater_than'
    | 'less_than';
  value: string | number | string[];
  property?: string;
}

// Define a flexible type for feature flag values
export type FeatureFlagValue =
  | string
  | number
  | boolean
  | object
  | Array<unknown>;

export interface FeatureFlagContext {
  userId?: string;
  tenantId?: string;
  environment: string;
  userAgent?: string;
  ipAddress?: string;
  customProperties?: Record<string, unknown>;
}

export interface FeatureFlagProvider {
  initialize(): Promise<void>;
  isEnabled(flagKey: string, context?: FeatureFlagContext): Promise<boolean>;
  getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T>;
  getAllFlags(
    context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>>;
  refresh(): Promise<void>;
}

export type FeatureFlagProviderType =
  | 'local'
  | 'launchdarkly'
  | 'growthbook'
  | 'vercel';

// Predefined feature flags for type safety
export interface AppFeatureFlags {
  // UI Features
  'new-dashboard': boolean;
  'dark-mode': boolean;
  'beta-features': boolean;

  // API Features
  'rate-limiting': boolean;
  caching: boolean;
  analytics: boolean;

  // Experimental Features
  'ai-assistant': boolean;
  'real-time-updates': boolean;
  'advanced-search': boolean;

  // Multi-tenant Features
  'tenant-isolation': boolean;
  'custom-branding': boolean;
  'tenant-analytics': boolean;

  // Business Features
  'subscription-tier': string;
}

export type FeatureFlagKey = keyof AppFeatureFlags;
