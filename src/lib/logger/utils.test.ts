import fs from 'fs';
import path from 'path';
import { destination } from 'pino';
import { logflarePinoVercel, createWriteStream } from 'pino-logflare';
import pretty, { PrettyStream } from 'pino-pretty';

import * as utils from './utils';

// Mock all external dependencies
jest.mock('fs');
jest.mock('pino');
jest.mock('pino-logflare');
jest.mock('pino-pretty');
jest.mock('@/lib/env', () => ({
  env: {
    LOGFLARE_API_KEY: 'test-api-key',
    LOGFLARE_SOURCE_TOKEN: 'test-source-token',
    LOGFLARE_LOG_LEVEL: 'info',
  },
}));

describe('Logger Utils', () => {
  // Spy on console.error for the whole suite.
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('ensureLogDirectory', () => {
    it('should create the log directory if it does not exist', () => {
      const logDir = 'test-logs';
      const logDirectory = path.join(process.cwd(), logDir);

      // Simulate that the directory does not exist.
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // Simulate successful directory creation.
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      const result = utils.ensureLogDirectory(logDir);

      expect(fs.existsSync).toHaveBeenCalledWith(logDirectory);
      expect(fs.mkdirSync).toHaveBeenCalledWith(logDirectory);
      expect(result).toBe(true);
    });

    it('should return true if the log directory already exists', () => {
      const logDir = 'test-logs';
      const logDirectory = path.join(process.cwd(), logDir);

      // Simulate that the directory exists.
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = utils.ensureLogDirectory(logDir);

      expect(fs.existsSync).toHaveBeenCalledWith(logDirectory);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if an error occurs while creating the log directory', () => {
      const logDir = 'test-logs';
      const logDirectory = path.join(process.cwd(), logDir);

      // Simulate that the directory does not exist.
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // Simulate an error during directory creation.
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = utils.ensureLogDirectory(logDir);

      expect(fs.existsSync).toHaveBeenCalledWith(logDirectory);
      expect(fs.mkdirSync).toHaveBeenCalledWith(logDirectory);
      expect(result).toBe(false);
    });

    it('should handle non-Error exceptions and log them', () => {
      const logDir = 'test-logs';
      const logDirectory = path.join(process.cwd(), logDir);

      // Simulate that the directory does not exist.
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // Simulate a non-Error exception during directory creation.
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      const result = utils.ensureLogDirectory(logDir);

      expect(fs.existsSync).toHaveBeenCalledWith(logDirectory);
      expect(fs.mkdirSync).toHaveBeenCalledWith(logDirectory);
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Unknown error occurred while setting up log directory.',
      );
      expect(mockConsoleError).toHaveBeenCalledWith('String error');
    });
  });

  describe('createFileTransport', () => {
    it('should return a valid TransportTargetOptions object if the log directory is created successfully', () => {
      const logFile = 'test-logs/server.log';
      const logDir = 'test-logs';

      // Simulate a success condition:
      // For example, pretend the directory already exists so that ensureLogDirectory returns true.
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // (Optional) For the case where it would try to create the directory,
      // you can also set up mkdirSync so that it does not throw.
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      const result = utils.createFileTransport(logFile, logDir);

      expect(result).toEqual({
        target: 'pino/file',
        options: {
          destination: logFile,
          mkdir: true,
        },
      });
    });

    it('should return null if the log directory cannot be created', () => {
      const logFile = 'test-logs/server.log';
      const logDir = 'test-logs';

      // Simulate that the directory does not exist and creation fails:
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = utils.createFileTransport(logFile, logDir);

      expect(result).toBeNull();
    });
  });

  describe('createConsoleTransport', () => {
    it('should return a valid TransportTargetOptions object for console transport', () => {
      const result = utils.createConsoleTransport();

      expect(result).toEqual({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      });
    });
  });

  describe('createLogflareTransport', () => {
    it('should create a Logflare transport stream', () => {
      const mockStream = { write: jest.fn() };
      (logflarePinoVercel as jest.Mock).mockReturnValue({
        stream: mockStream,
      });

      const result = utils.createLogflareTransport();

      expect(logflarePinoVercel).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        sourceToken: 'test-source-token',
      });
      expect(result).toBe(mockStream);
    });
  });

  describe('createLogflareWriteStream', () => {
    it('should create a Logflare write stream with error handling', () => {
      const mockStream = {
        on: jest.fn(),
        write: jest.fn(),
      };
      (createWriteStream as jest.Mock).mockReturnValue(mockStream);

      const result = utils.createLogflareWriteStream();

      expect(createWriteStream).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        sourceToken: 'test-source-token',
      });
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(result).toBe(mockStream);
    });

    it('should handle stream errors', () => {
      const mockStream = {
        on: jest.fn(),
        write: jest.fn(),
      };
      (createWriteStream as jest.Mock).mockReturnValue(mockStream);

      utils.createLogflareWriteStream();

      // Get the error handler function
      const errorHandler = (mockStream.on as jest.Mock).mock.calls[0][1];
      const testError = new Error('Stream error');

      // Call the error handler
      errorHandler(testError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Logflare stream error:',
        testError,
      );
    });
  });

  describe('createLogflareBrowserTransport', () => {
    it('should create a browser transport with transmit configuration', () => {
      const mockSend = jest.fn();
      (logflarePinoVercel as jest.Mock).mockReturnValue({
        send: mockSend,
      });

      const result = utils.createLogflareBrowserTransport();

      expect(logflarePinoVercel).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        sourceToken: 'test-source-token',
      });
      expect(result).toEqual({
        transmit: {
          level: 'info',
          send: mockSend,
        },
      });
    });
  });

  describe('createConsoleStream', () => {
    it('should create a pretty console stream', () => {
      const mockStream = {
        write: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
        pipe: jest.fn(),
        readable: true,
        writable: true,
      };
      const mockedPretty = jest.mocked(pretty);
      mockedPretty.mockReturnValue(mockStream as unknown as PrettyStream);

      const result = utils.createConsoleStream();

      expect(pretty).toHaveBeenCalledWith({
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      });
      expect(result).toBe(mockStream);
    });
  });

  describe('createFileStream', () => {
    it('should create a file stream if log directory is created successfully', () => {
      const logFile = 'test-logs/server.log';
      const logDir = 'test-logs';
      const mockStream = {
        on: jest.fn(),
        write: jest.fn(),
      };

      // Mock successful directory creation
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (destination as jest.Mock).mockReturnValue(mockStream);

      const result = utils.createFileStream(logFile, logDir);

      expect(destination).toHaveBeenCalledWith({
        dest: logFile,
        mkdir: true,
      });
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(result).toBe(mockStream);
    });

    it('should return null if log directory cannot be created', () => {
      const logFile = 'test-logs/server.log';
      const logDir = 'test-logs';

      // Mock failed directory creation
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = utils.createFileStream(logFile, logDir);

      expect(result).toBeNull();
      expect(destination).not.toHaveBeenCalled();
    });

    it('should handle file stream errors', () => {
      const logFile = 'test-logs/server.log';
      const logDir = 'test-logs';
      const mockStream = {
        on: jest.fn(),
        write: jest.fn(),
      };

      // Mock successful directory creation
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (destination as jest.Mock).mockReturnValue(mockStream);

      utils.createFileStream(logFile, logDir);

      // Get the error handler function
      const errorHandler = (mockStream.on as jest.Mock).mock.calls[0][1];
      const testError = new Error('File stream error');

      // Call the error handler
      errorHandler(testError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'File stream error:',
        testError,
      );
    });
  });
});
