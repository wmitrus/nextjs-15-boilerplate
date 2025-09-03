/**
 * @fileoverview Tenant API Service
 *
 * Service for tenant-related operations with proper typing
 * and standardized response handling.
 *
 * @module lib/api/tenant
 * @version 1.0.0
 * @since 1.0.0
 */

import { apiClient } from './client';

import type { Tenant } from '@/lib/multi-tenant/types';
import type { ApiResponse } from '@/types/responseService';

/**
 * Tenant API response data structure
 */
export interface TenantResponseData {
  tenant: Tenant;
}

/**
 * Tenant API Service
 */
export class TenantApiService {
  /**
   * Get tenant by ID
   */
  static async getTenant(
    tenantId: string,
  ): Promise<ApiResponse<TenantResponseData>> {
    return apiClient.get<TenantResponseData>(`/api/tenants/${tenantId}`);
  }

  /**
   * Get current tenant
   */
  static async getCurrentTenant(): Promise<ApiResponse<TenantResponseData>> {
    return apiClient.get<TenantResponseData>('/api/tenants/current');
  }
}

/**
 * Convenience functions for direct usage
 */
export const tenantApi = {
  getTenant: TenantApiService.getTenant,
  getCurrentTenant: TenantApiService.getCurrentTenant,
};
