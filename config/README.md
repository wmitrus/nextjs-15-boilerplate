# Configuration System

This directory contains the centralized configuration system for the Next.js 15 boilerplate.

## Quick Start

```typescript
import { CONFIG, useAppConfig, isFeatureEnabled } from '@/config';

// Static configuration access
const apiEnabled = CONFIG.API.RATE_LIMIT_ENABLED;

// React hook for dynamic configuration
function MyComponent() {
  const config = useAppConfig();

  if (config.features.newDashboard) {
    return <NewDashboard />;
  }

  return <LegacyDashboard />;
}

// Feature flag checking
const showBetaFeatures = isFeatureEnabled('betaFeatures');
```

## Files

- **`features.ts`** - Feature flag definitions and environment-based toggles
- **`tenantConfig.ts`** - Multi-tenant configuration management (future use)
- **`index.ts`** - Centralized exports and utilities

## Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env.development
   ```

2. **Or use the setup script:**
   ```bash
   pnpm env:init        # Create env file based on current branch
   pnpm env:create preview  # Create specific environment file
   pnpm env:all         # Create all environment files
   pnpm env:check       # Check current configuration
   ```

## Demo

Visit `/config-demo` to see the configuration system in action and debug current settings.

## Documentation

See [CONFIGURATION_SYSTEM.md](../docs/CONFIGURATION_SYSTEM.md) for complete documentation.
