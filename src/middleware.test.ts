/**
 * Unit tests for Next.js middleware
 * Tests security headers, CSRF protection, rate limiting, and tenant handling
 */
// import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';

// Mock all dependencies before importing middleware
jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((handler) => async (request: NextRequest) => {
    // Call handler with mock auth
    return await handler({ userId: 'test-user-123' }, request);
  }),
}));
jest.mock('@/lib/multi-tenant/middleware');
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/rate-limit-local');
jest.mock('@/lib/security', () => ({
  NONCE_HEADER: 'x-nonce',
  buildCSP: jest.fn(),
  createNonce: jest.fn(),
}));
jest.mock('@/lib/security/csrf/edge');

import { createTenantMiddleware } from '@/lib/multi-tenant/middleware';
import { apiRateLimit, checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { localRateLimit } from '@/lib/rate-limit-local';
import { buildCSP, createNonce } from '@/lib/security';
import { defaultCsrfConfig } from '@/lib/security/csrf/config';
import { createEdgeCsrf } from '@/lib/security/csrf/edge';

// Create mock implementations with proper types
const mockTenantMiddleware = jest.fn().mockReturnValue(new NextResponse());
const mockCsrfApply = jest.fn().mockResolvedValue(new NextResponse());
// const mockAuth = { userId: 'test-user-123' };

// const mockedClerkMiddleware = jest.mocked(clerkMiddleware);
const mockedCreateTenantMiddleware = jest.mocked(createTenantMiddleware);
const mockedCreateEdgeCsrf = jest.mocked(createEdgeCsrf);
const mockedCreateNonce = jest.mocked(createNonce);
const mockedBuildCSP = jest.mocked(buildCSP);
const mockedGetClientIP = jest.mocked(getClientIP);
const mockedCheckRateLimit = jest.mocked(checkRateLimit);
const mockedLocalRateLimit = jest.mocked(localRateLimit);

describe('Middleware', () => {
  let mockRequest: NextRequest;
  let mockEvent: NextFetchEvent;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = process.env;

    // Reset all mocks
    jest.clearAllMocks();

    // Set up default mock implementations
    // clerkMiddleware is already mocked in the jest.mock call above

    mockedCreateTenantMiddleware.mockReturnValue(mockTenantMiddleware);
    mockedCreateEdgeCsrf.mockReturnValue({
      apply: mockCsrfApply,
      issueForRoute: jest.fn().mockResolvedValue(new NextResponse()),
      config: defaultCsrfConfig(),
    });
    mockedCreateNonce.mockReturnValue('test-nonce-123');
    mockedBuildCSP.mockReturnValue(
      "default-src 'self'; script-src 'nonce-test-nonce-123'",
    );
    mockedGetClientIP.mockReturnValue('127.0.0.1');
    mockedCheckRateLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: new Date(Date.now() + 60000),
    });
    mockedLocalRateLimit.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: new Date(Date.now() + 5000),
    });

    // Default tenant middleware response
    mockTenantMiddleware.mockReturnValue(
      new NextResponse(null, {
        headers: { 'x-tenant-id': 'test-tenant' },
      }),
    );

    // Default CSRF response (pass through) - should preserve existing response
    mockCsrfApply.mockImplementation(async (_request, response) => {
      // Return the same response object to preserve headers
      return response;
    });

    // Create mock request and event
    mockRequest = new NextRequest('https://example.com/test', {
      method: 'GET',
      headers: {
        'user-agent': 'test-agent',
        origin: 'https://example.com',
      },
    });

    // Mock NextFetchEvent with proper typing
    mockEvent = {
      waitUntil: jest.fn(),
    } as unknown as NextFetchEvent;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('CORS preflight handling', () => {
    it('should handle OPTIONS requests with proper CORS headers', async () => {
      const optionsRequest = new NextRequest('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-headers': 'content-type,authorization',
        },
      });

      // Import middleware after mocks are set up
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        optionsRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://example.com',
      );
      expect(response.headers.get('Vary')).toBe('Origin');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'content-type,authorization',
      );
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
        'true',
      );
    });

    it('should handle OPTIONS requests without origin header', async () => {
      const optionsRequest = new NextRequest('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: {},
      });

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        optionsRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('*');
    });
  });

  describe('Route detection', () => {
    it('should correctly identify auth routes', async () => {
      const authPaths = [
        '/sign-in',
        '/sign-up',
        '/api/auth/callback',
        '/dashboard/clerk-webhook',
      ];

      for (const path of authPaths) {
        const request = new NextRequest(`https://example.com${path}`);
        const middleware = (await import('./middleware')).default;
        await middleware(request, mockEvent);

        expect(mockedBuildCSP).toHaveBeenCalledWith('test-nonce-123', {
          isAuthOrClerkRoute: true,
        });
      }
    });

    it('should correctly identify non-auth routes', async () => {
      const nonAuthPaths = ['/dashboard', '/api/users', '/settings'];

      for (const path of nonAuthPaths) {
        const request = new NextRequest(`https://example.com${path}`);
        const middleware = (await import('./middleware')).default;
        await middleware(request, mockEvent);

        expect(mockedBuildCSP).toHaveBeenCalledWith('test-nonce-123', {
          isAuthOrClerkRoute: false,
        });
      }
    });
  });

  describe('Nonce generation and CSP', () => {
    it('should generate nonce and build CSP for each request', async () => {
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        mockRequest,
        mockEvent,
      )) as NextResponse;

      expect(mockedCreateNonce).toHaveBeenCalledTimes(1);
      expect(mockedBuildCSP).toHaveBeenCalledWith('test-nonce-123', {
        isAuthOrClerkRoute: false,
      });
      expect(response.headers.get('x-nonce')).toBe('test-nonce-123');
      expect(response.headers.get('Content-Security-Policy')).toBe(
        "default-src 'self'; script-src 'nonce-test-nonce-123'",
      );
    });
  });

  describe('Tenant middleware integration', () => {
    it('should apply tenant middleware and merge headers', async () => {
      mockTenantMiddleware.mockReturnValue(
        new NextResponse(null, {
          headers: {
            'x-tenant-id': 'test-tenant',
            'x-tenant-domain': 'test.example.com',
            'other-header': 'should-not-be-copied',
          },
        }),
      );

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        mockRequest,
        mockEvent,
      )) as NextResponse;

      expect(mockTenantMiddleware).toHaveBeenCalledWith(mockRequest);
      expect(response.headers.get('x-tenant-id')).toBe('test-tenant');
      expect(response.headers.get('x-tenant-domain')).toBe('test.example.com');
      expect(response.headers.get('other-header')).toBeNull();
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      // Ensure rate limiting is not disabled
      delete process.env.DISABLE_RATE_LIMITING;
      delete process.env.TEST_LOCAL_RATE_LIMIT;

      const apiRequest = new NextRequest('https://example.com/api/users');

      const middleware = (await import('./middleware')).default;
      await middleware(apiRequest, mockEvent);

      expect(mockedGetClientIP).toHaveBeenCalledWith(apiRequest);
      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        apiRateLimit,
        '127.0.0.1',
      );
    });

    it('should skip rate limiting for Clerk auth routes', async () => {
      const authRequest = new NextRequest(
        'https://example.com/api/auth/callback',
      );

      const middleware = (await import('./middleware')).default;
      await middleware(authRequest, mockEvent);

      expect(mockedGetClientIP).not.toHaveBeenCalled();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should skip rate limiting for Clerk routes', async () => {
      const clerkRequest = new NextRequest(
        'https://example.com/api/clerk-webhook',
      );

      const middleware = (await import('./middleware')).default;
      await middleware(clerkRequest, mockEvent);

      expect(mockedGetClientIP).not.toHaveBeenCalled();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should skip rate limiting for non-API routes', async () => {
      const pageRequest = new NextRequest('https://example.com/dashboard');

      const middleware = (await import('./middleware')).default;
      await middleware(pageRequest, mockEvent);

      expect(mockedGetClientIP).not.toHaveBeenCalled();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Ensure rate limiting is not disabled
      delete process.env.DISABLE_RATE_LIMITING;
      delete process.env.TEST_LOCAL_RATE_LIMIT;

      const resetDate = new Date(Date.now() + 30000);
      mockedCheckRateLimit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetDate,
      });

      const apiRequest = new NextRequest('https://example.com/api/users');
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        apiRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.status).toBe(429);

      const body = await response.json();
      expect(body).toEqual({
        error: 'Rate limit exceeded',
        message: 'Too many requests',
      });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        resetDate.getTime().toString(),
      );
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should use local rate limiting when TEST_LOCAL_RATE_LIMIT is set', async () => {
      // Ensure rate limiting is not disabled, but enable local rate limiting
      delete process.env.DISABLE_RATE_LIMITING;
      process.env.TEST_LOCAL_RATE_LIMIT = '1';

      mockedLocalRateLimit.mockReturnValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: new Date(Date.now() + 5000),
      });

      const apiRequest = new NextRequest('https://example.com/api/users');
      const middleware = (await import('./middleware')).default;
      await middleware(apiRequest, mockEvent);

      expect(mockedLocalRateLimit).toHaveBeenCalledWith('127.0.0.1');
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should skip rate limiting when DISABLE_RATE_LIMITING is true', async () => {
      process.env.DISABLE_RATE_LIMITING = 'true';

      const apiRequest = new NextRequest('https://example.com/api/users');
      const middleware = (await import('./middleware')).default;
      await middleware(apiRequest, mockEvent);

      expect(mockedGetClientIP).not.toHaveBeenCalled();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should soft-fail rate limiting on errors', async () => {
      // Ensure rate limiting is not disabled
      delete process.env.DISABLE_RATE_LIMITING;
      delete process.env.TEST_LOCAL_RATE_LIMIT;

      // Import edge logger (which is used in middleware) to get the mocked version
      const edgeLogger = (await import('@/lib/logger/edge')).default;
      const loggerSpy = jest.spyOn(edgeLogger, 'warn').mockImplementation();
      const error = new Error('Redis connection failed');
      mockedCheckRateLimit.mockRejectedValue(error);

      const apiRequest = new NextRequest('https://example.com/api/users');
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        apiRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.status).not.toBe(429);
      expect(loggerSpy).toHaveBeenCalledWith(
        {
          error,
          clientIP: '127.0.0.1',
          pathname: '/api/users',
        },
        '[rate-limit] Soft-failed',
      );

      loggerSpy.mockRestore();
    });
  });

  describe('CSRF protection', () => {
    it('should apply CSRF protection', async () => {
      const middleware = (await import('./middleware')).default;
      (await middleware(mockRequest, mockEvent)) as NextResponse;

      expect(mockCsrfApply).toHaveBeenCalledWith(
        mockRequest,
        expect.any(NextResponse),
      );
    });

    it('should return CSRF blocked response when status is 403', async () => {
      const csrfBlockedResponse = NextResponse.json(
        { error: 'CSRF token invalid' },
        { status: 403 },
      );
      mockCsrfApply.mockResolvedValue(csrfBlockedResponse);

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        mockRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.status).toBe(403);
    });
  });

  describe('Security headers', () => {
    it('should set global security headers', async () => {
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        mockRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.headers.get('Content-Security-Policy')).toBe(
        "default-src 'self'; script-src 'nonce-test-nonce-123'",
      );
      expect(response.headers.get('x-nonce')).toBe('test-nonce-123');
      expect(response.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should set additional security headers for auth routes', async () => {
      const authRequest = new NextRequest('https://example.com/sign-in');

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        authRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=()',
      );
    });

    it('should not set auth-specific headers for non-auth routes', async () => {
      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        mockRequest,
        mockEvent,
      )) as NextResponse;

      expect(response.headers.get('X-Frame-Options')).toBeNull();
      expect(response.headers.get('Permissions-Policy')).toBeNull();
    });
  });

  describe('Request header forwarding', () => {
    it('should forward nonce in request headers for server components', async () => {
      const middleware = (await import('./middleware')).default;

      // Mock NextResponse.next to capture the forwarded headers
      const mockNext = jest
        .spyOn(NextResponse, 'next')
        .mockReturnValue(new NextResponse(null, { status: 200 }));

      await middleware(mockRequest, mockEvent);

      expect(mockNext).toHaveBeenCalledWith({
        request: {
          headers: expect.any(Headers),
        },
      });

      mockNext.mockRestore();
    });
  });

  describe('Middleware config', () => {
    it('should export correct matcher configuration', async () => {
      const { config } = await import('./middleware');

      expect(config.matcher).toHaveLength(2);
      expect(config.matcher[0]).toContain('_next');
      expect(config.matcher[1]).toBe('/(api|trpc)(.*)');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete middleware pipeline for API route', async () => {
      // Ensure rate limiting is not disabled for this integration test
      delete process.env.DISABLE_RATE_LIMITING;
      delete process.env.TEST_LOCAL_RATE_LIMIT;

      const apiRequest = new NextRequest('https://example.com/api/users', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
      });

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        apiRequest,
        mockEvent,
      )) as NextResponse;

      // Verify all middleware components were called
      expect(mockedCreateNonce).toHaveBeenCalled();
      expect(mockedBuildCSP).toHaveBeenCalled();
      expect(mockTenantMiddleware).toHaveBeenCalled();
      expect(mockedGetClientIP).toHaveBeenCalled();
      expect(mockedCheckRateLimit).toHaveBeenCalled();
      expect(mockCsrfApply).toHaveBeenCalled();

      // Verify security headers are set
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('x-nonce')).toBeDefined();
      expect(response.headers.get('Referrer-Policy')).toBeDefined();
      expect(response.headers.get('X-Content-Type-Options')).toBeDefined();
    });

    it('should handle auth route with all protections', async () => {
      const authRequest = new NextRequest('https://example.com/sign-in', {
        method: 'GET',
      });

      const middleware = (await import('./middleware')).default;
      const response = (await middleware(
        authRequest,
        mockEvent,
      )) as NextResponse;

      // Should not apply rate limiting for auth routes
      expect(mockedGetClientIP).not.toHaveBeenCalled();

      // Should apply auth-specific headers
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=()',
      );

      // Should still apply general security headers
      expect(response.headers.get('Content-Security-Policy')).toBeDefined();
      expect(response.headers.get('x-nonce')).toBeDefined();
    });
  });
});
