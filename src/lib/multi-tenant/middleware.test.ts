/**
 * @fileoverview Tests for Multi-Tenant Middleware
 *
 * Tests the middleware functionality for tenant resolution based on different strategies
 * including header-based, subdomain-based, and path-based resolution.
 *
 * @module lib/multi-tenant/middleware.test
 * @version 1.0.0
 * @since 1.0.0
 */

import { NextRequest } from 'next/server';

import {
  resolveTenant,
  createTenantMiddleware,
  type TenantResolutionResult,
} from './middleware';

// Mock environment
jest.mock('../env', () => ({
  env: {
    MULTI_TENANT_ENABLED: true,
    DEFAULT_TENANT_ID: 'default',
    TENANT_HEADER_NAME: 'x-tenant-id',
  },
}));

describe('Multi-Tenant Middleware', () => {
  describe('resolveTenant function', () => {
    describe('Multi-tenant enabled', () => {
      describe('Header-based resolution', () => {
        it('should resolve tenant from valid header', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              'x-tenant-id': 'tenant-123',
            },
          });

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'header',
          });
        });

        it('should prioritize header over subdomain', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              'x-tenant-id': 'header-tenant',
              host: 'subdomain-tenant.example.com',
            },
          });

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'header-tenant',
            strategy: 'header',
          });
        });

        it('should handle case-insensitive header names', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              'X-TENANT-ID': 'case-test', // Different case but should work
            },
          });

          const result = resolveTenant(request);

          // Headers are case-insensitive in HTTP
          expect(result.tenantId).toBe('case-test');
          expect(result.strategy).toBe('header');
        });

        it('should handle missing header', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {},
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should handle empty header value', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              'x-tenant-id': '',
            },
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });
      });

      describe('Subdomain-based resolution', () => {
        it('should resolve tenant from valid subdomain', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'tenant-123.example.com',
            },
          });

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'subdomain',
            subdomain: 'tenant-123',
            domain: 'tenant-123.example.com',
          });
        });

        it('should ignore www subdomain', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'www.example.com',
            },
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should handle host with port number', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'tenant-123.example.com:8080',
            },
          });

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'subdomain',
            subdomain: 'tenant-123',
            domain: 'tenant-123.example.com:8080',
          });
        });

        it('should handle domain without subdomain', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'example.com',
            },
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should handle localhost development', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'localhost:3000',
            },
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should handle missing host header', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {},
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should validate subdomain as tenant ID', () => {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              host: 'api.example.com', // 'api' is a reserved name
            },
          });

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });
      });

      describe('Path-based resolution', () => {
        it('should resolve tenant from valid path', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/tenant-123/dashboard',
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'path',
          });
        });

        it('should handle path without additional segments', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/tenant-123',
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'path',
          });
        });

        it('should handle path with trailing slash', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/tenant-123/',
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'tenant-123',
            strategy: 'path',
          });
        });

        it('should ignore invalid tenant path format', () => {
          const request = new NextRequest('http://localhost:3000/tenant/');

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should ignore non-tenant paths', () => {
          const request = new NextRequest(
            'http://localhost:3000/dashboard/settings',
          );

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });

        it('should validate path tenant ID', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/admin/settings', // 'admin' is reserved
          );

          const result = resolveTenant(request);

          expect(result.tenantId).toBe('default');
          expect(result.strategy).toBe('header');
        });
      });

      describe('Strategy priority', () => {
        it('should prioritize header over subdomain over path', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/path-tenant/dashboard',
            {
              headers: {
                'x-tenant-id': 'header-tenant',
                host: 'subdomain-tenant.example.com',
              },
            },
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'header-tenant',
            strategy: 'header',
          });
        });

        it('should fall back to subdomain when header is invalid', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/path-tenant/dashboard',
            {
              headers: {
                'x-tenant-id': 'admin', // Invalid (reserved)
                host: 'subdomain-tenant.example.com',
              },
            },
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'subdomain-tenant',
            strategy: 'subdomain',
            subdomain: 'subdomain-tenant',
            domain: 'subdomain-tenant.example.com',
          });
        });

        it('should fall back to path when header and subdomain are invalid', () => {
          const request = new NextRequest(
            'http://localhost:3000/tenant/path-tenant/dashboard',
            {
              headers: {
                'x-tenant-id': 'admin', // Invalid (reserved)
                host: 'www.example.com', // Invalid (www ignored)
              },
            },
          );

          const result = resolveTenant(request);

          expect(result).toEqual({
            tenantId: 'path-tenant',
            strategy: 'path',
          });
        });
      });
    });

    describe('Multi-tenant disabled', () => {
      beforeEach(() => {
        jest.resetModules();
        jest.doMock('../env', () => ({
          env: {
            MULTI_TENANT_ENABLED: false,
            DEFAULT_TENANT_ID: 'single-tenant',
            TENANT_HEADER_NAME: 'x-tenant-id',
          },
        }));
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should always return default tenant when disabled', async () => {
        const { resolveTenant } = await import('./middleware');

        const request = new NextRequest(
          'http://localhost:3000/tenant/other-tenant/dashboard',
          {
            headers: {
              'x-tenant-id': 'header-tenant',
              host: 'subdomain-tenant.example.com',
            },
          },
        );

        const result = resolveTenant(request);

        expect(result).toEqual({
          tenantId: 'single-tenant',
          strategy: 'header',
        });
      });
    });
  });

  describe('Helper functions', () => {
    describe('extractSubdomain', () => {
      // Testing the helper function through public interface via subdomain resolution
      const testSubdomainExtraction = (host: string) => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: { host },
        });
        const result = resolveTenant(request);
        return result.tenantId;
      };

      it('should extract subdomain from standard domain', () => {
        expect(testSubdomainExtraction('tenant.example.com')).toBe('tenant');
      });

      it('should extract subdomain from domain with multiple levels', () => {
        expect(testSubdomainExtraction('tenant.app.example.com')).toBe(
          'tenant',
        );
      });

      it('should handle domain with port', () => {
        expect(testSubdomainExtraction('tenant.example.com:8080')).toBe(
          'tenant',
        );
      });

      it('should return default for single-level domain', () => {
        expect(testSubdomainExtraction('localhost')).toBe('default');
      });

      it('should return default for two-level domain', () => {
        expect(testSubdomainExtraction('example.com')).toBe('default');
      });
    });

    describe('isValidTenantId', () => {
      // Testing validation through public interface
      const testTenantIdValidation = (tenantId: string): boolean => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: { 'x-tenant-id': tenantId },
        });
        const result = resolveTenant(request);
        return result.tenantId === tenantId;
      };

      it('should accept valid alphanumeric tenant IDs', () => {
        expect(testTenantIdValidation('tenant123')).toBe(true);
        expect(testTenantIdValidation('123tenant')).toBe(true);
        expect(testTenantIdValidation('tenant-123')).toBe(true);
        expect(testTenantIdValidation('tenant_123')).toBe(true);
      });

      it('should reject invalid characters', () => {
        expect(testTenantIdValidation('tenant.123')).toBe(false);
        expect(testTenantIdValidation('tenant@123')).toBe(false);
        expect(testTenantIdValidation('tenant#123')).toBe(false);
        expect(testTenantIdValidation('tenant 123')).toBe(false);
        expect(testTenantIdValidation('tenant/123')).toBe(false);
      });

      it('should reject control characters', () => {
        // Test control characters that don't break NextRequest construction
        expect(testTenantIdValidation('tenant\t123')).toBe(false);
        // Test null character through direct NextRequest creation failure
        expect(() => {
          new NextRequest('http://localhost:3000/', {
            headers: { 'x-tenant-id': 'tenant\u0000123' },
          });
        }).toThrow();

        // For characters that break NextRequest, test validation directly
        // Since NextRequest itself rejects these, it means they won't reach our validation
        expect(() => {
          new NextRequest('http://localhost:3000/', {
            headers: { 'x-tenant-id': 'tenant\n123' },
          });
        }).toThrow();

        expect(() => {
          new NextRequest('http://localhost:3000/', {
            headers: { 'x-tenant-id': 'tenant\r123' },
          });
        }).toThrow();
      });

      it('should reject empty or null values', () => {
        expect(testTenantIdValidation('')).toBe(false);
      });

      it('should reject overly long tenant IDs', () => {
        const longId = 'a'.repeat(101);
        expect(testTenantIdValidation(longId)).toBe(false);
      });

      it('should accept maximum length tenant IDs', () => {
        const maxLengthId = 'a'.repeat(100);
        expect(testTenantIdValidation(maxLengthId)).toBe(true);
      });

      it('should reject reserved names', () => {
        const reservedNames = [
          'api',
          'www',
          'admin',
          'root',
          'system',
          'public',
          'private',
          'static',
          'assets',
          'cdn',
          'mail',
          'email',
          'ftp',
          'ssh',
          'localhost',
          'staging',
          'prod',
          'production',
          'dev',
          'development',
        ];

        reservedNames.forEach((name) => {
          expect(testTenantIdValidation(name)).toBe(false);
          expect(testTenantIdValidation(name.toUpperCase())).toBe(false);
        });
      });
    });
  });

  describe('createTenantMiddleware function', () => {
    let middleware: ReturnType<typeof createTenantMiddleware>;

    beforeEach(() => {
      middleware = createTenantMiddleware();
    });

    describe('Middleware execution', () => {
      it('should add tenant headers to response', () => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            'x-tenant-id': 'tenant-123',
          },
        });

        const response = middleware(request);

        expect(response).toBeDefined();
        expect(response.headers.get('x-tenant-id')).toBe('tenant-123');
        expect(response.headers.get('x-tenant-strategy')).toBe('header');
      });

      it('should add subdomain information to response headers', () => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            host: 'tenant-123.example.com',
          },
        });

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBe('tenant-123');
        expect(response.headers.get('x-tenant-strategy')).toBe('subdomain');
        expect(response.headers.get('x-tenant-subdomain')).toBe('tenant-123');
        expect(response.headers.get('x-tenant-domain')).toBe(
          'tenant-123.example.com',
        );
      });

      it('should not add subdomain headers for non-subdomain strategies', () => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            'x-tenant-id': 'tenant-123',
          },
        });

        const response = middleware(request);

        expect(response.headers.get('x-tenant-subdomain')).toBeNull();
        expect(response.headers.get('x-tenant-domain')).toBeNull();
      });
    });

    describe('Skip conditions', () => {
      it('should skip API routes', () => {
        const request = new NextRequest('http://localhost:3000/api/users');

        const response = middleware(request);

        // Should return a NextResponse without tenant headers
        expect(response.headers.get('x-tenant-id')).toBeNull();
      });

      it('should skip Next.js internal routes', () => {
        const request = new NextRequest(
          'http://localhost:3000/_next/static/chunks/main.js',
        );

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBeNull();
      });

      it('should skip favicon requests', () => {
        const request = new NextRequest('http://localhost:3000/favicon.ico');

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBeNull();
      });

      it('should skip static file requests', () => {
        const staticFiles = [
          '/logo.png',
          '/styles.css',
          '/script.js',
          '/document.pdf',
          '/image.jpg',
          '/data.json',
        ];

        staticFiles.forEach((file) => {
          const request = new NextRequest(`http://localhost:3000${file}`);
          const response = middleware(request);
          expect(response.headers.get('x-tenant-id')).toBeNull();
        });
      });

      it('should process regular page routes', () => {
        const pageRoutes = [
          '/',
          '/dashboard',
          '/settings',
          '/users',
          '/tenant/abc/dashboard',
        ];

        pageRoutes.forEach((route) => {
          const request = new NextRequest(`http://localhost:3000${route}`, {
            headers: {
              'x-tenant-id': 'test-tenant',
            },
          });
          const response = middleware(request);
          expect(response.headers.get('x-tenant-id')).toBe('test-tenant');
        });
      });
    });

    describe('Response handling', () => {
      it('should preserve original request when no tenant is provided', () => {
        const request = new NextRequest('http://localhost:3000/dashboard');

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBe('default');
        expect(response.headers.get('x-tenant-strategy')).toBe('header');
      });

      it('should handle multiple resolution strategies in order', () => {
        const request = new NextRequest(
          'http://localhost:3000/tenant/path-tenant/dashboard',
          {
            headers: {
              'x-tenant-id': 'header-tenant',
              host: 'subdomain-tenant.example.com',
            },
          },
        );

        const response = middleware(request);

        // Should prioritize header
        expect(response.headers.get('x-tenant-id')).toBe('header-tenant');
        expect(response.headers.get('x-tenant-strategy')).toBe('header');
      });
    });

    describe('Error handling', () => {
      it('should handle malformed URLs gracefully', () => {
        const request = new NextRequest('http://localhost:3000/[invalid');

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBe('default');
      });

      it('should handle requests with no headers', () => {
        const request = new NextRequest('http://localhost:3000/');

        const response = middleware(request);

        expect(response.headers.get('x-tenant-id')).toBe('default');
        expect(response.headers.get('x-tenant-strategy')).toBe('header');
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex multi-strategy request correctly', () => {
      const request = new NextRequest(
        'http://localhost:3000/tenant/invalid-tenant/dashboard',
        {
          headers: {
            'x-tenant-id': 'api', // Invalid - reserved (matching exact name from reserved list)
            host: 'valid-tenant.example.com:3000',
          },
        },
      );

      const result = resolveTenant(request);

      // Should skip invalid header and invalid path, use valid subdomain
      expect(result).toEqual({
        tenantId: 'valid-tenant',
        strategy: 'subdomain',
        subdomain: 'valid-tenant',
        domain: 'valid-tenant.example.com:3000',
      });
    });

    it('should handle all invalid strategies and fallback to default', () => {
      const request = new NextRequest(
        'http://localhost:3000/not-tenant-path/dashboard',
        {
          headers: {
            'x-tenant-id': 'www', // Invalid - reserved
            host: 'api.example.com', // Invalid - reserved subdomain
          },
        },
      );

      const result = resolveTenant(request);

      expect(result).toEqual({
        tenantId: 'default',
        strategy: 'header',
      });
    });

    it('should create middleware that works end-to-end', () => {
      const middleware = createTenantMiddleware();
      const request = new NextRequest('http://localhost:3000/dashboard', {
        headers: {
          host: 'client-abc.myapp.com',
        },
      });

      const response = middleware(request);

      expect(response.headers.get('x-tenant-id')).toBe('client-abc');
      expect(response.headers.get('x-tenant-strategy')).toBe('subdomain');
      expect(response.headers.get('x-tenant-subdomain')).toBe('client-abc');
      expect(response.headers.get('x-tenant-domain')).toBe(
        'client-abc.myapp.com',
      );
    });
  });
});
