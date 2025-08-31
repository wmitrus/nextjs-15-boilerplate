# Branch Workflow Design

## Overview

This document outlines the complete branch strategy and workflow design for the Next.js 15 boilerplate.

## Branch Strategy

```
feature-branch → develop → main
      ↓            ↓        ↓
   local dev    preview   production
   testing     deployment deployment
```

## Branch Purposes

### `main` Branch

- **Purpose**: Production-ready code
- **Deployment**: Vercel Production
- **Protection**: Requires PR review + all status checks
- **Environment**: `production` with stable features only

### `develop` Branch

- **Purpose**: Integration and staging
- **Deployment**: Vercel Preview (staging environment)
- **Protection**: Requires status checks (no review required)
- **Environment**: `preview` with new features enabled

### Feature Branches

- **Purpose**: Individual feature development
- **Deployment**: None (local development only)
- **Protection**: Basic checks only
- **Environment**: `development` with all features enabled

## Workflow Process

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Work on feature
# ... make changes ...

# Push and create PR to develop
git push origin feature/new-feature
# Create PR: feature/new-feature → develop
```

**What happens:**

- ✅ Basic checks run (lint, test, typecheck)
- ❌ No deployment (saves resources)
- ✅ Fast feedback for developers

### 2. Integration Testing

```bash
# After PR is approved and merged to develop
git checkout develop
git pull origin develop
```

**What happens:**

- ✅ Full test suite runs
- ✅ Vercel Preview deployment
- ✅ Stakeholder testing on preview URL
- ✅ Feature flags enabled for testing

### 3. Production Release

```bash
# Create PR from develop to main
# Create PR: develop → main
```

**What happens:**

- ✅ Enhanced checks (build, e2e, bundle size)
- ✅ Requires manual review
- ✅ After merge: Production deployment
- ✅ Only stable features enabled

## GitHub Actions Workflows

### `feature-branch-checks.yml`

**Triggers:** Push to feature branches, PRs to develop
**Purpose:** Fast feedback for developers
**Checks:**

- TypeScript compilation
- ESLint
- Unit tests
- Environment setup validation

### `deployVercelPreview.yml`

**Triggers:** Push to `develop` branch only
**Purpose:** Deploy to staging for stakeholder testing
**Actions:**

- Run full test suite
- Build and deploy to Vercel Preview
- Upload source maps to Sentry
- Run Lighthouse audit

### `deployVercelProd.yml`

**Triggers:** Push to `main` branch only
**Purpose:** Deploy to production
**Actions:**

- Run full test suite
- Build and deploy to Vercel Production
- Upload source maps to Sentry

### `branch-protection.yml` (renamed to `pr-checks.yml`)

**Triggers:** PRs to `main` branch
**Purpose:** Ensure production readiness
**Checks:**

- All basic checks
- Production build test
- E2E tests
- Bundle size validation
- Configuration system validation

## Environment Configuration by Branch

| Setting            | Feature Branch | Develop    | Main       |
| ------------------ | -------------- | ---------- | ---------- |
| NODE_ENV           | development    | production | production |
| APP_ENV            | development    | preview    | production |
| New Dashboard      | ✅             | ✅         | ❌         |
| Advanced Reporting | ✅             | ✅         | ❌         |
| Beta Features      | ✅             | ✅         | ❌         |
| Multi-tenant       | ❌             | ✅         | ✅         |
| Analytics          | ❌             | ✅         | ✅         |
| Debug Logging      | ✅             | ✅         | ❌         |

## Branch Protection Rules

### Main Branch Protection

- ✅ Require PR reviews (1 reviewer)
- ✅ Require status checks:
  - `main-pr-checks (20)`
  - `main-pr-checks (22)`
  - `config-validation`
- ✅ Require conversation resolution
- ✅ No direct pushes
- ✅ No force pushes

### Develop Branch Protection

- ❌ No PR reviews required (for faster iteration)
- ✅ Require status checks:
  - `Deploy-Preview` (from Vercel deployment)
  - `test (20)`, `test (22)` (from preview workflow)
- ✅ Allow force pushes (for development flexibility)

### Feature Branches

- ❌ No protection (developers can work freely)
- ✅ Basic checks on PR to develop

## Developer Workflow Commands

```bash
# Environment setup
pnpm env:init          # Create env file for current branch
pnpm env:check         # Check current environment

# Development
pnpm dev               # Start development server
pnpm config:demo       # View configuration demo

# Testing before PR
pnpm typecheck         # Check TypeScript
pnpm lint              # Check code style
pnpm test              # Run unit tests
pnpm build             # Test production build
```

## Benefits of This Design

### 🚀 **Fast Development**

- Feature branches have minimal checks
- Quick feedback loop for developers
- No unnecessary deployments

### 🛡️ **Quality Assurance**

- Develop branch catches integration issues
- Preview deployments for stakeholder testing
- Comprehensive checks before production

### 💰 **Cost Effective**

- Only deploy when needed (develop → preview, main → production)
- No Vercel deployments for every feature branch
- Efficient use of CI/CD resources

### 🔄 **Clear Process**

- Obvious progression: feature → develop → main
- Environment-specific feature flags
- Predictable deployment pipeline

## Troubleshooting

### "My feature branch triggered a deployment"

- Check that `deployVercelPreview.yml` only triggers on `develop` branch
- Feature branches should only run `feature-branch-checks.yml`

### "PR to main is blocked"

- Ensure all status checks pass
- Check that develop branch is up to date
- Verify configuration validation passes

### "Preview deployment not working"

- Check that changes are merged to `develop` branch
- Verify Vercel environment variables are set
- Check GitHub Actions logs for deployment errors

---

This design ensures a smooth development workflow while maintaining code quality and deployment safety.
