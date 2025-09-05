import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';

import { getUserIdForFeatureFlags } from '@/lib/auth';
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
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Next.js 15 Boilerplate',
  description:
    'A comprehensive Next.js 15 boilerplate with feature flags and multi-tenant support',
  keywords: ['Next.js', 'React', 'TypeScript', 'Boilerplate'],
  authors: [{ name: 'Next.js Team' }],
  openGraph: {
    title: 'Next.js 15 Boilerplate',
    description: 'Modern web development boilerplate with advanced features',
    url: 'https://your-domain.com',
    siteName: 'Next.js 15 Boilerplate',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next.js 15 Boilerplate',
    description: 'Modern web development boilerplate with advanced features',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get server-side context
  const tenantContext = await getTenantContext();
  const envConfig = getEnvironmentConfig();
  const userId = await getUserIdForFeatureFlags();

  // Create feature flag context with authenticated user
  const featureFlagContext = createFeatureFlagContext(
    userId, // Now includes authenticated user ID
    tenantContext.tenantId,
    envConfig.environment,
  );

  // Get initial feature flags
  const initialFlags = await getAllFeatureFlags(featureFlagContext);

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* Skip link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only z-50 rounded bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:outline-2 focus:outline-indigo-500"
          >
            Skip to main content
          </a>

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
              <div className="flex min-h-screen flex-col">{children}</div>
            </FeatureFlagProvider>
          </TenantProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
