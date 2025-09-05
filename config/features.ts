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
 * Get feature flags based on current environment (client-safe)
 */
export const getFeatureFlags = (): FeatureFlags => {
  // Client-safe environment detection using NEXT_PUBLIC_* vars
  const isDevelopment =
    typeof window !== 'undefined'
      ? true // Assume development on client-side for safety
      : process.env.NODE_ENV === 'development';

  const isPreview = process.env.NEXT_PUBLIC_APP_ENV === 'preview';
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'production';

  return {
    // Core features - client-safe defaults
    multiTenant: process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED === 'true',
    featureFlags: process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED !== 'false', // Default to true
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',

    // API features
    rateLimiting: process.env.NEXT_PUBLIC_API_RATE_LIMIT_ENABLED === 'true',

    // Logging features
    logflareIntegration:
      process.env.NEXT_PUBLIC_LOGFLARE_INTEGRATION_ENABLED === 'true',
    fileLogging: isProduction,

    // Development features
    debugMode: isDevelopment || isPreview,
    storybook: isDevelopment || isPreview,

    // Future features - can be controlled via environment variables
    newDashboard:
      process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true' || isPreview,
    advancedReporting:
      process.env.NEXT_PUBLIC_FEATURE_ADVANCED_REPORTING === 'true' ||
      isStaging ||
      isPreview,
    betaFeatures:
      process.env.NEXT_PUBLIC_FEATURE_BETA_FEATURES === 'true' ||
      isDevelopment ||
      isPreview,
  };
};

/**
 * Server-side feature flags with full environment access
 */
export const getServerFeatureFlags = (): FeatureFlags => {
  // Import server env only on server-side
  if (typeof window !== 'undefined') {
    return getFeatureFlags();
  }

  // Use dynamic import to avoid bundling on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require('@/lib/env');

  const isDevelopment = env.NODE_ENV === 'development';
  const isPreview = env.VERCEL_ENV === 'preview' || env.APP_ENV === 'preview';
  const isStaging = env.APP_ENV === 'staging';
  const isProduction =
    env.NODE_ENV === 'production' && env.APP_ENV === 'production';

  return {
    // Core features - server-side with full env access
    multiTenant: env.MULTI_TENANT_ENABLED === 'true',
    featureFlags: env.FEATURE_FLAGS_ENABLED === 'true',
    analytics: env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',

    // API features (server-only)
    rateLimiting: env.API_RATE_LIMIT_ENABLED === 'true',

    // Logging features (server-only)
    logflareIntegration: env.LOGFLARE_INTEGRATION_ENABLED === 'true',
    fileLogging: isProduction
      ? env.LOG_TO_FILE_PROD === 'true'
      : env.LOG_TO_FILE_DEV === 'true',

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
 * Get features for current environment (client-safe)
 */
export const getCurrentEnvironmentFeatures = () => {
  const currentEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';

  return (
    environmentFeatures[currentEnv as keyof typeof environmentFeatures] ||
    environmentFeatures.development
  );
};

/**
 * Server-side function to get features for current environment
 */
export const getServerCurrentEnvironmentFeatures = () => {
  // Import server env only on server-side
  if (typeof window !== 'undefined') {
    return getCurrentEnvironmentFeatures();
  }

  // Use dynamic import to avoid bundling on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require('@/lib/env');

  const currentEnv = env.APP_ENV || 'development';
  return (
    environmentFeatures[currentEnv as keyof typeof environmentFeatures] ||
    environmentFeatures.development
  );
};
