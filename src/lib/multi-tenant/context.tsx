'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';

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
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would fetch tenant data from an API
      const response = await fetch(`/api/tenants/${tenantId || 'current'}`);

      if (response.ok) {
        const tenantData = await response.json();
        setTenant(tenantData.tenant);
      } else {
        throw new Error(
          `Failed to load tenant: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error('Failed to load tenant:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    // Skip loading if not multi-tenant or if we already have initial tenant
    if (!isMultiTenant || initialTenant) {
      setIsLoading(false);
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
      tenant,
      isMultiTenant,
      tenantId: tenant?.id || tenantId || defaultTenantId,
      domain: undefined,
      subdomain: undefined,
      error,
    }),
    [tenant, isMultiTenant, tenantId, defaultTenantId, error],
  );

  if (isLoading) {
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
