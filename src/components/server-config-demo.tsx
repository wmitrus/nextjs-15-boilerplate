import { getServerConfig, getServerAppConfig } from '@/config';

/**
 * Server Configuration Demo Component
 * This component runs on the server and can safely access server-only configuration
 * Use this pattern for server components that need sensitive configuration
 */
export async function ServerConfigDemo() {
  // This runs on the server, so we can safely access server-only config
  const serverConfig = getServerConfig();
  const serverAppConfig = getServerAppConfig();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Server-Side Configuration Demo</h2>
        <p className="text-muted-foreground">
          Server-only configuration with sensitive data access
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Server Environment */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Server Environment</h3>
            <p className="text-muted-foreground text-sm">
              Server-side environment configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">NODE_ENV:</span>
              <span className="rounded bg-blue-100 px-2 py-1 text-sm">
                {serverConfig.NODE_ENV}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">APP_ENV:</span>
              <span className="rounded bg-green-100 px-2 py-1 text-sm">
                {serverConfig.APP_ENV}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">VERCEL_ENV:</span>
              <span className="text-sm">
                {serverConfig.VERCEL_ENV || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Database</h3>
            <p className="text-muted-foreground text-sm">
              Database connection configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Has URL:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.DATABASE.URL
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.DATABASE.URL ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pool Size:</span>
              <span className="text-sm">{serverConfig.DATABASE.POOL_SIZE}</span>
            </div>
          </div>
        </div>

        {/* Logging Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Logging</h3>
            <p className="text-muted-foreground text-sm">
              Server-side logging configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Level:</span>
              <span className="rounded bg-yellow-100 px-2 py-1 text-sm">
                {serverConfig.LOGGING.LEVEL}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">File Level:</span>
              <span className="text-sm">{serverConfig.LOGGING.FILE_LEVEL}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">File Logging:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.LOGGING.TO_FILE
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.LOGGING.TO_FILE ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* External Services */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">External Services</h3>
            <p className="text-muted-foreground text-sm">
              External service configurations
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Redis:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.EXTERNAL.REDIS.URL
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.EXTERNAL.REDIS.URL ? 'CONFIGURED' : 'NOT SET'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Logflare:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.EXTERNAL.LOGFLARE.ENABLED
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.EXTERNAL.LOGFLARE.ENABLED
                  ? 'ENABLED'
                  : 'DISABLED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Clerk:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.EXTERNAL.CLERK.SECRET_KEY
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.EXTERNAL.CLERK.SECRET_KEY
                  ? 'CONFIGURED'
                  : 'NOT SET'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Security</h3>
            <p className="text-muted-foreground text-sm">
              Security and CORS configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">CORS Origins:</span>
              <span className="text-sm">
                {serverConfig.SECURITY.CORS_ORIGINS.length} configured
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Allowed Hosts:</span>
              <span className="text-sm">
                {serverConfig.SECURITY.ALLOWED_HOSTS.length} configured
              </span>
            </div>
          </div>
        </div>

        {/* Feature Flags Provider */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Feature Flags</h3>
            <p className="text-muted-foreground text-sm">
              Feature flag provider configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Provider:</span>
              <span className="rounded bg-purple-100 px-2 py-1 text-sm">
                {serverConfig.FEATURE_FLAGS.PROVIDER}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">GrowthBook:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.FEATURE_FLAGS.GROWTHBOOK_CLIENT_KEY
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.FEATURE_FLAGS.GROWTHBOOK_CLIENT_KEY
                  ? 'SET'
                  : 'NOT SET'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">LaunchDarkly:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  serverConfig.FEATURE_FLAGS.LAUNCHDARKLY_SDK_KEY
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {serverConfig.FEATURE_FLAGS.LAUNCHDARKLY_SDK_KEY
                  ? 'SET'
                  : 'NOT SET'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Server App Config Summary */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            Server App Configuration Summary
          </h3>
          <p className="text-muted-foreground text-sm">
            Complete server-side application configuration
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {serverAppConfig.isDevelopment ? 'DEV' : 'PROD'}
            </div>
            <div className="text-muted-foreground text-sm">Environment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {serverAppConfig.isMultiTenantEnabled ? 'ON' : 'OFF'}
            </div>
            <div className="text-muted-foreground text-sm">Multi-Tenant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {serverAppConfig.isFeatureFlagsEnabled ? 'ON' : 'OFF'}
            </div>
            <div className="text-muted-foreground text-sm">Feature Flags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {serverAppConfig.isAnalyticsEnabled ? 'ON' : 'OFF'}
            </div>
            <div className="text-muted-foreground text-sm">Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
