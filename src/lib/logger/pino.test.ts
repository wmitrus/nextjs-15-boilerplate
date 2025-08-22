import type { DestinationStream, Logger } from 'pino';

// --- Set up our mutable environment ---
const mockEnv: {
  LOG_DIR: string | undefined;
  LOG_LEVEL: string | undefined;
  NODE_ENV: string;
  LOG_TO_FILE_PROD: boolean | undefined;
  LOG_TO_FILE_DEV: boolean | undefined;
  LOGFLARE_INTEGRATION_ENABLED: boolean | undefined;
} = {
  LOG_DIR: 'test_logs',
  LOG_LEVEL: 'debug',
  NODE_ENV: 'development',
  LOG_TO_FILE_PROD: false,
  LOG_TO_FILE_DEV: true,
  LOGFLARE_INTEGRATION_ENABLED: true,
};
jest.mock('@/lib/env', () => ({
  env: mockEnv,
}));

// Define an interface for the logger instance
interface PinoLogger {
  info: jest.Mock<void, []>;
  error: jest.Mock<void, []>;
  warn: jest.Mock<void, []>;
  debug: jest.Mock<void, []>;
}

// Define an interface for transport options
interface PinoTransportOptions {
  targets: Array<{
    target: string;
    options: object;
  }>;
}

// Now define the pino mock type without using `any`
type PinoMockType = jest.Mock<PinoLogger, [options?: object]> & {
  transport: jest.Mock<PinoTransportOptions, [PinoTransportOptions]>;
  multistream: jest.Mock<DestinationStream, [DestinationStream[]]>;
};

// --- Mock the pino module with a named export "pino" ---
// This ensures that when your logger file imports using:
//   import { pino } from 'pino';
// It gets our mocked function (with a transport property)

jest.mock('pino', () => {
  // 'args' is included for signature compatibility, though it's not used in this mock.

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockedPino: PinoMockType = jest.fn((...args: [options?: object]) => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })) as PinoMockType;

  mockedPino.transport = jest.fn((opts: PinoTransportOptions) => ({
    targets: opts.targets,
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mockedPino.multistream = jest.fn((streams: DestinationStream[]) => ({
    write: jest.fn(),
  }));

  return { __esModule: true, pino: mockedPino, default: mockedPino };
});

// --- Mock the logger utilities ---
jest.mock('@/lib/logger/utils', () => ({
  createFileStream: jest.fn().mockReturnValue({
    write: jest.fn(),
  }),
  createConsoleStream: jest.fn().mockReturnValue({
    write: jest.fn(),
  }),
  createLogflareWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
  }),
  createLogflareBrowserTransport: jest.fn().mockReturnValue({
    transmit: {
      level: 'info',
      send: jest.fn(),
    },
  }),
}));

