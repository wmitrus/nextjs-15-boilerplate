# Real App Integration Examples

This document provides comprehensive examples of how to integrate the feature flag and multi-tenant systems into a real-world application.

## Table of Contents

- [E-commerce Platform Example](#e-commerce-platform-example)
- [SaaS Application Example](#saas-application-example)
- [Content Management System Example](#content-management-system-example)
- [API Service Example](#api-service-example)
- [Dashboard Application Example](#dashboard-application-example)

## E-commerce Platform Example

### Scenario

An e-commerce platform that needs to:

- Enable features for specific user segments
- Support multiple merchant tenants
- Roll out new features gradually
- Personalize user experiences

### Implementation

#### 1. Feature Flag Configuration

```typescript
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'express-checkout': {
    key: 'express-checkout',
    enabled: true,
    description: 'One-click checkout for premium users',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['premium', 'vip'],
        property: 'subscriptionTier',
      },
    ],
  },
  'new-product-recommendations': {
    key: 'new-product-recommendations',
    enabled: true,
    description: 'AI-powered product recommendations',
    rolloutPercentage: 30,
    environments: ['development', 'preview'],
  },
  'multi-currency-support': {
    key: 'multi-currency-support',
    enabled: true,
    description: 'Support for multiple currencies',
    tenants: ['international-merchant', 'global-store'],
  },
};
```

#### 2. Tenant-Specific Configuration

```typescript
// src/lib/multi-tenant/hooks.ts
const mockTenants: Record<string, Tenant> = {
  default: {
    id: 'default',
    name: 'Local Store',
    settings: {
      branding: {
        primaryColor: '#3b82f6',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'UTC',
      },
      security: {
        requireMfa: false,
      },
    },
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic'],
    },
  },
  'international-merchant': {
    id: 'international-merchant',
    name: 'Global Merchant',
    settings: {
      branding: {
        primaryColor: '#f59e0b',
      },
      localization: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'de'],
        timezone: 'UTC',
      },
      security: {
        requireMfa: true,
      },
    },
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: true,
      integrations: ['basic', 'advanced'],
      multiCurrency: true,
    },
  },
};
```

#### 3. Client-Side Integration

```tsx
// src/components/ShoppingCart.tsx
'use client';

import { useFeatureFlag } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onCheckout: () => void;
}

export function ShoppingCart({ items, onCheckout }: ShoppingCartProps) {
  const { isEnabled: isExpressCheckoutEnabled } =
    useFeatureFlag('express-checkout');
  const { isEnabled: isMultiCurrencyEnabled } = useFeatureFlag(
    'multi-currency-support',
  );
  const { tenant } = useTenant();

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-2xl font-bold">Shopping Cart</h2>

      <div className="mb-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>${item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>${total}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isExpressCheckoutEnabled && (
          <button
            className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700"
            onClick={onCheckout}
          >
            Express Checkout
          </button>
        )}

        <button
          className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
          onClick={onCheckout}
        >
          Standard Checkout
        </button>
      </div>

      {tenant && isMultiCurrencyEnabled && (
        <div className="mt-4 text-sm text-gray-600">
          Prices shown in{' '}
          {tenant.settings.localization.defaultLanguage.toUpperCase()} currency
        </div>
      )}
    </div>
  );
}
```

#### 4. Server-Side Integration

```typescript
// src/app/api/checkout/route.ts
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import { getCurrentTenant } from '@/lib/multi-tenant/hooks';
import { NextRequest } from 'next/server';

interface CheckoutRequest {
  items: Array<{ id: string; quantity: number }>;
  userId: string;
  paymentMethod: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Get tenant and feature flag context
    const tenant = await getCurrentTenant();
    const isExpressCheckoutEnabled = await getFeatureFlag('express-checkout');
    const isMultiCurrencyEnabled = await getFeatureFlag(
      'multi-currency-support',
    );

    // Process checkout based on features
    if (isExpressCheckoutEnabled && body.paymentMethod === 'express') {
      // Process express checkout
      return Response.json({
        success: true,
        orderId: 'express-' + Date.now(),
        message: 'Express checkout completed',
        tenant: tenant?.name,
      });
    }

    // Standard checkout process
    return Response.json({
      success: true,
      orderId: 'standard-' + Date.now(),
      message: 'Standard checkout completed',
      tenant: tenant?.name,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 },
    );
  }
}
```

## SaaS Application Example

### Scenario

A SaaS application that needs to:

- Provide different feature sets for different pricing tiers
- Support multiple organizations (tenants)
- Enable beta features for select customers
- Personalize user interfaces

### Implementation

#### 1. Feature Flag Configuration

```typescript
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'advanced-analytics': {
    key: 'advanced-analytics',
    enabled: true,
    description: 'Advanced analytics dashboard',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['enterprise', 'business'],
        property: 'plan',
      },
    ],
  },
  'custom-branding': {
    key: 'custom-branding',
    enabled: true,
    description: 'Custom branding options',
    tenants: ['enterprise-tenant', 'premium-organization'],
  },
  'beta-feature': {
    key: 'beta-feature',
    enabled: true,
    description: 'Beta feature for select customers',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['beta-tester-group'],
        property: 'userGroup',
      },
    ],
  },
};
```

#### 2. Tenant Configuration

```typescript
// src/lib/multi-tenant/hooks.ts
const mockTenants: Record<string, Tenant> = {
  default: {
    id: 'default',
    name: 'Default Organization',
    features: {
      analytics: true,
      customBranding: false,
      apiAccess: true,
      advancedReporting: false,
      integrations: ['basic'],
    },
  },
  'enterprise-tenant': {
    id: 'enterprise-tenant',
    name: 'Enterprise Corp',
    features: {
      analytics: true,
      customBranding: true,
      apiAccess: true,
      advancedReporting: true,
      integrations: ['basic', 'advanced', 'custom'],
    },
  },
};
```

#### 3. Client-Side Dashboard Component

```tsx
// src/components/Dashboard.tsx
'use client';

import { useFeatureFlags } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';

export function Dashboard() {
  const { flags, isLoading } = useFeatureFlags();
  const { tenant } = useTenant();

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome to {tenant?.name || 'Dashboard'}
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Basic Analytics"
          enabled={flags['analytics'] !== false}
        >
          <p>View basic usage statistics</p>
        </DashboardCard>

        {flags['advanced-analytics'] && (
          <DashboardCard
            title="Advanced Analytics"
            enabled={true}
            premium={true}
          >
            <p>Advanced insights and reporting</p>
          </DashboardCard>
        )}

        {flags['custom-branding'] && (
          <DashboardCard title="Custom Branding" enabled={true} premium={true}>
            <p>Customize your organization's appearance</p>
          </DashboardCard>
        )}

        {flags['beta-feature'] && (
          <DashboardCard title="Beta Feature" enabled={true} beta={true}>
            <p>Try our new experimental feature</p>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  enabled: boolean;
  premium?: boolean;
  beta?: boolean;
  children: React.ReactNode;
}

function DashboardCard({
  title,
  enabled,
  premium,
  beta,
  children,
}: DashboardCardProps) {
  if (!enabled) return null;

  return (
    <div
      className={`rounded-lg border p-6 ${premium ? 'border-yellow-300 bg-yellow-50' : beta ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        {premium && (
          <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
            PREMIUM
          </span>
        )}
        {beta && (
          <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
            BETA
          </span>
        )}
      </div>
      <div className="text-gray-600">{children}</div>
      <button className="mt-4 font-medium text-blue-600 hover:text-blue-800">
        Get Started →
      </button>
    </div>
  );
}
```

## Content Management System Example

### Scenario

A CMS that needs to:

- Enable content features for different user roles
- Support multiple sites/brands (tenants)
- Roll out new editing features gradually
- Provide personalized admin experiences

### Implementation

#### 1. Feature Flag Configuration

```typescript
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'drag-drop-editor': {
    key: 'drag-drop-editor',
    enabled: true,
    description: 'Visual drag and drop content editor',
    rolloutPercentage: 50,
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['admin', 'editor'],
        property: 'role',
      },
    ],
  },
  'multi-site-management': {
    key: 'multi-site-management',
    enabled: true,
    description: 'Manage multiple sites from one interface',
    tenants: ['media-company', 'enterprise-client'],
  },
  'ai-content-assistant': {
    key: 'ai-content-assistant',
    enabled: true,
    description: 'AI-powered content suggestions',
    value: {
      maxSuggestions: 5,
      languages: ['en', 'es'],
    },
  },
};
```

#### 2. Server-Side Content API

```typescript
// src/app/api/content/[id]/route.ts
import { getFeatureFlagValue } from '@/lib/feature-flags/hooks';
import { getCurrentTenant } from '@/lib/multi-tenant/hooks';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenant = await getCurrentTenant();
    const aiAssistantConfig = await getFeatureFlagValue(
      'ai-content-assistant',
      {
        maxSuggestions: 3,
        languages: ['en'],
      },
    );

    // Fetch content based on tenant and features
    const content = await fetchContent(params.id, {
      tenantId: tenant?.id,
      aiEnabled: Boolean(aiAssistantConfig),
    });

    return Response.json({
      content,
      features: {
        aiAssistant: aiAssistantConfig,
        multiSite: tenant?.features.advancedReporting,
      },
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

async function fetchContent(
  id: string,
  options: { tenantId?: string; aiEnabled: boolean },
) {
  // Implementation would fetch from database
  // This is a mock implementation
  return {
    id,
    title: 'Sample Content',
    body: 'This is sample content',
    tenantId: options.tenantId,
    aiEnhanced: options.aiEnabled,
  };
}
```

## API Service Example

### Scenario

A backend API service that needs to:

- Enable features based on API consumer
- Support multiple client tenants
- Provide different rate limits
- Offer beta endpoints

### Implementation

#### 1. Feature Flag Configuration

```typescript
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'enhanced-rate-limiting': {
    key: 'enhanced-rate-limiting',
    enabled: true,
    description: 'Higher rate limits for premium clients',
    conditions: [
      {
        type: 'tenant',
        operator: 'in',
        value: ['premium-client', 'enterprise-partner'],
      },
    ],
  },
  'beta-api-endpoints': {
    key: 'beta-api-endpoints',
    enabled: true,
    description: 'Access to beta API endpoints',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['beta-program'],
        property: 'programMembership',
      },
    ],
  },
};
```

#### 2. API Middleware

```typescript
// src/app/api/middleware.ts
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import { getTenantId } from '@/lib/multi-tenant/hooks';
import { NextRequest } from 'next/server';

