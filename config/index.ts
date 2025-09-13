/**
 * Centralized configuration exports
 *
 * This module provides a single entry point for all configuration-related
 * functionality including feature flags, tenant configurations, and
 * environment-specific settings.
 */

// Feature flags
export {
  type FeatureFlags,
  getFeatureFlags,
  getServerFeatureFlags,
  useFeatureFlags,
  isFeatureEnabled,
  environmentFeatures,
  getCurrentEnvironmentFeatures,
  getServerCurrentEnvironmentFeatures,
} from './features';

// Tenant configuration
export {
  type TenantConfig,
  defaultTenantConfig,
  getTenantConfigs,
  clientTenantConfigs,
  getTenantConfig,
  getServerTenantConfig,
  getCurrentTenantConfig,
  getCurrentServerTenantConfig,
  tenantHasFeature,
  getTenantSetting,
  getEnvironmentTenantConfig,
  getServerEnvironmentTenantConfig,
} from './tenantConfig';

// Environment utilities
import {
  env,
  getEnvironmentConfig,
  getServerEnvironmentConfig,
} from '@/lib/env';

import { getFeatureFlags, getServerFeatureFlags } from './features';
import {
  getEnvironmentTenantConfig,
  getServerEnvironmentTenantConfig,
} from './tenantConfig';

/**
 * Client-safe application configuration
 * Use this in React components, client-side code, and SSG
 */
export const getAppConfig = () => {
  const environmentConfig = getEnvironmentConfig();
  const featureFlags = getFeatureFlags();
  const tenantConfig = getEnvironmentTenantConfig();

  return {
    environment: environmentConfig,
    features: featureFlags,
    tenant: tenantConfig,

    // Computed properties
    isMultiTenantEnabled: featureFlags.multiTenant,
    isFeatureFlagsEnabled: featureFlags.featureFlags,
    isAnalyticsEnabled: featureFlags.analytics,

    // Environment helpers
    isDevelopment: environmentConfig.isDevelopment,
    isPreview: environmentConfig.isPreview,
    isStaging: environmentConfig.isStaging,
    isProduction: environmentConfig.isProduction,
  };
};

/**
 * Server-side application configuration with full environment access
 * Use this in API routes, getServerSideProps, middleware, and server actions
 */
export const getServerAppConfig = () => {
  const environmentConfig = getServerEnvironmentConfig();
  const featureFlags = getServerFeatureFlags();
  const tenantConfig = getServerEnvironmentTenantConfig();

  return {
    environment: environmentConfig,
    features: featureFlags,
    tenant: tenantConfig,

    // Computed properties
    isMultiTenantEnabled: featureFlags.multiTenant,
    isFeatureFlagsEnabled: featureFlags.featureFlags,
    isAnalyticsEnabled: featureFlags.analytics,

    // Environment helpers
    isDevelopment: environmentConfig.isDevelopment,
    isPreview: environmentConfig.isPreview,
    isStaging: environmentConfig.isStaging,
    isProduction: environmentConfig.isProduction,
  };
};

/**
 * Client-safe configuration constants for easy access
 * Use this for simple config access in components
 * Only contains NEXT_PUBLIC_* variables and computed client-safe values
 */
export const CONFIG = {
  // Environment (client-safe)
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // URLs (client-safe)
  BASE_URL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000',

  // Feature flags (client-safe)
  FEATURES: getFeatureFlags(),

  // Tenant (client-safe)
  TENANT: getEnvironmentTenantConfig(),

  // API (client-safe - only public settings)
  API: {
    RATE_LIMIT_ENABLED:
      process.env.NEXT_PUBLIC_API_RATE_LIMIT_ENABLED === 'true',
    RATE_LIMIT_REQUESTS: parseInt(
      process.env.NEXT_PUBLIC_API_RATE_LIMIT_REQUESTS || '100',
    ),
    RATE_LIMIT_WINDOW: process.env.NEXT_PUBLIC_API_RATE_LIMIT_WINDOW || '15m',
  },

  // Multi-tenant (client-safe - only public settings)
  MULTI_TENANT: {
    ENABLED: process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED === 'true',
  },
} as const;

