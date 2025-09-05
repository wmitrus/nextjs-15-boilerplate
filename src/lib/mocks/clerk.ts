/**
 * Clerk API mocks for testing
 * This file provides comprehensive mocks for Clerk's authentication system
 */

import { http, HttpResponse } from 'msw';

// Mock user data for testing
export const mockClerkUser = {
  id: 'user_test123',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email_addresses: [
    {
      id: 'email_test123',
      email_address: 'test@example.com',
      verification: {
        status: 'verified',
        strategy: 'email_code',
      },
    },
  ],
  phone_numbers: [],
  web3_wallets: [],
  external_accounts: [],
  public_metadata: {},
  private_metadata: {},
  unsafe_metadata: {},
  created_at: Date.now() - 86400000, // 1 day ago
  updated_at: Date.now(),
  last_sign_in_at: Date.now() - 3600000, // 1 hour ago
};

// Mock session data for testing
export const mockClerkSession = {
  object: 'session',
  id: 'sess_test123',
  status: 'active',
  user_id: 'user_test123',
  created_at: Date.now() - 3600000, // 1 hour ago
  updated_at: Date.now(),
  expire_at: Date.now() + 3600000, // 1 hour from now
  abandon_at: Date.now() + 7200000, // 2 hours from now
};

// Mock client data for testing
export const mockClerkClient = {
  object: 'client',
  id: 'client_test123',
  sessions: [
    {
      ...mockClerkSession,
      user: mockClerkUser,
    },
  ],
  sign_in: null,
  sign_up: null,
  last_active_session_id: 'sess_test123',
};

/**
 * Clerk API handlers for MSW
 */
export const clerkHandlers = [
  // Mock Clerk's session endpoint
  http.get('https://api.clerk.dev/v1/sessions/:sessionId', ({ params }) => {
    const { sessionId } = params;

    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(
        {
          ...mockClerkSession,
          id: sessionId,
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's user endpoint
  http.get('https://api.clerk.dev/v1/users/:userId', ({ params }) => {
    const { userId } = params;

    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(
        {
          ...mockClerkUser,
          id: userId,
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's JWT verification endpoint (JWKS)
  http.get('https://api.clerk.dev/v1/jwks', () => {
    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(
        {
          keys: [
            {
              kty: 'RSA',
              use: 'sig',
              kid: 'test-key-id',
              n: 'test-modulus',
              e: 'AQAB',
              alg: 'RS256',
            },
          ],
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's client-side API calls
  http.get('https://api.clerk.dev/v1/client', () => {
    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(mockClerkClient, { status: 200 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's environment endpoint
  http.get('https://api.clerk.dev/v1/environment', () => {
    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(
        {
          object: 'environment',
          id: 'env_test123',
          auth_config: {
            identification_strategies: ['email_address'],
            identification_requirements: ['email_address'],
            first_factors: ['email_code', 'password'],
            second_factors: [],
          },
          user_settings: {
            attributes: {
              email_address: {
                enabled: true,
                required: true,
              },
              phone_number: {
                enabled: false,
                required: false,
              },
            },
          },
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's session verification endpoint
  http.post(
    'https://api.clerk.dev/v1/sessions/:sessionId/verify',
    ({ params }) => {
      const { sessionId } = params;

      if (process.env.NODE_ENV === 'test') {
        return HttpResponse.json(
          {
            ...mockClerkSession,
            id: sessionId,
            status: 'active',
          },
          { status: 200 },
        );
      }

      return new HttpResponse(null, { status: 404 });
    },
  ),

  // Mock Clerk's token verification endpoint
  http.post(
    'https://api.clerk.dev/v1/sessions/:sessionId/tokens/:template',
    ({ params }) => {
      const { sessionId, template } = params;

      if (process.env.NODE_ENV === 'test') {
        return HttpResponse.json(
          {
            object: 'token',
            jwt: 'mock.jwt.token',
            session_id: sessionId,
            template: template,
          },
          { status: 200 },
        );
      }

      return new HttpResponse(null, { status: 404 });
    },
  ),

  // Mock Clerk's webhook verification endpoint
  http.post('https://api.clerk.dev/v1/webhooks/verify', () => {
    if (process.env.NODE_ENV === 'test') {
      return HttpResponse.json(
        {
          verified: true,
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Catch-all for any other Clerk API calls
  http.get('https://api.clerk.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MSW] Intercepted Clerk API GET request:', request.url);
      return HttpResponse.json(
        {
          message: 'Mocked Clerk API response',
          url: request.url,
          method: 'GET',
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.post('https://api.clerk.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MSW] Intercepted Clerk API POST request:', request.url);
      return HttpResponse.json(
        {
          message: 'Mocked Clerk API response',
          url: request.url,
          method: 'POST',
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.put('https://api.clerk.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MSW] Intercepted Clerk API PUT request:', request.url);
      return HttpResponse.json(
        {
          message: 'Mocked Clerk API response',
          url: request.url,
          method: 'PUT',
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('https://api.clerk.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MSW] Intercepted Clerk API DELETE request:', request.url);
      return HttpResponse.json(
        {
          message: 'Mocked Clerk API response',
          url: request.url,
          method: 'DELETE',
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // Mock Clerk's frontend API (clerk.accounts.dev)
  http.get('https://*.clerk.accounts.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MSW] Intercepted Clerk frontend API request:', request.url);
      return HttpResponse.json(
        {
          message: 'Mocked Clerk frontend API response',
          url: request.url,
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.post('https://*.clerk.accounts.dev/*', ({ request }) => {
    if (process.env.NODE_ENV === 'test') {
      console.log(
        '[MSW] Intercepted Clerk frontend API POST request:',
        request.url,
      );
      return HttpResponse.json(
        {
          message: 'Mocked Clerk frontend API response',
          url: request.url,
        },
        { status: 200 },
      );
    }

    return new HttpResponse(null, { status: 404 });
  }),
];
