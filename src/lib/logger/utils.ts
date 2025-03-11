import fs from 'fs';
import path from 'path';
import { TransportTargetOptions, DestinationStream } from 'pino';
import { logflarePinoVercel } from 'pino-logflare';

import { env } from '@/lib/env';

export function ensureLogDirectory(logDir: string): boolean {
  const logDirectory = path.join(process.cwd(), logDir);
  if (!fs.existsSync(logDirectory)) {
    try {
      fs.mkdirSync(logDirectory);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error setting up log directory:', err.message);
        console.error(err);
      } else {
        console.error('Unknown error occurred while setting up log directory.');
        console.error(err);
      }
      return false;
    }
  }
  return true;
}

export function createFileTransport(
  logFile: string,
  logDir: string,
): TransportTargetOptions | null {
  if (!ensureLogDirectory(logDir)) {
    return null;
  }

  return {
    target: 'pino/file',
    options: {
      destination: logFile,
      mkdir: true,
    },
  };
}

export function createConsoleTransport(): TransportTargetOptions {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true, // Enables color in logs
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export function createLogflareTransport(): DestinationStream {
  const { stream } = logflarePinoVercel({
    apiKey: env.LOGFLARE_API_KEY,
    sourceToken: env.LOGFLARE_SOURCE_TOKEN,
  });

  return stream;
}

export function createLogflareBrowserTransport() {
  const { send } = logflarePinoVercel({
    apiKey: env.LOGFLARE_API_KEY,
    sourceToken: env.LOGFLARE_SOURCE_TOKEN,
  });

  const stream = {
    transmit: {
      level: 'info',
      send: send,
    },
  };

  return stream;
}
