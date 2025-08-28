# Advanced Integration Patterns

This document covers sophisticated integration patterns for combining feature flags, multi-tenant support, and environment management in complex applications.

## Table of Contents

- [Dynamic Configuration Patterns](#dynamic-configuration-patterns)
- [Cross-Feature Dependencies](#cross-feature-dependencies)
- [Tenant-Aware Feature Rollouts](#tenant-aware-feature-rollouts)
- [Contextual Feature Evaluation](#contextual-feature-evaluation)
- [A/B Testing Integration](#ab-testing-integration)
- [Progressive Enhancement](#progressive-enhancement)
- [Feature Flag Analytics](#feature-flag-analytics)
- [Hybrid Provider Strategies](#hybrid-provider-strategies)

## Dynamic Configuration Patterns

### Runtime Configuration Updates

Implement dynamic configuration that can be updated without restarting the application:

```typescript
// src/lib/feature-flags/dynamic-provider.ts
import type { FeatureFlagProvider, FeatureFlag } from './types';

export class DynamicFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Record<string, FeatureFlag> = {};
  private lastUpdate: number = 0;
  private updateInterval: number = 60000; // 1 minute

  async initialize(): Promise<void> {
    await this.refresh();
    // Set up periodic refresh
    setInterval(() => this.refresh(), this.updateInterval);
  }

  async isEnabled(
    flagKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    // Check if we need to refresh
    if (Date.now() - this.lastUpdate > this.updateInterval) {
      await this.refresh();
    }

    const flag = this.flags[flagKey];
    if (!flag) return false;

    return this.evaluateFlag(flag, context);
  }

  async refresh(): Promise<void> {
    try {
      // Fetch updated configuration from external source
      const response = await fetch('/api/feature-flags/config');
      const config = await response.json();

      this.flags = config.flags;
      this.lastUpdate = Date.now();

      console.log('Feature flags refreshed');
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
    }
  }

  private evaluateFlag(
    flag: FeatureFlag,
    context?: FeatureFlagContext,
  ): boolean {
    // Implement complex evaluation logic
    if (!flag.enabled) return false;

    // Check environment restrictions
    if (flag.environments && context?.environment) {
      if (!flag.environments.includes(context.environment)) {
        return false;
      }
    }

    // Check tenant restrictions
    if (flag.tenants && context?.tenantId) {
      if (!flag.tenants.includes(context.tenantId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage) {
      const hash = this.hashString(
        `${flag.key}-${context?.userId || 'anonymous'}`,
      );
      if (hash > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check custom conditions
    if (flag.conditions && context) {
      return this.evaluateConditions(flag.conditions, context);
    }

    return true;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 100);
  }

  private evaluateConditions(
    conditions: FeatureFlagCondition[],
    context: FeatureFlagContext,
  ): boolean {
    return conditions.every((condition) => {
      switch (condition.type) {
        case 'user':
          return this.evaluateUserCondition(condition, context);
        case 'tenant':
          return this.evaluateTenantCondition(condition, context);
        case 'environment':
          return this.evaluateEnvironmentCondition(condition, context);
        default:
          return false;
      }
    });
  }

  private evaluateUserCondition(
    condition: FeatureFlagCondition,
    context: FeatureFlagContext,
  ): boolean {
    if (!context.userId) return false;

    const userValue = condition.property
      ? context.customProperties?.[condition.property]
      : context.userId;

    switch (condition.operator) {
      case 'in':
        return (
          Array.isArray(condition.value) && condition.value.includes(userValue)
        );
      case 'equals':
        return userValue === condition.value;
      case 'contains':
        return (
          typeof userValue === 'string' &&
          typeof condition.value === 'string' &&
          userValue.includes(condition.value)
        );
      default:
        return false;
    }
  }

  private evaluateTenantCondition(
    condition: FeatureFlagCondition,
    context: FeatureFlagContext,
  ): boolean {
    if (!context.tenantId) return false;

    switch (condition.operator) {
      case 'in':
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(context.tenantId)
        );
      case 'equals':
        return context.tenantId === condition.value;
      default:
        return false;
    }
  }

  private evaluateEnvironmentCondition(
    condition: FeatureFlagCondition,
    context: FeatureFlagContext,
  ): boolean {
    if (!context.environment) return false;

    switch (condition.operator) {
      case 'in':
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(context.environment)
        );
      case 'equals':
        return context.environment === condition.value;
      default:
        return false;
    }
  }
}
```

### Configuration Merge Strategy

Implement a strategy for merging configuration from multiple sources:

```typescript
// src/lib/feature-flags/config-merger.ts
interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  priority: number;
  source: string;
}

export class FeatureFlagConfigMerger {
  private configs: FeatureFlagConfig[] = [];

  addConfig(config: FeatureFlagConfig): void {
    this.configs.push(config);
    // Sort by priority (higher priority first)
    this.configs.sort((a, b) => b.priority - a.priority);
  }

  getMergedFlags(): Record<string, FeatureFlag> {
    const mergedFlags: Record<string, FeatureFlag> = {};

    // Process configs in priority order
    for (const config of this.configs) {
      for (const [key, flag] of Object.entries(config.flags)) {
        // Higher priority configs override lower priority ones
        if (
          !mergedFlags[key] ||
          config.priority >= (mergedFlags[key]._priority || 0)
        ) {
          mergedFlags[key] = {
            ...flag,
            _priority: config.priority,
            _source: config.source,
          };
        }
      }
    }

    // Remove internal properties
    for (const flag of Object.values(mergedFlags)) {
      delete (flag as any)._priority;
      delete (flag as any)._source;
    }

    return mergedFlags;
  }
}

// Usage example
const merger = new FeatureFlagConfigMerger();

// Default configuration (lowest priority)
merger.addConfig({
  flags: {
    'default-feature': {
      key: 'default-feature',
      enabled: true,
      description: 'Default feature enabled for all users',
    },
  },
  priority: 1,
  source: 'default-config',
});

// Tenant-specific configuration (medium priority)
merger.addConfig({
  flags: {
    'tenant-feature': {
      key: 'tenant-feature',
      enabled: true,
      description: 'Feature enabled for specific tenants',
      tenants: ['premium-tenant', 'enterprise-tenant'],
    },
  },
  priority: 2,
  source: 'tenant-config',
});

// User-specific configuration (highest priority)
merger.addConfig({
  flags: {
    'beta-feature': {
      key: 'beta-feature',
      enabled: true,
      description: 'Beta feature for specific users',
      conditions: [
        {
          type: 'user',
          operator: 'in',
          value: ['beta-tester'],
          property: 'userGroup',
        },
      ],
    },
  },
  priority: 3,
  source: 'user-config',
});

const finalFlags = merger.getMergedFlags();
```

## Cross-Feature Dependencies

### Feature Dependency Management

Implement a system for managing dependencies between features:

```typescript
// src/lib/feature-flags/dependency-manager.ts
interface FeatureDependency {
  feature: string;
  required: boolean;
  version?: string;
}

interface FeatureWithDependencies extends FeatureFlag {
  dependencies?: FeatureDependency[];
}

export class FeatureDependencyManager {
  private features: Record<string, FeatureWithDependencies> = {};

  registerFeature(feature: FeatureWithDependencies): void {
    this.features[feature.key] = feature;
  }

  async checkDependencies(
    featureKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    const feature = this.features[featureKey];
    if (!feature || !feature.dependencies) {
      return true; // No dependencies to check
    }

    // Check all dependencies
    for (const dependency of feature.dependencies) {
      const isDependencyEnabled = await this.isFeatureEnabled(
        dependency.feature,
        context,
      );

      if (dependency.required && !isDependencyEnabled) {
        console.warn(
          `Feature ${featureKey} requires ${dependency.feature} but it's disabled`,
        );
        return false;
      }
    }

    return true;
  }

  private async isFeatureEnabled(
    featureKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    // This would integrate with your existing feature flag system
    // For example:
    // return await getFeatureFlag(featureKey, context);
    return true; // Placeholder
  }

  getDependentFeatures(featureKey: string): string[] {
    const dependents: string[] = [];

    for (const [key, feature] of Object.entries(this.features)) {
      if (feature.dependencies?.some((dep) => dep.feature === featureKey)) {
        dependents.push(key);
      }
    }

    return dependents;
  }
}

// Usage example
const dependencyManager = new FeatureDependencyManager();

// Register features with dependencies
dependencyManager.registerFeature({
  key: 'advanced-analytics',
  enabled: true,
  description: 'Advanced analytics dashboard',
  dependencies: [
    { feature: 'basic-analytics', required: true },
    { feature: 'user-authentication', required: true },
  ],
});

dependencyManager.registerFeature({
  key: 'ai-recommendations',
  enabled: true,
  description: 'AI-powered recommendations',
  dependencies: [
    { feature: 'advanced-analytics', required: true },
    { feature: 'machine-learning-service', required: false },
  ],
});
```

## Tenant-Aware Feature Rollouts

### Gradual Tenant Rollout Strategy

Implement a strategy for rolling out features to tenants gradually:

```typescript
// src/lib/feature-flags/tenant-rollout.ts
interface TenantRolloutConfig {
  featureKey: string;
  rolloutPercentage: number;
  tenantSegments?: string[];
  startDate?: Date;
  endDate?: Date;
}

export class TenantRolloutManager {
  private rollouts: Record<string, TenantRolloutConfig> = {};

  configureRollout(config: TenantRolloutConfig): void {
    this.rollouts[config.featureKey] = config;
  }

  async isFeatureEnabledForTenant(
    featureKey: string,
    tenantId: string,
    tenantSegment?: string,
  ): Promise<boolean> {
    const rollout = this.rollouts[featureKey];
    if (!rollout) {
      // No specific rollout config, use default feature flag logic
      return await getFeatureFlag(featureKey);
    }

    // Check if rollout is active
    const now = new Date();
    if (rollout.startDate && now < rollout.startDate) {
      return false;
    }
    if (rollout.endDate && now > rollout.endDate) {
      return false;
    }

    // Check tenant segment restrictions
    if (rollout.tenantSegments && tenantSegment) {
      if (!rollout.tenantSegments.includes(tenantSegment)) {
        return false;
      }
    }

    // Check rollout percentage
    const tenantHash = this.hashString(tenantId);
    return tenantHash <= rollout.rolloutPercentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }

  getRolloutStatus(featureKey: string): {
    percentage: number;
    active: boolean;
    segments: string[];
  } {
    const rollout = this.rollouts[featureKey];
    if (!rollout) {
      return { percentage: 0, active: false, segments: [] };
    }

    const now = new Date();
    const active =
      (!rollout.startDate || now >= rollout.startDate) &&
      (!rollout.endDate || now <= rollout.endDate);

    return {
      percentage: rollout.rolloutPercentage,
      active,
      segments: rollout.tenantSegments || [],
    };
  }
}

// Usage example
const rolloutManager = new TenantRolloutManager();

// Configure a gradual rollout
rolloutManager.configureRollout({
  featureKey: 'new-dashboard',
  rolloutPercentage: 25, // 25% of tenants
  tenantSegments: ['premium', 'enterprise'],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

// Check if feature is enabled for a specific tenant
const isFeatureEnabled = await rolloutManager.isFeatureEnabledForTenant(
  'new-dashboard',
  'tenant-123',
  'premium',
);
```

## Contextual Feature Evaluation

### Advanced Context Builder

Create a sophisticated context builder for complex feature evaluations:

```typescript
// src/lib/feature-flags/context-builder.ts
interface UserContext {
  id: string;
  email: string;
  role: string;
  subscriptionTier: string;
  createdAt: Date;
  lastLogin: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface TenantContext {
  id: string;
  name: string;
  plan: string;
  segment: string;
  createdAt: Date;
  features: Record<string, boolean>;
}

interface RequestContext {
  environment: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: Date;
}

export class FeatureFlagContextBuilder {
  private userContext?: UserContext;
  private tenantContext?: TenantContext;
  private requestContext?: RequestContext;

  setUser(user: UserContext): this {
    this.userContext = user;
    return this;
  }

  setTenant(tenant: TenantContext): this {
    this.tenantContext = tenant;
    return this;
  }

  setRequest(request: RequestContext): this {
    this.requestContext = request;
    return this;
  }

  build(): FeatureFlagContext {
    const context: FeatureFlagContext = {
      environment: this.requestContext?.environment || 'development',
      userAgent:
        this.userContext?.userAgent ||
        this.requestContext?.headers['user-agent'],
      ipAddress:
        this.userContext?.ipAddress ||
        this.requestContext?.headers['x-forwarded-for'],
    };

    // Add user context
    if (this.userContext) {
      context.userId = this.userContext.id;
      context.customProperties = {
        ...context.customProperties,
        userEmail: this.userContext.email,
        userRole: this.userContext.role,
        subscriptionTier: this.userContext.subscriptionTier,
        userCreatedAt: this.userContext.createdAt.toISOString(),
        daysSinceLastLogin: Math.floor(
          (Date.now() - this.userContext.lastLogin.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      };
    }

    // Add tenant context
    if (this.tenantContext) {
      context.tenantId = this.tenantContext.id;
      context.customProperties = {
        ...context.customProperties,
        tenantName: this.tenantContext.name,
        tenantPlan: this.tenantContext.plan,
        tenantSegment: this.tenantContext.segment,
        tenantCreatedAt: this.tenantContext.createdAt.toISOString(),
        tenantFeatures: this.tenantContext.features,
      };
    }

    // Add request context
    if (this.requestContext) {
      context.customProperties = {
        ...context.customProperties,
        requestUrl: this.requestContext.url,
        requestMethod: this.requestContext.method,
        requestHeaders: this.requestContext.headers,
        requestTimestamp: this.requestContext.timestamp.toISOString(),
      };
    }

    return context;
  }

  // Pre-built context templates for common scenarios
  static forAdminUser(
    user: UserContext,
    tenant: TenantContext,
  ): FeatureFlagContext {
    return new FeatureFlagContextBuilder()
      .setUser({
        ...user,
        role: 'admin',
      })
      .setTenant(tenant)
      .setRequest({
        environment: process.env.NODE_ENV || 'development',
        url: typeof window !== 'undefined' ? window.location.href : '',
        method: 'GET',
        headers: {},
        timestamp: new Date(),
      })
      .build();
  }

  static forNewUser(user: UserContext): FeatureFlagContext {
    return new FeatureFlagContextBuilder()
      .setUser({
        ...user,
        subscriptionTier: 'free',
      })
      .setRequest({
        environment: 'production',
        url: typeof window !== 'undefined' ? window.location.href : '',
        method: 'GET',
        headers: {},
        timestamp: new Date(),
      })
      .build();
  }
}

// Usage example
const context = FeatureFlagContextBuilder.forAdminUser(
  {
    id: 'user-123',
    email: 'admin@example.com',
    role: 'admin',
    subscriptionTier: 'enterprise',
    createdAt: new Date('2023-01-01'),
    lastLogin: new Date(),
    ipAddress: '192.168.1.1',
  },
  {
    id: 'tenant-456',
    name: 'Enterprise Corp',
    plan: 'enterprise',
    segment: 'business',
    createdAt: new Date('2023-01-01'),
    features: {
      'custom-branding': true,
      'advanced-analytics': true,
    },
  },
);

const isFeatureEnabled = await getFeatureFlag('admin-feature', context);
```

## A/B Testing Integration

### Feature Flag Based A/B Testing

Integrate A/B testing capabilities with feature flags:

```typescript
// src/lib/feature-flags/ab-testing.ts
interface ExperimentVariant {
  name: string;
  weight: number; // 0-100 percentage
  config?: Record<string, unknown>;
}

interface Experiment {
  id: string;
  name: string;
  featureKey: string;
  variants: ExperimentVariant[];
  startDate: Date;
  endDate?: Date;
  targeting?: FeatureFlagCondition[];
}

export class ABTestingManager {
  private experiments: Record<string, Experiment> = {};

  createExperiment(experiment: Experiment): void {
    this.experiments[experiment.id] = experiment;
  }

  async getVariantForUser(
    experimentId: string,
    userId: string,
    context?: FeatureFlagContext,
  ): Promise<string | null> {
    const experiment = this.experiments[experimentId];
    if (!experiment) {
      return null;
    }

    // Check if experiment is active
    const now = new Date();
    if (now < experiment.startDate) {
      return null;
    }
    if (experiment.endDate && now > experiment.endDate) {
      return null;
    }

    // Check targeting conditions
    if (experiment.targeting && context) {
      const targetingMet = experiment.targeting.every((condition) => {
        // Simplified condition checking
        return true; // Implement actual condition logic
      });

      if (!targetingMet) {
        return null;
      }
    }

    // Assign variant based on user hash
    const userHash = this.hashString(`${experimentId}-${userId}`);
    let cumulativeWeight = 0;

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (userHash <= cumulativeWeight) {
        return variant.name;
      }
    }

    return experiment.variants[0]?.name || null;
  }

  async getFeatureConfig<T>(
    experimentId: string,
    userId: string,
    defaultConfig: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    const variantName = await this.getVariantForUser(
      experimentId,
      userId,
      context,
    );
    if (!variantName) {
      return defaultConfig;
    }

    const experiment = this.experiments[experimentId];
    const variant = experiment.variants.find((v) => v.name === variantName);

    return variant?.config ? (variant.config as T) : defaultConfig;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }

  getExperimentStatus(experimentId: string): {
    active: boolean;
    startDate: Date;
    endDate?: Date;
    variants: string[];
  } {
    const experiment = this.experiments[experimentId];
    if (!experiment) {
      return { active: false, startDate: new Date(), variants: [] };
    }

    const now = new Date();
    const active =
      now >= experiment.startDate &&
      (!experiment.endDate || now <= experiment.endDate);

    return {
      active,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      variants: experiment.variants.map((v) => v.name),
    };
  }
}

// Usage example
const abTestingManager = new ABTestingManager();

// Create an A/B test
abTestingManager.createExperiment({
  id: 'new-dashboard-test',
  name: 'New Dashboard UI Test',
  featureKey: 'new-dashboard',
  variants: [
    {
      name: 'control',
      weight: 50,
      config: {
        layout: 'classic',
        theme: 'light',
      },
    },
    {
      name: 'variant-a',
      weight: 25,
      config: {
        layout: 'modern',
        theme: 'light',
      },
    },
    {
      name: 'variant-b',
      weight: 25,
      config: {
        layout: 'modern',
        theme: 'dark',
      },
    },
  ],
  startDate: new Date('2024-01-01'),
  targeting: [
    {
      type: 'user',
      operator: 'in',
      value: ['beta-tester'],
      property: 'userGroup',
    },
  ],
});

// Get variant for user
const variant = await abTestingManager.getVariantForUser(
  'new-dashboard-test',
  'user-123',
);

// Get feature configuration
const dashboardConfig = await abTestingManager.getFeatureConfig(
  'new-dashboard-test',
  'user-123',
  { layout: 'classic', theme: 'light' }, // default config
);
```

## Progressive Enhancement

### Feature Flag Based Progressive Enhancement

Implement progressive enhancement based on feature capabilities:

```typescript
// src/lib/feature-flags/progressive-enhancement.ts
interface EnhancementLevel {
  name: string;
  requiredFeatures: string[];
  optionalFeatures: string[];
  capabilities: string[];
}

export class ProgressiveEnhancementManager {
  private levels: EnhancementLevel[] = [];

  addLevel(level: EnhancementLevel): void {
    this.levels.push(level);
  }

  async getAvailableLevel(
    context?: FeatureFlagContext,
  ): Promise<EnhancementLevel | null> {
    // Check levels from highest to lowest
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const canUseLevel = await this.checkLevelRequirements(level, context);

      if (canUseLevel) {
        return level;
      }
    }

    return null;
  }

  private async checkLevelRequirements(
    level: EnhancementLevel,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    // Check required features
    for (const featureKey of level.requiredFeatures) {
      const isEnabled = await getFeatureFlag(featureKey, context);
      if (!isEnabled) {
        return false;
      }
    }

    // Check capabilities (browser features, etc.)
    for (const capability of level.capabilities) {
      if (!this.checkCapability(capability)) {
        return false;
      }
    }

    return true;
  }

  private checkCapability(capability: string): boolean {
    switch (capability) {
      case 'webgl':
        return typeof WebGLRenderingContext !== 'undefined';
      case 'service-worker':
        return 'serviceWorker' in navigator;
      case 'push-api':
        return 'PushManager' in window;
      case 'camera':
        return (
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === 'function'
        );
      default:
        return true;
    }
  }

  async getEnhancedComponent<T>(
    baseComponent: T,
    enhancedComponents: Record<string, T>,
    context?: FeatureFlagContext,
  ): Promise<T> {
    const level = await this.getAvailableLevel(context);

    if (!level) {
      return baseComponent;
    }

    // Try to find enhanced component for this level
    const levelComponent = enhancedComponents[level.name];
    if (levelComponent) {
      return levelComponent;
    }

    // Check optional features to see if we can use a partial enhancement
    for (const [levelName, component] of Object.entries(enhancedComponents)) {
      const level = this.levels.find((l) => l.name === levelName);
      if (level) {
        const hasOptionalFeatures = await this.checkOptionalFeatures(
          level.optionalFeatures,
          context,
        );

        if (hasOptionalFeatures) {
          return component;
        }
      }
    }

    return baseComponent;
  }

  private async checkOptionalFeatures(
    features: string[],
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    for (const featureKey of features) {
      const isEnabled = await getFeatureFlag(featureKey, context);
      if (isEnabled) {
        return true;
      }
    }
    return false;
  }
}

// Usage example
const enhancementManager = new ProgressiveEnhancementManager();

// Define enhancement levels
enhancementManager.addLevel({
  name: 'basic',
  requiredFeatures: ['basic-ui'],
  optionalFeatures: [],
  capabilities: [],
});

enhancementManager.addLevel({
  name: 'enhanced',
  requiredFeatures: ['basic-ui', 'enhanced-ui'],
  optionalFeatures: ['animations'],
  capabilities: ['webgl'],
});

enhancementManager.addLevel({
  name: 'premium',
  requiredFeatures: ['basic-ui', 'enhanced-ui', 'premium-features'],
  optionalFeatures: ['animations', 'advanced-graphics'],
  capabilities: ['webgl', 'service-worker'],
});

// Get enhanced component
const EnhancedDashboard = await enhancementManager.getEnhancedComponent(
  BasicDashboard,
  {
    enhanced: EnhancedDashboard,
    premium: PremiumDashboard,
  },
  userContext,
);
```

## Feature Flag Analytics

### Feature Usage Tracking

Implement analytics for feature flag usage:

```typescript
// src/lib/feature-flags/analytics.ts
interface FeatureUsageEvent {
  featureKey: string;
  userId?: string;
  tenantId?: string;
  environment: string;
  timestamp: Date;
  action: 'evaluated' | 'enabled' | 'disabled' | 'error';
  value?: boolean;
  error?: string;
  context?: Record<string, unknown>;
}

interface FeatureAnalyticsConfig {
  trackEvaluations?: boolean;
  trackExposures?: boolean;
  trackErrors?: boolean;
  samplingRate?: number; // 0-1, percentage of events to track
}

export class FeatureFlagAnalytics {
  private config: FeatureAnalyticsConfig;
  private eventBuffer: FeatureUsageEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: FeatureAnalyticsConfig = {}) {
    this.config = {
      trackEvaluations: true,
      trackExposures: true,
      trackErrors: true,
      samplingRate: 1.0,
      ...config,
    };
  }

  trackEvaluation(
    featureKey: string,
    result: boolean,
    context?: FeatureFlagContext,
  ): void {
    if (!this.config.trackEvaluations) return;
    if (!this.shouldTrackEvent()) return;

    const event: FeatureUsageEvent = {
      featureKey,
      userId: context?.userId,
      tenantId: context?.tenantId,
      environment: context?.environment || 'development',
      timestamp: new Date(),
      action: 'evaluated',
      value: result,
      context: context?.customProperties,
    };

    this.bufferEvent(event);
  }

  trackExposure(featureKey: string, context?: FeatureFlagContext): void {
    if (!this.config.trackExposures) return;
    if (!this.shouldTrackEvent()) return;

    const event: FeatureUsageEvent = {
      featureKey,
      userId: context?.userId,
      tenantId: context?.tenantId,
      environment: context?.environment || 'development',
      timestamp: new Date(),
      action: 'enabled',
      context: context?.customProperties,
    };

    this.bufferEvent(event);
  }

  trackError(
    featureKey: string,
    error: string,
    context?: FeatureFlagContext,
  ): void {
    if (!this.config.trackErrors) return;
    if (!this.shouldTrackEvent()) return;

    const event: FeatureUsageEvent = {
      featureKey,
      userId: context?.userId,
      tenantId: context?.tenantId,
      environment: context?.environment || 'development',
      timestamp: new Date(),
      action: 'error',
      error,
      context: context?.customProperties,
    };

    this.bufferEvent(event);
  }

  private shouldTrackEvent(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  private bufferEvent(event: FeatureUsageEvent): void {
    this.eventBuffer.push(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= 100) {
      this.flushEvents();
    }

    // Set up periodic flushing
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this.flushEvents(), 30000); // 30 seconds
    }
  }

  async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Send events to analytics service
      await fetch('/api/feature-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      console.error('Failed to send feature analytics:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...eventsToSend);
    }
  }

  getFeatureUsageStats(featureKey: string): {
    totalEvaluations: number;
    enabledCount: number;
    disabledCount: number;
    errorCount: number;
    lastEvaluated: Date | null;
  } {
    // This would typically query a database or analytics service
    // For now, we'll return mock data
    return {
      totalEvaluations: 1000,
      enabledCount: 600,
      disabledCount: 400,
      errorCount: 5,
      lastEvaluated: new Date(),
    };
  }

  getTopFeatures(limit: number = 10): Array<{
    featureKey: string;
    usageCount: number;
    enableRate: number;
  }> {
    // This would typically query a database or analytics service
    // For now, we'll return mock data
    return [
      { featureKey: 'new-dashboard', usageCount: 5000, enableRate: 0.75 },
      { featureKey: 'dark-mode', usageCount: 4200, enableRate: 0.68 },
      { featureKey: 'advanced-analytics', usageCount: 3800, enableRate: 0.82 },
    ].slice(0, limit);
  }
}

// Integration with feature flag hooks
const featureAnalytics = new FeatureFlagAnalytics({
  samplingRate: 0.1, // Track 10% of events
});

// Enhanced getFeatureFlag with analytics
export async function getFeatureFlagWithAnalytics(
  flagKey: string,
  context?: FeatureFlagContext,
): Promise<boolean> {
  try {
    const result = await getFeatureFlag(flagKey, context);

    featureAnalytics.trackEvaluation(flagKey, result, context);

    if (result) {
      featureAnalytics.trackExposure(flagKey, context);
    }

    return result;
  } catch (error) {
    featureAnalytics.trackError(
      flagKey,
      error instanceof Error ? error.message : String(error),
      context,
    );

    throw error;
  }
}
```

## Hybrid Provider Strategies

### Multi-Provider Orchestration

Implement a strategy for using multiple feature flag providers:

```typescript
// src/lib/feature-flags/hybrid-provider.ts
interface ProviderConfig {
  provider: FeatureFlagProvider;
  priority: number;
  fallbackToNext?: boolean;
  featureMapping?: Record<string, string>;
}

export class HybridFeatureFlagProvider implements FeatureFlagProvider {
  private providers: ProviderConfig[] = [];
  private initialized = false;

  addProvider(config: ProviderConfig): void {
    this.providers.push(config);
    // Sort by priority (higher priority first)
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all providers
    const initPromises = this.providers.map((config) =>
      config.provider.initialize().catch((error) => {
        console.warn(`Failed to initialize provider:`, error);
        return null;
      }),
    );

    await Promise.all(initPromises);
    this.initialized = true;
  }

  async isEnabled(
    flagKey: string,
    context?: FeatureFlagContext,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    for (const config of this.providers) {
      try {
        const mappedKey = config.featureMapping?.[flagKey] || flagKey;
        const result = await config.provider.isEnabled(mappedKey, context);

        if (result || !config.fallbackToNext) {
          return result;
        }
      } catch (error) {
        console.warn(`Provider failed for flag ${flagKey}:`, error);

        // Continue to next provider if fallback is enabled
        if (!config.fallbackToNext) {
          throw error;
        }
      }
    }

    return false;
  }

  async getValue<T>(
    flagKey: string,
    defaultValue: T,
    context?: FeatureFlagContext,
  ): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    for (const config of this.providers) {
      try {
        const mappedKey = config.featureMapping?.[flagKey] || flagKey;
        const result = await config.provider.getValue(
          mappedKey,
          defaultValue,
          context,
        );

        // Check if we got a meaningful value (not the default)
        if (result !== defaultValue || !config.fallbackToNext) {
          return result;
        }
      } catch (error) {
        console.warn(`Provider failed for flag ${flagKey}:`, error);

        // Continue to next provider if fallback is enabled
        if (!config.fallbackToNext) {
          throw error;
        }
      }
    }

    return defaultValue;
  }

  async getAllFlags(
    context?: FeatureFlagContext,
  ): Promise<Record<string, FeatureFlag>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const allFlags: Record<string, FeatureFlag> = {};

    // Get flags from each provider
    for (const config of this.providers) {
      try {
        const providerFlags = await config.provider.getAllFlags(context);

        // Merge flags, with higher priority providers taking precedence
        Object.assign(allFlags, providerFlags);
      } catch (error) {
        console.warn(`Provider failed to get all flags:`, error);
      }
    }

    return allFlags;
  }

  async refresh(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Refresh all providers
    const refreshPromises = this.providers.map((config) =>
      config.provider.refresh().catch((error) => {
        console.warn(`Failed to refresh provider:`, error);
        return null;
      }),
    );

    await Promise.all(refreshPromises);
  }

  getProviderStatus(): Array<{
    name: string;
    priority: number;
    initialized: boolean;
    error?: string;
  }> {
    return this.providers.map((config) => ({
      name: config.provider.constructor.name,
      priority: config.priority,
      initialized: this.initialized,
    }));
  }
}

