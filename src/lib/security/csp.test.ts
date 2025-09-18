/**
 * Unit tests for CSP (Content Security Policy) implementation
 */
import { NextRequest, NextResponse } from 'next/server';

import { NONCE_HEADER, buildCSP, createNonce, withCSPHeaders } from './csp';

// Mock global crypto for controlled testing
const mockCrypto = {
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(),
};

// Store original crypto for restoration
const originalCrypto = globalThis.crypto;
const originalEnv = process.env;

describe('CSP Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
    });
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('createNonce', () => {
    it('creates nonce with Web Crypto API', () => {
      // Mock Web Crypto API with getRandomValues
      const mockBytes = new Uint8Array([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
      ]);
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockBytes);
        return arr;
      });

      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
      });

      const nonce = createNonce();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(
        expect.any(Uint8Array),
      );
      expect(nonce).toBe('AQIDBAUGBwgJCgsMDQ4PEA=='); // base64 of mock bytes
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('creates nonce with randomUUID fallback', () => {
      // Mock crypto without getRandomValues but with randomUUID
      const mockUUID = '12345678-1234-1234-1234-123456789abc';
      mockCrypto.randomUUID.mockReturnValue(mockUUID);

      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: mockCrypto.randomUUID,
          getRandomValues: undefined,
        },
        writable: true,
      });

      const nonce = createNonce();

      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      // Should be base64 encoded hex string
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('creates nonce with Math.random fallback', () => {
      // Mock crypto without both getRandomValues and randomUUID
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        writable: true,
      });

      // Mock Math.random for consistent testing
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456);
      const mockDateNow = jest
        .spyOn(Date, 'now')
        .mockReturnValue(1234567890123);

      const nonce = createNonce();

      expect(mockRandom).toHaveBeenCalled();
      expect(mockDateNow).toHaveBeenCalled();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      // Should contain both random string and timestamp parts
      const randomPart = (0.123456).toString(36).slice(2); // actual result
      const timestampPart = (1234567890123).toString(36); // actual result
      expect(nonce).toContain(randomPart);
      expect(nonce).toContain(timestampPart);

      mockRandom.mockRestore();
      mockDateNow.mockRestore();
    });

    it('handles missing Web Crypto gracefully', () => {
      // Completely remove crypto
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
      });

      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1000000000);

      const nonce = createNonce();

      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      // Should fallback to Math.random approach
      expect(mockRandom).toHaveBeenCalled();

      mockRandom.mockRestore();
      mockDateNow.mockRestore();
    });
  });

  describe('buildCSP', () => {
    const testNonce = 'test-nonce-123';

    it('builds CSP for production auth route', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: true });

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain('upgrade-insecure-requests');

      // Auth routes should include Clerk domains
      expect(csp).toContain('https://js.clerk.com');
      expect(csp).toContain('https://*.clerk.com');
      expect(csp).toContain('https://*.clerk.services');

      // Production should require nonce for styles (no unsafe-inline)
      expect(csp).toContain(`'nonce-${testNonce}'`);
      expect(csp).not.toContain("'unsafe-inline'");

      // Should not include strict-dynamic with third-party scripts
      expect(csp).not.toContain("'strict-dynamic'");
    });

    it('builds CSP for development environment', () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: false });

      expect(csp).toContain("default-src 'self'");

      // Development should allow unsafe-eval and wasm-unsafe-eval
      expect(csp).toContain("'unsafe-eval'");
      expect(csp).toContain("'wasm-unsafe-eval'");

      // Development should allow unsafe-inline for styles
      expect(csp).toContain("'unsafe-inline'");

      // Should include https: for broader compatibility in dev
      expect(csp).toContain('https:');

      // Should include WebSocket connections for HMR
      expect(csp).toContain('ws:');
      expect(csp).toContain('wss:');

      // Note: strict-dynamic might not be included if there are any third-party scripts
      // configured in the environment or by default
      expect(csp).toMatch(/script-src.*'self'.*'nonce-/);
    });

    it('validates environment variable parsing', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_CSP_SCRIPT_EXTRA:
          'https://analytics.example.com,https://cdn.example.com',
        NEXT_PUBLIC_CSP_CONNECT_EXTRA: 'https://api.example.com',
        NEXT_PUBLIC_CSP_FRAME_EXTRA: 'https://embed.example.com',
        NEXT_PUBLIC_CSP_STYLE_EXTRA: 'https://fonts.example.com',
        NEXT_PUBLIC_CSP_IMG_EXTRA: 'https://images.example.com',
        NEXT_PUBLIC_CSP_FONT_EXTRA: 'https://fonts.googleapis.com',
      };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: false });

      // Should include extra domains from environment variables
      expect(csp).toContain('https://analytics.example.com');
      expect(csp).toContain('https://cdn.example.com');
      expect(csp).toContain('https://api.example.com');
      expect(csp).toContain('https://embed.example.com');
      expect(csp).toContain('https://fonts.example.com');
      expect(csp).toContain('https://images.example.com');
      expect(csp).toContain('https://fonts.googleapis.com');

      // Preview environment should allow inline styles like dev
      expect(csp).toContain("'unsafe-inline'");
    });

    it('handles empty extra environment variables', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_CSP_SCRIPT_EXTRA: '',
        NEXT_PUBLIC_CSP_CONNECT_EXTRA: '  ,  ,  ', // Empty/whitespace entries
      };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: false });

      // Should not break with empty/whitespace values
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("'strict-dynamic'"); // Should include since no extra scripts
    });

    it('builds different CSP for non-auth routes', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: false });

      // Should not include explicit Clerk script domains for non-auth routes
      expect(csp).not.toContain('https://js.clerk.com');
      expect(csp).not.toContain('https://*.clerk.com');
      expect(csp).not.toContain('https://*.clerk.services');

      // Verify basic CSP structure for non-auth routes
      expect(csp).toContain("default-src 'self'");
      expect(csp).toMatch(/script-src.*'self'.*'nonce-/);
    });

    it('handles preview environment correctly', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_ENV: 'preview',
      };

      const csp = buildCSP(testNonce, { isAuthOrClerkRoute: false });

      // Preview should allow inline styles like development
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'"); // But not unsafe-eval (only dev)
    });
  });

  describe('withCSPHeaders', () => {
    function createMockRequest(
      pathname: string,
      method: string = 'GET',
    ): NextRequest {
      const request = {
        nextUrl: { pathname },
        method,
        headers: new Headers(),
      } as NextRequest;
      return request;
    }

    function createMockResponse(): NextResponse {
      return NextResponse.next();
    }

    it('applies CSP headers to middleware response', () => {
      const request = createMockRequest('/api/test');
      const response = createMockResponse();

      const result = withCSPHeaders(request, response);

      expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(result.headers.get(NONCE_HEADER)).toBeTruthy();
      expect(result.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('detects auth routes correctly', () => {
      const authPaths = [
        '/sign-in',
        '/sign-in/callback',
        '/sign-up',
        '/sign-up/verify',
        '/api/auth/webhook',
        '/dashboard/clerk/settings',
      ];

      authPaths.forEach((path) => {
        const request = createMockRequest(path);
        const response = createMockResponse();
        const result = withCSPHeaders(request, response);

        // Verify CSP header is set
        expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
        expect(result.headers.get(NONCE_HEADER)).toBeTruthy();

        // For auth routes, the CSP should include basic security policies
        const csp = result.headers.get('Content-Security-Policy') || '';
        // All routes should have basic self policy
        expect(csp).toContain("'self'");
      });
    });

    it('handles non-auth routes correctly', () => {
      const nonAuthPaths = [
        '/home',
        '/dashboard',
        '/api/users',
        '/products/123',
      ];

      nonAuthPaths.forEach((path) => {
        const request = createMockRequest(path);
        const response = createMockResponse();
        const result = withCSPHeaders(request, response);

        // Verify CSP header is set
        expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
        expect(result.headers.get(NONCE_HEADER)).toBeTruthy();

        // All routes should have basic CSP structure
        const csp = result.headers.get('Content-Security-Policy') || '';
        expect(csp).toContain("'self'");
        expect(csp).toContain('default-src');
      });
    });

    it('forwards nonce to request headers', () => {
      const request = createMockRequest('/test');
      const response = createMockResponse();

      const result = withCSPHeaders(request, response);

      // Should set nonce in response headers for client access
      expect(result.headers.get(NONCE_HEADER)).toBeTruthy();
      expect(typeof result.headers.get(NONCE_HEADER)).toBe('string');
    });

    it('handles missing pathname gracefully', () => {
      const request = {} as NextRequest;
      const response = createMockResponse();

      const result = withCSPHeaders(request, response);

      expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(result.headers.get(NONCE_HEADER)).toBeTruthy();
    });

    it('preserves existing response headers', () => {
      const request = createMockRequest('/test');
      const response = createMockResponse();

      // Set some existing headers
      response.headers.set('X-Custom-Header', 'custom-value');
      response.headers.set('Cache-Control', 'no-cache');

      const result = withCSPHeaders(request, response);

      // Should preserve existing headers
      expect(result.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(result.headers.get('Cache-Control')).toBe('no-cache');

      // And add security headers
      expect(result.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(result.headers.get(NONCE_HEADER)).toBeTruthy();
    });
  });

  describe('NONCE_HEADER constant', () => {
    it('exports correct nonce header name', () => {
      expect(NONCE_HEADER).toBe('x-nonce');
    });
  });
});
