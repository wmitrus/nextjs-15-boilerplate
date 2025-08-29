// Client-safe logger for browser usage
// This avoids Node.js dependencies that can't run in the browser

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

class ClientLogger {
  private prefix = '[CLIENT]';

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.prefix} ${timestamp} ${level.toUpperCase()}: ${message}`;
  }

  info(message: string): void {
    console.info(this.formatMessage('info', message));
  }

  error(message: string): void {
    console.error(this.formatMessage('error', message));
  }

  warn(message: string): void {
    console.warn(this.formatMessage('warn', message));
  }

  debug(message: string): void {
    console.debug(this.formatMessage('debug', message));
  }
}

const clientLogger = new ClientLogger();

export default clientLogger;