export async function apiMiddleware(request: NextRequest) {
  // Get tenant and feature context
  const tenantId = await getTenantId();
  const hasEnhancedRateLimit = await getFeatureFlag('enhanced-rate-limiting');

  // Set rate limiting based on features
  const rateLimit = hasEnhancedRateLimit ? 1000 : 100;

  // Add feature context to request
  const response = new Response(null, {
    status: 200,
    headers: {
      'X-Rate-Limit': rateLimit.toString(),
      'X-Tenant-ID': tenantId,
      'X-Features': JSON.stringify({ enhancedRateLimit: hasEnhancedRateLimit }),
    },
  });

  return response;
}
```

## Dashboard Application Example

### Scenario

A dashboard application that needs to:

- Personalize widgets based on user preferences
- Enable features for different user roles
- Support white-labeling for different clients
- Provide progressive feature rollouts

### Implementation

#### 1. Feature Flag Configuration

```typescript
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'customizable-dashboard': {
    key: 'customizable-dashboard',
    enabled: true,
    description: 'Allow users to customize their dashboard layout',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        value: ['admin', 'power-user'],
        property: 'role',
      },
    ],
  },
  'white-label-branding': {
    key: 'white-label-branding',
    enabled: true,
    description: 'Custom branding for white-label clients',
    tenants: ['client-a', 'client-b', 'partner-corporation'],
  },
  'new-widgets': {
    key: 'new-widgets',
    enabled: true,
    description: 'New dashboard widgets',
    rolloutPercentage: 25,
  },
};
```

#### 2. Dashboard Component with Feature Flags

```tsx
// src/components/DashboardLayout.tsx
'use client';

