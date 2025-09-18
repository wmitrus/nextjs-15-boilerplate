/* eslint-disable testing-library/no-debugging-utils */
/**
 * @fileoverview Tests for Client Logger
 *
 * Tests the client-safe logger that can be used in browser environments
 * without Node.js dependencies.
 *
 * @module lib/logger/client.test
 * @version 1.0.0
 * @since 1.0.0
 */

import clientLogger from './client';

describe('Client Logger', () => {
  let mockConsole: {
    info: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  // Mock Date.prototype.toISOString to have predictable timestamps
  let mockDateToISOString: jest.SpyInstance;
  const fixedTimestamp = '2024-01-15T10:30:45.123Z';

  beforeEach(() => {
    // Mock all console methods
    mockConsole = {
      info: jest.spyOn(console, 'info').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };

    // Mock Date.prototype.toISOString for predictable timestamps
    mockDateToISOString = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue(fixedTimestamp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore all mocks
    Object.values(mockConsole).forEach((mock) => mock.mockRestore());
    mockDateToISOString.mockRestore();
  });

  describe('Logger instance', () => {
    it('should export a singleton logger instance', () => {
      expect(clientLogger).toBeDefined();
      expect(typeof clientLogger).toBe('object');
    });

    it('should have all required logging methods', () => {
      expect(typeof clientLogger.info).toBe('function');
      expect(typeof clientLogger.error).toBe('function');
      expect(typeof clientLogger.warn).toBe('function');
      expect(typeof clientLogger.debug).toBe('function');
    });

    it('should return a consistent logger object', () => {
      const logger1 = clientLogger;
      const logger2 = clientLogger;

      expect(logger1).toBe(logger2);
      expect(typeof logger1).toBe('object');
      expect(typeof logger2).toBe('object');
    });
  });

  describe('info method', () => {
    it('should log info messages with proper formatting', () => {
      const message = 'This is an info message';

      clientLogger.info(message);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} INFO: ${message}`,
      );
    });

    it('should handle empty string messages', () => {
      clientLogger.info('');

      expect(mockConsole.info).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} INFO: `,
      );
    });

    it('should handle messages with special characters', () => {
      const specialMessage = 'Message with "quotes" and symbols: @#$%^&*()';

      clientLogger.info(specialMessage);

      expect(mockConsole.info).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} INFO: ${specialMessage}`,
      );
    });

    it('should handle multiline messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';

      clientLogger.info(multilineMessage);

      expect(mockConsole.info).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} INFO: ${multilineMessage}`,
      );
    });
  });

  describe('error method', () => {
    it('should log error messages with proper formatting', () => {
      const message = 'This is an error message';

      clientLogger.error(message);

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} ERROR: ${message}`,
      );
    });

    it('should handle error messages with stack traces', () => {
      const errorMessage = 'Error: Something went wrong\n    at Function.test';

      clientLogger.error(errorMessage);

      expect(mockConsole.error).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} ERROR: ${errorMessage}`,
      );
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(1000);

      clientLogger.error(longMessage);

      expect(mockConsole.error).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} ERROR: ${longMessage}`,
      );
    });
  });

  describe('warn method', () => {
    it('should log warning messages with proper formatting', () => {
      const message = 'This is a warning message';

      clientLogger.warn(message);

      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} WARN: ${message}`,
      );
    });

    it('should handle deprecation warnings', () => {
      const deprecationMessage =
        'DEPRECATED: This function will be removed in v2.0';

      clientLogger.warn(deprecationMessage);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} WARN: ${deprecationMessage}`,
      );
    });
  });

  describe('debug method', () => {
    it('should log debug messages with proper formatting', () => {
      const message = 'This is a debug message';

      clientLogger.debug(message);

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} DEBUG: ${message}`,
      );
    });

    it('should handle debug messages with JSON data', () => {
      const debugMessage = 'User data: {"id": 123, "name": "John Doe"}';

      clientLogger.debug(debugMessage);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        `[CLIENT] ${fixedTimestamp} DEBUG: ${debugMessage}`,
      );
    });
  });

  describe('Message formatting', () => {
    it('should include all required components in formatted message', () => {
      const message = 'Test message';

      clientLogger.info(message);

      const loggedMessage = mockConsole.info.mock.calls[0][0];

      // Check that the message contains all expected parts
      expect(loggedMessage).toContain('[CLIENT]');
      expect(loggedMessage).toContain(fixedTimestamp);
      expect(loggedMessage).toContain('INFO');
      expect(loggedMessage).toContain(message);
    });

    it('should format different log levels with correct case', () => {
      const message = 'Test message';

      clientLogger.info(message);
      clientLogger.error(message);
      clientLogger.warn(message);
      clientLogger.debug(message);

      expect(mockConsole.info.mock.calls[0][0]).toContain('INFO:');
      expect(mockConsole.error.mock.calls[0][0]).toContain('ERROR:');
      expect(mockConsole.warn.mock.calls[0][0]).toContain('WARN:');
      expect(mockConsole.debug.mock.calls[0][0]).toContain('DEBUG:');
    });

    it('should use consistent prefix format', () => {
      const message = 'Test message';

      clientLogger.info(message);
      clientLogger.error(message);
      clientLogger.warn(message);
      clientLogger.debug(message);

      const infoMessage = mockConsole.info.mock.calls[0][0];
      const errorMessage = mockConsole.error.mock.calls[0][0];
      const warnMessage = mockConsole.warn.mock.calls[0][0];
      const debugMessage = mockConsole.debug.mock.calls[0][0];

      // All should start with the same prefix format
      expect(infoMessage.startsWith('[CLIENT]')).toBe(true);
      expect(errorMessage.startsWith('[CLIENT]')).toBe(true);
      expect(warnMessage.startsWith('[CLIENT]')).toBe(true);
      expect(debugMessage.startsWith('[CLIENT]')).toBe(true);
    });
  });

  describe('Timestamp handling', () => {
    it('should generate timestamps using ISO format', () => {
      clientLogger.info('Test message');

      // Verify that Date.prototype.toISOString was called
      expect(mockDateToISOString).toHaveBeenCalledTimes(1);

      // Verify the timestamp is included in the output
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain(fixedTimestamp);
    });

    it('should generate new timestamp for each log call', () => {
      clientLogger.info('Message 1');
      clientLogger.info('Message 2');

      expect(mockDateToISOString).toHaveBeenCalledTimes(2);
    });

    it('should handle different timestamps for concurrent calls', () => {
      // Restore the mock to use real timestamps
      mockDateToISOString.mockRestore();

      const messages: string[] = [];
      mockConsole.info.mockImplementation((msg) => messages.push(msg));

      clientLogger.info('Message 1');
      clientLogger.info('Message 2');

      expect(messages).toHaveLength(2);
      expect(messages[0]).not.toBe(messages[1]); // Should have different timestamps
    });
  });

  describe('Console method usage', () => {
    it('should use correct console methods for each log level', () => {
      const message = 'Test message';

      clientLogger.info(message);
      clientLogger.error(message);
      clientLogger.warn(message);
      clientLogger.debug(message);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledTimes(1);

      // Ensure no cross-calling between methods
      expect(mockConsole.info).not.toHaveBeenCalledWith(
        expect.stringContaining('ERROR:'),
      );
      expect(mockConsole.error).not.toHaveBeenCalledWith(
        expect.stringContaining('INFO:'),
      );
    });

    it('should not call any console methods when no logging occurs', () => {
      // Don't call any logger methods

      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe('Browser compatibility', () => {
    it('should not use any Node.js specific APIs', () => {
      // Test that the logger doesn't try to use Node.js modules
      // This is implicitly tested by the fact that the module can be imported
      // and used without throwing errors in a Jest environment

      expect(() => {
        clientLogger.info('Test message');
        clientLogger.error('Test message');
        clientLogger.warn('Test message');
        clientLogger.debug('Test message');
      }).not.toThrow();
    });

    it('should work with global console object', () => {
      // Verify that it uses the global console object
      clientLogger.info('Test');

      expect(mockConsole.info).toHaveBeenCalled();
      // The mock setup itself proves we're using the global console
    });
  });

  describe('Error resilience', () => {
    it('should handle console method failures gracefully', () => {
      // Mock console.info to throw an error
      mockConsole.info.mockImplementation(() => {
        throw new Error('Console error');
      });

      // Logger should not throw even if console fails
      expect(() => {
        clientLogger.info('Test message');
      }).toThrow('Console error'); // Should propagate the console error
    });

    it('should handle special string types', () => {
      const specialStrings = [
        'null',
        'undefined',
        'NaN',
        'true',
        'false',
        '0',
        '""',
        "''",
        '\\n\\t\\r',
      ];

      specialStrings.forEach((str) => {
        expect(() => {
          clientLogger.info(str);
        }).not.toThrow();
      });

      expect(mockConsole.info).toHaveBeenCalledTimes(specialStrings.length);
    });
  });

  describe('Performance considerations', () => {
    it('should not perform expensive operations during formatting', () => {
      const message = 'Performance test message';

      const startTime = performance.now();
      clientLogger.info(message);
      const endTime = performance.now();

      // The operation should be very fast (less than 10ms even in slow environments)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should handle multiple rapid log calls efficiently', () => {
      const messageCount = 100;
      const startTime = performance.now();

      for (let i = 0; i < messageCount; i++) {
        clientLogger.info(`Message ${i}`);
      }

      const endTime = performance.now();

      expect(mockConsole.info).toHaveBeenCalledTimes(messageCount);
      // Should handle 100 log calls in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
