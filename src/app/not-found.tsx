'use client';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        404 - Page Not Found
      </h1>
      <p className="mb-8 max-w-md text-center text-gray-600 sm:text-lg">
        The page you&amp;re looking for doesn&amp;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        Go back home
      </Link>
    </div>
  );
}
