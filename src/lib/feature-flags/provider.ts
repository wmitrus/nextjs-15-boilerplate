import { env } from '../env';
import { LocalFeatureFlagProvider } from './local-provider';

import type { FeatureFlagProvider, FeatureFlagProviderType } from './types';

let providerInstance: FeatureFlagProvider | null = null;

export function createFeatureFlagProvider(
  type?: FeatureFlagProviderType,
): FeatureFlagProvider {
  const providerType = type || env.FEATURE_FLAGS_PROVIDER;

  switch (providerType) {
    case 'local':
      return new LocalFeatureFlagProvider();

    case 'launchdarkly':
      // Lazy load LaunchDarkly provider to avoid bundle bloat
      return createLaunchDarklyProvider();

    case 'growthbook':
      // Lazy load GrowthBook provider
      return createGrowthBookProvider();

    case 'vercel':
      // Lazy load Vercel provider
      return createVercelProvider();

    default:
      console.warn(
        `Unknown feature flag provider: ${providerType}. Falling back to local provider.`,
      );
      return new LocalFeatureFlagProvider();
  }
}

export function getFeatureFlagProvider(): FeatureFlagProvider {
  if (!providerInstance) {
    providerInstance = createFeatureFlagProvider();
  }
  return providerInstance;
}

// Lazy loading functions to avoid importing heavy dependencies
function createLaunchDarklyProvider(): FeatureFlagProvider {
  // This would be implemented when LaunchDarkly is needed
  throw new Error(
    'LaunchDarkly provider not implemented yet. Install @launchdarkly/node-server-sdk first.',
  );
}

function createGrowthBookProvider(): FeatureFlagProvider {
  // This would be implemented when GrowthBook is needed
  throw new Error(
    'GrowthBook provider not implemented yet. Install @growthbook/growthbook first.',
  );
}

function createVercelProvider(): FeatureFlagProvider {
  // This would be implemented when Vercel Edge Config is needed
  throw new Error(
    'Vercel provider not implemented yet. Install @vercel/edge-config first.',
  );
}

export async function initializeFeatureFlags(): Promise<void> {
  if (!env.FEATURE_FLAGS_ENABLED) {
    console.log('Feature flags are disabled');
    return;
  }

  const provider = getFeatureFlagProvider();
  await provider.initialize();
  console.log(
    `Feature flags initialized with ${env.FEATURE_FLAGS_PROVIDER} provider`,
  );
}
