import { Suspense } from 'react';

import { ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs';
import { Route } from 'next';
import Link from 'next/link';

import ClientUserButton from '../ui/ClientUserButton';

export function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="h-8 w-8 rounded-lg bg-indigo-600"
              aria-hidden="true"
            ></div>
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-indigo-600"
            >
              NextJS 15
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ClerkLoading>Loading...</ClerkLoading>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
              >
                Dashboard
              </Link>
              <ClientUserButton />
            </SignedIn>
            <SignedOut>
              <Link
                href={'/sign-in' as Route}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign In
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
