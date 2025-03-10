import fs from 'fs';
import path from 'path';

import * as utils from './utils';

// Mock only the 'fs' module
jest.mock('fs');

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
});