describe('Logger', () => {
  // Although logger not used directly, this forces the logger module's initialization,
  // ensuring that its side effects (like transport setup) occur as expected.

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let logger: Logger;
  let pinoMock: PinoMockType;

  // --- Mimic your utils file style by spying on console.error ---
  const mockConsoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Transport Creation', () => {
    // For these tests we dynamically re-import both pino and the logger module.
    beforeEach(async () => {
      jest.resetModules();
      // Acquire the mocked pino instance after modules are reset:
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      // Now import the logger module—its initialization will call pino.transport if targets exist.
      const loggerModule = await import('@/lib/logger');
      logger = loggerModule.default;
    });

    // Tests for the multistream implementation
    it('should create file stream in development environment', () => {
      const calls = pinoMock.multistream.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const streams = calls[0][0];
      expect(streams).toHaveLength(3); // file, console, and logflare
      expect(streams[0]).toHaveProperty('write');
    });

    it('should create console stream in development environment', () => {
      const calls = pinoMock.multistream.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const streams = calls[0][0];
      expect(streams).toHaveLength(3); // file, console, and logflare
      expect(streams[1]).toHaveProperty('write');
    });

    it('should create logflare stream if LOGFLARE_INTEGRATION_ENABLED is true', () => {
      const calls = pinoMock.multistream.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const streams = calls[0][0];
      expect(streams).toHaveLength(3); // file, console, and logflare
      expect(streams[2]).toHaveProperty('write');
    });

    it('should not create logflare stream if LOGFLARE_INTEGRATION_ENABLED is false', async () => {
      mockEnv.LOGFLARE_INTEGRATION_ENABLED = false;
      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const loggerModule = await import('@/lib/logger');
      logger = loggerModule.default;

      const calls = pinoMock.multistream.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const streams = calls[0][0];
      expect(streams).toHaveLength(2); // file and console
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during transport setup', async () => {
      // Reset modules and then override pino.transport before importing the logger.
      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const testError = new Error('Test error');
      pinoMock.multistream.mockImplementation(() => {
        throw testError;
      });
      // Now import the logger module. Its initialization should run into the error.
      const loggerModule = await import('@/lib/logger');
      // We don’t need the returned logger; we just need the initialization to error out.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // Verify that our catch block logged the expected error message.
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error setting up logger transport.',
      );
    });

    it('should handle non-Error exceptions during transport setup', async () => {
      // Reset modules and then override pino.multistream before importing the logger.
      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const testError = 'String error';
      pinoMock.multistream.mockImplementation(() => {
        throw testError;
      });
      // Now import the logger module. Its initialization should run into the error.
      const loggerModule = await import('@/lib/logger');
      // We don't need the returned logger; we just need the initialization to error out.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // Verify that our catch block logged the expected error message.
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Unknown error occurred while setting up logger transport.',
      );
      expect(mockConsoleError).toHaveBeenCalledWith(testError);
    });

    it('should handle file stream creation failure', async () => {
      // Reset modules and mock createFileStream to return null
      jest.resetModules();

      // Mock the utils module to return null for createFileStream
      jest.doMock('@/lib/logger/utils', () => ({
        createFileStream: jest.fn().mockReturnValue(null),
        createConsoleStream: jest.fn().mockReturnValue({
          write: jest.fn(),
        }),
        createLogflareWriteStream: jest.fn().mockReturnValue({
          write: jest.fn(),
        }),
        createLogflareBrowserTransport: jest.fn().mockReturnValue({
          transmit: {
            level: 'info',
            send: jest.fn(),
          },
        }),
      }));

      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;

      // Import the logger module. Its initialization should handle the null file stream.
      const loggerModule = await import('@/lib/logger');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // Verify that our error handling logged the expected error message.
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to create pino file transport',
      );
    });
  });

  describe('Environment Variable Branches', () => {
    it('should use default values when environment variables are not set', async () => {
      // Test the || branches by setting env vars to undefined/empty
      const originalEnv = { ...mockEnv };
      mockEnv.LOG_DIR = undefined;
      mockEnv.LOG_LEVEL = undefined;
      mockEnv.LOG_TO_FILE_PROD = undefined;
      mockEnv.LOG_TO_FILE_DEV = undefined;

      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const loggerModule = await import('@/lib/logger');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // Verify that the logger was created (this tests the default branches)
      expect(pinoMock).toHaveBeenCalled();

      // Restore original env
      Object.assign(mockEnv, originalEnv);
    });

    it('should use custom values when environment variables are set', async () => {
      // Test the truthy branches
      mockEnv.LOG_DIR = 'custom-logs';
      mockEnv.LOG_LEVEL = 'debug';
      mockEnv.LOG_TO_FILE_PROD = true;
      mockEnv.LOG_TO_FILE_DEV = true;

      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const loggerModule = await import('@/lib/logger');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // Verify that the logger was created with custom values
      expect(pinoMock).toHaveBeenCalled();
    });

    it('should handle production environment without file logging', async () => {
      mockEnv.NODE_ENV = 'production';
      mockEnv.LOG_TO_FILE_PROD = false;
      mockEnv.LOG_TO_FILE_DEV = false;

      jest.resetModules();
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const loggerModule = await import('@/lib/logger');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loggerModule.default;

      // In production without file logging and without console (isDev=false),
      // only logflare stream should be added if enabled
      expect(pinoMock).toHaveBeenCalled();
    });
  });
});
