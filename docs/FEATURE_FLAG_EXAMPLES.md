# Feature Flag System Examples

This document provides comprehensive examples of how to use the improved feature flag system with proper typing and best practices.

## Table of Contents

- [Basic Feature Flag Usage](#basic-feature-flag-usage)
- [Typed Feature Flag Values](#typed-feature-flag-values)
- [Context-Aware Feature Flags](#context-aware-feature-flags)
- [Multi-Tenant Feature Flags](#multi-tenant-feature-flags)
- [Conditional Feature Flags](#conditional-feature-flags)
- [Provider-Specific Examples](#provider-specific-examples)
- [Best Practices](#best-practices)

## Basic Feature Flag Usage

### Server-Side Usage

```typescript
import { getFeatureFlag, getFeatureFlagValue } from '@/lib/feature-flags/hooks';
import { FeatureFlagKey } from '@/lib/feature-flags/types';

// Simple boolean flag check
const isNewDashboardEnabled = await getFeatureFlag('new-dashboard');

// Get feature flag value with type inference
const apiRateLimit = await getFeatureFlagValue('api-rate-limit', 100);
// Type of apiRateLimit is inferred as number

const welcomeMessage = await getFeatureFlagValue('welcome-message', 'Welcome!');
// Type of welcomeMessage is inferred as string

// Using with specific context
const context = {
  userId: 'user123',
  tenantId: 'tenant456',
  environment: 'production',
};

const isBetaFeatureEnabled = await getFeatureFlag('beta-features', context);
```

### Client-Side Usage

```typescript
'use client';

import { useFeatureFlag, useFeatureFlags } from '@/lib/feature-flags';
import { FeatureFlagKey } from '@/lib/feature-flags/types';

function MyComponent() {
  // Check if a feature flag is enabled
  const { isEnabled: isNewDashboardEnabled } = useFeatureFlag('new-dashboard');

  // Get all feature flags
  const { flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isNewDashboardEnabled && <NewDashboard />}
      {!isNewDashboardEnabled && <OldDashboard />}

      {/* Access specific flags */}
      {flags['dark-mode'] && <DarkModeToggle />}
    </div>
  );
}
```

## Typed Feature Flag Values

The system now supports properly typed feature flag values with full type safety:

```typescript
import { getFeatureFlagValue } from '@/lib/feature-flags/hooks';

// String values with type inference
const theme = await getFeatureFlagValue('theme', 'light');
// Type: string

// Number values with type inference
const timeout = await getFeatureFlagValue('timeout', 5000);
// Type: number

// Boolean values with type inference
const analytics = await getFeatureFlagValue('analytics', false);
// Type: boolean

// Object values with type inference
const config = await getFeatureFlagValue('config', {
  retries: 3,
  timeout: 5000,
});
// Type: { retries: number; timeout: number; }

// Array values with type inference
const features = await getFeatureFlagValue('features', [
  'feature1',
  'feature2',
]);
// Type: string[]
```

## Context-Aware Feature Flags

Feature flags can be evaluated based on user context for personalized experiences:

```typescript
import { getFeatureFlag, getFeatureFlagValue } from '@/lib/feature-flags/hooks';
import { createFeatureFlagContext } from '@/lib/feature-flags/hooks';

// Create context with user information
const context = createFeatureFlagContext(
  'user123', // userId
  'tenant456', // tenantId
  'production', // environment
  'Mozilla/5.0...', // userAgent
  '192.168.1.1', // ipAddress
  {
    // Custom properties
    subscription: 'premium',
    country: 'US',
    language: 'en',
  },
);

// Check if feature is enabled for this context
const isFeatureEnabled = await getFeatureFlag('premium-feature', context);

// Get context-specific value
const discountRate = await getFeatureFlagValue('discount-rate', 0.0, context);
```

## Multi-Tenant Feature Flags

The system supports tenant-specific feature flags:

```typescript
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import {
  getCurrentTenant,
  isTenantFeatureEnabled,
} from '@/lib/multi-tenant/hooks';

// Get current tenant
const tenant = await getCurrentTenant();

// Check if tenant has specific feature enabled
const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');

// Use tenant context in feature flags
const context = {
  tenantId: tenant?.id || 'default',
  environment: 'production',
};

const isTenantFeatureEnabled = await getFeatureFlag('tenant-feature', context);
```

## Conditional Feature Flags

Feature flags support complex conditions based on user, tenant, or environment:

```typescript
// Example local flag configuration with conditions
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'conditional-feature': {
    key: 'conditional-feature',
    enabled: true,
    description: 'Feature with complex conditions',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['admin', 'moderator'],
        property: 'role',
      },
      {
        type: 'tenant',
        operator: 'in',
        value: ['premium-tenant', 'enterprise-tenant'],
      },
      {
        type: 'environment',
        operator: 'equals',
        value: 'production',
      },
    ],
  },
};

// Usage with context that satisfies conditions
const context = {
  userId: 'user123',
  customProperties: {
    role: 'admin',
  },
  tenantId: 'premium-tenant',
  environment: 'production',
};

const isConditionalFeatureEnabled = await getFeatureFlag(
  'conditional-feature',
  context,
);
```

## Provider-Specific Examples

### Local Provider

```typescript
// Configuration in local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    environments: ['development', 'preview'],
    rolloutPercentage: 50,
    value: {
      version: '2.0',
      theme: 'dark',
    },
  },
};

// Usage
const dashboardConfig = await getFeatureFlagValue('new-dashboard', {
  version: '1.0',
  theme: 'light',
});
// Type inferred as { version: string; theme: string; }
```

### LaunchDarkly Provider (Implementation Example)

```typescript
// Example implementation for LaunchDarkly provider
class LaunchDarklyFeatureFlagProvider implements FeatureFlagProvider {
  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    // LaunchDarkly SDK integration
    const ldContext: LDContext = {
      kind: 'user',
      key: context?.userId || 'anonymous',
      tenant: context?.tenantId,
      // ... other context properties
    };

    return this.ldClient.variation(flagKey, ldContext, defaultValue);
  }
}
```

### GrowthBook Provider (Implementation Example)

```typescript
// Example implementation for GrowthBook provider
class GrowthBookFeatureFlagProvider implements FeatureFlagProvider {
  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    // GrowthBook SDK integration
    this.growthbook.setAttributes({
      id: context?.userId,
      tenantId: context?.tenantId,
      environment: context?.environment,
      // ... other attributes
    });

    return this.growthbook.getFeatureValue(flagKey, defaultValue);
  }
}
```

## Best Practices

### 1. Type-Safe Feature Flag Keys

```typescript
// Define feature flags in types.ts for type safety
export interface AppFeatureFlags {
  'new-dashboard': boolean;
  'api-rate-limit': number;
  'welcome-message': string;
  'theme-config': {
    primaryColor: string;
    secondaryColor: string;
  };
}

// Use the defined keys for type safety
const flagKey: FeatureFlagKey = 'new-dashboard'; // Type-safe
const invalidFlag = 'non-existent-flag'; // TypeScript error
```

### 2. Default Values for Type Safety

```typescript
// Always provide appropriate default values
const apiTimeout = await getFeatureFlagValue('api-timeout', 5000); // number
const featureConfig = await getFeatureFlagValue('feature-config', {
  enabled: false,
  maxUsers: 100,
}); // object with specific structure
```

### 3. Context Creation Helper

```typescript
// Helper function for consistent context creation
function createUserContext(
  userId: string,
  tenantId?: string,
  customProperties?: Record<string, unknown>,
): FeatureFlagContext {
  return {
    userId,
    tenantId,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    customProperties,
  };
}

// Usage
const context = createUserContext('user123', 'tenant456', {
  subscription: 'premium',
  plan: 'enterprise',
});

const isFeatureEnabled = await getFeatureFlag('premium-feature', context);
```

### 4. Error Handling

```typescript
// Handle potential errors in feature flag evaluation
try {
  const featureValue = await getFeatureFlagValue(
    'experimental-feature',
    'default',
  );
  // Use featureValue safely
} catch (error) {
  console.error('Feature flag evaluation failed:', error);
  // Fallback to default behavior
}
```

### 5. Testing Feature Flags

```typescript
// Example test for feature flag logic
describe('Feature Flag System', () => {
  it('should return correct value type', async () => {
    const result = await getFeatureFlagValue('test-flag', 42);
    expect(typeof result).toBe('number');
    expect(result).toBe(42); // or actual flag value
  });

  it('should respect context conditions', async () => {
    const context = { tenantId: 'premium' };
    const result = await getFeatureFlag('tenant-feature', context);
    expect(result).toBe(true);
  });
});
```

## Migration Guide

If you're migrating from a previous version with `any` types:

1. **Update Function Calls**: Remove explicit type parameters where possible
2. **Provide Default Values**: Always provide appropriate default values
3. **Check Context Usage**: Ensure context objects match the new `FeatureFlagContext` type
4. **Update Tests**: Update tests to expect proper types instead of `any`

```typescript
// Before (with any types)
const value = await getFeatureFlagValue<any>('my-flag');

// After (with proper typing)
const value = await getFeatureFlagValue('my-flag', 'default-value');
// Type is inferred as string
```

This comprehensive example demonstrates how to use the improved feature flag system with full type safety while maintaining all the flexibility needed for complex feature management scenarios.

For advanced integration patterns and real-world examples, see:

- [Real App Integration Examples](./REAL_APP_INTEGRATION.md)
- [Advanced Integration Patterns](./ADVANCED_INTEGRATION_PATTERNS.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
- [Security Considerations](./SECURITY_CONSIDERATIONS.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Testing Strategies](./TESTING_STRATEGIES.md)
- [Clerk Integration Guide](./CLERK_INTEGRATION.md)
