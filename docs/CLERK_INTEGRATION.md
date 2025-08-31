# Clerk Authentication Integration

This document explains how to integrate Clerk authentication with the feature flag and multi-tenant systems in your Next.js 15.5 application.

## Table of Contents

- [Overview](#overview)
- [Clerk Authentication Basics](#clerk-authentication-basics)
- [Integrating Clerk with Feature Flags](#integrating-clerk-with-feature-flags)
- [Integrating Clerk with Multi-Tenant Systems](#integrating-clerk-with-multi-tenant-systems)
- [Combined Integration Examples](#combined-integration-examples)
- [Middleware Integration](#middleware-integration)
- [Testing Strategies with Clerk](#testing-strategies-with-clerk)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

## Overview

Clerk provides a complete user management solution that can be seamlessly integrated with feature flags and multi-tenant systems. This integration allows you to:

- Target feature flags based on user roles, permissions, and subscriptions
- Implement tenant-aware authentication
- Create personalized user experiences based on both authentication state and feature availability
- Enforce security policies based on user authentication and tenant context

## Clerk Authentication Basics

Before integrating with feature flags and multi-tenant systems, let's review the basics of Clerk authentication in Next.js 15.5:

### Installation

```bash
npm install @clerk/nextjs
```

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Middleware Setup

```ts
// src/middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/api/webhook/clerk'],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Client Components

```tsx
// src/components/UserProfile.tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div>
      <h1>Hello, {user.firstName}!</h1>
      <p>Email: {user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### Server Components

```ts
// src/app/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    // Redirect to sign-in or show unauthorized message
    return <div>Please sign in to view this page</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.firstName}!</p>
    </div>
  );
}
```

## Integrating Clerk with Feature Flags

Clerk user information can be used to target feature flags based on user attributes, roles, and subscriptions.

### Creating Feature Flag Context with Clerk User Data

```ts
// src/lib/feature-flags/clerk-context.ts
import { currentUser } from '@clerk/nextjs';
import type { FeatureFlagContext } from './types';

export async function createClerkFeatureFlagContext(): Promise<FeatureFlagContext> {
  const user = await currentUser();

  if (!user) {
    return {
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    };
  }

  // Extract user information for feature flag targeting
  const context: FeatureFlagContext = {
    userId: user.id,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    customProperties: {
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      // Extract roles/permissions from public metadata
      roles: (user.publicMetadata as any)?.roles || [],
      subscription: (user.publicMetadata as any)?.subscription || 'free',
      // Extract tenant information if stored in user metadata
      tenantId: (user.publicMetadata as any)?.tenantId,
    },
  };

  return context;
}
```

### Using Clerk User Data in Feature Flag Evaluation

```ts
// src/lib/feature-flags/clerk-hooks.ts
import { getFeatureFlag, getFeatureFlagValue } from './hooks';
import { createClerkFeatureFlagContext } from './clerk-context';

export async function getClerkFeatureFlag(flagKey: string) {
  const context = await createClerkFeatureFlagContext();
  return getFeatureFlag(flagKey, context);
}

export async function getClerkFeatureFlagValue<T>(
  flagKey: string,
  defaultValue: T,
) {
  const context = await createClerkFeatureFlagContext();
  return getFeatureFlagValue(flagKey, defaultValue, context);
}
```

### Example Feature Flag Configuration with Clerk Attributes

```ts
// src/lib/feature-flags/local-provider.ts
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'admin-dashboard': {
    key: 'admin-dashboard',
    enabled: true,
    description: 'Enable admin dashboard features',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        property: 'roles',
        value: ['admin', 'super_admin'],
      },
    ],
  },
  'premium-feature': {
    key: 'premium-feature',
    enabled: true,
    description: 'Premium feature for paid subscribers',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        property: 'subscription',
        value: ['premium', 'enterprise'],
      },
    ],
  },
  'beta-feature': {
    key: 'beta-feature',
    enabled: true,
    description: 'Beta feature for specific users',
    conditions: [
      {
        type: 'user',
        operator: 'in',
        property: 'email',
        value: ['@company.com', 'beta-tester@example.com'],
      },
    ],
  },
};
```

### Client Component with Clerk and Feature Flags

```tsx
// src/components/PremiumFeature.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useFeatureFlag } from '@/lib/feature-flags';

export function PremiumFeature() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isEnabled: isPremiumFeatureEnabled, isLoading: isFlagLoading } =
    useFeatureFlag('premium-feature');

  if (!isLoaded || isFlagLoading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in to access this feature</div>;
  }

  // Check if user has premium subscription
  const userSubscription = (user.publicMetadata as any)?.subscription || 'free';
  const hasPremiumAccess = ['premium', 'enterprise'].includes(userSubscription);

  if (!isPremiumFeatureEnabled || !hasPremiumAccess) {
    return <div>This feature is not available in your plan</div>;
  }

  return (
    <div>
      <h2>Premium Feature</h2>
      <p>Exclusive content for premium users</p>
    </div>
  );
}
```

## Integrating Clerk with Multi-Tenant Systems

Clerk can be integrated with multi-tenant systems to provide tenant-aware authentication.

### Storing Tenant Information in Clerk User Metadata

```ts
// When creating or updating a user in Clerk, store tenant information
// This would typically be done in your backend or webhook handlers

const user = await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    tenantId: 'tenant-123',
    roles: ['member'],
    subscription: 'premium',
  },
});
```

### Creating Tenant Context with Clerk User Data

```ts
// src/lib/multi-tenant/clerk-context.ts
import { currentUser } from '@clerk/nextjs';
import { getTenantContext } from './hooks';

export async function createClerkTenantContext() {
  const user = await currentUser();

  if (!user) {
    // Return default tenant context for unauthenticated users
    return getTenantContext();
  }

  // Extract tenant ID from user metadata
  const userTenantId = (user.publicMetadata as any)?.tenantId;

  if (userTenantId) {
    // Override tenant context with user's assigned tenant
    const headers = new Headers();
    headers.set('x-tenant-id', userTenantId);

    // In a real implementation, you would also set other tenant headers
    // based on the tenant configuration

    // For this example, we'll simulate the header-based tenant resolution
    // In practice, you might want to fetch the tenant directly
    return getTenantContext(); // This will use the headers we set
  }

  // Fall back to default tenant context
  return getTenantContext();
}
```

### Server Component with Clerk and Multi-Tenant

```ts
// src/app/tenant-dashboard/page.tsx
import { currentUser } from '@clerk/nextjs';
import { getCurrentTenant, isTenantFeatureEnabled } from '@/lib/multi-tenant/hooks';

export default async function TenantDashboardPage() {
  const user = await currentUser();

  if (!user) {
    return <div>Please sign in to view this page</div>;
  }

  // Get tenant based on user's assigned tenant
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return <div>Unable to determine your tenant</div>;
  }

  // Check tenant-specific features
  const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');
  const hasAdvancedReporting = isTenantFeatureEnabled(tenant, 'advancedReporting');

  return (
    <div>
      <h1>{tenant.name} Dashboard</h1>
      <p>Welcome, {user.firstName}!</p>

      {hasCustomBranding && (
        <div className="custom-branding">
          {/* Tenant-specific branding */}
        </div>
      )}

      {hasAdvancedReporting && (
        <div className="advanced-reporting">
          <h2>Advanced Reports</h2>
          {/* Advanced reporting features */}
        </div>
      )}
    </div>
  );
}
```

## Combined Integration Examples

Here are examples showing how to use Clerk authentication with both feature flags and multi-tenant systems together.

### Personalized Dashboard Based on User, Tenant, and Features

```tsx
// src/app/personalized-dashboard/page.tsx
import { currentUser } from '@clerk/nextjs';
import {
  getCurrentTenant,
  isTenantFeatureEnabled,
} from '@/lib/multi-tenant/hooks';
import { getFeatureFlagValue } from '@/lib/feature-flags/hooks';

export default async function PersonalizedDashboardPage() {
  const user = await currentUser();

  if (!user) {
    return <div>Please sign in to view this page</div>;
  }

  // Get tenant information
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return <div>Unable to determine your tenant</div>;
  }

  // Get personalized dashboard configuration
  const dashboardConfig = await getFeatureFlagValue(
    'dashboard-config',
    {
      theme: 'light',
      layout: 'grid',
      widgets: ['recent-activity', 'stats'],
    },
    {
      userId: user.id,
      tenantId: tenant.id,
      customProperties: {
        subscription: (user.publicMetadata as any)?.subscription || 'free',
        roles: (user.publicMetadata as any)?.roles || [],
      },
    },
  );

  // Check tenant-specific features
  const hasCustomBranding = isTenantFeatureEnabled(tenant, 'customBranding');
  const hasAdvancedAnalytics = isTenantFeatureEnabled(
    tenant,
    'advancedReporting',
  );

  return (
    <div className={`dashboard theme-${dashboardConfig.theme}`}>
      <header>
        <h1>{tenant.name} Dashboard</h1>
        <p>Welcome, {user.firstName}!</p>
        {hasCustomBranding && (
          <div className="tenant-logo">{/* Custom tenant branding */}</div>
        )}
      </header>

      <main className={`layout-${dashboardConfig.layout}`}>
        {dashboardConfig.widgets.includes('recent-activity') && (
          <section className="widget recent-activity">
            <h2>Recent Activity</h2>
            {/* Recent activity widget */}
          </section>
        )}

        {dashboardConfig.widgets.includes('stats') && (
          <section className="widget stats">
            <h2>Statistics</h2>
            {/* Stats widget */}
            {hasAdvancedAnalytics && (
              <div className="advanced-analytics">
                {/* Advanced analytics features */}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
```

### API Route with Clerk, Feature Flags, and Multi-Tenant

```ts
// src/app/api/user-data/route.ts
import { auth } from '@clerk/nextjs';
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import {
  getCurrentTenant,
  isTenantFeatureEnabled,
} from '@/lib/multi-tenant/hooks';

export async function GET() {
  // Authenticate user with Clerk
  const { userId } = auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    // Get tenant context
    const tenant = await getCurrentTenant();

    if (!tenant) {
      return new Response(
        JSON.stringify({ error: 'Unable to determine tenant' }),
        { status: 400 },
      );
    }

    // Check if user has access to enhanced data based on feature flags
    const hasEnhancedDataAccess = await getFeatureFlag('enhanced-user-data', {
      userId,
      tenantId: tenant.id,
      customProperties: {
        // You could pass additional user metadata here
      },
    });

    // Check tenant-specific data access
    const hasAdvancedDataAccess = isTenantFeatureEnabled(
      tenant,
      'advancedDataAccess',
    );

    // Prepare response based on user, tenant, and feature flags
    const responseData = {
      userId,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      features: {
        enhancedData: hasEnhancedDataAccess,
        advancedData: hasAdvancedDataAccess,
      },
      // Include data based on access levels
      basicData: await getBasicUserData(userId),
      enhancedData: hasEnhancedDataAccess
        ? await getEnhancedUserData(userId)
        : null,
      advancedData: hasAdvancedDataAccess
        ? await getAdvancedUserData(tenant.id)
        : null,
    };

    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

async function getBasicUserData(userId: string) {
  // Implementation for basic user data
  return { id: userId, name: 'User Name' };
}

async function getEnhancedUserData(userId: string) {
  // Implementation for enhanced user data
  return { preferences: {}, recentActivity: [] };
}

async function getAdvancedUserData(tenantId: string) {
  // Implementation for tenant-level advanced data
  return { analytics: {}, reports: [] };
}
```

## Middleware Integration

Integrate Clerk authentication with feature flags and multi-tenant middleware:

```ts
// src/middleware.ts
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default authMiddleware({
  publicRoutes: ['/', '/api/webhook/clerk'],

  async afterAuth(auth, req) {
    // Handle unauthenticated requests to protected routes
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // For authenticated requests, add user context to headers
    if (auth.userId) {
      const res = NextResponse.next();

      // Add user ID to headers for downstream consumption
      res.headers.set('x-user-id', auth.userId);

      // If you store tenant information in Clerk user metadata,
      // you can add it to headers here
      if (auth.sessionClaims?.metadata?.tenantId) {
        res.headers.set('x-tenant-id', auth.sessionClaims.metadata.tenantId);
      }

      return res;
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Testing Strategies with Clerk

When testing with Clerk integration, you need to mock Clerk's authentication in your tests.

### Component Testing with Clerk Mocks

```tsx
// src/components/Dashboard.test.tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      publicMetadata: {
        roles: ['admin'],
        subscription: 'premium',
        tenantId: 'tenant_456',
      },
    },
  }),
}));

// Mock feature flags
jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: () => ({
    isEnabled: true,
    isLoading: false,
  }),
  useFeatureFlags: () => ({
    flags: {
      'new-dashboard': true,
      'premium-feature': true,
    },
    isLoading: false,
  }),
}));

