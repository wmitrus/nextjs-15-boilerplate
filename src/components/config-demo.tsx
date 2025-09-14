'use client';

import { useAppConfig, CONFIG } from '@/config';

/**
 * Configuration Demo Component
 * Showcases the new centralized configuration system
 */
export function ConfigDemo() {
  const appConfig = useAppConfig();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Configuration System Demo</h2>
        <p className="text-muted-foreground">
          Centralized configuration with environment-specific feature flags and
          tenant settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Environment Info */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Environment</h3>
            <p className="text-muted-foreground text-sm">
              Current environment configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Environment:</span>
              <span className="rounded bg-blue-100 px-2 py-1 text-sm">
                {appConfig.environment.environment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Version:</span>
              <span className="text-sm">{appConfig.environment.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Node ENV:</span>
              <span className="text-sm">{CONFIG.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Production:</span>
              <span
                className={`text-sm ${appConfig.isProduction ? 'text-green-600' : 'text-orange-600'}`}
              >
                {appConfig.isProduction ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Preview:</span>
              <span
                className={`text-sm ${appConfig.isPreview ? 'text-blue-600' : 'text-gray-600'}`}
              >
                {appConfig.isPreview ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Feature Flags</h3>
            <p className="text-muted-foreground text-sm">
              Environment-specific feature toggles
            </p>
          </div>
          <div className="space-y-2">
            {Object.entries(appConfig.features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    value
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {value ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Tenant Config</h3>
            <p className="text-muted-foreground text-sm">
              Multi-tenant configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Tenant ID:</span>
              <span className="rounded bg-purple-100 px-2 py-1 text-sm">
                {appConfig.tenant.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span className="text-sm">{appConfig.tenant.name}</span>
            </div>
            {appConfig.tenant.subdomain && (
              <div className="flex justify-between">
                <span className="font-medium">Subdomain:</span>
                <span className="text-sm">{appConfig.tenant.subdomain}</span>
              </div>
            )}
            <div className="mt-3">
              <span className="text-sm font-medium">Tenant Features:</span>
              <div className="mt-1 space-y-1">
                {Object.entries(appConfig.tenant.features || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span
                        className={`rounded px-1 py-0.5 text-xs ${
                          value
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {value ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">API Settings</h3>
            <p className="text-muted-foreground text-sm">
              API and rate limiting configuration
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Rate Limiting:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  CONFIG.API.RATE_LIMIT_ENABLED
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {CONFIG.API.RATE_LIMIT_ENABLED ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Requests/Window:</span>
              <span className="text-sm">{CONFIG.API.RATE_LIMIT_REQUESTS}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Window:</span>
              <span className="text-sm">{CONFIG.API.RATE_LIMIT_WINDOW}</span>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Configuration */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Multi-Tenant</h3>
            <p className="text-muted-foreground text-sm">
              Multi-tenant configuration (client-safe)
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Enabled:</span>
              <span
                className={`rounded px-2 py-1 text-sm ${
                  CONFIG.MULTI_TENANT.ENABLED
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {CONFIG.MULTI_TENANT.ENABLED ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Current Tenant:</span>
              <span className="text-sm">{CONFIG.TENANT.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tenant Name:</span>
              <span className="text-sm">{CONFIG.TENANT.name}</span>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Application URLs</h3>
            <p className="text-muted-foreground text-sm">
              Base URL and environment URLs
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Base URL:</span>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                {CONFIG.BASE_URL}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Environment URL:</span>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                {appConfig.environment.baseUrl}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Usage Examples */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Usage Examples</h3>
          <p className="text-muted-foreground text-sm">
            How to use the configuration system in your code
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Import and use configuration:</h4>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">
              {`import { CONFIG, useAppConfig, isFeatureEnabled } from '@/config';

// Static configuration access
const apiEnabled = CONFIG.API.RATE_LIMIT_ENABLED;

// React hook for dynamic configuration
const appConfig = useAppConfig();

// Feature flag checking
const showNewDashboard = isFeatureEnabled('newDashboard');`}
            </pre>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Environment-specific behavior:</h4>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">
              {`// Different behavior per environment
if (appConfig.isProduction) {
  // Production-only code
} else if (appConfig.isPreview) {
  // Preview environment features
} else if (appConfig.isDevelopment) {
  // Development tools
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
