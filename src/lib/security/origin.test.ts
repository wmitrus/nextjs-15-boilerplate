import { NextRequest } from 'next/server';

import { isSameOrigin } from './origin';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment variables before each test
  jest.resetModules();
  process.env = { ...originalEnv };
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.APP_URL;
});

afterAll(() => {
  process.env = originalEnv;
});

// Helper to create a NextRequest with specific headers
const createRequest = (headers: Record<string, string> = {}) => {
  const url = 'https://example.com/api/test';
  const request = new NextRequest(url, {
    method: 'POST',
  });

  // Add headers to the request
  Object.entries(headers).forEach(([key, value]) => {
    request.headers.set(key, value);
  });

  return request;
};

describe('isSameOrigin', () => {
  describe('Basic functionality', () => {
    it('should return true when origin header matches configured origin', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
      const req = createRequest({
        origin: 'https://myapp.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should return false when origin header does not match configured origin', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
      const req = createRequest({
        origin: 'https://malicious.com',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should use referer when origin header is not present', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
      const req = createRequest({
        referer: 'https://myapp.com/some/path',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should return false when neither origin nor referer headers are present', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
      const req = createRequest();

      expect(isSameOrigin(req)).toBe(false);
    });
  });

  describe('Environment variable configurations', () => {
    it('should use NEXT_PUBLIC_APP_URL when available', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://public.example.com';
      process.env.APP_URL = 'https://private.example.com';

      const req = createRequest({
        origin: 'https://public.example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should fall back to APP_URL when NEXT_PUBLIC_APP_URL is not set', () => {
      process.env.APP_URL = 'https://app.example.com';

      const req = createRequest({
        origin: 'https://app.example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle invalid URL in NEXT_PUBLIC_APP_URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'not-a-valid-url';

      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle invalid URL in APP_URL', () => {
      process.env.APP_URL = 'invalid://malformed[url]';

      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle empty environment variables', () => {
      process.env.NEXT_PUBLIC_APP_URL = '';
      process.env.APP_URL = '';

      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });
  });

  describe('Referer header handling', () => {
    it('should extract origin from referer URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

      const req = createRequest({
        referer: 'https://myapp.com/some/deep/path?query=param',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle invalid referer URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

      const req = createRequest({
        referer: 'not-a-valid-url',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle malformed referer URL', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

      const req = createRequest({
        referer: 'http://[invalid-ipv6',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should prefer origin header over referer', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

      const req = createRequest({
        origin: 'https://myapp.com',
        referer: 'https://different.com/path',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should use referer when origin is empty string', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

      const req = createRequest({
        origin: '',
        referer: 'https://myapp.com/path',
      });

      expect(isSameOrigin(req)).toBe(true);
    });
  });

  describe('Forwarded headers fallback', () => {
    it('should use x-forwarded-proto and x-forwarded-host when no configured origin', () => {
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should fall back to host header when x-forwarded-host is not present', () => {
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        host: 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should default to https when x-forwarded-proto is not present', () => {
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle http protocol from x-forwarded-proto', () => {
      const req = createRequest({
        origin: 'http://example.com',
        'x-forwarded-proto': 'http',
        'x-forwarded-host': 'example.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should return false when no host header is available', () => {
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle empty host headers', () => {
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': '',
        host: '',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should prioritize x-forwarded-host over host header', () => {
      const req = createRequest({
        origin: 'https://forwarded.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'forwarded.com',
        host: 'direct.com',
      });

      expect(isSameOrigin(req)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle case-insensitive domain comparison', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://MyApp.com';

      const req = createRequest({
        origin: 'https://myapp.com',
      });

      // Domain names are case-insensitive, so this should return true
      expect(isSameOrigin(req)).toBe(true);
    });

    it('should handle ports in origin comparison', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com:3000';

      const req = createRequest({
        origin: 'https://example.com:3000',
      });

      expect(isSameOrigin(req)).toBe(true);
    });

    it('should distinguish between different ports', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com:3000';

      const req = createRequest({
        origin: 'https://example.com:8080',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle subdomains correctly', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';

      const req = createRequest({
        origin: 'https://api.example.com',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle mixed configured origin and fallback scenario', () => {
      // No configured origin, should fall back to forwarded headers
      const req = createRequest({
        origin: 'https://example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'different.com',
      });

      expect(isSameOrigin(req)).toBe(false);
    });
  });

  describe('Security scenarios', () => {
    it('should reject origin injection attempts', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://secure.com';

      const req = createRequest({
        origin: 'https://secure.com.evil.com',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should reject protocol downgrade attempts', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://secure.com';

      const req = createRequest({
        origin: 'http://secure.com',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle malicious referer headers', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://secure.com';

      const req = createRequest({
        referer: 'javascript:alert("xss")',
      });

      expect(isSameOrigin(req)).toBe(false);
    });

    it('should handle extremely long origins', () => {
      const longOrigin = 'https://' + 'a'.repeat(1000) + '.com';
      process.env.NEXT_PUBLIC_APP_URL = longOrigin;

      const req = createRequest({
        origin: longOrigin,
      });

      expect(isSameOrigin(req)).toBe(true);
    });
  });
});