// Mock multi-tenant
jest.mock('@/lib/multi-tenant', () => ({
  useTenant: () => ({
    tenant: {
      id: 'tenant_456',
      name: 'Test Tenant',
      features: {
        customBranding: true,
        advancedReporting: true,
      },
    },
    isMultiTenant: true,
    tenantId: 'tenant_456',
  }),
}));

import { Dashboard } from './Dashboard';

describe('Dashboard with Clerk Integration', () => {
  it('renders correctly for authenticated admin user with premium subscription', () => {
    render(<Dashboard />);

    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    expect(screen.getByText('Test Tenant Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Premium Feature')).toBeInTheDocument();
  });
});
```

### Server-Side Testing with Clerk Mocks

```ts
// src/app/dashboard/page.test.tsx
import { currentUser } from '@clerk/nextjs';

// Mock Clerk currentUser function
jest.mock('@clerk/nextjs', () => ({
  currentUser: jest.fn(),
}));

// Mock feature flags
jest.mock('@/lib/feature-flags/hooks', () => ({
  getFeatureFlag: jest.fn(),
  getFeatureFlagValue: jest.fn(),
}));

// Mock multi-tenant
jest.mock('@/lib/multi-tenant/hooks', () => ({
  getCurrentTenant: jest.fn(),
  isTenantFeatureEnabled: jest.fn(),
}));

