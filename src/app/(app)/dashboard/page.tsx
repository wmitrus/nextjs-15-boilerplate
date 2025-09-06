'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

import { ProtectedRoute } from '@/lib/auth/protect';
import { useFeatureFlag } from '@/lib/feature-flags';
import { useTenant } from '@/lib/multi-tenant';

export default function Dashboard() {
  const { user } = useUser();
  const newDashboard = useFeatureFlag('new-dashboard');
  const tenant = useTenant();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900">
                  Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome,{' '}
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to your personalized dashboard with feature flags and
              multi-tenant support.
            </p>
          </div>

          {/* User Info Card */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              User Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Name
                </div>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Email
                </div>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  User ID
                </div>
                <p className="mt-1 font-mono text-sm text-gray-900">
                  {user?.id}
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Last Sign In
                </div>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.lastSignInAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Flags Card */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Feature Flags
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">New Dashboard</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    newDashboard.isEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {newDashboard.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {newDashboard.isEnabled && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">
                    🎉 You&apos;re seeing the new dashboard experience!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tenant Info Card */}
          {tenant.isMultiTenant && (
            <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Tenant Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="block text-sm font-medium text-gray-700">
                    Tenant ID
                  </div>
                  <p className="mt-1 font-mono text-sm text-gray-900">
                    {tenant.tenantId}
                  </p>
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-700">
                    Tenant Name
                  </div>
                  <p className="mt-1 text-sm text-gray-900">
                    {tenant.tenant?.name || 'Default Tenant'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Link
              href="/"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
