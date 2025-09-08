import '@testing-library/jest-dom';
import { matchers } from 'jest-json-schema';

expect.extend(matchers);

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
