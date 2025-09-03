/**
 * @fileoverview Response Service Utilities
 *
 * This module provides utility functions for creating standardized API responses
 * using the response service types. It ensures consistent response structure
 * across all API endpoints.
 *
 * @module lib/responseService
 * @version 1.0.0
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';

import type {
  ApiResponse,
  KnownFormErrors,
  RedirectResponse,
  ServerErrorResponse,
  SuccessResponse,
  ValidationErrorResponse,
} from '@/types/responseService';

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): NextResponse {
  const response: SuccessResponse<T> = {
    status: 'ok',
    data,
  };
  return NextResponse.json(response, { status });
}

/**
 * Creates a validation error response with form errors
 */
export function createValidationErrorResponse(
  errors: KnownFormErrors | unknown,
  status: number = 400,
): NextResponse {
  const response: ValidationErrorResponse = {
    status: 'form_errors',
    errors,
  };
  return NextResponse.json(response, { status });
}

/**
 * Creates a server error response
 */
export function createServerErrorResponse(
  error: string,
  status: number = 500,
): NextResponse {
  const response: ServerErrorResponse = {
    status: 'server_error',
    error,
  };
  return NextResponse.json(response, { status });
}

/**
 * Creates a redirect response
 */
export function createRedirectResponse(
  url: string,
  status: number = 302,
): NextResponse {
  const response: RedirectResponse = {
    status: 'redirect',
    url,
  };
  return NextResponse.json(response, { status });
}

/**
 * Type-safe wrapper for handling API responses on the client side
 */
export function handleApiResponse<T>(response: ApiResponse<T>): {
  isSuccess: boolean;
  isValidationError: boolean;
  isServerError: boolean;
  isRedirect: boolean;
  data?: T;
  errors?: KnownFormErrors | unknown;
  error?: string;
  url?: string;
} {
  switch (response.status) {
    case 'ok':
      return {
        isSuccess: true,
        isValidationError: false,
        isServerError: false,
        isRedirect: false,
        data: response.data,
      };

    case 'form_errors':
      return {
        isSuccess: false,
        isValidationError: true,
        isServerError: false,
        isRedirect: false,
        errors: response.errors,
      };

    case 'server_error':
      return {
        isSuccess: false,
        isValidationError: false,
        isServerError: true,
        isRedirect: false,
        error: response.error,
      };

    case 'redirect':
      return {
        isSuccess: false,
        isValidationError: false,
        isServerError: false,
        isRedirect: true,
        url: response.url,
      };

    default:
      // This should never happen with proper typing
      return {
        isSuccess: false,
        isValidationError: false,
        isServerError: true,
        isRedirect: false,
        error: 'Unknown response status',
      };
  }
}
