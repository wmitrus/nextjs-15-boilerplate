import pino from 'pino';

// Browser/Edge compatible pino logger
// Don't import env module to avoid Node.js dependencies
const browserLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true,
    serialize: true,
  },
  base: {
    env: process.env.VERCEL_ENV || process.env.NODE_ENV,
    revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
  },
});

export default browserLogger;
