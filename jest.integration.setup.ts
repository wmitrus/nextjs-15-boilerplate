import '@testing-library/jest-dom';
import { matchers } from 'jest-json-schema';

import { server } from './src/lib/mocks/server';

expect.extend(matchers);

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());
