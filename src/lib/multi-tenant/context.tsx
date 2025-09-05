'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';

import { tenantApi, handleApiResponse } from '@/lib/api';

import type { TenantContext, Tenant } from './types';

const TenantReactContext = createContext<TenantContext | null>(null);

interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: Tenant | null;
  tenantId?: string;
  isMultiTenant?: boolean;
  defaultTenantId?: string;
}

export function TenantProvider({
  children,
  initialTenant = null,
  tenantId,
  isMultiTenant = false,
  defaultTenantId = 'default',
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);
  const [isLoading, setIsLoading] = useState(() => {
    // Only start loading if we need to fetch tenant data
    return isMultiTenant && !initialTenant && Boolean(tenantId);
  });
  const [error, setError] = useState<Error | null>(null);

  const loadTenant = useCallback(async () => {
    // Don't attempt to load if multi-tenant is disabled
    if (!isMultiTenant) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the centralized API service
      const apiResponse = tenantId
        ? await tenantApi.getTenant(tenantId)
        : await tenantApi.getCurrentTenant();

      const result = handleApiResponse(apiResponse);

      if (result.isSuccess && result.data) {
        setTenant(result.data.tenant);
      } else if (result.isServerError) {
        throw new Error(result.error || 'Server error occurred');
      } else if (result.isValidationError) {
        throw new Error('Validation error occurred');
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to load tenant:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, isMultiTenant]);

  useEffect(() => {
    // Skip loading if not multi-tenant or if we already have initial tenant
    if (!isMultiTenant || initialTenant) {
      setIsLoading(false);
      setError(null); // Clear any previous errors when multi-tenant is disabled
      return;
    }

    // Only load if we have a tenant ID or need to fetch current tenant
    if (tenantId) {
      loadTenant();
    } else {
      // In multi-tenant mode without tenantId, we should fetch current tenant
      loadTenant();
    }
  }, [tenantId, initialTenant, isMultiTenant, loadTenant]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<TenantContext>(
    () => ({
      tenant: isMultiTenant ? tenant : initialTenant,
      isMultiTenant,
      tenantId: tenant?.id || tenantId || defaultTenantId,
      domain: undefined,
      subdomain: undefined,
      error: isMultiTenant ? error : null, // Clear error when multi-tenant is disabled
    }),
    [tenant, isMultiTenant, tenantId, defaultTenantId, error, initialTenant],
  );

  if (isLoading && isMultiTenant) {
    return <div>Loading tenant...</div>;
  }

  return (
    <TenantReactContext.Provider value={contextValue}>
      {children}
    </TenantReactContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantReactContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