/**
 * Server-side configuration with full environment access
 * Use this in API routes, middleware, and server-side code that needs sensitive config
 */
export const getServerConfig = () => {
  const environmentConfig = getServerEnvironmentConfig();

  return {
    // Environment (server-only)
    NODE_ENV: env.NODE_ENV,
    APP_ENV: env.APP_ENV,
    APP_VERSION: env.APP_VERSION,
    VERCEL_ENV: env.VERCEL_ENV,
    VERCEL_URL: env.VERCEL_URL,

    // URLs
    BASE_URL: environmentConfig.baseUrl,

    // Feature flags (server-side)
    FEATURES: getServerFeatureFlags(),

    // Tenant (server-side)
    TENANT: getServerEnvironmentTenantConfig(),

    // Database (server-only)
    DATABASE: {
      URL: env.DATABASE_URL,
      POOL_SIZE: env.DATABASE_POOL_SIZE,
    },

    // API (server-only)
    API: {
      RATE_LIMIT_ENABLED: env.API_RATE_LIMIT_ENABLED,
      RATE_LIMIT_REQUESTS: env.API_RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW: env.API_RATE_LIMIT_WINDOW,
    },

    // Security (server-only)
    SECURITY: {
      CORS_ORIGINS: env.CORS_ORIGINS?.split(',') || ['*'],
      ALLOWED_HOSTS: env.ALLOWED_HOSTS?.split(',') || [],
    },

    // Logging (server-only)
    LOGGING: {
      LEVEL: env.LOG_LEVEL || 'info',
      FILE_LEVEL: env.FILE_LOG_LEVEL || 'error',
      CONSOLE_LEVEL: env.CONSOLE_LOG_LEVEL || 'info',
      TO_FILE: environmentConfig.isProduction
        ? env.LOG_TO_FILE_PROD
        : env.LOG_TO_FILE_DEV,
      DIR: env.LOG_DIR || './logs',
    },

    // External Services (server-only)
    EXTERNAL: {
      LOGFLARE: {
        ENABLED: env.LOGFLARE_INTEGRATION_ENABLED,
        LEVEL: env.LOGFLARE_LOG_LEVEL || 'info',
        API_KEY: env.LOGFLARE_API_KEY,
        SOURCE_TOKEN: env.LOGFLARE_SOURCE_TOKEN,
      },
      REDIS: {
        URL: env.UPSTASH_REDIS_REST_URL,
        TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
      },
      CLERK: {
        SECRET_KEY: env.CLERK_SECRET_KEY,
      },
    },

    // Feature Flags Provider (server-only)
    FEATURE_FLAGS: {
      PROVIDER: env.FEATURE_FLAGS_PROVIDER || 'local',
      GROWTHBOOK_CLIENT_KEY: env.GROWTHBOOK_CLIENT_KEY,
      LAUNCHDARKLY_SDK_KEY: env.LAUNCHDARKLY_SDK_KEY,
    },

    // Multi-tenant (server-only)
    MULTI_TENANT: {
      ENABLED: env.MULTI_TENANT_ENABLED,
      DEFAULT_TENANT_ID: env.DEFAULT_TENANT_ID || 'default',
      HEADER_NAME: env.TENANT_HEADER_NAME || 'x-tenant-id',
    },
  } as const;
};

/**
 * Type-safe configuration access
 */
export type AppConfig = ReturnType<typeof getAppConfig>;
export type ServerConfig = ReturnType<typeof getServerConfig>;

/**
 * React hook for accessing application configuration
 * Use this in React components for reactive config access
 */
export const useAppConfig = (): AppConfig => {
  return getAppConfig();
};
