import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  transpilePackages: ['msw'],
  allowedDevOrigins: ['127.0.0.1:3000'],

  experimental: {
    serverActions: {
      bodySizeLimit: '1mb', // or '2mb', '10mb', etc.
      allowedOrigins: ['http://localhost:3000'], // for dev or test environments
    },
    typedRoutes: true,
  },
};

export default nextConfig;
