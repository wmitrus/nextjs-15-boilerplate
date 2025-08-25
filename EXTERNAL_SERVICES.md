# External Services & Admin Dashboards

This document lists all external services, SaaS tools, and platforms that require account setup, API tokens, and configuration for the Next.js 15 boilerplate project.

## 🔐 Authentication & Setup Required

### 1. Sentry - Error Tracking & Performance Monitoring

- **Service URL**: https://sentry.io/
- **Admin Dashboard**: https://sentry.io/organizations/ozi/projects/nextjs-15-boilerplate/
- **Purpose**: Error tracking, performance monitoring, release tracking
- **Setup Required**:
  - Create Sentry account and organization
  - Create project: `nextjs-15-boilerplate`
  - Generate Auth Token for builds
  - Configure DSN in environment variables
- **Environment Variables**:
  ```
  SENTRY_DSN=https://...@sentry.io/...
  SENTRY_ORG=ozi
  SENTRY_PROJECT=nextjs-15-boilerplate
  SENTRY_AUTH_TOKEN=your_auth_token
  ```
- **Configuration Files**:
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `.env.sentry-build-plugin`

### 2. Upstash - Serverless Redis & Rate Limiting

- **Service URL**: https://upstash.com/
- **Admin Dashboard**: https://console.upstash.com/
- **Purpose**: Serverless Redis database, rate limiting, caching
- **Setup Required**:
  - Create Upstash account
  - Create Redis database
  - Get connection URL and token
- **Environment Variables**:
  ```
  UPSTASH_REDIS_REST_URL=https://...upstash.io
  UPSTASH_REDIS_REST_TOKEN=your_token
  ```
- **Libraries Used**: `@upstash/redis`, `@upstash/ratelimit`

### 3. Lighthouse CI - Performance Monitoring

- **Service URL**: https://github.com/GoogleChrome/lighthouse-ci
- **Admin Dashboard**: https://lighthouse.wmitrus.usermd.net
- **Purpose**: Automated performance, accessibility, and SEO auditing
- **Setup Required**:
  - Set up Lighthouse CI server (self-hosted or use service)
  - Generate server token
  - Configure assertions and thresholds
- **Environment Variables**:
  ```
  LHCI_TOKEN=16cf049f-bced-4a3d-a9fa-bff9784e0e72
  ```
- **Configuration**: `.lighthouserc.json`
- **GitHub Action**: Automated in CI/CD pipeline

### 4. Chromatic - Visual Testing & Storybook Deployment

- **Service URL**: https://www.chromatic.com/
- **Admin Dashboard**: https://www.chromatic.com/builds
- **Purpose**: Visual regression testing, Storybook deployment, UI review
- **Setup Required**:
  - Create Chromatic account
  - Link GitHub repository
  - Generate project token
- **Environment Variables**:
  ```
  CHROMATIC_PROJECT_TOKEN=your_project_token
  ```
- **GitHub Action**: `.github/workflows/deployChromatic.yml`
- **Script**: `pnpm chromatic`

### 5. Vercel - Hosting & Deployment

- **Service URL**: https://vercel.com/
- **Admin Dashboard**: https://vercel.com/dashboard
- **Purpose**: Web hosting, serverless functions, automatic deployments
- **Setup Required**:
  - Create Vercel account
  - Import GitHub repository
  - Configure environment variables
  - Set up production and preview deployments
- **Environment Variables**: All project env vars need to be configured in Vercel dashboard
- **GitHub Actions**:
  - `.github/workflows/deployVercelPreview.yml`
  - `.github/workflows/deployVercelProd.yml`
- **Configuration**: `.vercel/` directory

### 6. Logflare - Log Management

- **Service URL**: https://logflare.app/
- **Admin Dashboard**: https://logflare.app/dashboard
- **Purpose**: Log aggregation, search, and analysis
- **Setup Required**:
  - Create Logflare account
  - Create source for application logs
  - Generate API key
- **Environment Variables**:
  ```
  LOGFLARE_API_KEY=your_api_key
  LOGFLARE_SOURCE_TOKEN=your_source_token
  ```
- **Integration**: `pino-logflare` transport

## 🔧 Platform Integrations

### 7. GitHub - Repository & CI/CD

- **Service URL**: https://github.com/
- **Repository**: https://github.com/your-username/nextjs-15-boilerplate
- **Purpose**: Source code management, CI/CD workflows, issue tracking
- **Setup Required**:
  - GitHub repository with proper permissions
  - GitHub Actions enabled
  - Secrets configured for external services
