import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  transpilePackages: ['msw'],
}

export default nextConfig