import DashboardPage from './page';

describe('DashboardPage with Clerk Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard for premium user with tenant features', async () => {
    // Mock Clerk user
    (currentUser as jest.Mock).mockResolvedValue({
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
      publicMetadata: {
        roles: ['user'],
        subscription: 'premium',
        tenantId: 'tenant_456',
      },
    });

    // Mock tenant
    const mockTenant = {
      id: 'tenant_456',
      name: 'Premium Tenant',
      features: {
        customBranding: true,
        advancedReporting: true,
      },
    };

    (
      require('@/lib/multi-tenant/hooks').getCurrentTenant as jest.Mock
    ).mockResolvedValue(mockTenant);

    (
      require('@/lib/multi-tenant/hooks').isTenantFeatureEnabled as jest.Mock
    ).mockImplementation(
      (tenant, feature) => tenant.features[feature] === true,
    );

    // Mock feature flags
    (
      require('@/lib/feature-flags/hooks').getFeatureFlag as jest.Mock
    ).mockResolvedValue(true);

    // Render the page component
    const page = await DashboardPage();

    // Assertions would depend on your actual component implementation
    expect(currentUser).toHaveBeenCalled();
    expect(
      require('@/lib/multi-tenant/hooks').getCurrentTenant,
    ).toHaveBeenCalled();
  });
});
```

### API Route Testing with Clerk

```ts
// src/app/api/user-data/route.test.ts
import { GET } from './route';
import { auth } from '@clerk/nextjs';

