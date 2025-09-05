'use client';

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

import { useFeatureFlag } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';

export default function Home() {
  const newDashboard = useFeatureFlag('new-dashboard');
  const darkMode = useFeatureFlag('dark-mode');
  const tenant = useTenant();

  // Environment detection
  const environment = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  const isProduction = environment === 'production';
  const isPreview = environment === 'preview';

  // Feature flags status
  const features = [
    { name: 'New Dashboard', enabled: newDashboard.isEnabled },
    { name: 'Dark Mode', enabled: darkMode.isEnabled },
    {
      name: 'API Rate Limiting',
      enabled: process.env.NEXT_PUBLIC_API_RATE_LIMIT_ENABLED === 'true',
    },
    {
      name: 'Analytics',
      enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header
        className="border-b border-gray-200 bg-white/80 backdrop-blur-sm"
        role="banner"
      >
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="h-8 w-8 rounded-lg bg-indigo-600"
                aria-hidden="true"
                role="presentation"
              ></div>
              <span className="text-xl font-bold text-gray-900">NextJS 15</span>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isProduction
                    ? 'bg-red-100 text-red-800'
                    : isPreview
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
                aria-label={`Environment: ${environment}`}
              >
                {environment.toUpperCase()}
              </span>
              {tenant.isMultiTenant && (
                <span
                  className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800"
                  aria-label={`Tenant: ${tenant.tenant?.name || tenant.tenantId}`}
                >
                  {tenant.tenant?.name || tenant.tenantId}
                </span>
              )}

              {/* Clerk Authentication */}
              <SignedOut>
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-600">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
        role="main"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Modern Web Development
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            A Next.js 15 boilerplate with environment management, feature flags,
            and multi-tenant support
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <a
                href="/dashboard"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Go to Dashboard
              </a>
            </SignedIn>
            <a
              href="/form-demo-simple"
              className="rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Form Demo
            </a>
            <a
              href="#features"
              className="text-sm leading-6 font-semibold text-gray-900"
            >
              Explore Features <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Built with modern development practices and tools
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <dt className="flex items-center gap-x-3 text-base leading-7 font-semibold text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <span className="text-lg text-white">🌍</span>
                  </div>
                  Environment Management
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Separate configurations for development, preview, and
                    production environments
                  </p>
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                        isProduction
                          ? 'bg-red-100 text-red-800'
                          : isPreview
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {environment}
                    </span>
                  </div>
                </dd>
              </div>

              <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <dt className="flex items-center gap-x-3 text-base leading-7 font-semibold text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <span className="text-lg text-white">🚩</span>
                  </div>
                  Feature Flags
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Toggle features dynamically with support for rollout
                    percentages and conditions
                  </p>
                  <div
                    className="mt-4 space-y-2"
                    role="list"
                    aria-label="Feature flags status"
                  >
                    {features.map((feature) => (
                      <div
                        key={feature.name}
                        className="flex items-center justify-between"
                        role="listitem"
                      >
                        <span className="text-sm text-gray-600">
                          {feature.name}
                        </span>
                        <span
                          className={`h-3 w-3 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                          aria-hidden="true"
                          role="presentation"
                        ></span>
                        <span className="sr-only">
                          {feature.name} is{' '}
                          {feature.enabled ? 'enabled' : 'disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>

              <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <dt className="flex items-center gap-x-3 text-base leading-7 font-semibold text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <span className="text-lg text-white">🏢</span>
                  </div>
                  Multi-tenant
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Support for multiple tenants with isolated configurations
                    and features
                  </p>
                  <div className="mt-4">
                    {tenant.isMultiTenant ? (
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-0.5 text-sm font-medium text-purple-800">
                          {tenant.tenant?.name || tenant.tenantId}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                        Single Tenant
                      </span>
                    )}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-24 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Environment Configuration
            </h2>
            <p className="mt-4 text-gray-600">
              Current environment settings and feature status
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Environment</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {environment}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {isProduction
                  ? 'Production deployment'
                  : isPreview
                    ? 'Preview deployment'
                    : 'Development environment'}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Feature Flags</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {features.filter((f) => f.enabled).length}/{features.length}
              </p>
              <p className="mt-1 text-sm text-gray-600">Active features</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Tenant</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {tenant.isMultiTenant ? 'Enabled' : 'Disabled'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {tenant.isMultiTenant
                  ? tenant.tenant?.name || tenant.tenantId
                  : 'Single tenant mode'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white" role="contentinfo">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center space-x-3">
              <div
                className="h-6 w-6 rounded-lg bg-indigo-600"
                aria-hidden="true"
                role="presentation"
              ></div>
              <span className="text-sm font-medium text-gray-900">
                NextJS 15 Boilerplate
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500 md:mt-0">
              Built with Next.js 15, TypeScript, and modern web technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
