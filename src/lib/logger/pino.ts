import path from 'path';
import { pino, DestinationStream, type Logger, type LoggerOptions } from 'pino';

import { env } from '@/lib/env';
import {
  createLogflareBrowserTransport,
  createLogflareWriteStream,
  createConsoleStream,
  createFileStream,
} from '@/lib/logger/utils';

// isDev constant is used to select proper transports for different environments
const LOG_DIR = env.LOG_DIR || 'logs';
const LOG_LEVEL = env.LOG_LEVEL || 'info';
const isDev = env.NODE_ENV === 'development';

const LOG_TO_FILE_PROD = env.LOG_TO_FILE_PROD || false;
const LOG_TO_FILE_DEV = env.LOG_TO_FILE_DEV || false;

const targets: DestinationStream[] = [];

if (LOG_TO_FILE_PROD || LOG_TO_FILE_DEV) {
  const logFile = path.join(process.cwd(), LOG_DIR, 'server.log');
  const fileTarget = createFileStream(logFile, LOG_DIR);
  if (fileTarget) {
    targets.push(fileTarget);
  } else {
    console.error('Failed to create pino file transport');
  }
}

if (isDev) {
  targets.push(createConsoleStream());
}

// Common logger options
const options: LoggerOptions = {
  level: LOG_LEVEL,
  browser: createLogflareBrowserTransport(),
  base: {
    env: process.env.VERCEL_ENV || process.env.NODE_ENV,
    revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
  },
};

if (env.LOGFLARE_INTEGRATION_ENABLED) {
  targets.push(createLogflareWriteStream());
}

let transport;
// if there will be no targets, following logger will be used
let logger: Logger = pino({ level: 'info' });

if (targets.length > 0) {
  try {
    transport = pino.multistream(targets);
    logger = pino(options, transport);
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error setting up logger transport.');
      console.error(err);
    } else {
      console.error(
        'Unknown error occurred while setting up logger transport.',
      );
      console.error(err);
    }
  }
}

export default logger;
