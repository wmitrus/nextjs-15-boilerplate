'use client';

import { useTenant } from '@/lib/multi-tenant';

interface EnvironmentInfoProps {
  serverEnv?: {
    environment: string;
    version: string;
    isProduction: boolean;
    isPreview: boolean;
    isDevelopment: boolean;
  };
}

export function EnvironmentInfo({ serverEnv }: EnvironmentInfoProps) {
  const { tenant, isMultiTenant, tenantId } = useTenant();

  // Client-side environment info
  const clientEnv = {
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
    featureFlagsEnabled: process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED,
    multiTenantEnabled: process.env.NEXT_PUBLIC_MULTI_TENANT_ENABLED,
    analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Environment & Configuration</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Server Environment */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold text-green-700">
            Server Environment
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Environment:</span>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  serverEnv?.isProduction
                    ? 'bg-red-100 text-red-800'
                    : serverEnv?.isPreview
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {serverEnv?.environment || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Version:</span>
              <span className="font-mono">
                {serverEnv?.version || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Production:</span>
              <span>{serverEnv?.isProduction ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Preview:</span>
              <span>{serverEnv?.isPreview ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Development:</span>
              <span>{serverEnv?.isDevelopment ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>

        {/* Client Environment */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold text-blue-700">
            Client Environment
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">App Environment:</span>
              <span className="font-mono">{clientEnv.appEnv}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">App Version:</span>
              <span className="font-mono">{clientEnv.appVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Vercel URL:</span>
              <span className="font-mono text-xs">
                {clientEnv.vercelUrl || 'localhost'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Feature Flags:</span>
              <span>
                {clientEnv.featureFlagsEnabled === 'true' ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Multi-tenant:</span>
              <span>
                {clientEnv.multiTenantEnabled === 'true' ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Analytics:</span>
              <span>{clientEnv.analyticsEnabled === 'true' ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>

        {/* Multi-tenant Info */}
        {isMultiTenant && (
          <div className="rounded-lg border p-4 md:col-span-2">
            <h3 className="mb-3 font-semibold text-purple-700">
              Multi-tenant Configuration
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Tenant ID:</span>
                  <span className="font-mono">{tenantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tenant Name:</span>
                  <span>{tenant?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Subdomain:</span>
                  <span className="font-mono">
                    {tenant?.subdomain || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Custom Domain:</span>
                  <span className="font-mono">
                    {tenant?.customDomain || 'None'}
                  </span>
                </div>
              </div>

              {tenant && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Custom Branding:</span>
                    <span>{tenant.features.customBranding ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Analytics:</span>
                    <span>{tenant.features.analytics ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">API Access:</span>
                    <span>{tenant.features.apiAccess ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Max Users:</span>
                    <span>{tenant.features.maxUsers || 'Unlimited'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
