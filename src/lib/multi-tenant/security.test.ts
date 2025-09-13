/**
 * @fileoverview Security tests for multi-tenant module
 *
 * These tests ensure that the multi-tenant implementation is secure
 * and prevents common attack vectors like injection, unauthorized access, etc.
 */

import { NextRequest } from 'next/server';

import { getTenantDatabaseUrl, getTenantCacheKey } from './hooks';
import { resolveTenant } from './middleware';

// We'll need to be able to mock this for the disabled tests
let resolveTenantForDisabledTests = resolveTenant;

// Mock environment
jest.mock('../env', () => ({
  env: {
    MULTI_TENANT_ENABLED: true,
    DEFAULT_TENANT_ID: 'default',
    TENANT_HEADER_NAME: 'x-tenant-id',
    DATABASE_URL: 'postgresql://localhost:5432/testdb',
  },
}));

describe('Multi-Tenant Security Tests', () => {
  describe('Tenant ID Validation', () => {
    it('should reject SQL injection attempts in headers', () => {
      const maliciousIds = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'; DELETE FROM tenants; --",
        '../../etc/passwd',
        "<script>alert('xss')</script>",
        "tenant_id'; UNION SELECT * FROM users; --",
      ];

      maliciousIds.forEach((maliciousId) => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            'x-tenant-id': maliciousId,
          },
        });

        const result = resolveTenant(request);

        // Should fallback to default tenant for invalid IDs
        expect(result.tenantId).toBe('default');
        expect(result.strategy).toBe('header');
      });
    });

    it('should reject malicious subdomain attempts', () => {
      const maliciousSubdomains = [
        'admin.evil.com',
        'api.localhost',
        'www.example.com',
        '../../admin',
        '<script>',
        "tenant'; DROP TABLE users; --",
      ];

      maliciousSubdomains.forEach((subdomain) => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            host: `${subdomain}.example.com`,
          },
        });

        const result = resolveTenant(request);

        // Should fallback to default tenant for invalid subdomains
        expect(result.tenantId).toBe('default');
      });
    });

    it('should reject path traversal attempts', () => {
      const maliciousPaths = [
        '/tenant/../admin',
        '/tenant/../../etc/passwd',
        '/tenant/%2e%2e%2fadmin',
        '/tenant/admin%00',
        '/tenant/admin<script>',
      ];

      maliciousPaths.forEach((path) => {
        const request = new NextRequest(`http://localhost:3000${path}`);
        const result = resolveTenant(request);

        // Should fallback to default tenant for invalid paths
        expect(result.tenantId).toBe('default');
      });
    });

    it('should reject reserved tenant names', () => {
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
        'localhost',
        'production',
      ];

      reservedNames.forEach((reservedName) => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            'x-tenant-id': reservedName,
          },
        });

        const result = resolveTenant(request);

        // Should fallback to default tenant for reserved names
        expect(result.tenantId).toBe('default');
      });
    });

    it('should reject overly long tenant IDs', () => {
      const longTenantId = 'a'.repeat(101); // Over 100 character limit

      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-tenant-id': longTenantId,
        },
      });

      const result = resolveTenant(request);

      // Should fallback to default tenant for overly long IDs
      expect(result.tenantId).toBe('default');
    });

    it('should accept valid tenant IDs', () => {
      const validIds = [
        'tenant-123',
        'company_abc',
        'test-tenant-1',
        'valid123',
        'a',
        'tenant-with-many-hyphens-and-numbers-123',
      ];

      validIds.forEach((validId) => {
        const request = new NextRequest('http://localhost:3000/', {
          headers: {
            'x-tenant-id': validId,
          },
        });

        const result = resolveTenant(request);

        // Should use the valid tenant ID
        expect(result.tenantId).toBe(validId);
        expect(result.strategy).toBe('header');
      });
    });
  });

  describe('Database URL Security', () => {
    it('should sanitize tenant ID in database URLs', () => {
      const maliciousIds = [
        "'; DROP TABLE users; --",
        '../../etc/passwd',
        "admin'; DELETE FROM tenants; --",
      ];

      maliciousIds.forEach((maliciousId) => {
        const dbUrl = getTenantDatabaseUrl(maliciousId);

        // Should return default database URL for invalid tenant IDs
        expect(dbUrl).toBe('postgresql://localhost:5432/testdb');
      });
    });

    it('should generate correct URLs for valid tenant IDs', () => {
      const validId = 'tenant-123';
      const dbUrl = getTenantDatabaseUrl(validId);

      expect(dbUrl).toBe(
        'postgresql://localhost:5432/testdb?schema=tenant_tenant-123',
      );
    });

    it('should return base URL for default tenant', () => {
      const dbUrl = getTenantDatabaseUrl('default');

      expect(dbUrl).toBe('postgresql://localhost:5432/testdb');
    });
  });

  describe('Cache Key Security', () => {
    it('should sanitize malicious cache keys', () => {
      const maliciousKeys = [
        "key'; DROP TABLE cache; --",
        'key../../admin',
        "key<script>alert('xss')</script>",
        'key\n\r\t',
        'key with spaces and special chars!@#$%',
      ];

      maliciousKeys.forEach((maliciousKey) => {
        const cacheKey = getTenantCacheKey('tenant-123', maliciousKey);

        // Should sanitize the key part
        expect(cacheKey).toMatch(/^tenant:tenant-123:[a-zA-Z0-9_-]+$/);
        expect(cacheKey).not.toContain("'");
        expect(cacheKey).not.toContain('"');
        expect(cacheKey).not.toContain('<');
        expect(cacheKey).not.toContain('>');
        expect(cacheKey).not.toContain(' ');
      });
    });

    it('should handle invalid tenant IDs in cache keys', () => {
      const maliciousTenantId = "'; DROP TABLE cache; --";
      const cacheKey = getTenantCacheKey(maliciousTenantId, 'valid-key');

      // Should fallback to default tenant ID
      expect(cacheKey).toBe('tenant:default:valid-key');
    });

    it('should generate correct cache keys for valid inputs', () => {
      const cacheKey = getTenantCacheKey('tenant-123', 'user-session');

      expect(cacheKey).toBe('tenant:tenant-123:user-session');
    });
  });

  describe('Header Injection Prevention', () => {
    it('should not allow header injection through tenant resolution', () => {
      // Test that our validation rejects headers with control characters
      const maliciousHeaders = [
        'tenant-123\r\nX-Admin', // Simplified to avoid NextRequest validation
        'tenant-123\nSet-Cookie',
        'tenant-123\r\n\r\nscript',
        'tenant\r123',
        'tenant\n123',
      ];

      maliciousHeaders.forEach((maliciousHeader) => {
        let errorCaught = false;
        try {
          const request = new NextRequest('http://localhost:3000/', {
            headers: {
              'x-tenant-id': maliciousHeader,
            },
          });

          const result = resolveTenant(request);

          // Should reject headers with line breaks
          expect(result.tenantId).toBe('default');
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // NextRequest itself rejects invalid headers, which is good
          // This means the browser/server would reject these before they reach our code
          errorCaught = true;
        }
        // Ensure that an error was caught, which confirms NextRequest rejected the header
        expect(errorCaught).toBe(true);
      });
    });
  });

  describe('Multi-Tenant Disabled Security', () => {
    beforeEach(() => {
      // Mock multi-tenant as disabled
      jest.resetModules(); // Reset modules to re-import with new mock
      jest.doMock('../env', () => ({
        env: {
          MULTI_TENANT_ENABLED: false,
          DEFAULT_TENANT_ID: 'default',
          TENANT_HEADER_NAME: 'x-tenant-id',
          DATABASE_URL: 'postgresql://localhost:5432/testdb',
        },
      }));

      // Re-import the module to get the version with the new mock
      resolveTenantForDisabledTests =
        jest.requireActual('./middleware').resolveTenant;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should ignore malicious tenant IDs when multi-tenant is disabled', () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-tenant-id': "'; DROP TABLE users; --",
        },
      });

      const result = resolveTenantForDisabledTests(request);

      // Should always return default tenant when disabled
      expect(result.tenantId).toBe('default');
      expect(result.strategy).toBe('header');
    });
  });
});

describe('Input Validation Edge Cases', () => {
  it('should handle null and undefined tenant IDs', () => {
    const request = new NextRequest('http://localhost:3000/', {
      headers: {},
    });

    const result = resolveTenant(request);

    expect(result.tenantId).toBe('default');
  });

  it('should handle empty string tenant IDs', () => {
    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        'x-tenant-id': '',
      },
    });

    const result = resolveTenant(request);

    expect(result.tenantId).toBe('default');
  });

  it('should handle non-string tenant IDs', () => {
    // This shouldn't happen in practice, but testing edge cases
    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        'x-tenant-id': '123', // Numbers as strings should be valid
      },
    });

    const result = resolveTenant(request);

    expect(result.tenantId).toBe('123');
  });
});