// Mock Clerk auth function
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

// Mock feature flags and multi-tenant
jest.mock('@/lib/feature-flags/hooks', () => ({
  getFeatureFlag: jest.fn(),
}));

jest.mock('@/lib/multi-tenant/hooks', () => ({
  getCurrentTenant: jest.fn(),
  isTenantFeatureEnabled: jest.fn(),
}));

describe('User Data API Route with Clerk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user data for authenticated user with premium access', async () => {
    // Mock authenticated user
    (auth as jest.Mock).mockReturnValue({
      userId: 'user_123',
    });

    // Mock tenant
    (
      require('@/lib/multi-tenant/hooks').getCurrentTenant as jest.Mock
    ).mockResolvedValue({
      id: 'tenant_456',
      name: 'Premium Tenant',
      features: {
        advancedDataAccess: true,
      },
    });

    // Mock feature flag
    (
      require('@/lib/feature-flags/hooks').getFeatureFlag as jest.Mock
    ).mockResolvedValue(true);

    // Mock tenant feature check
    (
      require('@/lib/multi-tenant/hooks').isTenantFeatureEnabled as jest.Mock
    ).mockImplementation(
      (tenant, feature) => tenant.features[feature] === true,
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe('user_123');
    expect(data.features.enhancedData).toBe(true);
    expect(data.features.advancedData).toBe(true);
  });

  it('returns 401 for unauthenticated requests', async () => {
    // Mock unauthenticated request
    (auth as jest.Mock).mockReturnValue({
      userId: null,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });
});
```

## Security Considerations

When integrating Clerk with feature flags and multi-tenant systems, consider these security aspects:

### 1. User Metadata Security

```ts
// src/lib/security/clerk-metadata.ts
import { currentUser } from '@clerk/nextjs';

export async function getSecureUserContext() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Only extract safe metadata fields
  const safeMetadata = {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    // Only include explicitly allowed metadata fields
    roles: Array.isArray((user.publicMetadata as any)?.roles)
      ? (user.publicMetadata as any).roles
      : [],
    subscription:
      typeof (user.publicMetadata as any)?.subscription === 'string'
        ? (user.publicMetadata as any).subscription
        : 'free',
    tenantId:
      typeof (user.publicMetadata as any)?.tenantId === 'string'
        ? (user.publicMetadata as any).tenantId
        : undefined,
  };

  return safeMetadata;
}
```

### 2. Session Validation

```ts
// src/lib/security/session-validation.ts
import { auth } from '@clerk/nextjs';
import { getTenantId } from '@/lib/multi-tenant/hooks';

