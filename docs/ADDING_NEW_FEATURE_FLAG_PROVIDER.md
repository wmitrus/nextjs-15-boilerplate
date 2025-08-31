# Adding a New Feature Flag Provider

This guide explains how to add a new feature flag provider to the existing feature flag system in your Next.js application.

## Overview

The feature flag system uses a provider-based architecture that makes it easy to add new providers. Each provider must implement the `FeatureFlagProvider` interface and be registered in the provider factory.

## Step-by-Step Guide

### 1. Define the Provider Type

First, add your new provider type to the `FeatureFlagProviderType` enum:

**File**: `src/lib/feature-flags/types.ts`

```typescript
// Add your provider to the enum
export type FeatureFlagProviderType =
  | 'local'
  | 'launchdarkly'
  | 'growthbook'
  | 'your-provider'
  | 'vercel';
```

### 2. Add Environment Variables

Add any required environment variables for your provider:

**File**: `src/lib/env.ts`

```typescript
// Add your provider's environment variables
export const env = createEnv({
  server: {
    // ... existing variables

    // Your provider variables
    YOUR_PROVIDER_API_KEY: z.string().optional(),
    YOUR_PROVIDER_ENVIRONMENT: z.string().optional(),

    // ... rest of configuration
  },
  runtimeEnv: {
    // ... existing runtime variables

    // Your provider runtime variables
    YOUR_PROVIDER_API_KEY: process.env.YOUR_PROVIDER_API_KEY,
    YOUR_PROVIDER_ENVIRONMENT: process.env.YOUR_PROVIDER_ENVIRONMENT,

    // ... rest of runtime configuration
  },
});
```

### 3. Update Environment Documentation

Document your provider's environment variables:

**File**: `docs/ENVIRONMENT_MANAGEMENT.md`

Add your provider to the environment variables section:

```bash
# Feature flags
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local|launchdarkly|growthbook|your-provider|vercel"
YOUR_PROVIDER_API_KEY="your-api-key"
YOUR_PROVIDER_ENVIRONMENT="development|staging|production"
```

And add a section for your provider:

````markdown
#### Your Provider Name

For [Your Provider Description]:

```bash
npm install your-provider-sdk-package
```
````

```bash
FEATURE_FLAGS_PROVIDER="your-provider"
YOUR_PROVIDER_API_KEY="your-api-key"
YOUR_PROVIDER_ENVIRONMENT="production"
```

````

### 4. Create the Provider Implementation

Create a new file for your provider implementation:

**File**: `src/lib/feature-flags/your-provider.ts`

```typescript
import type { FeatureFlag, FeatureFlagContext, FeatureFlagProvider } from './types';

export class YourFeatureFlagProvider implements FeatureFlagProvider {
  private client: unknown; // Your provider's client
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize your provider's client
    // this.client = new YourProviderClient({
    //   apiKey: process.env.YOUR_PROVIDER_API_KEY,
    //   environment: process.env.YOUR_PROVIDER_ENVIRONMENT,
    // });

    this.initialized = true;
  }

  async isEnabled(
    flagKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    // Implement flag evaluation logic
    // return this.client.isEnabled(flagKey, context);
    throw new Error('Not implemented');
  }

  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    // Implement flag value retrieval
    // return this.client.getValue(flagKey, defaultValue, context);
    throw new Error('Not implemented');
  }

  async getAllFlags(
    context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>> {
    // Implement bulk flag retrieval
    // return this.client.getAllFlags(context);
    throw new Error('Not implemented');
  }

  async refresh(): Promise<void> {
    // Implement flag refresh logic if needed
    // this.client.refresh();
    console.log('Your provider: flags refreshed');
  }
}
````

### 5. Register the Provider

Add your provider to the provider factory:

**File**: `src/lib/feature-flags/provider.ts`

```typescript
// Import your provider
import { YourFeatureFlagProvider } from './your-provider';

