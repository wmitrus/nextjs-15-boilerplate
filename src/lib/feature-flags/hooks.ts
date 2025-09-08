import { getFeatureFlagProvider } from './provider';

import type {
  FeatureFlagContext,
  FeatureFlagKey,
  AppFeatureFlags,
} from './types';

// Server-side hooks for feature flags
export async function getFeatureFlag(
  flagKey: FeatureFlagKey,
  context?: FeatureFlagContext,
): Promise<boolean> {
  try {
    const provider = getFeatureFlagProvider();
    return await provider.isEnabled(flagKey, context);
  } catch (error) {
    console.error(`Failed to evaluate feature flag "${flagKey}":`, error);
    // Preserve original error so tests and callers can match exact messages
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function getFeatureFlagValue<T>(
  flagKey: FeatureFlagKey,
  defaultValue: T,
  context?: FeatureFlagContext,
): Promise<T> {
  try {
    const provider = getFeatureFlagProvider();
    return await provider.getValue(flagKey, defaultValue, context);
  } catch (error) {
    console.error(`Failed to get value for feature flag "${flagKey}":`, error);
    // Preserve original error
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function getAllFeatureFlags(
  context?: FeatureFlagContext,
): Promise<Record<string, boolean>> {
  try {
    const provider = getFeatureFlagProvider();
    const flags = await provider.getAllFlags(context);

    // Convert to simple boolean map for easier consumption
    const result: Record<string, boolean> = {};
    for (const [key, flag] of Object.entries(flags)) {
      result[key] = flag.enabled;
    }

    return result;
  } catch (error) {
    console.error('Failed to get all feature flags:', error);
    // Preserve original error
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Type-safe feature flag helpers
export async function isFeatureEnabled<K extends FeatureFlagKey>(
  flagKey: K,
  context?: FeatureFlagContext,
): Promise<AppFeatureFlags[K]> {
  try {
    const result = await getFeatureFlag(flagKey, context);
    return result as AppFeatureFlags[K];
  } catch (error) {
    console.error(`Failed to check if feature "${flagKey}" is enabled:`, error);
    // Preserve original error
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Utility function to create feature flag context from request
export function createFeatureFlagContext(
  userId?: string,
  tenantId?: string,
  environment?: string,
  userAgent?: string,
  ipAddress?: string,
  customProperties?: Record<string, unknown>,
): FeatureFlagContext {
  return {
    userId,
    tenantId,
    environment: environment || 'development',
    userAgent,
    ipAddress,
    customProperties,
  };
}
