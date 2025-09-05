# Configuration System

This is an enterprise-level centralized configuration system that provides a single entry point for all configuration-related functionality including feature flags, tenant configurations, and environment-specific settings.

## Purpose

The configuration system is designed to:

1. **Centralize all configuration access** - Single import point for all config needs
2. **Handle client/server separation** - Properly separate client-safe vs server-only variables
3. **Support multi-tenant applications** - Environment-specific tenant configurations
4. **Manage feature flags** - Dynamic feature toggling across environments
5. **Provide type safety** - Full TypeScript support with proper types
6. **Enable environment-specific behavior** - Different configs for dev/staging/production

## Architecture

```
config/
├── index.ts           # Main entry point - exports everything
├── features.ts        # Feature flags management
├── tenantConfig.ts    # Multi-tenant configurations
└── README.md         # This documentation
```

## Usage Patterns

### 1. Client-Side Usage (React Components, Client Code)

```typescript
import { CONFIG, getAppConfig, useAppConfig } from '@/config';

// Simple constant access
const apiUrl = CONFIG.BASE_URL;
const isRateLimitEnabled = CONFIG.API.RATE_LIMIT_ENABLED;

// Full configuration object
const appConfig = getAppConfig();
if (appConfig.features.multiTenant) {
  // Multi-tenant logic
}

// React hook (reactive)
function MyComponent() {
  const config = useAppConfig();

  return (
    <div>
      {config.isDevelopment && <DebugPanel />}
      {config.features.analytics && <Analytics />}
    </div>
  );
}
```

### 2. Server-Side Usage (API Routes, Middleware, SSR)

```typescript
import { getServerConfig, getServerAppConfig } from '@/config';

// API Route
export async function GET() {
  const config = getServerConfig();

  // Access sensitive server-only config
  const dbUrl = config.DATABASE.URL;
  const redisUrl = config.EXTERNAL.REDIS.URL;
  const corsOrigins = config.SECURITY.CORS_ORIGINS;

  // Feature flags with server-side env access
  if (config.FEATURES.rateLimiting) {
    // Apply rate limiting
  }
}

// Middleware
export function middleware(request: NextRequest) {
  const config = getServerConfig();

  if (config.MULTI_TENANT.ENABLED) {
    const tenantId = request.headers.get(config.MULTI_TENANT.HEADER_NAME);
    // Multi-tenant logic
  }
}

// Server Action
export async function serverAction() {
  const appConfig = getServerAppConfig();

  if (appConfig.features.logflareIntegration) {
    // Server-side logging
  }
}
```

### 3. Feature Flags

```typescript
import { getFeatureFlags, isFeatureEnabled, useFeatureFlags } from '@/config';

// Client-side
const features = getFeatureFlags();
if (features.newDashboard) {
  // Show new dashboard
}

// Utility function
if (isFeatureEnabled('betaFeatures')) {
  // Beta functionality
}

// React hook
function FeatureComponent() {
  const features = useFeatureFlags();

  return features.advancedReporting ? <AdvancedReports /> : <BasicReports />;
}
```

### 4. Multi-Tenant Configuration

```typescript
import {
  getCurrentTenantConfig,
  tenantHasFeature,
  getTenantSetting,
} from '@/config';

// Get current tenant config
const tenantConfig = getCurrentTenantConfig();
const brandColor = tenantConfig.branding.primaryColor;

// Check tenant-specific features
if (tenantHasFeature('advancedAnalytics')) {
  // Tenant-specific feature
}

// Get tenant setting
const maxUsers = getTenantSetting('limits.maxUsers', 100);
```

## Environment Variables

### Client-Safe Variables (NEXT*PUBLIC*\*)

These are available on both client and server:

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
NEXT_PUBLIC_MULTI_TENANT_ENABLED=false
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

### Server-Only Variables

These are only available on the server:

```env
# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_SIZE=10

# External Services
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
CLERK_SECRET_KEY=sk_...

# Logging
LOG_LEVEL=info
LOG_TO_FILE_PROD=true
LOGFLARE_API_KEY=...

# Security
CORS_ORIGINS=https://example.com,https://app.example.com
```

## Configuration Functions

### Client-Safe Functions

- `getAppConfig()` - Complete app configuration (client-safe)
- `getFeatureFlags()` - Feature flags (client-safe)
- `getEnvironmentTenantConfig()` - Tenant config (client-safe)
- `CONFIG` - Static configuration constants

### Server-Only Functions

- `getServerConfig()` - Full server configuration with sensitive data
- `getServerAppConfig()` - Complete app configuration (server-side)
- `getServerFeatureFlags()` - Feature flags with server env access
- `getServerEnvironmentTenantConfig()` - Tenant config (server-side)

## Type Safety

All configuration functions return properly typed objects:

```typescript
import type {
  AppConfig,
  ServerConfig,
  FeatureFlags,
  TenantConfig,
} from '@/config';

const config: AppConfig = getAppConfig();
const serverConfig: ServerConfig = getServerConfig();
const features: FeatureFlags = getFeatureFlags();
```

## Best Practices

1. **Use client-safe functions in components** - Always use `getAppConfig()`, `CONFIG`, or `useAppConfig()` in React components
2. **Use server functions in API routes** - Use `getServerConfig()` and `getServerAppConfig()` for server-side code
3. **Check environment before server calls** - Server functions will fallback to client-safe versions if called on client
4. **Leverage TypeScript** - Use the provided types for better development experience
5. **Environment-specific configs** - Use different configurations for different environments
6. **Feature flag everything** - Use feature flags for gradual rollouts and A/B testing

## Security Considerations

- **Never expose server-only variables to client** - The system automatically handles this separation
- **Validate sensitive configurations** - Always validate server-only configs before use
- **Use environment-specific settings** - Different security settings for different environments
- **Audit configuration access** - Monitor which configurations are being accessed where

## Examples

See the `/src/app/config-demo` page for a comprehensive example of how to use all configuration features.
