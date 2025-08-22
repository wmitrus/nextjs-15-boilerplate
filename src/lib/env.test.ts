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
