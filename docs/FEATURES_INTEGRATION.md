# Environment Management, Feature Flags & Multi-Tenant Integration

This document provides a comprehensive overview of how environment management, feature flags, and multi-tenant support work together in this Next.js 15 boilerplate.

## Table of Contents

- [Environment Management](#environment-management)
- [Feature Flags System](#feature-flags-system)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Integration Patterns](#integration-patterns)
- [Configuration Examples](#configuration-examples)
- [Best Practices](#best-practices)
- [Examples & Usage](#examples--usage)

## Environment Management

### Environment Files

The project supports multiple environment configurations:

- `.env.development` - Development environment
- `.env.preview` - Preview/staging environment
- `.env.production` - Production environment
- `.env.local` - Local overrides (not committed)

### Environment Variables Structure

Environment variables are organized into:

1. **Core Environment Variables** - Server-side configuration
2. **Public Environment Variables** - Client-side configuration (prefixed with `NEXT_PUBLIC_`)
3. **Feature Flag Configuration** - Feature toggle settings
4. **Multi-Tenant Configuration** - Tenant-specific settings

### Environment Detection

The system automatically detects the current environment using:

```typescript
const isProduction = env.NODE_ENV === 'production';
const isPreview = env.VERCEL_ENV === 'preview';
const isDevelopment = env.NODE_ENV === 'development';
```

## Feature Flags System

### Architecture

The feature flag system is built with a provider-based architecture supporting:

1. **Local Provider** - Default, file-based configuration
2. **LaunchDarkly Provider** - Enterprise feature management platform
3. **GrowthBook Provider** - Open-source alternative to LaunchDarkly
4. **Vercel Edge Config Provider** - Vercel-native solution

### Feature Flag Structure

Each feature flag supports:

- **Key** - Unique identifier
- **Enabled** - Boolean flag state
- **Description** - Human-readable description
- **Environments** - Environment-specific enablement
- **Tenants** - Tenant-specific restrictions
- **Rollout Percentage** - Gradual rollouts
- **Conditions** - Complex evaluation rules

### Usage Patterns

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

## Multi-Tenant Architecture

### Tenant Resolution Strategies

The system supports multiple tenant resolution methods:

1. **Header-based** - `x-tenant-id` header
2. **Subdomain-based** - `tenant.yourdomain.com`
3. **Path-based** - `/tenant/tenant-id/path`
4. **Domain-based** - Custom domains

### Tenant Context Management

Tenant context is managed through:

- **Server-side hooks** - `getTenantContext()`, `getCurrentTenant()`
- **Client-side context** - `useTenant()` React hook
- **Middleware integration** - Automatic tenant detection

### Tenant Data Structure

Each tenant includes:

- **ID and Name** - Unique identification
- **Domain Configuration** - Custom domains and subdomains
- **Settings** - Branding, localization, security
- **Features** - Tenant-specific capabilities
- **Metadata** - Custom tenant data

## Integration Patterns

### Environment-Aware Feature Flags

Feature flags can be configured to only be active in specific environments:

```typescript
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    environments: ['development', 'preview'], // Only in dev and preview
    rolloutPercentage: 50,
  },
};
```

### Tenant-Specific Features

Feature flags can be restricted to specific tenants:

```typescript
{
  key: 'premium-feature',
  enabled: true,
  tenants: ['premium-tenant', 'enterprise-tenant'],
  conditions: [
    {
      type: 'tenant',
      operator: 'in',
      value: ['premium-tenant', 'enterprise-tenant']
    }
  ]
}
```

### Environment-Specific Multi-Tenant Configuration

Multi-tenant settings can vary by environment:

```bash
# Development
MULTI_TENANT_ENABLED="false"
DEFAULT_TENANT_ID="dev-tenant"

# Preview
MULTI_TENANT_ENABLED="true"
DEFAULT_TENANT_ID="preview-tenant"

# Production
MULTI_TENANT_ENABLED="true"
DEFAULT_TENANT_ID="default"
```

## Configuration Examples

### Development Environment

```bash
# .env.development
NODE_ENV="development"
APP_ENV="development"
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local"
MULTI_TENANT_ENABLED="false"
DEFAULT_TENANT_ID="dev-tenant"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED="true"
NEXT_PUBLIC_MULTI_TENANT_ENABLED="false"
```

### Preview Environment

```bash
# .env.preview
NODE_ENV="production"
APP_ENV="preview"
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local"
MULTI_TENANT_ENABLED="true"
DEFAULT_TENANT_ID="preview-tenant"
NEXT_PUBLIC_APP_ENV="preview"
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED="true"
NEXT_PUBLIC_MULTI_TENANT_ENABLED="true"
```

### Production Environment

```bash
# .env.production
NODE_ENV="production"
APP_ENV="production"
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local" # Can be changed to "launchdarkly" or "growthbook"
MULTI_TENANT_ENABLED="true"
DEFAULT_TENANT_ID="default"
NEXT_PUBLIC_APP_ENV="production"
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED="true"
NEXT_PUBLIC_MULTI_TENANT_ENABLED="true"
```

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

### Integration

1. **Leverage environment context** in feature flag evaluation
2. **Use tenant-aware feature flags** for per-tenant capabilities
3. **Implement fallback strategies** for each system
4. **Monitor cross-system interactions** for performance
5. **Test integration scenarios** thoroughly

## Troubleshooting

### Common Integration Issues

1. **Feature flags not respecting tenant context**
   - Verify `FEATURE_FLAGS_ENABLED` is set to `"true"`
   - Check tenant context is properly passed to flag evaluation
   - Ensure tenant ID is correctly resolved

2. **Environment variables not loading**
   - Check file naming (`.env.development` not `.env.dev`)
   - Restart development server after changes
   - Verify Vercel environment variable settings

3. **Multi-tenant resolution failing**
   - Verify `MULTI_TENANT_ENABLED` is set to `"true"`
   - Check middleware configuration
   - Verify tenant header/subdomain format

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL="debug"
CONSOLE_LOG_LEVEL="debug"
```

This will show detailed information about:

- Environment loading
- Feature flag evaluation
- Tenant resolution
- Cross-system interactions

## Clerk Authentication Integration

For information on integrating Clerk authentication with feature flags and multi-tenant systems, see the [Clerk Integration Guide](./CLERK_INTEGRATION.md).

## Testing Strategies

For comprehensive testing strategies that cover component testing, integration testing, API route testing, and end-to-end testing with Playwright, see the [Testing Strategies](./TESTING_STRATEGIES.md) documentation.

## Performance Optimization

For performance optimization strategies, see the [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md) which covers:

- Caching strategies for feature flags and tenant data
- Client-side optimization techniques
- Server-side optimization patterns
- Database query optimization
- Memory management best practices
- Bundle size reduction techniques

## Security Considerations

For security best practices, see the [Security Considerations](./SECURITY_CONSIDERATIONS.md) documentation which covers:

- Feature flag security and client-side exposure protection
- Multi-tenant data isolation techniques
- Encryption and data protection strategies
- API security and rate limiting
- Authentication and authorization patterns
- Audit logging and monitoring
- Third-party provider security integration

## Advanced Integration Patterns

For advanced integration patterns, see the [Advanced Integration Patterns](./ADVANCED_INTEGRATION_PATTERNS.md) documentation which covers:

- Dynamic configuration patterns
- Cross-feature dependencies management
- Tenant-aware feature rollouts
- Contextual feature evaluation
- A/B testing integration
- Progressive enhancement strategies
- Feature flag analytics
- Hybrid provider strategies

## Real Application Examples

For real-world application examples, see the [Real App Integration Examples](./REAL_APP_INTEGRATION.md) documentation which includes:

- E-commerce platform implementation
- SaaS application examples
- Content management system integration
- API service examples
- Dashboard application patterns

## Setup Guide

For a complete step-by-step setup guide, see the [Setup Guide](./SETUP_GUIDE.md) which covers:

- Prerequisites and installation
- Environment configuration
- Feature flag setup
- Multi-tenant setup
- Integration testing
- First implementation examples

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
