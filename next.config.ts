import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  transpilePackages: ['msw'],
  // Allow cross-origin requests from 127.0.0.1 for Playwright tests
  allowedDevOrigins: ['127.0.0.1:3000'],
};

export default nextConfig;
