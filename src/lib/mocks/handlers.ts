import { http, HttpResponse } from 'msw';

import { getEnvironmentConfig } from '../env';
import { LocalFeatureFlagProvider } from '../feature-flags/local-provider';

// Import types
import type { FeatureFlag } from '../feature-flags/types';
import type { FeatureFlagContext } from '../feature-flags/types';
import type { Tenant } from '../multi-tenant/types';

// Initialize the feature flag provider
const featureFlagProvider = new LocalFeatureFlagProvider();

// Real tenant configurations for MSW
const mockTenants: Record<string, Tenant> = {
  'free-tenant': {
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
  },
  'startup-tenant': {
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
  },
  'enterprise-tenant': {
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
  },
  'preview-tenant': {
    id: 'preview-tenant',
    name: 'Preview Tenant',
    domain: 'preview.example.com',
    subdomain: 'preview',
    settings: {
      branding: {
        logo: 'preview-logo.png',
        primaryColor: '#ffc107',
        secondaryColor: '#fd7e14',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'UTC',
      },
      security: {
        allowedDomains: ['preview.example.com'],
        requireMfa: false,
        sessionTimeout: 3600,
      },
    },
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic'],
      maxUsers: 50,
      storageLimit: 1000,
    },
    metadata: {
      plan: 'preview',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  default: {
    id: 'default',
    name: 'Default Tenant',
    settings: {
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'UTC',
      },
      security: {
        requireMfa: false,
        sessionTimeout: 3600,
      },
    },
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic'],
      maxUsers: 100,
      storageLimit: 1000,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// Initialize the feature flag provider
featureFlagProvider.initialize().catch(console.error);

export const handlers = [
  // Mock Logflare API endpoints
  http.post('https://api.logflare.app/logs', ({ request }) => {
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[MSW] Intercepted Logflare API request:', request.url);
    }

    // Return a successful response that matches Logflare's expected format
    return HttpResponse.json(
      {
        message: 'Logs received successfully',
        status: 'ok',
      },
      { status: 200 },
    );
  }),

  // Handle requests with query parameters (like your specific case)
  http.post('https://api.logflare.app/logs/*', ({ request }) => {
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[MSW] Intercepted Logflare API request with params:',
        request.url,
      );
    }

    return HttpResponse.json(
      {
        message: 'Logs received successfully',
        status: 'ok',
      },
      { status: 200 },
    );
  }),

  // Mock feature flags API endpoint
  http.post('/api/feature-flags', async ({ request }) => {
    try {
      // Parse the request body to get context
      const body = await request.json().catch(() => ({}));
      const context = body as FeatureFlagContext;

      // Set environment in context if not provided
      if (!context.environment) {
        const envConfig = getEnvironmentConfig();
        context.environment = envConfig.environment;
      }

      // Get feature flags based on context
      const flags = await featureFlagProvider.getAllFlags(context);

      return HttpResponse.json(
        {
          flags,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Error in feature flags handler:', error);
      return HttpResponse.json(
        { error: 'Failed to load feature flags' },
        { status: 500 },
      );
    }
  }),

  // Mock tenant API endpoint
  http.get('/api/tenants/:tenantId', ({ params }) => {
    try {
      const { tenantId } = params;

      // Handle special case for 'current' tenant
      if (tenantId === 'current') {
        // In a real implementation, this would determine the current tenant from headers
        // For testing, we'll return the default tenant
        const tenant = mockTenants['default'];
        return HttpResponse.json({ tenant }, { status: 200 });
      }

      // Get tenant by ID
      const tenant = mockTenants[tenantId as string];

      if (!tenant) {
        // For non-existent tenants, return default tenant data
        const defaultTenant = mockTenants['default'];
        return HttpResponse.json({ tenant: defaultTenant }, { status: 200 });
      }

      return HttpResponse.json({ tenant }, { status: 200 });
    } catch (error) {
      console.error('Error in tenant handler:', error);
      return HttpResponse.json(
        { error: 'Failed to load tenant' },
        { status: 500 },
      );
    }
  }),

  // Mock tenant API endpoint for POST requests
  http.post('/api/tenants/:tenantId', async ({ request, params }) => {
    try {
      const { tenantId } = params;

      // Handle special case for 'current' tenant
      if (tenantId === 'current') {
        // In a real implementation, this would determine the current tenant from headers
        // For testing, we'll return the default tenant
        const tenant = mockTenants['default'];
        return HttpResponse.json({ tenant }, { status: 200 });
      }

      // Get tenant by ID
      const tenant = mockTenants[tenantId as string];

      if (!tenant) {
        return HttpResponse.json(
          { error: 'Tenant not found' },
          { status: 404 },
        );
      }

      return HttpResponse.json({ tenant }, { status: 200 });
    } catch (error) {
      console.error('Error in tenant handler:', error);
      return HttpResponse.json(
        { error: 'Failed to load tenant' },
        { status: 500 },
      );
    }
  }),

  // Ignore Next.js internal requests during E2E tests
  http.post('*/__nextjs_original-stack-frames', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
