# Environment & Feature Flag Management

This document explains how to use the environment management and feature flag system in this Next.js 15 boilerplate.

## Environment Configuration

### Environment Files

The project supports multiple environment configurations:

- `.env.development` - Development environment
- `.env.preview` - Preview/staging environment
- `.env.production` - Production environment
- `.env.local` - Local overrides (not committed)

### Environment Variables

#### Core Environment Variables

```bash
# Environment identification
NODE_ENV="development|test|production"
VERCEL_ENV="development|preview|production"
APP_ENV="development|staging|preview|production"
APP_VERSION="1.0.0"

# Feature flags
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local|launchdarkly|growthbook|vercel"
LAUNCHDARKLY_SDK_KEY="your-sdk-key"

# Multi-tenant support
MULTI_TENANT_ENABLED="false"
DEFAULT_TENANT_ID="default"
TENANT_HEADER_NAME="x-tenant-id"

# API configuration
API_RATE_LIMIT_ENABLED="true"
API_RATE_LIMIT_REQUESTS="100"
API_RATE_LIMIT_WINDOW="15m"

# Database
DATABASE_URL="postgresql://..."
DATABASE_POOL_SIZE="10"

# Security
CORS_ORIGINS="*"
ALLOWED_HOSTS="localhost,yourdomain.com"
```

#### Public Environment Variables

```bash
# Client-side variables (prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_VERCEL_URL="your-app.vercel.app"
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED="true"
NEXT_PUBLIC_MULTI_TENANT_ENABLED="false"
NEXT_PUBLIC_ANALYTICS_ENABLED="false"
```

### Environment-Specific Configuration

The `getEnvironmentConfig()` function provides environment-specific settings:

```typescript
import { getEnvironmentConfig } from '@/lib/env';

const config = getEnvironmentConfig();
console.log(config.environment); // 'development' | 'preview' | 'production'
console.log(config.isProduction); // boolean
console.log(config.baseUrl); // string
```

## Feature Flags

### Local Feature Flags

Feature flags are defined in `src/lib/feature-flags/local-provider.ts`:

```typescript
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    environments: ['development', 'preview'],
    rolloutPercentage: 50,
  },
  // ... more flags
};
```

### Using Feature Flags

#### Server-side Usage

```typescript
import { getFeatureFlag, isFeatureEnabled } from '@/lib/feature-flags/hooks';

// Basic usage
const isEnabled = await getFeatureFlag('new-dashboard');

// With context
const context = {
  userId: 'user123',
  tenantId: 'tenant456',
  environment: 'production',
};
const isEnabled = await isFeatureEnabled('new-dashboard', context);
```

#### Client-side Usage

```typescript
'use client';
import { useFeatureFlag, useFeatureFlags } from '@/lib/feature-flags';

function MyComponent() {
  const { isEnabled } = useFeatureFlag('new-dashboard');
  const { flags, isLoading } = useFeatureFlags();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isEnabled && <NewDashboard />}
      {!isEnabled && <OldDashboard />}
    </div>
  );
}
```

### Feature Flag Providers

#### Local Provider (Default)

Uses local configuration files. Good for development and simple deployments.

#### LaunchDarkly Provider

For advanced feature flag management:

```bash
npm install @launchdarkly/node-server-sdk
```

```bash
FEATURE_FLAGS_PROVIDER="launchdarkly"
LAUNCHDARKLY_SDK_KEY="your-sdk-key"
```

#### GrowthBook Provider

For open-source feature flag management:

```bash
npm install @growthbook/growthbook
```

```bash
FEATURE_FLAGS_PROVIDER="growthbook"
GROWTHBOOK_CLIENT_KEY="your-client-key"
```

#### Vercel Edge Config Provider

For Vercel-native feature flags:

```bash
npm install @vercel/edge-config
```

```bash
FEATURE_FLAGS_PROVIDER="vercel"
```

### Feature Flag Conditions

Feature flags support advanced conditions:

```typescript
{
  key: 'premium-feature',
  enabled: true,
  conditions: [
    {
      type: 'tenant',
      operator: 'in',
      value: ['premium-tenant', 'enterprise-tenant']
    },
    {
      type: 'user',
      operator: 'contains',
      value: '@company.com',
      property: 'email'
    }
  ]
}
```

