// Mock for @t3-oss/env-nextjs in test environment
const mockEnv = {
  // Server environment
  NODE_ENV: 'test',
  VERCEL_ENV: undefined,
  VERCEL_URL: undefined,

  APP_ENV: 'test',
  APP_VERSION: '1.0.0-test',

  FEATURE_FLAGS_ENABLED: true,
  FEATURE_FLAGS_PROVIDER: 'local',
  GROWTHBOOK_CLIENT_KEY: undefined,
  LAUNCHDARKLY_SDK_KEY: undefined,

  MULTI_TENANT_ENABLED: false,
  DEFAULT_TENANT_ID: 'default',
  TENANT_HEADER_NAME: 'x-tenant-id',

  DATABASE_URL: undefined,
  DATABASE_POOL_SIZE: 10,

  API_RATE_LIMIT_ENABLED: true,
  API_RATE_LIMIT_REQUESTS: 100,
  API_RATE_LIMIT_WINDOW: '15m',

  LOG_DIR: './logs',
  LOG_LEVEL: 'info',
  FILE_LOG_LEVEL: 'info',
  CONSOLE_LOG_LEVEL: 'info',
  LOG_TO_FILE_PROD: false,
  LOG_TO_FILE_DEV: false,

  LOGFLARE_INTEGRATION_ENABLED: false,
  LOGFLARE_LOG_LEVEL: 'info',
  LOGFLARE_API_KEY: undefined,
  LOGFLARE_SOURCE_TOKEN: undefined,

  UPSTASH_REDIS_REST_URL: undefined,
  UPSTASH_REDIS_REST_TOKEN: undefined,

  CORS_ORIGINS: '*',
  ALLOWED_HOSTS: undefined,

  CLERK_SECRET_KEY: 'sk_test_A5VITVIWv0KPDDr4v72bEsfGTLsnTMKgs4AfdULJcx',

  // Client environment
  NEXT_PUBLIC_APP_ENV: 'test',
  NEXT_PUBLIC_APP_VERSION: '1.0.0-test',
  NEXT_PUBLIC_VERCEL_URL: undefined,
  NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: true,
  NEXT_PUBLIC_MULTI_TENANT_ENABLED: false,
  NEXT_PUBLIC_ANALYTICS_ENABLED: false,

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    'pk_test_c2V0dGxpbmctY2FsZi0zNi5jbGVyay5hY2NvdW50cy5kZXYk',
};

// Mock the createEnv function
const createEnv = jest.fn(() => mockEnv);

// Mock environment config functions
const getEnvironmentConfig = jest.fn(() => ({
  isProduction: false,
  isPreview: false,
  isDevelopment: false,
  isTest: true,
  isStaging: false,
  environment: 'test',
  version: '1.0.0-test',
  baseUrl: 'http://localhost:3000',
}));

const getServerEnvironmentConfig = jest.fn(() => ({
  isProduction: false,
  isPreview: false,
  isDevelopment: false,
  isTest: true,
  isStaging: false,
  environment: 'test',
  version: '1.0.0-test',
  baseUrl: 'http://localhost:3000',
}));

module.exports = {
  createEnv,
  env: mockEnv,
  getEnvironmentConfig,
  getServerEnvironmentConfig,
};
