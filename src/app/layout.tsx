import { Geist, Geist_Mono } from 'next/font/google';

import { getEnvironmentConfig } from '@/lib/env';
import { FeatureFlagProvider } from '@/lib/feature-flags/context';
import {
  getAllFeatureFlags,
  createFeatureFlagContext,
} from '@/lib/feature-flags/hooks';
import { TenantProvider } from '@/lib/multi-tenant';
import { getTenantContext } from '@/lib/multi-tenant/hooks';

import type { Metadata } from 'next';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Next.js 15 Boilerplate',
  description:
    'A comprehensive Next.js 15 boilerplate with feature flags and multi-tenant support',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get server-side context
  const tenantContext = await getTenantContext();
  const envConfig = getEnvironmentConfig();

  // Create feature flag context
  const featureFlagContext = createFeatureFlagContext(
    undefined, // userId - would come from auth
    tenantContext.tenantId,
    envConfig.environment,
  );

  // Get initial feature flags
  const initialFlags = await getAllFeatureFlags(featureFlagContext);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TenantProvider
          initialTenant={tenantContext.tenant}
          tenantId={tenantContext.tenantId}
          isMultiTenant={tenantContext.isMultiTenant}
          defaultTenantId={tenantContext.tenantId}
        >
          <FeatureFlagProvider
            context={featureFlagContext}
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
      </body>
    </html>
  );
}