## Multi-Tenant Support

### Tenant Resolution

Tenants can be resolved using multiple strategies:

1. **Header-based**: `x-tenant-id` header
2. **Subdomain-based**: `tenant.yourdomain.com`
3. **Path-based**: `/tenant/tenant-id/path`
4. **Domain-based**: Custom domains

### Using Multi-Tenant Features

#### Server-side

```typescript
import { getTenantContext, getCurrentTenant } from '@/lib/multi-tenant/hooks';

const tenantContext = await getTenantContext();
const tenant = await getCurrentTenant();

console.log(tenantContext.tenantId);
console.log(tenant?.name);
```

#### Client-side

```typescript
'use client';
import { useTenant } from '@/lib/multi-tenant';

function MyComponent() {
  const { tenant, tenantId, isMultiTenant } = useTenant();

  return (
    <div>
      <h1>Welcome to {tenant?.name || 'Default'}</h1>
      <p>Tenant ID: {tenantId}</p>
    </div>
  );
}
```

### Tenant-Specific Configuration

```typescript
import { isTenantFeatureEnabled } from '@/lib/multi-tenant/hooks';

const tenant = await getCurrentTenant();
const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');
```

## Deployment Configuration

### Vercel Environment Variables

Set these in your Vercel dashboard:

**Preview Environment:**

```bash
APP_ENV=preview
FEATURE_FLAGS_ENABLED=true
MULTI_TENANT_ENABLED=true
API_RATE_LIMIT_REQUESTS=500
```

**Production Environment:**

```bash
APP_ENV=production
FEATURE_FLAGS_ENABLED=true
MULTI_TENANT_ENABLED=true
API_RATE_LIMIT_REQUESTS=100
```

### GitHub Actions

Environment variables are automatically set in the deployment workflows:

- `deployVercelPreview.yml` - Preview deployments
- `deployVercelProd.yml` - Production deployments

## Best Practices

### Environment Management

1. **Use environment-specific files** for different configurations
2. **Keep sensitive data in Vercel secrets**, not in environment files
3. **Use public variables sparingly** - they're visible to clients
4. **Validate environment variables** using the `env.ts` schema

### Feature Flags

1. **Use descriptive flag names** that explain the feature
2. **Set appropriate environments** for each flag
3. **Use rollout percentages** for gradual rollouts
4. **Clean up old flags** regularly
5. **Document flag purposes** and expected lifecycle

### Multi-Tenant

1. **Plan your tenant resolution strategy** early
2. **Use tenant-specific caching keys** to avoid data leaks
3. **Implement proper data isolation** in your database
4. **Test tenant switching** thoroughly
5. **Monitor tenant-specific metrics**

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check file naming (`.env.development` not `.env.dev`)
   - Restart development server after changes
   - Verify Vercel environment variable settings

2. **Feature flags not working**
   - Check `FEATURE_FLAGS_ENABLED` is set to `"true"`
   - Verify flag exists in local provider
   - Check environment restrictions

3. **Multi-tenant resolution failing**
   - Verify `MULTI_TENANT_ENABLED` is set to `"true"`
   - Check middleware configuration
   - Verify tenant header/subdomain format

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL="debug"
CONSOLE_LOG_LEVEL="debug"
```

This will show detailed information about environment loading, feature flag evaluation, and tenant resolution.

## Examples & Usage

For comprehensive examples of how to use the feature flag system with proper typing and best practices, see the [Feature Flag Examples](./FEATURE_FLAG_EXAMPLES.md) documentation.

This includes:

- Basic feature flag usage patterns
- Typed feature flag values
- Context-aware feature flags
- Multi-tenant feature flags
- Conditional feature flags
- Provider-specific examples
- Best practices and migration guides

For advanced integration patterns and real-world examples, see:

- [Real App Integration Examples](./REAL_APP_INTEGRATION.md)
- [Advanced Integration Patterns](./ADVANCED_INTEGRATION_PATTERNS.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
- [Security Considerations](./SECURITY_CONSIDERATIONS.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Testing Strategies](./TESTING_STRATEGIES.md)
- [Clerk Integration Guide](./CLERK_INTEGRATION.md)
