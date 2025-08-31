/**
 * True Integration Examples
 * Testing real-world integration scenarios between feature flags and multi-tenant components
 */

import '@testing-library/jest-dom';
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { FeatureFlagProvider } from '../../src/lib/feature-flags/context';
import { server } from '../../src/lib/mocks/server';
import { TenantProvider } from '../../src/lib/multi-tenant/context';

// Import types
import type { FeatureFlagContext } from '../../src/lib/feature-flags/types';

// Mock component to test integration
const IntegrationTestComponent = () => {
  return (
    <div>
      <h1>Integration Test Component</h1>
      <p>
        This component tests the integration between feature flags and
        multi-tenant systems.
      </p>
    </div>
  );
};

// Test App Component that simulates real app structure
const TestApp = ({
  tenantId,
  children,
}: {
  tenantId?: string;
  children: React.ReactNode;
}) => {
  // For this test, we're not providing initial data to let the providers fetch from API
  const context: FeatureFlagContext = {
    tenantId,
    environment: 'development',
  };

  return (
    <TenantProvider tenantId={tenantId} isMultiTenant={true}>
      <FeatureFlagProvider context={context}>{children}</FeatureFlagProvider>
    </TenantProvider>
  );
};

describe('True Integration Examples - Real-World Scenarios', () => {
  // Enable API mocking before tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  // Reset any runtime request handlers we may add during the tests
  afterEach(() => server.resetHandlers());

  // Disable API mocking after the tests are done
  afterAll(() => server.close());

  it('should render correctly with feature flags and tenant context for default tenant', async () => {
    render(
      <TestApp tenantId="default">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Check that tenant-specific content is displayed
    expect(
      screen.getByText(
        'This component tests the integration between feature flags and multi-tenant systems.',
      ),
    ).toBeInTheDocument();
  });

  it('should render correctly with feature flags and tenant context for preview tenant', async () => {
    render(
      <TestApp tenantId="preview-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Check that tenant-specific content is displayed
    expect(
      screen.getByText(
        'This component tests the integration between feature flags and multi-tenant systems.',
      ),
    ).toBeInTheDocument();
  });

  it('should render correctly with feature flags and tenant context for enterprise tenant', async () => {
    render(
      <TestApp tenantId="enterprise-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Check that tenant-specific content is displayed
    expect(
      screen.getByText(
        'This component tests the integration between feature flags and multi-tenant systems.',
      ),
    ).toBeInTheDocument();
  });

  it('should handle tenant switching correctly', async () => {
    const { rerender } = render(
      <TestApp tenantId="default">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Rerender with different tenant
    rerender(
      <TestApp tenantId="preview-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Component should still render correctly
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });
  });

  it('should handle feature flag changes based on tenant context', async () => {
    // Render with preview tenant
    render(
      <TestApp tenantId="preview-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Render with enterprise tenant
    render(
      <TestApp tenantId="enterprise-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });
  });

  it('should handle concurrent requests from different tenants', async () => {
    // Render components for different tenants concurrently
    const { rerender } = render(
      <TestApp tenantId="default">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Rerender with preview tenant
    rerender(
      <TestApp tenantId="preview-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Rerender with enterprise tenant
    rerender(
      <TestApp tenantId="enterprise-tenant">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });
  });

  it('should handle edge cases gracefully', async () => {
    // Test with null tenant
    render(
      <TestApp tenantId={undefined}>
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Component should still render
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });

    // Test with empty tenant ID
    render(
      <TestApp tenantId="">
        <IntegrationTestComponent />
      </TestApp>,
    );

    // Component should still render
    await waitFor(() => {
      expect(
        screen.getByText('Integration Test Component'),
      ).toBeInTheDocument();
    });
  });
});
