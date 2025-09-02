import { env } from '@/lib/env';

/**
 * Tenant-specific configuration interface
 * Reserved for future multi-tenant implementations
 */
export interface TenantConfig {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;

  // Feature overrides per tenant
  features?: {
    analytics?: boolean;
    advancedReporting?: boolean;
    customBranding?: boolean;
    apiAccess?: boolean;
  };

  // Tenant-specific settings
  settings?: {
    maxUsers?: number;
    storageLimit?: number;
    apiRateLimit?: number;
    customDomain?: boolean;
  };

  // Branding and customization
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
  };

  // Database and service configurations
  services?: {
    databaseUrl?: string;
    redisUrl?: string;
    storageProvider?: 'aws' | 'gcp' | 'azure';
  };
}

/**
 * Default tenant configuration
 */
export const defaultTenantConfig: TenantConfig = {
  id: env.DEFAULT_TENANT_ID,
  name: 'Default Tenant',

  features: {
    analytics: true,
    advancedReporting: false,
    customBranding: false,
    apiAccess: true,
  },

  settings: {
    maxUsers: 100,
    storageLimit: 1024, // MB
    apiRateLimit: env.API_RATE_LIMIT_REQUESTS,
    customDomain: false,
  },

  branding: {
    primaryColor: '#0070f3',
    secondaryColor: '#666666',
  },
};

/**
 * Tenant configurations registry
 * In a real application, this would likely come from a database
 */
export const tenantConfigs: Record<string, TenantConfig> = {
  [env.DEFAULT_TENANT_ID]: defaultTenantConfig,

  // Example tenant configurations for different environments
  'preview-tenant': {
    id: 'preview-tenant',
    name: 'Preview Tenant',
    subdomain: 'preview',

    features: {
      analytics: true,
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
    },

    settings: {
      maxUsers: 50,
      storageLimit: 512,
      apiRateLimit: 500,
      customDomain: false,
    },

    branding: {
      primaryColor: '#ff6b35',
      secondaryColor: '#4a4a4a',
    },
  },

  'staging-tenant': {
    id: 'staging-tenant',
    name: 'Staging Tenant',
    subdomain: 'staging',

    features: {
      analytics: true,
      advancedReporting: true,
      customBranding: false,
      apiAccess: true,
    },

    settings: {
      maxUsers: 200,
      storageLimit: 2048,
      apiRateLimit: 1000,
      customDomain: false,
    },
  },
};

/**
 * Get tenant configuration by ID
 */
export const getTenantConfig = (tenantId: string): TenantConfig => {
  return tenantConfigs[tenantId] || defaultTenantConfig;
};

/**
 * Get current tenant configuration
 * Uses the default tenant ID from environment or multi-tenant context
 */
export const getCurrentTenantConfig = (): TenantConfig => {
  // In a real implementation, this would get the tenant ID from:
  // - Request headers
  // - Subdomain
  // - User session
  // - Multi-tenant context

  const currentTenantId = env.DEFAULT_TENANT_ID;
  return getTenantConfig(currentTenantId);
};

/**
 * Check if tenant has specific feature enabled
 */
export const tenantHasFeature = (
  tenantId: string,
  feature: keyof NonNullable<TenantConfig['features']>,
): boolean => {
  const config = getTenantConfig(tenantId);
  return config.features?.[feature] ?? false;
};

/**
 * Get tenant-specific setting
 */
export const getTenantSetting = <
  K extends keyof NonNullable<TenantConfig['settings']>,
>(
  tenantId: string,
  setting: K,
): NonNullable<TenantConfig['settings']>[K] | undefined => {
  const config = getTenantConfig(tenantId);
  return config.settings?.[setting];
};

/**
 * Environment-specific tenant configurations
 */
export const getEnvironmentTenantConfig = () => {
  const currentEnv = env.APP_ENV;

  switch (currentEnv) {
    case 'preview':
      return getTenantConfig('preview-tenant');
    case 'staging':
      return getTenantConfig('staging-tenant');
    case 'production':
    case 'development':
    default:
      return getCurrentTenantConfig();
  }
};
