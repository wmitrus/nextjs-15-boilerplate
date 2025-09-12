# Next.js 15 Boilerplate

A comprehensive boilerplate for Next.js 15, equipped with essential tools and configurations to jumpstart your development process.

## Overview

This repository provides a well-structured foundation for building high-quality Next.js applications. It includes various tools and configurations to help you maintain code quality, streamline development, automate testing, and enhance the overall performance and security of your application.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Commit & Linting Tools](#commit--linting-tools)
3. [GitHub Actions (Automation & CI/CD)](#github-actions-automation--cicd)
4. [Testing & Mocking](#testing--mocking)
5. [Development & Logging](#development--logging)
6. [Monitoring & Error Tracking](#monitoring--error-tracking)
7. [Dependency Analysis & Code Structure](#dependency-analysis--code-structure)
8. [Security & Protection](#security--protection)
9. [CI/CD & Release Automation](#cicd--release-automation)
10. [Code Generation](#code-generation)
11. [Authentication](#authentication)

## Environment & Vercel Setup

1. Local development

- Copy `.env.example` to `.env.local` and fill local values (keep `.env.local` gitignored).
- Use `APP_URL` and `NEXT_PUBLIC_APP_URL` as `http://localhost:3000`.

2. Vercel environment variables (Dashboard → Settings → Environment Variables)

- Set variables with the right scope: Production and Preview.
- Do not set `NODE_ENV`.
- Trigger a redeploy after changes.

3. Required variables

- Production
  - APP_ENV=production
  - NEXT_PUBLIC_APP_ENV=production
  - APP_URL=https://yourdomain.com
  - NEXT_PUBLIC_APP_URL=https://yourdomain.com
  - CSRF_SECURE_COOKIES=true
- Preview
  - APP_ENV=preview
  - NEXT_PUBLIC_APP_ENV=preview
  - APP_URL=https://your-preview.vercel.app
  - NEXT_PUBLIC_APP_URL=https://your-preview.vercel.app
  - CSRF_SECURE_COOKIES=true

4. Rate limiting (Upstash)

- Enable: API_RATE_LIMIT_ENABLED=true
- Provide: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (set real values only in Vercel)
- Optional tuning: API_RATE_LIMIT_REQUESTS=100, API_RATE_LIMIT_WINDOW=15m

5. Clerk (if used)

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- CSP allowlists (browser):
  - NEXT_PUBLIC_CSP_SCRIPT_EXTRA=https://js.clerk.com
  - NEXT*PUBLIC_CSP_FRAME_EXTRA=https://*.clerk.com, https://_.clerk.services
  - NEXT_PUBLIC_CSP_CONNECT_EXTRA=https://api.clerk.com

6. Optional but recommended

- NEXT_PUBLIC_VERCEL_URL=yourdomain.com (or your-preview.vercel.app) to ensure correct absolute URLs during SSR/SSG.

See also:

- `.env.example` for annotated keys and guidance (commit placeholders; set real values in Vercel)
- `docs/SECURITY_AND_ENVIRONMENT_GUIDE.md` (CSRF, CSP, preview/prod checklists)
- `docs/CSRF_GUIDE.md` and `docs/CSP_GUIDE.md`

Automation:

- Use `pnpm env:init|create|all|check` to generate/update env files (scripts/setup-env.mjs)
- E2E rate limit test runs without Upstash via TEST_LOCAL_RATE_LIMIT=1
- When adding a new feature requiring envs, update `.env.example` only; README links here to avoid duplication

## Step 01: Project Setup

### 🏗️ Install Required Dependencies (eslint, prettier)

Set up essential tools for linting and formatting to ensure your code follows best practices and is consistently formatted.

### 🔧 Configure ESLint

Set linting rules to maintain code quality and catch potential issues early in the development process.

### 🎨 Configure Prettier

Ensure consistent code formatting across your project, making it easier to read and maintain.

## Step 02: Commit & Linting Tools

### 🐶 husky, lint-staged, commitlint

Automate linting and enforce commit message conventions to maintain a clean and organized codebase.

### ✍️ Commitizen

Standardize and simplify commit messages, making your commit history more readable and easier to manage.

## Step 03: GitHub Actions (Automation & CI/CD)

### 🤖 GitHub Action - Run on Git Push

Automate tasks on every push to the repository, ensuring your code is tested and deployed efficiently.

## Step 04: Testing & Mocking

### 🧪 Jest and ESLint Configuration

Set up the Jest testing framework with linting rules to ensure your tests are well-written and maintain code quality.

### 🎭 Playwright

End-to-end testing framework for reliable browser testing, ensuring your application works as expected across different environments.

### 🛠️ MSW

Mock API requests for robust testing, allowing you to simulate different scenarios and test your application thoroughly.

### 🧹 Vitest and ESLint

Additional testing and linting setup for more comprehensive test coverage and code quality.

## Step 05: Development & Logging

### 📚 Storybook

Develop and test UI components in isolation, making it easier to build and maintain your application's user interface.

### 📜 Pino

Fast, low-overhead logging to help you track and debug your application's behavior.

### 🗂️ Winston

Versatile logging library for managing and organizing your application's logs.

## Step 06: Monitoring & Error Tracking

### 🛡️ Sentry

Integrate error tracking and monitoring to catch and resolve issues before they impact your users.

### 📈 Grafana Cloud

Monitor application performance and gain insights into your application's health and usage.

### 🔍 Betterstack Integration

Enhance monitoring and log management to ensure your application is running smoothly and efficiently.

### 📝 Newrelic

Performance monitoring and optimization to help you identify and resolve performance bottlenecks.

## Step 07: Dependency Analysis & Code Structure

### 🔄 Skott - Circular Dependencies, Graph

Visualize and manage circular dependencies to improve your application's architecture and maintainability.

### 🗑️ depcheck - Unused Dependencies

Identify and remove unused dependencies to keep your project clean and efficient.

### 🕵️‍♂️ Madge

Analyze module dependencies to understand and optimize your project's structure.

### 🌳 dep-tree (Analyze Dependencies)

Analyze and visualize project dependencies to ensure your application's architecture is efficient and maintainable.

### 🗺️ dependency-cruiser (Visualize & Check Dependency Health)

Validate and enforce dependency rules to keep your project healthy and well-organized.

### 📦 Bundle Analyzer (Analyze and Optimize Bundle Size)

Visualize the size of webpack output files to identify and optimize large modules, improving your application's performance.

## Step 08: Security & Protection

### 🔒 NextJS Security

Secure your application with proper headers to protect against common web vulnerabilities.

### 🚀 Arcjet

Implement bot detection and security measures to protect your application from malicious traffic.

### 🛡️ Cloudflare

Enhance security and performance by leveraging Cloudflare's powerful network and security features.

## Step 09: CI/CD & Release Automation

### 📝 Semantic Release

Automate versioning and package publishing to streamline your release process and ensure consistent version management.

### 🛠️ GitHub Action - Run Tests on PR

Automate testing with GitHub Actions to ensure your code is thoroughly tested before merging pull requests.

### 🚀 GitHub Action - Release (Trigger Release Automation)

Automate the release process to save time and reduce the risk of manual errors.

## Step 10: Code Generation

### 🛠️ Plop

Generate boilerplate code effortlessly to speed up development and maintain consistency across your project.

### 📦 Response Service

Handle and manage API responses to ensure your application interacts with APIs efficiently and reliably.

## Step 11: Authentication

### 🔐 Clerk

Authentication and user management to secure your application and provide a seamless user experience.

---

## Feature Flags & Multi-Tenant Support

This boilerplate includes comprehensive feature flag and multi-tenant support:

### 🚩 Feature Flags

- Provider-based architecture (Local, LaunchDarkly, GrowthBook, Vercel)
- Type-safe feature flag implementation
- Context-aware feature evaluation
- Conditional feature flags with complex rules
- Gradual rollouts and A/B testing support

### 🏢 Multi-Tenant Architecture

- Multiple tenant resolution strategies (header, subdomain, path, domain)
- Tenant-specific feature configurations
- Data isolation and security
- Custom tenant branding and settings

For detailed documentation, see:

- [Environment & Feature Flag Management](./docs/ENVIRONMENT_MANAGEMENT.md)
- [Features Integration Guide](./docs/FEATURES_INTEGRATION.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Real App Integration Examples](./docs/REAL_APP_INTEGRATION.md)
- [Advanced Integration Patterns](./docs/ADVANCED_INTEGRATION_PATTERNS.md)
- [Performance Optimization](./docs/PERFORMANCE_OPTIMIZATION.md)
- [Security Considerations](./docs/SECURITY_CONSIDERATIONS.md)
- [CSRF Guide](./docs/CSRF_GUIDE.md)
- [CSP Guide](./docs/CSP_GUIDE.md)
- [Testing Strategies](./docs/TESTING_STRATEGIES.md)
- [Clerk Integration Guide](./docs/CLERK_INTEGRATION.md)

---

Feel free to copy and paste this README file into your repository. Let me know if you need any further assistance or have any other questions!