// Usage example
const hybridProvider = new HybridFeatureFlagProvider();

// Add providers in order of priority
hybridProvider.addProvider({
  provider: new LocalFeatureFlagProvider(),
  priority: 1,
  fallbackToNext: true,
});

hybridProvider.addProvider({
  provider: new LaunchDarklyFeatureFlagProvider(),
  priority: 2,
  fallbackToNext: true,
  featureMapping: {
    'new-dashboard': 'nextjs-new-dashboard',
    'dark-mode': 'ui-dark-mode',
  },
});

hybridProvider.addProvider({
  provider: new VercelEdgeConfigProvider(),
  priority: 3,
  fallbackToNext: false, // Last resort, don't fallback further
});

// Register the hybrid provider
registerFeatureFlagProvider(hybridProvider);
```

## Best Practices

### 1. Configuration Management

Use environment-specific configuration files:

```typescript
// src/lib/feature-flags/config.ts
interface FeatureFlagConfig {
  [environment: string]: {
    providers: Array<{
      type: FeatureFlagProviderType;
      config: Record<string, unknown>;
    }>;
    flags: Record<string, Partial<FeatureFlag>>;
  };
}

export const FEATURE_FLAG_CONFIG: FeatureFlagConfig = {
  development: {
    providers: [
      {
        type: 'local',
        config: {},
      },
    ],
    flags: {
      'new-dashboard': {
        enabled: true,
        environments: ['development'],
      },
    },
  },
  preview: {
    providers: [
      {
        type: 'local',
        config: {},
      },
    ],
    flags: {
      'new-dashboard': {
        enabled: true,
        rolloutPercentage: 50,
      },
    },
  },
  production: {
    providers: [
      {
        type: 'launchdarkly',
        config: {
          sdkKey: process.env.LAUNCHDARKLY_SDK_KEY,
        },
      },
      {
        type: 'local',
        config: {},
      },
    ],
    flags: {
      'new-dashboard': {
        enabled: true,
        rolloutPercentage: 100,
      },
    },
  },
};
```

### 2. Error Handling and Fallbacks

Implement robust error handling:

```typescript
// src/lib/feature-flags/error-handler.ts
interface FeatureFlagErrorConfig {
  defaultEnabled?: boolean;
  cacheTimeout?: number;
  retryAttempts?: number;
  fallbackProvider?: FeatureFlagProvider;
}

