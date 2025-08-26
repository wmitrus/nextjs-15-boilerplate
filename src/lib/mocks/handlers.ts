import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Logflare API endpoints
  http.post('https://api.logflare.app/logs', ({ request }) => {
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[MSW] Intercepted Logflare API request:', request.url);
    }

    // Return a successful response that matches Logflare's expected format
    return HttpResponse.json(
      {
        message: 'Logs received successfully',
        status: 'ok',
      },
      { status: 200 },
    );
  }),

  // Handle requests with query parameters (like your specific case)
  http.post('https://api.logflare.app/logs/*', ({ request }) => {
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[MSW] Intercepted Logflare API request with params:',
        request.url,
      );
    }

    return HttpResponse.json(
      {
        message: 'Logs received successfully',
        status: 'ok',
      },
      { status: 200 },
    );
  }),

  // Ignore Next.js internal requests during E2E tests
  http.post('*/__nextjs_original-stack-frames', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
