import { defaultCsrfConfig, pathIsProtected } from './config';

import type { CsrfConfig } from './config';
import type { NextRequest } from 'next/server';

// Helper function to create a mock NextRequest
const createMockRequest = (pathname: string): NextRequest => {
  const url = new URL(`https://example.com${pathname}`);
  return {
    nextUrl: { pathname },
    url: url.toString(),
  } as NextRequest;
};

// Mock process.env for testing
const mockProcessEnv = (env: Record<string, string | undefined>) => {
  Object.keys(env).forEach((key) => {
    const processEnv = process.env as Record<string, string | undefined>;
    if (env[key] === undefined) {
      delete processEnv[key];
    } else {
      processEnv[key] = env[key];
    }
  });
};

describe('defaultCsrfConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Default configuration', () => {
    it('should return default configuration when no environment variables are set', () => {
      // Clear all CSRF-related env vars
      mockProcessEnv({
        NODE_ENV: undefined,
        CSRF_HEADER_NAME: undefined,
        CSRF_ACCEPT_HEADERS: undefined,
        CSRF_COOKIE_PREFIX: undefined,
        CSRF_ROTATE_AFTER_MS: undefined,
        CSRF_SECRET_BYTES: undefined,
        CSRF_SALT_BYTES: undefined,
        CSRF_SECURE_COOKIES: undefined,
      });

      const config = defaultCsrfConfig();

      expect(config).toEqual({
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token', 'x-xsrf-token'],
        cookiePrefix: '',
        cookieNames: {
          secret: 'csrf-secret',
          iat: 'csrf-iat',
        },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000, // 24h
        secureCookies: false,
        protectPaths: [/^\/api(\/|$)/],
      });
    });

    it('should use default header name when CSRF_HEADER_NAME is not set', () => {
      mockProcessEnv({ CSRF_HEADER_NAME: undefined });

      const config = defaultCsrfConfig();

      expect(config.headerName).toBe('x-csrf-token');
    });

    it('should use default accept headers when CSRF_ACCEPT_HEADERS is not set', () => {
      mockProcessEnv({ CSRF_ACCEPT_HEADERS: undefined });

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-csrf-token',
        'x-xsrf-token',
      ]);
    });

    it('should use default cookie prefix when CSRF_COOKIE_PREFIX is not set', () => {
      mockProcessEnv({ CSRF_COOKIE_PREFIX: undefined });

      const config = defaultCsrfConfig();

      expect(config.cookiePrefix).toBe('');
      expect(config.cookieNames.secret).toBe('csrf-secret');
      expect(config.cookieNames.iat).toBe('csrf-iat');
    });

    it('should use default rotate time when CSRF_ROTATE_AFTER_MS is not set', () => {
      mockProcessEnv({ CSRF_ROTATE_AFTER_MS: undefined });

      const config = defaultCsrfConfig();

      expect(config.rotateAfterMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should use default secret bytes when CSRF_SECRET_BYTES is not set', () => {
      mockProcessEnv({ CSRF_SECRET_BYTES: undefined });

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(32);
    });

    it('should use default salt bytes when CSRF_SALT_BYTES is not set', () => {
      mockProcessEnv({ CSRF_SALT_BYTES: undefined });

      const config = defaultCsrfConfig();

      expect(config.saltBytes).toBe(32);
    });
  });

  describe('Environment variable configuration', () => {
    it('should use custom header name from CSRF_HEADER_NAME', () => {
      process.env.CSRF_HEADER_NAME = 'x-custom-csrf';

      const config = defaultCsrfConfig();

      expect(config.headerName).toBe('x-custom-csrf');
    });

    it('should parse CSRF_ACCEPT_HEADERS correctly', () => {
      process.env.CSRF_ACCEPT_HEADERS =
        'x-csrf-token,x-xsrf-token,custom-header';

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-csrf-token',
        'x-xsrf-token',
        'custom-header',
      ]);
    });

    it('should trim whitespace from CSRF_ACCEPT_HEADERS', () => {
      process.env.CSRF_ACCEPT_HEADERS = '  x-csrf-token  ,  x-xsrf-token  ';

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-csrf-token',
        'x-xsrf-token',
      ]);
    });

    it('should filter out empty headers from CSRF_ACCEPT_HEADERS', () => {
      process.env.CSRF_ACCEPT_HEADERS = 'x-csrf-token,,x-xsrf-token,';

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-csrf-token',
        'x-xsrf-token',
      ]);
    });

    it('should convert headers to lowercase', () => {
      process.env.CSRF_ACCEPT_HEADERS = 'X-CSRF-TOKEN,X-XSRF-TOKEN';

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-csrf-token',
        'x-xsrf-token',
      ]);
    });

    it('should fall back to default headers when CSRF_ACCEPT_HEADERS results in empty array', () => {
      process.env.CSRF_ACCEPT_HEADERS = ',, , ';
      process.env.CSRF_HEADER_NAME = 'x-custom-csrf';

      const config = defaultCsrfConfig();

      expect(config.acceptHeaderNames).toEqual([
        'x-custom-csrf',
        'x-xsrf-token',
      ]);
    });

    it('should use custom cookie prefix from CSRF_COOKIE_PREFIX', () => {
      process.env.CSRF_COOKIE_PREFIX = 'my-app-';

      const config = defaultCsrfConfig();

      expect(config.cookiePrefix).toBe('my-app-');
      expect(config.cookieNames.secret).toBe('my-app-csrf-secret');
      expect(config.cookieNames.iat).toBe('my-app-csrf-iat');
    });

    it('should parse valid CSRF_ROTATE_AFTER_MS', () => {
      process.env.CSRF_ROTATE_AFTER_MS = '3600000'; // 1 hour

      const config = defaultCsrfConfig();

      expect(config.rotateAfterMs).toBe(3600000);
    });

    it('should handle invalid CSRF_ROTATE_AFTER_MS and use default', () => {
      process.env.CSRF_ROTATE_AFTER_MS = 'invalid';

      const config = defaultCsrfConfig();

      expect(config.rotateAfterMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should handle empty CSRF_ROTATE_AFTER_MS and use default', () => {
      process.env.CSRF_ROTATE_AFTER_MS = '';

      const config = defaultCsrfConfig();

      expect(config.rotateAfterMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse valid CSRF_SECRET_BYTES', () => {
      process.env.CSRF_SECRET_BYTES = '64';

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(64);
    });

    it('should handle invalid CSRF_SECRET_BYTES and use default', () => {
      process.env.CSRF_SECRET_BYTES = 'invalid';

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(32);
    });

    it('should handle zero CSRF_SECRET_BYTES and use default', () => {
      process.env.CSRF_SECRET_BYTES = '0';

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(32);
    });

    it('should parse valid CSRF_SALT_BYTES', () => {
      process.env.CSRF_SALT_BYTES = '16';

      const config = defaultCsrfConfig();

      expect(config.saltBytes).toBe(16);
    });

    it('should handle invalid CSRF_SALT_BYTES and use default', () => {
      process.env.CSRF_SALT_BYTES = 'invalid';

      const config = defaultCsrfConfig();

      expect(config.saltBytes).toBe(32);
    });

    it('should handle zero CSRF_SALT_BYTES and use default', () => {
      process.env.CSRF_SALT_BYTES = '0';

      const config = defaultCsrfConfig();

      expect(config.saltBytes).toBe(32);
    });
  });

  describe('Secure cookies configuration', () => {
    it('should use secure cookies in production by default', () => {
      mockProcessEnv({
        NODE_ENV: 'production',
        CSRF_SECURE_COOKIES: undefined,
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(true);
    });

    it('should not use secure cookies in development by default', () => {
      mockProcessEnv({
        NODE_ENV: 'development',
        CSRF_SECURE_COOKIES: undefined,
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(false);
    });

    it('should not use secure cookies in test by default', () => {
      mockProcessEnv({
        NODE_ENV: 'test',
        CSRF_SECURE_COOKIES: undefined,
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(false);
    });

    it('should override NODE_ENV when CSRF_SECURE_COOKIES is "true"', () => {
      mockProcessEnv({
        NODE_ENV: 'development',
        CSRF_SECURE_COOKIES: 'true',
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(true);
    });

    it('should fall back to NODE_ENV when CSRF_SECURE_COOKIES is not "true"', () => {
      mockProcessEnv({
        NODE_ENV: 'production',
        CSRF_SECURE_COOKIES: 'false',
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(true); // Falls back to secure (NODE_ENV === 'production')
    });

    it('should be case insensitive for CSRF_SECURE_COOKIES', () => {
      mockProcessEnv({
        NODE_ENV: 'development',
        CSRF_SECURE_COOKIES: 'TRUE',
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(true); // 'TRUE'.toLowerCase() === 'true', so returns true
    });

    it('should fall back to NODE_ENV when CSRF_SECURE_COOKIES is not "true" (case insensitive)', () => {
      mockProcessEnv({
        NODE_ENV: 'development',
        CSRF_SECURE_COOKIES: 'false',
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(false); // 'false' !== 'true', falls back to NODE_ENV (development = false)
    });

    it('should handle empty CSRF_SECURE_COOKIES and fall back to NODE_ENV', () => {
      mockProcessEnv({
        NODE_ENV: 'production',
        CSRF_SECURE_COOKIES: '',
      });

      const config = defaultCsrfConfig();

      expect(config.secureCookies).toBe(true);
    });
  });

  describe('Protect paths configuration', () => {
    it('should always include default API route protection', () => {
      const config = defaultCsrfConfig();

      expect(config.protectPaths).toHaveLength(1);
      expect(config.protectPaths[0]).toEqual(/^\/api(\/|$)/);
    });
  });

  describe('Configuration completeness', () => {
    it('should return a complete CsrfConfig object', () => {
      const config = defaultCsrfConfig();

      // Verify all required properties are present
      expect(config).toHaveProperty('headerName');
      expect(config).toHaveProperty('acceptHeaderNames');
      expect(config).toHaveProperty('cookiePrefix');
      expect(config).toHaveProperty('cookieNames');
      expect(config).toHaveProperty('secretBytes');
      expect(config).toHaveProperty('saltBytes');
      expect(config).toHaveProperty('rotateAfterMs');
      expect(config).toHaveProperty('secureCookies');
      expect(config).toHaveProperty('protectPaths');

      // Verify cookie names object structure
      expect(config.cookieNames).toHaveProperty('secret');
      expect(config.cookieNames).toHaveProperty('iat');

      // Verify types
      expect(typeof config.headerName).toBe('string');
      expect(Array.isArray(config.acceptHeaderNames)).toBe(true);
      expect(typeof config.cookiePrefix).toBe('string');
      expect(typeof config.cookieNames.secret).toBe('string');
      expect(typeof config.cookieNames.iat).toBe('string');
      expect(typeof config.secretBytes).toBe('number');
      expect(typeof config.saltBytes).toBe('number');
      expect(typeof config.rotateAfterMs).toBe('number');
      expect(typeof config.secureCookies).toBe('boolean');
      expect(Array.isArray(config.protectPaths)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed integer environment variables gracefully', () => {
      process.env.CSRF_SECRET_BYTES = '32.5';
      process.env.CSRF_SALT_BYTES = '16.7';
      process.env.CSRF_ROTATE_AFTER_MS = '3600.5';

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(32);
      expect(config.saltBytes).toBe(16);
      expect(config.rotateAfterMs).toBe(3600);
    });

    it('should handle negative integer values and use them (parseInt allows negative numbers)', () => {
      mockProcessEnv({
        CSRF_SECRET_BYTES: '-10',
        CSRF_SALT_BYTES: '-5',
      });

      const config = defaultCsrfConfig();

      // parseInt('-10', 10) returns -10, which is truthy, so || 32 doesn't trigger
      expect(config.secretBytes).toBe(-10);
      expect(config.saltBytes).toBe(-5);
    });

    it('should handle very large numbers', () => {
      mockProcessEnv({
        CSRF_SECRET_BYTES: '999999999',
        CSRF_SALT_BYTES: '888888888',
        CSRF_ROTATE_AFTER_MS: '777777777',
      });

      const config = defaultCsrfConfig();

      expect(config.secretBytes).toBe(999999999);
      expect(config.saltBytes).toBe(888888888);
      expect(config.rotateAfterMs).toBe(777777777);
    });
  });
});

describe('pathIsProtected', () => {
  describe('Default API route protection', () => {
    const config: CsrfConfig = {
      headerName: 'x-csrf-token',
      acceptHeaderNames: ['x-csrf-token'],
      cookiePrefix: '',
      cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
      secretBytes: 32,
      saltBytes: 32,
      rotateAfterMs: 24 * 60 * 60 * 1000,
      secureCookies: false,
      protectPaths: [/^\/api(\/|$)/],
    };

    it('should protect API routes with exact match', () => {
      const req = createMockRequest('/api');
      expect(pathIsProtected(req, config)).toBe(true);
    });

    it('should protect API routes with trailing slash', () => {
      const req = createMockRequest('/api/');
      expect(pathIsProtected(req, config)).toBe(true);
    });

    it('should protect nested API routes', () => {
      const req = createMockRequest('/api/users');
      expect(pathIsProtected(req, config)).toBe(true);
    });

    it('should protect deeply nested API routes', () => {
      const req = createMockRequest('/api/users/123/posts/456');
      expect(pathIsProtected(req, config)).toBe(true);
    });

    it('should not protect non-API routes', () => {
      const req = createMockRequest('/');
      expect(pathIsProtected(req, config)).toBe(false);
    });

    it('should not protect routes that start with "api" but are not API routes', () => {
      const req = createMockRequest('/apiuser');
      expect(pathIsProtected(req, config)).toBe(false);
    });

    it('should not protect routes that contain "api" but do not start with it', () => {
      const req = createMockRequest('/pages/api-docs');
      expect(pathIsProtected(req, config)).toBe(false);
    });

    it('should not protect home route', () => {
      const req = createMockRequest('/');
      expect(pathIsProtected(req, config)).toBe(false);
    });

    it('should not protect page routes', () => {
      const req = createMockRequest('/about');
      expect(pathIsProtected(req, config)).toBe(false);
    });

    it('should not protect nested page routes', () => {
      const req = createMockRequest('/users/profile');
      expect(pathIsProtected(req, config)).toBe(false);
    });
  });

  describe('Custom protection patterns', () => {
    it('should protect routes matching custom patterns', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/admin/, /^\/dashboard/],
      };

      expect(pathIsProtected(createMockRequest('/admin'), customConfig)).toBe(
        true,
      );
      expect(
        pathIsProtected(createMockRequest('/admin/users'), customConfig),
      ).toBe(true);
      expect(
        pathIsProtected(createMockRequest('/dashboard'), customConfig),
      ).toBe(true);
      expect(
        pathIsProtected(
          createMockRequest('/dashboard/analytics'),
          customConfig,
        ),
      ).toBe(true);
    });

    it('should not protect routes that do not match custom patterns', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/admin/, /^\/dashboard/],
      };

      expect(pathIsProtected(createMockRequest('/api'), customConfig)).toBe(
        false,
      );
      expect(pathIsProtected(createMockRequest('/'), customConfig)).toBe(false);
      expect(pathIsProtected(createMockRequest('/users'), customConfig)).toBe(
        false,
      );
      expect(pathIsProtected(createMockRequest('/public'), customConfig)).toBe(
        false,
      );
    });

    it('should handle multiple overlapping patterns', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api/, /^\/api\/admin/],
      };

      expect(pathIsProtected(createMockRequest('/api'), customConfig)).toBe(
        true,
      );
      expect(
        pathIsProtected(createMockRequest('/api/admin'), customConfig),
      ).toBe(true);
      expect(
        pathIsProtected(createMockRequest('/api/admin/users'), customConfig),
      ).toBe(true);
    });

    it('should handle empty protectPaths array', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [],
      };

      expect(pathIsProtected(createMockRequest('/api'), customConfig)).toBe(
        false,
      );
      expect(pathIsProtected(createMockRequest('/admin'), customConfig)).toBe(
        false,
      );
      expect(pathIsProtected(createMockRequest('/'), customConfig)).toBe(false);
    });
  });

  describe('Complex regex patterns', () => {
    it('should handle case-insensitive patterns', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api/i],
      };

      expect(pathIsProtected(createMockRequest('/API'), customConfig)).toBe(
        true,
      );
      expect(pathIsProtected(createMockRequest('/Api'), customConfig)).toBe(
        true,
      );
      expect(pathIsProtected(createMockRequest('/api'), customConfig)).toBe(
        true,
      );
    });

    it('should handle patterns with optional parts', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api(\/v\d+)?/],
      };

      expect(pathIsProtected(createMockRequest('/api'), customConfig)).toBe(
        true,
      );
      expect(pathIsProtected(createMockRequest('/api/v1'), customConfig)).toBe(
        true,
      );
      expect(pathIsProtected(createMockRequest('/api/v2'), customConfig)).toBe(
        true,
      );
      expect(
        pathIsProtected(createMockRequest('/api/v1/users'), customConfig),
      ).toBe(true);
    });

    it('should handle patterns with character classes', () => {
      const customConfig: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/[a-z]+-api/],
      };

      expect(
        pathIsProtected(createMockRequest('/user-api'), customConfig),
      ).toBe(true);
      expect(
        pathIsProtected(createMockRequest('/admin-api'), customConfig),
      ).toBe(true);
      expect(pathIsProtected(createMockRequest('/123-api'), customConfig)).toBe(
        false,
      );
      expect(pathIsProtected(createMockRequest('/API'), customConfig)).toBe(
        false,
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle root path correctly', () => {
      const config: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/$/],
      };

      expect(pathIsProtected(createMockRequest('/'), config)).toBe(true);
      expect(pathIsProtected(createMockRequest('/about'), config)).toBe(false);
    });

    it('should handle paths with special characters', () => {
      const config: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api(\/|$)/],
      };

      expect(
        pathIsProtected(createMockRequest('/api/users-list'), config),
      ).toBe(true);
      expect(
        pathIsProtected(createMockRequest('/api/users_list'), config),
      ).toBe(true);
      expect(
        pathIsProtected(createMockRequest('/api/users.json'), config),
      ).toBe(true);
    });

    it('should handle very long paths', () => {
      const config: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api(\/|$)/],
      };

      const longPath = '/api/' + 'segment/'.repeat(100) + 'end';
      expect(pathIsProtected(createMockRequest(longPath), config)).toBe(true);
    });

    it('should handle paths with query parameters correctly', () => {
      const config: CsrfConfig = {
        headerName: 'x-csrf-token',
        acceptHeaderNames: ['x-csrf-token'],
        cookiePrefix: '',
        cookieNames: { secret: 'csrf-secret', iat: 'csrf-iat' },
        secretBytes: 32,
        saltBytes: 32,
        rotateAfterMs: 24 * 60 * 60 * 1000,
        secureCookies: false,
        protectPaths: [/^\/api(\/|$)/],
      };

      // Note: pathIsProtected only checks pathname, not query params
      expect(pathIsProtected(createMockRequest('/api/users'), config)).toBe(
        true,
      );
      expect(pathIsProtected(createMockRequest('/users'), config)).toBe(false);
    });
  });
});
