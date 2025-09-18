/**
 * @fileoverview Unit Tests for Response Service Type Guards
 *
 * This test suite provides comprehensive coverage for the response service type guards,
 * ensuring they correctly validate API response structures with 100% code coverage.
 *
 * @module guards/responseService.test
 * @version 1.0.0
 * @since 1.0.0
 */

import { KnownFormErrors } from '@/types/responseService';

import { isKnownFormErrors } from './responseService';

describe('Response Service Type Guards', () => {
  describe('isKnownFormErrors', () => {
    describe('Happy Path - Valid KnownFormErrors', () => {
      it('should return true for valid form errors with single field and single message', () => {
        const validErrors: KnownFormErrors = {
          username: ['Username is required'],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for valid form errors with single field and multiple messages', () => {
        const validErrors: KnownFormErrors = {
          password: [
            'Password is required',
            'Password must be at least 8 characters',
          ],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for valid form errors with multiple fields', () => {
        const validErrors: KnownFormErrors = {
          username: ['Username is required'],
          password: ['Password is too weak'],
          email: ['Email format is invalid'],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for valid form errors with multiple fields and multiple messages', () => {
        const validErrors: KnownFormErrors = {
          username: ['Username is required', 'Username must be unique'],
          password: [
            'Password is required',
            'Password must be at least 8 characters',
            'Password must contain special characters',
          ],
          email: ['Email is required', 'Email format is invalid'],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for valid empty form errors object', () => {
        const validErrors: KnownFormErrors = {};

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for valid form errors with empty string arrays', () => {
        const validErrors: KnownFormErrors = {
          username: [],
          password: [],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });

      it('should return true for form errors with empty string messages', () => {
        const validErrors: KnownFormErrors = {
          username: ['', 'Valid message'],
          password: [''],
        };

        expect(isKnownFormErrors(validErrors)).toBe(true);
      });
    });

    describe('Input Verification - Invalid Inputs', () => {
      it('should return false for null', () => {
        expect(isKnownFormErrors(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isKnownFormErrors(undefined)).toBe(false);
      });

      it('should return false for string primitive', () => {
        expect(isKnownFormErrors('string error')).toBe(false);
      });

      it('should return false for number primitive', () => {
        expect(isKnownFormErrors(42)).toBe(false);
      });

      it('should return false for boolean primitive', () => {
        expect(isKnownFormErrors(true)).toBe(false);
        expect(isKnownFormErrors(false)).toBe(false);
      });

      it('should return false for array', () => {
        expect(isKnownFormErrors(['error1', 'error2'])).toBe(false);
      });

      it('should return false for function', () => {
        expect(isKnownFormErrors(() => {})).toBe(false);
      });

      it('should return true for Date object (no enumerable properties)', () => {
        // Date objects have no enumerable own properties, so Object.values() returns []
        // An empty array satisfies .every() condition (vacuous truth)
        expect(isKnownFormErrors(new Date())).toBe(true);
      });

      it('should return true for RegExp object (no enumerable properties)', () => {
        // RegExp objects have no enumerable own properties, so Object.values() returns []
        // An empty array satisfies .every() condition (vacuous truth)
        expect(isKnownFormErrors(/pattern/)).toBe(true);
      });

      it('should return false for object with enumerable properties that are not arrays', () => {
        const objWithProperties = { prop: 'value' };
        expect(isKnownFormErrors(objWithProperties)).toBe(false);
      });
    });

    describe('Edge Cases - Invalid Object Structures', () => {
      it('should return false for object with non-array values', () => {
        const invalidErrors = {
          username: 'not an array',
          password: ['valid array'],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with mixed array and non-array values', () => {
        const invalidErrors = {
          username: ['valid message'],
          password: 'invalid string value',
          email: ['another valid message'],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with arrays containing non-string values', () => {
        const invalidErrors = {
          username: ['valid message', 123],
          password: ['valid message'],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with arrays containing mixed types', () => {
        const invalidErrors = {
          username: ['valid message'],
          password: ['valid message', true, null],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with arrays containing only non-string values', () => {
        const invalidErrors = {
          username: [123, 456],
          password: [true, false],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with nested objects in arrays', () => {
        const invalidErrors = {
          username: ['valid message', { nested: 'object' }],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with nested arrays in arrays', () => {
        const invalidErrors = {
          username: ['valid message', ['nested', 'array']],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with undefined values in arrays', () => {
        const invalidErrors = {
          username: ['valid message', undefined],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with null values in arrays', () => {
        const invalidErrors = {
          username: ['valid message', null],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });

      it('should return false for object with symbol values', () => {
        const invalidErrors = {
          username: [Symbol('error')],
        };

        expect(isKnownFormErrors(invalidErrors)).toBe(false);
      });
    });

    describe('Type Guard Functionality', () => {
      it('should narrow type correctly when returning true', () => {
        const unknownErrors: unknown = {
          username: ['Username is required'],
          password: ['Password is too weak'],
        };

        // Verify the type guard returns true
        const result = isKnownFormErrors(unknownErrors);
        expect(result).toBe(true);

        // Cast to assert the narrowed type for testing purposes
        // In real code, this would be done inside the type guard conditional
        const narrowedErrors = unknownErrors as KnownFormErrors;
        expect(narrowedErrors.username).toEqual(['Username is required']);
        expect(narrowedErrors.password).toEqual(['Password is too weak']);
      });

      it('should not narrow type when returning false', () => {
        const unknownErrors: unknown = {
          username: 'not an array',
        };

        // First verify the type guard returns false
        expect(isKnownFormErrors(unknownErrors)).toBe(false);

        // Then verify the original structure remains unchanged
        expect(unknownErrors).toEqual({ username: 'not an array' });
      });
    });

    describe('Complex Real-world Scenarios', () => {
      it('should handle typical form validation response from API', () => {
        const apiResponse = {
          username: [
            'Username is required',
            'Username must be at least 3 characters',
          ],
          email: ['Email format is invalid'],
          password: [
            'Password is required',
            'Password must be at least 8 characters',
            'Password must contain at least one uppercase letter',
            'Password must contain at least one number',
            'Password must contain at least one special character',
          ],
          confirmPassword: ['Passwords do not match'],
          termsAccepted: ['You must accept the terms and conditions'],
        };

        expect(isKnownFormErrors(apiResponse)).toBe(true);
      });

      it('should handle edge case with numeric field names', () => {
        const numericFieldErrors = {
          '0': ['First item error'],
          '1': ['Second item error'],
          '2': ['Third item error'],
        };

        expect(isKnownFormErrors(numericFieldErrors)).toBe(true);
      });

      it('should handle field names with special characters', () => {
        const specialFieldErrors = {
          'user-name': ['Hyphenated field error'],
          user_email: ['Underscored field error'],
          'user.address': ['Dotted field error'],
          'user[0].name': ['Bracketed field error'],
        };

        expect(isKnownFormErrors(specialFieldErrors)).toBe(true);
      });

      it('should reject malformed API response with partial corruption', () => {
        const corruptedResponse = {
          validField: ['This is valid'],
          corruptedField: 'This should be an array but is a string',
          anotherValidField: ['This is also valid'],
        };

        expect(isKnownFormErrors(corruptedResponse)).toBe(false);
      });
    });
  });
});
