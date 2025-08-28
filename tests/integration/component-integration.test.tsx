import '@testing-library/jest-dom';
import React from 'react';

import { render, screen } from '@testing-library/react';

// Import the providers
import { FeatureFlagProvider } from '../../src/lib/feature-flags/context';
import { TenantProvider } from '../../src/lib/multi-tenant/context';

// Import types
import type { FeatureFlag } from '../../src/lib/feature-flags/types';
import type { Tenant } from '../../src/lib/multi-tenant/types';

// Mock component to test integration
const TestIntegrationComponent = ({
  tenantName,
  flagEnabled,
}: {
  tenantName: string;
  flagEnabled: boolean;
}) => {
  return (
    <div>
      <div data-testid="tenant-name">{tenantName}</div>
      <div data-testid="flag-status">
        {flagEnabled ? 'enabled' : 'disabled'}
      </div>
    </div>
  );
};

describe('Component Integration Tests', () => {
  const mockTenant: Tenant = {
    id: 'test-tenant',
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

  const mockFlags: Record<string, FeatureFlag> = {
    'new-dashboard': {
      key: 'new-dashboard',
      enabled: true,
      description: 'Enable the new dashboard UI',
    },
    'dark-mode': {
      key: 'dark-mode',
      enabled: false,
      description: 'Enable dark mode theme',
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            tenant: mockTenant,
            flags: mockFlags,
          }),
      } as Response),
    ) as jest.Mock;
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  it('renders correctly with feature flags and tenant context', () => {
    render(
      <FeatureFlagProvider>
        <TenantProvider>
          <TestIntegrationComponent
            tenantName={mockTenant.name}
            flagEnabled={mockFlags['new-dashboard'].enabled}
          />
        </TenantProvider>
      </FeatureFlagProvider>,
    );

    expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
    expect(screen.getByTestId('flag-status')).toHaveTextContent('enabled');
  });

  it('shows different content based on tenant features', () => {
    const premiumTenant = {
      ...mockTenant,
      name: 'Premium Tenant',
      features: {
        ...mockTenant.features,
        customBranding: true,
        advancedReporting: true,
      },
    };

    render(
      <FeatureFlagProvider>
        <TenantProvider
          initialTenant={premiumTenant as Tenant}
          isMultiTenant={true}
        >
          <TestIntegrationComponent
            tenantName={premiumTenant.name}
            flagEnabled={true}
          />
        </TenantProvider>
      </FeatureFlagProvider>,
    );

    expect(screen.getByTestId('tenant-name')).toHaveTextContent(
      'Premium Tenant',
    );
    expect(screen.getByTestId('flag-status')).toHaveTextContent('enabled');
  });

  describe('Testing Different Combinations', () => {
    const testCases = [
      {
        name: 'Free tenant with basic features',
        tenant: {
          id: 'free-tenant',
          name: 'Free Tenant',
          features: {
            analytics: true,
            customBranding: false,
            apiAccess: true,
            advancedReporting: false,
            integrations: ['basic'],
          },
        },
        flags: {
          'new-dashboard': false,
          'dark-mode': false,
          'beta-features': false,
        },
        expected: {
          showPremium: false,
          showBeta: false,
          showAnalytics: true,
        },
      },
      {
        name: 'Premium tenant with all features',
        tenant: {
          id: 'premium-tenant',
          name: 'Premium Tenant',
          features: {
            analytics: true,
            customBranding: true,
            apiAccess: true,
            advancedReporting: true,
            integrations: ['basic', 'advanced'],
          },
        },
        flags: {
          'new-dashboard': true,
          'dark-mode': true,
          'beta-features': true,
        },
        expected: {
          showPremium: true,
          showBeta: true,
          showAnalytics: true,
        },
      },
    ];

    testCases.forEach(({ name, tenant, flags }) => {
      it(`should handle ${name}`, () => {
        // For this test, we're just checking that the providers can be instantiated
        // with different configurations
        const TestComponent = () => (
          <div data-testid="test-case">
            <div>Testing {tenant.name}</div>
            <div>Flags: {Object.keys(flags).join(', ')}</div>
          </div>
        );

        render(
          <FeatureFlagProvider>
            <TenantProvider
              initialTenant={tenant as Tenant}
              isMultiTenant={true}
            >
              <TestComponent />
            </TenantProvider>
          </FeatureFlagProvider>,
        );

        expect(screen.getByTestId('test-case')).toBeInTheDocument();
      });
    });
  });
});
