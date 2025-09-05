import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Get the current authenticated user on the server side
 * This is a server-side only function
 */
export async function getCurrentUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the current user's authentication state on the server side
 * This is a server-side only function
 */
export async function getAuth() {
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
