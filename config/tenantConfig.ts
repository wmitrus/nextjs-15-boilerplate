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
 * Client-safe default tenant configuration
 * Does not access server-side environment variables
 */
export const defaultTenantConfig: TenantConfig = {
  id: 'default',
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
    apiRateLimit: 100, // Default fallback
    customDomain: false,
  },

  branding: {
    primaryColor: '#0070f3',
    secondaryColor: '#666666',
  },
};

/**
 * Server-side function to get default tenant config with environment variables
 * This should only be called on the server side
 */
export const getServerDefaultTenantConfig = (): TenantConfig => {
  // Dynamic import to avoid client-side access
  let serverEnv: typeof import('@/lib/env').env;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    serverEnv = require('@/lib/env').env;
  } catch {
    // Fallback for client-side or when env is not available
    return defaultTenantConfig;
  }

  return {
    ...defaultTenantConfig,
    id: serverEnv.DEFAULT_TENANT_ID || 'default',
    settings: {
      ...defaultTenantConfig.settings,
      apiRateLimit: serverEnv.API_RATE_LIMIT_REQUESTS || 100,
    },
  };
};

/**
 * Get tenant configurations registry
 * In a real application, this would likely come from a database
 */
export const getTenantConfigs = (): Record<string, TenantConfig> => {
  const serverDefault = getServerDefaultTenantConfig();

  return {
    [serverDefault.id]: serverDefault,

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
};

/**
 * Client-safe tenant configurations (without server env variables)
 */
export const clientTenantConfigs: Record<string, TenantConfig> = {
  [defaultTenantConfig.id]: defaultTenantConfig,

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
 * Get tenant configuration by ID (client-safe)
 */
export const getTenantConfig = (tenantId: string): TenantConfig => {
  return clientTenantConfigs[tenantId] || defaultTenantConfig;
};

/**
 * Get tenant configuration by ID (server-side with env variables)
 */
export const getServerTenantConfig = (tenantId: string): TenantConfig => {
  const configs = getTenantConfigs();
  return configs[tenantId] || getServerDefaultTenantConfig();
};

/**
 * Get current tenant configuration (client-safe)
 * Uses the default tenant ID or multi-tenant context
 */
export const getCurrentTenantConfig = (): TenantConfig => {
  // In a real implementation, this would get the tenant ID from:
  // - Request headers
  // - Subdomain
  // - User session
  // - Multi-tenant context

  return getTenantConfig(defaultTenantConfig.id);
};

/**
 * Get current tenant configuration (server-side)
 */
export const getCurrentServerTenantConfig = (): TenantConfig => {
  const serverDefault = getServerDefaultTenantConfig();
  return getServerTenantConfig(serverDefault.id);
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
 * Environment-specific tenant configurations (client-safe)
 */
export const getEnvironmentTenantConfig = () => {
  // Use client-safe environment detection
  const currentEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';

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

/**
 * Environment-specific tenant configurations (server-side)
 */
export const getServerEnvironmentTenantConfig = () => {
  // Import server env only on server-side
  if (typeof window !== 'undefined') {
    return getEnvironmentTenantConfig();
  }

  // Use dynamic import to avoid bundling on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require('@/lib/env');

  const currentEnv = env.APP_ENV || 'development';

  switch (currentEnv) {
    case 'preview':
      return getServerTenantConfig('preview-tenant');
    case 'staging':
      return getServerTenantConfig('staging-tenant');
    case 'production':
    case 'development':
    default:
      return getCurrentServerTenantConfig();
  }
};
