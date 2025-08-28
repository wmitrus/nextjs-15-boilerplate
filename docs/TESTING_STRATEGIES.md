# Testing Strategies for Feature Flags and Multi-Tenant Systems

This document provides comprehensive guidance on testing feature flag and multi-tenant systems together in Next.js 15.5 applications.

## Table of Contents

- [Testing Pyramid Overview](#testing-pyramid-overview)
- [Component Testing](#component-testing)
- [Integration Testing](#integration-testing)
- [API Route Testing](#api-route-testing)
- [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
- [Performance Testing](#performance-testing)
- [Best Practices](#best-practices)

## Testing Pyramid Overview

When testing feature flags and multi-tenant systems together, it's important to understand where different testing approaches fit in the testing pyramid:

1. **Component Testing** - Test components with mocked contexts
2. **Integration Testing** - Test how systems work together
3. **API Route Testing** - Test server-side logic
4. **End-to-End Testing** - Test complete user flows
5. **Performance Testing** - Ensure systems perform well under load

## Component Testing

Component testing is the most effective approach for testing feature flags and multi-tenant systems together. It allows you to test how components render with different combinations of feature flags and tenant configurations.

### Example Component Test

```tsx
// src/components/Dashboard.test.tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Dashboard } from './Dashboard';
import { FeatureFlagProvider } from '@/lib/feature-flags';
import { TenantProvider } from '@/lib/multi-tenant';

// Mock implementations for testing
const mockTenant = {
  id: 'test-tenant',
  name: 'Test Tenant',
  features: {
    analytics: true,
    customBranding: false,
    apiAccess: true,
    advancedReporting: false,
    integrations: ['basic'],
  },
};

const mockFlags = {
  'new-dashboard': true,
  'dark-mode': false,
  'beta-feature': true,
};

describe('Dashboard Component', () => {
  it('renders correctly with feature flags and tenant context', () => {
    render(
      <FeatureFlagProvider flags={mockFlags}>
        <TenantProvider tenant={mockTenant}>
          <Dashboard />
        </TenantProvider>
      </FeatureFlagProvider>,
    );

    // Test that the component renders correctly based on flags and tenant
    expect(screen.getByText('Welcome, Test Tenant')).toBeInTheDocument();
    expect(screen.getByText('New Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Beta Feature')).not.toBeInTheDocument();
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
      <FeatureFlagProvider flags={mockFlags}>
        <TenantProvider tenant={premiumTenant}>
          <Dashboard />
        </TenantProvider>
      </FeatureFlagProvider>,
    );

    // Premium tenant should see advanced features
    expect(screen.getByText('Advanced Reporting')).toBeInTheDocument();
    expect(screen.getByText('Custom Branding')).toBeInTheDocument();
  });
});
```

### Testing Different Combinations

```tsx
// src/components/FeatureTenantCombination.test.tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { FeatureComponent } from './FeatureComponent';
import { FeatureFlagProvider } from '@/lib/feature-flags';
import { TenantProvider } from '@/lib/multi-tenant';

describe('FeatureComponent with different combinations', () => {
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
        'premium-feature': false,
        'beta-feature': false,
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
        'premium-feature': true,
        'beta-feature': true,
      },
      expected: {
        showPremium: true,
        showBeta: true,
        showAnalytics: true,
      },
    },
  ];

  testCases.forEach(({ name, tenant, flags, expected }) => {
    it(name, () => {
      render(
        <FeatureFlagProvider flags={flags}>
          <TenantProvider tenant={tenant}>
            <FeatureComponent />
          </TenantProvider>
        </FeatureFlagProvider>,
      );

      if (expected.showPremium) {
        expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
      }

      if (expected.showBeta) {
        expect(screen.getByText('Beta Feature')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Beta Feature')).not.toBeInTheDocument();
      }

      if (expected.showAnalytics) {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      } else {
        expect(
          screen.queryByText('Analytics Dashboard'),
        ).not.toBeInTheDocument();
      }
    });
  });
});
```

## Integration Testing

Integration testing focuses on how the feature flag and multi-tenant systems work together in server-side contexts.

### Server-Side Integration Test

```ts
// src/lib/integration.test.ts
import { getFeatureFlag, getFeatureFlagValue } from '@/lib/feature-flags/hooks';
import {
  getCurrentTenant,
  isTenantFeatureEnabled,
} from '@/lib/multi-tenant/hooks';

// Mock the tenant resolution
jest.mock('@/lib/multi-tenant/hooks', () => ({
  ...jest.requireActual('@/lib/multi-tenant/hooks'),
  getCurrentTenant: jest.fn(),
  isTenantFeatureEnabled: jest.fn(),
}));

// Mock feature flag evaluation
jest.mock('@/lib/feature-flags/hooks', () => ({
  ...jest.requireActual('@/lib/feature-flags/hooks'),
  getFeatureFlag: jest.fn(),
  getFeatureFlagValue: jest.fn(),
}));

describe('Feature Flag and Multi-Tenant Integration', () => {
  const mockTenant = {
    id: 'test-tenant',
    name: 'Test Tenant',
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic'],
    },
  };

  beforeEach(() => {
    (getCurrentTenant as jest.Mock).mockResolvedValue(mockTenant);
    (isTenantFeatureEnabled as jest.Mock).mockImplementation(
      (tenant, feature) => tenant.features[feature] === true,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly evaluate feature availability based on tenant and flags', async () => {
    // Mock feature flag responses
    (getFeatureFlag as jest.Mock).mockResolvedValue(true);
    (getFeatureFlagValue as jest.Mock).mockResolvedValue({
      theme: 'dark',
      layout: 'modern',
    });

    // Get tenant context
    const tenant = await getCurrentTenant();

    // Check if tenant has specific feature enabled
    const hasAnalytics = isTenantFeatureEnabled(tenant, 'analytics');
    const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');

    // Check feature flag
    const isNewDashboardEnabled = await getFeatureFlag('new-dashboard');
    const dashboardConfig = await getFeatureFlagValue('dashboard-config', {
      theme: 'light',
      layout: 'classic',
    });

    // Assertions
    expect(hasAnalytics).toBe(true);
    expect(hasCustomBranding).toBe(false);
    expect(isNewDashboardEnabled).toBe(true);
    expect(dashboardConfig).toEqual({
      theme: 'dark',
      layout: 'modern',
    });
  });

  it('should handle tenant without specific features gracefully', async () => {
    const limitedTenant = {
      id: 'limited-tenant',
      name: 'Limited Tenant',
      features: {
        analytics: false,
        customBranding: false,
        apiAccess: true,
      },
    };

    (getCurrentTenant as jest.Mock).mockResolvedValue(limitedTenant);
    (getFeatureFlag as jest.Mock).mockResolvedValue(false);

    const tenant = await getCurrentTenant();
    const hasAnalytics = isTenantFeatureEnabled(tenant, 'analytics');
    const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');
    const isNewFeatureEnabled = await getFeatureFlag('new-feature');

    expect(hasAnalytics).toBe(false);
    expect(hasCustomBranding).toBe(false);
    expect(isNewFeatureEnabled).toBe(false);
  });
});
```

## API Route Testing

Test API routes that use both systems together:

```ts
// src/app/api/dashboard/route.test.ts
import { GET } from './route';
import { createMockRequest } from '@/lib/mocks';

describe('Dashboard API Route', () => {
  it('should return correct data based on tenant and feature flags', async () => {
    // Mock request with tenant context
    const mockRequest = createMockRequest({
      headers: {
        'x-tenant-id': 'premium-tenant',
        'x-user-id': 'user-123',
      },
    });

    // Mock feature flag provider
    jest.mock('@/lib/feature-flags', () => ({
      getFeatureFlag: jest.fn().mockResolvedValue(true),
    }));

    // Mock tenant resolution
    jest.mock('@/lib/multi-tenant', () => ({
      getCurrentTenant: jest.fn().mockResolvedValue({
        id: 'premium-tenant',
        name: 'Premium Tenant',
        features: {
          analytics: true,
          customBranding: true,
        },
      }),
    }));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      tenant: 'Premium Tenant',
      features: {
        analytics: true,
        customBranding: true,
      },
      flags: {
        'new-dashboard': true,
      },
    });
  });
});
```

## End-to-End Testing with Playwright

Use Playwright for testing critical user flows that depend on both systems:

```ts
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard with Feature Flags and Multi-Tenant', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock tenant and feature flags
    await page.route('*/**/api/tenant', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'e2e-tenant',
          name: 'E2E Tenant',
          features: {
            analytics: true,
            customBranding: true,
          },
        },
      });
    });

    await page.route('*/**/api/feature-flags', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          'new-dashboard': true,
          'dark-mode': false,
        },
      });
    });
  });

  test('should display correct dashboard based on tenant and flags', async ({
    page,
  }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Check that tenant-specific content is displayed
    await expect(page.getByText('Welcome, E2E Tenant')).toBeVisible();

    // Check that feature flag-specific content is displayed
    await expect(page.getByText('New Dashboard')).toBeVisible();
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();

    // Check that disabled features are not shown
    await expect(page.getByText('Beta Feature')).not.toBeVisible();
  });

  test('should handle tenant switching correctly', async ({ page }) => {
    // Switch tenant context
    await page.goto('/switch-tenant?tenantId=free-tenant');

    // Check that content updates based on new tenant
    await expect(page.getByText('Welcome, Free Tenant')).toBeVisible();
    await expect(page.getByText('Basic Dashboard')).toBeVisible();
    await expect(page.getByText('Premium Feature')).not.toBeVisible();
  });
});
```

## Performance Testing

Ensure that the combination of feature flags and multi-tenant systems doesn't impact performance:

```ts
// src/lib/performance.test.ts
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import { getCurrentTenant } from '@/lib/multi-tenant/hooks';

describe('Performance Testing', () => {
  it('should evaluate feature flags quickly', async () => {
    const startTime = performance.now();

    // Evaluate multiple feature flags
    await Promise.all([
      getFeatureFlag('flag-1'),
      getFeatureFlag('flag-2'),
      getFeatureFlag('flag-3'),
      getFeatureFlag('flag-4'),
      getFeatureFlag('flag-5'),
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within 50ms
    expect(duration).toBeLessThan(50);
  });

  it('should resolve tenant context quickly', async () => {
    const startTime = performance.now();

    // Resolve tenant context multiple times
    await Promise.all([
      getCurrentTenant(),
      getCurrentTenant(),
      getCurrentTenant(),
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within 30ms
    expect(duration).toBeLessThan(30);
  });
});
```

## Best Practices

### 1. Mock External Dependencies

Always mock external dependencies like databases, APIs, and third-party services:

```ts
// src/lib/test-utils.ts
export const createMockTenant = (overrides = {}) => ({
  id: 'mock-tenant',
  name: 'Mock Tenant',
  features: {
    analytics: true,
    customBranding: false,
    apiAccess: true,
    advancedReporting: false,
    integrations: ['basic'],
  },
  ...overrides,
});

export const createMockFlags = (overrides = {}) => ({
  'new-dashboard': true,
  'dark-mode': false,
  'beta-feature': true,
  ...overrides,
});

export const mockTenantContext = (tenant, flags) => {
  // Mock the tenant context provider
  jest.mock('@/lib/multi-tenant/context', () => ({
    useTenant: () => ({
      tenant,
      isMultiTenant: true,
      tenantId: tenant.id,
    }),
  }));

  // Mock the feature flag context provider
  jest.mock('@/lib/feature-flags/context', () => ({
    useFeatureFlags: () => ({
      flags,
      isLoading: false,
    }),
    useFeatureFlag: (flagKey) => ({
      isEnabled: flags[flagKey] || false,
      isLoading: false,
    }),
  }));
};
```

### 2. Test Edge Cases

Test edge cases like:

- Tenant with no features
- Feature flags that don't exist
- Network failures
- Slow API responses

### 3. Use Realistic Data

Use realistic tenant and feature flag data in tests:

```ts
// src/lib/test-data.ts
export const testTenants = {
  free: {
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
  premium: {
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
  enterprise: {
    id: 'enterprise-tenant',
    name: 'Enterprise Tenant',
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: true,
      integrations: ['basic', 'advanced', 'custom'],
    },
  },
};

export const testFlags = {
  development: {
    'new-dashboard': true,
    'dark-mode': false,
    'beta-feature': true,
  },
  production: {
    'new-dashboard': false,
    'dark-mode': true,
    'beta-feature': false,
  },
};
```

### 4. Test Combinations

Test different combinations of tenants and feature flags:

```ts
// src/components/CombinationTest.test.tsx
import { testTenants, testFlags } from '@/lib/test-data';

describe('Component with different tenant/flag combinations', () => {
  Object.entries(testTenants).forEach(([tenantType, tenant]) => {
    Object.entries(testFlags).forEach(([flagEnv, flags]) => {
      it(`should render correctly for ${tenantType} tenant in ${flagEnv} environment`, () => {
        // Test implementation
      });
    });
  });
});
```

By following these testing strategies, you can ensure that your feature flag and multi-tenant systems work together correctly while maintaining good performance and reliability.
