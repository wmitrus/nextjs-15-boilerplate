'use client';

import { SignIn } from '@clerk/nextjs';

import { HydrationErrorBoundary } from '@/components/error/HydrationErrorBoundary';

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="animate-pulse">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-200"></div>
          <div className="mt-6 space-y-4">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <HydrationErrorBoundary>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <SignIn fallback={<SignInFallback />} />
          </div>
        </div>
      </div>
    </HydrationErrorBoundary>
  );
}
