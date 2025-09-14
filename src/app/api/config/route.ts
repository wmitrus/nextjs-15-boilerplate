import { NextResponse } from 'next/server';

import { getServerConfig } from '@/config';

/**
 * API route to demonstrate server-side configuration access
 * This shows how to safely access server-only configuration in API routes
 */
export async function GET() {
  try {
    const serverConfig = getServerConfig();

    // Return only non-sensitive configuration for demo purposes
    const demoConfig = {
      environment: {
        NODE_ENV: serverConfig.NODE_ENV,
        APP_ENV: serverConfig.APP_ENV,
        APP_VERSION: serverConfig.APP_VERSION,
        VERCEL_ENV: serverConfig.VERCEL_ENV,
      },
      database: {
        hasUrl: !!serverConfig.DATABASE.URL,
        poolSize: serverConfig.DATABASE.POOL_SIZE,
      },
      api: {
        rateLimitEnabled: serverConfig.API.RATE_LIMIT_ENABLED,
        rateLimitRequests: serverConfig.API.RATE_LIMIT_REQUESTS,
        rateLimitWindow: serverConfig.API.RATE_LIMIT_WINDOW,
      },
      logging: {
        level: serverConfig.LOGGING.LEVEL,
        fileLevel: serverConfig.LOGGING.FILE_LEVEL,
        consoleLevel: serverConfig.LOGGING.CONSOLE_LEVEL,
        toFile: serverConfig.LOGGING.TO_FILE,
        dir: serverConfig.LOGGING.DIR,
      },
      multiTenant: {
        enabled: serverConfig.MULTI_TENANT.ENABLED,
        defaultTenantId: serverConfig.MULTI_TENANT.DEFAULT_TENANT_ID,
        headerName: serverConfig.MULTI_TENANT.HEADER_NAME,
      },
      external: {
        logflare: {
          enabled: serverConfig.EXTERNAL.LOGFLARE.ENABLED,
          level: serverConfig.EXTERNAL.LOGFLARE.LEVEL,
          hasApiKey: !!serverConfig.EXTERNAL.LOGFLARE.API_KEY,
          hasSourceToken: !!serverConfig.EXTERNAL.LOGFLARE.SOURCE_TOKEN,
        },
        redis: {
          hasUrl: !!serverConfig.EXTERNAL.REDIS.URL,
          hasToken: !!serverConfig.EXTERNAL.REDIS.TOKEN,
        },
        clerk: {
          hasSecretKey: !!serverConfig.EXTERNAL.CLERK.SECRET_KEY,
        },
      },
      featureFlags: {
        provider: serverConfig.FEATURE_FLAGS.PROVIDER,
        hasGrowthbookKey: !!serverConfig.FEATURE_FLAGS.GROWTHBOOK_CLIENT_KEY,
        hasLaunchdarklyKey: !!serverConfig.FEATURE_FLAGS.LAUNCHDARKLY_SDK_KEY,
      },
    };

    return NextResponse.json({
      success: true,
      data: demoConfig,
      message: 'Server configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching server config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch server configuration',
      },
      { status: 500 },
    );
  }
}
