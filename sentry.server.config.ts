// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://22fed432630274c1b5547b07c07b8d01@o4508840267612160.ingest.de.sentry.io/4509899911987280',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate:
    process.env.NODE_ENV === 'test'
      ? 0
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Disable Sentry in test environments to prevent network calls
  enabled: process.env.NODE_ENV !== 'test',
});
