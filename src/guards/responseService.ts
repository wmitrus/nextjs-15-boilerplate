/**
 * @fileoverview Response Service Type Guards
 *
 * This module provides type guard functions for validating API response structures,
 * particularly for form validation errors. These guards help ensure type safety
 * when working with unknown response data from API endpoints.
 *
 * @module guards/responseService
 * @version 1.0.0
 * @since 1.0.0
 */

import { KnownFormErrors } from '@/types/responseService';

/**
 * Type guard to check if an unknown error object conforms to the KnownFormErrors structure.
 *
 * This function validates that the error object has the expected shape for form validation errors,
 * where each field name maps to an array of string error messages.
 *
 * @param errors - The unknown error object to validate
 * @returns `true` if the errors object matches the KnownFormErrors structure, `false` otherwise
 *
 * @example
 * ```typescript
 * import { isKnownFormErrors } from './guards';
 *
 * function handleApiResponse<T>(response: ApiResponse<T>) {
 *   switch (response.status) {
 *     case 'ok':
 *       console.log('Success:', response.data);
 *       break;
 *
 *     case 'form_errors':
 *       if (isKnownFormErrors(response.errors)) {
 *         Object.entries(response.errors).forEach(([field, messages]) => {
 *           console.log(`Field "${field}" has errors:`, messages);
 *         });
 *       } else {
 *         console.warn('Unknown error format:', response.errors);
 *       }
 *       break;
 *
 *     case 'server_error':
 *       console.error('Server error:', response.error);
 *       break;
 *
 *     case 'redirect':
 *       window.location.href = response.url;
 *       break;
 *   }
 * }
 * ```
 *
 * @example
 * You can plug in a logger like Sentry or just use console.warn for now:
 * ```typescript
 * // Valid structure that returns true:
 * const knownErrors: KnownFormErrors = { username: ['Invalid username'], password: ['Password too weak'] };
 *
 * if (!isKnownFormErrors(response.errors)) {
 *   console.warn('Unexpected validation error shape:', response.errors);
 *   // Optionally report to monitoring service
 * }
 * ```
 * @example
 * // Invalid structures that return false:
 * isKnownFormErrors(null); // false
 * isKnownFormErrors('string'); // false
 * isKnownFormErrors({ field: '
 * @example
 * ```typescript
 * const unknownErrors = { email: ['Required field'], password: ['Too short'] };
 *
 * if (isKnownFormErrors(unknownErrors)) {
 *   // TypeScript now knows unknownErrors is KnownFormErrors
 *   console.log(unknownErrors.email); // string[]
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Invalid structures that return false:
 * isKnownFormErrors(null); // false
 * isKnownFormErrors('string'); // false
 * isKnownFormErrors({ field: 'not an array' }); // false
 * isKnownFormErrors({ field: [123] }); // false - contains non-string
 * ```
 */
export function isKnownFormErrors(errors: unknown): errors is KnownFormErrors {
  return (
    typeof errors === 'object' &&
    errors !== null &&
    Object.values(errors).every(
      (val) =>
        Array.isArray(val) && val.every((msg) => typeof msg === 'string'),
    )
  );
}
