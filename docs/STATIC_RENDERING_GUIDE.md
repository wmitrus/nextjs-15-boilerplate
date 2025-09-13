# Static Rendering Guide

## Overview

This boilerplate now supports true static rendering for marketing pages while maintaining rich features for the application pages. The architecture uses Next.js route groups to separate static and dynamic concerns.

## Architecture

### Route Groups

- `src/app/(static)` - Static marketing pages (no auth/tenant/flags)
- `src/app/(app)` - Dynamic application pages (with auth/tenant/flags)

### Layouts

#### Static Layout (`src/app/(static)/layout.tsx`)

- Minimal providers (only Clerk for optional auth UI)
- No server data fetching
- Enables true static rendering

#### App Layout (`src/app/(app)/layout.tsx`)

- Full-featured providers (Tenant, FeatureFlag)
- Server data fetching with selective caching
- Dynamic rendering for rich features

## Static Rendering

Pages in the `(static)` group are prerendered as static content:

- No server-side data fetching
- No `headers()` usage
- Optimized for performance

Example:

```tsx
// src/app/(static)/page.tsx
export default function StaticHome() {
  return <div>Static content</div>;
}
```

## Dynamic Features

Pages in the `(app)` group use server-side data fetching:

- Tenant context resolution
- User authentication
- Feature flag evaluation
- Selective caching for performance

### Caching Strategy

#### Tenant Context

- Resolved per request using headers
- Cannot be cached due to dynamic headers

#### Feature Flags

- Cached with `unstable_cache`
- 10-minute revalidation
- Tag-based invalidation

#### User Authentication

- Resolved per request using Clerk
- Cannot be cached due to session cookies

## Performance Optimizations

1. **Route Grouping**: Separates static and dynamic concerns
2. **Selective Caching**: Caches feature flags but not tenant/auth data
3. **Static Prerendering**: Marketing pages are fully static
4. **Dynamic Rendering**: App pages rendered on demand

## Trade-offs

| Feature     | Static Pages                   | App Pages                |
| ----------- | ------------------------------ | ------------------------ |
| Rendering   | Static prerendering            | Dynamic server rendering |
| Performance | Highest (no server requests)   | Good (cached data)       |
| Features    | Limited (no auth/tenant/flags) | Full (auth/tenant/flags) |
| Caching     | Full page caching              | Selective data caching   |

## Best Practices

1. **Marketing Pages**: Place in `(static)` group for maximum performance
2. **Application Pages**: Place in `(app)` group for rich features
3. **Data Fetching**: Use server components in app pages for data fetching
4. **Caching**: Cache expensive operations, avoid caching dynamic data
5. **Client Components**: Use for interactive UI elements

## Environment Configuration

To maximize static rendering:

- Set `MULTI_TENANT_ENABLED=false` for simple deployments
- Configure Clerk keys properly for auth features
- Use mock data in test environments
