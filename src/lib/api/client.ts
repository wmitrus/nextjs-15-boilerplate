/**
 * @fileoverview API Client
 *
 * Centralized API client with standardized response handling, type safety,
 * and consistent error management across the application.
 *
 * @module lib/api/client
 * @version 1.0.0
 * @since 1.0.0
 */

import type { ApiResponse } from '@/types/responseService';

/**
 * Configuration options for API requests
 */
interface ApiRequestConfig extends RequestInit {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Default configuration for API requests
 */
const DEFAULT_CONFIG: ApiRequestConfig = {
  baseUrl: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API client class
 */
class ApiClient {
  private baseUrl: string;
  private defaultConfig: RequestInit;

  constructor(config: ApiRequestConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_CONFIG.baseUrl!;
    this.defaultConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Makes a raw HTTP request with timeout and error handling
   */
  private async makeRequest(
    endpoint: string,
    config: ApiRequestConfig = {},
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestConfig = {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers,
      },
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout || DEFAULT_CONFIG.timeout!);

    try {
      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      throw error;
    }
  }

  /**
   * Makes a typed API request and returns standardized response
   */
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeRequest(endpoint, config);

      // Parse JSON response - trust that server always returns ApiResponse<T>
      try {
        const data: ApiResponse<T> = await response.json();
        return data;
      } catch {
        // If JSON parsing fails, create a server error response
        return {
          status: 'server_error',
          error: 'Invalid JSON response from server',
        } as ApiResponse<T>;
      }
    } catch (error) {
      // Handle network errors, timeouts, etc.
      if (error instanceof ApiError) {
        // Convert ApiError to standardized response format
        return {
          status: 'server_error',
          error: error.message,
        } as ApiResponse<T>;
      }

      // Handle other network errors
      return {
        status: 'server_error',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      } as ApiResponse<T>;
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config: Omit<ApiRequestConfig, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config: Omit<ApiRequestConfig, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config: Omit<ApiRequestConfig, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Create a new API client with custom configuration
 */
export const createApiClient = (config: ApiRequestConfig) =>
  new ApiClient(config);
