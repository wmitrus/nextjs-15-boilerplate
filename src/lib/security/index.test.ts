/**
 * Unit tests for the security module barrel file
 * Tests that all expected exports are properly available
 */
import * as securityModule from './index';

describe('Security Module Barrel File', () => {
  describe('CSP exports', () => {
    it('should export NONCE_HEADER constant', () => {
      expect(securityModule.NONCE_HEADER).toBeDefined();
      expect(typeof securityModule.NONCE_HEADER).toBe('string');
    });

    it('should export createNonce function', () => {
      expect(securityModule.createNonce).toBeDefined();
      expect(typeof securityModule.createNonce).toBe('function');
    });

    it('should export buildCSP function', () => {
      expect(securityModule.buildCSP).toBeDefined();
      expect(typeof securityModule.buildCSP).toBe('function');
    });

    it('should export withCSPHeaders function', () => {
      expect(securityModule.withCSPHeaders).toBeDefined();
      expect(typeof securityModule.withCSPHeaders).toBe('function');
    });
  });

  describe('Sanitization exports', () => {
    it('should export sanitizeInput function', () => {
      expect(securityModule.sanitizeInput).toBeDefined();
      expect(typeof securityModule.sanitizeInput).toBe('function');
    });

    it('should export parseAndSanitizeJson function', () => {
      expect(securityModule.parseAndSanitizeJson).toBeDefined();
      expect(typeof securityModule.parseAndSanitizeJson).toBe('function');
    });
  });

  describe('Functional integration', () => {
    it('should create a working nonce from exported createNonce', () => {
      const nonce = securityModule.createNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should build a CSP string from exported buildCSP', () => {
      const testNonce = 'test-nonce-123';
      const csp = securityModule.buildCSP(testNonce);

      expect(typeof csp).toBe('string');
      expect(csp).toContain(`'nonce-${testNonce}'`);
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
    });

    it('should sanitize input from exported sanitizeInput', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello world';
      const sanitized = securityModule.sanitizeInput(maliciousInput);

      expect(typeof sanitized).toBe('string');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello world');
    });
  });

  describe('Export consistency', () => {
    it('should not export CSRF helpers as mentioned in comment', () => {
      // Check that CSRF-related exports are not present
      expect(securityModule).not.toHaveProperty('defaultCsrfConfig');
      expect(securityModule).not.toHaveProperty('pathIsProtected');
      expect(securityModule).not.toHaveProperty('useCsrf');
    });

    it('should have all expected exports and no unexpected ones', () => {
      const expectedExports = [
        'NONCE_HEADER',
        'createNonce',
        'buildCSP',
        'withCSPHeaders',
        'sanitizeInput',
        'parseAndSanitizeJson',
      ];

      const actualExports = Object.keys(securityModule);

      // Check that all expected exports are present
      expectedExports.forEach((exportName) => {
        expect(actualExports).toContain(exportName);
      });

      // Check that we don't have unexpected exports
      expect(actualExports).toHaveLength(expectedExports.length);
    });
  });

  describe('Type safety', () => {
    it('should export functions with correct signatures', () => {
      // Test that functions can be called with expected parameters
      expect(() => securityModule.createNonce()).not.toThrow();
      expect(() => securityModule.buildCSP('test-nonce')).not.toThrow();
      expect(() => securityModule.sanitizeInput('test string')).not.toThrow();

      // Test that NONCE_HEADER is a string constant
      expect(typeof securityModule.NONCE_HEADER).toBe('string');
      expect(securityModule.NONCE_HEADER).toBe('x-nonce');
    });
  });
});
