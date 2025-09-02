import '@testing-library/jest-dom';
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { TenantProvider, useTenant } from './context';

import type { Tenant } from './types';

// Mock component to test useTenant hook
const TestTenantComponent = () => {
  const { tenant, isMultiTenant, tenantId } = useTenant();

  return (
    <div>
      <div data-testid="tenant-id">{tenantId}</div>
      <div data-testid="is-multi-tenant">
        {isMultiTenant ? 'true' : 'false'}
      </div>
      <div data-testid="tenant-name">{tenant?.name || 'no-tenant'}</div>
      <div data-testid="tenant-domain">{tenant?.domain || 'no-domain'}</div>
    </div>
  );
};

describe('TenantProvider', () => {
  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    domain: 'test.example.com',
    subdomain: 'test',
    settings: {
      branding: {
        logo: 'logo.png',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es'],
        timezone: 'UTC',
      },
      security: {
        allowedDomains: ['example.com'],
        requireMfa: false,
        sessionTimeout: 3600,
      },
    },
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['slack', 'github'],
      maxUsers: 100,
      storageLimit: 1000,
    },
    metadata: {
      plan: 'premium',
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock fetch API with proper service response format
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
            data: { tenant: mockTenant },
          }),
      } as Response),
    ) as jest.Mock;
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  it('renders children with default tenant configuration', () => {
    render(
      <TenantProvider>
        <div data-testid="child">Child component</div>
      </TenantProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides default tenant context when not multi-tenant', () => {
    render(
      <TenantProvider>
        <TestTenantComponent />
      </TenantProvider>,
    );

    expect(screen.getByTestId('tenant-id')).toHaveTextContent('default');
    expect(screen.getByTestId('is-multi-tenant')).toHaveTextContent('false');
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');
    expect(screen.getByTestId('tenant-domain')).toHaveTextContent('no-domain');
  });

  it('uses initial tenant when provided', () => {
    render(
      <TenantProvider initialTenant={mockTenant} isMultiTenant={true}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
    expect(screen.getByTestId('is-multi-tenant')).toHaveTextContent('true');
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
    expect(screen.getByTestId('tenant-domain')).toHaveTextContent(
      'test.example.com',
    );
  });

  it('uses custom tenant ID when provided', () => {
    render(
      <TenantProvider tenantId="custom-tenant" defaultTenantId="custom-default">
        <TestTenantComponent />
      </TenantProvider>,
    );

    expect(screen.getByTestId('tenant-id')).toHaveTextContent('custom-tenant');
  });

  it('uses default tenant ID when provided', () => {
    render(
      <TenantProvider defaultTenantId="custom-default">
        <TestTenantComponent />
      </TenantProvider>,
    );

    expect(screen.getByTestId('tenant-id')).toHaveTextContent('custom-default');
  });

  it('shows loading state and fetches tenant data when multi-tenant is enabled', async () => {
    render(
      <TenantProvider tenantId="tenant-123" isMultiTenant={true}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should show loading initially
    expect(screen.getByText('Loading tenant...')).toBeInTheDocument();

    // Wait for tenant to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('tenant-name')).toHaveTextContent(
        'Test Tenant',
      );
    });

    expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
    expect(screen.getByTestId('is-multi-tenant')).toHaveTextContent('true');
    expect(screen.getByTestId('tenant-domain')).toHaveTextContent(
      'test.example.com',
    );

    // Verify API was called
    expect(fetch).toHaveBeenCalledWith(
      '/api/tenants/tenant-123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('fetches current tenant when no tenant ID is provided in multi-tenant mode', async () => {
    render(
      <TenantProvider isMultiTenant={true}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should show loading initially
    expect(screen.getByText('Loading tenant...')).toBeInTheDocument();

    // Wait for tenant to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('tenant-name')).toHaveTextContent(
        'Test Tenant',
      );
    });

    // Verify API was called with 'current'
    expect(fetch).toHaveBeenCalledWith(
      '/api/tenants/current',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('handles fetch errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fetch to simulate an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error')),
    );

    render(
      <TenantProvider tenantId="tenant-123" isMultiTenant={true}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should show loading initially
    expect(screen.getByText('Loading tenant...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
    });

    // Should still render with tenant ID but no tenant data
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load tenant:',
      expect.any(Error),
    );

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('handles non-ok response gracefully', async () => {
    // Mock fetch to return non-ok response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response),
    );

    render(
      <TenantProvider tenantId="tenant-123" isMultiTenant={true}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should show loading initially
    expect(screen.getByText('Loading tenant...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
    });

    // Should still render with tenant ID but no tenant data
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');
  });

  it('does not fetch when initial tenant is provided', () => {
    render(
      <TenantProvider
        initialTenant={mockTenant}
        tenantId="tenant-123"
        isMultiTenant={true}
      >
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should not show loading state
    expect(screen.queryByText('Loading tenant...')).not.toBeInTheDocument();

    // Should use initial tenant immediately
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');

    // Should not call fetch
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when multi-tenant is disabled', () => {
    render(
      <TenantProvider tenantId="tenant-123" isMultiTenant={false}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should not show loading state
    expect(screen.queryByText('Loading tenant...')).not.toBeInTheDocument();

    // Should use tenant ID but not fetch tenant data
    expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
    expect(screen.getByTestId('tenant-name')).toHaveTextContent('no-tenant');

    // Should not call fetch
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when no tenant ID is provided and multi-tenant is disabled', () => {
    render(
      <TenantProvider isMultiTenant={false}>
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should not show loading state
    expect(screen.queryByText('Loading tenant...')).not.toBeInTheDocument();

    // Should use default tenant ID
    expect(screen.getByTestId('tenant-id')).toHaveTextContent('default');

    // Should not call fetch
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws error when useTenant is used outside provider', () => {
    const TestComponent = () => {
      try {
        useTenant();
        return <div>No error thrown</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'useTenant must be used within a TenantProvider',
    );
  });

  it('prefers tenant ID from tenant object over prop', () => {
    render(
      <TenantProvider
        initialTenant={mockTenant}
        tenantId="different-id"
        isMultiTenant={true}
      >
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should use tenant.id from the tenant object
    expect(screen.getByTestId('tenant-id')).toHaveTextContent('tenant-123');
  });

  it('falls back to prop tenant ID when tenant object has no ID', () => {
    const tenantWithoutId = { ...mockTenant, id: '' };

    render(
      <TenantProvider
        initialTenant={tenantWithoutId}
        tenantId="fallback-id"
        isMultiTenant={true}
      >
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should use tenantId prop as fallback
    expect(screen.getByTestId('tenant-id')).toHaveTextContent('fallback-id');
  });

  it('falls back to default tenant ID when no tenant or tenant ID is provided', () => {
    render(
      <TenantProvider defaultTenantId="final-fallback">
        <TestTenantComponent />
      </TenantProvider>,
    );

    // Should use defaultTenantId as final fallback
    expect(screen.getByTestId('tenant-id')).toHaveTextContent('final-fallback');
  });
});