export class FeatureFlagErrorHandler {
  private config: FeatureFlagErrorConfig;
  private errorCache: Map<string, { error: Error; timestamp: number }> =
    new Map();

  constructor(config: FeatureFlagErrorConfig = {}) {
    this.config = {
      defaultEnabled: false,
      cacheTimeout: 60000, // 1 minute
      retryAttempts: 3,
      ...config,
    };
  }

  async handleProviderError<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    flagKey?: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (flagKey) {
        this.cacheError(flagKey, error);
      }

      console.error('Feature flag provider error:', error);

      // Try fallback provider if configured
      if (this.config.fallbackProvider) {
        try {
          if (flagKey) {
            return (await this.config.fallbackProvider.isEnabled(flagKey)) as T;
          }
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
        }
      }

      // Return default value
      return defaultValue;
    }
  }

  private cacheError(flagKey: string, error: Error): void {
    this.errorCache.set(flagKey, {
      error,
      timestamp: Date.now(),
    });

    // Clean up old errors
    const cutoff = Date.now() - this.config.cacheTimeout;
    for (const [key, entry] of this.errorCache.entries()) {
      if (entry.timestamp < cutoff) {
        this.errorCache.delete(key);
      }
    }
  }

  hasRecentError(flagKey: string): boolean {
    const entry = this.errorCache.get(flagKey);
    if (!entry) return false;

    return Date.now() - entry.timestamp < this.config.cacheTimeout;
  }
}
```

These advanced integration patterns provide sophisticated ways to combine feature flags, multi-tenant support, and environment management for complex applications. They enable fine-grained control over feature rollouts, sophisticated targeting, and robust error handling.
