/**
 * @fileoverview User API Service
 *
 * Example service showing how to implement the API service pattern
 * for user-related operations.
 *
 * @module lib/api/user
 * @version 1.0.0
 * @since 1.0.0
 */

import { apiClient } from './client';

import type { ApiResponse } from '@/types/responseService';

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User profile update request
 */
export interface UpdateUserProfileRequest {
  name?: string;
  avatar?: string;
}

/**
 * User API Service
 */
export class UserApiService {
  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/api/user/profile');
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userData: UpdateUserProfileRequest,
  ): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/api/user/profile', userData);
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>('/api/user/account');
  }
}

/**
 * Convenience functions for direct usage
 */
export const userApi = {
  getProfile: UserApiService.getProfile,
  updateProfile: UserApiService.updateProfile,
  deleteAccount: UserApiService.deleteAccount,
};

/**
 * Example usage in a React hook:
 *
 * ```typescript
 * import { userApi, handleApiResponse } from '@/lib/api';
 *
 * function useUserProfile() {
 *   const [profile, setProfile] = useState<UserProfile | null>(null);
 *   const [isLoading, setIsLoading] = useState(true);
 *   const [error, setError] = useState<Error | null>(null);
 *
 *   const loadProfile = useCallback(async () => {
 *     try {
 *       setIsLoading(true);
 *       setError(null);
 *
 *       const response = await userApi.getProfile();
 *       const result = handleApiResponse(response);
 *
 *       if (result.isSuccess && result.data) {
 *         setProfile(result.data);
 *       } else if (result.isServerError) {
 *         throw new Error(result.error || 'Failed to load profile');
 *       }
 *     } catch (error) {
 *       setError(error instanceof Error ? error : new Error(String(error)));
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   }, []);
 *
 *   const updateProfile = useCallback(async (data: UpdateUserProfileRequest) => {
 *     const response = await userApi.updateProfile(data);
 *     const result = handleApiResponse(response);
 *
 *     if (result.isSuccess && result.data) {
 *       setProfile(result.data);
 *       return result.data;
 *     } else if (result.isValidationError) {
 *       throw new Error('Validation failed');
 *     } else if (result.isServerError) {
 *       throw new Error(result.error || 'Failed to update profile');
 *     }
 *   }, []);
 *
 *   return { profile, isLoading, error, loadProfile, updateProfile };
 * }
 * ```
 */
