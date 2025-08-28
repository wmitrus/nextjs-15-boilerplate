/**
 * Jest configuration for integration tests
 * This configuration is separate from the main jest.config.ts
 * and is used specifically for running integration tests
 */

import nextJest from 'next/jest.js';

import type { Config } from 'jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

/** @type {import('jest').Config} */
const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@t3-oss/env-nextjs$': '<rootDir>/__mocks__/env.js',
  },

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jest-fixed-jsdom',

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/', // Use this pattern to ignore e2e tests
  ],

  // The glob patterns Jest uses to detect test files
  testMatch: ['<rootDir>/tests/integration/**/*.(spec|test).[jt]s?(x)'],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['/node_modules/(?!@t3-oss/env-nextjs)'],

  // Display name for the test suite
  displayName: {
    name: 'integration',
    color: 'blue',
  },
};

export default createJestConfig(config);
