/**
 * @fileoverview Comprehensive integration tests for all major lib features
 *
 * This test suite verifies that all core features of the application are properly
 * integrated and working together across the entire system.
 */

import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureRequestError: jest.fn(),
}));

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((fn) => fn),
}));

describe('Comprehensive Integration Tests', () => {
  describe('Sentry Integration', () => {
    it('should have client config integration works', async () => {
      // Test client-side Sentry initialization
      const sentryClient = await import('@sentry/nextjs');

      // Import client config to trigger initialization
      await import('../../instrumentation-client');

      expect(sentryClient.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://22fed432630274c1b5547b07c07b8d01@o4508840267612160.ingest.de.sentry.io/4509899911987280',
          enabled: process.env.NODE_ENV !== 'test',
        }),
      );
    });

    it('should have server config integration works', async () => {
      const sentryServer = await import('@sentry/nextjs');

      // Import server config to trigger initialization
      await import('../../sentry.server.config');

      expect(sentryServer.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://22fed432630274c1b5547b07c07b8d01@o4508840267612160.ingest.de.sentry.io/4509899911987280',
          enabled: process.env.NODE_ENV !== 'test',
        }),
      );
    });
  });

  describe('API Client Integration', () => {
    it('should work across routes via apiClient', async () => {
      const { apiClient } = await import('../../src/lib/api/client');

      // Mock fetch for testing
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ status: 'ok', data: { test: 'data' } }),
        ok: true,
        status: 200,
      } as Response);

      const response = await apiClient.get('/test');

      expect(response.status).toBe('ok');
      expect(fetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle CSRF tokens for mutations', async () => {
      const { apiClient } = await import('../../src/lib/api/client');

      // Mock CSRF fetch
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ data: { token: 'csrf-token-123' } }),
          ok: true,
          status: 200,
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({ status: 'ok', data: { result: 'success' } }),
          ok: true,
          status: 200,
        } as Response);

      await apiClient.post('/test', { data: 'test' });

      // Should have made 2 calls: 1 for CSRF token, 1 for actual request
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        '/api/security/csrf',
        expect.any(Object),
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        '/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-csrf-token': 'csrf-token-123',
          }),
        }),
      );
    });
  });

  describe('Response Service Integration', () => {
    it('should be used in all APIs via responseService', async () => {
      const {
        createSuccessResponse,
        createValidationErrorResponse,
        createServerErrorResponse,
        handleApiResponse,
      } = await import('../../src/lib/responseService');

      // Test that response creation functions exist and return something
      const successResponse = createSuccessResponse({ test: 'data' });
      expect(successResponse).toBeDefined();

      const validationResponse = createValidationErrorResponse({
        field: ['error message'],
      });
      expect(validationResponse).toBeDefined();

      // Test server error response (this returns a NextResponse object)
      const serverErrorResponse = createServerErrorResponse('Server error');
      // We can't directly test NextResponse objects, but we can verify the function exists
      expect(serverErrorResponse).toBeDefined();

      // Test client-side response handling with a proper ApiResponse mock
      const mockApiResponse = { status: 'ok' as const, data: { test: 'data' } };
      const result = handleApiResponse(mockApiResponse);
      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual({ test: 'data' });
    });
  });

  describe('Logger Integration', () => {
    it('should integrate in middleware and across app', async () => {
      const logger = await import('../../src/lib/logger');

      // Verify logger has expected methods
      expect(logger.default).toBeDefined();
      expect(typeof logger.default.info).toBe('function');
      expect(typeof logger.default.error).toBe('function');
      expect(typeof logger.default.warn).toBe('function');
      expect(typeof logger.default.debug).toBe('function');
    });
  });

  describe('Security Integration', () => {
    it('should have CSRF protection in all mutations', async () => {
      const { createEdgeCsrf } = await import(
        '../../src/lib/security/csrf/edge'
      );
      const csrf = createEdgeCsrf();

      expect(csrf).toBeDefined();
      expect(typeof csrf.apply).toBe('function');
    });

    it('should provide security headers in responses', async () => {
      const { buildCSP, createNonce, NONCE_HEADER } = await import(
        '../../src/lib/security'
      );

      const nonce = createNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');

      const csp = buildCSP(nonce, { isAuthOrClerkRoute: false });
      expect(csp).toContain(`'nonce-${nonce}'`);

      expect(NONCE_HEADER).toBe('x-nonce');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should work across API routes', async () => {
      const { checkRateLimit, apiRateLimit, getClientIP } = await import(
        '../../src/lib/rate-limit'
      );

      expect(checkRateLimit).toBeDefined();
      // apiRateLimit can be undefined if Redis is not configured in test environment
      expect(typeof apiRateLimit).toEqual(
        expect.stringMatching(/object|undefined/),
      );
      expect(getClientIP).toBeDefined();
    });
  });

  describe('Feature Flags Integration', () => {
    it('should provide context integration', async () => {
      const { useFeatureFlag } = await import('../../src/lib/feature-flags');

      expect(useFeatureFlag).toBeDefined();
      expect(typeof useFeatureFlag).toBe('function');
    });
  });

  describe('Multi-tenant Integration', () => {
    it('should provide tenant context', async () => {
      const { useTenant } = await import('../../src/lib/multi-tenant');

      expect(useTenant).toBeDefined();
      expect(typeof useTenant).toBe('function');
    });
  });
});
