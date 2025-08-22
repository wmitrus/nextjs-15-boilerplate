---
description: Repository Information Overview
alwaysApply: true
---

# Next.js 15 Boilerplate Information

## Summary

A comprehensive boilerplate for Next.js 15 applications, equipped with essential tools and configurations to jumpstart development. This project provides a well-structured foundation with integrated tools for code quality, testing, logging, and automation.

## Structure

- **src/**: Main source code directory containing app components, libraries, and stories
  - **app/**: Next.js application routes and components
  - **lib/**: Utility libraries including environment and logging
  - **stories/**: Storybook component stories
- **public/**: Static assets served by Next.js
- **e2e/**: End-to-end tests using Playwright
- **.github/**: GitHub Actions workflows for CI/CD
- **.storybook/**: Storybook configuration
- **plop-templates/**: Templates for code generation

## Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.9.2
**Runtime**: Node.js (v22 recommended based on CI config)
**Build System**: Next.js build system
**Package Manager**: pnpm

## Dependencies

**Main Dependencies**:

- Next.js 15.4.6
- React 19.1.1
- React DOM 19.1.1
- Pino 9.9.0 (logging)
- Zod 3.25.76 (schema validation)

**Development Dependencies**:

- Jest 29.7.0 (unit testing)
- Playwright 1.54.2 (E2E testing)
- Storybook 8.6.4 (component development)
- ESLint 9.33.0 (linting)
- Prettier 3.6.2 (formatting)
- Husky 9.1.7 (git hooks)
- Semantic Release 24.2.7 (release automation)

## Build & Installation

```bash
# Install dependencies
pnpm install

# Development server with turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## Testing

**Unit Testing**:

- **Framework**: Jest with React Testing Library
- **Test Location**: Co-located with components (\*.test.tsx)
- **Configuration**: jest.config.ts, jest.setup.ts
- **Run Command**:

```bash
pnpm test
```

**E2E Testing**:

- **Framework**: Playwright
- **Test Location**: e2e/ directory
- **Configuration**: playwright.config.ts
- **Run Command**:

```bash
pnpm e2e
```

## Component Development

**Framework**: Storybook 8.6.4

- **Stories Location**: src/stories/
- **Configuration**: .storybook/main.ts
- **Run Command**:

```bash
pnpm storybook
```

## Logging

**Framework**: Pino 9.9.0

- **Configuration**: src/lib/logger/
- **Features**: Fast, structured logging with development formatting

## CI/CD & Automation

**Git Hooks**: Husky with lint-staged

- **Pre-commit**: Linting and formatting
- **Commit Message**: Commitlint for conventional commits

**GitHub Actions**:

- **Release**: Semantic versioning and changelog generation
- **Deployment**: Vercel preview and production deployments
- **Testing**: Playwright E2E tests

## Code Quality & Analysis

**Linting**: ESLint with Next.js and React configurations
**Formatting**: Prettier
**Dependency Analysis**:

- Skott (circular dependencies)
- Depcheck (unused dependencies)
- Madge (module dependencies)

## Code Generation

**Tool**: Plop

- **Templates**: API routes, components, pages, and tests
- **Usage**: Generates boilerplate code for consistent structure
