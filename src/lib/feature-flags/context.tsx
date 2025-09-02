'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { featureFlagsApi, handleApiResponse } from '@/lib/api';

import type { FeatureFlag, FeatureFlagContext, FeatureFlagKey } from './types';

interface FeatureFlagContextValue {
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: Error | null;
  isEnabled: (flagKey: FeatureFlagKey) => boolean;
  getValue: <T>(flagKey: FeatureFlagKey, defaultValue: T) => T;
  refresh: () => Promise<void>;
}

const FeatureFlagReactContext = createContext<FeatureFlagContextValue | null>(
  null,
);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  context?: FeatureFlagContext;
  initialFlags?: Record<string, FeatureFlag>;
}

export function FeatureFlagProvider({
  children,
  context,
  initialFlags = {},
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(initialFlags);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the centralized API service
      const apiResponse = await featureFlagsApi.getFlags(context);
      const result = handleApiResponse(apiResponse);

      if (result.isSuccess && result.data) {
        setFlags(result.data.flags);
      } else if (result.isServerError) {
        throw new Error(result.error || 'Server error occurred');
      } else if (result.isValidationError) {
        throw new Error('Validation error occurred');
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      const flag = flags[flagKey];
      return flag?.enabled ?? false;
    },
    [flags],
  );

  const getValue = useCallback(
    <T,>(flagKey: string, defaultValue: T): T => {
      const flag = flags[flagKey];
      if (!flag?.enabled) return defaultValue;
      return (flag.value as T) ?? defaultValue;
    },
    [flags],
  );

  const refresh = useCallback(async () => {
    await loadFlags();
  }, [loadFlags]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      isLoading,
      error,
      isEnabled,
      getValue,
      refresh,
    }),
    [flags, isLoading, error, isEnabled, getValue, refresh],
  );

  return (
    <FeatureFlagReactContext.Provider value={value}>
      {children}
    </FeatureFlagReactContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagReactContext);
  if (!context) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagProvider',
    );
  }
  return context;
}

export function useFeatureFlag(flagKey: FeatureFlagKey) {
  const { isEnabled, getValue } = useFeatureFlags();
  return useMemo(
    () => ({
      isEnabled: isEnabled(flagKey),
      getValue: <T,>(defaultValue: T) => getValue(flagKey, defaultValue),
    }),
    [flagKey, isEnabled, getValue],
  );
}
