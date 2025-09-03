/**
 * @fileoverview Authentication API Service
 *
 * Service for authentication-related operations with proper typing
 * and standardized response handling.
 *
 * @module lib/api/auth
 * @version 1.0.0
 * @since 1.0.0
 */

import { apiClient } from './client';

import type { LoginFormData } from '@/app/login/validation';
import type { ApiResponse } from '@/types/responseService';

/**
 * Login API response data structure
 */
export interface LoginResponseData {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Authentication API Service
 */
export class AuthApiService {
  /**
   * Login user with email and password
   */
  static async login(
    credentials: LoginFormData,
  ): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<LoginResponseData>('/api/login', credentials);
  }

  /**
   * Logout user (placeholder for future implementation)
   */
  static async logout(): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>('/api/logout');
  }
}

/**
 * Convenience functions for direct usage
 */
export const authApi = {
  login: AuthApiService.login,
  logout: AuthApiService.logout,
};
