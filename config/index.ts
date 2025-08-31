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
  useFeatureFlags,
  isFeatureEnabled,
  environmentFeatures,
  getCurrentEnvironmentFeatures,
} from './features';

// Tenant configuration
export {
  type TenantConfig,
  defaultTenantConfig,
  tenantConfigs,
  getTenantConfig,
  getCurrentTenantConfig,
  tenantHasFeature,
  getTenantSetting,
  getEnvironmentTenantConfig,
} from './tenantConfig';

// Environment utilities
import { env, getEnvironmentConfig } from '@/lib/env';

import { getFeatureFlags } from './features';
import { getEnvironmentTenantConfig } from './tenantConfig';

/**
 * Complete application configuration
 * Combines environment, feature flags, and tenant configuration
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
 * Configuration constants for easy access
 */
export const CONFIG = {
  // Environment
  NODE_ENV: env.NODE_ENV,
  APP_ENV: env.APP_ENV,
  APP_VERSION: env.APP_VERSION,

  // URLs
  BASE_URL: env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : 'http://localhost:3000',

  // Feature flags
  FEATURES: getFeatureFlags(),

  // Tenant
  TENANT: getEnvironmentTenantConfig(),

  // API
  API: {
    RATE_LIMIT_ENABLED: env.API_RATE_LIMIT_ENABLED,
    RATE_LIMIT_REQUESTS: env.API_RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW: env.API_RATE_LIMIT_WINDOW,
  },

  // Logging
  LOGGING: {
    LEVEL: env.LOG_LEVEL,
    FILE_LEVEL: env.FILE_LOG_LEVEL,
    CONSOLE_LEVEL: env.CONSOLE_LOG_LEVEL,
    TO_FILE:
      env.NODE_ENV === 'production'
        ? env.LOG_TO_FILE_PROD
        : env.LOG_TO_FILE_DEV,
    DIR: env.LOG_DIR,
  },
} as const;

/**
 * Type-safe configuration access
 */
export type AppConfig = ReturnType<typeof getAppConfig>;

/**
 * React hook for accessing application configuration
 */
export const useAppConfig = (): AppConfig => {
  return getAppConfig();
};
