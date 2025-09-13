import { Route } from 'next';
import Link from 'next/link';

export default function StaticHome() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Modern Web Development
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            A Next.js 15 boilerplate with environment management, feature flags,
            and multi-tenant support
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href={'/sign-in' as Route}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="text-sm leading-6 font-semibold text-gray-900"
            >
              Go to App <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/examples/secure-post"
              className="text-sm leading-6 font-semibold text-gray-900"
            >
              Secure POST Example <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24">
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
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center space-x-3">
              <div
                className="h-6 w-6 rounded-lg bg-indigo-600"
                aria-hidden="true"
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
