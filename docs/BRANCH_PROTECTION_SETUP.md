# Branch Protection Setup Guide

This guide will help you set up branch protection rules for your repository to ensure code quality and proper deployment workflows.

## Overview

Our branch strategy uses:

- **`main`** - Production branch (protected, requires PR reviews)
- **`develop`** - Development/staging branch (protected, requires status checks)

## GitHub Branch Protection Rules

### 1. Protect the `main` Branch

Go to your GitHub repository → Settings → Branches → Add rule

**Branch name pattern:** `main`

**Settings to enable:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if you have CODEOWNERS file)
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `test (20)` - Node.js 20 tests
    - `test (22)` - Node.js 22 tests
    - `main-pr-checks` - Additional checks for main PRs
    - `config-validation` - Configuration system validation
- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files**
- ✅ **Do not allow bypassing the above settings**

### 2. Protect the `develop` Branch

**Branch name pattern:** `develop`

**Settings to enable:**

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `develop-checks (20)` - Node.js 20 checks
    - `develop-checks (22)` - Node.js 22 checks
    - `config-validation` - Configuration system validation
- ✅ **Restrict pushes that create files**
- ⚠️ **Allow force pushes** (for development flexibility)
- ⚠️ **Allow deletions** (for development flexibility)

## Automated Checks

Our GitHub Actions workflows automatically run these checks:

### For `develop` branch:

- Type checking (`pnpm typecheck`)
- Linting (`pnpm lint`)
- Unit tests (`pnpm test`)
- Environment setup validation
- Configuration system validation

### For PRs to `main`:

- All develop branch checks
- Production build test (`pnpm build`)
- E2E tests (`pnpm e2e`)
- Bundle size checks (`pnpm size`)

### Configuration validation:

- TypeScript compilation of config files
- Environment setup script testing
- Environment file generation validation

## Setting Up Branch Protection (Step by Step)

### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** button

### Step 2: Configure Main Branch Protection

1. **Branch name pattern:** `main`
2. Check **Require a pull request before merging**
   - Set **Required number of reviewers** to `1`
   - Check **Dismiss stale PR approvals when new commits are pushed**
3. Check **Require status checks to pass before merging**
   - Check **Require branches to be up to date before merging**
   - In the search box, add these status checks:
     - `test (20)`
     - `test (22)`
     - `main-pr-checks`
     - `config-validation`
4. Check **Require conversation resolution before merging**
5. Check **Restrict pushes that create files**
6. Check **Do not allow bypassing the above settings**
7. Click **Create**

### Step 3: Configure Develop Branch Protection

1. Click **Add rule** again
2. **Branch name pattern:** `develop`
3. Check **Require status checks to pass before merging**
   - Check **Require branches to be up to date before merging**
   - Add these status checks:
     - `develop-checks (20)`
     - `develop-checks (22)`
     - `config-validation`
4. Check **Restrict pushes that create files**
5. Leave **Allow force pushes** and **Allow deletions** unchecked for flexibility
6. Click **Create**

## Workflow Integration

### Deployment Flow

```
feature-branch → develop → main → production
     ↓             ↓        ↓
   basic        preview   production
   checks      deployment deployment
```

### Status Checks Flow

1. **Feature branches** → Basic checks (lint, test, typecheck)
2. **Develop branch** → Enhanced checks + configuration validation
3. **Main branch PRs** → Full checks (build, e2e, bundle size)

## CODEOWNERS File (Optional)

Create a `.github/CODEOWNERS` file to automatically request reviews:

```
# Global owners
* @your-username

# Configuration system
/config/ @your-username @config-team
/scripts/setup-env.mjs @your-username @config-team

# Documentation
/docs/ @your-username @docs-team

# GitHub workflows
/.github/ @your-username @devops-team

# Environment and deployment
/vercel.json @your-username @devops-team
/.env.example @your-username @devops-team
```

## Testing Branch Protection

### Test Main Branch Protection

1. Create a feature branch from `develop`
2. Make changes and push
3. Create PR to `main`
4. Verify that:
   - Status checks are required
   - Review is required
   - Cannot merge until checks pass

### Test Develop Branch Protection

1. Create a feature branch from `develop`
2. Make changes and push
3. Create PR to `develop`
4. Verify that:
   - Status checks are required
   - Can merge after checks pass (no review required)

## Troubleshooting

### Status Checks Not Appearing

1. Make sure the GitHub Actions workflow has run at least once
2. Check that the job names in the workflow match the required status checks
3. Ensure the workflow triggers on the correct events (`pull_request`, `push`)

### Cannot Push to Protected Branch

This is expected behavior. Always use pull requests for protected branches.

### Status Checks Failing

1. Check the Actions tab for detailed error logs
2. Common issues:
   - TypeScript errors in config files
   - Linting errors
   - Test failures
   - Environment setup script issues

### Emergency Override

Repository admins can temporarily disable branch protection or use the "Merge without waiting for requirements" option in emergencies.

## Best Practices

1. **Always use pull requests** for protected branches
2. **Keep PRs small and focused** for easier review
3. **Write descriptive commit messages** following conventional commits
4. **Test locally** before pushing to reduce CI failures
5. **Review configuration changes carefully** as they affect all environments
6. **Update documentation** when changing branch protection rules

## Monitoring

Monitor your branch protection effectiveness:

- Check PR merge times and review quality
- Monitor CI failure rates
- Track configuration-related issues
- Review deployment success rates

---

🛡️ **Your branches are now protected!** This ensures code quality and prevents direct pushes to critical branches.
