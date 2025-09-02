/**
 * @fileoverview Feature Flags API Service
 *
 * Centralized service for feature flags API operations with proper typing
 * and standardized response handling.
 *
 * @module lib/api/feature-flags
 * @version 1.0.0
 * @since 1.0.0
 */

import { apiClient } from './client';

import type {
  FeatureFlag,
  FeatureFlagContext,
} from '@/lib/feature-flags/types';
import type { ApiResponse } from '@/types/responseService';

/**
 * Feature flags API response data structure
 */
export interface FeatureFlagsResponseData {
  flags: Record<string, FeatureFlag>;
  context: {
    environment: string;
    version: string;
  };
}

/**
 * Feature flags API request body structure
 */
export interface FeatureFlagsRequestBody {
  userId?: string;
  tenantId?: string;
  customProperties?: Record<string, unknown>;
}

/**
 * Feature Flags API Service
 */
export class FeatureFlagsApiService {
  /**
   * Fetch feature flags using POST method with context
   */
  static async getFlags(
    context?: FeatureFlagContext,
  ): Promise<ApiResponse<FeatureFlagsResponseData>> {
    const requestBody: FeatureFlagsRequestBody = {
      userId: context?.userId,
      tenantId: context?.tenantId,
      customProperties: context?.customProperties,
    };

    return apiClient.post<FeatureFlagsResponseData>(
      '/api/feature-flags',
      requestBody,
    );
  }

  /**
   * Fetch feature flags using GET method with query parameters
   */
  static async getFlagsWithQuery(
    userId?: string,
    tenantId?: string,
  ): Promise<ApiResponse<FeatureFlagsResponseData>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (tenantId) params.append('tenantId', tenantId);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/feature-flags?${queryString}`
      : '/api/feature-flags';

    return apiClient.get<FeatureFlagsResponseData>(endpoint);
  }
}

/**
 * Convenience functions for direct usage
 */
export const featureFlagsApi = {
  getFlags: FeatureFlagsApiService.getFlags,
  getFlagsWithQuery: FeatureFlagsApiService.getFlagsWithQuery,
};
