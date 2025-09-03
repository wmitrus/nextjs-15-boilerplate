import * as Sentry from '@sentry/nextjs';

export async function register() {
  const unmocked = [
    'localhost:3000',
    'localhost',
    '127.0.0.1:3000',
    '127.0.0.1',
    'sentry.io',
    'googleapis.com',
    'gstatic.com',
    'github.com/mona.png',
    'collector.eu01.nr-data.net',
    'telemetry.nextjs.org',
  ];

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize Sentry in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      await import('../sentry.server.config');
    }

    // Start MSW in Node.js runtime (including tests) for proper mocking
    // MSW INSTRUMENTATION
    const { server } = await import('./lib/mocks/server');
    server.listen({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url);

        // Skip warnings for unmocked hosts
        if (unmocked.some((host) => url.hostname.includes(host))) {
          return;
        }

        // Skip warnings for Next.js internal paths
        if (
          url.pathname.startsWith('/__nextjs') ||
          url.pathname.startsWith('/_next/')
        ) {
          return;
        }

        // Print the regular MSW unhandled request warning otherwise.
        print.warning();
      },
    });
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    // Only initialize Sentry in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      await import('../sentry.edge.config');
    }
  }
}

// Only export onRequestError if Sentry is enabled (non-test environments)
export const onRequestError =
  process.env.NODE_ENV !== 'test' ? Sentry.captureRequestError : undefined;
