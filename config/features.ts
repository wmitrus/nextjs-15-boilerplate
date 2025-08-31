import { env } from '@/lib/env';

/**
 * Feature flag configuration
 * Maps feature flags to environment variables for centralized management
 */
export interface FeatureFlags {
  // Core features
  multiTenant: boolean;
  featureFlags: boolean;
  analytics: boolean;

  // API features
  rateLimiting: boolean;

  // Logging features
  logflareIntegration: boolean;
  fileLogging: boolean;

  // Development features
  debugMode: boolean;
  storybook: boolean;

  // Future features (examples)
  newDashboard: boolean;
  advancedReporting: boolean;
  betaFeatures: boolean;
}

/**
 * Get feature flags based on current environment
 */
export const getFeatureFlags = (): FeatureFlags => {
  const isDevelopment = env.NODE_ENV === 'development';
  const isPreview = env.VERCEL_ENV === 'preview' || env.APP_ENV === 'preview';
  const isStaging = env.APP_ENV === 'staging';
  const isProduction =
    env.NODE_ENV === 'production' && env.APP_ENV === 'production';

  return {
    // Core features - environment-based defaults with override capability
    multiTenant: env.MULTI_TENANT_ENABLED,
    featureFlags: env.FEATURE_FLAGS_ENABLED,
    analytics: env.NEXT_PUBLIC_ANALYTICS_ENABLED,

    // API features
    rateLimiting: env.API_RATE_LIMIT_ENABLED,

    // Logging features
    logflareIntegration: env.LOGFLARE_INTEGRATION_ENABLED,
    fileLogging: isProduction ? env.LOG_TO_FILE_PROD : env.LOG_TO_FILE_DEV,

    // Development features
    debugMode: isDevelopment || isPreview,
    storybook: isDevelopment || isPreview,

    // Future features - can be controlled via environment variables
    newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true' || isPreview,
    advancedReporting:
      process.env.FEATURE_ADVANCED_REPORTING === 'true' ||
      isStaging ||
      isPreview,
    betaFeatures:
      process.env.FEATURE_BETA_FEATURES === 'true' ||
      isDevelopment ||
      isPreview,
  };
};

/**
 * Feature flag hooks for React components
 */
export const useFeatureFlags = () => {
  return getFeatureFlags();
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};

/**
 * Environment-specific feature configurations
 */
export const environmentFeatures = {
  development: {
    // All features enabled for development
    enableAll: true,
    debugMode: true,
    storybook: true,
  },
  preview: {
    // Preview environment for testing new features
    newDashboard: true,
    advancedReporting: true,
    betaFeatures: true,
    debugMode: true,
  },
  staging: {
    // Staging environment for pre-production testing
    advancedReporting: true,
    debugMode: false,
  },
  production: {
    // Production environment - only stable features
    debugMode: false,
    betaFeatures: false,
  },
} as const;

/**
 * Get features for current environment
 */
export const getCurrentEnvironmentFeatures = () => {
  const currentEnv = env.APP_ENV;
  return environmentFeatures[currentEnv] || environmentFeatures.development;
};
