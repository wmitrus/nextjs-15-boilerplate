/**
 * @fileoverview API Services Index
 *
 * Central export point for all API services and utilities.
 *
 * @module lib/api
 * @version 1.0.0
 * @since 1.0.0
 */

// Core API client
export { apiClient, createApiClient, ApiError } from './client';

// Domain-specific API services
export { featureFlagsApi, FeatureFlagsApiService } from './feature-flags';
export type {
  FeatureFlagsResponseData,
  FeatureFlagsRequestBody,
} from './feature-flags';

export { userApi, UserApiService } from './user';
export type { UserProfile, UpdateUserProfileRequest } from './user';

export { authApi, AuthApiService } from './auth';
export type { LoginResponseData } from './auth';

export { tenantApi, TenantApiService } from './tenant';
export type { TenantResponseData } from './tenant';

// Re-export response service utilities for convenience
export { handleApiResponse } from '@/lib/responseService';
export type { ApiResponse } from '@/types/responseService';
