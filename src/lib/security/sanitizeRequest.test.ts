import { NextRequest } from 'next/server';

import { parseAndSanitizeJson } from './sanitizeRequest';

// Helper to create a NextRequest with specific body and headers
const createJsonRequest = (
  body: string,
  contentType: string = 'application/json',
) => {
  const url = 'https://example.com/api/test';
  const request = new NextRequest(url, {
    method: 'POST',
    body,
    headers: {
      'content-type': contentType,
    },
  });
  return request;
};

// Helper to create a NextRequest without content-type header
const createRequestWithoutContentType = (body: string) => {
  const url = 'https://example.com/api/test';
  const request = new NextRequest(url, {
    method: 'POST',
    body,
  });
  return request;
};

describe('parseAndSanitizeJson', () => {
  describe('Basic functionality', () => {
    it('should parse and return valid JSON objects', async () => {
      const testData = { name: 'John', age: 25 };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual(testData);
    });

    it('should sanitize string values in JSON', async () => {
      const testData = {
        message: '<script>alert("XSS")</script>Hello World',
        description: 'Safe text',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        message: 'Hello World',
        description: 'Safe text',
      });
    });

    it('should handle numbers and booleans unchanged', async () => {
      const testData = {
        count: 42,
        enabled: true,
        temperature: -15.5,
        active: false,
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual(testData);
    });

    it('should handle null and undefined values', async () => {
      const testData = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        nullValue: null,
        emptyString: '',
      });
    });
  });

  describe('Content-Type handling', () => {
    it('should return empty object when content-type is not application/json', async () => {
      const testData = { message: 'Hello World' };
      const request = createJsonRequest(JSON.stringify(testData), 'text/plain');

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({});
    });

    it('should handle application/json with charset', async () => {
      const testData = { message: 'Hello World' };
      const request = createJsonRequest(
        JSON.stringify(testData),
        'application/json; charset=utf-8',
      );

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual(testData);
    });

    it('should return empty object when content-type header is missing', async () => {
      const testData = { message: 'Hello World' };
      const request = createRequestWithoutContentType(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({});
    });

    it('should handle case-sensitive content-type matching', async () => {
      const testData = { message: 'Hello World' };
      const request = createJsonRequest(
        JSON.stringify(testData),
        'APPLICATION/JSON',
      );

      const result = await parseAndSanitizeJson(request);

      // Case-sensitive matching - should return empty object
      expect(result).toEqual({});
    });
  });

  describe('Invalid JSON handling', () => {
    it('should return null for malformed JSON', async () => {
      const request = createJsonRequest('{ invalid json }');

      const result = await parseAndSanitizeJson(request);

      expect(result).toBeNull();
    });

    it('should return null for incomplete JSON', async () => {
      const request = createJsonRequest('{ "name": "John"');

      const result = await parseAndSanitizeJson(request);

      expect(result).toBeNull();
    });

    it('should return null for empty body', async () => {
      const request = createJsonRequest('');

      const result = await parseAndSanitizeJson(request);

      expect(result).toBeNull();
    });

    it('should return null for non-JSON content', async () => {
      const request = createJsonRequest('Hello World');

      const result = await parseAndSanitizeJson(request);

      expect(result).toBeNull();
    });
  });

  describe('Nested object sanitization', () => {
    it('should sanitize nested objects', async () => {
      const testData = {
        user: {
          name: '<script>alert("XSS")</script>John',
          profile: {
            bio: '<img src="x" onerror="alert(1)">Developer',
          },
        },
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        user: {
          name: 'John',
          profile: {
            bio: 'Developer',
          },
        },
      });
    });

    it('should handle deeply nested objects', async () => {
      const testData = {
        level1: {
          level2: {
            level3: {
              level4: {
                message: '<style>body{display:none}</style>Deep message',
              },
            },
          },
        },
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              level4: {
                message: 'Deep message',
              },
            },
          },
        },
      });
    });

    it('should handle mixed data types in nested objects', async () => {
      const testData = {
        data: {
          name: '<script>evil()</script>Clean name',
          count: 42,
          active: true,
          tags: ['<b>tag1</b>', 'tag2', '<i>tag3</i>'],
          metadata: null,
        },
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        data: {
          name: 'Clean name',
          count: 42,
          active: true,
          tags: ['tag1', 'tag2', 'tag3'],
          metadata: null,
        },
      });
    });
  });

  describe('Array sanitization', () => {
    it('should sanitize string arrays', async () => {
      const testData = {
        messages: [
          'Safe message',
          '<script>alert("XSS")</script>Dangerous message',
          '<p>HTML message</p>',
        ],
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        messages: ['Safe message', 'Dangerous message', 'HTML message'],
      });
    });

    it('should sanitize arrays of objects', async () => {
      const testData = {
        users: [
          { name: '<script>hack()</script>Alice', role: 'admin' },
          { name: 'Bob<style>evil</style>', role: 'user' },
        ],
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        users: [
          { name: 'Alice', role: 'admin' },
          { name: 'Bob', role: 'user' },
        ],
      });
    });

    it('should handle mixed arrays', async () => {
      const testData = {
        mixed: [
          'string<script>evil</script>',
          42,
          true,
          { nested: '<b>object</b>' },
          ['<i>nested</i>', 'array'],
        ],
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        mixed: ['string', 42, true, { nested: 'object' }, ['nested', 'array']],
      });
    });

    it('should handle empty arrays', async () => {
      const testData = {
        emptyArray: [],
        data: { nestedEmpty: [] },
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual(testData);
    });
  });

  describe('XSS prevention', () => {
    it('should prevent script tag injection', async () => {
      const testData = {
        content: 'Before<script>document.cookie="stolen"</script>After',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        content: 'BeforeAfter',
      });
    });

    it('should prevent style tag injection', async () => {
      const testData = {
        content: 'Before<style>body{display:none}</style>After',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        content: 'BeforeAfter',
      });
    });

    it('should prevent event handler injection', async () => {
      const testData = {
        content: '<img src="x" onerror="alert(\'XSS\')" />Content',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        content: 'Content',
      });
    });

    it('should prevent iframe injection', async () => {
      const testData = {
        content:
          '<iframe src="javascript:alert(\'XSS\')"></iframe>Safe content',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        content: 'Safe content',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very large JSON objects', async () => {
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `<script>alert(${i})</script>value${i}`;
      }
      const request = createJsonRequest(JSON.stringify(largeObject));

      const result = await parseAndSanitizeJson(request);

      expect(result).toBeDefined();
      expect(Object.keys(result as object)).toHaveLength(1000);
      expect((result as Record<string, string>).field0).toBe('value0');
      expect((result as Record<string, string>).field999).toBe('value999');
    });

    it('should handle complex nested structures', async () => {
      const complexData = {
        users: [
          {
            id: 1,
            name: '<script>evil()</script>John',
            addresses: [
              {
                type: 'home',
                street: '<b>123 Main St</b>',
                coordinates: { lat: 40.7128, lng: -74.006 },
              },
            ],
            preferences: {
              notifications: {
                email: true,
                sms: false,
                push: '<style>hack</style>enabled',
              },
            },
          },
        ],
      };
      const request = createJsonRequest(JSON.stringify(complexData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        users: [
          {
            id: 1,
            name: 'John',
            addresses: [
              {
                type: 'home',
                street: '123 Main St',
                coordinates: { lat: 40.7128, lng: -74.006 },
              },
            ],
            preferences: {
              notifications: {
                email: true,
                sms: false,
                push: 'enabled',
              },
            },
          },
        ],
      });
    });

    it('should handle arrays with null and undefined values', async () => {
      const testData = {
        items: ['valid<script>hack</script>', null, undefined, '', 0, false],
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        items: [
          'valid',
          null,
          null, // undefined becomes null in JSON
          '',
          0,
          false,
        ],
      });
    });

    it('should preserve HTML entities without decoding', async () => {
      const testData = {
        content: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson(request);

      expect(result).toEqual({
        content: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      });
    });
  });

  describe('TypeScript generic typing', () => {
    it('should work with typed interfaces', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const testData = {
        id: 1,
        name: '<script>alert("XSS")</script>John Doe',
        email: 'john@example.com',
      };
      const request = createJsonRequest(JSON.stringify(testData));

      const result = await parseAndSanitizeJson<User>(request);

      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should return proper types for empty object case', async () => {
      interface User {
        id: number;
        name: string;
      }

      const request = createJsonRequest('{"name": "John"}', 'text/plain');

      const result = await parseAndSanitizeJson<User>(request);

      expect(result).toEqual({});
    });
  });
});
