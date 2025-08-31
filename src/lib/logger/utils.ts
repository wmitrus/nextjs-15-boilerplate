import fs from 'fs';
import path from 'path';
import { TransportTargetOptions, DestinationStream, destination } from 'pino';
import { logflarePinoVercel, createWriteStream } from 'pino-logflare';
import pretty, { PrettyStream } from 'pino-pretty';

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
  if (!env.LOGFLARE_API_KEY || !env.LOGFLARE_SOURCE_TOKEN) {
    throw new Error(
      'LOGFLARE_API_KEY and LOGFLARE_SOURCE_TOKEN must be set to use Logflare transport',
    );
  }

  const { stream } = logflarePinoVercel({
    apiKey: env.LOGFLARE_API_KEY,
    sourceToken: env.LOGFLARE_SOURCE_TOKEN,
  });

  return stream;
}

export function createLogflareWriteStream(): DestinationStream {
  if (!env.LOGFLARE_API_KEY || !env.LOGFLARE_SOURCE_TOKEN) {
    throw new Error(
      'LOGFLARE_API_KEY and LOGFLARE_SOURCE_TOKEN must be set to use Logflare write stream',
    );
  }

  const stream = createWriteStream({
    apiKey: env.LOGFLARE_API_KEY,
    sourceToken: env.LOGFLARE_SOURCE_TOKEN,
  });

  stream.on('error', (err: Error) => {
    console.error('Logflare stream error:', err);
  });

  return stream;
}

export function createLogflareBrowserTransport() {
  if (!env.LOGFLARE_API_KEY || !env.LOGFLARE_SOURCE_TOKEN) {
    throw new Error(
      'LOGFLARE_API_KEY and LOGFLARE_SOURCE_TOKEN must be set to use Logflare browser transport',
    );
  }

  const { send } = logflarePinoVercel({
    apiKey: env.LOGFLARE_API_KEY,
    sourceToken: env.LOGFLARE_SOURCE_TOKEN,
  });

  const stream = {
    transmit: {
      level: env.LOGFLARE_LOG_LEVEL,
      send: send,
    },
  };

  return stream;
}

// New method to create a console stream
export function createConsoleStream(): PrettyStream {
  return pretty({
    colorize: true, // Enables color in logs
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname',
  });
}

// New method to create a file stream using pino.destination
export function createFileStream(
  logFile: string,
  logDir: string,
): DestinationStream | null {
  if (!ensureLogDirectory(logDir)) {
    return null;
  }

  const stream = destination({ dest: logFile, mkdir: true });

  stream.on('error', (err: Error) => {
    console.error('File stream error:', err);
  });

  return stream;
}
