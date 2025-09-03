/**
 * MSW Integration Tests
 * Testing real API interactions with Mock Service Worker
 */

import '@testing-library/jest-dom';
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { http } from 'msw';

import { FeatureFlagDemo } from '../../src/components/feature-flag-demo';
import { FeatureFlagProvider } from '../../src/lib/feature-flags/context';
import { server } from '../../src/lib/mocks/server';
import { TenantProvider } from '../../src/lib/multi-tenant/context';

// Import types
import type { FeatureFlagContext } from '../../src/lib/feature-flags/types';

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

describe('MSW Integration Tests - Real API Interactions', () => {
  // Enable API mocking before tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  // Reset any runtime request handlers we may add during the tests
  afterEach(() => server.resetHandlers());

  // Disable API mocking after the tests are done
  afterAll(() => server.close());

  it('should fetch feature flags for default tenant', async () => {
    render(
      <TestApp tenantId="default">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that all features are disabled for default tenant
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(3);

    // Verify that dark mode is disabled (tenant restriction)
    expect(
      screen.queryByText('🌙 Dark mode is available!'),
    ).not.toBeInTheDocument();

    // Verify premium features are not shown
    expect(
      screen.queryByText("🎉 You're seeing the new dashboard experience!"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText('🤖 AI Assistant is ready to help!'),
    ).not.toBeInTheDocument();
  });

  it('should fetch feature flags for preview tenant', async () => {
    render(
      <TestApp tenantId="preview-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that all features are disabled for preview tenant
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(3);

    // Dark mode should be disabled (tenant restriction)
    expect(
      screen.queryByText('🌙 Dark mode is available!'),
    ).not.toBeInTheDocument();

    // New dashboard should be disabled (only for enterprise-tenant)
    // AI assistant should be disabled (10% rollout)
    expect(
      screen.queryByText('🤖 AI Assistant is ready to help!'),
    ).not.toBeInTheDocument();
  });

  it('should fetch feature flags for enterprise tenant', async () => {
    render(
      <TestApp tenantId="enterprise-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Wait for component to load and fetch data
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // For enterprise tenant, we expect:
    // - new-dashboard: disabled (rolloutPercentage: 50%)
    // - dark-mode: enabled (tenant restriction)
    // - ai-assistant: disabled (rolloutPercentage: 10%)

    // Check that 2 features are disabled and 1 is enabled
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(2);

    const enabledElements = screen.getAllByText(/Status: ✅ Enabled/);
    expect(enabledElements).toHaveLength(1);

    // Dark mode should be enabled for enterprise tenant
    expect(screen.getByText('🌙 Dark mode is available!')).toBeInTheDocument();

    // New dashboard should be disabled for enterprise tenant (50% rollout)
    expect(
      screen.queryByText("🎉 You're seeing the new dashboard experience!"),
    ).not.toBeInTheDocument();

    // AI assistant should be disabled for enterprise tenant (10% rollout)
    expect(
      screen.queryByText('🤖 AI Assistant is ready to help!'),
    ).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error for feature flags using proper service response format
    server.use(
      http.post('/api/feature-flags', () => {
        return new Response(
          JSON.stringify({
            status: 'server_error',
            error: 'Internal Server Error',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <TestApp tenantId="preview-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Component should still render even with API errors
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should show disabled state for all features when API fails
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(3);

    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load feature flags:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error for feature flags
    server.use(
      http.post('/api/feature-flags', () => {
        throw new Error('Failed to connect');
      }),
    );

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <TestApp tenantId="preview-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Component should still render even with network errors
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should show disabled state for all features when network fails
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(3);

    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load feature flags:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should display feature flags JSON correctly', async () => {
    render(
      <TestApp tenantId="enterprise-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    await waitFor(() => {
      expect(screen.getByText('All Feature Flags')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the JSON display shows actual flag data
    const jsonDisplay = screen.getByText(/"new-dashboard"/);
    expect(jsonDisplay).toBeInTheDocument();

    // Verify the JSON contains expected structure
    expect(screen.getByText(/"enabled": false/)).toBeInTheDocument();
  });

  it('should handle missing tenant gracefully', async () => {
    render(
      <TestApp tenantId="non-existent-tenant">
        <FeatureFlagDemo />
      </TestApp>,
    );

    // Component should still render with default flags for unknown tenant
    await waitFor(() => {
      expect(screen.getByText('Feature Flag Demo')).toBeInTheDocument();
    });

    // Wait a bit more for the async data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should show disabled state for features that require specific tenants
    const disabledElements = screen.getAllByText(/Status: ❌ Disabled/);
    expect(disabledElements).toHaveLength(3);
  });
});
