import { auth, currentUser } from '@clerk/nextjs/server';

import logger from '@/lib/logger';
import {
  createServerErrorResponse,
  createSuccessResponse,
  createUnauthorizedResponse,
} from '@/lib/responseService';

export async function GET() {
  try {
    logger.info('Fetching current user profile');

    // Get the authentication state
    const { userId } = await auth();

    if (!userId) {
      logger.warn('Unauthorized access attempt to user API');
      return createUnauthorizedResponse('Authentication required');
    }

    // Get the current user
    const user = await currentUser();

    if (!user) {
      logger.warn({ userId }, 'User not found in Clerk');
      return createServerErrorResponse('User profile not found');
    }

    const userProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses.map((email) => ({
        emailAddress: email.emailAddress,
        verified: email.verification?.status === 'verified',
      })),
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    };

    logger.info({ userId: user.id }, 'User profile fetched successfully');

    return createSuccessResponse(userProfile);
  } catch (error) {
    logger.error(error, 'Error fetching user profile');
    return createServerErrorResponse('Failed to fetch user profile');
  }
}
