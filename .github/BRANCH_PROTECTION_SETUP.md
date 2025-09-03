# Branch Protection Setup Guide

This guide explains how to configure branch protection rules to enforce that only PRs from `develop` branch can be merged into `main`.

## Current Branching Strategy

```
feature-branches → develop → main
```

- **Feature branches**: Individual feature development
- **develop**: Integration branch for testing and staging
- **main**: Production-ready code

## GitHub Branch Protection Configuration

### Step 1: Access Branch Protection Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Click **Add rule** or edit existing rule for `main` branch

### Step 2: Configure Main Branch Protection

Configure the following settings for the `main` branch:

#### Basic Protection

- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: Set to `1` (or more as needed)
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have CODEOWNERS file)

#### Status Checks

- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks to add:**

- `enforce-branch-policy` (from our new workflow)
- `main-pr-checks` (comprehensive checks)
- `config-validation` (configuration validation)

#### Additional Restrictions

- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Include administrators** (recommended)
- ✅ **Allow force pushes**: ❌ **Disabled**
- ✅ **Allow deletions**: ❌ **Disabled**

#### Branch Name Pattern Restrictions (Advanced)

If you want to be extra strict, you can add a rule that only allows PRs from `develop`:

1. Go to **Settings** → **Branches**
2. Add a new rule with pattern: `main`
3. Under "Restrict pushes that create files larger than 100 MB", enable:
   - **Restrict pushes that create files larger than 100 MB**

### Step 3: Configure Develop Branch Protection (Optional but Recommended)

For the `develop` branch, configure lighter protection:

#### Basic Protection

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: Set to `1`
  - ✅ **Dismiss stale PR approvals when new commits are pushed**

#### Status Checks

- ✅ **Require status checks to pass before merging**

**Required status checks for develop:**

- `feature-checks` (from feature-branch-checks.yml)
- `typecheck`
- `lint-and-test`

## Automated Enforcement

The repository now includes automated workflows that enforce the branching policy:

### 1. Branch Policy Enforcement (`branch-policy-enforcement.yml`)

- **Triggers**: On PRs to `main`
- **Function**: Validates that PRs to `main` only come from `develop`
- **Action**: Fails the check if source branch is not `develop`

### 2. Main Branch PR Checks (`branch-protection.yml`)

- **Triggers**: On PRs to `main`
- **Function**: Comprehensive quality checks for production deployment
- **Includes**: Type checking, linting, testing, build validation, bundle size checks

### 3. Feature Branch Checks (`feature-branch-checks.yml`)

- **Triggers**: On PRs to `develop` and pushes to feature branches
- **Function**: Standard quality checks for feature development

## Workflow Integration

The branch protection works with the following workflow:

1. **Feature Development**:

   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git push origin feature/my-feature
   # Create PR: feature/my-feature → develop
   ```

2. **Integration Testing**:

   ```bash
   # After PR is merged to develop
   git checkout develop
   git pull origin develop
   # Test in staging environment
   ```

3. **Production Release**:
   ```bash
   # Create PR: develop → main
   # This triggers comprehensive checks
   # After approval and checks pass, merge to main
   ```

## Troubleshooting

### Common Issues

1. **"Branch protection rule violations"**
   - Ensure you're creating PRs from `develop` to `main`
   - Check that all required status checks are passing

2. **"Required status checks are failing"**
   - Review the failing checks in the PR
   - Fix issues in the source branch before merging

3. **"Branch is not up to date"**
   - Rebase or merge the target branch into your source branch
   - Push the updated branch

### Emergency Procedures

If you need to bypass branch protection in an emergency:

1. **Temporary disable**: Go to Settings → Branches → Edit rule → Temporarily disable specific restrictions
2. **Admin override**: Repository administrators can override protection rules
3. **Hotfix process**: Create a hotfix branch from `main`, fix the issue, and follow the normal PR process

## Best Practices

1. **Regular Syncing**: Keep `develop` up to date with `main`
2. **Small PRs**: Create focused, reviewable pull requests
3. **Status Checks**: Ensure all automated checks pass before requesting review
4. **Code Reviews**: Always require at least one approval for production changes
5. **Testing**: Thoroughly test changes in the `develop` branch before promoting to `main`

## Monitoring

Monitor your branch protection effectiveness:

1. **PR Analytics**: Review PR merge patterns and rejection reasons
2. **Failed Checks**: Monitor which status checks fail most often
3. **Bypass Events**: Track when protection rules are bypassed and why

---

For questions or issues with branch protection setup, refer to the [GitHub Branch Protection documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches).