export async function validateUserSession() {
  const { userId, sessionId, sessionClaims } = auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Validate session claims
  if (!sessionClaims || sessionClaims.exp < Date.now() / 1000) {
    throw new Error('Session expired');
  }

  // Validate tenant assignment
  const tenantId = await getTenantId();
  const userTenantId = (sessionClaims.metadata as any)?.tenantId;

  if (userTenantId && userTenantId !== tenantId) {
    throw new Error('Tenant mismatch');
  }

  return {
    userId,
    sessionId,
    tenantId: userTenantId || tenantId,
  };
}
```

### 3. Role-Based Access Control

```ts
// src/lib/security/rbac.ts
interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

class RBACManager {
  private static roles: Record<string, UserRole> = {
    admin: {
      id: 'admin',
      name: 'Administrator',
      permissions: [
        'manage-users',
        'manage-tenants',
        'access-admin-panel',
        'configure-feature-flags',
      ],
    },
    user: {
      id: 'user',
      name: 'User',
      permissions: ['access-dashboard', 'view-profile'],
    },
  };

  static hasPermission(userRoles: string[], permission: string): boolean {
    return userRoles.some((roleId) => {
      const role = this.roles[roleId];
      return role && role.permissions.includes(permission);
    });
  }

  static hasRole(userRoles: string[], requiredRole: string): boolean {
    return userRoles.includes(requiredRole);
  }
}

// Usage in API routes
export async function protectedApiRoute(req: Request) {
  try {
    const { userId, sessionId, sessionClaims } = auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Extract user roles from Clerk metadata
    const userRoles = Array.isArray((sessionClaims?.metadata as any)?.roles)
      ? (sessionClaims?.metadata as any).roles
      : [];

    // Check if user has required permission
    if (!RBACManager.hasPermission(userRoles, 'access-admin-panel')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      });
    }

    // Proceed with route logic
    return handleRoute(req);
  } catch (error) {
    console.error('Authorization error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
```

## Best Practices

### 1. Consistent User Context Creation

```ts
// src/lib/context/unified-context.ts
import { currentUser } from '@clerk/nextjs';
import { getTenantContext } from '@/lib/multi-tenant/hooks';
import type { FeatureFlagContext } from '@/lib/feature-flags/types';

export async function createUnifiedContext(): Promise<{
  user: any;
  tenant: any;
  featureFlagContext: FeatureFlagContext;
}> {
  // Get Clerk user
  const user = await currentUser();

  // Get tenant context
  const tenantContext = await getTenantContext();

  // Create unified context for feature flags
  const featureFlagContext: FeatureFlagContext = {
    userId: user?.id,
    tenantId: tenantContext.tenantId,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    customProperties: user
      ? {
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: (user.publicMetadata as any)?.roles || [],
          subscription: (user.publicMetadata as any)?.subscription || 'free',
        }
      : undefined,
  };

  return {
    user,
    tenant: tenantContext.tenant,
    featureFlagContext,
  };
}
```

### 2. Error Handling

```ts
// src/lib/errors/clerk-errors.ts
export class ClerkIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ClerkIntegrationError';
  }
}

export function handleClerkError(error: any): never {
  if (error.code === 'authentication_required') {
    throw new ClerkIntegrationError(
      'Authentication required',
      'AUTH_REQUIRED',
      401,
    );
  }

  if (error.code === 'forbidden') {
    throw new ClerkIntegrationError('Access forbidden', 'FORBIDDEN', 403);
  }

  throw new ClerkIntegrationError(
    'Internal server error',
    'INTERNAL_ERROR',
    500,
  );
}
```

### 3. Caching Strategies

```ts
// src/lib/caching/clerk-cache.ts
import { currentUser } from '@clerk/nextjs';

class UserContextCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static ttl = 5 * 60 * 1000; // 5 minutes

  static async getCurrentUserWithCache() {
    const userId = 'current'; // In a real implementation, you'd get the actual user ID
    const cached = this.cache.get(userId);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const user = await currentUser();
    this.cache.set(userId, {
      data: user,
      timestamp: Date.now(),
    });

    return user;
  }

  static invalidateCache() {
    this.cache.clear();
  }
}
```

By following these integration patterns, you can successfully combine Clerk authentication with feature flags and multi-tenant systems to create a powerful, personalized application experience.
