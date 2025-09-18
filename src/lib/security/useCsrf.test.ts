import { renderHook, waitFor } from '@testing-library/react';

import { useCsrfToken } from './useCsrf';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useCsrfToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with correct default values', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useCsrfToken());

      expect(result.current.token).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful token fetch', () => {
    it('should fetch token from j.data.token format', async () => {
      const mockToken = 'csrf-token-12345';
      const mockResponse = {
        data: {
          token: mockToken,
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/security/csrf', {
        credentials: 'include',
      });
    });

    it('should fetch token from j.token format (fallback)', async () => {
      const mockToken = 'csrf-token-67890';
      const mockResponse = {
        token: mockToken,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.error).toBeNull();
    });

    it('should handle response with both data.token and token (data.token takes precedence)', async () => {
      const preferredToken = 'preferred-token';
      const fallbackToken = 'fallback-token';
      const mockResponse = {
        data: {
          token: preferredToken,
        },
        token: fallbackToken,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(preferredToken);
      expect(result.current.error).toBeNull();
    });

    it('should set token to null when neither data.token nor token exists', async () => {
      const mockResponse = {
        message: 'No token available',
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle empty response object', async () => {
      const mockResponse = {};

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle null response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(null),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle fetch network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle JSON parsing error', async () => {
      const jsonError = new Error('Unexpected token in JSON');
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockRejectedValue(jsonError),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBe('Unexpected token in JSON');
    });

    it('should use default error message when error has no message', async () => {
      const errorWithoutMessage = {};
      mockFetch.mockRejectedValueOnce(errorWithoutMessage);

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBe('Failed to fetch CSRF token');
    });

    it('should use default error message when error is null', async () => {
      mockFetch.mockRejectedValueOnce(null);

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBe('Failed to fetch CSRF token');
    });

    it('should handle error with undefined message property', async () => {
      const errorWithUndefinedMessage = { message: undefined };
      mockFetch.mockRejectedValueOnce(errorWithUndefinedMessage);

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.error).toBe('Failed to fetch CSRF token');
    });
  });

  describe('Component unmount cleanup', () => {
    it('should not update state after component unmounts (success case)', async () => {
      const mockToken = 'test-token';
      const mockResponse = { token: mockToken };

      // Create a promise that we can control
      let resolvePromise: (value: { json: () => Promise<unknown> }) => void;
      const controlledPromise = new Promise<{ json: () => Promise<unknown> }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );

      mockFetch.mockReturnValueOnce(controlledPromise);

      const { result, unmount } = renderHook(() => useCsrfToken());

      // Verify initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();

      // Unmount the component before the promise resolves
      unmount();

      // Now resolve the promise
      resolvePromise!({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      // Wait a bit to ensure any potential state updates would have happened
      await new Promise((resolve) => setTimeout(resolve, 10));

      // The state should remain unchanged since component was unmounted
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should not update state after component unmounts (error case)', async () => {
      const error = new Error('Test error');

      // Create a promise that we can control
      let rejectPromise: (error: Error) => void;
      const controlledPromise = new Promise<never>((_, reject) => {
        rejectPromise = reject;
      });

      mockFetch.mockReturnValueOnce(controlledPromise);

      const { result, unmount } = renderHook(() => useCsrfToken());

      // Verify initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();

      // Unmount the component before the promise rejects
      unmount();

      // Now reject the promise
      rejectPromise!(error);

      // Wait a bit to ensure any potential state updates would have happened
      await new Promise((resolve) => setTimeout(resolve, 10));

      // The state should remain unchanged since component was unmounted
      expect(result.current.loading).toBe(true);
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should not update loading state in finally block after unmount', async () => {
      // Create a promise that resolves but we control the timing
      let resolvePromise: (value: { json: () => Promise<unknown> }) => void;
      const controlledPromise = new Promise<{ json: () => Promise<unknown> }>(
        (resolve) => {
          resolvePromise = resolve;
        },
      );

      mockFetch.mockReturnValueOnce(controlledPromise);

      const { result, unmount } = renderHook(() => useCsrfToken());

      // Verify initial loading state
      expect(result.current.loading).toBe(true);

      // Unmount the component
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({
        json: jest.fn().mockResolvedValue({ token: 'test' }),
      });

      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Loading should still be true since component was unmounted before finally block
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Hook behavior', () => {
    it('should only make one fetch request on mount', async () => {
      const mockResponse = { token: 'test-token' };
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/security/csrf', {
        credentials: 'include',
      });
    });

    it('should return values as const tuple', async () => {
      const mockResponse = { token: 'test-token' };
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify the return type structure
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(Object.keys(result.current)).toEqual([
        'token',
        'loading',
        'error',
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should handle response with nested data structure', async () => {
      const mockToken = 'nested-token';
      const mockResponse = {
        data: {
          token: mockToken,
          other: 'data',
        },
        meta: {
          timestamp: '2023-01-01',
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.error).toBeNull();
    });

    it('should handle response with falsy token values', async () => {
      // Test empty string token - falls back to null due to || operator
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ token: '' }),
      });

      const { result: result1 } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      expect(result1.current.token).toBeNull(); // Empty string is falsy, so falls back to null

      // Test zero as token (unlikely but possible) - also falls back to null
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ token: 0 }),
      });

      const { result: result2 } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(result2.current.token).toBeNull(); // Zero is falsy, so falls back to null
    });

    it('should handle response where data exists but data.token is null', async () => {
      const fallbackToken = 'fallback-token';
      const mockResponse = {
        data: {
          token: null,
        },
        token: fallbackToken,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(fallbackToken);
    });

    it('should handle response where data.token is undefined', async () => {
      const fallbackToken = 'fallback-token';
      const mockResponse = {
        data: {
          token: undefined,
        },
        token: fallbackToken,
      };

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useCsrfToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.token).toBe(fallbackToken);
    });
  });
});
