import { UserButton } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Route } from 'next';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in' as Route);
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome,{' '}
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex h-96 items-center justify-center rounded-lg border-4 border-dashed border-gray-200">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                Welcome to your Dashboard!
              </h2>
              <p className="text-gray-600">
                You are successfully authenticated with Clerk.
              </p>
              <div className="mt-6 rounded-lg bg-white p-4 shadow">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  User Information
                </h3>
                <div className="space-y-2 text-left">
                  <p>
                    <strong>User ID:</strong> {userId}
                  </p>
                  <p>
                    <strong>Email:</strong>{' '}
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                  <p>
                    <strong>Name:</strong> {user?.firstName} {user?.lastName}
                  </p>
                  <p>
                    <strong>Created:</strong>{' '}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