- **GitHub Secrets Required**:
  ```
  SENTRY_AUTH_TOKEN
  CHROMATIC_PROJECT_TOKEN
  VERCEL_TOKEN (if using Vercel CLI)
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  LHCI_TOKEN
  ```
- **Workflows**: 8 automated workflows in `.github/workflows/`

### 8. npm Registry - Package Publishing

- **Service URL**: https://www.npmjs.com/
- **Admin Dashboard**: https://www.npmjs.com/settings
- **Purpose**: Package registry (if publishing packages)
- **Setup Required**:
  - npm account
  - Generate access token for automated publishing
- **Environment Variables**:
  ```
  NPM_TOKEN=your_npm_token
  ```
- **Note**: Currently configured with `npmPublish: false` in semantic-release

## 📊 Analytics & Monitoring (Optional)

### 9. Google Analytics (Not configured, but recommended)

- **Service URL**: https://analytics.google.com/
- **Purpose**: Web analytics, user behavior tracking
- **Setup Required**:
  - Create GA4 property
  - Get tracking ID
  - Implement tracking code

### 10. Google Search Console (Not configured, but recommended)

- **Service URL**: https://search.google.com/search-console
- **Purpose**: SEO monitoring, search performance
- **Setup Required**:
  - Verify domain ownership
  - Submit sitemap

## 🛠️ Development Tools (Account-based)

### 11. Dependabot - Dependency Updates

- **Service**: Built into GitHub
- **Admin**: Repository Settings > Security & analysis > Dependabot
- **Purpose**: Automated dependency updates
- **Setup**: Enable in repository settings

### 12. CodeQL - Security Analysis

- **Service**: Built into GitHub
- **Admin**: Repository Settings > Security & analysis > Code scanning
- **Purpose**: Security vulnerability detection
- **Setup**: Enable GitHub Advanced Security

## 📋 Setup Checklist

When setting up this project in a new environment:

### Required Services (Core Functionality)

- [ ] **Sentry**: Error tracking and performance monitoring
- [ ] **Vercel**: Hosting and deployment
- [ ] **GitHub**: Repository and CI/CD

### Optional Services (Enhanced Features)

- [ ] **Upstash**: Redis caching and rate limiting
- [ ] **Chromatic**: Visual testing and Storybook deployment
- [ ] **Lighthouse CI**: Performance monitoring
- [ ] **Logflare**: Advanced log management

### Environment Variables Setup

1. Copy `.env` to `.env.local`
2. Fill in all required service tokens and URLs
3. Configure the same variables in:
   - Vercel dashboard (for production)
   - GitHub Secrets (for CI/CD)
   - Local development environment

### Service Configuration Order

1. **GitHub** - Set up repository first
2. **Vercel** - Connect repository for deployment
3. **Sentry** - Set up error tracking
4. **Upstash** - Configure Redis (if using caching/rate limiting)
5. **Chromatic** - Set up visual testing (if using Storybook)
6. **Lighthouse CI** - Configure performance monitoring
7. **Logflare** - Set up log aggregation (if needed)

## 🔗 Quick Access Links

| Service        | Dashboard                                                                            | Documentation                                                                           |
| -------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Sentry         | [Dashboard](https://sentry.io/organizations/ozi/projects/nextjs-15-boilerplate/)     | [Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)                      |
| Upstash        | [Console](https://console.upstash.com/)                                              | [Docs](https://docs.upstash.com/)                                                       |
| Lighthouse CI  | [Custom Dashboard](https://lighthouse.wmitrus.usermd.net)                            | [Docs](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md) |
| Chromatic      | [Builds](https://www.chromatic.com/builds)                                           | [Docs](https://www.chromatic.com/docs/)                                                 |
| Vercel         | [Dashboard](https://vercel.com/dashboard)                                            | [Docs](https://vercel.com/docs)                                                         |
| Logflare       | [Dashboard](https://logflare.app/dashboard)                                          | [Docs](https://logflare.app/guides)                                                     |
| GitHub Actions | [Repository Actions](https://github.com/your-username/nextjs-15-boilerplate/actions) | [Docs](https://docs.github.com/en/actions)                                              |

## 💡 Notes

- **Cost Considerations**: Most services have free tiers suitable for development and small projects
- **Security**: Store all tokens and sensitive data in environment variables, never commit to repository
- **Monitoring**: Set up alerts and notifications for critical services
- **Backup**: Consider backup strategies for data stored in external services
- **Documentation**: Keep service configurations documented for team members

---

_Last updated: January 2025_
