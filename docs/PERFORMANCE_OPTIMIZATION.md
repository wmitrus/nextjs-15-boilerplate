# Performance Optimization Guide

This document provides comprehensive guidance on optimizing the performance of feature flag and multi-tenant systems in your Next.js 15 application.

## Table of Contents

- [Caching Strategies](#caching-strategies)
- [Client-Side Optimization](#client-side-optimization)
- [Server-Side Optimization](#server-side-optimization)
- [Database Performance](#database-performance)
- [Network Optimization](#network-optimization)
- [Memory Management](#memory-management)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Monitoring and Profiling](#monitoring-and-profiling)

## Caching Strategies

### Feature Flag Caching

Implement intelligent caching for feature flag evaluations:

```typescript
// src/lib/feature-flags/cache.ts
interface FeatureFlagCacheEntry {
  value: boolean;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class FeatureFlagCache {
  private cache: Map<string, FeatureFlagCacheEntry> = new Map();
  private defaultTTL: number = 60000; // 1 minute

  set(key: string, value: boolean, ttl?: number): void {
    const entry: FeatureFlagCacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  get(key: string): boolean | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  // Context-aware caching
  getContextKey(flagKey: string, context?: FeatureFlagContext): string {
    if (!context) {
      return flagKey;
    }

    // Create a cache key based on context
    const contextHash = this.hashContext(context);
    return `${flagKey}:${contextHash}`;
  }

  private hashContext(context: FeatureFlagContext): string {
    // Create a hash of the context for caching
    const contextString = JSON.stringify({
      userId: context.userId,
      tenantId: context.tenantId,
      environment: context.environment,
      customProperties: context.customProperties,
    });

    // Simple hash function (use a proper hashing library in production)
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clearAll(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

// Usage with caching
const featureFlagCache = new FeatureFlagCache();

export async function getCachedFeatureFlag(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  // Create cache key
  const cacheKey = featureFlagCache.getContextKey(flagKey, context);

  // Try to get from cache first
  const cachedValue = featureFlagCache.get(cacheKey);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // If not in cache, evaluate the flag
  const value = await getFeatureFlag(flagKey, context);

  // Cache the result with appropriate TTL
  const ttl = context ? 30000 : 60000; // Shorter TTL for context-aware flags
  featureFlagCache.set(cacheKey, value, ttl);

  return value;
}
```

### Multi-Tenant Caching

Implement caching for tenant data:

```typescript
// src/lib/multi-tenant/cache.ts
interface TenantCacheEntry {
  tenant: Tenant | null;
  timestamp: number;
  ttl: number;
}

export class TenantCache {
  private cache: Map<string, TenantCacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  set(tenantId: string, tenant: Tenant | null, ttl?: number): void {
    const entry: TenantCacheEntry = {
      tenant,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(tenantId, entry);
  }

  get(tenantId: string): Tenant | null | undefined {
    const entry = this.cache.get(tenantId);

    if (!entry) {
      return undefined;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(tenantId);
      return undefined;
    }

    return entry.tenant;
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  clearAll(): void {
    this.cache.clear();
  }

  // Background cache cleanup
  startCleanupInterval(interval: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, interval);
  }
}

// Usage
const tenantCache = new TenantCache();
const cleanupInterval = tenantCache.startCleanupInterval();

// In your tenant resolution function
export async function getCachedTenant(
  tenantId: string,
): Promise<Tenant | null> {
  // Try cache first
  const cachedTenant = tenantCache.get(tenantId);
  if (cachedTenant !== undefined) {
    return cachedTenant;
  }

  // Fetch from database or external service
  const tenant = await fetchTenant(tenantId);

  // Cache the result
  tenantCache.set(tenantId, tenant);

  return tenant;
}
```

## Client-Side Optimization

### React Component Optimization

Optimize React components that use feature flags:

```typescript
// src/components/OptimizedFeatureComponent.tsx
'use client';

import { useFeatureFlag } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';
import { memo, useMemo } from 'react';

interface OptimizedFeatureComponentProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Memoized component to prevent unnecessary re-renders
export const OptimizedFeatureComponent = memo(function OptimizedFeatureComponent({
  featureKey,
  children,
  fallback = null,
}: OptimizedFeatureComponentProps) {
  const { isEnabled, isLoading } = useFeatureFlag(featureKey);
  const { tenant } = useTenant();

  // Memoize expensive computations
  const featureContext = useMemo(() => ({
    tenantId: tenant?.id,
    tenantName: tenant?.name,
  }), [tenant?.id, tenant?.name]);

  // Memoize the rendering decision
  const shouldRender = useMemo(() => {
    if (isLoading) return false;
    return isEnabled;
  }, [isLoading, isEnabled]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!shouldRender) {
    return fallback;
  }

  return <>{children}</>;
});

// Usage
function MyPage() {
  return (
    <div>
      <OptimizedFeatureComponent
        featureKey="new-dashboard"
        fallback={<OldDashboard />}
      >
        <NewDashboard />
      </OptimizedFeatureComponent>
    </div>
  );
}
```

### Context Optimization

Optimize React context usage:

```typescript
// src/lib/feature-flags/optimized-context.tsx
'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from 'react';

import type { FeatureFlagContextValue } from './types';

// Split context to reduce re-renders
interface FeatureFlagsContextValue {
  flags: Record<string, boolean>;
  isLoading: boolean;
}

interface FeatureFlagContextValue {
  isEnabled: boolean;
  isLoading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);
const FeatureFlagContexts = new Map<string, React.Context<FeatureFlagContextValue | null>>();

// Provider that batches updates
export function OptimizedFeatureFlagProvider({
  children,
  initialFlags = {},
}: {
  children: React.ReactNode;
  initialFlags?: Record<string, boolean>;
}) {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [isLoading, setIsLoading] = useState(false);

  // Batch flag updates to prevent multiple re-renders
  useEffect(() => {
    let isMounted = true;
    const updateFlags = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      try {
        const fetchedFlags = await getAllFeatureFlags();

        if (isMounted) {
          // Batch update all flags at once
          setFlags(prevFlags => ({
            ...prevFlags,
            ...fetchedFlags,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    updateFlags();

    // Set up periodic refresh
    const interval = setInterval(updateFlags, 60000); // 1 minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    flags,
    isLoading,
  }), [flags, isLoading]);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// Hook for individual feature flags
export function useOptimizedFeatureFlag(flagKey: string) {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error('useOptimizedFeatureFlag must be used within FeatureFlagProvider');
  }

  const { flags, isLoading } = context;

  // Memoize the result
  const result = useMemo(() => ({
    isEnabled: flags[flagKey] ?? false,
    isLoading,
  }), [flags[flagKey], isLoading]);

  return result;
}
```

## Server-Side Optimization

### Request-Level Caching

Implement request-level caching to avoid redundant evaluations:

```typescript
// src/lib/feature-flags/request-cache.ts
import type { FeatureFlagContext } from './types';

interface RequestCacheEntry {
  value: boolean;
  timestamp: number;
}

// AsyncLocalStorage for request-scoped caching
import { AsyncLocalStorage } from 'async_hooks';

const requestCache = new AsyncLocalStorage<Map<string, RequestCacheEntry>>();

export function withRequestCache<T>(fn: () => Promise<T>): Promise<T> {
  return requestCache.run(new Map(), fn);
}

export async function getCachedFeatureFlagForRequest(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  const cache = requestCache.getStore();
  if (!cache) {
    // Fallback to regular evaluation if no request context
    return await getFeatureFlag(flagKey, context);
  }

  // Create cache key
  const cacheKey = context ? `${flagKey}:${JSON.stringify(context)}` : flagKey;

  // Check cache
  const entry = cache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < 1000) {
    // 1 second cache
    return entry.value;
  }

  // Evaluate and cache
  const value = await getFeatureFlag(flagKey, context);
  cache.set(cacheKey, {
    value,
    timestamp: Date.now(),
  });

  return value;
}

// Usage in API routes
export async function GET() {
  return withRequestCache(async () => {
    // Multiple feature flag evaluations will use request-level cache
    const [flag1, flag2, flag3] = await Promise.all([
      getCachedFeatureFlagForRequest('feature-1'),
      getCachedFeatureFlagForRequest('feature-2'),
      getCachedFeatureFlagForRequest('feature-3'),
    ]);

    return Response.json({ flag1, flag2, flag3 });
  });
}
```

### Database Query Optimization

Optimize database queries for tenant and feature data:

```typescript
// src/lib/multi-tenant/db-optimization.ts
import { Pool } from 'pg'; // Example with PostgreSQL

interface TenantQueryOptions {
  includeFeatures?: boolean;
  includeSettings?: boolean;
  cacheResult?: boolean;
}

export class OptimizedTenantRepository {
  private db: Pool;
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(db: Pool) {
    this.db = db;
  }

  async getTenantById(
    tenantId: string,
    options: TenantQueryOptions = {},
  ): Promise<Tenant | null> {
    // Create cache key based on options
    const cacheKey = `tenant:${tenantId}:${JSON.stringify(options)}`;

    // Check cache
    if (options.cacheResult) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        // 5 minutes
        return cached.data;
      }
    }

    // Build optimized query
    let query = 'SELECT id, name, domain, subdomain, created_at, updated_at';
    const params: any[] = [tenantId];

    if (options.includeSettings) {
      query += ', settings';
    }

    if (options.includeFeatures) {
      query += ', features';
    }

    query += ' FROM tenants WHERE id = $1';

    try {
      const result = await this.db.query(query, params);
      const tenant = result.rows[0] || null;

      // Cache result
      if (options.cacheResult && tenant) {
        this.queryCache.set(cacheKey, {
          data: tenant,
          timestamp: Date.now(),
        });
      }

      return tenant;
    } catch (error) {
      console.error('Database query failed:', error);
      return null;
    }
  }

  // Batch tenant queries
  async getTenantsByIds(tenantIds: string[]): Promise<Tenant[]> {
    if (tenantIds.length === 0) return [];

    // Check cache for individual tenants
    const cachedTenants: Tenant[] = [];
    const missingIds: string[] = [];

    for (const id of tenantIds) {
      const cached = this.queryCache.get(`tenant:${id}`);
      if (cached && Date.now() - cached.timestamp < 300000) {
        cachedTenants.push(cached.data);
      } else {
        missingIds.push(id);
      }
    }

    // Fetch missing tenants
    if (missingIds.length > 0) {
      const query = `
        SELECT id, name, domain, subdomain, created_at, updated_at
        FROM tenants 
        WHERE id = ANY($1)
      `;

      const result = await this.db.query(query, [missingIds]);
      const fetchedTenants = result.rows;

      // Cache fetched tenants
      for (const tenant of fetchedTenants) {
        this.queryCache.set(`tenant:${tenant.id}`, {
          data: tenant,
          timestamp: Date.now(),
        });
      }

      return [...cachedTenants, ...fetchedTenants];
    }

    return cachedTenants;
  }

  // Clean up old cache entries
  cleanupCache(): void {
    const cutoff = Date.now() - 300000; // 5 minutes ago
    for (const [key, entry] of this.queryCache.entries()) {
      if (entry.timestamp < cutoff) {
        this.queryCache.delete(key);
      }
    }
  }
}
```

## Network Optimization

### API Response Optimization

Optimize API responses for feature flag data:

```typescript
// src/app/api/feature-flags/route.ts
import { getFeatureFlagsForUser } from '@/lib/feature-flags/server';
import { getCurrentTenant } from '@/lib/multi-tenant/hooks';

// Implement response compression and caching
export async function GET(request: Request) {
  try {
    // Extract user context from request
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    // Create optimized context
    const context = {
      userId: userId || undefined,
      tenantId: tenantId || undefined,
      environment: process.env.NODE_ENV,
    };

    // Get feature flags with optimizations
    const flags = await getFeatureFlagsForUser(context);

    // Create optimized response
    const response = {
      flags,
      timestamp: Date.now(),
      // Include only necessary metadata
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        // Enable caching
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        ETag: `"${JSON.stringify(flags).length}-${Date.now()}"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch feature flags' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

// Server-side function with optimizations
export async function getFeatureFlagsForUser(
  context?: FeatureFlagContext,
): Promise<Record<string, boolean>> {
  // Use request-level caching
  const flags = await getCachedFeatureFlagForRequest('all-flags', context);

  // Return only enabled flags to reduce payload size
  const enabledFlags: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(flags)) {
    if (value) {
      enabledFlags[key] = value;
    }
  }

  return enabledFlags;
}
```

### Connection Pooling

Optimize database connections:

```typescript
// src/lib/db/connection-pool.ts
import { Pool } from 'pg';

// Configure connection pool for optimal performance
export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 5, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  // Enable query caching
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Monitor pool performance
dbPool.on('connect', (client) => {
  console.log('New database connection established');
});

dbPool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

dbPool.on('remove', (client) => {
  console.log('Database connection removed from pool');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...');
  await dbPool.end();
  process.exit(0);
});
```

## Memory Management

### Efficient Data Structures

Use memory-efficient data structures:

```typescript
// src/lib/feature-flags/memory-optimization.ts
// Use efficient data structures for large datasets

// Instead of storing full objects, use compact representations
interface CompactFeatureFlag {
  k: string; // key
  e: boolean; // enabled
  v?: any; // value
  c?: CompactCondition[]; // conditions
}

interface CompactCondition {
  t: 'user' | 'tenant' | 'environment'; // type
  o: 'in' | 'equals' | 'contains'; // operator
  p?: string; // property
  val: string | string[]; // value
}

// Use WeakMap for caching when possible
const featureFlagWeakMap = new WeakMap<object, boolean>();

// Implement object pooling for frequently created objects
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Example usage for context objects
const contextPool = new ObjectPool<FeatureFlagContext>(
  () => ({ environment: 'development' }),
  (context) => {
    context.userId = undefined;
    context.tenantId = undefined;
    context.customProperties = undefined;
  },
);
```

### Garbage Collection Optimization

Implement strategies to reduce garbage collection pressure:

```typescript
// src/lib/feature-flags/gc-optimization.ts
// Reuse objects instead of creating new ones
const reusableContext: FeatureFlagContext = {
  environment: 'development',
};

export function createOptimizedContext(
  userId?: string,
  tenantId?: string,
  environment?: string,
): FeatureFlagContext {
  // Reuse the same object and just update properties
  reusableContext.userId = userId;
  reusableContext.tenantId = tenantId;
  reusableContext.environment = environment || 'development';
  reusableContext.customProperties = undefined;

  return reusableContext;
}

// Use string interning for frequently used strings
const stringInternPool = new Map<string, string>();

export function internString(str: string): string {
  if (stringInternPool.has(str)) {
    return stringInternPool.get(str)!;
  }

  stringInternPool.set(str, str);
  return str;
}

// Clear intern pool periodically to prevent memory leaks
setInterval(() => {
  if (stringInternPool.size > 1000) {
    stringInternPool.clear();
  }
}, 300000); // 5 minutes
```

## Bundle Size Optimization

### Code Splitting

Optimize bundle size with code splitting:

```typescript
// src/lib/feature-flags/dynamic-imports.ts
// Dynamically import heavy feature flag providers
let launchDarklyProvider: any = null;
let growthBookProvider: any = null;

export async function getLaunchDarklyProvider() {
  if (!launchDarklyProvider) {
    const module = await import('./launchdarkly-provider');
    launchDarklyProvider = new module.LaunchDarklyFeatureFlagProvider();
  }
  return launchDarklyProvider;
}

export async function getGrowthBookProvider() {
  if (!growthBookProvider) {
    const module = await import('./growthbook-provider');
    growthBookProvider = new module.GrowthBookFeatureFlagProvider();
  }
  return growthBookProvider;
}

// Use dynamic imports in the provider factory
export async function createFeatureFlagProvider(
  type?: FeatureFlagProviderType,
): Promise<FeatureFlagProvider> {
  const providerType = type || env.FEATURE_FLAGS_PROVIDER;

  switch (providerType) {
    case 'local':
      return new LocalFeatureFlagProvider();

    case 'launchdarkly':
      return await getLaunchDarklyProvider();

    case 'growthbook':
      return await getGrowthBookProvider();

    case 'vercel':
      // Lazy load Vercel provider
      const { VercelEdgeConfigProvider } = await import('./vercel-provider');
      return new VercelEdgeConfigProvider();

    default:
      return new LocalFeatureFlagProvider();
  }
}
```

### Tree Shaking

Ensure proper tree shaking:

```typescript
// src/lib/feature-flags/index.ts
// Export only what's needed
export {
  getFeatureFlag,
  getFeatureFlagValue,
  getAllFeatureFlags,
} from './hooks';
export { useFeatureFlag, useFeatureFlags } from './context';
export type { FeatureFlag, FeatureFlagContext, FeatureFlagKey } from './types';

// Avoid default exports that might include unused code
// Instead of:
// export { default as FeatureFlagProvider } from './provider';

// Use named exports:
export { createFeatureFlagProvider } from './provider';
```

## Monitoring and Profiling

### Performance Monitoring

Implement performance monitoring:

```typescript
// src/lib/feature-flags/monitoring.ts
interface PerformanceMetrics {
  evaluationTime: number;
  cacheHitRate: number;
  errorRate: number;
  averageResponseTime: number;
}

class FeatureFlagPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    evaluationTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    averageResponseTime: 0,
  };

  private totalEvaluations = 0;
  private cacheHits = 0;
  private errors = 0;
  private totalResponseTime = 0;

  startEvaluation(): number {
    return performance.now();
  }

  endEvaluation(startTime: number, cacheHit: boolean, error: boolean): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.totalEvaluations++;
    this.totalResponseTime += duration;

    if (cacheHit) {
      this.cacheHits++;
    }

    if (error) {
      this.errors++;
    }

    // Update metrics
    this.metrics.evaluationTime = duration;
    this.metrics.cacheHitRate = this.cacheHits / this.totalEvaluations;
    this.metrics.errorRate = this.errors / this.totalEvaluations;
    this.metrics.averageResponseTime =
      this.totalResponseTime / this.totalEvaluations;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logMetrics(): void {
    console.log('Feature Flag Performance Metrics:', this.metrics);

    // Alert if performance degrades
    if (this.metrics.averageResponseTime > 100) {
      console.warn(
        'Feature flag evaluation time is high:',
        this.metrics.averageResponseTime,
      );
    }

    if (this.metrics.errorRate > 0.01) {
      console.warn('Feature flag error rate is high:', this.metrics.errorRate);
    }
  }
}

export const performanceMonitor = new FeatureFlagPerformanceMonitor();

// Usage in feature flag evaluation
export async function monitoredGetFeatureFlag(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  const startTime = performanceMonitor.startEvaluation();
  let cacheHit = false;
  let error = false;

  try {
    // Check cache first
    const cacheKey = featureFlagCache.getContextKey(flagKey, context);
    const cachedValue = featureFlagCache.get(cacheKey);

    if (cachedValue !== null) {
      cacheHit = true;
      performanceMonitor.endEvaluation(startTime, cacheHit, error);
      return cachedValue;
    }

    // Evaluate flag
    const value = await getFeatureFlag(flagKey, context);

    // Cache result
    const ttl = context ? 30000 : 60000;
    featureFlagCache.set(cacheKey, value, ttl);

    performanceMonitor.endEvaluation(startTime, cacheHit, error);
    return value;
  } catch (err) {
    error = true;
    performanceMonitor.endEvaluation(startTime, cacheHit, error);
    throw err;
  }
}
```

### Profiling Tools

Use profiling tools to identify bottlenecks:

```typescript
// src/lib/feature-flags/profiling.ts
// Integration with profiling tools
declare global {
  var __FEATURE_FLAG_PROFILE__: boolean | undefined;
}

// Enable profiling in development
const isProfilingEnabled =
  process.env.NODE_ENV === 'development' || global.__FEATURE_FLAG_PROFILE__;

export function profileFeatureFlagEvaluation<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isProfilingEnabled) {
    return fn();
  }

  // Use console.time for simple profiling
  console.time(`FeatureFlag:${name}`);

  return fn().finally(() => {
    console.timeEnd(`FeatureFlag:${name}`);
  });
}

// Usage
export async function getFeatureFlagWithProfiling(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  return profileFeatureFlagEvaluation(`getFeatureFlag:${flagKey}`, () =>
    getFeatureFlag(flagKey, context),
  );
}
```

## Best Practices Summary

### 1. Caching Strategy

- Use appropriate TTL values based on data volatility
- Implement multi-level caching (request-level, application-level, external)
- Cache context-aware evaluations separately from global evaluations

### 2. Memory Management

- Reuse objects instead of creating new ones
- Implement object pooling for frequently used objects
- Use WeakMap for caching when objects can be garbage collected

### 3. Network Optimization

- Enable HTTP caching with proper headers
- Compress API responses
- Batch requests when possible
- Use connection pooling for database connections

### 4. Code Optimization

- Use code splitting for heavy dependencies
- Enable tree shaking to eliminate unused code
- Memoize expensive computations
- Optimize React components to prevent unnecessary re-renders

### 5. Monitoring

- Track performance metrics continuously
- Set up alerts for performance degradation
- Profile code in development to identify bottlenecks
- Monitor error rates and cache hit rates

By implementing these optimization strategies, you can significantly improve the performance of your feature flag and multi-tenant systems while maintaining their functionality and reliability.
