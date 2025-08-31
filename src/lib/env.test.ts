// Mock process.env before importing
const originalEnv = process.env;

// Mock the createEnv function to avoid actual environment validation during tests
jest.mock('@t3-oss/env-nextjs', () => ({
  createEnv: jest.fn((config) => {
    const mockEnv: {
      NODE_ENV?: string;
      LOG_DIR?: string;
      LOG_LEVEL?: string;
      FILE_LOG_LEVEL?: string;
      CONSOLE_LOG_LEVEL?: string;
      LOG_TO_FILE_PROD?: boolean;
      LOG_TO_FILE_DEV?: boolean;
      LOGFLARE_INTEGRATION_ENABLED?: boolean;
      LOGFLARE_LOG_LEVEL?: string;
      LOGFLARE_API_KEY?: string;
      LOGFLARE_SOURCE_TOKEN?: string;
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;
      CODECOV_TOKEN?: string;
      VERCEL_ENV?: string;
      VERCEL_URL?: string;
      APP_ENV?: string;
      APP_VERSION?: string;
      FEATURE_FLAGS_ENABLED?: string;
      FEATURE_FLAGS_PROVIDER?: string;
      GROWTHBOOK_CLIENT_KEY?: string;
      LAUNCHDARKLY_SDK_KEY?: string;
      MULTI_TENANT_ENABLED?: string;
      DEFAULT_TENANT_ID?: string;
      TENANT_HEADER_NAME?: string;
      DATABASE_URL?: string;
      DATABASE_POOL_SIZE?: string;
      API_RATE_LIMIT_ENABLED?: string;
      API_RATE_LIMIT_REQUESTS?: string;
      API_RATE_LIMIT_WINDOW?: string;
      CORS_ORIGINS?: string;
      ALLOWED_HOSTS?: string;
      NEXT_PUBLIC_APP_ENV?: string;
      NEXT_PUBLIC_APP_VERSION?: string;
      NEXT_PUBLIC_VERCEL_URL?: string;
      NEXT_PUBLIC_FEATURE_FLAGS_ENABLED?: string;
      NEXT_PUBLIC_MULTI_TENANT_ENABLED?: string;
      NEXT_PUBLIC_ANALYTICS_ENABLED?: string;
    } = {};

    // Process server config
    if (config.server) {
      Object.keys(config.server).forEach((key) => {
        const envValue = process.env[key];
        const schema = config.server[key];

        if (envValue !== undefined) {
          try {
            // Parse and validate the value using the schema
            const result = schema.parse(envValue);
            mockEnv[key as keyof typeof mockEnv] = result;
          } catch (error) {
            // Re-throw validation errors to simulate real behavior
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `Invalid value for ${key}: ${envValue}. Error: ${errorMessage}`,
            );
          }
        } else {
          // Handle missing required values
          throw new Error(`Missing required environment variable: ${key}`);
        }
      });
    }

    return mockEnv;
  }),
}));

