import '@testing-library/jest-dom';
import { matchers } from 'jest-json-schema';

expect.extend(matchers);

// Polyfill Web Crypto API for tests (needed by @edge-csrf/core)
// try {
//   const { webcrypto } = require('crypto');
//   if (!globalThis.crypto || !(globalThis.crypto as any).subtle) {
//     globalThis.crypto = webcrypto as unknown as Crypto;
//   }
// } catch {
//   // ignore if crypto is unavailable in this environment
// }

// Silence noisy console warnings/errors during tests to avoid failing on expected logs
let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  warnSpy?.mockRestore();
  errorSpy?.mockRestore();
});
