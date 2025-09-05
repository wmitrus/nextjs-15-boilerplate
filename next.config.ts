import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

import type { NextConfig } from 'next';

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Base configuration
const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  transpilePackages: ['msw'],

  // Environment-specific allowed origins
  allowedDevOrigins:
    isDevelopment || isTest
      ? [
          '127.0.0.1:3000',
          'localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3000',
          '127.0.0.1',
          'localhost',
        ]
      : [],

  typedRoutes: true,
  reactStrictMode: true,

  // Source maps only in development and preview
  productionBrowserSourceMaps: isDevelopment || isPreview,

  // Compression in production
  compress: isProduction,

  // Environment-specific headers
  async headers() {
    const headers = [];

    if (isProduction) {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      });
    }

    return headers;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: isDevelopment ? '10mb' : '1mb',
      allowedOrigins: isDevelopment
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : undefined,
    },
    testProxy: true,
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nextjs-15-boilerplate.vercel.app',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/your-cloud-name/**',
      },
      // Add environment-specific patterns
      ...(isPreview
        ? [
            {
              protocol: 'https' as const,
              hostname: '*.vercel.app',
              pathname: '/images/**',
            },
          ]
        : []),
    ],
  },

  // Environment-specific redirects
  async redirects() {
    const redirects = [];

    // In preview, redirect old paths
    if (isPreview) {
      redirects.push({
        source: '/old-path',
        destination: '/new-path',
        permanent: false,
      });
    }

    return redirects;
  },

  // Environment-specific rewrites for multi-tenant support
  async rewrites() {
    const rewrites = [];

    // Multi-tenant path-based routing
    if (process.env.MULTI_TENANT_ENABLED === 'true') {
      rewrites.push({
        source: '/tenant/:tenant/:path*',
        destination: '/:path*',
      });
    }

    return rewrites;
  },
};

// Configure bundle analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Apply Sentry config only if not analyzing (to preserve source maps)
const configWithAnalyzer = bundleAnalyzer(nextConfig);

export default process.env.ANALYZE === 'true' || process.env.NODE_ENV === 'test'
  ? configWithAnalyzer
  : withSentryConfig(configWithAnalyzer, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: 'ozi',

      project: 'nextjs-15-boilerplate',

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      // This can increase your server load as well as your hosting bill.
      // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
      // side errors will fail.
      tunnelRoute: '/monitoring',

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    });
