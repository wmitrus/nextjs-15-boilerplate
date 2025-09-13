// Jest setup file that runs before modules are loaded
// Polyfills for environments like jsdom

import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Ensure TextEncoder/TextDecoder exist

// if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder as any;

// if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder as any;

if (!(globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder) {
  (globalThis as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}

if (!(globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder) {
  (globalThis as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

// Ensure Web Crypto API is available with subtle.digest across common globals
const polyCrypto = webcrypto as unknown as Crypto;

// function applyCrypto(target: any) {
function applyCrypto(target: { crypto?: Crypto } & typeof globalThis): void {
  try {
    const current = target?.crypto;
    if (!current) {
      Object.defineProperty(target, 'crypto', {
        value: polyCrypto,
        configurable: true,
        writable: true,
        enumerable: true,
      });
      return;
    }
    // crypto exists; ensure subtle exists
    if (!current.subtle) {
      try {
        Object.defineProperty(current, 'subtle', {
          value: polyCrypto.subtle,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      } catch {
        try {
          // fallback assignment
          (current as Crypto & { subtle?: SubtleCrypto }).subtle =
            polyCrypto.subtle;
        } catch {
          // ignore
        }
      }
    }
    // Ensure getRandomValues exists too
    if (typeof current.getRandomValues !== 'function') {
      try {
        Object.defineProperty(current, 'getRandomValues', {
          value:
            polyCrypto.getRandomValues?.bind(polyCrypto) ||
            ((arr: Uint8Array) => polyCrypto.getRandomValues(arr)),
          configurable: true,
          writable: true,
          enumerable: true,
        });
      } catch {
        try {
          (
            current as Crypto & {
              getRandomValues?: typeof polyCrypto.getRandomValues;
            }
          ).getRandomValues = polyCrypto.getRandomValues.bind(polyCrypto);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore define failures
  }
}

// Apply to several possible global containers

applyCrypto(globalThis);

// if (typeof global !== 'undefined') applyCrypto(global as any);

// if (typeof window !== 'undefined') applyCrypto(window as any);

// if (typeof self !== 'undefined') applyCrypto(self as any);

if (typeof global !== 'undefined')
  applyCrypto(global as { crypto?: Crypto } & typeof global);
if (typeof window !== 'undefined')
  applyCrypto(window as { crypto?: Crypto } & typeof window);
if (typeof self !== 'undefined')
  applyCrypto(self as { crypto?: Crypto } & typeof self);
