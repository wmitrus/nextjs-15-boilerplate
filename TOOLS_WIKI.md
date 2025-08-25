# Next.js 15 Boilerplate - Tools Wiki

This document provides a comprehensive overview of all tools, libraries, and configurations used in the Next.js 15 boilerplate project.

## Table of Contents

- [Core Framework & Runtime](#core-framework--runtime)
- [Development Tools](#development-tools)
- [Testing Framework](#testing-framework)
- [Code Quality & Linting](#code-quality--linting)
- [Build & Bundle Analysis](#build--bundle-analysis)
- [CI/CD & Automation](#cicd--automation)
- [Component Development](#component-development)
- [Logging & Monitoring](#logging--monitoring)
- [Code Generation](#code-generation)
- [Package Management](#package-management)
- [Configuration Files](#configuration-files)

---

## Core Framework & Runtime

### Next.js 15.5.0

- **Purpose**: React framework for production applications
- **Features**: App Router, Server Components, TypeScript support, Turbopack
- **Configuration**: `next.config.ts`
- **Scripts**: `dev`, `build`, `start`, `dev:no-turbo`, `build:turbo`

### React 19.1.1 & React DOM 19.1.1

- **Purpose**: Core React library and DOM renderer
- **Features**: Latest React features, concurrent rendering
- **Type Definitions**: `@types/react@19.1.11`, `@types/react-dom@19.1.7`

### TypeScript 5.9.2

- **Purpose**: Static type checking for JavaScript
- **Configuration**: `tsconfig.json`
- **Scripts**: `typecheck`
- **Related**: `ts-jest`, `ts-node`, `typescript-eslint`

### Node.js

- **Version**: v22 (recommended)
- **Runtime**: Server-side JavaScript execution
- **Package Manager**: pnpm

---

## Development Tools

### Turbopack

- **Purpose**: Fast bundler for Next.js development
- **Usage**: `pnpm dev` (default), `pnpm build:turbo`
- **Alternative**: Standard webpack bundler with `dev:no-turbo`

### Environment Management

- **Tool**: `@t3-oss/env-nextjs@0.13.8`
- **Purpose**: Type-safe environment variable validation
- **Schema**: Zod-based validation
- **Configuration**: `src/lib/env.ts`

### Hot Reloading & Development Server

- **Built into Next.js**: Automatic page reloading on file changes
- **Port**: 3000 (default)
- **Features**: Fast refresh, error overlay

---

## Testing Framework

### Unit Testing - Jest 30.0.5

- **Purpose**: JavaScript testing framework
- **Configuration**: `jest.config.ts`, `jest.setup.ts`
- **Environment**: `jest-environment-jsdom`
- **Scripts**: `test`, `test:watch`
- **Coverage**: Built-in coverage reporting
- **Related Libraries**:
  - `@testing-library/react@16.3.0` - React component testing utilities
  - `@testing-library/jest-dom@6.8.0` - Custom Jest matchers
  - `@testing-library/dom@10.4.1` - DOM testing utilities
  - `jest-json-schema@6.1.0` - JSON schema validation in tests

### E2E Testing - Playwright 1.55.0

- **Purpose**: End-to-end browser testing
- **Configuration**: `playwright.config.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Scripts**: `e2e`, `e2e:ui`, `e2e:debug`
- **Features**: Parallel execution, trace collection, HTML reports
- **Test Directory**: `e2e/`

### Storybook Testing - Vitest 3.2.4

- **Purpose**: Component testing within Storybook
- **Configuration**: `vitest.config.ts`, `.storybook/vitest.setup.ts`
- **Browser Testing**: Playwright provider
- **Integration**: `@storybook/addon-vitest`

### Mock Service Worker (MSW) 2.10.5

- **Purpose**: API mocking for testing
- **Configuration**: Service worker in `public/mockServiceWorker.js`
- **Usage**: Mock HTTP requests in tests and development

---

## Code Quality & Linting

### ESLint 9.34.0

- **Purpose**: JavaScript/TypeScript linting
- **Configuration**: `eslint.config.mjs`
- **Scripts**: `lint`, `lint:fix`
- **Extends**:
  - `next` - Next.js specific rules
  - `next/core-web-vitals` - Performance rules
  - `next/typescript` - TypeScript rules
  - `plugin:storybook/recommended` - Storybook rules
  - `plugin:jsx-a11y/recommended` - Accessibility rules
  - `plugin:prettier/recommended` - Prettier integration
  - `plugin:jest/recommended` - Jest rules
  - `plugin:testing-library/react` - Testing Library rules

### ESLint Plugins

- `eslint-plugin-import@2.32.0` - Import/export syntax
- `eslint-plugin-jsx-a11y@6.10.2` - Accessibility rules
- `eslint-plugin-react@7.37.5` - React specific rules
- `eslint-plugin-react-hooks@5.2.0` - React Hooks rules
- `eslint-plugin-jest@29.0.1` - Jest testing rules
- `eslint-plugin-jest-dom@5.5.0` - Jest DOM matchers
- `eslint-plugin-playwright@2.2.2` - Playwright testing rules
- `eslint-plugin-storybook@9.1.3` - Storybook rules
- `eslint-plugin-testing-library@7.6.6` - Testing Library rules
- `eslint-plugin-prettier@5.5.4` - Prettier integration

### Prettier 3.6.2

- **Purpose**: Code formatting
- **Configuration**: `.prettierrc.json`
- **Integration**: ESLint plugin for consistent formatting
- **Plugins**: `prettier-plugin-tailwindcss@0.6.14`

### Lint-staged 16.1.5

- **Purpose**: Run linters on staged files
- **Configuration**: `package.json` lint-staged section
- **Integration**: Husky pre-commit hooks
- **Actions**: ESLint fix, Prettier format

---

## Build & Bundle Analysis

### Bundle Analyzer

- **Tool**: `@next/bundle-analyzer@15.5.0`
- **Purpose**: Analyze bundle size and composition
- **Script**: `analyze`
- **Environment**: `ANALYZE=true`

### Size Limit 11.2.0

- **Purpose**: Bundle size monitoring and limits
- **Plugin**: `@size-limit/file@11.2.0`
- **Configuration**: `package.json` size-limit section
- **Script**: `size`, `size:build-check`
- **Limits**:
  - Framework chunks: 80KB
  - Main chunks: 110KB
  - Polyfills: 50KB
  - Webpack runtime: 10KB
  - Pages: 250KB
  - App chunks: 100KB
  - CSS: 50KB

### Bundlewatch 0.4.1

- **Purpose**: Bundle size tracking and CI integration
- **Configuration**: `.bundlewatch.config.json`
- **Integration**: GitHub Actions workflow
- **Features**: Gzip compression analysis, branch tracking

### Source Map Explorer 2.5.3

- **Purpose**: Analyze JavaScript bundles using source maps
- **Usage**: Bundle composition analysis

---

## CI/CD & Automation

### GitHub Actions Workflows

Located in `.github/workflows/`:

#### 1. Bundle Size Analysis (`bundle-size.yml`)

- **Trigger**: Pull requests, main branch pushes
- **Actions**: Build, size analysis, bundlewatch
- **Environment**: Production build with dummy env vars

#### 2. Playwright E2E Tests (`playwright.yml`)

- **Trigger**: Pull requests, main branch pushes
- **Actions**: E2E testing across browsers
- **Artifacts**: Test reports, traces

#### 3. Type Checking (`typecheck.yml`)

- **Trigger**: Pull requests, main branch pushes
- **Actions**: TypeScript compilation check

#### 4. Release Automation (`release.yml`)

- **Trigger**: Main branch pushes
- **Actions**: Semantic versioning, changelog generation
- **Tools**: Semantic Release

#### 5. Vercel Deployments

- **Preview**: `deployVercelPreview.yml`
- **Production**: `deployVercelProd.yml`
- **Integration**: Automatic deployments

#### 6. Chromatic Deployment (`deployChromatic.yml`)

- **Purpose**: Visual testing and Storybook deployment
- **Integration**: Chromatic service

#### 7. Auto-assign (`auto-assign.yml`)

- **Purpose**: Automatic PR assignment

#### 8. Labeling (`label.yml`)

- **Purpose**: Automatic issue/PR labeling

### Semantic Release 24.2.7

- **Purpose**: Automated versioning and releases
- **Configuration**: `.releaserc.json`
- **Plugins**:
  - `@semantic-release/commit-analyzer@13.0.1`
  - `@semantic-release/release-notes-generator@14.0.3`
  - `@semantic-release/npm@12.0.2`
  - `@semantic-release/changelog@6.0.3`
  - `@semantic-release/git@10.0.1`
  - `@semantic-release/github@11.0.4`
  - `@semantic-release/exec@7.1.0`

### Husky 9.1.7

- **Purpose**: Git hooks management
- **Configuration**: `.husky/` directory
- **Script**: `prepare`
- **Hooks**: Pre-commit linting and formatting

### Commitlint

- **Tools**: `@commitlint/cli@19.8.1`, `@commitlint/config-conventional@19.8.1`
- **Purpose**: Enforce conventional commit messages
- **Configuration**: `commitlint.config.js`
- **Integration**: Husky commit-msg hook

### Commitizen

- **Tool**: `cz-conventional-changelog@3.3.0`
- **Purpose**: Interactive commit message generation
- **Configuration**: `package.json` config section

---

## Component Development

### Storybook 9.1.3

- **Purpose**: Component development and documentation
- **Configuration**: `.storybook/main.ts`, `.storybook/preview.ts`
- **Scripts**: `storybook`, `build-storybook`, `serve-storybook`
- **Port**: 6006
- **Framework**: `@storybook/nextjs@9.1.3`

### Storybook Addons

- `@storybook/addon-onboarding@9.1.3` - Getting started guide
- `@storybook/addon-docs@9.1.3` - Documentation generation
- `@storybook/addon-vitest@9.1.3` - Testing integration
- `@chromatic-com/storybook@4.1.1` - Visual testing

### Chromatic 13.1.3

- **Purpose**: Visual testing and review
- **Script**: `chromatic`
- **Integration**: GitHub Actions deployment

---

## Logging & Monitoring

### Pino 9.9.0

- **Purpose**: Fast, structured logging
- **Configuration**: `src/lib/logger/`
- **Features**: JSON logging, multiple transports
- **Development**: `pino-pretty@13.1.1` for formatted output

### Pino Logflare 0.5.2

- **Purpose**: Log streaming to Logflare service
- **Integration**: Production logging pipeline
- **Configuration**: Environment variables

### Sentry 10.5.0

- **Tool**: `@sentry/nextjs@10.5.0`
- **Purpose**: Error tracking and performance monitoring
- **Configuration**: `sentry.server.config.ts`, `sentry.edge.config.ts`
- **Features**: Source maps, performance tracking, error reporting
- **Integration**: Next.js middleware and instrumentation

### Upstash Redis

- **Tools**: `@upstash/redis@1.35.3`, `@upstash/ratelimit@2.0.6`
- **Purpose**: Serverless Redis and rate limiting
- **Usage**: Caching, session storage, rate limiting

---

## Code Generation

### Plop 4.0.1

- **Purpose**: Code scaffolding and generation
- **Configuration**: `plopfile.js`
- **Templates**: `plop-templates/` directory
- **Helpers**: `handlebars-helpers@0.10.0`

### Generators Available

1. **API Routes**: Generate Next.js API endpoints
2. **Components**: Generate React components
3. **Pages**: Generate Next.js pages
4. **Tests**: Generate test files

### Template Types

- API routes with multiple HTTP methods
- React components (basic/polymorphic)
- Next.js pages with dynamic routes
- Test files for all component types

---

## Package Management

### pnpm

- **Version**: 10 (specified in workflows)
- **Features**: Fast, disk space efficient
- **Lockfile**: `pnpm-lock.yaml`
- **Configuration**: `package.json` pnpm section

### Dependency Management Tools

#### Depcheck

- **Purpose**: Find unused dependencies
- **Configuration**: `.depcheck.json`
- **Script**: `depcheck`
- **Ignores**: Build tools, dev dependencies

#### Skott 0.35.4

- **Purpose**: Detect circular dependencies
- **Scripts**: `skott`, `skott:check:only`
- **Features**: Third-party and builtin dependency tracking

#### Madge

- **Purpose**: Module dependency analysis
- **Script**: `madge`
- **Target**: `./src` directory
- **Features**: Circular dependency detection

---

## Configuration Files

### Core Configuration

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project metadata and scripts

### Testing Configuration

- `jest.config.ts` - Jest testing framework
- `jest.setup.ts` - Jest setup and globals
- `playwright.config.ts` - Playwright E2E testing
- `vitest.config.ts` - Vitest for Storybook testing

### Code Quality Configuration

- `eslint.config.mjs` - ESLint linting rules
- `.prettierrc.json` - Prettier formatting rules
- `commitlint.config.js` - Commit message linting

### Build & Analysis Configuration

- `.bundlewatch.config.json` - Bundle size monitoring
- `.depcheck.json` - Dependency checking
- `.lighthouserc.json` - Lighthouse CI configuration

### CI/CD Configuration

- `.releaserc.json` - Semantic release configuration
- `.github/workflows/*.yml` - GitHub Actions workflows

### Development Configuration

- `.storybook/main.ts` - Storybook configuration
- `.storybook/preview.ts` - Storybook preview settings
- `postcss.config.mjs` - PostCSS configuration
- `plopfile.js` - Code generation templates

### Environment Configuration

- `.env` - Environment variables template
- `.env.local` - Local development variables
- `.env.sentry-build-plugin` - Sentry build configuration

---

## Performance & Optimization Tools

### Lighthouse CI

- **Tool**: `@lhci/cli@0.15.1`
- **Purpose**: Performance, accessibility, SEO auditing
- **Configuration**: `.lighthouserc.json`
- **Script**: `lhci`
- **Thresholds**: Performance (0.2), Accessibility (0.2), SEO (0.2)

### TailwindCSS 4.1.12

- **Purpose**: Utility-first CSS framework
- **Configuration**: PostCSS plugin
- **Plugin**: `@tailwindcss/postcss@4.1.12`
- **Prettier Integration**: `prettier-plugin-tailwindcss`

### Cross-env 10.0.0

- **Purpose**: Cross-platform environment variable setting
- **Usage**: Bundle analysis script

### Dotenv

- **Tools**: `dotenv@17.2.1`, `dotenv-cli@10.0.0`
- **Purpose**: Environment variable loading
- **Usage**: Development and testing environments

---

## Additional Utilities

### MDX Support

- **Tool**: `@mdx-js/react@3.1.0`
- **Purpose**: MDX component rendering
- **Integration**: Storybook documentation

### Markdown Processing

- **Tool**: `markdown-to-jsx@7.7.13`
- **Purpose**: Markdown to React component conversion

### Global Utilities

- **Tool**: `globals@16.3.0`
- **Purpose**: Global variable definitions for ESLint

---

## Summary

This Next.js 15 boilerplate includes **65+ tools and libraries** covering:

- **Framework & Runtime**: Next.js, React, TypeScript, Node.js
- **Testing**: Jest, Playwright, Vitest, MSW, Testing Library
- **Code Quality**: ESLint (10+ plugins), Prettier, Commitlint
- **Build & Analysis**: Bundle Analyzer, Size Limit, Bundlewatch
- **CI/CD**: GitHub Actions (8 workflows), Semantic Release, Husky
- **Development**: Storybook, Plop, Hot Reloading
- **Monitoring**: Sentry, Pino, Lighthouse CI
- **Performance**: TailwindCSS, Bundle optimization
- **Package Management**: pnpm, Depcheck, Skott, Madge

Each tool is carefully configured to work together, providing a comprehensive development environment with automated testing, code quality enforcement, performance monitoring, and deployment automation.
