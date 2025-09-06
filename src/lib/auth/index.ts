import { auth, currentUser } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

// Mock user data for test environment
const mockUser = {
  id: 'user_test123',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [
    {
      id: 'email_test123',
      emailAddress: 'test@example.com',
      verification: {
        status: 'verified',
        strategy: 'email_code',
      },
    },
  ],
  phoneNumbers: [],
  web3Wallets: [],
  externalAccounts: [],
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  createdAt: new Date(Date.now() - 86400000), // 1 day ago
  updatedAt: new Date(),
  lastSignInAt: new Date(Date.now() - 3600000), // 1 hour ago
};

/**
 * Get the current authenticated user on the server side
 * This is a server-side only function
 */
export async function getCurrentUser() {
  // Return mock user in test environment
  if (process.env.NODE_ENV === 'test') {
    return mockUser;
  }

  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Mock auth state for test environment
const mockAuth = {
  userId: 'user_test123',
  sessionId: 'sess_test123',
  orgId: null,
  orgRole: null,
  orgSlug: null,
  sessionClaims: {
    sub: 'user_test123',
    iss: 'https://clerk.dev',
    aud: 'test-audience',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    nbf: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  },
};

/**
 * Get the current user's authentication state on the server side
 * This is a server-side only function
 */
export async function getAuth() {
  // Return mock auth state in test environment
  if (process.env.NODE_ENV === 'test') {
    return mockAuth;
  }

  // If Clerk is not configured, return undefined to avoid headers() call
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  ) {
    return { userId: null, sessionId: null };
  }

  try {
    const authState = await auth();
    return authState;
  } catch (error) {
    console.error('Error getting auth state:', error);
    return { userId: null, sessionId: null };
  }
}

/**
 * Check if the current user is authenticated
 * This is a server-side only function
 */
export async function isAuthenticated(): Promise<boolean> {
  const authState = await getAuth();
  return !!authState.userId;
}

/**
 * Get user ID for feature flag context
 * This is a server-side only function
 */
export async function getUserIdForFeatureFlags(): Promise<string | undefined> {
  const authState = await getAuth();
  return authState.userId || undefined;
}

// Cached version for use in layouts
export const getCachedUserIdForFeatureFlags = unstable_cache(
  async () => {
    const authState = await getAuth();
    return authState.userId || undefined;
  },
  ['user-id-for-features'],
  {
    revalidate: 3600, // 1 hour
    tags: ['user'],
  },
);