// Add to the switch statement
export function createFeatureFlagProvider(
  type?: FeatureFlagProviderType,
): FeatureFlagProvider {
  const providerType = type || env.FEATURE_FLAGS_PROVIDER;

  switch (providerType) {
    // ... existing cases

    case 'your-provider':
      // Lazy load your provider
      return createYourProvider();

    // ... rest of cases
  }
}

// Add your provider creation function
function createYourProvider(): FeatureFlagProvider {
  // For lazy loading to avoid importing heavy dependencies
  // const { YourFeatureFlagProvider } = require('./your-provider');
  // return new YourFeatureFlagProvider();

  // Or for simple implementation:
  throw new Error(
    'Your provider not implemented yet. Install your-provider-sdk first.',
  );
}
```

### 6. Update Documentation

Add your provider to the integration documentation:

**File**: `docs/FEATURES_INTEGRATION.md`

Update the provider list:

```markdown
The feature flag system is built with a provider-based architecture supporting:

1. **Local Provider** - Default, file-based configuration
2. **LaunchDarkly Provider** - Enterprise feature management platform
3. **GrowthBook Provider** - Open-source alternative to LaunchDarkly
4. **Your Provider** - Your provider description
5. **Vercel Edge Config Provider** - Vercel-native solution
```

### 7. Testing

Create tests for your provider:

**File**: `src/lib/feature-flags/your-provider.test.ts`

```typescript
import { YourFeatureFlagProvider } from './your-provider';

describe('YourFeatureFlagProvider', () => {
  let provider: YourFeatureFlagProvider;

  beforeEach(() => {
    provider = new YourFeatureFlagProvider();
  });

  describe('initialize', () => {
    it('should initialize the provider', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
    });
  });

  // Add more tests for your implementation
});
```

## Best Practices

1. **Lazy Loading**: Always lazy load external provider SDKs to avoid increasing bundle size
2. **Error Handling**: Implement proper error handling for provider initialization and flag evaluation
3. **Fallback Strategy**: Consider implementing fallback logic if your provider is unavailable
4. **Type Safety**: Maintain type safety by implementing the `FeatureFlagProvider` interface correctly
5. **Documentation**: Document your provider's specific features and limitations
6. **Environment Variables**: Use environment variables for provider-specific configuration
7. **Testing**: Create comprehensive tests for your provider implementation

## Example Implementation

Here's a complete example of a minimal provider implementation:

```typescript
import type {
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagProvider,
} from './types';

export class ExampleFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Record<string, boolean> = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Simple mock implementation
    this.flags = {
      'example-feature': true,
      'another-feature': false,
    };

    this.initialized = true;
  }

  async isEnabled(
    flagKey: string,
    _context?: FeatureFlagContext,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.flags[flagKey] ?? false;
  }

  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    _context?: FeatureFlagContext,
  ): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    return (this.flags[flagKey] as T) ?? defaultValue;
  }

  async getAllFlags(
    _context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result: Record<string, FeatureFlag> = {};
    for (const [key, enabled] of Object.entries(this.flags)) {
      result[key] = {
        key,
        enabled,
      };
    }

    return result;
  }

  async refresh(): Promise<void> {
    console.log('Example provider: flags refreshed');
  }
}
```

## Troubleshooting

### Common Issues

1. **Provider Not Found**: Ensure you've added your provider type to the enum and switch statement
2. **Environment Variables Not Loading**: Check that environment variables are properly defined and loaded
3. **SDK Import Issues**: Make sure you've installed the required SDK packages
4. **TypeScript Errors**: Ensure your implementation correctly implements the `FeatureFlagProvider` interface

### Debugging Tips

1. Enable debug logging to see provider initialization and flag evaluation
2. Check browser console and server logs for error messages
3. Verify environment variables are correctly set
4. Test provider connectivity with simple integration tests

By following these steps, you can easily add any feature flag provider to your application while maintaining consistency with the existing system architecture.

For comprehensive examples of how to use the feature flag system, see the [Feature Flag Examples](./FEATURE_FLAG_EXAMPLES.md) documentation.

For performance optimization strategies, see the [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md).

For security considerations when implementing providers, see the [Security Considerations](./SECURITY_CONSIDERATIONS.md) documentation.
