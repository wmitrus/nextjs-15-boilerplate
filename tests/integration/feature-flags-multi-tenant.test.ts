import '@testing-library/jest-dom';

// Import the hooks and providers we want to test
import {
  getFeatureFlag,
  getFeatureFlagValue,
} from '../../src/lib/feature-flags/hooks';
import {
  getCurrentTenant,
  isTenantFeatureEnabled,
} from '../../src/lib/multi-tenant/hooks';

// Mock the tenant resolution
jest.mock('../../src/lib/multi-tenant/hooks', () => ({
  ...jest.requireActual('../../src/lib/multi-tenant/hooks'),
  getCurrentTenant: jest.fn(),
  isTenantFeatureEnabled: jest.fn(),
}));

// Mock feature flag evaluation
jest.mock('../../src/lib/feature-flags/hooks', () => ({
  ...jest.requireActual('../../src/lib/feature-flags/hooks'),
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
    const subscriptionTier = await getFeatureFlagValue(
      'subscription-tier',
      'basic',
    );

    // Assertions
    expect(hasAnalytics).toBe(true);
    expect(hasCustomBranding).toBe(false);
    expect(isNewDashboardEnabled).toBe(true);
    expect(subscriptionTier).toEqual({
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
    const isBetaFeatureEnabled = await getFeatureFlag('beta-features');

    expect(hasAnalytics).toBe(false);
    expect(hasCustomBranding).toBe(false);
    expect(isBetaFeatureEnabled).toBe(false);
  });
});