describe('Environment Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    // Create a new process.env object to avoid read-only issues
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test', // Set a default that won't cause issues
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('accepts valid environment variables', async () => {
    // Set up valid environment using Object.defineProperty to avoid read-only issues
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    process.env.LOG_DIR = 'logs';
    process.env.LOG_LEVEL = 'info';
    process.env.FILE_LOG_LEVEL = 'info';
    process.env.CONSOLE_LOG_LEVEL = 'info';
    process.env.LOG_TO_FILE_PROD = 'true';
    process.env.LOG_TO_FILE_DEV = 'true';
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'false';
    process.env.LOGFLARE_LOG_LEVEL = 'info';
    process.env.LOGFLARE_API_KEY = 'test-api-key';
    process.env.LOGFLARE_SOURCE_TOKEN = 'test-source-token';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
    process.env.CODECOV_TOKEN = 'test-codecov-token';
    process.env.VERCEL_ENV = 'development';
    process.env.VERCEL_URL = 'test.vercel.app';
    process.env.APP_ENV = 'development';
    process.env.APP_VERSION = '1.0.0';
    process.env.FEATURE_FLAGS_ENABLED = 'true';
    process.env.FEATURE_FLAGS_PROVIDER = 'local';
    process.env.GROWTHBOOK_CLIENT_KEY = 'test-growthbook-key';
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-launchdarkly-key';
    process.env.MULTI_TENANT_ENABLED = 'false';
    process.env.DEFAULT_TENANT_ID = 'default';
    process.env.TENANT_HEADER_NAME = 'x-tenant-id';
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.DATABASE_POOL_SIZE = '10';
    process.env.API_RATE_LIMIT_ENABLED = 'true';
    process.env.API_RATE_LIMIT_REQUESTS = '100';
    process.env.API_RATE_LIMIT_WINDOW = '15m';
    process.env.CORS_ORIGINS = '*';
    process.env.ALLOWED_HOSTS = 'localhost';

    // This should not throw
    await expect(async () => {
      const { env } = await import('./env');
      return env;
    }).not.toThrow();
  });

  test('rejects invalid LOG_LEVEL', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    process.env.LOG_DIR = 'logs';
    process.env.LOG_LEVEL = 'invalid_level'; // Invalid value
    process.env.FILE_LOG_LEVEL = 'info';
    process.env.CONSOLE_LOG_LEVEL = 'info';
    process.env.LOG_TO_FILE_PROD = 'true';
    process.env.LOG_TO_FILE_DEV = 'true';
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'false';
    process.env.LOGFLARE_LOG_LEVEL = 'info';
    process.env.LOGFLARE_API_KEY = 'test-api-key';
    process.env.LOGFLARE_SOURCE_TOKEN = 'test-source-atoken';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
    process.env.CODECOV_TOKEN = 'test-codecov-token';
    process.env.VERCEL_ENV = 'development';
    process.env.VERCEL_URL = 'test.vercel.app';
    process.env.APP_ENV = 'development';
    process.env.APP_VERSION = '1.0.0';
    process.env.FEATURE_FLAGS_ENABLED = 'true';
    process.env.FEATURE_FLAGS_PROVIDER = 'local';
    process.env.GROWTHBOOK_CLIENT_KEY = 'test-growthbook-key';
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-launchdarkly-key';
    process.env.MULTI_TENANT_ENABLED = 'false';
    process.env.DEFAULT_TENANT_ID = 'default';
    process.env.TENANT_HEADER_NAME = 'x-tenant-id';
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.DATABASE_POOL_SIZE = '10';
    process.env.API_RATE_LIMIT_ENABLED = 'true';
    process.env.API_RATE_LIMIT_REQUESTS = '100';
    process.env.API_RATE_LIMIT_WINDOW = '15m';
    process.env.CORS_ORIGINS = '*';
    process.env.ALLOWED_HOSTS = 'localhost';

    // This should throw due to invalid LOG_LEVEL
    await expect(async () => {
      const { env } = await import('./env');
      return env;
    }).rejects.toThrow();
  });

  test('transforms LOG_TO_FILE_PROD correctly', async () => {
    // Setup base environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    process.env.LOG_DIR = 'logs';
    process.env.LOG_LEVEL = 'info';
    process.env.FILE_LOG_LEVEL = 'info';
    process.env.CONSOLE_LOG_LEVEL = 'info';
    process.env.LOG_TO_FILE_DEV = 'true';
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'false';
    process.env.LOGFLARE_LOG_LEVEL = 'info';
    process.env.LOGFLARE_API_KEY = 'test-api-key';
    process.env.LOGFLARE_SOURCE_TOKEN = 'test-source-token';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
    process.env.CODECOV_TOKEN = 'test-codecov-token';
    process.env.VERCEL_ENV = 'development';
    process.env.VERCEL_URL = 'test.vercel.app';
    process.env.APP_ENV = 'development';
    process.env.APP_VERSION = '1.0.0';
    process.env.FEATURE_FLAGS_ENABLED = 'true';
    process.env.FEATURE_FLAGS_PROVIDER = 'local';
    process.env.GROWTHBOOK_CLIENT_KEY = 'test-growthbook-key';
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-launchdarkly-key';
    process.env.MULTI_TENANT_ENABLED = 'false';
    process.env.DEFAULT_TENANT_ID = 'default';
    process.env.TENANT_HEADER_NAME = 'x-tenant-id';
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.DATABASE_POOL_SIZE = '10';
    process.env.API_RATE_LIMIT_ENABLED = 'true';
    process.env.API_RATE_LIMIT_REQUESTS = '100';
    process.env.API_RATE_LIMIT_WINDOW = '15m';
    process.env.CORS_ORIGINS = '*';
    process.env.ALLOWED_HOSTS = 'localhost';

    // Test true case
    process.env.LOG_TO_FILE_PROD = 'true';
    const envModule1 = await import('./env');
    expect(envModule1.env.LOG_TO_FILE_PROD).toBe(true);

    // Reset and test false case
    jest.resetModules();
    process.env.LOG_TO_FILE_PROD = 'false';
    const envModule2 = await import('./env');
    expect(envModule2.env.LOG_TO_FILE_PROD).toBe(false);

    // Reset and test '0' case (should be false)
    jest.resetModules();
    process.env.LOG_TO_FILE_PROD = '0';
    const envModule3 = await import('./env');
    expect(envModule3.env.LOG_TO_FILE_PROD).toBe(false);
  });

  test('transforms LOG_TO_FILE_DEV correctly', async () => {
    // Setup base environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    process.env.LOG_DIR = 'logs';
    process.env.LOG_LEVEL = 'info';
    process.env.FILE_LOG_LEVEL = 'info';
    process.env.CONSOLE_LOG_LEVEL = 'info';
    process.env.LOG_TO_FILE_PROD = 'true';
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'false';
    process.env.LOGFLARE_LOG_LEVEL = 'info';
    process.env.LOGFLARE_API_KEY = 'test-api-key';
    process.env.LOGFLARE_SOURCE_TOKEN = 'test-source-token';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
    process.env.CODECOV_TOKEN = 'test-codecov-token';
    process.env.VERCEL_ENV = 'development';
    process.env.VERCEL_URL = 'test.vercel.app';
    process.env.APP_ENV = 'development';
    process.env.APP_VERSION = '1.0.0';
    process.env.FEATURE_FLAGS_ENABLED = 'true';
    process.env.FEATURE_FLAGS_PROVIDER = 'local';
    process.env.GROWTHBOOK_CLIENT_KEY = 'test-growthbook-key';
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-launchdarkly-key';
    process.env.MULTI_TENANT_ENABLED = 'false';
    process.env.DEFAULT_TENANT_ID = 'default';
    process.env.TENANT_HEADER_NAME = 'x-tenant-id';
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.DATABASE_POOL_SIZE = '10';
    process.env.API_RATE_LIMIT_ENABLED = 'true';
    process.env.API_RATE_LIMIT_REQUESTS = '100';
    process.env.API_RATE_LIMIT_WINDOW = '15m';
    process.env.CORS_ORIGINS = '*';
    process.env.ALLOWED_HOSTS = 'localhost';

    // Test true case
    process.env.LOG_TO_FILE_DEV = 'true';
    const envModule1 = await import('./env');
    expect(envModule1.env.LOG_TO_FILE_DEV).toBe(true);

    // Reset and test false case
    jest.resetModules();
    process.env.LOG_TO_FILE_DEV = 'false';
    const envModule2 = await import('./env');
    expect(envModule2.env.LOG_TO_FILE_DEV).toBe(false);
  });

  test('transforms LOGFLARE_INTEGRATION_ENABLED correctly', async () => {
    // Setup base environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    process.env.LOG_DIR = 'logs';
    process.env.LOG_LEVEL = 'info';
    process.env.FILE_LOG_LEVEL = 'info';
    process.env.CONSOLE_LOG_LEVEL = 'info';
    process.env.LOG_TO_FILE_PROD = 'true';
    process.env.LOG_TO_FILE_DEV = 'true';
    process.env.LOGFLARE_LOG_LEVEL = 'info';
    process.env.LOGFLARE_API_KEY = 'test-api-key';
    process.env.LOGFLARE_SOURCE_TOKEN = 'test-source-token';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
    process.env.CODECOV_TOKEN = 'test-codecov-token';
    process.env.VERCEL_ENV = 'development';
    process.env.VERCEL_URL = 'test.vercel.app';
    process.env.APP_ENV = 'development';
    process.env.APP_VERSION = '1.0.0';
    process.env.FEATURE_FLAGS_ENABLED = 'true';
    process.env.FEATURE_FLAGS_PROVIDER = 'local';
    process.env.GROWTHBOOK_CLIENT_KEY = 'test-growthbook-key';
    process.env.LAUNCHDARKLY_SDK_KEY = 'test-launchdarkly-key';
    process.env.MULTI_TENANT_ENABLED = 'false';
    process.env.DEFAULT_TENANT_ID = 'default';
    process.env.TENANT_HEADER_NAME = 'x-tenant-id';
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.DATABASE_POOL_SIZE = '10';
    process.env.API_RATE_LIMIT_ENABLED = 'true';
    process.env.API_RATE_LIMIT_REQUESTS = '100';
    process.env.API_RATE_LIMIT_WINDOW = '15m';
    process.env.CORS_ORIGINS = '*';
    process.env.ALLOWED_HOSTS = 'localhost';

    // Test true case
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'true';
    const envModule1 = await import('./env');
    expect(envModule1.env.LOGFLARE_INTEGRATION_ENABLED).toBe(true);

    // Reset and test false case
    jest.resetModules();
    process.env.LOGFLARE_INTEGRATION_ENABLED = 'false';
    const envModule2 = await import('./env');
    expect(envModule2.env.LOGFLARE_INTEGRATION_ENABLED).toBe(false);
  });
});
