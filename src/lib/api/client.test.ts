/**
 * @fileoverview Tests for API Client
 */

import { createApiClient, ApiError } from './client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbort = jest.fn();
const mockAbortController = {
  abort: mockAbort,
  signal: { aborted: false },
};

Object.defineProperty(global, 'AbortController', {
  writable: true,
  value: jest.fn(() => mockAbortController),
});

describe('ApiError', () => {
  it('should create ApiError with message only', () => {
    const error = new ApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ApiError');
    expect(error.status).toBeUndefined();
    expect(error.response).toBeUndefined();
  });

  it('should create ApiError with status and response', () => {
    const mockResponse = new Response();
    const error = new ApiError('Test error', 404, mockResponse);
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(404);
    expect(error.response).toBe(mockResponse);
  });
});

describe('ApiClient', () => {
  let client: ReturnType<typeof createApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh client instance for each test
    client = createApiClient();
  });

  describe('successful GET request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        status: 'success',
        data: { id: 1, name: 'Test' },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
        baseUrl: '',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: expect.any(Object),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with custom headers', async () => {
      const mockResponse = { status: 'success', data: {} };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await client.get('/test', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        baseUrl: '',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
        method: 'GET',
        signal: expect.any(Object),
      });
    });
  });

  describe('successful POST request', () => {
    it('should make successful POST request with CSRF token', async () => {
      const mockCsrfResponse = {
        data: { token: 'csrf-token-123' },
      };
      const mockResponse = { status: 'success', data: { created: true } };

      // First call for CSRF token
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        // Second call for actual POST
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      const result = await client.post('/create', { name: 'Test Item' });

      // Should call CSRF endpoint first
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/security/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      // Then call actual endpoint with CSRF token
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/create', {
        baseUrl: '',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'csrf-token-123',
        },
        method: 'POST',
        body: JSON.stringify({ name: 'Test Item' }),
        signal: expect.any(Object),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without body', async () => {
      const mockCsrfResponse = { data: { token: 'csrf-token' } };
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.post('/action');

      expect(mockFetch).toHaveBeenNthCalledWith(2, '/action', {
        baseUrl: '',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': 'csrf-token',
        },
        method: 'POST',
        body: undefined,
        signal: expect.any(Object),
      });
    });
  });

  describe('CSRF token handling', () => {
    it('should cache CSRF token for multiple requests', async () => {
      const mockCsrfResponse = { data: { token: 'cached-token' } };
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      // Make two POST requests
      await client.post('/first');
      await client.post('/second');

      // CSRF should only be fetched once
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/security/csrf', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should handle CSRF token fetch failure', async () => {
      const mockResponse = { status: 'success' };

      // CSRF fetch fails
      mockFetch
        .mockRejectedValueOnce(new Error('CSRF fetch failed'))
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.post('/test');

      // Should still make the POST request without CSRF token
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/test', {
        baseUrl: '',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: undefined,
        signal: expect.any(Object),
      });
    });

    it('should handle alternative CSRF response format', async () => {
      const mockCsrfResponse = { token: 'alt-token' }; // Different format
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.post('/test');

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-csrf-token': 'alt-token',
          }),
        }),
      );
    });
  });

  describe('request timeout handling', () => {
    it('should timeout after specified duration', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      const result = await client.get('/slow-endpoint', { timeout: 5000 });

      expect(result).toEqual({
        status: 'server_error',
        error: 'Request timeout',
      });
    });

    it('should use default timeout configuration', async () => {
      const mockResponse = { status: 'success', data: {} };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.get('/endpoint');

      // Should use default timeout
      expect(result).toEqual(mockResponse);
    });
  });

  describe('network error handling', () => {
    it('should handle fetch network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await client.get('/failing-endpoint');

      expect(result).toEqual({
        status: 'server_error',
        error: 'Network error',
      });
    });

    it('should handle ApiError instances', async () => {
      const apiError = new ApiError('Custom API error', 500);
      mockFetch.mockRejectedValueOnce(apiError);

      const result = await client.get('/api-error');

      expect(result).toEqual({
        status: 'server_error',
        error: 'Custom API error',
      });
    });

    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await client.get('/strange-error');

      expect(result).toEqual({
        status: 'server_error',
        error: 'Unknown error occurred',
      });
    });
  });

  describe('invalid JSON response', () => {
    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await client.get('/invalid-json');

      expect(result).toEqual({
        status: 'server_error',
        error: 'Invalid JSON response from server',
      });
    });
  });

  describe('custom config creation', () => {
    it('should create client with custom configuration', () => {
      const customClient = createApiClient({
        baseUrl: 'https://api.example.com',
        timeout: 30000,
        headers: { 'X-Custom': 'header' },
      });

      expect(customClient).toBeInstanceOf(Object);
      expect(customClient).toBeDefined();
    });

    it('should use custom base URL in requests', async () => {
      const customClient = createApiClient({
        baseUrl: 'https://custom.api.com',
      });

      const mockResponse = { status: 'success' };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await customClient.get('/endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/endpoint',
        expect.any(Object),
      );
    });
  });

  describe('mutating vs non-mutating', () => {
    it('should not add CSRF token to GET requests', async () => {
      const mockResponse = { status: 'success' };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await client.get('/data');

      expect(mockFetch).toHaveBeenCalledWith(
        '/data',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'x-csrf-token': expect.anything(),
          }),
        }),
      );

      // Should not call CSRF endpoint
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should add CSRF token to PUT requests', async () => {
      const mockCsrfResponse = { data: { token: 'put-token' } };
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.put('/update', { id: 1 });

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/update',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-csrf-token': 'put-token',
          }),
          method: 'PUT',
        }),
      );
    });

    it('should add CSRF token to PATCH requests', async () => {
      const mockCsrfResponse = { data: { token: 'patch-token' } };
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.patch('/partial-update', { field: 'value' });

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/partial-update',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-csrf-token': 'patch-token',
          }),
          method: 'PATCH',
        }),
      );
    });

    it('should add CSRF token to DELETE requests', async () => {
      const mockCsrfResponse = { data: { token: 'delete-token' } };
      const mockResponse = { status: 'success' };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockCsrfResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

      await client.delete('/remove/1');

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/remove/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-csrf-token': 'delete-token',
          }),
          method: 'DELETE',
        }),
      );
    });
  });

  describe('All HTTP methods', () => {
    beforeEach(() => {
      // Mock CSRF token for mutating requests
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: { token: 'test-token' } }),
      });
    });

    it('should handle PUT with data serialization', async () => {
      const testData = { name: 'Updated' };
      await client.put('/item/1', testData);

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/item/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        }),
      );
    });

    it('should handle PATCH with data serialization', async () => {
      const testData = { status: 'active' };
      await client.patch('/item/1', testData);

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/item/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(testData),
        }),
      );
    });

    it('should handle DELETE without body', async () => {
      await client.delete('/item/1');

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/item/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});
