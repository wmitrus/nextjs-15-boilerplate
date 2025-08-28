/**
 * Integration Test Helpers
 * Utilities for creating real integration tests without excessive mocking
 */

import React from 'react';

import { render, RenderOptions, screen } from '@testing-library/react';

import { FeatureFlagProvider } from '../../src/lib/feature-flags/context';
import { TenantProvider } from '../../src/lib/multi-tenant/context';

// Import types
import type { FeatureFlag } from '../../src/lib/feature-flags/types';
import type { Tenant } from '../../src/lib/multi-tenant/types';

// Test configuration interface
export interface IntegrationTestConfig {
  tenant: Tenant;
  flags: Record<string, FeatureFlag>;
  isMultiTenant?: boolean;
  mockExternalServices?: boolean;
}

// Real tenant configurations for testing
export const testTenants = {
  free: {
    id: 'free-tenant',
    name: 'Free Tier Company',
    domain: 'free.example.com',
    subdomain: 'free',
    settings: {
      branding: {
        logo: 'free-logo.png',
        primaryColor: '#6c757d',
        secondaryColor: '#adb5bd',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'UTC',
      },
      security: {
        allowedDomains: ['free.example.com'],
        requireMfa: false,
        sessionTimeout: 1800,
      },
    },
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: false,
      advancedReporting: false,
      integrations: ['basic'],
      maxUsers: 5,
      storageLimit: 50,
    },
    metadata: {
      plan: 'free',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  } as Tenant,

  startup: {
    id: 'startup-tenant',
    name: 'Startup Company',
    domain: 'startup.example.com',
    subdomain: 'startup',
    settings: {
      branding: {
        logo: 'startup-logo.png',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es'],
        timezone: 'America/New_York',
      },
      security: {
        allowedDomains: ['startup.example.com'],
        requireMfa: false,
        sessionTimeout: 3600,
      },
    },
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic', 'slack'],
      maxUsers: 25,
      storageLimit: 500,
    },
    metadata: {
      plan: 'startup',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  } as Tenant,

  enterprise: {
    id: 'enterprise-tenant',
    name: 'Enterprise Corporation',
    domain: 'enterprise.example.com',
    subdomain: 'enterprise',
    settings: {
      branding: {
        logo: 'enterprise-logo.png',
        primaryColor: '#28a745',
        secondaryColor: '#17a2b8',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de'],
        timezone: 'America/New_York',
      },
      security: {
        allowedDomains: ['enterprise.example.com', 'corp.example.com'],
        requireMfa: true,
        sessionTimeout: 7200,
      },
    },
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: true,
      integrations: ['basic', 'advanced', 'custom', 'slack', 'github', 'jira'],
      maxUsers: 1000,
      storageLimit: 10000,
    },
    metadata: {
      plan: 'enterprise',
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-15'),
  } as Tenant,
};

// Real feature flag configurations for testing
export const testFeatureFlags = {
  allDisabled: {
    'new-dashboard': {
      key: 'new-dashboard',
      enabled: false,
      description: 'Enable the new dashboard UI',
    },
    'dark-mode': {
      key: 'dark-mode',
      enabled: false,
      description: 'Enable dark mode theme',
    },
    'ai-assistant': {
      key: 'ai-assistant',
      enabled: false,
      description: 'Enable AI assistant features',
    },
    'beta-features': {
      key: 'beta-features',
      enabled: false,
      description: 'Enable beta features',
    },
  },

  conservative: {
    'new-dashboard': {
      key: 'new-dashboard',
      enabled: false,
      description: 'Enable the new dashboard UI',
    },
    'dark-mode': {
      key: 'dark-mode',
      enabled: true,
      description: 'Enable dark mode theme',
    },
    'ai-assistant': {
      key: 'ai-assistant',
      enabled: false,
      description: 'Enable AI assistant features',
    },
    'beta-features': {
      key: 'beta-features',
      enabled: false,
      description: 'Enable beta features',
    },
  },

  progressive: {
    'new-dashboard': {
      key: 'new-dashboard',
      enabled: true,
      description: 'Enable the new dashboard UI',
    },
    'dark-mode': {
      key: 'dark-mode',
      enabled: true,
      description: 'Enable dark mode theme',
    },
    'ai-assistant': {
      key: 'ai-assistant',
      enabled: true,
      description: 'Enable AI assistant features',
    },
    'beta-features': {
      key: 'beta-features',
      enabled: true,
      description: 'Enable beta features',
    },
  },

  mixed: {
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
    'ai-assistant': {
      key: 'ai-assistant',
      enabled: true,
      description: 'Enable AI assistant features',
    },
    'beta-features': {
      key: 'beta-features',
      enabled: false,
      description: 'Enable beta features',
    },
  },
};

// Test scenarios combining tenants and flags
export const testScenarios = [
  {
    name: 'Free tenant with all features disabled',
    tenant: testTenants.free,
    flags: testFeatureFlags.allDisabled,
    expected: {
      showPremiumFeatures: false,
      showAdvancedReporting: false,
      showCustomBranding: false,
      maxUsers: 5,
    },
  },
  {
    name: 'Startup tenant with conservative flags',
    tenant: testTenants.startup,
    flags: testFeatureFlags.conservative,
    expected: {
      showPremiumFeatures: true,
      showAdvancedReporting: false,
      showCustomBranding: true,
      maxUsers: 25,
    },
  },
  {
    name: 'Enterprise tenant with progressive flags',
    tenant: testTenants.enterprise,
    flags: testFeatureFlags.progressive,
    expected: {
      showPremiumFeatures: true,
      showAdvancedReporting: true,
      showCustomBranding: true,
      maxUsers: 1000,
    },
  },
  {
    name: 'Enterprise tenant with mixed flags',
    tenant: testTenants.enterprise,
    flags: testFeatureFlags.mixed,
    expected: {
      showPremiumFeatures: true,
      showAdvancedReporting: true,
      showCustomBranding: true,
      maxUsers: 1000,
    },
  },
];

