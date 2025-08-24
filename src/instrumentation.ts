import * as Sentry from '@sentry/nextjs';

export async function register() {
  const unmocked = [
    'localhost:3000',
    'sentry.io',
    'googleapis.com',
    'gstatic.com',
    'github.com/mona.png',
    'collector.eu01.nr-data.net',
  ];

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    } else if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }
    // MSW INSTRUMENTATION
    const { server } = await import('./lib/mocks/server');
    server.listen({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url);
        if (unmocked.some((host) => url.hostname.includes(host))) {
          return;
        }

        // Print the regular MSW unhandled request warning otherwise.
        print.warning();
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
