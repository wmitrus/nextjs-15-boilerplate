# Complete Setup Guide

This guide provides a step-by-step walkthrough from installation to your first feature flag and multi-tenant implementation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Feature Flag Setup](#feature-flag-setup)
- [Multi-Tenant Setup](#multi-tenant-setup)
- [Integration Testing](#integration-testing)
- [First Implementation](#first-implementation)

## Prerequisites

Before starting, ensure you have:

1. Node.js 18+ installed
2. npm, yarn, or pnpm package manager
3. A code editor (VS Code recommended)
4. Basic knowledge of Next.js 15 and React

## Installation

1. Clone or download the boilerplate repository:

```bash
git clone <repository-url>
cd nextjs-15-boilerplate
```

2. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

3. Verify installation by running the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the demo application.

## Environment Configuration

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Configure basic environment variables in `.env.local`:

```bash
# Environment
NODE_ENV="development"
APP_ENV="development"
APP_VERSION="1.0.0"

# Feature Flags
FEATURE_FLAGS_ENABLED="true"
FEATURE_FLAGS_PROVIDER="local"

# Multi-Tenant
MULTI_TENANT_ENABLED="false"
DEFAULT_TENANT_ID="default"

# Public variables (accessible in browser)
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED="true"
NEXT_PUBLIC_MULTI_TENANT_ENABLED="false"
```

## Feature Flag Setup

1. Examine the local feature flag configuration in `src/lib/feature-flags/local-provider.ts`:

```typescript
const LOCAL_FLAGS: Record<string, FeatureFlag> = {
  'new-dashboard': {
    key: 'new-dashboard',
    enabled: true,
    description: 'Enable the new dashboard UI',
    environments: ['development', 'preview'],
  },
  'dark-mode': {
    key: 'dark-mode',
    enabled: false,
    description: 'Enable dark mode theme',
  },
};
```

2. Test feature flags by modifying the configuration and restarting the development server.

## Multi-Tenant Setup

1. Enable multi-tenant support in your environment file:

```bash
# .env.local
MULTI_TENANT_ENABLED="true"
DEFAULT_TENANT_ID="default"
```

2. Examine the tenant configuration in `src/lib/multi-tenant/hooks.ts`:

```typescript
const mockTenants: Record<string, Tenant> = {
  default: {
    id: 'default',
    name: 'Default Tenant',
    // ... tenant configuration
  },
  'preview-tenant': {
    id: 'preview-tenant',
    name: 'Preview Tenant',
    // ... tenant configuration
  },
};
```

## Integration Testing

1. Run the test suite to verify everything is working:

```bash
# Run all tests
npm test

# Run specific feature flag tests
npm test src/lib/feature-flags

# Run specific multi-tenant tests
npm test src/lib/multi-tenant
```

2. All tests should pass without errors.

## First Implementation

### Server-Side Feature Flag Usage

Create a new API route to demonstrate feature flag usage:

```typescript
// src/app/api/demo/route.ts
import { getFeatureFlag } from '@/lib/feature-flags/hooks';
import { getCurrentTenant } from '@/lib/multi-tenant/hooks';

export async function GET() {
  // Check if new dashboard feature is enabled
  const isNewDashboardEnabled = await getFeatureFlag('new-dashboard');

  // Get current tenant information
  const tenant = await getCurrentTenant();

  return Response.json({
    featureEnabled: isNewDashboardEnabled,
    tenant: tenant?.name || 'No tenant',
    timestamp: new Date().toISOString(),
  });
}
```

### Client-Side Feature Flag Usage

Create a component that uses feature flags:

```tsx
// src/components/DemoFeature.tsx
'use client';

import { useFeatureFlag } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';

export function DemoFeature() {
  const { isEnabled: isNewDashboardEnabled } = useFeatureFlag('new-dashboard');
  const { tenant, isMultiTenant } = useTenant();

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-2 text-xl font-bold">Feature Demo</h2>

      {isMultiTenant && (
        <p className="mb-2">Current Tenant: {tenant?.name || 'Unknown'}</p>
      )}

      {isNewDashboardEnabled ? (
        <div className="rounded bg-green-100 p-4">
          <p>New Dashboard Feature is ENABLED!</p>
        </div>
      ) : (
        <div className="rounded bg-red-100 p-4">
          <p>New Dashboard Feature is DISABLED</p>
        </div>
      )}
    </div>
  );
}
```

### Using the Component

Add the component to your page:

```tsx
// src/app/page.tsx
import { DemoFeature } from '@/components/DemoFeature';

export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">
        Welcome to Next.js 15 Boilerplate
      </h1>

      <DemoFeature />

      {/* Other page content */}
    </main>
  );
}
```

## Next Steps

1. [Environment Management](./ENVIRONMENT_MANAGEMENT.md) - Learn about environment configuration
2. [Feature Flag Examples](./FEATURE_FLAG_EXAMPLES.md) - Explore advanced feature flag usage
3. [Features Integration](./FEATURES_INTEGRATION.md) - Understand how all systems work together
4. [Adding New Feature Flag Provider](./ADDING_NEW_FEATURE_FLAG_PROVIDER.md) - Learn how to integrate third-party providers

Congratulations! You've successfully set up and implemented the basic feature flag and multi-tenant system.