import { useFeatureFlags } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';
import { useState, useEffect } from 'react';

interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType;
  enabled: boolean;
  position: number;
}

export function DashboardLayout() {
  const { flags, isLoading } = useFeatureFlags();
  const { tenant } = useTenant();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    if (!isLoading && flags) {
      const widgetConfig: WidgetConfig[] = [
        {
          id: 'analytics',
          title: 'Analytics Overview',
          component: AnalyticsWidget,
          enabled: true,
          position: 1,
        },
        {
          id: 'recent-activity',
          title: 'Recent Activity',
          component: RecentActivityWidget,
          enabled: true,
          position: 2,
        },
        {
          id: 'customizable',
          title: 'Custom Widget',
          component: CustomizableWidget,
          enabled: flags['customizable-dashboard'] || false,
          position: 3,
        },
        {
          id: 'new-feature',
          title: 'New Feature Widget',
          component: NewFeatureWidget,
          enabled: flags['new-widgets'] || false,
          position: 4,
        },
      ].filter((widget) => widget.enabled);

      setWidgets(widgetConfig);
    }
  }, [flags, isLoading]);

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with tenant branding */}
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {tenant?.name || 'Dashboard'}
          </h1>
          {flags['white-label-branding'] && tenant && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Powered by YourBrand
              </span>
              {tenant.settings.branding.logo && (
                <img
                  src={tenant.settings.branding.logo}
                  alt="Client Logo"
                  className="h-8"
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold">{widget.title}</h2>
                <WidgetComponent />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// Widget components would be implemented separately
function AnalyticsWidget() {
  return <div>Analytics content here</div>;
}

function RecentActivityWidget() {
  return <div>Recent activity content here</div>;
}

function CustomizableWidget() {
  return <div>Customizable widget content</div>;
}

function NewFeatureWidget() {
  return <div>New feature widget content</div>;
}
```

## Best Practices

### 1. Feature Flag Naming

Use descriptive, consistent naming conventions:

```typescript
// Good
'user-profile-enhancements';
'payment-processing-v2';
'admin-dashboard-redesign';

// Avoid
'feature1';
'newThing';
'fix';
```

### 2. Tenant Configuration

Structure tenant configurations for scalability:

```typescript
interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  features: Record<string, boolean>;
  settings: {
    branding: {
      primaryColor: string;
      logo?: string;
    };
    limits: {
      users: number;
      storage: number;
    };
  };
}
```

### 3. Error Handling

Always handle feature flag errors gracefully:

```typescript
try {
  const featureEnabled = await getFeatureFlag('new-feature');
  // Use feature
} catch (error) {
  console.warn('Feature flag evaluation failed, using default behavior');
  // Fallback to default behavior
}
```

### 4. Performance Considerations

- Cache feature flag evaluations when appropriate
- Use context-aware evaluations to minimize API calls
- Implement proper loading states for client-side flags

These examples demonstrate how to integrate feature flags and multi-tenant support into various types of applications, from simple websites to complex enterprise systems.