// Integration Test Wrapper Component
interface IntegrationTestWrapperProps {
  config: IntegrationTestConfig;
  children: React.ReactNode;
}

export const IntegrationTestWrapper: React.FC<IntegrationTestWrapperProps> = ({
  config,
  children,
}) => {
  return (
    <TenantProvider
      initialTenant={config.tenant}
      isMultiTenant={config.isMultiTenant ?? true}
    >
      <FeatureFlagProvider initialFlags={config.flags}>
        {children}
      </FeatureFlagProvider>
    </TenantProvider>
  );
};

// Custom render function for integration tests
interface IntegrationRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  config: IntegrationTestConfig;
}

export const renderWithIntegration = (
  ui: React.ReactElement,
  options: IntegrationRenderOptions,
) => {
  const { config, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <IntegrationTestWrapper config={config}>{children}</IntegrationTestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to create test configurations
export const createTestConfig = (
  tenantType: keyof typeof testTenants,
  flagType: keyof typeof testFeatureFlags,
  overrides?: Partial<IntegrationTestConfig>,
): IntegrationTestConfig => ({
  tenant: testTenants[tenantType],
  flags: testFeatureFlags[flagType],
  isMultiTenant: true,
  mockExternalServices: false,
  ...overrides,
});

// Performance testing helpers
export const measureRenderTime = async (
  renderFn: () => Promise<void> | void,
): Promise<number> => {
  const startTime = performance.now();
  await renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

// Error boundary for testing error scenarios
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock external services helper
export const mockExternalServices = () => {
  // Mock fetch for external API calls
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response),
  ) as jest.Mock;

  // Mock console methods to avoid noise in tests
  const originalConsole = { ...console };
  console.warn = jest.fn();
  console.error = jest.fn();

  return {
    restoreConsole: () => {
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    },
    restoreFetch: () => {
      delete (global as unknown as { fetch?: typeof fetch }).fetch;
    },
  };
};

// Assertion helpers for common integration test patterns
export const integrationAssertions = {
  // Assert that a component renders without errors
  expectNoErrors: (consoleSpy: jest.SpyInstance) => {
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Error'),
    );
  },

  // Assert that feature flags are properly applied
  expectFeatureFlagBehavior: (
    flagKey: string,
    enabled: boolean,
    enabledSelector: string,
    disabledSelector?: string,
  ) => {
    // Note: This helper assumes screen is available in the test context
    if (enabled) {
      expect(screen.getByTestId(enabledSelector)).toBeInTheDocument();
      if (disabledSelector) {
        expect(screen.queryByTestId(disabledSelector)).not.toBeInTheDocument();
      }
    } else {
      expect(screen.queryByTestId(enabledSelector)).not.toBeInTheDocument();
      if (disabledSelector) {
        expect(screen.getByTestId(disabledSelector)).toBeInTheDocument();
      }
    }
  },

  // Assert that tenant features are properly applied
  expectTenantFeatureBehavior: (
    tenant: Tenant,
    featureKey: keyof Tenant['features'],
    enabledSelector: string,
    disabledSelector?: string,
  ) => {
    // Note: This helper assumes screen is available in the test context
    const isEnabled = tenant.features[featureKey];

    if (isEnabled) {
      expect(screen.getByTestId(enabledSelector)).toBeInTheDocument();
      if (disabledSelector) {
        expect(screen.queryByTestId(disabledSelector)).not.toBeInTheDocument();
      }
    } else {
      expect(screen.queryByTestId(enabledSelector)).not.toBeInTheDocument();
      if (disabledSelector) {
        expect(screen.getByTestId(disabledSelector)).toBeInTheDocument();
      }
    }
  },

  // Assert performance characteristics
  expectPerformance: (renderTime: number, maxTime: number = 100) => {
    expect(renderTime).toBeLessThan(maxTime);
  },
};

// Data generators for edge cases and invalid scenarios
export const createInvalidTenant = (
  type: 'nullFeatures' | 'missingId' | 'invalidDates',
): Partial<Tenant> => {
  const baseTenant = testTenants.free;

  switch (type) {
    case 'nullFeatures':
      return { ...baseTenant, features: null as unknown as Tenant['features'] };
    case 'missingId':
      return { ...baseTenant, id: '' };
    case 'invalidDates':
      return {
        ...baseTenant,
        createdAt: new Date('invalid'),
        updatedAt: new Date('invalid'),
      };
    default:
      return baseTenant;
  }
};

// Helper to create custom feature flag configurations
export const createCustomFlags = (
  overrides: Partial<Record<string, FeatureFlag>>,
): Record<string, FeatureFlag> => ({
  ...testFeatureFlags.allDisabled,
  ...overrides,
});

// Test data cleanup helper
export const cleanupTestData = () => {
  // Reset any global state that might affect tests
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
};
