# Configuration System Documentation

## Overview

The configuration system provides a centralized approach to managing application settings, feature flags, and tenant-specific configurations across different environments.

## Architecture

### Directory Structure

```
config/
├── features.ts      # Feature flag definitions and environment-based toggles
├── tenantConfig.ts  # Multi-tenant configuration management
└── index.ts         # Centralized exports and utilities
```

## Features Configuration (`config/features.ts`)

### Feature Flags Interface

```typescript
interface FeatureFlags {
  // Core features
  multiTenant: boolean;
  featureFlags: boolean;
  analytics: boolean;

  // API features
  rateLimiting: boolean;

  // Logging features
  logflareIntegration: boolean;
  fileLogging: boolean;

  // Development features
  debugMode: boolean;
  storybook: boolean;

  // Future features
  newDashboard: boolean;
  advancedReporting: boolean;
  betaFeatures: boolean;
}
```

### Usage Examples

```typescript
import { getFeatureFlags, isFeatureEnabled, useFeatureFlags } from '@/config';

// Static access
const flags = getFeatureFlags();
const isNewDashboardEnabled = isFeatureEnabled('newDashboard');

// React hook
function MyComponent() {
  const features = useFeatureFlags();

  if (features.newDashboard) {
    return <NewDashboard />;
  }

  return <LegacyDashboard />;
}
```

### Environment-Specific Features

Features are automatically configured based on the current environment:

- **Development**: All features enabled, debug mode on
- **Preview**: New features enabled for testing, debug mode on
- **Staging**: Stable features only, advanced reporting enabled
- **Production**: Only stable, tested features

## Tenant Configuration (`config/tenantConfig.ts`)

### Tenant Config Interface

```typescript
interface TenantConfig {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;

  features?: {
    analytics?: boolean;
    advancedReporting?: boolean;
    customBranding?: boolean;
    apiAccess?: boolean;
  };

  settings?: {
    maxUsers?: number;
    storageLimit?: number;
    apiRateLimit?: number;
    customDomain?: boolean;
  };

  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
  };
}
```

### Usage Examples

```typescript
import {
  getTenantConfig,
  tenantHasFeature,
  getCurrentTenantConfig,
} from '@/config';

// Get specific tenant config
const tenantConfig = getTenantConfig('my-tenant-id');

// Check tenant feature
const hasAnalytics = tenantHasFeature('my-tenant-id', 'analytics');

// Get current tenant config (based on environment)
const currentTenant = getCurrentTenantConfig();
```

## Centralized Configuration (`config/index.ts`)

### Complete App Configuration

```typescript
import { getAppConfig, CONFIG, useAppConfig } from '@/config';

// Static configuration object
console.log(CONFIG.NODE_ENV);
console.log(CONFIG.FEATURES.newDashboard);
console.log(CONFIG.TENANT.name);

// Dynamic configuration function
const appConfig = getAppConfig();

// React hook
function MyComponent() {
  const config = useAppConfig();

  return (
    <div>
      <h1>Environment: {config.environment.environment}</h1>
      <p>Version: {config.environment.version}</p>
      <p>Multi-tenant: {config.isMultiTenantEnabled ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Environment Variables

### Feature-Specific Variables

Add these to your environment files (`.env.development`, `.env.preview`, etc.):

```bash
# Feature-specific flags
FEATURE_NEW_DASHBOARD="true"
FEATURE_ADVANCED_REPORTING="true"
FEATURE_BETA_FEATURES="true"
```

### Environment Files

- `.env.development` - Development environment (all features enabled)
- `.env.preview` - Preview environment (new features enabled)
- `.env.staging` - Staging environment (stable features + advanced reporting)
- `.env.production` - Production environment (stable features only)

## Branch Strategy Integration

### Main Branch (Production)

- Vercel production deployment
- Uses `.env.production` settings
- Only stable features enabled
- `APP_ENV=production`

### Develop Branch (Preview/Staging)

- Vercel preview deployment
- Uses `.env.preview` or `.env.staging` settings
- New features enabled for testing
- `APP_ENV=preview` or `APP_ENV=staging`

## Vercel Configuration

The `vercel.json` file is configured to:

- Deploy `main` branch to production
- Deploy `develop` branch to preview
- Use appropriate environment variables per branch

## Best Practices

### 1. Feature Flag Naming

- Use camelCase for feature flag names
- Be descriptive: `newDashboard` not `dash`
- Group related features: `advancedReporting`, `advancedAnalytics`

### 2. Environment-Specific Configuration

- Development: Enable all features for testing
- Preview: Enable new features for stakeholder review
- Staging: Enable features ready for production testing
- Production: Only stable, tested features

### 3. Tenant Configuration

- Keep tenant configs in database for production
- Use static configs for development/testing
- Always provide fallback to default tenant

### 4. Type Safety

- Use TypeScript interfaces for all configurations
- Export types for use in other modules
- Validate environment variables with Zod

## Migration Guide

### From Old Feature Flag System

1. Replace direct environment variable checks:

```typescript
// Old
const enabled = process.env.NEXT_PUBLIC_NEW_FEATURE === 'true';

// New
const enabled = isFeatureEnabled('newFeature');
```

2. Replace direct tenant checks:

```typescript
// Old
const tenantId = process.env.DEFAULT_TENANT_ID;

// New
const tenant = getCurrentTenantConfig();
const tenantId = tenant.id;
```

3. Use centralized configuration:

```typescript
// Old
const isProduction = process.env.NODE_ENV === 'production';

// New
const config = useAppConfig();
const isProduction = config.isProduction;
```

## Testing

### Unit Tests

Test configuration functions with different environment variables:

```typescript
import { getFeatureFlags } from '@/config';

describe('Feature Flags', () => {
  it('should enable all features in development', () => {
    process.env.NODE_ENV = 'development';
    const flags = getFeatureFlags();
    expect(flags.debugMode).toBe(true);
  });
});
```

### Integration Tests

Test configuration integration with components:

```typescript
import { render } from '@testing-library/react';
import { ConfigDemo } from '@/components/config-demo';

test('renders configuration demo', () => {
  render(<ConfigDemo />);
  // Test configuration display
});
```

## Troubleshooting

### Common Issues

1. **Feature flags not updating**: Check environment variable names and restart dev server
2. **Tenant config not found**: Verify tenant ID and fallback to default
3. **Environment detection wrong**: Check `APP_ENV` and `NODE_ENV` variables
4. **Type errors**: Ensure all configuration interfaces are properly imported

### Debug Configuration

Visit `/config-demo` to see current configuration values and debug issues.

## Future Enhancements

1. **Database-backed tenant configs**: Move tenant configurations to database
2. **Real-time feature flags**: Integrate with LaunchDarkly or similar service
3. **A/B testing**: Add percentage-based feature rollouts
4. **Configuration UI**: Admin interface for managing configurations
5. **Configuration validation**: Runtime validation of configuration values
