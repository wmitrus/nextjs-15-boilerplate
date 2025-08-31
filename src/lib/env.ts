import { createEnv } from '@t3-oss/env-nextjs';
import { levels } from 'pino';
import { z } from 'zod';

// const logLevels = Object.keys(pino.levels.values) as [Level, ...Level[]];
const logLevels = Object.values(levels.labels) as [string, ...string[]];

export const env = createEnv({
  server: {
    // Environment configuration
    NODE_ENV: z.enum(['development', 'test', 'production']),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
    VERCEL_URL: z.string().optional(),

    // Application configuration
    APP_ENV: z
      .enum(['development', 'staging', 'preview', 'production'])
      .default('development'),
    APP_VERSION: z.string().default('1.0.0'),

    // Feature flags
    FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(true),
    FEATURE_FLAGS_PROVIDER: z
      .enum(['local', 'launchdarkly', 'growthbook', 'vercel'])
      .default('local'),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    LAUNCHDARKLY_SDK_KEY: z.string().optional(),

    // Multi-tenant configuration
    MULTI_TENANT_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(false),
    DEFAULT_TENANT_ID: z.string().default('default'),
    TENANT_HEADER_NAME: z.string().default('x-tenant-id'),

    // Database configuration per environment
    DATABASE_URL: z.url().optional(),
    DATABASE_POOL_SIZE: z.string().transform(Number).default(10),

    // API configuration
    API_RATE_LIMIT_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(true),
    API_RATE_LIMIT_REQUESTS: z.string().transform(Number).default(100),
    API_RATE_LIMIT_WINDOW: z.string().default('15m'),

    // Logging configuration
    LOG_DIR: z.string().min(1),
    LOG_LEVEL: z.enum(logLevels),
    FILE_LOG_LEVEL: z.enum(logLevels),
    CONSOLE_LOG_LEVEL: z.enum(logLevels),
    LOG_TO_FILE_PROD: z.string().transform((s) => s !== 'false' && s !== '0'),
    LOG_TO_FILE_DEV: z.string().transform((s) => s !== 'false' && s !== '0'),

    // External integrations
    LOGFLARE_INTEGRATION_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0'),
    LOGFLARE_LOG_LEVEL: z.enum(logLevels),
    LOGFLARE_API_KEY: z.string().min(1),
    LOGFLARE_SOURCE_TOKEN: z.string().min(1),

    // Redis configuration
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // Security
    CORS_ORIGINS: z.string().default('*'),
    ALLOWED_HOSTS: z.string().optional(),
  },
  client: {
    // Public environment variables
    NEXT_PUBLIC_APP_ENV: z
      .enum(['development', 'staging', 'preview', 'production'])
      .default('development'),
    NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(true),
    NEXT_PUBLIC_MULTI_TENANT_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(false),
    NEXT_PUBLIC_ANALYTICS_ENABLED: z
      .string()
      .transform((s) => s !== 'false' && s !== '0')
      .default(false),
  },
  runtimeEnv: {
    // Server environment
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,

    APP_ENV: process.env.APP_ENV,
    APP_VERSION: process.env.APP_VERSION,

    FEATURE_FLAGS_ENABLED: process.env.FEATURE_FLAGS_ENABLED,
    FEATURE_FLAGS_PROVIDER: process.env.FEATURE_FLAGS_PROVIDER,
    GROWTHBOOK_CLIENT_KEY: process.env.GROWTHBOOK_CLIENT_KEY,
    LAUNCHDARKLY_SDK_KEY: process.env.LAUNCHDARKLY_SDK_KEY,

    MULTI_TENANT_ENABLED: process.env.MULTI_TENANT_ENABLED,
    DEFAULT_TENANT_ID: process.env.DEFAULT_TENANT_ID,
    TENANT_HEADER_NAME: process.env.TENANT_HEADER_NAME,

    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,

    API_RATE_LIMIT_ENABLED: process.env.API_RATE_LIMIT_ENABLED,
    API_RATE_LIMIT_REQUESTS: process.env.API_RATE_LIMIT_REQUESTS,
    API_RATE_LIMIT_WINDOW: process.env.API_RATE_LIMIT_WINDOW,

    LOG_DIR: process.env.LOG_DIR,
    LOG_LEVEL: process.env.LOG_LEVEL,
    FILE_LOG_LEVEL: process.env.FILE_LOG_LEVEL,
    CONSOLE_LOG_LEVEL: process.env.CONSOLE_LOG_LEVEL,
    LOG_TO_FILE_PROD: process.env.LOG_TO_FILE_PROD,
    LOG_TO_FILE_DEV: process.env.LOG_TO_FILE_DEV,

    LOGFLARE_INTEGRATION_ENABLED: process.env.LOGFLARE_INTEGRATION_ENABLED,
    LOGFLARE_LOG_LEVEL: process.env.LOGFLARE_LOG_LEVEL,
    LOGFLARE_API_KEY: process.env.LOGFLARE_API_KEY,
    LOGFLARE_SOURCE_TOKEN: process.env.LOGFLARE_SOURCE_TOKEN,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    CORS_ORIGINS: process.env.CORS_ORIGINS,
    ALLOWED_HOSTS: process.env.ALLOWED_HOSTS,

    // Client environment
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED,
    NEXT_PUBLIC_MULTI_TENANT_ENABLED:
      process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  },
});

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const isProduction = env.NODE_ENV === 'production';
  const isPreview = env.VERCEL_ENV === 'preview';
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    isProduction,
    isPreview,
    isDevelopment,
    isStaging: env.APP_ENV === 'staging',
    environment: env.APP_ENV,
    version: env.APP_VERSION,
    baseUrl: env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : 'http://localhost:3000',
  };
};
