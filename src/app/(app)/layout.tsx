import { unstable_cache } from 'next/cache';
import { headers } from 'next/headers';

import { getUserIdForFeatureFlags } from '@/lib/auth';
import { getEnvironmentConfig } from '@/lib/env';
import { FeatureFlagProvider } from '@/lib/feature-flags/context';
import {
  getAllFeatureFlags,
  createFeatureFlagContext,
} from '@/lib/feature-flags/hooks';
import { TenantProvider } from '@/lib/multi-tenant';
import { getTenantContextWithHeaders } from '@/lib/multi-tenant/hooks';

// Fetch headers first
// Note: We can't cache getTenantContextWithHeaders because it uses headers
// But we can cache feature flags since they don't use headers directly

// Cached feature flags fetcher
const getCachedFeatureFlags = unstable_cache(
  async (userId: string | undefined, tenantId: string, environment: string) => {
    const featureFlagContext = createFeatureFlagContext(
      userId,
      tenantId,
      environment,
    );
    return getAllFeatureFlags(featureFlagContext);
  },
  ['feature-flags'],
  {
    revalidate: 600, // 10 minutes
    tags: ['feature-flags'],
  },
);

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get server-side context
  const headersList = await headers();
  const tenantContext = await getTenantContextWithHeaders(headersList);
  const envConfig = getEnvironmentConfig();
  const userId = await getUserIdForFeatureFlags();

  // Get cached feature flags
  const initialFlags = await getCachedFeatureFlags(
    userId,
    tenantContext.tenantId,
    envConfig.environment,
  );

  return (
    <TenantProvider
      initialTenant={tenantContext.tenant}
      tenantId={tenantContext.tenantId}
      isMultiTenant={tenantContext.isMultiTenant}
      defaultTenantId={tenantContext.tenantId}
    >
      <FeatureFlagProvider
        context={{
          userId,
          tenantId: tenantContext.tenantId,
          environment: envConfig.environment,
        }}
        initialFlags={Object.fromEntries(
          Object.entries(initialFlags).map(([key, enabled]) => [
            key,
            { key, enabled, description: `Feature flag: ${key}` },
          ]),
        )}
      >
        {children}
      </FeatureFlagProvider>
    </TenantProvider>
  );
}
