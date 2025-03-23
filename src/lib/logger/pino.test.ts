/* eslint-disable jest/no-disabled-tests */
import type { DestinationStream, Logger } from 'pino';

// --- Set up our mutable environment ---
const mockEnv = {
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

    it.skip('should create file transport in development environment', () => {
      // Our logger file calls pino.transport({ targets }) when targets.length > 0.
      // Grab the first call's first argument (the options object) and inspect its targets.
      const calls = pinoMock.transport.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const targets = calls[0][0].targets;
      // We expect two transport targets: one for file and one for console.
      expect(targets).toHaveLength(2);
      expect(targets[0].target).toBe('pino/file');
    });

    it.skip('should create console transport in development environment', () => {
      const calls = pinoMock.transport.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const targets = calls[0][0].targets;
      expect(targets).toHaveLength(2);
      expect(targets[1].target).toBe('pino/console');
    });

    it.skip('should not create file transport if LOG_TO_FILE_DEV is false', async () => {
      // Adjust the mutable environment for this test:
      mockEnv.LOG_TO_FILE_DEV = false;
      jest.resetModules();
      // Re-import the modules:
      const pinoModule = await import('pino');
      pinoMock = pinoModule.pino as unknown as PinoMockType;
      const loggerModule = await import('@/lib/logger');
      logger = loggerModule.default;

      const calls = pinoMock.transport.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      const targets = calls[0][0].targets;
      // With file transport turned off, only console transport should be added.
      expect(targets).toHaveLength(1);
      expect(targets[0].target).toBe('pino/console');
    });

    // New tests for the updated implementation
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
  });
});
