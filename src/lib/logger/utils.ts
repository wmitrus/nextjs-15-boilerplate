import fs from 'fs';
import path from 'path';
import { TransportTargetOptions } from 'pino';

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
